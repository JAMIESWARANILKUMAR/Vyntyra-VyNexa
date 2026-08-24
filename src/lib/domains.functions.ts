import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdminClient } from "@/integrations/supabase/admin";

const supabase = new Proxy({} as any, { get: (_, prop) => (getAdminClient() as any)[prop] });

export interface SubDomainItem {
  id: string;
  name: string;
  is_new?: boolean;
}

export interface DomainItem {
  id: string;
  name: string;
  category: "Internship" | "Full Time Role" | "Both";
  is_new?: boolean;
  subdomains: SubDomainItem[];
}

export const DEFAULT_CAREER_DOMAINS: DomainItem[] = [
  {
    id: "engineering-tech",
    name: "Engineering & Technology",
    category: "Both",
    is_new: false,
    subdomains: [
      { id: "full-stack", name: "Full-Stack Development (React/Next.js + Node)", is_new: false },
      { id: "mern", name: "MERN Stack (MongoDB, Express, React, Node.js)", is_new: false },
      { id: "mean", name: "MEAN Stack (MongoDB, Express, Angular, Node.js)", is_new: false },
      { id: "frontend", name: "Frontend Engineering (React, Next.js, Vue, UI/UX)", is_new: false },
      { id: "backend", name: "Backend Engineering (Node.js, Python, Go, PostgreSQL)", is_new: false },
      { id: "devops-cloud", name: "DevOps, Cloud & Infrastructure (AWS, Docker, K8s)", is_new: false },
      { id: "mobile-dev", name: "Mobile App Development (Flutter, React Native, iOS, Android)", is_new: false },
      { id: "data-eng", name: "Data Engineering & Pipeline Systems", is_new: false },
      { id: "qa-testing", name: "QA & Automated Software Testing", is_new: false },
      { id: "cybersec", name: "Cybersecurity & Information Security", is_new: true },
    ],
  },
  {
    id: "marketing-growth",
    name: "Marketing & Growth",
    category: "Both",
    is_new: false,
    subdomains: [
      { id: "digital-mktg", name: "Digital Marketing & Growth Hacking", is_new: false },
      { id: "content-strat", name: "Content Strategy & Copywriting", is_new: false },
      { id: "seo-sem", name: "SEO & SEM Optimization", is_new: false },
      { id: "social-media", name: "Social Media Strategy & Management", is_new: false },
      { id: "perf-mktg", name: "Performance Marketing & Paid Ads (Meta, Google)", is_new: false },
      { id: "brand-pr", name: "Brand Strategy & Public Relations (PR)", is_new: false },
      { id: "email-ops", name: "Email Marketing & Lead Lifecycle Operations", is_new: false },
    ],
  },
  {
    id: "customer-ops",
    name: "Customer Operations",
    category: "Both",
    is_new: false,
    subdomains: [
      { id: "cust-support", name: "Customer Support & Helpdesk Specialist", is_new: false },
      { id: "tech-support", name: "Technical Support Engineer (L1/L2/L3)", is_new: false },
      { id: "client-success", name: "Client Success & Account Management", is_new: false },
      { id: "service-desk", name: "Service Desk & SLA Operations", is_new: false },
      { id: "cx-specialist", name: "Customer Experience (CX) Specialist", is_new: false },
    ],
  },
  {
    id: "rnd",
    name: "Research & Development (R&D)",
    category: "Both",
    is_new: true,
    subdomains: [
      { id: "aiml", name: "Artificial Intelligence & Machine Learning (AI/ML)", is_new: true },
      { id: "deep-learning", name: "Deep Learning & LLM Fine-Tuning", is_new: true },
      { id: "data-sci", name: "Data Science & Predictive Analytics", is_new: false },
      { id: "robotics", name: "Robotics & Embedded Hardware Systems", is_new: false },
      { id: "scientific-res", name: "Applied Scientific Research & Prototyping", is_new: false },
    ],
  },
  {
    id: "design-product",
    name: "Design & Product",
    category: "Both",
    is_new: false,
    subdomains: [
      { id: "uiux", name: "UI/UX Design & User Research", is_new: false },
      { id: "product-design", name: "Product Design (Figma, Design Systems)", is_new: false },
      { id: "graphic-design", name: "Graphic Design & Visual Branding", is_new: false },
      { id: "motion-video", name: "Motion Graphics & Video Production", is_new: false },
      { id: "tech-pm", name: "Technical Product Management", is_new: false },
    ],
  },
  {
    id: "finance-hr",
    name: "Finance & HR",
    category: "Both",
    is_new: false,
    subdomains: [
      { id: "hr-talent", name: "HR Operations & Talent Acquisition", is_new: false },
      { id: "payroll-comp", name: "Payroll & Compensation Specialist", is_new: false },
      { id: "fin-analyst", name: "Financial Analyst & Corporate Accounting", is_new: false },
      { id: "legal-comp", name: "Legal, Regulatory & Compliance Specialist", is_new: false },
      { id: "biz-dev", name: "Business Development & Corporate Strategy", is_new: false },
    ],
  },
];

