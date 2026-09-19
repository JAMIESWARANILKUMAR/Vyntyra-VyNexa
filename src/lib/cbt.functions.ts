
import { getEnv } from "@/lib/env";
import { createServerFn } from "@tanstack/react-start";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { getAdminClient } from "@/integrations/supabase/admin";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
    ${args.modules.join(", ")}
    
    Output the result STRICTLY as JSON with the following schema:
    {
      "questions": [
        {
          "difficulty": "easy" | "medium" | "hard",
          "question_type": "mcq" | "coding" | "long_answer" | "aptitude" | "communication",
          "question_text": "The question prompt",
          "options": [{"id": "a", "text": "Option 1"}, ...],
          "correct_answer": {"id": "a"},
          "code_template": "...",
          "test_cases": [{"input": "...", "expected": "..."}],
          "max_points": 10
        }
      ]
    }
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      let text = response.text || "{}";
      if (text.startsWith("```json")) text = text.replace(/```json\\n/g, "").replace(/```/g, "");
      return { success: true, data: JSON.parse(text) };
    } catch (error: any) {
      console.error("AI Gen Error:", error);
      return { success: false, error: error.message };
    }
  });

export const saveGeneratedTestFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    testMetadata: z.any(),
    questions: z.array(z.any())
  }).parse(d))
  .handler(async ({ data: args, context }) => {
    const supabase = getAdminClient();
    const userId = context.user.id;
    
    // Fisher-Yates Shuffle for Jumbling Array
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
      
      // Look up all tasks to find team members
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
      if (members.length === 0) {
        throw new Error("No members found in this team to assign tests to. Please assign members to the team tasks first.");
      }

      const createdTestIds = [];
      for (const memberId of members) {
        // Individual test metadata for the team member
        const individualMeta = { 
          ...args.testMetadata, 
          target_type: "intern", 
          target_id: memberId,
          title: `${args.testMetadata.title} (Team Allocation)`
        };

        const { data: testData, error: testError } = await supabase
          .from("cbt_tests")
          .insert([{ ...individualMeta, created_by: userId }])
          .select()
          .single();
          
        if (testError) throw new Error(testError.message);

        // Array Jumbling logic for unique question ordering per team member
        const jumbledQuestions = shuffleArray(args.questions);
        const questionsToInsert = jumbledQuestions.map(q => ({
          ...q,
          test_id: testData.id
        }));

        const { error: qError } = await supabase.from("cbt_questions").insert(questionsToInsert);
        if (qError) throw new Error(qError.message);

        createdTestIds.push(testData.id);
      }

      return { success: true, testIds: createdTestIds, message: `Allocated ${createdTestIds.length} jumbled tests for team.` };

    } else {
      // Normal Individual Flow
      const { data: testData, error: testError } = await supabase
        .from("cbt_tests")
        .insert([{ ...args.testMetadata, created_by: userId }])
        .select()
        .single();
        
      if (testError) throw new Error(testError.message);
      
      const questionsToInsert = args.questions.map(q => ({
        ...q,
        test_id: testData.id
      }));
      
      const { error: qError } = await supabase.from("cbt_questions").insert(questionsToInsert);
      if (qError) throw new Error(qError.message);
      
      return { success: true, testId: testData.id };
    }
  });

