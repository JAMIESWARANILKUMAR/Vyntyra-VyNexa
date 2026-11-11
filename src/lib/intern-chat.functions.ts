import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getD1Database } from "@/lib/cloudflare-d1";
import { getAdminClient } from "@/integrations/supabase/admin";
import { generateAiText } from "@/lib/ai-gateway";

// ═══════════════════════════════════════════════════════════════════
// TYPES & IN-MEMORY FALLBACK STORE (Resilient local/Worker sync)
// ═══════════════════════════════════════════════════════════════════

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  sender_email?: string | null;
  sender_avatar?: string | null;
  receiver_id?: string | null;
  content: string;
  message_type: "text" | "image" | "file" | "url" | "ai";
  file_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  is_flagged?: number;
  flag_reason?: string | null;
  is_deleted?: number;
  created_at: string;
}

export interface ChatRoom {
  id: string;
  type: "direct" | "channel" | "ai";
  participant_ids: string[];
  title?: string | null;
  last_message_text?: string | null;
  last_message_at: string;
  created_at: string;
}

export interface ModerationLog {
  id: string;
  message_id?: string | null;
  sender_id: string;
  sender_name: string;
  sender_email?: string | null;
  blocked_content: string;
  violation_type: string;
  ai_confidence: number;
  action_taken: string;
  timestamp: string;
}

export interface SafeInternProfile {
  id: string;
  full_name: string;
  email: string;
  intern_id: string;
  stream: string;
  domain: string;
  internship_period: string;
  avatar_url?: string | null;
  is_online?: boolean;
  is_clocked_in?: boolean;
  last_seen?: string | null;
}

// In-Memory Storage Mirror for Dev / Non-D1 edge environments
const memoryRooms = new Map<string, ChatRoom>();
const memoryMessages: ChatMessage[] = [];
const memoryModerationLogs: ModerationLog[] = [];
const memoryPresence = new Map<string, { last_seen: string; is_online: boolean; typing_in_room?: string | null }>();

// Prepopulate Community General Channel & AI Copilot Room
const GENERAL_ROOM_ID = "channel_general_community";
const AI_COPILOT_ROOM_PREFIX = "ai_copilot_";

// Quick Profanity / Nudity / Explicit Slurs Filter Heuristic
const EXPLICIT_BLOCKLIST = [
  "nude", "nudity", "naked", "sex", "porn", "xxx", "boobs", "dick", "pussy",
  "vagina", "penis", "horny", "bitch", "bastard", "fuck", "fucking", "shit",
  "asshole", "cunt", "slut", "whore", "rape", "nigger", "faggot", "motherfucker"
];

function sanitizeContentRegex(content: string): { isFlagged: boolean; violationType?: string } {
  const normalized = content.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  for (const word of EXPLICIT_BLOCKLIST) {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    if (regex.test(normalized)) {
      return {
        isFlagged: true,
        violationType: word.match(/nude|naked|sex|porn|xxx|boobs|dick|pussy|vagina|penis|horny/) 
          ? "nudity_or_sexual_content" 
          : "profanity_or_inappropriate_language"
      };
    }
  }
  return { isFlagged: false };
}

// AI Content Moderation Filter using OpenRouter / Gemini
async function runAiModerationCheck(content: string, senderName: string): Promise<{ isSafe: boolean; reason?: string }> {
  // First, quick regex check for instant zero-latency protection
  const regexCheck = sanitizeContentRegex(content);
  if (regexCheck.isFlagged) {
    return {
      isSafe: false,
      reason: `Blocked by Automated Policy: ${regexCheck.violationType?.replace(/_/g, " ")}`
    };
  }

  // If text is short and clean, pass
  if (content.length < 5) return { isSafe: true };

  // For longer messages, run background AI moderation via OpenRouter / Gemini
  try {
    const aiPrompt = `Analyze the following message sent by an intern in a corporate workspace communication channel:
"""
${content}
"""

Determine if this message contains nudity, sexual solicitations, adult content, graphic violence, severe harassment, or explicit vulgar abuse.
Respond with JSON matching this structure:
{
  "isSafe": true,
  "flagReason": null,
  "category": "clean"
}
If unsafe, set "isSafe": false, provide a concise "flagReason", and category ("sexual_nudity" | "harassment" | "severe_profanity").`;

    const res = await generateAiText({
      prompt: aiPrompt,
      systemInstruction: "You are an automated corporate content safety and compliance moderator. Output only JSON.",
      provider: "openrouter",
      openRouterModel: "google/gemini-2.5-flash",
      temperature: 0.1,
      responseMimeType: "application/json"
    });

    try {
      const parsed = JSON.parse(res.text);
      if (parsed && parsed.isSafe === false) {
        return { isSafe: false, reason: parsed.flagReason || "Violates community guidelines." };
      }
    } catch {
      // If parsing fails, fall back to safe unless explicit keywords detected
    }
  } catch (err: any) {
    // If AI fails, proceed with keyword check result
    console.warn("[Moderation] AI filter fallback:", err.message);
  }

  return { isSafe: true };
}

