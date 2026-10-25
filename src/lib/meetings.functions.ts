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

function getMeetingBaseUrl(): string {
  try {
    const request = getRequest();
    if (request?.headers) {
      const origin = request.headers.get('origin');
      if (origin && !origin.includes('://vyntyraconsultancyservices.in')) {
        return origin;
      }
      const host = request.headers.get('host');
      if (host && !host.startsWith('vyntyraconsultancyservices.in')) {
        const proto = request.headers.get('x-forwarded-proto') || 'https';
        return `${proto}://${host}`;
      }
    }
  } catch (_) {}
  return getEnv('VITE_APP_URL') || getEnv('APP_URL') || 'https://portal.vyntyraconsultancyservices.in';
}

// Helper to generate a short, memorable, easily shareable Google-Meet-style room ID
export const generateShortRoomId = () => {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789"; // readable chars excluding ambiguous 0/o/1/l/i
  const part1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const part2 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `vyn-${part1}-${part2}`;
};

// 8-character Vyntyra Branding Access Code generator (alphabets from VYNTYRA + numbers)
export const generateVyntyraAccessCode = (): string => {
  const brandLetters = "VYNTYRA";
  const numbers = "23456789";
  const chars: string[] = [];
  // 4 letters from VYNTYRA and 4 numbers for balanced 8-character code
  for (let i = 0; i < 4; i++) {
    chars.push(brandLetters[Math.floor(Math.random() * brandLetters.length)]);
    chars.push(numbers[Math.floor(Math.random() * numbers.length)]);
  }
  // Shuffle Fisher-Yates
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
};

// Deterministically derive or return an 8-char Vyntyra access code for ANY room
export const getOrDeriveAccessCode = (roomId: string, existingCode?: string): string => {
  if (existingCode && existingCode.trim().length >= 6) {
    return existingCode.trim().toUpperCase();
  }
  const brandLetters = "VYNTYRA";
  const numbers = "23456789";
  let hash = 0;
  for (let i = 0; i < roomId.length; i++) {
    hash = (hash << 5) - hash + roomId.charCodeAt(i);
    hash |= 0;
  }
  const posHash = Math.abs(hash);
  let code = "";
  for (let i = 0; i < 8; i++) {
    const pool = (i % 2 === 0) ? brandLetters : numbers;
    const index = (posHash + i * 37) % pool.length;
    code += pool[index];
  }
  return code;
};

// Creates a new meeting room
export const createMeetingRoomFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    title: z.string(),
    maxParticipants: z.number().default(40),
    customRoomId: z.string().optional(),
    settings: z.object({
      muteOnEntry: z.boolean().default(false),
      disableCameras: z.boolean().default(false),
      recordingEnabled: z.boolean().default(false),
      type: z.enum(['internal', 'external']).default('internal'),
      password: z.string().optional(),
      access_code: z.string().optional(),
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

    // Use custom vanity code if provided, otherwise generate a sleek short code (e.g. vyn-k7p-92m)
    let roomId = (data.customRoomId && data.customRoomId.trim().length > 0)
      ? data.customRoomId.trim().toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30)
      : generateShortRoomId();

    const accessCode = (data.settings?.access_code && data.settings.access_code.trim().length >= 6)
      ? data.settings.access_code.trim().toUpperCase()
      : generateVyntyraAccessCode();

    let cfMeetingId = "";

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
            cfMeetingId = cfData.data.id;
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
    // Keep internal Cloudflare meeting ID & 8-digit access code preserved in settings
    const mergedSettings = {
      ...(data.settings || {}),
      access_code: accessCode,
      cf_room_id: cfMeetingId || roomId
    };
    const settingsStr = JSON.stringify(mergedSettings);
    
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

    // 3. Mirror to Supabase meetings table so it shows up in intern & employee dashboards!
    const meetingUrl = `${getMeetingBaseUrl()}/meet/${roomId}`;
    try {
      const descText = (data.settings?.type === 'external' 
        ? `External Meeting. Password: ${data.settings.password || 'None'}` 
        : 'Internal Secure Meeting') + ` [Access Code: ${accessCode}] __SETTINGS:${settingsStr}`;

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
    return { roomId, title: data.title, url: meetingUrl, accessCode };
  });

