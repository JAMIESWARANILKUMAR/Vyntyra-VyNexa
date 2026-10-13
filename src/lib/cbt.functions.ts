import { getEnv } from "@/lib/env";
import { createServerFn } from "@tanstack/react-start";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { getAdminClient } from "@/integrations/supabase/admin";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getOrSetCache, invalidateCache } from "@/lib/server-cache";

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
    
    IMPORTANT RULES:
    1. Every question MUST have its solution pre-marked!
    2. For MCQ/Aptitude: Provide 4 distinct options with option IDs A, B, C, D and pre-mark correct_answer: { "id": "A" } or "A". Also include an in-depth "explanation" explaining why the solution is correct.
    3. For Coding questions: Provide the problem description, pre-marked reference solution code in "correct_answer", and at least 2 test cases in "test_cases" with "input" and "expected_output".
    4. For Subjective / Long Answer questions: Provide the grading criteria and model answer in "correct_answer" and "explanation".
    
    Output the result STRICTLY as JSON with the following schema:
    {
      "questions": [
        {
          "question_type": "mcq" | "coding" | "aptitude" | "long_answer",
          "question_text": "...",
          "options": [{ "id": "A", "text": "..." }, { "id": "B", "text": "..." }, { "id": "C", "text": "..." }, { "id": "D", "text": "..." }],
          "correct_answer": { "id": "..." } | "...",
          "explanation": "Detailed solution breakdown and explanation...",
          "test_cases": [{ "input": "...", "expected_output": "..." }],
          "reference_code": "// Optional starter or reference code",
          "max_points": 10,
          "time_limit_seconds": 60
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

async function sendCbtAssignmentEmail({
  to,
  internName,
  testTitle,
  description,
  timeLimitMinutes,
  passingScore,
  enableCamera,
  deadline,
  testId,
  isExtension = false,
}: {
  to: string;
  internName: string;
  testTitle: string;
  description?: string;
  timeLimitMinutes?: number;
  passingScore?: number;
  enableCamera?: boolean;
  deadline?: string | null;
  testId: string;
  isExtension?: boolean;
}) {
  const apiKey = getEnv("RESEND_API_KEY");
  if (!apiKey) {
    console.warn("[CBT Email] RESEND_API_KEY not configured; skipping dispatch.");
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }

  const subject = isExtension
    ? `[VyNexa Connect] Assessment Deadline Extended: ${testTitle}`
    : `[VyNexa Connect] New Assessment Assigned: ${testTitle}`;

  const appUrl = "https://vynexaconnect.vyntyraconsultancyservices.in";
  const examUrl = `${appUrl}/cbt/${testId}`;
  const formattedDeadline = deadline
    ? new Date(deadline).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "No strict deadline set";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
    <tr>
      <td style="background-color: #0f172a; padding: 32px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0 0 8px; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">Vyntyra • VyNexa Connect</h1>
        <p style="color: #94a3b8; margin: 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Secure CBT Evaluation Portal</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px;">
        <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 12px;">
          ${isExtension ? "Assessment Deadline Updated" : "New Assessment Allocated"}
        </h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
          Hello <strong>${internName || "Candidate"}</strong>,<br/>
          ${
            isExtension
              ? `The submission deadline for your assigned evaluation assessment has been officially extended.`
              : `You have been assigned a new computer-based evaluation assessment on VyNexa Connect.`
          }
        </p>

        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #4f46e5;">
          <tr>
            <td style="padding: 5px 0;"><span style="color: #64748b; font-size: 13px; font-weight: 600;">Assessment Title:</span></td>
            <td style="padding: 5px 0; text-align: right;"><strong style="color: #0f172a; font-size: 14px;">${testTitle}</strong></td>
          </tr>
          ${
            description
              ? `<tr>
            <td style="padding: 5px 0;"><span style="color: #64748b; font-size: 13px; font-weight: 600;">Description:</span></td>
            <td style="padding: 5px 0; text-align: right;"><span style="color: #334155; font-size: 13px;">${description}</span></td>
          </tr>`
              : ""
          }
          <tr>
            <td style="padding: 5px 0;"><span style="color: #64748b; font-size: 13px; font-weight: 600;">Duration:</span></td>
            <td style="padding: 5px 0; text-align: right;"><strong style="color: #0f172a; font-size: 14px;">${timeLimitMinutes || 30} Minutes</strong></td>
          </tr>
          <tr>
            <td style="padding: 5px 0;"><span style="color: #64748b; font-size: 13px; font-weight: 600;">Passing Criteria:</span></td>
            <td style="padding: 5px 0; text-align: right;"><strong style="color: #10b981; font-size: 14px;">${passingScore || 50}%</strong></td>
          </tr>
          <tr>
            <td style="padding: 5px 0;"><span style="color: #64748b; font-size: 13px; font-weight: 600;">Proctoring Mode:</span></td>
            <td style="padding: 5px 0; text-align: right;"><strong style="color: ${enableCamera !== false ? "#ef4444" : "#0284c7"}; font-size: 13px;">${enableCamera !== false ? "Webcam Monitoring Required" : "Focus-Only Tracking (No Camera)"}</strong></td>
          </tr>
          <tr>
            <td style="padding: 5px 0;"><span style="color: #64748b; font-size: 13px; font-weight: 600;">Assessment Deadline:</span></td>
            <td style="padding: 5px 0; text-align: right;"><strong style="color: #e11d48; font-size: 13px;">${formattedDeadline}</strong></td>
          </tr>
        </table>

        <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 28px;">
          <p style="color: #b45309; font-size: 13px; font-weight: 600; margin: 0 0 6px;">Secure Testing Environment Rules:</p>
          <ul style="color: #78350f; font-size: 12px; margin: 0; padding-left: 20px; line-height: 1.6;">
            <li>Access is strictly restricted to desktop browsers (1024px or wider).</li>
            <li>Full-screen enforcement is active throughout the test.</li>
            <li>Tab-switching or losing focus logs a violation warning. 2 violations trigger termination.</li>
            ${enableCamera !== false ? "<li>Webcam feed is continuously monitored for unauthorized movement or absence.</li>" : ""}
          </ul>
        </div>

        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="text-align: center;">
          <tr>
            <td align="center">
              <a href="${examUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);">
                Launch Assessment &rarr;
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 12px; margin: 0 0 4px;">
          &copy; ${new Date().getFullYear()} Vyntyra Consultancy Services. All rights reserved.
        </p>
        <p style="color: #94a3b8; font-size: 11px; margin: 0;">
          This is an automated notification from the VyNexa Secure Evaluation Engine.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    let result = await resend.emails.send({
      from: `VyNexa Connect <noreply@vyntyraconsultancyservices.in>`,
      to,
      subject,
      html,
    });

    if (result.error) {
      console.warn("[cbt-email] Primary sender failed, retrying with careers@vyntyraconsultancyservices.in:", result.error.message);
      result = await resend.emails.send({
        from: `VyNexa Connect <careers@vyntyraconsultancyservices.in>`,
        to,
        subject,
        html,
      });
    }

    if (result.error && (result.error.message.includes("domain") || result.error.message.includes("verify") || result.error.message.includes("validation"))) {
      console.warn("[cbt-email] Domain verification issue, retrying with onboarding@resend.dev:", result.error.message);
      result = await resend.emails.send({
        from: `VyNexa Connect <onboarding@resend.dev>`,
        to,
        subject,
        html,
      });
    }

    const supabase = getAdminClient();
    try {
      await supabase.from("automated_email_logs").insert({
        recipient_email: to,
        recipient_name: internName,
        campaign_type: isExtension ? "cbt_deadline_extension" : "cbt_assessment_assigned",
        subject,
        status: result.error ? "failed" : "sent",
        provider_used: "resend",
        resend_message_id: result.data?.id || null,
        error_message: result.error?.message || null,
        created_at: new Date().toISOString(),
      });
    } catch (_) {}

    return { sent: true, id: result.data?.id };
  } catch (err: any) {
    console.error("[CBT Email Dispatch Error]:", err.message);
    return { sent: false, reason: err.message };
  }
}

export const saveGeneratedTestFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    testMetadata: z.any(),
    questions: z.array(z.any())
  }).parse(d))
  .handler(async ({ data: args, context }) => {
    const adminClient = getAdminClient();
    const userId = context.user.id;
    
    const { 
      title, 
      description, 
      target_type, 
      target_id, 
      passing_score, 
      time_limit_minutes, 
      enable_camera, 
      camera_strictness,
      deadline, 
      shuffle_questions,
      show_instant_results,
      max_attempts,
      category 
    } = args.testMetadata;
    
    const sanitizedTargetId = typeof target_id === 'string' ? target_id.trim() : target_id;
    const targetArray = Array.isArray(sanitizedTargetId) 
      ? sanitizedTargetId.filter(Boolean) 
      : (sanitizedTargetId && sanitizedTargetId !== 'none' ? [sanitizedTargetId] : []);

    // 1. Create the CBT Exam with graceful multi-tier fallback
    const fullPayload: any = {
      title: title || 'New AI CBT Exam',
      description: description || 'Generated AI Assessment',
      category: category || 'General',
      passing_score: Number(passing_score) || 50,
      created_by: userId,
      status: 'published',
      allocation_mode: target_type === 'team' ? 'team' : 'individual',
      team_ids: target_type === 'team' ? targetArray : [],
      intern_ids: target_type === 'intern' ? targetArray : [],
      time_limit_minutes: Number(time_limit_minutes) || 30,
      enable_camera: enable_camera !== false,
      camera_required: enable_camera !== false,
      camera_strictness: camera_strictness || 'standard',
      deadline: deadline || null,
      shuffle_questions: Boolean(shuffle_questions),
      show_instant_results: show_instant_results !== false,
      max_attempts: Number(max_attempts) || 1,
    };

    let exam: any = null;
    let examInsertRes = await adminClient.from('cbt_exams').insert(fullPayload).select('id').single();

    if (examInsertRes.error) {
      console.warn("[saveGeneratedTestFn] Primary insert failed, trying reduced payload:", examInsertRes.error.message);
      const reducedPayload = {
        title: title || 'New AI CBT Exam',
        description: description || 'Generated AI Assessment',
        category: category || 'General',
        passing_score: Number(passing_score) || 50,
        created_by: userId,
        status: 'published',
        allocation_mode: target_type === 'team' ? 'team' : 'individual',
        team_ids: target_type === 'team' ? targetArray : [],
        intern_ids: target_type === 'intern' ? targetArray : [],
        time_limit_minutes: Number(time_limit_minutes) || 30,
        enable_camera: enable_camera !== false,
        camera_required: enable_camera !== false,
        deadline: deadline || null,
      };
      examInsertRes = await adminClient.from('cbt_exams').insert(reducedPayload).select('id').single();
    }

    if (examInsertRes.error) {
      console.warn("[saveGeneratedTestFn] Reduced insert failed, trying base table columns:", examInsertRes.error.message);
      const basePayload = {
        title: title || 'New AI CBT Exam',
        description: description || 'Generated AI Assessment',
        category: category || 'General',
        passing_score: Number(passing_score) || 50,
        created_by: userId,
        status: 'published',
        allocation_mode: target_type === 'team' ? 'team' : 'individual',
        team_ids: target_type === 'team' ? targetArray : [],
        intern_ids: target_type === 'intern' ? targetArray : [],
      };
      examInsertRes = await adminClient.from('cbt_exams').insert(basePayload).select('id').single();
    }

    if (examInsertRes.error) {
      console.warn("[saveGeneratedTestFn] Base insert failed, testing without foreign key or array types:", examInsertRes.error.message);
      const safePayload = {
        title: title || 'New AI CBT Exam',
        description: description || 'Generated AI Assessment',
        category: category || 'General',
        passing_score: Number(passing_score) || 50,
        status: 'published',
        allocation_mode: target_type === 'team' ? 'team' : 'individual',
        team_ids: [],
        intern_ids: [],
      };
      examInsertRes = await adminClient.from('cbt_exams').insert(safePayload).select('id').single();
      if (examInsertRes.error || !examInsertRes.data) {
        throw new Error("Failed to create CBT Exam: " + examInsertRes.error.message);
      }
    }

    exam = examInsertRes.data;

    // 2. Insert Questions into cbt_questions with fallback if max_points column is not in DB yet
    const questionsToInsert = args.questions.map((q: any, i: number) => ({
      exam_id: exam.id,
      question_text: q.question_text || `Question ${i + 1}`,
      question_type: q.question_type || 'mcq',
      options: typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || {}),
      correct_answer: typeof q.correct_answer === 'object' && q.correct_answer !== null
        ? (q.correct_answer.id || JSON.stringify(q.correct_answer))
        : String(q.correct_answer ?? ''),
      time_limit_seconds: Number(q.time_limit_seconds) || 60,
      max_points: Number(q.max_points) || 10,
      order_index: i
    }));

    let qInsertRes = await adminClient.from('cbt_questions').insert(questionsToInsert);
    if (qInsertRes.error) {
      console.warn("[saveGeneratedTestFn] Insert questions with max_points failed, retrying without max_points:", qInsertRes.error.message);
      const questionsWithoutPoints = questionsToInsert.map(({ max_points, ...rest }) => rest);
      qInsertRes = await adminClient.from('cbt_questions').insert(questionsWithoutPoints);
      if (qInsertRes.error) {
        throw new Error("Failed to insert CBT questions into Supabase: " + qInsertRes.error.message);
      }
    }

    invalidateCache("admin_cbt_tests");

    // 3. Automated Email Notification
    try {
      let targetEmails: { email: string; name: string }[] = [];
      if (target_type === 'intern' && targetArray.length > 0) {
        const { data: profiles } = await adminClient
          .from('profiles')
          .select('email, full_name')
          .in('id', targetArray);
        if (profiles) {
          targetEmails = profiles.map(p => ({ email: p.email, name: p.full_name }));
        }
      } else if (target_type === 'team' && targetArray.length > 0) {
        const { data: taskProfiles } = await adminClient
          .from('tasks')
          .select('assigned_to, profiles:assigned_to(email, full_name)')
          .in('team_id', targetArray);
        if (taskProfiles) {
          const seen = new Set<string>();
          for (const t of taskProfiles) {
            const prof: any = t.profiles;
            if (prof?.email && !seen.has(prof.email)) {
              seen.add(prof.email);
              targetEmails.push({ email: prof.email, name: prof.full_name || "Intern" });
            }
          }
        }
      }

      for (const target of targetEmails) {
        if (target.email) {
          await sendCbtAssignmentEmail({
            to: target.email,
            internName: target.name,
            testTitle: title || 'New Assessment',
            description,
            timeLimitMinutes: Number(time_limit_minutes) || 30,
            passingScore: Number(passing_score) || 50,
            enableCamera: enable_camera !== false,
            deadline,
            testId: exam.id,
            isExtension: false
          });
        }
      }
    } catch (emailErr) {
      console.warn("[saveGeneratedTestFn] Automated email dispatch encountered an issue:", emailErr);
    }

    return { 
      success: true, 
      testId: exam.id, 
      message: "Exam successfully created and allocated! Candidate notification emails dispatched." 
    };
  });

