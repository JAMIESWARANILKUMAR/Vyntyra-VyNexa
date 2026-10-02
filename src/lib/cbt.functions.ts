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
    const ai = new GoogleGenAI({ apiKey: getEnv("GEMINI_API_KEY") });
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
    const adminClient = getAdminClient();
    const userId = context.user.id;
    
    const { title, description, target_type, target_id, passing_score, time_limit_minutes, category } = args.testMetadata;
    
    // 1. Create the CBT Exam
    const { data: exam, error: examError } = await adminClient.from('cbt_exams').insert({
      title: title || 'New AI CBT Exam',
      description: description || 'Generated AI Assessment',
      category: category || 'General',
      passing_score: passing_score || 50,
      created_by: userId,
      status: 'published',
      allocation_mode: target_type === 'team' ? 'team' : 'individual',
      team_ids: target_type === 'team' ? [target_id] : [],
      intern_ids: target_type === 'intern' ? [target_id] : []
    }).select('id').single();

    if (examError || !exam) {
      console.error(examError);
      throw new Error("Failed to create CBT Exam in Supabase");
    }

    // 2. Insert Questions with manual timers
    const questionsToInsert = args.questions.map((q: any, i: number) => ({
      exam_id: exam.id,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options || {},
      correct_answer: typeof q.correct_answer === 'object' ? q.correct_answer.id : q.correct_answer,
      time_limit_seconds: q.time_limit_seconds || 60,
      max_points: q.max_points || 10,
      order_index: i
    }));

    const { error: questionsError } = await adminClient.from('cbt_questions').insert(questionsToInsert);
    
    if (questionsError) {
      console.error(questionsError);
      throw new Error("Failed to insert CBT questions into Supabase");
    }

    return { success: true, testId: exam.id, message: "Exam Successfully Created in Supabase!" };
  });

export const getInternTestSessionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ testId: z.string() }).parse(d))
  .handler(async ({ data: args, context }) => {
    const adminClient = getAdminClient();
    
    const { data: test, error: testErr } = await adminClient.from('cbt_exams').select('*').eq('id', args.testId).single();
    if (testErr || !test) throw new Error("Test not found");
    
    const { data: questions, error: qErr } = await adminClient.from('cbt_questions').select('*').eq('exam_id', args.testId).order('order_index', { ascending: true });
    
    const safeQuestions = (questions || []).map((q: any) => {
      let options = q.options;
      try { if (typeof options === 'string') options = JSON.parse(options); } catch (e) {}
      return {
        id: q.id,
        question_type: q.question_type,
        question_text: q.question_text,
        options: options,
        max_points: q.max_points,
        time_limit_seconds: q.time_limit_seconds
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
    const adminClient = getAdminClient();
    const userId = context.user.id;
    
    const { data: sub, error: subErr } = await adminClient.from('cbt_submissions').insert({
      exam_id: args.testId,
      intern_id: userId,
      status: "submitted",
      submitted_at: new Date().toISOString()
    }).select().single();
      
    if (subErr || !sub) throw new Error("Failed to save submission");

    const subId = sub.id;

    let pLogs = args.proctoringLogs || [];
    try { if (typeof pLogs === 'string') pLogs = JSON.parse(pLogs); } catch(e){}

    if (Array.isArray(pLogs) && pLogs.length > 0) {
      await adminClient.from('cbt_malpractice_logs').insert(
        pLogs.map((l: any) => ({
           submission_id: subId,
           infraction_type: l.reason,
           description: JSON.stringify(l),
           timestamp: l.time || new Date().toISOString()
        }))
      );
    }

    // Trigger grading via Gemini 1.5 Flash immediately
    const { data: questions } = await adminClient.from('cbt_questions').select('*').eq('exam_id', args.testId);
    const { data: test } = await adminClient.from('cbt_exams').select('*').eq('id', args.testId).single();
    
    let totalScore = 0;
    const ai = new GoogleGenAI({ apiKey: getEnv("GEMINI_API_KEY") });
    
    let answersObj = args.answers;
    try { if (typeof answersObj === 'string') answersObj = JSON.parse(answersObj); } catch (e) {}

    let insertAnswers: any[] = [];
    let globalAiFeedback: any = {};

    for (const q of (questions || [])) {
      const internAnswer = answersObj ? answersObj[q.id] : null;
      let correctAnswer = q.correct_answer;
      try { if (typeof correctAnswer === 'string') correctAnswer = JSON.parse(correctAnswer); } catch(e) {}
      
      let qScore = 0;
      let qFeedback = "";

      if (q.question_type === 'mcq' || q.question_type === 'true_false') {
        const isCorrect = internAnswer?.id === correctAnswer?.id || internAnswer === correctAnswer?.id || internAnswer === correctAnswer;
        qScore = isCorrect ? (q.max_points || 10) : 0;
        qFeedback = isCorrect ? 'Correct.' : 'Incorrect.';
        totalScore += qScore;
      } else {
        if (!internAnswer) {
          qFeedback = 'No answer provided.';
        } else {
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
            qScore = resJson.score || 0;
            qFeedback = resJson.feedback || "";
            totalScore += qScore;
          } catch (e) {
            qFeedback = 'Error grading with AI.';
          }
        }
      }

      globalAiFeedback[q.id] = { score: qScore, max: q.max_points, feedback: qFeedback };

      insertAnswers.push({
         submission_id: subId,
         question_id: q.id,
         selected_option: (q.question_type === 'mcq' || q.question_type === 'true_false') ? JSON.stringify(internAnswer) : null,
         subjective_answer: (q.question_type !== 'mcq' && q.question_type !== 'true_false') ? JSON.stringify(internAnswer) : null,
         ai_score: qScore,
         ai_feedback: qFeedback
      });
    }

    if (insertAnswers.length > 0) {
      await adminClient.from('cbt_answers').insert(insertAnswers);
    }
    
    const passed = totalScore >= (test?.passing_score || 60);
    
    await adminClient.from('cbt_submissions').update({
       total_score: totalScore,
       ai_feedback: JSON.stringify(globalAiFeedback),
       status: 'graded'
    }).eq('id', subId);
    
    return { success: true, submissionId: subId, score: totalScore, passed };
  });

export const listAdminTestsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<any[]> => {
    const adminClient = getAdminClient();
    const { data } = await adminClient.from('cbt_exams').select('*').order('created_at', { ascending: false });
    return data || [];
  });

export const deleteAdminTestFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => z.object({ testId: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const adminClient = getAdminClient();
    await adminClient.from('cbt_exams').delete().eq('id', data.testId);
    return { success: true };
  });

export const toggleAdminTestStatusFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => z.object({ testId: z.string(), status: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const adminClient = getAdminClient();
    await adminClient.from('cbt_exams').update({ status: data.status }).eq('id', data.testId);
    return { success: true };
  });

export const getInternSubmissionResultFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ testId: z.string() }).parse(d))
  .handler(async ({ data: args, context }) => {
    const adminClient = getAdminClient();
    const userId = context.user.id;
    
    const { data: sub } = await adminClient.from('cbt_submissions').select('*, cbt_exams(*)').eq('exam_id', args.testId).eq('intern_id', userId).order('started_at', { ascending: false }).limit(1).single();
    return sub;
  });