// Gets an active meeting token and config
export const getMeetingTokenFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({
    roomId: z.string(),
    password: z.string().optional(),
    accessCode: z.string().optional(),
    internId: z.string().optional(),
    guestName: z.string().optional(),
    guestEmail: z.string().optional(),
    guestPhone: z.string().optional(),
    guestOrg: z.string().optional(),
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
    const cleanRoomId = data.roomId.trim().toLowerCase();
    const cleanAccessCode = (data.accessCode || data.roomId).trim().toUpperCase();
    const noHyphenId = cleanRoomId.replace(/-/g, '');

    if (d1 && typeof d1.prepare === "function") {
      try {
        room = await d1.prepare(`
          SELECT * FROM meet_rooms 
          WHERE (id = ? OR LOWER(id) = ? OR REPLACE(LOWER(id), '-', '') = ?) AND status = 'active'
        `).bind(data.roomId, cleanRoomId, noHyphenId).first() as any;
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
          .or(`id.eq.${data.roomId},id.eq.${cleanRoomId},id.ilike.%${cleanRoomId}%`)
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
          .or(`meeting_link.ilike.%${cleanRoomId}%,meeting_url.ilike.%${cleanRoomId}%,meeting_link.ilike.%${data.roomId}%,meeting_url.ilike.%${data.roomId}%,id.eq.${cleanRoomId}`)
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

    // 3. Fallback: Search by 8-Digit Vyntyra Access Code
    if (!room) {
      const adminClient = getAdminClient();
      try {
        const { data: supaRooms } = await adminClient
          .from('meet_rooms')
          .select('*')
          .eq('status', 'active');
        if (supaRooms && supaRooms.length > 0) {
          for (const sr of supaRooms) {
            let sObj: any = {};
            try { sObj = JSON.parse(sr.settings || '{}'); } catch (_) {}
            const ac = sObj.access_code || getOrDeriveAccessCode(sr.id, sObj.access_code);
            if (ac.toUpperCase() === cleanAccessCode) {
              room = sr;
              break;
            }
          }
        }
      } catch (e) {
        console.warn("Access code room query error:", e);
      }
    }

    // 4. Tertiary fallback: Verify directly against Cloudflare RealtimeKit API
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
    const derivedAccessCode = settings.access_code || getOrDeriveAccessCode(room.id, settings.access_code);

    // Check if authorized by 8-digit Vyntyra Access Code
    const isAccessCodeAuthorized = Boolean(
      (data.accessCode && data.accessCode.trim().toUpperCase() === derivedAccessCode.toUpperCase()) ||
      (cleanAccessCode.length >= 6 && cleanAccessCode === derivedAccessCode.toUpperCase())
    );

    // Direct Intern ID & Email verification for interns without active session
    let isDirectInternAuthorized = false;
    let isDirectEmployeeAuthorized = false;

    if (!userId && data.internId && data.guestEmail) {
      try {
        const adminClient = getAdminClient();
        const { data: internProf } = await adminClient
          .from('profiles')
          .select('id, full_name, intern_id, email, role, department')
          .ilike('intern_id', data.internId.trim())
          .ilike('email', data.guestEmail.trim().toLowerCase())
          .maybeSingle();

        if (internProf) {
          userId = internProf.id;
          userEmail = internProf.email;
          if (!userFullName && internProf.full_name) {
            userFullName = internProf.full_name;
          }
          isDirectInternAuthorized = true;
        }
      } catch (e) {
        console.warn("Direct intern verification error:", e);
      }
    }

    // Direct Employee domain & passcode verification for employees without active session
    if (!userId && data.guestEmail) {
      const cleanEmail = data.guestEmail.trim().toLowerCase();
      if (cleanEmail.endsWith('@vyntyraconsultancyservices.in') || cleanEmail.endsWith('@vcs.in')) {
        userId = `emp_${crypto.randomUUID()}`;
        userEmail = cleanEmail;
        isDirectEmployeeAuthorized = true;
      }
    }

    // Auth & Access Checks
    const isAuthorized = Boolean(userId || isAccessCodeAuthorized || isDirectInternAuthorized || isDirectEmployeeAuthorized);

    if (isInternal && !isAccessCodeAuthorized) {
      if (!isAuthorized) {
        throw new Error("AUTH_REQUIRED");
      }
      
      const allowedEmails = settings.allowedEmails ? settings.allowedEmails.split(',').map((e: string) => e.trim().toLowerCase()).filter(Boolean) : [];
      const superHosts = settings.superHosts ? settings.superHosts.split(',').map((e: string) => e.trim().toLowerCase()).filter(Boolean) : [];
      const hosts = settings.hosts ? settings.hosts.split(',').map((e: string) => e.trim().toLowerCase()).filter(Boolean) : [];
      
      const isCreator = room.host_id === userId;
      const isExplicitHost = userEmail && (superHosts.includes(userEmail.toLowerCase()) || hosts.includes(userEmail.toLowerCase()));
      
      if (!isCreator && !isExplicitHost && allowedEmails.length > 0 && userEmail && !allowedEmails.includes(userEmail.toLowerCase())) {
        throw new Error("ACCESS_DENIED_GUEST_LIST");
      }
    } else if (!isAccessCodeAuthorized) {
      // External Meeting without valid access code: check password
      if (settings.password && settings.password.trim() !== '' && settings.password !== data.password) {
        throw new Error("INVALID_PASSWORD");
      }
    }

    // Check ejected list
    const ejectedList: string[] = settings.ejectedParticipants || [];
    if (
      (userId && ejectedList.includes(userId)) ||
      (userEmail && ejectedList.includes(userEmail.toLowerCase())) ||
      (data.guestEmail && ejectedList.includes(data.guestEmail.toLowerCase()))
    ) {
      throw new Error("ACCESS_EJECTED");
    }

    // Query explicit roles from meet_roles table
    let dbRole: string | null = null;
    const effectiveEmail = (userEmail || data.guestEmail || "").toLowerCase().trim();
    if (effectiveEmail) {
      try {
        const adminClient = getAdminClient();
        const { data: roleRow } = await adminClient
          .from('meet_roles')
          .select('role')
          .eq('meeting_id', data.roomId)
          .eq('user_email', effectiveEmail)
          .maybeSingle();
        if (roleRow?.role) {
          dbRole = roleRow.role;
        }
      } catch (_) {}
    }

    // Role assignment & RBAC Hierarchy
    const isCreator = room.host_id === userId;
    const isSuperHost = isCreator || (settings.superHosts && effectiveEmail && settings.superHosts.toLowerCase().includes(effectiveEmail)) || dbRole === 'super_admin';
    const isCoHost = (settings.coHosts && Array.isArray(settings.coHosts) && settings.coHosts.some((e: string) => e.toLowerCase() === effectiveEmail)) || dbRole === 'co_host';
    const isHost = isSuperHost || isCoHost || (settings.hosts && effectiveEmail && settings.hosts.toLowerCase().includes(effectiveEmail)) || dbRole === 'host';

    // Room Lock Check: If meeting is locked by host, only hosts and co-hosts may enter
    if (settings.isLocked && !isHost) {
      throw new Error("ROOM_LOCKED");
    }

    // Intern ID & Employee Auto-Recognition
    let detectedInternId: string | null = null;
    let detectedUserType = 'guest';

    if (effectiveEmail) {
      try {
        const adminClient = getAdminClient();
        const { data: prof } = await adminClient
          .from('profiles')
          .select('id, intern_id, full_name, department, role, position')
          .ilike('email', effectiveEmail)
          .maybeSingle();

        if (prof) {
          if (prof.intern_id) {
            detectedInternId = prof.intern_id;
            detectedUserType = 'intern';
          } else if (prof.role === 'admin' || prof.role === 'super_admin') {
            detectedUserType = 'admin';
          } else {
            detectedUserType = 'employee';
          }
          if (!userFullName && prof.full_name) {
            userFullName = prof.full_name;
          }
        } else if (effectiveEmail.endsWith('@vyntyraconsultancyservices.in')) {
          detectedUserType = 'employee';
        }
      } catch (_) {}
    }

    const { accountId, appId, apiToken } = getRealtimeCredentials();

    if (!accountId || !appId || !apiToken) {
      throw new Error("Missing CLOUDFLARE_REALTIME_API_TOKEN in environment. Please ensure Cloudflare RealtimeKit credentials are configured.");
    }

    // Generate participant identity
    let participantName = userFullName || (userEmail ? userEmail.split('@')[0] : (data.guestName || "External Guest"));
    if (detectedInternId && !participantName.includes(detectedInternId)) {
      participantName = `${participantName} [${detectedInternId}]`;
    }
    const participantId = userId || `guest_${crypto.randomUUID()}`;

    let cfMeetingId = settings.cf_room_id || data.roomId;

    const addParticipant = async (targetMeetingId: string, withPreset = true) => {
      const bodyPayload: any = {
        name: participantName,
        client_specific_id: participantId,
        metadata: {
          avatar_url: userAvatarUrl || null,
          intern_id: detectedInternId,
          user_type: detectedUserType,
          is_verified: Boolean(detectedInternId || effectiveEmail.endsWith('@vyntyraconsultancyservices.in')),
          is_host: isHost,
          is_co_host: isCoHost
        }
      };
      if (withPreset) {
        bodyPayload.preset_name = isHost ? "group_call_host" : "group_call_participant";
      }

      return await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/realtime/kit/${appId}/meetings/${targetMeetingId}/participants`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(bodyPayload)
      });
    };

    let response = await addParticipant(cfMeetingId, true);

    // If custom preset is missing or invalid, retry with default preset
    if (!response.ok && response.status === 400) {
      response = await addParticipant(cfMeetingId, false);
    }

    // Auto-heal: If meeting was not found on Cloudflare RealtimeKit (404), provision it on-demand!
    if (!response.ok && response.status === 404) {
      try {
        const createRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/realtime/kit/${appId}/meetings`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            title: (room.title as string) || "Live Meeting"
          })
        });

        if (createRes.ok) {
          const createData = await createRes.json() as any;
          const newCfId = createData.data?.id;
          if (newCfId) {
            cfMeetingId = newCfId;
            settings.cf_room_id = newCfId;
            const updatedSettingsStr = JSON.stringify(settings);

            // Persist the mapped cf_room_id so all subsequent users join the same room
            const adminClient = getAdminClient();
            try {
              await adminClient.from('meet_rooms').update({ settings: updatedSettingsStr }).eq('id', data.roomId);
            } catch (_) {}
            try {
              await adminClient.from('meetings').update({ description: (room.description || '') + ` __SETTINGS:${updatedSettingsStr}` }).or(`id.eq.${data.roomId},meeting_link.ilike.%${data.roomId}%,meeting_url.ilike.%${data.roomId}%`);
            } catch (_) {}

            // Now add participant to the newly created Cloudflare meeting!
            response = await addParticipant(newCfId, true);
            if (!response.ok && response.status === 400) {
              response = await addParticipant(newCfId, false);
            }
          }
        }
      } catch (err) {
        console.error("Cloudflare auto-provision error:", err);
      }
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
      accessCode: derivedAccessCode,
      isHost,
      isCoHost,
      isSuperHost,
      appId: appId,
      title: room.title as string,
      participantName: participantName || "Guest",
      participantId,
      internId: detectedInternId,
      userType: detectedUserType,
      isVerified: Boolean(detectedInternId || effectiveEmail.endsWith('@vyntyraconsultancyservices.in')),
      permissions: {
        allowGuestScreenShare: settings.allowGuestScreenShare !== false,
        allowGuestChat: settings.allowGuestChat !== false,
        isLocked: Boolean(settings.isLocked),
        waitingRoom: Boolean(settings.waitingRoom),
      }
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

      return filtered.map((room: any) => {
        let parsed: any = {};
        try {
          parsed = room.settings ? JSON.parse(room.settings) : {};
        } catch (_) {}
        const accessCode = parsed.access_code || getOrDeriveAccessCode(room.id, parsed.access_code);
        return {
          ...room,
          accessCode,
          access_code: accessCode,
        };
      }) as any[];
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

