// Server-only helper that uses Lovable AI Gateway to generate tailored
// interview questions from an applicant's resume + role.
// Called fire-and-forget after submission and on-demand from the admin panel.
import { supabase } from "@/integrations/supabase/client";

interface Args {
  applicationId: string;
  resumePath: string | null;
  roleApplied: string;
  fullName: string;
  yearsExperience?: string | null;
}

const MODEL = "google/gemini-3-flash-preview";
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export async function generateInterviewQuestions(args: Args): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

  // Load resume if PDF (only PDF is reliably supported multimodal). For other
  // types, fall back to role-only generation.
  let filePart: any = null;
  if (args.resumePath && /\.pdf$/i.test(args.resumePath)) {
    try {
        const { data, error } = await supabase.storage.from('default').download(args.resumePath);
        
        if (error || !data) {
            throw new Error(error?.message || "File download failed");
        }

        const buffer = await data.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);
        
        // Base64 encode
        let bin = "";
        for (let i = 0; i < uint8Array.length; i++) bin += String.fromCharCode(uint8Array[i]);
        const b64 = btoa(bin);
        filePart = {
            type: "file",
            file: {
            filename: "resume.pdf",
            file_data: `data:application/pdf;base64,${b64}`,
            },
        };
    } catch (e) {
        console.warn("Failed to load resume for interview questions:", e);
    }
  }

  const instruction = `You are a senior technical recruiter at Vyntyra Consultancy Services, hiring for **Project VyNexa** (a next-generation search engine).

Candidate: ${args.fullName}
Role applied: ${args.roleApplied}
Experience: ${args.yearsExperience || "not stated"}

${filePart ? "Analyse the attached resume." : "No parseable resume was attached; base questions on the role and experience level."}

Generate a structured interview kit as clean Markdown with these sections:
1. **Candidate Summary** — 2-3 sentences on background and fit.
2. **Screening Questions** (5) — quick behavioural / background.
3. **Technical / Role-Specific Questions** (7) — tied to the role and any resume specifics.
4. **Deep-Dive Questions** (3) — probing questions on the candidate's stated experience.
5. **Red Flags to Probe** (2-3) — gaps, inconsistencies, or areas to verify.

Keep it concise, direct, and interview-ready. No preamble.`;

  const contentBlocks: any[] = [{ type: "text", text: instruction }];
  if (filePart) contentBlocks.push(filePart);

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: contentBlocks }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI Gateway ${res.status}: ${body.slice(0, 300)}`);
  }

  const json = await res.json();
  const text: string = json?.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) throw new Error("Empty response from AI");

  await supabase
    .from("applications")
    .update({
      interview_questions: text,
      interview_questions_generated_at: new Date().toISOString(),
    })
    .eq('id', args.applicationId);

  return text;
}