export const getInternTestSessionFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ testId: z.string() }).parse(d))
  .handler(async ({ data: args }) => {
    const supabase = getAdminClient();
    
    const { data: test, error } = await supabase.from("cbt_tests").select("*").eq("id", args.testId).single();
    if (error) throw new Error(error.message);
    
    const { data: questions, error: qError } = await supabase.from("cbt_questions").select("*").eq("test_id", args.testId);
    if (qError) throw new Error(qError.message);
    
    const safeQuestions = questions.map(q => {
      const { correct_answer, ...safeQ } = q;
      return safeQ;
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
    const supabase = getAdminClient();
    const userId = context.user.id;
    
    const { data: submission, error } = await supabase.from("cbt_submissions").insert([{
      test_id: args.testId,
      intern_id: userId,
      answers: args.answers,
      proctoring_logs: args.proctoringLogs,
      status: "submitted",
      submitted_at: new Date().toISOString()
    }]).select().single();
    
    if (error) throw new Error(error.message);
    
    return { success: true, submissionId: submission.id };
  });

export const gradeCbtExamFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ submissionId: z.string() }).parse(d))
  .handler(async ({ data: args }) => {
    const supabase = getAdminClient();
    
    const { data: sub, error } = await supabase.from("cbt_submissions").select("*, cbt_tests(*)").eq("id", args.submissionId).single();
    if (error || !sub) throw new Error("Submission not found");
    
    const { data: questions } = await supabase.from("cbt_questions").select("*").eq("test_id", sub.test_id);
    if (!questions) throw new Error("Questions not found");
    
    let totalScore = 0;
    let maxScore = 0;
    let aiFeedback: any = {};
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    for (const q of questions) {
      maxScore += (q.max_points || 10);
      const internAnswer = sub.answers[q.id];
      
      if (q.question_type === "mcq") {
        const isCorrect = internAnswer?.id === q.correct_answer?.id || internAnswer === q.correct_answer?.id;
        const pts = isCorrect ? (q.max_points || 10) : 0;
        totalScore += pts;
        aiFeedback[q.id] = { score: pts, max: q.max_points, feedback: isCorrect ? "Correct." : "Incorrect." };
      } else {
        if (!internAnswer) {
          aiFeedback[q.id] = { score: 0, max: q.max_points, feedback: "No answer provided." };
          continue;
        }
        
        try {
          const prompt = `Evaluate this student answer.
Question: ${q.question_text}
Expected/Sample Answer: ${JSON.stringify(q.correct_answer)}
Student Answer: ${JSON.stringify(internAnswer)}
Max Points: ${q.max_points || 10}

Return JSON { "score": number, "feedback": "reason" }`;
          const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
          });
          const resJson = JSON.parse(response.text || "{}");
          totalScore += (resJson.score || 0);
          aiFeedback[q.id] = { score: resJson.score || 0, max: q.max_points, feedback: resJson.feedback };
        } catch (e) {
          aiFeedback[q.id] = { score: 0, max: q.max_points, feedback: "Error grading." };
        }
      }
    }
    
    const passed = totalScore >= (sub.cbt_tests.passing_score || 60);
    
    await supabase.from("cbt_submissions").update({
      score: totalScore,
      max_score: maxScore,
      passed,
      ai_feedback: aiFeedback
    }).eq("id", args.submissionId);
    
    return { success: true, score: totalScore, passed };
  });



export const listAdminTestsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = getAdminClient();
    const { data: tests, error } = await supabase.from("cbt_tests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return tests;
  });

export const deleteAdminTestFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => ({ testId: String(d.testId) }))
  .handler(async ({ data, context }) => {
    // cascades to questions and submissions automatically if setup properly, else manually delete or just delete test
    const supabase = getAdminClient();
    const { error } = await supabase.from("cbt_tests").delete().eq("id", data.testId);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const toggleAdminTestStatusFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => ({ testId: String(d.testId), status: String(d.status) }))
  .handler(async ({ data, context }) => {
    const supabase = getAdminClient();
    const { error } = await supabase.from("cbt_tests").update({ status: data.status }).eq("id", data.testId);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const getInternSubmissionResultFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ testId: z.string() }).parse(d))
  .handler(async ({ data: args, context }) => {
    const supabase = getAdminClient();
    const userId = context.user.id;
    
    const { data, error } = await supabase.from("cbt_submissions")
      .select("*, cbt_tests(title, modules, passing_score, time_limit_minutes)")
      .eq("test_id", args.testId)
      .eq("intern_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
      
    if (error) throw new Error(error.message);
    return data;
  });

export const listCbtTargetsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const supabase = getAdminClient();
    
    // 1. Get Interns
    const { data: interns } = await supabase.from("profiles").select("id, full_name, email").in("role", ["intern", "employee"]);
    
    // 2. Get Teams (distinct from tasks)
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