export const getInternTestSessionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ testId: z.string() }).parse(d))
  .handler(async ({ data: args, context }) => {
    const adminClient = getAdminClient();
    
    const [{ data: test, error: testErr }, { data: questions, error: qErr }, { data: profile }] = await Promise.all([
      adminClient.from('cbt_exams').select('*').eq('id', args.testId).single(),
      adminClient.from('cbt_questions').select('*').eq('exam_id', args.testId).order('order_index', { ascending: true }),
      adminClient.from('profiles').select('id, intern_id, employee_id, full_name, email').eq('id', context.user.id).single()
    ]);
    if (testErr || !test) throw new Error("Test not found");
    
    let safeQuestions = (questions || []).map((q: any) => {
      let options = q.options;
      try { if (typeof options === 'string') options = JSON.parse(options); } catch (e) {}
      return {
        id: q.id,
        question_type: q.question_type,
        question_text: q.question_text,
        options: options,
        max_points: q.max_points || 10,
        time_limit_seconds: q.time_limit_seconds || 60
      };
    });

    if (test.shuffle_questions) {
      safeQuestions = [...safeQuestions].sort(() => Math.random() - 0.5);
    }

    const candidateId = profile?.intern_id || profile?.employee_id || (test.intern_ids && test.intern_ids[0]) || context.user.id.slice(0, 8).toUpperCase();
    
    return { 
      test: {
        ...test,
        internId: candidateId,
        internName: profile?.full_name || profile?.email || "Candidate"
      }, 
      questions: safeQuestions,
      internId: candidateId
    };
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
    let questionsReview: any[] = [];

    for (const q of (questions || [])) {
      const internAnswer = answersObj ? answersObj[q.id] : null;
      let correctAnswer = q.correct_answer;
      try { if (typeof correctAnswer === 'string') correctAnswer = JSON.parse(correctAnswer); } catch(e) {}
      
      let qScore = 0;
      let qFeedback = "";
      let isQuestionCorrect = false;
      let codingVerification: any = null;

      if (q.question_type === 'mcq' || q.question_type === 'true_false') {
        const isCorrect = internAnswer?.id === correctAnswer?.id || internAnswer === correctAnswer?.id || internAnswer === correctAnswer;
        qScore = isCorrect ? (q.max_points || 10) : 0;
        isQuestionCorrect = isCorrect;
        qFeedback = isCorrect ? 'Correct. Selected option matches verified solution.' : 'Incorrect. Option mismatch.';
        totalScore += qScore;
      } else if (q.question_type === 'coding') {
        const studentCode = typeof internAnswer === 'string' ? internAnswer.trim() : (internAnswer ? JSON.stringify(internAnswer) : "");
        if (!studentCode) {
          qScore = 0;
          isQuestionCorrect = false;
          qFeedback = "No code submitted. Output check failed.";
          codingVerification = {
            output_matches: false,
            passed_test_cases: 0,
            total_test_cases: 1,
            actual_output: "None (unanswered)",
            expected_output: "Refer to problem test cases",
            allocated_score: 0
          };
        } else {
          try {
            const prompt = `You are an automated code verification test runner and unit test judge.
EVALUATE CANDIDATE SUBMITTED CODE:
Problem: ${q.question_text}
Reference Context / Required Output / Expected Solution: ${JSON.stringify(correctAnswer)}
Candidate Submitted Code:
\`\`\`
${studentCode}
\`\`\`
Max Possible Points: ${q.max_points || 10}

Verification Instructions:
1. Determine whether the candidate code compiles/runs and produces the EXACT required output.
2. If required output is produced correctly, set output_matches to true and allocate full score (${q.max_points || 10}). If partially correct, allocate proportionate points. If non-working or wrong output, allocate 0.

Respond strictly in valid JSON format:
{
  "output_matches": boolean,
  "allocated_score": number,
  "passed_test_cases": number,
  "total_test_cases": number,
  "actual_output": "...",
  "expected_output": "...",
  "feedback": "..."
}`;
            const response = await ai.models.generateContent({
              model: 'gemini-1.5-flash',
              contents: prompt,
              config: { responseMimeType: 'application/json' }
            });
            const resJson = JSON.parse(response.text || '{}');
            const matches = Boolean(resJson.output_matches);
            qScore = typeof resJson.allocated_score === 'number' 
              ? resJson.allocated_score 
              : (matches ? (q.max_points || 10) : 0);
            isQuestionCorrect = matches || qScore >= ((q.max_points || 10) * 0.7);
            qFeedback = `${matches ? "✓ Required output verified & passed." : "✗ Required output check failed."} ${resJson.feedback || ""}`;
            codingVerification = {
              output_matches: matches,
              passed_test_cases: resJson.passed_test_cases ?? (matches ? 1 : 0),
              total_test_cases: resJson.total_test_cases ?? 1,
              actual_output: resJson.actual_output || "",
              expected_output: resJson.expected_output || "",
              allocated_score: qScore
            };
            totalScore += qScore;
          } catch (e) {
            console.error("[Coding verification error]:", e);
            qScore = 0;
            qFeedback = 'Automated verification error during evaluation.';
          }
        }
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
            isQuestionCorrect = qScore >= ((q.max_points || 10) * 0.6);
            totalScore += qScore;
          } catch (e) {
            qFeedback = 'Error grading with AI.';
          }
        }
      }

      globalAiFeedback[q.id] = { score: qScore, max: q.max_points, feedback: qFeedback, coding_verification: codingVerification };

      questionsReview.push({
        question_id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        intern_answer: internAnswer,
        correct_answer: correctAnswer,
        explanation: q.explanation || "Official pre-marked solution.",
        test_cases: q.test_cases || null,
        coding_verification: codingVerification,
        is_correct: isQuestionCorrect,
        score: qScore,
        max_points: q.max_points || 10,
        feedback: qFeedback
      });

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
    
    const maxPossibleScore = (questions || []).reduce((acc: number, curr: any) => acc + (curr.max_points || 10), 0) || 100;
    const percentage = Math.round((totalScore / maxPossibleScore) * 100);
    const passed = percentage >= (test?.passing_score || 50);

    const submissionSummary = {
      totalScore,
      maxPossibleScore,
      percentage,
      passed,
      passing_score: test?.passing_score || 50,
      questionsReview,
      submittedAt: new Date().toISOString()
    };
    
    await adminClient.from('cbt_submissions').update({
       total_score: totalScore,
       ai_feedback: JSON.stringify(submissionSummary),
       status: 'graded'
    }).eq('id', subId);
    
    invalidateCache("all_cbt_submissions");
    return { 
      success: true, 
      submissionId: subId, 
      score: totalScore, 
      maxPossibleScore, 
      percentage, 
      passed, 
      questionsReview 
    };
  });