// Helper to initialize D1 tables if DB binding exists
async function ensureD1Tables(d1: any) {
  if (!d1 || typeof d1.exec !== "function") return;
  try {
    await d1.exec(`
      CREATE TABLE IF NOT EXISTS intern_chat_rooms (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL DEFAULT 'direct',
        participant_ids TEXT NOT NULL,
        title TEXT,
        last_message_text TEXT,
        last_message_at TEXT DEFAULT (datetime('now')),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS intern_chat_messages (
        id TEXT PRIMARY KEY,
        room_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        sender_name TEXT NOT NULL,
        sender_email TEXT,
        sender_avatar TEXT,
        receiver_id TEXT,
        content TEXT NOT NULL,
        message_type TEXT NOT NULL DEFAULT 'text',
        file_url TEXT,
        file_name TEXT,
        file_size INTEGER,
        is_flagged INTEGER DEFAULT 0,
        flag_reason TEXT,
        is_deleted INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS intern_chat_moderation_logs (
        id TEXT PRIMARY KEY,
        message_id TEXT,
        sender_id TEXT NOT NULL,
        sender_name TEXT NOT NULL,
        sender_email TEXT,
        blocked_content TEXT NOT NULL,
        violation_type TEXT NOT NULL,
        ai_confidence REAL DEFAULT 0.95,
        action_taken TEXT NOT NULL DEFAULT 'blocked_before_delivery',
        timestamp TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS intern_chat_presence (
        user_id TEXT PRIMARY KEY,
        user_name TEXT NOT NULL,
        last_seen TEXT DEFAULT (datetime('now')),
        is_online INTEGER DEFAULT 1,
        typing_in_room TEXT,
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);
  } catch (err) {
    // Ignore if already created
  }
}

// ═══════════════════════════════════════════════════════════════════
// 1. LIST SAFE INTERN DIRECTORY (For Chat Search & WhatsApp-style Profile)
// ═══════════════════════════════════════════════════════════════════

export const listChatInternsFn = createServerFn({ method: "GET" })
  .handler(async (): Promise<SafeInternProfile[]> => {
    const admin = getAdminClient();
    let rawProfiles: any[] = [];

    // 1. Primary Strategy: Select all directory fields from profiles
    try {
      const { data, error } = await admin
        .from("profiles")
        .select("id, full_name, email, intern_id, department, position, college_name, duration_months, avatar_url, updated_at, role")
        .order("full_name", { ascending: true });

      if (!error && data && data.length > 0) {
        // Filter to intern/student/candidate or anyone not strictly an admin/hr
        const internRows = data.filter((p: any) => 
          !p.role || ["intern", "student", "candidate", "user"].includes(p.role.toLowerCase())
        );
        rawProfiles = internRows.length > 0 ? internRows : data;
      } else if (error) {
        // 2. Safe fallback: Select minimal fields in case some optional columns don't exist yet
        const { data: minData } = await admin
          .from("profiles")
          .select("id, full_name, email, avatar_url, updated_at")
          .order("full_name", { ascending: true });

        if (minData && minData.length > 0) {
          rawProfiles = minData;
        }
      }
    } catch (err) {
      console.warn("[listChatInternsFn] Profiles query attempt error:", err);
    }

    // 3. Fallback: If profiles has 0 rows, check applications table
    if (rawProfiles.length === 0) {
      try {
        const { data: apps } = await admin
          .from("applications")
          .select("id, full_name, email, role_applied, position, company, created_at, status")
          .order("created_at", { ascending: false })
          .limit(30);

        if (apps && apps.length > 0) {
          rawProfiles = apps.map((a: any) => ({
            id: a.id,
            full_name: a.full_name || "Intern Associate",
            email: a.email,
            department: a.role_applied || "Software Development",
            position: a.position || "Software Engineering Intern",
            college_name: a.company || "Computer Science & Engineering",
            duration_months: 6,
            updated_at: a.created_at
          }));
        }
      } catch (appErr) {
        console.warn("[listChatInternsFn] Applications fallback attempt error:", appErr);
      }
    }

    // 4. Default Seed: If database is completely brand new without profiles/applications
    if (rawProfiles.length === 0) {
      rawProfiles = [
        {
          id: "int_01",
          full_name: "Aarav Sharma",
          email: "aarav.sharma@vyntyraconsultancyservices.in",
          intern_id: "VYN-INT-202601",
          department: "Full-Stack Web Engineering",
          position: "Frontend React Developer",
          college_name: "IIT Madras - CSE",
          duration_months: 6,
          is_clocked_in: true
        },
        {
          id: "int_02",
          full_name: "Ananya Patel",
          email: "ananya.patel@vyntyraconsultancyservices.in",
          intern_id: "VYN-INT-202602",
          department: "AI & Machine Learning",
          position: "LLM Systems Engineer",
          college_name: "BITS Pilani - CS & Data",
          duration_months: 6,
          is_clocked_in: true
        },
        {
          id: "int_03",
          full_name: "Karthik Verma",
          email: "karthik.verma@vyntyraconsultancyservices.in",
          intern_id: "VYN-INT-202603",
          department: "Cloud Architecture & DevOps",
          position: "Cloud Infrastructure Intern",
          college_name: "NIT Trichy - ECE",
          duration_months: 6,
          is_clocked_in: false
        },
        {
          id: "int_04",
          full_name: "Sneha Reddy",
          email: "sneha.reddy@vyntyraconsultancyservices.in",
          intern_id: "VYN-INT-202604",
          department: "UI/UX & Product Design",
          position: "Product Design Associate",
          college_name: "NID Ahmedabad",
          duration_months: 6,
          is_clocked_in: false
        }
      ];
    }

    // 5. Query active attendance to identify who is currently clocked in
    const clockedInUserIds = new Set<string>();
    try {
      const { data: activeAtt } = await admin
        .from("attendance")
        .select("user_id, clock_in, clock_out")
        .is("clock_out", null)
        .gte("clock_in", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (activeAtt) {
        activeAtt.forEach((a: any) => {
          if (a.user_id) clockedInUserIds.add(String(a.user_id));
        });
      }
    } catch (e) {
      console.warn("[listChatInternsFn] Attendance check error:", e);
    }

    return rawProfiles.map((i: any) => {
      const presence = memoryPresence.get(String(i.id));
      const isClockedIn = clockedInUserIds.has(String(i.id)) || (i.is_clocked_in === true);
      // Active if currently clocked in or active in presence session
      const isActive = isClockedIn || (presence?.is_online === true);

      return {
        id: String(i.id),
        full_name: i.full_name || "Intern Associate",
        email: i.email || "intern@vyntyraconsultancyservices.in",
        intern_id: i.intern_id || `VYN-INT-${String(i.id).slice(0, 6).toUpperCase()}`,
        stream: i.college_name || i.position || "Computer Science & Engineering",
        domain: i.department || "Software Development",
        internship_period: `${i.duration_months || 6} Months (Cohort 2026-27)`,
        avatar_url: i.avatar_url || null,
        is_online: isActive,
        is_clocked_in: isClockedIn,
        last_seen: presence?.last_seen ?? i.updated_at ?? new Date().toISOString()
      };
    });
  });

// ═══════════════════════════════════════════════════════════════════
// 2. GET OR CREATE CHAT ROOM (1-on-1 DM or Channel)
// ═══════════════════════════════════════════════════════════════════

export const getOrCreateRoomFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({
    currentUserId: z.string().min(1),
    otherUserId: z.string().optional(),
    roomId: z.string().optional(),
    type: z.enum(["direct", "channel", "ai"]).default("direct")
  }).parse(d))
  .handler(async ({ data, context }): Promise<ChatRoom> => {
    const d1 = getD1Database(context);
    await ensureD1Tables(d1);

    // AI Copilot Room
    if (data.type === "ai" || data.roomId?.startsWith(AI_COPILOT_ROOM_PREFIX)) {
      const aiRoomId = `${AI_COPILOT_ROOM_PREFIX}${data.currentUserId}`;
      const aiRoom: ChatRoom = {
        id: aiRoomId,
        type: "ai",
        participant_ids: [data.currentUserId, "vyntyra_ai_bot"],
        title: "Ask Vyntyra Chat AI",
        last_message_text: "Hi there! I am your Vyntyra AI Copilot. Ask me anything about tasks, deadlines, or tech!",
        last_message_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      memoryRooms.set(aiRoomId, aiRoom);
      return aiRoom;
    }

    // General Community Channel
    if (data.type === "channel" || data.roomId === GENERAL_ROOM_ID) {
      let genRoom = memoryRooms.get(GENERAL_ROOM_ID);
      if (!genRoom) {
        genRoom = {
          id: GENERAL_ROOM_ID,
          type: "channel",
          participant_ids: ["all_interns"],
          title: "Vyntyra Intern Lounge (General)",
          last_message_text: "Welcome to Vyntyra Intern Community Chat! 🚀",
          last_message_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
        memoryRooms.set(GENERAL_ROOM_ID, genRoom);
      }
      return genRoom;
    }

    // Direct 1-on-1 Message Room
    const u1 = data.currentUserId < (data.otherUserId || "") ? data.currentUserId : (data.otherUserId || "");
    const u2 = data.currentUserId < (data.otherUserId || "") ? (data.otherUserId || "") : data.currentUserId;
    const directRoomId = `dm_${u1}_${u2}`;

    // 1. Try Cloudflare D1
    if (d1 && typeof d1.prepare === "function") {
      try {
        const existing = await d1.prepare("SELECT * FROM intern_chat_rooms WHERE id = ?").bind(directRoomId).first<any>();
        if (existing) {
          return {
            id: existing.id,
            type: "direct",
            participant_ids: JSON.parse(existing.participant_ids || "[]"),
            title: existing.title,
            last_message_text: existing.last_message_text,
            last_message_at: existing.last_message_at,
            created_at: existing.created_at
          };
        }

        const now = new Date().toISOString();
        const participantsStr = JSON.stringify([u1, u2]);
        await d1.prepare(`
          INSERT INTO intern_chat_rooms (id, type, participant_ids, last_message_at, created_at)
          VALUES (?, 'direct', ?, ?, ?)
        `).bind(directRoomId, participantsStr, now, now).run();

        return {
          id: directRoomId,
          type: "direct",
          participant_ids: [u1, u2],
          last_message_at: now,
          created_at: now
        };
      } catch (e) {
        console.warn("[getOrCreateRoomFn] D1 read error:", e);
      }
    }

    // In-Memory Fallback
    let room = memoryRooms.get(directRoomId);
    if (!room) {
      room = {
        id: directRoomId,
        type: "direct",
        participant_ids: [u1, u2],
        last_message_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      memoryRooms.set(directRoomId, room);
    }
    return room;
  });

// ═══════════════════════════════════════════════════════════════════
// 3. GET MESSAGES FOR A ROOM
// ═══════════════════════════════════════════════════════════════════

export const getChatMessagesFn = createServerFn({ method: "GET" })
  .validator((d: unknown) => z.object({
    roomId: z.string().min(1),
    limit: z.number().default(50)
  }).parse(d))
  .handler(async ({ data, context }): Promise<ChatMessage[]> => {
    const d1 = getD1Database(context);
    await ensureD1Tables(d1);

    if (d1 && typeof d1.prepare === "function") {
      try {
        const res = await d1.prepare(`
          SELECT * FROM intern_chat_messages 
          WHERE room_id = ? AND is_deleted = 0
          ORDER BY created_at ASC
          LIMIT ?
        `).bind(data.roomId, data.limit).all<any>();

        if (res?.results && res.results.length > 0) {
          return res.results.map((r: any) => ({
            id: r.id,
            room_id: r.room_id,
            sender_id: r.sender_id,
            sender_name: r.sender_name,
            sender_email: r.sender_email,
            sender_avatar: r.sender_avatar,
            receiver_id: r.receiver_id,
            content: r.content,
            message_type: r.message_type || "text",
            file_url: r.file_url,
            file_name: r.file_name,
            file_size: r.file_size,
            is_flagged: r.is_flagged,
            created_at: r.created_at
          }));
        }
      } catch (e) {
        console.warn("[getChatMessagesFn] D1 fetch error:", e);
      }
    }

    // Return in-memory messages for this room
    return memoryMessages
      .filter(m => m.room_id === data.roomId && !m.is_deleted)
      .slice(-data.limit);
  });

// ═══════════════════════════════════════════════════════════════════
// 4. SEND MESSAGE WITH AUTOMATED AI MODERATION FILTER
// ═══════════════════════════════════════════════════════════════════

export const sendChatMessageFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({
    roomId: z.string().min(1),
    senderId: z.string().min(1),
    senderName: z.string().min(1),
    senderEmail: z.string().optional(),
    senderAvatar: z.string().optional(),
    receiverId: z.string().optional(),
    content: z.string().min(1, "Message content is required"),
    messageType: z.enum(["text", "image", "file", "url"]).default("text"),
    fileUrl: z.string().optional(),
    fileName: z.string().optional(),
    fileSize: z.number().optional()
  }).parse(d))
  .handler(async ({ data, context }) => {
    const d1 = getD1Database(context);
    await ensureD1Tables(d1);

    const messageId = `msg_${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    // ── STEP 1: RUN BACKGROUND AI CONTENT MODERATION ──
    const moderation = await runAiModerationCheck(data.content, data.senderName);

    if (!moderation.isSafe) {
      // Log blocked violation for Super Admin Audit
      const modLog: ModerationLog = {
        id: `mod_${crypto.randomUUID()}`,
        message_id: messageId,
        sender_id: data.senderId,
        sender_name: data.senderName,
        sender_email: data.senderEmail,
        blocked_content: data.content,
        violation_type: moderation.reason || "Inappropriate Content",
        ai_confidence: 0.98,
        action_taken: "blocked_before_delivery",
        timestamp: now
      };

      memoryModerationLogs.unshift(modLog);

      if (d1 && typeof d1.prepare === "function") {
        try {
          await d1.prepare(`
            INSERT INTO intern_chat_moderation_logs 
            (id, message_id, sender_id, sender_name, sender_email, blocked_content, violation_type, ai_confidence, action_taken, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'blocked_before_delivery', ?)
          `).bind(
            modLog.id, modLog.message_id, modLog.sender_id, modLog.sender_name,
            modLog.sender_email || "", modLog.blocked_content, modLog.violation_type,
            modLog.ai_confidence, modLog.timestamp
          ).run();
        } catch (e) {
          console.warn("[Moderation] D1 log write error:", e);
        }
      }

      return {
        success: false,
        blocked: true,
        reason: moderation.reason || "Your message was blocked because it contains improper or policy-violating language."
      };
    }

    // ── STEP 2: PERSIST CLEAN MESSAGE TO CLOUDFLARE D1 ──
    const newMsg: ChatMessage = {
      id: messageId,
      room_id: data.roomId,
      sender_id: data.senderId,
      sender_name: data.senderName,
      sender_email: data.senderEmail || null,
      sender_avatar: data.senderAvatar || null,
      receiver_id: data.receiverId || null,
      content: data.content.trim(),
      message_type: data.messageType,
      file_url: data.fileUrl || null,
      file_name: data.fileName || null,
      file_size: data.fileSize || null,
      is_flagged: 0,
      is_deleted: 0,
      created_at: now
    };

    memoryMessages.push(newMsg);

    // Update room last message in memory
    const existingRoom = memoryRooms.get(data.roomId);
    if (existingRoom) {
      existingRoom.last_message_text = data.messageType === "file" ? `📎 ${data.fileName || "File"}` : data.content;
      existingRoom.last_message_at = now;
    }

    if (d1 && typeof d1.prepare === "function") {
      try {
        await d1.prepare(`
          INSERT INTO intern_chat_messages 
          (id, room_id, sender_id, sender_name, sender_email, sender_avatar, receiver_id, content, message_type, file_url, file_name, file_size, is_flagged, is_deleted, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)
        `).bind(
          newMsg.id, newMsg.room_id, newMsg.sender_id, newMsg.sender_name,
          newMsg.sender_email, newMsg.sender_avatar, newMsg.receiver_id,
          newMsg.content, newMsg.message_type, newMsg.file_url, newMsg.file_name,
          newMsg.file_size, newMsg.created_at
        ).run();

        await d1.prepare(`
          UPDATE intern_chat_rooms 
          SET last_message_text = ?, last_message_at = ?, updated_at = ?
          WHERE id = ?
        `).bind(newMsg.content.slice(0, 100), now, now, data.roomId).run();
      } catch (e) {
        console.warn("[sendChatMessageFn] D1 insert error:", e);
      }
    }

    return {
      success: true,
      blocked: false,
      message: newMsg
    };
  });

// ═══════════════════════════════════════════════════════════════════
// 5. ASK VYNTYRA CHAT AI (OpenRouter Contextual Assistant)
// ═══════════════════════════════════════════════════════════════════

export const askVyntyraChatAiFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({
    prompt: z.string().min(1, "Question cannot be empty"),
    internId: z.string().optional(),
    internName: z.string().default("Intern Associate")
  }).parse(d))
  .handler(async ({ data, context }) => {
    const d1 = getD1Database(context);
    await ensureD1Tables(d1);

    const admin = getAdminClient();
    const now = new Date().toISOString();

    // 1. Gather rich live context for the intern
    let internTasks: any[] = [];
    let announcements: any[] = [];
    let holidays: any[] = [];

    try {
      if (data.internId) {
        const { data: t } = await admin.from("tasks").select("id, title, status, due_date, credits").or(`assigned_to.eq.${data.internId},is_pool_task.eq.true`).limit(10);
        internTasks = t || [];
      }
      const { data: a } = await admin.from("announcements").select("title, body, created_at").order("created_at", { ascending: false }).limit(5);
      announcements = a || [];

      const { data: h } = await admin.from("holidays").select("name, date, type").limit(8);
      holidays = h || [];
    } catch (e) {
      // Continue gracefully
    }

    const tasksContext = internTasks.length > 0 
      ? internTasks.map(t => `- [${t.status?.toUpperCase()}] "${t.title}" (Due: ${t.due_date || 'Ongoing'}, ${t.credits || 10} Credits)`).join("\n")
      : "No tasks assigned currently.";

    const announcementsContext = announcements.length > 0
      ? announcements.map(a => `- ${a.title}: ${a.body?.slice(0, 100)}...`).join("\n")
      : "No recent bulletins.";

    const holidaysContext = holidays.length > 0
      ? holidays.map(h => `- ${h.name} on ${h.date} (${h.type})`).join("\n")
      : "Standard working sprint schedule.";

    const systemInstruction = `You are "Vyntyra Chat AI", the intelligent, supportive, and highly capable virtual assistant integrated directly into Vyntyra Connect Intern Portal.
You are assisting ${data.internName} (Intern Associate).

Current Workspace Live Context:
Active Tasks & Deadlines:
${tasksContext}

Upcoming Announcements & News:
${announcementsContext}

Upcoming Holidays & Sprints:
${holidaysContext}

Guidelines:
1. Always be professional, encouraging, clear, and proactive.
2. If asked about tasks, deadlines, shift clock-in, attendance, or CBT exams, use the live workspace context above.
3. If asked external questions (coding problems, algorithm design, software architecture, career advice, resumes, email drafts, general queries), provide detailed, elite engineering guidance.
4. Format responses cleanly with Markdown headers, bullet points, and code snippets when appropriate.`;

    const aiRoomId = `${AI_COPILOT_ROOM_PREFIX}${data.internId || "guest"}`;

    // Record user prompt in AI room
    const userMsg: ChatMessage = {
      id: `msg_${crypto.randomUUID()}`,
      room_id: aiRoomId,
      sender_id: data.internId || "intern",
      sender_name: data.internName,
      content: data.prompt,
      message_type: "text",
      created_at: now
    };
    memoryMessages.push(userMsg);

    try {
      const aiResponse = await generateAiText({
        prompt: data.prompt,
        systemInstruction,
        provider: "openrouter",
        openRouterModel: "google/gemini-2.5-flash",
        temperature: 0.4
      });

      const replyContent = aiResponse.text || "I processed your request, but could not generate a response right now. Please try again!";

      const aiMsg: ChatMessage = {
        id: `msg_${crypto.randomUUID()}`,
        room_id: aiRoomId,
        sender_id: "vyntyra_ai_bot",
        sender_name: "Vyntyra Chat AI",
        content: replyContent,
        message_type: "ai",
        created_at: new Date().toISOString()
      };
      memoryMessages.push(aiMsg);

      return {
        success: true,
        reply: replyContent,
        userMessage: userMsg,
        aiMessage: aiMsg
      };
    } catch (err: any) {
      console.warn("[askVyntyraChatAiFn] OpenRouter error:", err.message);
      const fallbackReply = `I'm having trouble connecting to the AI Gateway right now (${err.message}). For sprint questions, please check your Tasks tab or contact your technical mentor!`;

      const aiMsg: ChatMessage = {
        id: `msg_${crypto.randomUUID()}`,
        room_id: aiRoomId,
        sender_id: "vyntyra_ai_bot",
        sender_name: "Vyntyra Chat AI",
        content: fallbackReply,
        message_type: "ai",
        created_at: new Date().toISOString()
      };
      memoryMessages.push(aiMsg);

      return {
        success: true,
        reply: fallbackReply,
        userMessage: userMsg,
        aiMessage: aiMsg
      };
    }
  });

// ═══════════════════════════════════════════════════════════════════
// 6. CHAT PRESENCE & TYPING HEARTBEAT
// ═══════════════════════════════════════════════════════════════════

export const updateChatPresenceFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({
    userId: z.string().min(1),
    userName: z.string().min(1),
    isOnline: z.boolean().default(true),
    typingInRoom: z.string().nullable().optional()
  }).parse(d))
  .handler(async ({ data }) => {
    memoryPresence.set(data.userId, {
      last_seen: new Date().toISOString(),
      is_online: data.isOnline,
      typing_in_room: data.typingInRoom || null
    });
    return { success: true };
  });

