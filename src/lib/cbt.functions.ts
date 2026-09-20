import { getEnv } from "@/lib/env";
import { createServerFn } from "@tanstack/react-start";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { getAdminClient } from "@/integrations/supabase/admin";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getD1Database } from "@/lib/cloudflare-d1";
import crypto from 'crypto';

export const generateAiTestFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    taskContext: z.string(),
    documentText: z.string().optional(),
    modules: z.array(z.string())
  }).parse(d))
  .handler(async ({ data: args }) => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `You are an expert technical evaluator. Generate a computer-based test (CBT) based on the following context.
    
    TASK CONTEXT:
    ${args.taskContext}
    
    DOCUMENT CONTEXT:
    ${args.documentText || "None"}
    
    REQUESTED MODULES:
    ${args.modules.join(', ')}
    
    Output the result STRICTLY as JSON with the following schema:
    {
      "questions": [
        {
          "question_type": "mcq" | "coding" | "aptitude" | "long_answer",
          "question_text": "...",
          "options": [{ "id": "...", "text": "..." }],
          "correct_answer": { "id": "..." } | "...",
          "max_points": 10
        }
      ]
    }`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    
    return JSON.parse(response.text || '{}');
  });

export const saveGeneratedTestFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    testMetadata: z.any(),
    questions: z.array(z.any())
  }).parse(d))
  .handler(async ({ data: args, context }) => {
    const supabase = getAdminClient();
    const d1 = getD1Database(context);
    if (!d1) throw new Error("Cloudflare D1 is not available");
    const userId = context.user.id;
    
    const shuffleArray = (array: any[]) => {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    if (args.testMetadata.target_type === "team") {
      const teamId = args.testMetadata.target_id;
      const { data: teamTasks } = await supabase.from("tasks").select("assigned_to, team_members").eq("team_id", teamId);
      const memberIds = new Set<string>();
      if (teamTasks) {
        teamTasks.forEach((t: any) => {
          if (t.assigned_to) memberIds.add(t.assigned_to);
          if (Array.isArray(t.team_members)) {
            t.team_members.forEach((m: any) => memberIds.add(String(m)));
          }
        });
      }

      const members = Array.from(memberIds);
      if (members.length === 0) throw new Error("No members found in this team to assign tests to.");

      const createdTestIds = [];
      const stmts = [];

      for (const memberId of members) {
        const testId = crypto.randomUUID();
        const individualMeta = { 
          ...args.testMetadata, 
          target_type: "intern", 
          target_id: memberId,
          title: `${args.testMetadata.title} (Team Allocation)`
        };

        stmts.push(
          d1.prepare('INSERT INTO cbt_tests (id, title, description, target_type, target_id, modules, time_limit_minutes, passing_score, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
            .bind(testId, individualMeta.title, individualMeta.description, individualMeta.target_type, individualMeta.target_id, JSON.stringify(individualMeta.modules), individualMeta.time_limit_minutes || 30, individualMeta.passing_score || 60, userId)
        );

        const jumbledQuestions = shuffleArray(args.questions);
        for (const q of jumbledQuestions) {
          stmts.push(
            d1.prepare('INSERT INTO cbt_questions (id, test_id, question_type, question_text, options, correct_answer, max_points) VALUES (?, ?, ?, ?, ?, ?, ?)')
              .bind(crypto.randomUUID(), testId, q.question_type, q.question_text, JSON.stringify(q.options), JSON.stringify(q.correct_answer), q.max_points || 10)
          );
        }
        createdTestIds.push(testId);
      }

      const res = await d1.batch(stmts);
      if (!res.every(r => r.success)) throw new Error("Failed to batch insert tests to D1");

      return { success: true, testIds: createdTestIds, message: `Allocated ${createdTestIds.length} jumbled tests for team.` };

    } else {
      const testId = crypto.randomUUID();
      const stmts = [];
      
      stmts.push(
        d1.prepare('INSERT INTO cbt_tests (id, title, description, target_type, target_id, modules, time_limit_minutes, passing_score, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(testId, args.testMetadata.title, args.testMetadata.description, args.testMetadata.target_type, args.testMetadata.target_id, JSON.stringify(args.testMetadata.modules), args.testMetadata.time_limit_minutes || 30, args.testMetadata.passing_score || 60, userId)
      );

      for (const q of args.questions) {
        stmts.push(
          d1.prepare('INSERT INTO cbt_questions (id, test_id, question_type, question_text, options, correct_answer, max_points) VALUES (?, ?, ?, ?, ?, ?, ?)')
            .bind(crypto.randomUUID(), testId, q.question_type, q.question_text, JSON.stringify(q.options), JSON.stringify(q.correct_answer), q.max_points || 10)
        );
      }

      const res = await d1.batch(stmts);
      if (!res.every((r: any) => r.success)) throw new Error("Failed to insert test to D1");
      
      return { success: true, testId: testId };
    }
  });

export const getInternTestSessionFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ testId: z.string() }).parse(d))
  .handler(async ({ data: args, context }) => {
    const d1 = getD1Database(context);
    if (!d1) throw new Error("Cloudflare D1 is not available");
    
    const test = await d1.prepare('SELECT * FROM cbt_tests WHERE id = ?').bind(args.testId).first();
    if (!test) throw new Error("Test not found");
    
    const qResult = await d1.prepare('SELECT * FROM cbt_questions WHERE test_id = ?').bind(args.testId).all();
    const questions = qResult.results || [];
    
    const safeQuestions = questions.map((q: any) => {
      let options = q.options;
      try { options = JSON.parse(q.options); } catch (e) {}
      return {
        id: q.id,
        question_type: q.question_type,
        question_text: q.question_text,
        options: options,
        max_points: q.max_points
      };
    });
    
    return { test, questions: safeQuestions };
  });

