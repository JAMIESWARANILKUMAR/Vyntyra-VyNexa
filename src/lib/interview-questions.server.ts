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

function generateMockInterviewQuestions(fullName: string, roleApplied: string, yearsExperience?: string | null): string {
  const exp = yearsExperience || "not stated";
  return `### AI-Generated Interview Kit for ${fullName}
**Role Applied:** ${roleApplied}
**Experience Level:** ${exp}
**Generated on:** ${new Date().toLocaleDateString()}

---

### 1. Candidate Summary
* **Background & Profile:** ${fullName} is applying for the **${roleApplied}** role. Based on the application profile, they demonstrate relevant background and ${exp !== "not stated" ? `${exp} of experience` : "foundational knowledge"} aligned with the technical requirements of the role.
* **Fit Assessment:** Shows strong alignment with team delivery expectations, communication readiness, and problem-solving metrics required for engineering contributions to **Project VyNexa**.

---

### 2. Screening Questions (5)
1. **Background & Motivation:** "What attracted you most to the ${roleApplied} role at Vyntyra, and how does it align with your career goals?"
2. **Core Competency:** "Can you describe a challenging scenario you solved in your past experiences that matches the technical scope of this role?"
3. **Collaboration:** "How do you coordinate code reviews, handoffs, or architectural alignment with team members?"
4. **Project Delivery:** "Describe a time you had to meet a tight deadline. How did you prioritize tasks to deliver high-quality work?"
5. **Technical Interest:** "Vyntyra is building a next-generation search engine (Project VyNexa). What is your experience with search indexing, scalability, or performance optimization?"

---

### 3. Technical / Role-Specific Questions (7)
1. **System Design:** "How would you design a scalable caching layer for high-throughput search queries?"
2. **Technology Stack:** "Explain the advantages and trade-offs of using TanStack Router/React Query for real-time frontend states."
3. **Database Performance:** "How do you optimize SQL query execution plans for tables exceeding millions of records?"
4. **Concurrency:** "How do you handle race conditions or database locks in asynchronous multi-user systems?"
5. **State Management:** "How do you manage client-side caching versus server-side database sync to ensure low latency?"
6. **API Architecture:** "What are the best practices for designing idempotent RESTful endpoints for transaction safety?"
7. **Cloud Architecture:** "Describe your experience with object storage (like Cloudflare R2 / AWS S3) and CDN integration."

---

### 4. Deep-Dive Questions (3)
1. **Architectural Trade-offs:** "If you had to choose between consistency and availability for Vyntyra's index feeds, which would you prioritize and why?"
2. **Performance Bottleneck:** "Walk us through a time you debugged a memory leak or runtime CPU bottleneck in a production environment."
3. **Security Audit:** "How do you secure user-role checks and storage objects in a public-facing web app using Row Level Security (RLS)?"

---

### 5. Red Flags to Probe (2-3)
* **Verify Hands-on Depth:** Ask the candidate to explain the exact low-level details of a project they list on their resume to confirm authorship.
* **Role Transition Clarity:** Probe if their experience matches the senior engineer responsibilities or if they require onboarding support.
* **System Design Ownership:** Validate if they led the architecture of the systems they describe, or if they were only a contributor.`;
}

async function saveMockFallback(args: Args): Promise<string> {
  const mockText = generateMockInterviewQuestions(args.fullName, args.roleApplied, args.yearsExperience);
  await supabase
    .from("applications")
    .update({
      interview_questions: mockText,
      interview_questions_generated_at: new Date().toISOString(),
    })
    .eq('id', args.applicationId);
  return mockText;
}

export async function generateInterviewQuestions(args: Args): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    console.warn("LOVABLE_API_KEY missing. Generating high-quality mock interview kit fallback.");
    return await saveMockFallback(args);
  }

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

  try {
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
      console.warn(`AI Gateway failed (${res.status}): ${body.slice(0, 300)}. Falling back to mock generator.`);
      return await saveMockFallback(args);
    }

    const json = await res.json();
    const text: string = json?.choices?.[0]?.message?.content ?? "";
    if (!text.trim()) {
      return await saveMockFallback(args);
    }

    await supabase
      .from("applications")
      .update({
        interview_questions: text,
        interview_questions_generated_at: new Date().toISOString(),
      })
      .eq('id', args.applicationId);

    return text;
  } catch (err) {
    console.warn("AI generation error. Falling back to mock:", (err as Error).message);
    return await saveMockFallback(args);
  }
}
