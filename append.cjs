
const fs = require("fs");
const code = `
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
      
      const prompt = \`Evaluate this student answer.
Question: \${q.question_text}
Expected/Sample Answer: \${JSON.stringify(q.correct_answer)}
Student Answer: \${JSON.stringify(internAnswer)}
Max Points: \${q.max_points || 10}

Return strictly JSON:
{
  "score": <number>,
  "feedback": "<brief explanation of why>"
}\`;
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
`;
fs.appendFileSync("src/lib/cbt.functions.ts", code);