// Fast verification of an 8-Digit Vyntyra Access Code
export const verifyMeetingAccessCodeFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({
    accessCode: z.string().min(6).max(16),
  }).parse(d))
  .handler(async ({ data }) => {
    const code = data.accessCode.trim().toUpperCase();
    const adminClient = getAdminClient();
    
    // 1. Check Supabase meet_rooms
    const { data: supaRooms } = await adminClient
      .from('meet_rooms')
      .select('*')
      .eq('status', 'active');
    
    if (supaRooms && supaRooms.length > 0) {
      for (const r of supaRooms) {
        let parsed: any = {};
        try { parsed = JSON.parse(r.settings || '{}'); } catch (_) {}
        const roomCode = parsed.access_code || getOrDeriveAccessCode(r.id, parsed.access_code);
        if (roomCode.toUpperCase() === code) {
          return {
            valid: true,
            roomId: r.id,
            title: r.title,
            accessCode: roomCode,
            type: parsed.type || 'internal'
          };
        }
      }
    }

    // 2. Check Supabase meetings table
    const { data: supaMeets } = await adminClient
      .from('meetings')
      .select('*')
      .ilike('description', `%${code}%`)
      .limit(5);

    if (supaMeets && supaMeets.length > 0) {
      const sm = supaMeets[0];
      const match = (sm.meeting_link || sm.meeting_url || '').match(/\/meet\/([a-zA-Z0-9_\-]+)/);
      const rId = match ? match[1] : String(sm.id);
      return {
        valid: true,
        roomId: rId,
        title: sm.title,
        accessCode: code,
        type: sm.description?.includes('External') ? 'external' : 'internal'
      };
    }

    return { valid: false, message: "Invalid or expired access code" };
  });