export const submitCbtExamFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    testId: z.string(),
    answers: z.any(),
    proctoringLogs: z.any()
  }).parse(d))
  .handler(async ({ data: args, context }) => {
    const d1 = getD1Database(context);
    if (!d1) throw new Error("Cloudflare D1 is not available");
    const userId = context.user.id;
    const subId = crypto.randomUUID();
    
    const res = await d1.prepare('INSERT INTO cbt_submissions (id, test_id, intern_id, answers, proctoring_logs, status) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(subId, args.testId, userId, JSON.stringify(args.answers), JSON.stringify(args.proctoringLogs), "submitted").run();
      
    if (!res.success) throw new Error("Failed to save submission");

    // Trigger grading via Gemini 1.5 Flash immediately
    const qResult = await d1.prepare('SELECT * FROM cbt_questions WHERE test_id = ?').bind(args.testId).all();
    const questions = (qResult.results || []) as any[];
    
    const test = await d1.prepare('SELECT * FROM cbt_tests WHERE id = ?').bind(args.testId).first<any>();
    
    let totalScore = 0;
    let maxScore = 0;
    let aiFeedback: any = {};
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    let answersObj = args.answers;
    try { if (typeof answersObj === 'string') answersObj = JSON.parse(answersObj); } catch (e) {}

    for (const q of questions) {
      maxScore += (q.max_points || 10);
      const internAnswer = answersObj ? answersObj[q.id] : null;
      let correctAnswer = q.correct_answer;
      try { if (typeof correctAnswer === 'string') correctAnswer = JSON.parse(correctAnswer); } catch(e) {}
      
      if (q.question_type === 'mcq') {
        const isCorrect = internAnswer?.id === correctAnswer?.id || internAnswer === correctAnswer?.id;
        const pts = isCorrect ? (q.max_points || 10) : 0;
        totalScore += pts;
        aiFeedback[q.id] = { score: pts, max: q.max_points, feedback: isCorrect ? 'Correct.' : 'Incorrect.' };
      } else {
        if (!internAnswer) {
          aiFeedback[q.id] = { score: 0, max: q.max_points, feedback: 'No answer provided.' };
          continue;
        }
        try {
          const prompt = `Evaluate this student answer strictly for technical correctness and provide constructive feedback.
Question: ${q.question_text}
Expected Answer Context: ${JSON.stringify(correctAnswer)}
Student Answer: ${JSON.stringify(internAnswer)}
Max Points Possible: ${q.max_points || 10}

Return JSON with exactly this schema: { "score": number, "feedback": "reasoning" }`;
          const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
          });
          const resJson = JSON.parse(response.text || '{}');
          totalScore += (resJson.score || 0);
          aiFeedback[q.id] = { score: resJson.score || 0, max: q.max_points, feedback: resJson.feedback };
        } catch (e) {
          aiFeedback[q.id] = { score: 0, max: q.max_points, feedback: 'Error grading with AI.' };
        }
      }
    }
    
    const passed = totalScore >= (test.passing_score || 60);
    
    await d1.prepare('UPDATE cbt_submissions SET score = ?, max_score = ?, passed = ?, ai_feedback = ?, status = ? WHERE id = ?')
      .bind(totalScore, maxScore, passed ? 1 : 0, JSON.stringify(aiFeedback), "graded", subId).run();
    
    return { success: true, submissionId: subId, score: totalScore, passed };
  });