async function checkIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("*")
    .eq("user_id", userId)
    .eq("role", "admin");
  return !error && data && data.length > 0;
}

export const listCareerDomains = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", "career_domains_config")
      .maybeSingle();

    if (data && Array.isArray(data.value) && data.value.length > 0) {
      return data.value as DomainItem[];
    }
  } catch (e) {
    console.warn("[listCareerDomains] fetch warning, using defaults:", e);
  }

  return DEFAULT_CAREER_DOMAINS;
});

export const saveCareerDomains = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: unknown) =>
      z.object({
        domains: z.array(
          z.object({
            id: z.string(),
            name: z.string().min(1),
            category: z.enum(["Internship", "Full Time Role", "Both"]),
            is_new: z.boolean().optional(),
            subdomains: z.array(
              z.object({
                id: z.string(),
                name: z.string().min(1),
                is_new: z.boolean().optional(),
              })
            ),
          })
        ),
      }).parse(d)
  )
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    await supabase.from("site_settings").upsert({
      id: "career_domains_config",
      value: data.domains,
      enabled: true,
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    });

    return { success: true, count: data.domains.length };
  });

export const addOrUpdateCareerDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: unknown) =>
      z.object({
        domainName: z.string().min(2),
        category: z.enum(["Internship", "Full Time Role", "Both"]).default("Both"),
        isNew: z.boolean().default(true),
        subdomainName: z.string().optional(),
      }).parse(d)
  )
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    let currentDomains: DomainItem[] = await listCareerDomains();

    const existingDomainIdx = currentDomains.findIndex(
      (d) => d.name.toLowerCase() === data.domainName.toLowerCase()
    );

    if (existingDomainIdx >= 0) {
      // Add subdomain to existing domain
      if (data.subdomainName && data.subdomainName.trim()) {
        const subName = data.subdomainName.trim();
        const subExists = currentDomains[existingDomainIdx].subdomains.some(
          (s) => s.name.toLowerCase() === subName.toLowerCase()
        );
        if (!subExists) {
          currentDomains[existingDomainIdx].subdomains.push({
            id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: subName,
            is_new: data.isNew,
          });
        }
      } else {
        currentDomains[existingDomainIdx].is_new = data.isNew;
        currentDomains[existingDomainIdx].category = data.category;
      }
    } else {
      // Create new domain
      const newDomain: DomainItem = {
        id: `dom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: data.domainName.trim(),
        category: data.category,
        is_new: data.isNew,
        subdomains: data.subdomainName?.trim()
          ? [
              {
                id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                name: data.subdomainName.trim(),
                is_new: data.isNew,
              },
            ]
          : [],
      };
      currentDomains.push(newDomain);
    }

    await supabase.from("site_settings").upsert({
      id: "career_domains_config",
      value: currentDomains,
      enabled: true,
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    });

    return { success: true, domains: currentDomains };
  });

export const removeCareerDomainOrSubdomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: unknown) =>
      z.object({
        domainId: z.string(),
        subdomainId: z.string().optional(),
      }).parse(d)
  )
  .handler(async ({ data, context }) => {
    if (!await checkIsAdmin(context.userId)) throw new Error("Forbidden");

    let currentDomains: DomainItem[] = await listCareerDomains();

    if (data.subdomainId) {
      // Remove specific subdomain
      currentDomains = currentDomains.map((dom) => {
        if (dom.id === data.domainId) {
          return {
            ...dom,
            subdomains: dom.subdomains.filter((s) => s.id !== data.subdomainId),
          };
        }
        return dom;
      });
    } else {
      // Remove whole domain
      currentDomains = currentDomains.filter((dom) => dom.id !== data.domainId);
    }

    await supabase.from("site_settings").upsert({
      id: "career_domains_config",
      value: currentDomains,
      enabled: true,
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    });

    return { success: true, domains: currentDomains };
  });