// ═══════════════════════════════════════════════════════════════════
// 7. SUPER ADMIN CHAT AUDIT & MODERATION CONTROL
// ═══════════════════════════════════════════════════════════════════

export const adminListAllChatsFn = createServerFn({ method: "GET" })
  .handler(async ({ context }) => {
    const d1 = getD1Database(context);
    await ensureD1Tables(d1);

    let messagesList: ChatMessage[] = [];
    let modLogsList: ModerationLog[] = [];

    if (d1 && typeof d1.prepare === "function") {
      try {
        const msgs = await d1.prepare("SELECT * FROM intern_chat_messages ORDER BY created_at DESC LIMIT 100").all<any>();
        if (msgs?.results) messagesList = msgs.results;

        const mods = await d1.prepare("SELECT * FROM intern_chat_moderation_logs ORDER BY timestamp DESC LIMIT 50").all<any>();
        if (mods?.results) modLogsList = mods.results;
      } catch (e) {
        console.warn("[adminListAllChatsFn] D1 audit fetch error:", e);
      }
    }

    if (messagesList.length === 0) {
      messagesList = [...memoryMessages].reverse().slice(0, 100);
    }
    if (modLogsList.length === 0) {
      modLogsList = [...memoryModerationLogs].slice(0, 50);
    }

    return {
      totalMessages: messagesList.length,
      recentMessages: messagesList,
      moderationLogs: modLogsList,
      activeChannels: [GENERAL_ROOM_ID],
      activeDMs: Array.from(memoryRooms.keys())
    };
  });

export const adminDeleteChatMessageFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({
    messageId: z.string().min(1)
  }).parse(d))
  .handler(async ({ data, context }) => {
    const d1 = getD1Database(context);
    await ensureD1Tables(d1);

    // Remove from in-memory mirror
    const target = memoryMessages.find(m => m.id === data.messageId);
    if (target) {
      target.is_deleted = 1;
    }

    if (d1 && typeof d1.prepare === "function") {
      try {
        await d1.prepare("UPDATE intern_chat_messages SET is_deleted = 1 WHERE id = ?").bind(data.messageId).run();
      } catch (e) {
        console.warn("[adminDeleteChatMessageFn] D1 delete error:", e);
      }
    }

    return { success: true };
  });