export const listInternSubmissionsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<any[]> => {
    const adminClient = getAdminClient();
    const userId = context.user.id;
    const { data } = await adminClient.from('cbt_submissions').select('*, cbt_exams(*)').eq('intern_id', userId).order('started_at', { ascending: false });
    return data || [];
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
export const listAdminTestSubmissionsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => z.object({ testId: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const adminClient = getAdminClient();
    const { data: subs } = await adminClient.from('cbt_submissions').select('*, profiles(full_name, email)').eq('exam_id', data.testId).order('submitted_at', { ascending: false });
    return subs || [];
  });
export const listInternAvailableExamsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const adminClient = getAdminClient();
    const userId = context.user.id;
    
    // Get all published exams
    const { data: exams } = await adminClient.from('cbt_exams').select('*').eq('status', 'published');
    
    // Get user's teams (via tasks assigned to them)
    const { data: userTasks } = await adminClient.from('tasks').select('team_id').eq('assigned_to', userId).not('team_id', 'is', null);
    const userTeams = Array.from(new Set((userTasks || []).map(t => t.team_id)));
    
    // Filter exams where intern_ids contains userId OR team_ids overlaps with userTeams
    const availableExams = (exams || []).filter(exam => {
      const isTargetedIntern = exam.intern_ids && exam.intern_ids.includes(userId);
      const isTargetedTeam = exam.team_ids && exam.team_ids.some((tid: string) => userTeams.includes(tid));
      return isTargetedIntern || isTargetedTeam;
    });
    
    // Get exams the user has already submitted
    const { data: submissions } = await adminClient.from('cbt_submissions').select('exam_id').eq('intern_id', userId);
    const submittedExamIds = new Set((submissions || []).map(s => s.exam_id));
    
    // Return only exams that haven't been submitted yet
    return availableExams.filter(exam => !submittedExamIds.has(exam.id));
  });

export const reassignAdminTestFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    testId: z.string(),
    target_type: z.enum(['intern', 'team']),
    target_id: z.string(),
  }).parse(d))
  .handler(async ({ data: args }) => {
    const adminClient = getAdminClient();
    const { testId, target_type, target_id } = args;

    const { data: test, error: fetchErr } = await adminClient
      .from('cbt_exams')
      .select('intern_ids, team_ids')
      .eq('id', testId)
      .single();

    if (fetchErr || !test) throw new Error("Exam not found");

    const updatePayload: any = {
      status: 'published',
      allocation_mode: target_type === 'team' ? 'team' : 'individual',
    };

    if (target_type === 'team') {
      const existingTeams = Array.isArray(test.team_ids) ? test.team_ids : [];
      updatePayload.team_ids = Array.from(new Set([...existingTeams, target_id]));
    } else {
      const existingInterns = Array.isArray(test.intern_ids) ? test.intern_ids : [];
      updatePayload.intern_ids = Array.from(new Set([...existingInterns, target_id]));
    }

    const { error: updateErr } = await adminClient
      .from('cbt_exams')
      .update(updatePayload)
      .eq('id', testId);

    if (updateErr) throw new Error("Failed to assign exam: " + updateErr.message);

    return { success: true, message: "Exam successfully assigned and allocated!" };
  });
