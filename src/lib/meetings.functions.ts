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
    const d1 = getD1Database();
    const roomId = crypto.randomUUID();
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

    // Verify room exists and is active
    const room = await d1!.prepare(`
      SELECT * FROM meet_rooms WHERE id = ? AND status = 'active'
    `).bind(data.roomId).first() as any;

    if (!room) {
      throw new Error("Room not found or no longer active.");
    }

    const isHost = room.host_id === userId;

    // Generate a secure JWT/token for Cloudflare RealtimeKit
    // Uses the App ID and Secret from .env
    const appId = process.env.CLOUDFLARE_REALTIME_APP_ID;
    const appSecret = process.env.CLOUDFLARE_REALTIME_APP_SECRET;

    if (!appId || !appSecret) {
      console.warn("Missing CLOUDFLARE_REALTIME_APP_ID or SECRET. Returning mock token for development.");
    }

    // In a real implementation, we would sign a JWT using the appSecret
    // granting permissions to this specific roomId (session).
    const token = crypto.createHmac('sha256', appSecret || 'mock_secret')
      .update(`${data.roomId}:${userId}:${isHost}`)
      .digest('hex');

    return {
      token,
      roomId: data.roomId,
      isHost,
      appId: appId || 'mock_app_id',
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
