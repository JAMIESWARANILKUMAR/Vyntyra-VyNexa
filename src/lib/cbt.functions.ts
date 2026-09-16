
import { getEnv } from "@/lib/env";
import { createServerFn } from "@tanstack/react-start";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { getAdminClient } from "@/integrations/supabase/admin";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const generateAiTestFn = createServerFn("POST", async (args: { taskContext: string, documentText?: string, modules: string[] }) => {
  const { session } = await requireSupabaseAuth();
  
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
        "options": [{"id": "a", "text": "Option 1"}, ...], // ONLY for mcq
        "correct_answer": {"id": "a"} | {"sample_solution": "..."} | {"expected_output": "..."},
        "code_template": "...", // ONLY for coding
        "test_cases": [{"input": "...", "expected": "..."}], // ONLY for coding
        "max_points": 10
      }
    ]
  }
  Do not include markdown codeblocks around the JSON. Return pure JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    
    let text = response.text || "{}";
    if (text.startsWith("```json")) text = text.replace(/```json\\n/g, "").replace(/```/g, "");
    
    const parsed = JSON.parse(text);
    return { success: true, data: parsed };
  } catch (error: any) {
    console.error("AI Gen Error:", error);
    return { success: false, error: error.message };
  }
});

export const saveGeneratedTestFn = createServerFn("POST", async (args: { testMetadata: any, questions: any[] }) => {
  const { session } = await requireSupabaseAuth();
  const supabase = getAdminClient();
  
  const { data: testData, error: testError } = await supabase
    .from("cbt_tests")
    .insert([{ ...args.testMetadata, created_by: session.user.id }])
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
});

export const getInternTestSessionFn = createServerFn("GET", async (args: { testId: string }) => {
  const { session } = await requireSupabaseAuth();
  const supabase = getAdminClient();
  
  const { data: test, error } = await supabase.from("cbt_tests").select("*").eq("id", args.testId).single();
  if (error) throw new Error(error.message);
  
  const { data: questions, error: qError } = await supabase.from("cbt_questions").select("*").eq("test_id", args.testId);
  if (qError) throw new Error(qError.message);
  
  // Strip correct answers
  const safeQuestions = questions.map(q => {
    const { correct_answer, ...safeQ } = q;
    return safeQ;
  });
  
  return { test, questions: safeQuestions };
});

export const submitCbtExamFn = createServerFn("POST", async (args: { testId: string, answers: any, proctoringLogs: any }) => {
  const { session } = await requireSupabaseAuth();
  const supabase = getAdminClient();
  
  // Submit raw first
  const { data: submission, error } = await supabase.from("cbt_submissions").insert([{
    test_id: args.testId,
    intern_id: session.user.id,
    answers: args.answers,
    proctoring_logs: args.proctoringLogs,
    status: "submitted",
    submitted_at: new Date().toISOString()
  }]).select().single();
  
  if (error) throw new Error(error.message);
  
  // Trigger async grading (in real app, this might be a queue, but we will wait or fetch later)
  // For now, we return the submission ID and grade in a separate function.
  return { success: true, submissionId: submission.id };
});


export const gradeCbtExamFn = createServerFn("POST", async (args: { submissionId: string }) => {
  const supabase = getAdminClient();
  
  const { data: sub, error } = await supabase.from("cbt_submissions").select("*, cbt_tests(*), profiles(*)").eq("id", args.submissionId).single();
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
      // AI Grading for long answer / coding
      if (!internAnswer) {
        aiFeedback[q.id] = { score: 0, max: q.max_points, feedback: "No answer provided." };
        continue;
      }
      
      const prompt = `Evaluate this student answer.
Question: ${q.question_text}
Expected/Sample Answer: ${JSON.stringify(q.correct_answer)}
Student Answer: ${JSON.stringify(internAnswer)}
Max Points: ${q.max_points || 10}

Return strictly JSON:
{
  "score": <number>,
  "feedback": "<brief explanation of why>"
}`;
      try {
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
