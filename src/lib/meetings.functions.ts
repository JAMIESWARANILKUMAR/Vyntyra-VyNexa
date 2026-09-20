import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getD1Database } from "@/lib/cloudflare-d1";
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
      recordingEnabled: z.boolean().default(false)
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

    return { roomId, title: data.title };
  });

// Gets an active meeting token and config
export const getMeetingTokenFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    roomId: z.string()
  }).parse(d))
  .handler(async ({ data, context }) => {
    const d1 = getD1Database();
    const userId = context.user.id;
    const userEmail = context.user.email;

    // Verify room exists and is active
    const room = await d1!.prepare(`
      SELECT * FROM meet_rooms WHERE id = ? AND status = 'active'
    `).bind(data.roomId).first() as any;

    if (!room) {
      throw new Error("Room not found or no longer active.");
    }

    const isHost = room.host_id === userId;

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const appId = process.env.CLOUDFLARE_REALTIME_APP_ID;
    const apiToken = process.env.CLOUDFLARE_REALTIME_API_TOKEN;

    if (!accountId || !appId || !apiToken) {
      throw new Error("Missing Cloudflare RealtimeKit credentials.");
    }

    // Generate a secure JWT/token for Cloudflare RealtimeKit via Add Participant API
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/realtime/kit/${appId}/meetings/${data.roomId}/participants`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: userEmail?.split('@')[0] || "Participant",
        client_specific_id: userId,
        preset_name: isHost ? "group_call_host" : "group_call_participant"
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

    const result = await d1!.prepare(`
      UPDATE meet_rooms 
      SET status = 'ended', ended_at = CURRENT_TIMESTAMP
      WHERE id = ? AND host_id = ?
    `).bind(data.roomId, hostId).run();

    if (result.meta.changes === 0) {
      throw new Error("Unauthorized or room not found.");
    }

    return { success: true };
  });