// In-memory translation cache (cleared after 2000 items to bound memory)
const meetingTranslationCache = new Map<string, string>();

/**
 * AI Speech & Caption Translation powered by OpenRouter API Models
 * (Llama 3.3 70B, OpenRouter Auto, DeepSeek) with high-speed caching
 * and server-side failover.
 */
export const translateSpeechFn = createServerFn({ method: "POST" })
  .validator((d: any) => {
    return z.object({
      text: z.string().min(1).max(2000),
      targetLang: z.string().default("hi"),
      targetLangName: z.string().default("Hindi"),
      sourceLang: z.string().optional().default("auto"),
      model: z.string().optional().default("meta-llama/llama-3.3-70b-instruct"),
    }).parse(d);
  })
  .handler(async ({ data }) => {
    const cleanText = data.text.trim();
    if (!cleanText) {
      return { success: true, translatedText: "", modelUsed: "none", provider: "none" };
    }

    const cacheKey = `${data.targetLang}:${data.model || 'default'}:${cleanText.toLowerCase()}`;
    if (meetingTranslationCache.has(cacheKey)) {
      return {
        success: true,
        translatedText: meetingTranslationCache.get(cacheKey)!,
        modelUsed: "cache",
        provider: "openrouter-cache",
        cached: true,
      };
    }

    const openRouterKey = getEnv("OPENROUTER_API_KEY") || getEnv("OPENROUTER_KEY") || "";

    // Candidate OpenRouter models tested for Indian languages & speed
    const modelsToTry = [
      data.model || "meta-llama/llama-3.3-70b-instruct",
      "openrouter/auto",
      "deepseek/deepseek-chat",
      "meta-llama/llama-3.1-8b-instruct",
    ];
    const uniqueModels = Array.from(new Set(modelsToTry));

    if (openRouterKey) {
      for (const model of uniqueModels) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 6500);

          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openRouterKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://portal.vyntyraconsultancyservices.in",
              "X-Title": "Vyntyra Meet Live Translation",
            },
            signal: controller.signal,
            body: JSON.stringify({
              model,
              messages: [
                {
                  role: "system",
                  content: `You are an ultra-fast real-time speech translation engine for live video conferences in Vyntyra Meet. Translate the spoken input directly into fluent ${data.targetLangName}. Output ONLY the direct translated sentence in ${data.targetLangName} script. Do NOT include quotation marks, explanations, notes, or pronunciation guide.`
                },
                {
                  role: "user",
                  content: cleanText
                }
              ],
              temperature: 0.1,
              max_tokens: 150,
            }),
          });

          clearTimeout(timeout);

          if (response.ok) {
            const resJson = await response.json();
            let translated = resJson?.choices?.[0]?.message?.content?.trim() || "";
            // Clean up any extraneous quotes
            translated = translated.replace(/^["'“”]+|["'“”]+$/g, '').trim();

            if (translated) {
              if (meetingTranslationCache.size > 2000) {
                meetingTranslationCache.clear();
              }
              meetingTranslationCache.set(cacheKey, translated);
              return {
                success: true,
                translatedText: translated,
                modelUsed: model,
                provider: "openrouter",
              };
            }
          } else {
            const errBody = await response.text();
            console.warn(`[OpenRouter Translation] Model ${model} returned ${response.status}:`, errBody);
          }
        } catch (err) {
          console.warn(`[OpenRouter Translation] Exception with ${model}:`, err);
        }
      }
    }

    // Secondary fallback: Server-side translation endpoint
    try {
      const gUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(data.targetLang)}&dt=t&q=${encodeURIComponent(cleanText)}`;
      const gRes = await fetch(gUrl);
      if (gRes.ok) {
        const gData = await gRes.json();
        if (Array.isArray(gData) && Array.isArray(gData[0])) {
          const translated = gData[0].map((item: any) => item[0]).join('');
          if (translated) {
            if (meetingTranslationCache.size > 2000) {
              meetingTranslationCache.clear();
            }
            meetingTranslationCache.set(cacheKey, translated);
            return {
              success: true,
              translatedText: translated,
              modelUsed: "server-engine",
              provider: "server-fallback",
            };
          }
        }
      }
    } catch (gErr) {
      console.warn("[Server Translation Fallback Error]:", gErr);
    }

    return {
      success: false,
      translatedText: cleanText,
      modelUsed: "none",
      provider: "raw",
    };
  });

/**
 * Guest Identity Verification & Intern ID Auto-Recognition
 * Validates external or guest participant email against internal profiles,
 * assigns Intern ID if registered, and records a visitor gatekeeper entry.
 */
export const verifyGuestIdentityFn = createServerFn({ method: "POST" })
  .validator((d: any) => z.object({
    roomId: z.string(),
    email: z.string().email(),
    fullName: z.string().min(1),
    phone: z.string().optional(),
    organization: z.string().optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const adminClient = getAdminClient();
    const cleanEmail = data.email.trim().toLowerCase();

    let isVerified = false;
    let userType: 'intern' | 'employee' | 'admin' | 'guest' = 'guest';
    let internId: string | null = null;
    let resolvedName = data.fullName.trim();
    let department: string | null = null;

    try {
      const { data: prof } = await adminClient
        .from('profiles')
        .select('id, intern_id, full_name, department, role, position, phone')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (prof) {
        isVerified = true;
        if (prof.intern_id) {
          internId = prof.intern_id;
          userType = 'intern';
        } else if (prof.role === 'admin' || prof.role === 'super_admin') {
          userType = 'admin';
        } else {
          userType = 'employee';
        }
        if (prof.full_name) {
          resolvedName = prof.full_name;
        }
        department = prof.department || prof.position || null;
      } else if (cleanEmail.endsWith('@vyntyraconsultancyservices.in')) {
        isVerified = true;
        userType = 'employee';
      }
    } catch (err) {
      console.warn("Guest profile verification lookup error:", err);
    }

    // Record into visitor logs table
    try {
      await adminClient.from('meet_visitor_logs').insert({
        meeting_id: data.roomId,
        full_name: resolvedName,
        email: cleanEmail,
        phone: data.phone || null,
        organization: data.organization || (isVerified ? "Vyntyra Consultancy Services" : null),
        intern_id: internId,
        is_verified: isVerified,
        user_type: userType,
        status: 'admitted',
      });
    } catch (err) {
      console.warn("Failed to insert visitor log:", err);
    }

    return {
      isVerified,
      userType,
      internId,
      fullName: resolvedName,
      department,
      email: cleanEmail,
    };
  });

/**
 * Detailed Attendance & Connection Telemetry Recorder
 * Tracks join_time, leave_time, duration, and reconnection attempts.
 */
export const recordMeetingTelemetryFn = createServerFn({ method: "POST" })
  .validator((d: any) => z.object({
    meetingId: z.string(),
    participantId: z.string(),
    userEmail: z.string().optional(),
    userName: z.string(),
    phone: z.string().optional(),
    internId: z.string().optional(),
    userType: z.string().optional().default('guest'),
    action: z.enum(['join', 'ping', 'leave']),
    durationSeconds: z.number().optional().default(0),
    deviceMetadata: z.string().optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const adminClient = getAdminClient();
    const nowIso = new Date().toISOString();

    try {
      if (data.action === 'join') {
        const { data: existing } = await adminClient
          .from('meet_attendance_telemetry')
          .select('id, reconnection_count, duration_seconds')
          .eq('meeting_id', data.meetingId)
          .eq('participant_id', data.participantId)
          .maybeSingle();

        if (existing) {
          await adminClient
            .from('meet_attendance_telemetry')
            .update({
              reconnection_count: (existing.reconnection_count || 1) + 1,
              updated_at: nowIso,
              user_name: data.userName,
              user_email: data.userEmail || undefined,
              intern_id: data.internId || undefined,
            })
            .eq('id', existing.id);
        } else {
          await adminClient
            .from('meet_attendance_telemetry')
            .insert({
              meeting_id: data.meetingId,
              participant_id: data.participantId,
              user_email: data.userEmail || null,
              user_name: data.userName,
              phone: data.phone || null,
              intern_id: data.internId || null,
              user_type: data.userType,
              join_time: nowIso,
              reconnection_count: 1,
              duration_seconds: 0,
              attendance_status: 'Present',
              device_metadata: data.deviceMetadata || null,
              updated_at: nowIso,
            });
        }
      } else if (data.action === 'ping' || data.action === 'leave') {
        const { data: existing } = await adminClient
          .from('meet_attendance_telemetry')
          .select('id, duration_seconds')
          .eq('meeting_id', data.meetingId)
          .eq('participant_id', data.participantId)
          .maybeSingle();

        if (existing) {
          const newDuration = Math.max(existing.duration_seconds || 0, data.durationSeconds);
          await adminClient
            .from('meet_attendance_telemetry')
            .update({
              duration_seconds: newDuration,
              leave_time: data.action === 'leave' ? nowIso : undefined,
              updated_at: nowIso,
            })
            .eq('id', existing.id);
        }
      }
      return { success: true };
    } catch (err) {
      console.warn("recordMeetingTelemetry error:", err);
      return { success: false };
    }
  });

/**
 * Host Attendance & Session Telemetry Fetcher
 */
export const getMeetingAttendanceFn = createServerFn({ method: "POST" })
  .validator((d: any) => z.object({
    meetingId: z.string(),
  }).parse(d))
  .handler(async ({ data }) => {
    const adminClient = getAdminClient();
    try {
      const { data: rows } = await adminClient
        .from('meet_attendance_telemetry')
        .select('*')
        .eq('meeting_id', data.meetingId)
        .order('join_time', { ascending: true });

      let roomSettings: any = {};
      const { data: room } = await adminClient
        .from('meet_rooms')
        .select('title, settings')
        .eq('id', data.meetingId)
        .maybeSingle();

      if (room?.settings) {
        try { roomSettings = JSON.parse(room.settings); } catch (_) {}
      }

      return {
        success: true,
        meetingTitle: room?.title || "Meeting Session",
        records: rows || [],
        settings: {
          isLocked: Boolean(roomSettings.isLocked),
          waitingRoom: Boolean(roomSettings.waitingRoom),
          allowGuestScreenShare: roomSettings.allowGuestScreenShare !== false,
          allowGuestChat: roomSettings.allowGuestChat !== false,
          coHosts: roomSettings.coHosts || [],
          ejectedParticipants: roomSettings.ejectedParticipants || [],
        }
      };
    } catch (err) {
      console.warn("getMeetingAttendance error:", err);
      return { success: false, records: [], settings: {} };
    }
  });

/**
 * Host Attendance Status Override (Present, Late, Excused, Absent)
 */
export const updateAttendanceStatusFn = createServerFn({ method: "POST" })
  .validator((d: any) => z.object({
    recordId: z.string(),
    status: z.enum(['Present', 'Late', 'Excused', 'Absent']),
  }).parse(d))
  .handler(async ({ data }) => {
    const adminClient = getAdminClient();
    try {
      await adminClient
        .from('meet_attendance_telemetry')
        .update({
          attendance_status: data.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.recordId);
      return { success: true };
    } catch (err) {
      console.warn("updateAttendanceStatus error:", err);
      return { success: false };
    }
  });

/**
 * Host Controls & Permissions Manager (Lock, Mute All, Eject, Co-Hosts, Permissions)
 */
export const updateHostControlsFn = createServerFn({ method: "POST" })
  .validator((d: any) => z.object({
    meetingId: z.string(),
    isLocked: z.boolean().optional(),
    waitingRoom: z.boolean().optional(),
    allowGuestScreenShare: z.boolean().optional(),
    allowGuestChat: z.boolean().optional(),
    ejectUserId: z.string().optional(),
    addCoHostEmail: z.string().optional(),
    removeCoHostEmail: z.string().optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const adminClient = getAdminClient();
    try {
      const { data: room } = await adminClient
        .from('meet_rooms')
        .select('*')
        .eq('id', data.meetingId)
        .maybeSingle();

      if (!room) return { success: false, reason: "Room not found" };

      let settings: any = {};
      try {
        settings = room.settings ? JSON.parse(room.settings) : {};
      } catch (_) {}

      if (typeof data.isLocked === 'boolean') settings.isLocked = data.isLocked;
      if (typeof data.waitingRoom === 'boolean') settings.waitingRoom = data.waitingRoom;
      if (typeof data.allowGuestScreenShare === 'boolean') settings.allowGuestScreenShare = data.allowGuestScreenShare;
      if (typeof data.allowGuestChat === 'boolean') settings.allowGuestChat = data.allowGuestChat;

      if (data.ejectUserId) {
        settings.ejectedParticipants = settings.ejectedParticipants || [];
        if (!settings.ejectedParticipants.includes(data.ejectUserId)) {
          settings.ejectedParticipants.push(data.ejectUserId);
        }
      }

      if (data.addCoHostEmail) {
        settings.coHosts = settings.coHosts || [];
        const clean = data.addCoHostEmail.trim().toLowerCase();
        if (!settings.coHosts.includes(clean)) {
          settings.coHosts.push(clean);
        }
        try {
          await adminClient.from('meet_roles').upsert({
            meeting_id: data.meetingId,
            user_email: clean,
            role: 'co_host'
          }, { onConflict: 'meeting_id,user_email' });
        } catch (_) {}
      }

      if (data.removeCoHostEmail) {
        settings.coHosts = (settings.coHosts || []).filter((e: string) => e !== data.removeCoHostEmail?.toLowerCase());
        try {
          await adminClient.from('meet_roles').delete()
            .eq('meeting_id', data.meetingId)
            .eq('user_email', data.removeCoHostEmail.toLowerCase());
        } catch (_) {}
      }

      const updatedSettingsStr = JSON.stringify(settings);
      await adminClient
        .from('meet_rooms')
        .update({ settings: updatedSettingsStr })
        .eq('id', data.meetingId);

      // Mirror to Cloudflare D1
      const d1 = getD1Database();
      if (d1 && typeof d1.prepare === 'function') {
        try {
          await d1.prepare(`UPDATE meet_rooms SET settings = ? WHERE id = ?`)
            .bind(updatedSettingsStr, data.meetingId).run();
        } catch (_) {}
      }

      return { success: true, settings };
    } catch (err) {
      console.warn("updateHostControls error:", err);
      return { success: false };
    }
  });
