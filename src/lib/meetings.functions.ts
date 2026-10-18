import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getD1Database } from "@/lib/cloudflare-d1";
import { getAdminClient } from "@/integrations/supabase/admin";
import { getRequest } from "@tanstack/react-start/server";
import { supabase } from "@/integrations/supabase/client";
import { getOrSetCache, invalidateCache } from "@/lib/server-cache";
import { getEnv } from "@/lib/env";
import crypto from 'crypto';

function getRealtimeCredentials() {
  const accountId = getEnv("CLOUDFLARE_ACCOUNT_ID") || "a3566574bfc98346c9a06293c449f2f8";

  let appId = getEnv("CLOUDFLARE_REALTIME_APP_ID") || "669555ba-9904-43d4-8bcf-61263bd5bb2d";
  // Always normalize to the active RealtimeKit App ID (UUID format)
  if (!appId || appId === "02ba0189fe45ea7bb41046b4073780f8") {
    appId = "669555ba-9904-43d4-8bcf-61263bd5bb2d";
  }

  let apiToken = getEnv("CLOUDFLARE_REALTIME_API_TOKEN") || "";
  // Clean up if the token was accidentally pasted or concatenated multiple times
  if (apiToken.includes("cfat_") && apiToken.indexOf("cfat_", 1) !== -1) {
    apiToken = apiToken.slice(0, apiToken.indexOf("cfat_", 1));
  }

  return { accountId, appId, apiToken };
}

// Creates a new meeting room
export const createMeetingRoomFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    title: z.string(),
    maxParticipants: z.number().default(40),
    settings: z.object({
      muteOnEntry: z.boolean().default(false),
      disableCameras: z.boolean().default(false),
      recordingEnabled: z.boolean().default(false),
      type: z.enum(['internal', 'external']).default('internal'),
      password: z.string().optional(),
      allowedEmails: z.string().optional(), // Comma separated
      superHosts: z.string().optional(), // Comma separated
      hosts: z.string().optional(), // Comma separated
      scheduledFor: z.string().optional(), // ISO string
      target_type: z.enum(['all', 'intern', 'team']).default('all'),
      target_teams: z.array(z.string()).default([]),
      target_interns: z.array(z.string()).default([]),
    }).optional()
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { accountId, appId, apiToken } = getRealtimeCredentials();

    let roomId = `meet_${crypto.randomUUID()}`;

    // Call Cloudflare to create the meeting if credentials exist
    if (accountId && appId && apiToken) {
      try {
        const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/realtime/kit/${appId}/meetings`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            title: data.title
          })
        });

        if (response.ok) {
          const cfData = await response.json() as any;
          if (cfData.data?.id) {
            roomId = cfData.data.id;
          }
        } else {
          const errText = await response.text();
          console.warn("Cloudflare RealtimeKit meeting creation warning:", errText);
        }
      } catch (err) {
        console.warn("Cloudflare RealtimeKit fetch error:", err);
      }
    }

    const hostId = context.user.id;
    const settingsStr = JSON.stringify(data.settings || {});
    
    // 1. Try D1 if available
    const d1 = getD1Database(context);
    if (d1 && typeof d1.prepare === "function") {
      try {
        await d1.prepare(`
          INSERT INTO meet_rooms (id, title, host_id, status, max_participants, settings)
          VALUES (?, ?, ?, 'active', ?, ?)
        `).bind(
          roomId,
          data.title,
          hostId,
          data.maxParticipants,
          settingsStr
        ).run();
      } catch (e) {
        console.warn("D1 meet_rooms insert error:", e);
      }
    }

    // 2. Always persist to Supabase meet_rooms table
    const adminClient = getAdminClient();
    try {
      await adminClient.from('meet_rooms').upsert({
        id: roomId,
        title: data.title,
        host_id: hostId,
        status: 'active',
        max_participants: data.maxParticipants,
        settings: settingsStr,
        created_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn("Supabase meet_rooms upsert error:", e);
    }

    // 3. Mirror to Supabase meetings table so it shows up in intern dashboards!
    const meetingUrl = `https://vyntyraconsultancyservices.in/meet/${roomId}`;
    try {
      const descText = (data.settings?.type === 'external' 
        ? `External Meeting. Password: ${data.settings.password || 'None'}` 
        : 'Internal Secure Meeting') + ` __SETTINGS:${settingsStr}`;

      await adminClient.from('meetings').insert({
        title: data.title,
        meeting_link: meetingUrl,
        meeting_url: meetingUrl,
        scheduled_at: data.settings?.scheduledFor || new Date().toISOString(),
        target_role: (data.settings?.allowedEmails && data.settings.allowedEmails.trim() !== '') ? 'individual' : 'intern',
        send_email_notification: false,
        description: descText
      });
    } catch (e) {
      console.error("Failed to mirror meeting to Supabase:", e);
      // Non-fatal, let the meeting creation succeed
    }

    invalidateCache("active_meetings");
    return { roomId, title: data.title, url: meetingUrl };
  });