export const listAdminTestsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<any[]> => {
    return getOrSetCache("admin_cbt_tests", 10000, async () => {
      const adminClient = getAdminClient();
      const { data } = await adminClient.from('cbt_exams').select('*').order('created_at', { ascending: false });
      return data || [];
    });
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
  .inputValidator((d: unknown) => z.object({ testId: z.string(), submissionId: z.string().optional() }).parse(d))
  .handler(async ({ data: args, context }) => {
    const adminClient = getAdminClient();
    const userId = context.user.id;
    
    let query = adminClient
      .from('cbt_submissions')
      .select('*, cbt_exams(*)')
      .eq('exam_id', args.testId);

    if (args.submissionId) {
      query = query.eq('id', args.submissionId);
    } else {
      query = query.eq('intern_id', userId);
    }

    const { data: sub } = await query.order('started_at', { ascending: false }).limit(1).maybeSingle();
    if (!sub) return null;

    let parsedFeedback: any = null;
    try {
      if (typeof sub.ai_feedback === 'string') {
        parsedFeedback = JSON.parse(sub.ai_feedback);
      }
    } catch {}

    const [{ data: questions }, { data: answers }, { data: logs }] = await Promise.all([
      adminClient.from('cbt_questions').select('*').eq('exam_id', args.testId).order('order_index', { ascending: true }),
      adminClient.from('cbt_answers').select('*').eq('submission_id', sub.id),
      adminClient.from('cbt_malpractice_logs').select('*').eq('submission_id', sub.id).order('timestamp', { ascending: true })
    ]);

    const passingScore = sub.cbt_exams?.passing_score || 50;
    const maxScore = (questions || []).reduce((acc: number, q: any) => acc + (q.max_points || 10), 0) || 100;
    const percentage = parsedFeedback?.percentage ?? Math.round(((sub.total_score || 0) / maxScore) * 100);
    const passed = parsedFeedback?.passed ?? (percentage >= passingScore);

    return {
      ...sub,
      score: sub.total_score,
      percentage,
      passed,
      maxScore,
      passingScore,
      questions: questions || [],
      answers: answers || [],
      questionsReview: parsedFeedback?.questionsReview || null,
      proctoring_logs: logs || []
    };
  });

export const getUniversalSubmissionScoreFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ submissionId: z.string().optional(), testId: z.string().optional() }).parse(d))
  .handler(async ({ data: args }) => {
    const adminClient = getAdminClient();
    let query = adminClient
      .from('cbt_submissions')
      .select('*, cbt_exams(*), profiles:intern_id(id, full_name, email, intern_id)');

    if (args.submissionId) {
      query = query.eq('id', args.submissionId);
    } else if (args.testId) {
      query = query.eq('exam_id', args.testId);
    } else {
      return null;
    }

    const { data: sub } = await query.order('submitted_at', { ascending: false }).limit(1).maybeSingle();
    if (!sub) return null;

    let parsedFeedback: any = null;
    try {
      if (typeof sub.ai_feedback === 'string') {
        parsedFeedback = JSON.parse(sub.ai_feedback);
      }
    } catch {}

    const [{ data: questions }, { data: answers }, { data: logs }] = await Promise.all([
      adminClient.from('cbt_questions').select('*').eq('exam_id', sub.exam_id).order('order_index', { ascending: true }),
      adminClient.from('cbt_answers').select('*').eq('submission_id', sub.id),
      adminClient.from('cbt_malpractice_logs').select('*').eq('submission_id', sub.id).order('timestamp', { ascending: true })
    ]);

    const passingScore = sub.cbt_exams?.passing_score || 50;
    const maxScore = (questions || []).reduce((acc: number, q: any) => acc + (q.max_points || 10), 0) || 100;
    const percentage = parsedFeedback?.percentage ?? Math.round(((sub.total_score || 0) / maxScore) * 100);
    const passed = parsedFeedback?.passed ?? (percentage >= passingScore);

    return {
      submission: sub,
      score: sub.total_score,
      percentage,
      passed,
      maxScore,
      passingScore,
      questions: questions || [],
      answers: answers || [],
      questionsReview: parsedFeedback?.questionsReview || null,
      proctoring_logs: logs || []
    };
  });

