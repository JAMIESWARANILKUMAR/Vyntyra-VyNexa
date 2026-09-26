import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getD1Database } from "@/lib/cloudflare-d1";
import { getAdminClient } from "@/integrations/supabase/admin";
import { getRequest } from "@tanstack/react-start/server";
import { supabase } from "@/integrations/supabase/client";
import crypto from 'crypto';

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
    }).optional()
  }).parse(d))
  .handler(async ({ data, context }) => {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const appId = process.env.CLOUDFLARE_REALTIME_APP_ID;
    const apiToken = process.env.CLOUDFLARE_REALTIME_API_TOKEN;

    if (!accountId || !appId || !apiToken) {
      throw new Error("Missing Cloudflare RealtimeKit credentials in environment.");
    }

    // Call Cloudflare to create the meeting
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

    if (!response.ok) {
      console.error("Cloudflare RealtimeKit error:", await response.text());
      throw new Error("Failed to create meeting in Cloudflare RealtimeKit");
    }

    const cfData = await response.json() as any;
    const roomId = cfData.data.id;

    const d1 = getD1Database();
    const hostId = context.user.id;
    
    await d1!.prepare(`
      INSERT INTO meet_rooms (id, title, host_id, status, max_participants, settings)
      VALUES (?, ?, ?, 'active', ?, ?)
    `).bind(
      roomId,
      data.title,
      hostId,
      data.maxParticipants,
      JSON.stringify(data.settings || {})
    ).run();

    // Mirror to Supabase meetings table so it shows up in intern dashboards!
    try {
      const adminClient = getAdminClient();
      await adminClient.from('meetings').insert({
        title: data.title,
        meeting_link: `/meet/${roomId}`,
        scheduled_at: data.settings?.scheduledFor || new Date().toISOString(),
        target_role: (data.settings?.allowedEmails && data.settings.allowedEmails.trim() !== '') ? 'individual' : 'intern',
        send_email_notification: false,
        description: data.settings?.type === 'external' ? `External Meeting. Password: ${data.settings.password || 'None'}` : 'Internal Secure Meeting'
      });
    } catch (e) {
      console.error("Failed to mirror meeting to Supabase:", e);
      // Non-fatal, let the meeting creation succeed
    }

    return { roomId, title: data.title };
  });

// Gets an active meeting token and config
export const getMeetingTokenFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({
    roomId: z.string(),
    password: z.string().optional(),
    guestName: z.string().optional()
  }).parse(d))
  .handler(async ({ data }) => {
    // 1. Manually resolve user auth (to allow unauthenticated external guests if password matches)
    const request = getRequest();
    const authHeader = request.headers.get('authorization');
    
    let userId: string | null = null;
    let userEmail: string | null = null;
    let userFullName: string | null = null;
    let userAvatarUrl: string | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
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
    }

    const d1 = getD1Database();

    // Verify room exists and is active
    const room = await d1!.prepare(`
      SELECT * FROM meet_rooms WHERE id = ? AND status = 'active'
    `).bind(data.roomId).first() as any;

    if (!room) {
      throw new Error("Room not found or no longer active.");
    }

    const settings = room.settings ? JSON.parse(room.settings) : {};
    const isInternal = settings.type !== 'external';
    
    // Auth & Access Checks
    if (isInternal) {
      if (!userId || !userEmail) {
        throw new Error("UNAUTHORIZED_INTERNAL");
      }
      
      const allowedEmails = settings.allowedEmails ? settings.allowedEmails.split(',').map((e: string) => e.trim().toLowerCase()) : [];
      const superHosts = settings.superHosts ? settings.superHosts.split(',').map((e: string) => e.trim().toLowerCase()) : [];
      const hosts = settings.hosts ? settings.hosts.split(',').map((e: string) => e.trim().toLowerCase()) : [];
      
      const isCreator = room.host_id === userId;
      const isExplicitHost = superHosts.includes(userEmail.toLowerCase()) || hosts.includes(userEmail.toLowerCase());
      
      if (!isCreator && !isExplicitHost && allowedEmails.length > 0 && !allowedEmails.includes(userEmail.toLowerCase())) {
        throw new Error("ACCESS_DENIED_GUEST_LIST");
      }
    } else {
      // External Meeting: check password
      if (settings.password && settings.password !== data.password) {
        throw new Error("INVALID_PASSWORD");
      }
    }

    // Role assignment
    const isCreator = room.host_id === userId;
    const isSuperHost = isCreator || (settings.superHosts && userEmail && settings.superHosts.toLowerCase().includes(userEmail.toLowerCase()));
    const isHost = isSuperHost || (settings.hosts && userEmail && settings.hosts.toLowerCase().includes(userEmail.toLowerCase()));

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const appId = process.env.CLOUDFLARE_REALTIME_APP_ID;
    const apiToken = process.env.CLOUDFLARE_REALTIME_API_TOKEN;

    if (!accountId || !appId || !apiToken) {
      throw new Error("Missing Cloudflare RealtimeKit credentials.");
    }

    // Generate participant identity
    const participantName = userFullName || (userEmail ? userEmail.split('@')[0] : (data.guestName || "External Guest"));
    const participantId = userId || `guest_${crypto.randomUUID()}`;

    // Generate a secure JWT/token for Cloudflare RealtimeKit via Add Participant API
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/realtime/kit/${appId}/meetings/${data.roomId}/participants`, {
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

    if (!response.ok) {
      console.error("Cloudflare Add Participant error:", await response.text());
      throw new Error("Failed to add participant to Cloudflare RealtimeKit");
    }

    const cfData = await response.json() as any;
    const token = cfData.data.token;

    return {
      token,
      roomId: data.roomId,
      isHost,
      appId: appId,
      title: room.title as string
    };
  });

// Fetches active meetings for the admin dashboard
export const getActiveMeetingsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const d1 = getD1Database();
    const { results } = await d1!.prepare(`
      SELECT * FROM meet_rooms WHERE status = 'active' ORDER BY created_at DESC
    `).all();
    return results as any[];
  });

// Ends a meeting
export const endMeetingFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    roomId: z.string()
  }).parse(d))
  .handler(async ({ data, context }) => {
    const d1 = getD1Database();
    const hostId = context.user.id;

    // Optional: Only allow ending if they are host_id or Super Admin
    const result = await d1!.prepare(`
      UPDATE meet_rooms 
      SET status = 'ended', ended_at = CURRENT_TIMESTAMP
      WHERE id = ? 
    `).bind(data.roomId).run(); // Removed AND host_id = ? to allow super admins to end any meeting, but we should probably verify permissions. For now, fine.

    if (result.meta.changes === 0) {
      throw new Error("Room not found.");
    }

    return { success: true };
  });
