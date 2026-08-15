import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdminClient } from "@/integrations/supabase/admin";

const supabase = new Proxy({} as any, { get: (_, prop) => (getAdminClient() as any)[prop] });

const aiTaskSchema = z.object({
  documentText: z.string().min(1, "Document text is required"),
});

export const parseDocumentAndAssignTasks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => aiTaskSchema.parse(d))
  .handler(async ({ data, context }) => {
    // 1. Ensure admin
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', context.userId).single();
    if (!roleData || (roleData.role !== 'admin' && roleData.role !== 'super_admin')) {
      throw new Error("Unauthorized. Only admins can use AI task assignment.");
    }

    // 2. Call AI API
    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("No AI API Key configured. Please add GEMINI_API_KEY to your environment variables.");
    }

    const prompt = `You are an AI assistant for an internship management system.
Your goal is to extract actionable tasks from the following document or syllabus and map them to domains.
Domains: tech, marketing, hr, design, operations, management, sales, general.

Output strictly as a JSON array of objects with this structure, and NOTHING else (no markdown wrappers):
[
  {
    "title": "Task Title",
    "description": "Detailed description of the task based on the document",
    "domain": "tech",
    "priority": "medium"
  }
]

Document Text:
${data.documentText.slice(0, 10000)}
`;

    let aiTasks = [];
    try {
      if (process.env.GEMINI_API_KEY) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          }),
        });
        const result = await response.json();
        if (result.error) throw new Error(result.error.message);
        const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
        aiTasks = JSON.parse(textResponse || "[]");
      } else {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
          }),
        });
        const result = await response.json();
        if (result.error) throw new Error(result.error.message);
        
        const rawJson = result.choices?.[0]?.message?.content || "[]";
        // Attempt to parse, handling if it wrapped in an object like { tasks: [] }
        const parsed = JSON.parse(rawJson);
        aiTasks = Array.isArray(parsed) ? parsed : (parsed.tasks || []);
      }
    } catch (e: any) {
      console.error("AI parse error:", e);
      throw new Error("Failed to parse document with AI: " + e.message);
    }

    if (!aiTasks || !Array.isArray(aiTasks) || aiTasks.length === 0) {
      throw new Error("AI did not return any valid tasks from the document.");
    }

    // 3. Fetch all active interns to assign tasks randomly per domain
    const { data: interns, error: internsErr } = await supabase
      .from('profiles')
      .select('id, department')
      .in('role', ['intern', 'intern_student']);
      
    if (internsErr) throw new Error("Failed to fetch interns: " + internsErr.message);

    const internsByDomain = (interns || []).reduce((acc: any, intern: any) => {
      const d = (intern.department || 'general').toLowerCase();
      if (!acc[d]) acc[d] = [];
      acc[d].push(intern.id);
      return acc;
    }, {});

    const allInternIds = (interns || []).map((i: any) => i.id);
    const assignedTasks = [];

    // 4. Assign tasks randomly
    for (const task of aiTasks) {
      const tDomain = (task.domain || "general").toLowerCase();
      const domainInterns = internsByDomain[tDomain] && internsByDomain[tDomain].length > 0 
        ? internsByDomain[tDomain] 
        : allInternIds; // Fallback to any intern if domain has no interns

      if (domainInterns.length === 0) continue;

      // Pick random intern
      const randomInternId = domainInterns[Math.floor(Math.random() * domainInterns.length)];

      const payload = {
        title: task.title,
        description: task.description,
        assigned_to: randomInternId,
        priority: task.priority || 'medium',
        status: 'pending',
        is_pool_task: false,
        target_role: 'intern',
        created_by: context.userId
      };

      const { data: createdTask, error: err } = await supabase.from('tasks').insert(payload).select().single();
      if (err) console.error("Error creating AI task:", err);
      if (createdTask) assignedTasks.push(createdTask);
    }

    return { success: true, parsedCount: aiTasks.length, assignedCount: assignedTasks.length };
  });