export const getAdminTestQuestionsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ testId: z.string() }).parse(d))
  .handler(async ({ data: args }) => {
    const adminClient = getAdminClient();
    const { data: questions } = await adminClient
      .from('cbt_questions')
      .select('*')
      .eq('exam_id', args.testId)
      .order('order_index', { ascending: true });
    return questions || [];
  });

export const recordInternLoginSessionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    sessionId: z.string(),
    expiresAt: z.number(),
    userAgent: z.string().optional()
  }).parse(d))
  .handler(async ({ data: args, context }) => {
    const adminClient = getAdminClient();
    const userId = context.user.id;
    try {
      await adminClient.from("site_settings").upsert({
        id: `intern_session_${userId}`,
        value: {
          user_id: userId,
          session_id: args.sessionId,
          expires_at: new Date(args.expiresAt).toISOString(),
          created_at: new Date().toISOString(),
          duration_days: 7,
          user_agent: args.userAgent || "browser"
        },
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn("[recordInternLoginSessionFn] session log notice:", e);
    }
    return { success: true, sessionId: args.sessionId };
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
    return getOrSetCache("cbt_targets", 10000, async () => {
      const supabase = getAdminClient();
      
      const [{ data: interns }, { data: tasks }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email").in("role", ["intern", "employee"]),
        supabase.from("tasks").select("team_id, team_name").not("team_id", "is", null)
      ]);
      
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
    
    // Fetch all needed data in parallel
    const [{ data: exams }, { data: userTasks }, { data: submissions }] = await Promise.all([
      adminClient.from('cbt_exams').select('*').eq('status', 'published'),
      adminClient.from('tasks').select('team_id').eq('assigned_to', userId).not('team_id', 'is', null),
      adminClient.from('cbt_submissions').select('exam_id').eq('intern_id', userId)
    ]);
    
    const userTeams = Array.from(new Set((userTasks || []).map(t => t.team_id)));
    
    // Filter exams where intern_ids contains userId OR team_ids overlaps with userTeams
    const availableExams = (exams || []).filter(exam => {
      const isTargetedIntern = exam.intern_ids && exam.intern_ids.includes(userId);
      const isTargetedTeam = exam.team_ids && exam.team_ids.some((tid: string) => userTeams.includes(tid));
      return isTargetedIntern || isTargetedTeam;
    });
    
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
    deadline: z.string().optional(),
    enable_camera: z.boolean().optional(),
    camera_strictness: z.string().optional(),
    time_limit_minutes: z.number().optional(),
    passing_score: z.number().optional(),
  }).parse(d))
  .handler(async ({ data: args }) => {
    const adminClient = getAdminClient();
    const { testId, target_type, target_id, deadline, enable_camera, camera_strictness, time_limit_minutes, passing_score } = args;

    const { data: test, error: fetchErr } = await adminClient
      .from('cbt_exams')
      .select('*')
      .eq('id', testId)
      .single();

    if (fetchErr || !test) throw new Error("Exam not found");

    const updatePayload: any = {
      status: 'published',
      allocation_mode: target_type === 'team' ? 'team' : 'individual',
    };

    if (deadline !== undefined) updatePayload.deadline = deadline || null;
    if (enable_camera !== undefined) {
      updatePayload.enable_camera = enable_camera;
      updatePayload.camera_required = enable_camera;
    }
    if (camera_strictness !== undefined) updatePayload.camera_strictness = camera_strictness;
    if (time_limit_minutes !== undefined) updatePayload.time_limit_minutes = Number(time_limit_minutes);
    if (passing_score !== undefined) updatePayload.passing_score = Number(passing_score);

    const safeTargetId = target_id.trim();

    if (target_type === 'team') {
      const existingTeams = Array.isArray(test.team_ids) ? test.team_ids : [];
      updatePayload.team_ids = Array.from(new Set([...existingTeams, safeTargetId].filter(Boolean)));
    } else {
      const existingInterns = Array.isArray(test.intern_ids) ? test.intern_ids : [];
      updatePayload.intern_ids = Array.from(new Set([...existingInterns, safeTargetId].filter(Boolean)));
    }

    let { error: updateErr } = await adminClient
      .from('cbt_exams')
      .update(updatePayload)
      .eq('id', testId);

    if (updateErr) {
      console.warn("[reassignAdminTestFn] Primary update failed, trying safe fallback:", updateErr.message);
      const fallbackPayload: any = {
        status: 'published',
        allocation_mode: target_type === 'team' ? 'team' : 'individual',
      };
      if (deadline !== undefined) fallbackPayload.deadline = deadline || null;
      if (enable_camera !== undefined) fallbackPayload.enable_camera = enable_camera;
      if (time_limit_minutes !== undefined) fallbackPayload.time_limit_minutes = Number(time_limit_minutes);
      
      const fallbackRes = await adminClient.from('cbt_exams').update(fallbackPayload).eq('id', testId);
      if (fallbackRes.error) {
        throw new Error("Failed to assign exam: " + fallbackRes.error.message);
      }
    }

    invalidateCache("admin_cbt_tests");

    // Send notification email to the newly assigned target
    try {
      let targetEmails: { email: string; name: string }[] = [];
      if (target_type === 'intern') {
        const { data: profile } = await adminClient
          .from('profiles')
          .select('email, full_name')
          .eq('id', target_id)
          .single();
        if (profile?.email) {
          targetEmails.push({ email: profile.email, name: profile.full_name });
        }
      } else {
        const { data: taskProfiles } = await adminClient
          .from('tasks')
          .select('assigned_to, profiles:assigned_to(email, full_name)')
          .eq('team_id', target_id);
        if (taskProfiles) {
          const seen = new Set<string>();
          for (const t of taskProfiles) {
            const prof: any = t.profiles;
            if (prof?.email && !seen.has(prof.email)) {
              seen.add(prof.email);
              targetEmails.push({ email: prof.email, name: prof.full_name || "Intern" });
            }
          }
        }
      }

      for (const target of targetEmails) {
        if (target.email) {
          await sendCbtAssignmentEmail({
            to: target.email,
            internName: target.name,
            testTitle: test.title,
            description: test.description,
            timeLimitMinutes: updatePayload.time_limit_minutes || test.time_limit_minutes || 30,
            passingScore: updatePayload.passing_score || test.passing_score || 50,
            enableCamera: updatePayload.enable_camera ?? (test.enable_camera !== false),
            deadline: updatePayload.deadline ?? test.deadline,
            testId,
            isExtension: false
          });
        }
      }
    } catch (err) {
      console.warn("[reassignAdminTestFn] Email notification warning:", err);
    }

    return { success: true, message: "Exam successfully assigned and allocated!" };
  });

export const extendAdminTestDeadlineFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    testId: z.string(),
    deadline: z.string(),
    notifyInterns: z.boolean().optional(),
  }).parse(d))
  .handler(async ({ data: args }) => {
    const adminClient = getAdminClient();
    const { testId, deadline, notifyInterns = true } = args;

    const { data: test, error: fetchErr } = await adminClient
      .from('cbt_exams')
      .select('*')
      .eq('id', testId)
      .single();

    if (fetchErr || !test) throw new Error("Exam not found");

    const { error: updateErr } = await adminClient
      .from('cbt_exams')
      .update({ deadline })
      .eq('id', testId);

    if (updateErr) throw new Error("Failed to extend deadline: " + updateErr.message);

    invalidateCache("admin_cbt_tests");

    if (notifyInterns) {
      try {
        let targetEmails: { email: string; name: string }[] = [];
        if (test.intern_ids && test.intern_ids.length > 0) {
          const { data: profiles } = await adminClient
            .from('profiles')
            .select('email, full_name')
            .in('id', test.intern_ids);
          if (profiles) {
            targetEmails = profiles.map(p => ({ email: p.email, name: p.full_name }));
          }
        }
        if (test.team_ids && test.team_ids.length > 0) {
          const { data: taskProfiles } = await adminClient
            .from('tasks')
            .select('assigned_to, profiles:assigned_to(email, full_name)')
            .in('team_id', test.team_ids);
          if (taskProfiles) {
            const seen = new Set(targetEmails.map(t => t.email));
            for (const t of taskProfiles) {
              const prof: any = t.profiles;
              if (prof?.email && !seen.has(prof.email)) {
                seen.add(prof.email);
                targetEmails.push({ email: prof.email, name: prof.full_name || "Intern" });
              }
            }
          }
        }

        for (const target of targetEmails) {
          if (target.email) {
            await sendCbtAssignmentEmail({
              to: target.email,
              internName: target.name,
              testTitle: test.title,
              description: test.description,
              timeLimitMinutes: test.time_limit_minutes || 30,
              passingScore: test.passing_score || 50,
              enableCamera: test.enable_camera !== false,
              deadline,
              testId,
              isExtension: true
            });
          }
        }
      } catch (err) {
        console.warn("[extendAdminTestDeadlineFn] Email dispatch error:", err);
      }
    }

    return { 
      success: true, 
      message: `Deadline extended to ${new Date(deadline).toLocaleString()}` 
    };
  });

export const getAdminSubmissionDetailFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ submissionId: z.string() }).parse(d))
  .handler(async ({ data: args }) => {
    const adminClient = getAdminClient();
    const { data: submission, error: subErr } = await adminClient
      .from('cbt_submissions')
      .select('*, profiles(id, full_name, email, intern_id), cbt_exams(*)')
      .eq('id', args.submissionId)
      .single();

    if (subErr || !submission) throw new Error("Submission not found");

    const [{ data: answers }, { data: malpracticeLogs }, { data: questions }] = await Promise.all([
      adminClient.from('cbt_answers').select('*').eq('submission_id', args.submissionId),
      adminClient.from('cbt_malpractice_logs').select('*').eq('submission_id', args.submissionId).order('timestamp', { ascending: true }),
      adminClient.from('cbt_questions').select('*').eq('exam_id', submission.exam_id).order('order_index', { ascending: true }),
    ]);

    return {
      submission,
      answers: answers || [],
      malpracticeLogs: malpracticeLogs || [],
      questions: questions || [],
    };
  });

export const overrideSubmissionScoreFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    submissionId: z.string(),
    newScore: z.number().min(0).max(100),
    reviewRemarks: z.string().optional()
  }).parse(d))
  .handler(async ({ data: args }) => {
    const adminClient = getAdminClient();
    const { error } = await adminClient
      .from('cbt_submissions')
      .update({
        total_score: args.newScore,
        ai_feedback: args.reviewRemarks || "Score manually verified and updated by administrator.",
        status: 'graded'
      })
      .eq('id', args.submissionId);

    if (error) throw new Error(error.message);
    invalidateCache("all_cbt_submissions");
    return { success: true, message: "Submission score updated successfully!" };
  });