export const listAdminTestsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<any[]> => {
    const d1 = getD1Database(context);
    if (!d1) throw new Error("Cloudflare D1 is not available");
    const res = await d1.prepare('SELECT * FROM cbt_tests ORDER BY created_at DESC').all();
    return (res.results || []) as any[];
  });

export const deleteAdminTestFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => z.object({ testId: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const d1 = getD1Database(context);
    if (!d1) throw new Error("Cloudflare D1 is not available");
    await d1.prepare('DELETE FROM cbt_tests WHERE id = ?').bind(data.testId).run();
    return { success: true };
  });

export const toggleAdminTestStatusFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => z.object({ testId: z.string(), status: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const d1 = getD1Database(context);
    if (!d1) throw new Error("Cloudflare D1 is not available");
    await d1.prepare('UPDATE cbt_tests SET status = ? WHERE id = ?').bind(data.status, data.testId).run();
    return { success: true };
  });

export const getInternSubmissionResultFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ testId: z.string() }).parse(d))
  .handler(async ({ data: args, context }) => {
    const d1 = getD1Database(context);
    if (!d1) throw new Error("Cloudflare D1 is not available");
    const userId = context.user.id;
    
    const sub = await d1.prepare('SELECT * FROM cbt_submissions WHERE test_id = ? AND intern_id = ? ORDER BY created_at DESC LIMIT 1').bind(args.testId, userId).first<any>();
    if (!sub) return null;
    
    const test = await d1.prepare('SELECT title, modules, passing_score, time_limit_minutes FROM cbt_tests WHERE id = ?').bind(args.testId).first<any>();
    sub.cbt_tests = test;
    
    return sub as any;
  });

export const listInternSubmissionsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<any[]> => {
    const d1 = getD1Database(context);
    if (!d1) throw new Error("Cloudflare D1 is not available");
    const userId = context.user.id;
    
    const res = await d1.prepare('SELECT s.*, t.title as test_title, t.passing_score FROM cbt_submissions s JOIN cbt_tests t ON s.test_id = t.id WHERE s.intern_id = ? ORDER BY s.created_at DESC').bind(userId).all();
    return (res.results || []) as any[];
  });

export const listCbtTargetsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const supabase = getAdminClient();
    
    const { data: interns } = await supabase.from("profiles").select("id, full_name, email").in("role", ["intern", "employee"]);
    const { data: tasks } = await supabase.from("tasks").select("team_id, team_name").not("team_id", "is", null);
    
    const uniqueTeams: any[] = [];
    const seenIds = new Set();
    for (const t of (tasks || [])) {
       if (!seenIds.has(t.team_id)) {
          seenIds.add(t.team_id);
          uniqueTeams.push({ id: t.team_id, name: t.team_name || t.team_id });
       }
    }
    
    return { interns: interns || [], teams: uniqueTeams };
  });