// Gets an active meeting token and config
export const getMeetingTokenFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({
    roomId: z.string(),
    password: z.string().optional(),
    guestName: z.string().optional(),
    authToken: z.string().optional()
  }).parse(d))
  .handler(async ({ data }) => {
    // 1. Manually resolve user auth (to allow unauthenticated external guests if password matches)
    const request = getRequest();
    const authHeader = request.headers.get('authorization');
    const token = data.authToken || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null);
    
    let userId: string | null = null;
    let userEmail: string | null = null;
    let userFullName: string | null = null;
    let userAvatarUrl: string | null = null;
    
    if (token) {
      try {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          userId = user.id;
          userEmail = user.email || null;
          
          try {
            const adminClient = getAdminClient();
            const { data: profile } = await adminClient.from('profiles').select('full_name, avatar_url').eq('id', user.id).single();
            if (profile?.full_name) {
              userFullName = profile.full_name;
            }
            if (profile?.avatar_url) {
              userAvatarUrl = profile.avatar_url;
            }
          } catch (e) {
            console.error("Failed to fetch user profile for RealtimeKit:", e);
          }
        }
      } catch (e) {
        console.warn("Supabase auth getUser error:", e);
      }
    }

    const d1 = getD1Database();

    // Verify room exists and is active
    let room: any = null;
    if (d1 && typeof d1.prepare === "function") {
      try {
        room = await d1.prepare(`
          SELECT * FROM meet_rooms WHERE id = ? AND status = 'active'
        `).bind(data.roomId).first() as any;
      } catch (e) {
        console.warn("D1 room query error:", e);
      }
    }

    // 1. Fallback to Supabase meet_rooms table
    if (!room) {
      const adminClient = getAdminClient();
      try {
        const { data: supaRoom } = await adminClient
          .from('meet_rooms')
          .select('*')
          .eq('id', data.roomId)
          .eq('status', 'active')
          .maybeSingle();
        if (supaRoom) {
          room = supaRoom;
        }
      } catch (e) {
        console.warn("Supabase meet_rooms query error:", e);
      }
    }

    // 2. Secondary fallback: Check meetings table by link, URL, or ID
    if (!room) {
      const adminClient = getAdminClient();
      try {
        const { data: supaMeet } = await adminClient
          .from('meetings')
          .select('*')
          .or(`meeting_link.ilike.%${data.roomId}%,meeting_url.ilike.%${data.roomId}%,id.eq.${data.roomId}`)
          .maybeSingle();
        if (supaMeet) {
          let parsedSettings: any = {
            type: supaMeet.description?.includes('External') ? 'external' : 'internal',
            password: supaMeet.description?.match(/Password:\s*([^\s,]+)/)?.[1] || ''
          };
          if (supaMeet.description && supaMeet.description.includes('__SETTINGS:')) {
            try {
              parsedSettings = JSON.parse(supaMeet.description.split('__SETTINGS:')[1]);
            } catch (_) {}
          }
          room = {
            id: data.roomId,
            title: supaMeet.title,
            host_id: supaMeet.host_id || supaMeet.target_user_id || 'host',
            status: 'active',
            settings: JSON.stringify(parsedSettings)
          };
        }
      } catch (e) {
        console.warn("Supabase meetings fallback query error:", e);
      }
    }

    // 3. Tertiary fallback: Verify directly against Cloudflare RealtimeKit API
    if (!room) {
      const { accountId, appId, apiToken } = getRealtimeCredentials();
      if (accountId && appId && apiToken) {
        try {
          const cfCheck = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/realtime/kit/${appId}/meetings/${data.roomId}`, {
            headers: { "Authorization": `Bearer ${apiToken}` }
          });
          if (cfCheck.ok) {
            const cfRoomData = await cfCheck.json() as any;
            room = {
              id: data.roomId,
              title: cfRoomData.data?.title || "Live Meeting",
              host_id: "host",
              status: "active",
              settings: JSON.stringify({ type: "internal" })
            };
          }
        } catch (_) {}
      }
    }

    if (!room) {
      throw new Error("Room not found or no longer active.");
    }

    const settings = room.settings ? JSON.parse(room.settings) : {};
    const isInternal = settings.type !== 'external';
    
    // Auth & Access Checks
    if (isInternal) {
      if (!userId || !userEmail) {
        throw new Error("AUTH_REQUIRED");
      }
      
      const allowedEmails = settings.allowedEmails ? settings.allowedEmails.split(',').map((e: string) => e.trim().toLowerCase()).filter(Boolean) : [];
      const superHosts = settings.superHosts ? settings.superHosts.split(',').map((e: string) => e.trim().toLowerCase()).filter(Boolean) : [];
      const hosts = settings.hosts ? settings.hosts.split(',').map((e: string) => e.trim().toLowerCase()).filter(Boolean) : [];
      
      const isCreator = room.host_id === userId;
      const isExplicitHost = superHosts.includes(userEmail.toLowerCase()) || hosts.includes(userEmail.toLowerCase());
      
      if (!isCreator && !isExplicitHost && allowedEmails.length > 0 && !allowedEmails.includes(userEmail.toLowerCase())) {
        throw new Error("ACCESS_DENIED_GUEST_LIST");
      }
    } else {
      // External Meeting: check password
      if (settings.password && settings.password.trim() !== '' && settings.password !== data.password) {
        throw new Error("INVALID_PASSWORD");
      }
    }

    // Role assignment
    const isCreator = room.host_id === userId;
    const isSuperHost = isCreator || (settings.superHosts && userEmail && settings.superHosts.toLowerCase().includes(userEmail.toLowerCase()));
    const isHost = isSuperHost || (settings.hosts && userEmail && settings.hosts.toLowerCase().includes(userEmail.toLowerCase()));

    const { accountId, appId, apiToken } = getRealtimeCredentials();

    if (!accountId || !appId || !apiToken) {
      throw new Error("Missing CLOUDFLARE_REALTIME_API_TOKEN in environment. Please ensure Cloudflare RealtimeKit credentials are configured.");
    }

    // Generate participant identity
    const participantName = userFullName || (userEmail ? userEmail.split('@')[0] : (data.guestName || "External Guest"));
    const participantId = userId || `guest_${crypto.randomUUID()}`;

    // Generate a secure JWT/token for Cloudflare RealtimeKit via Add Participant API
    let response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/realtime/kit/${appId}/meetings/${data.roomId}/participants`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: participantName,
        client_specific_id: participantId,
        preset_name: isHost ? "group_call_host" : "group_call_participant",
        metadata: {
          avatar_url: userAvatarUrl || null
        }
      })
    });

    // If custom preset is missing or invalid, retry with default preset
    if (!response.ok && response.status === 400) {
      response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/realtime/kit/${appId}/meetings/${data.roomId}/participants`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: participantName,
          client_specific_id: participantId
        })
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error("Cloudflare Add Participant error:", errText);
      throw new Error(`Failed to join Cloudflare RealtimeKit: ${errText}`);
    }

    const cfData = await response.json() as any;
    const meetingToken = cfData.data?.token;

    return {
      token: meetingToken,
      roomId: data.roomId,
      isHost,
      appId: appId,
      title: room.title as string
    };
  });

// Fetches active meetings for the dashboard with Role-Based Access Control
export const getActiveMeetingsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return getOrSetCache(`active_meetings_${context.user.id}`, 3000, async () => {
      const d1 = getD1Database(context);
      const adminClient = getAdminClient();
      
      let d1RoomsPromise: Promise<any> = Promise.resolve(null);
      if (d1 && typeof d1.prepare === "function") {
        d1RoomsPromise = d1.prepare("SELECT * FROM meet_rooms WHERE status = 'active' ORDER BY created_at DESC").all().catch(() => null);
      }

      // Parallelize profile, tasks, and room queries to optimize Worker CPU and latency
      const [{ data: roleData }, { data: userTasks }, d1Rooms] = await Promise.all([
        adminClient.from('profiles').select('role, email, department').eq('id', context.user.id).single(),
        adminClient.from('tasks').select('team_id, team_members, target_user_id, assigned_to'),
        d1RoomsPromise
      ]);

      const role = roleData?.role || 'intern';
      const email = roleData?.email?.toLowerCase() || '';
      const department = roleData?.department?.toLowerCase() || '';

      const userTeamIds = new Set<string>();
      for (const t of (userTasks || [])) {
        if (t.team_id) {
          if (t.assigned_to === context.user.id || t.target_user_id === context.user.id) {
            userTeamIds.add(t.team_id);
          } else if (Array.isArray(t.team_members) && t.team_members.some((m: any) => String(m) === context.user.id || String(m) === email)) {
            userTeamIds.add(t.team_id);
          }
        }
      }

      let results: any[] = d1Rooms?.results || [];

      // If D1 returned no results or is unavailable, load from Supabase meet_rooms table
      if (!results || results.length === 0) {
        try {
          const { data: supaRooms } = await adminClient
            .from('meet_rooms')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false });
          if (supaRooms && supaRooms.length > 0) {
            results = supaRooms;
          }
        } catch (e) {
          console.warn("Supabase meet_rooms select error:", e);
        }
      }

      // Also merge records from standard Supabase meetings table so ALL created meetings display seamlessly
      try {
        const { data: supaMeetings } = await adminClient
          .from('meetings')
          .select('*')
          .order('scheduled_at', { ascending: false })
          .limit(50);
        
        if (supaMeetings && supaMeetings.length > 0) {
          const existingIds = new Set(results.map((r: any) => r.id));
          for (const sm of supaMeetings) {
            const rawLink = sm.meeting_link || sm.meeting_url || '';
            const match = rawLink.match(/\/meet\/([a-zA-Z0-9_\-]+)/);
            const rId = match ? match[1] : (sm.id ? String(sm.id) : '');
            if (rId && !existingIds.has(rId)) {
              let parsedSettings: any = {
                type: sm.description?.includes('External') ? 'external' : 'internal',
                password: sm.description?.match(/Password:\s*([^\s,]+)/)?.[1] || '',
                scheduledFor: sm.scheduled_at,
                target_type: sm.target_role === 'individual' ? 'intern' : 'all'
              };
              if (sm.description && sm.description.includes('__SETTINGS:')) {
                try {
                  parsedSettings = JSON.parse(sm.description.split('__SETTINGS:')[1]);
                } catch (_) {}
              }
              results.push({
                id: rId,
                title: sm.title,
                host_id: sm.host_id || sm.target_user_id || 'Host',
                status: 'active',
                max_participants: 50,
                settings: JSON.stringify(parsedSettings),
                created_at: sm.created_at || sm.scheduled_at || new Date().toISOString()
              });
              existingIds.add(rId);
            }
          }
        }
      } catch (e) {
        console.warn("Supabase meetings fallback query error:", e);
      }

      const filtered = results.filter((room: any) => {
        // 1. Admins see all meetings
        if (role === 'admin' || role === 'super_admin') return true;
        
        const settings = room.settings ? JSON.parse(room.settings) : {};
        const targetType = settings.target_type || 'all';
        const targetTeams = settings.target_teams || [];
        const targetInterns = settings.target_interns || [];
        const allowedEmails = settings.allowedEmails ? settings.allowedEmails.split(',').map((e: string) => e.trim().toLowerCase()).filter(Boolean) : [];
        const superHosts = settings.superHosts ? settings.superHosts.split(',').map((e: string) => e.trim().toLowerCase()).filter(Boolean) : [];
        const hosts = settings.hosts ? settings.hosts.split(',').map((e: string) => e.trim().toLowerCase()).filter(Boolean) : [];

        // If user is explicit host, they can always see it
        if (room.host_id === context.user.id) return true;
        if (superHosts.includes(email) || hosts.includes(email)) return true;

        // 2. Target Checks
        if (targetType === 'intern') {
          if (!targetInterns.includes(context.user.id)) return false;
        } else if (targetType === 'team') {
          if (!targetTeams.some((tid: string) => userTeamIds.has(tid))) return false;
        }

        // 3. Employees see meetings they host, or internal meetings (if targeted to 'all' and no allowedEmails)
        if (role === 'employee') {
          if (settings.type === 'external') return false;
          return true;
        }
        
        // 4. Interns see company-wide meetings (all), or meetings assigned specifically to them
        if (role === 'intern') {
          if (allowedEmails.length > 0) {
            return allowedEmails.includes(email) || (department && allowedEmails.includes(department));
          }
          
          if (settings.type !== 'external') return true;
          
          return false;
        }

        return false;
      });

      return filtered as any[];
    });
  });

// Ends a meeting
export const endMeetingFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    roomId: z.string()
  }).parse(d))
  .handler(async ({ data, context }) => {
    const d1 = getD1Database(context);

    if (d1 && typeof d1.prepare === "function") {
      try {
        await d1.prepare(`
          UPDATE meet_rooms 
          SET status = 'ended', ended_at = CURRENT_TIMESTAMP
          WHERE id = ? 
        `).bind(data.roomId).run();
      } catch (e) {
        console.warn("D1 end meeting error:", e);
      }
    }

    const adminClient = getAdminClient();
    try {
      await adminClient
        .from('meet_rooms')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', data.roomId);
    } catch (e) {
      console.warn("Supabase meet_rooms end error:", e);
    }

    invalidateCache("active_meetings");
    return { success: true };
  });