export const listAllCbtSubmissionsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    return getOrSetCache("all_cbt_submissions", 5000, async () => {
      const adminClient = getAdminClient();
      const { data: subs, error } = await adminClient
        .from('cbt_submissions')
        .select('*, cbt_exams(title, passing_score), profiles(full_name, email, intern_id)')
        .order('submitted_at', { ascending: false });
      if (error) {
        console.error(error);
        return [];
      }
      return subs || [];
    });
  });

export const grantInternRetakeFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    submissionId: z.string(),
    reason: z.string().optional()
  }).parse(d))
  .handler(async ({ data: args }) => {
    const adminClient = getAdminClient();
    const { submissionId, reason } = args;

    const { data: sub, error: subErr } = await adminClient
      .from('cbt_submissions')
      .select('*, profiles(email, full_name), cbt_exams(title, id)')
      .eq('id', submissionId)
      .single();

    if (subErr || !sub) throw new Error("Submission not found");

    // Cleanly delete submission and answers to allow fresh retake
    await adminClient.from('cbt_answers').delete().eq('submission_id', submissionId);
    await adminClient.from('cbt_malpractice_logs').delete().eq('submission_id', submissionId);
    await adminClient.from('cbt_submissions').delete().eq('id', submissionId);

    invalidateCache("all_cbt_submissions");

    // Send automated email to candidate
    const candidateEmail = sub.profiles?.email;
    if (candidateEmail) {
      const apiKey = getEnv("RESEND_API_KEY");
      if (apiKey) {
        try {
          const { Resend } = await import("resend");
          const resend = new Resend(apiKey);
          const appUrl = "https://vynexaconnect.vyntyraconsultancyservices.in";
          await resend.emails.send({
            from: "VyNexa Connect <noreply@vyntyraconsultancyservices.in>",
            to: candidateEmail,
            subject: `[VyNexa Connect] Retake Approved: ${sub.cbt_exams?.title || "Assessment"}`,
            html: `
              <div style="font-family: sans-serif; padding: 24px; color: #1e293b;">
                <h2 style="color: #059669;">Assessment Retake Approved</h2>
                <p>Hello <strong>${sub.profiles?.full_name || "Candidate"}</strong>,</p>
                <p>Your previous assessment submission for <strong>${sub.cbt_exams?.title || "Assessment"}</strong> has been officially reset by the administrator.</p>
                <p>You may now launch and attempt the assessment again.</p>
                ${reason ? `<p><strong>Administrator Note:</strong> ${reason}</p>` : ""}
                <div style="margin-top: 24px;">
                  <a href="${appUrl}/cbt/${sub.cbt_exams?.id || sub.exam_id}" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                    Launch Retake Assessment &rarr;
                  </a>
                </div>
              </div>
            `
          });
        } catch (err) {
          console.warn("[grantInternRetakeFn] Email warning:", err);
        }
      }
    }

    return { success: true, message: "Attempt reset! Intern has been granted a fresh retake and notified via email." };
  });

export const clearSubmissionStrikesFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    submissionId: z.string(),
  }).parse(d))
  .handler(async ({ data: args }) => {
    const adminClient = getAdminClient();
    await adminClient.from('cbt_malpractice_logs').delete().eq('submission_id', args.submissionId);
    await adminClient.from('cbt_submissions').update({ malpractice_warnings: 0 }).eq('id', args.submissionId);
    invalidateCache("all_cbt_submissions");
    return { success: true, message: "All violations and strikes cleared for this candidate." };
  });
