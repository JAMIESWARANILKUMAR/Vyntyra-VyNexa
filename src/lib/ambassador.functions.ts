import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getAdminClient } from "@/integrations/supabase/admin";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface AmbassadorRegistration {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  college_name: string;
  degree_branch: string;
  graduation_year: string;
  city_state: string;
  linkedin_profile?: string;
  motivation?: string;
  created_at: string;
  status: "pending" | "shortlisted" | "enrolled";
}

export interface AmbassadorProductItem {
  id: string;
  title: string;
  subtitle: string;
  category: "Welcome Kit" | "Apparel" | "Gear" | "Drinkware" | "Gadgets" | "Travel Retreat";
  image_url: string;
  desc: string;
  badge: string;
  badge_style: string;
  is_active: boolean;
  featured_in_gadgets?: boolean;
}

export interface AmbassadorPillarItem {
  id: string;
  title: string;
  highlight: string;
  desc: string;
  badgeColor: string;
  image: string;
  icon_name: string;
}

export interface AmbassadorFaqItem {
  id: string;
  q: string;
  a: string;
}

export interface AmbassadorThemeSettings {
  page_bg_color: string;
  page_bg_secondary: string;
  glow_primary: string;
  glow_secondary: string;
  glow_accent: string;
  hero_badge_bg: string;
  hero_badge_border: string;
  hero_badge_text: string;
  hero_heading_gradient_start: string;
  hero_heading_gradient_mid: string;
  hero_heading_gradient_end: string;
  hero_description_color: string;
  card_bg_color: string;
  card_border_color: string;
  primary_btn_bg_start: string;
  primary_btn_bg_end: string;
  primary_btn_text: string;
  accent_text_color: string;
}

export interface AmbassadorProgramSettings {
  // Application Entry Controls
  applications_enabled: boolean;
  disabled_notice: string;
  cohort_name: string;
  target_rewards: string;

  // Ultra-Theme Colors (Text, Backgrounds, Buttons, Glows)
  theme: AmbassadorThemeSettings;

  // Hero Section Customization
  hero: {
    badge_text: string;
    title_prefix: string;
    title_gradient: string;
    description: string;
    primary_cta_label: string;
    secondary_cta_label: string;
    metrics: Array<{ value: string; label: string; color: string }>;
  };

  // Perks & Pillars
  pillars_section: {
    badge_text: string;
    heading: string;
    description: string;
    pillars: AmbassadorPillarItem[];
  };

  // Gadgets Showcase Section
  gadgets_section: {
    badge_text: string;
    heading: string;
    description: string;
    callout_title: string;
    callout_desc: string;
    callout_footer: string;
  };

  // Curated Travel Retreat Section
  retreat_section: {
    badge_text: string;
    heading: string;
    description: string;
    image_url: string;
    bullets: string[];
    card_title: string;
    card_subtitle: string;
    card_desc: string;
    card_cta_label: string;
  };

  // FAQ Section
  faqs: AmbassadorFaqItem[];

  // Pre-Registration Form Section
  form_section: {
    badge_text: string;
    heading: string;
    description: string;
    quick_pass_banner_title: string;
    quick_pass_banner_desc: string;
    submit_btn_text: string;
    confirmation_title: string;
    confirmation_message: string;
  };

  // Coming Soon Popup Message Customization
  popup: {
    badge: string;
    title: string;
    subtitle: string;
    announcement_message: string;
    rewards_text: string;
    perks_summary: string;
    ticket_label: string;
  };

  // Backwards compatibility legacy flat fields
  popup_title?: string;
  popup_subtitle?: string;
  popup_badge?: string;
  popup_announcement_message?: string;
  popup_rewards_text?: string;
  popup_perks_summary?: string;

  // Physical Swags, Goodies & Gadgets Photography
  products: AmbassadorProductItem[];
}

export const DEFAULT_AMBASSADOR_PRODUCTS: AmbassadorProductItem[] = [
  {
    id: "prod-welcome-box",
    category: "Welcome Kit",
    title: "Executive IRA Corporate Welcome Box",
    subtitle: "Custom IRA Badge & Official Metal ID",
    image_url: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800&auto=format&fit=crop",
    desc: "Luxury unboxing box with personalized institutional associate ID card, custom metallic IRA badge, executive lanyard, pen, notebook, and collectible laptop stickers.",
    badge: "Guaranteed Upon Onboarding",
    badge_style: "border-amber-400/40 bg-amber-500/20 text-amber-300",
    is_active: true,
  },
  {
    id: "prod-hoodie",
    category: "Apparel",
    title: "Vyntyra Executive Embroidered Hoodie",
    subtitle: "Premium Heavyweight Cotton Fleece",
    image_url: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=800&auto=format&fit=crop",
    desc: "Ultra-comfortable matte obsidian black hoodie featuring high-density 3D embroidered Vyntyra crest and institutional relations sleeve patch.",
    badge: "Milestone Perk",
    badge_style: "border-pink-400/40 bg-pink-500/20 text-pink-300",
    is_active: true,
  },
  {
    id: "prod-backpack",
    category: "Gear",
    title: "All-Weather Technical Campus Backpack",
    subtitle: "Padded Laptop Compartment & USB Port",
    image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800&auto=format&fit=crop",
    desc: "Water-resistant ballistic nylon tech backpack with dedicated 16-inch laptop sleeve, hidden anti-theft pockets, and ergonomic airflow back padding.",
    badge: "Milestone Reward",
    badge_style: "border-indigo-400/40 bg-indigo-500/20 text-indigo-300",
    is_active: true,
  },
  {
    id: "prod-polo",
    category: "Apparel",
    title: "Corporate Technical Polo Shirt",
    subtitle: "Breathable Piqué Cotton Fabric",
    image_url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop",
    desc: "Official associate polo shirt engineered with moisture-wicking weave and embroidered institutional insignia for campus meetings and conferences.",
    badge: "Associate Uniform",
    badge_style: "border-sky-400/40 bg-sky-500/20 text-sky-300",
    is_active: true,
  },
  {
    id: "prod-laptop-sleeve",
    category: "Gear",
    title: "Executive Padded Laptop Sleeve",
    subtitle: "Shockproof Vegan Leather & Suede",
    image_url: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop",
    desc: "Slimline executive laptop folio lined with microfiber fleece and embossed with the signature metallic Vyntyra seal.",
    badge: "Executive Gear",
    badge_style: "border-purple-400/40 bg-purple-500/20 text-purple-300",
    is_active: true,
  },
  {
    id: "prod-flask",
    category: "Drinkware",
    title: "Matte Insulated Steel Thermal Flask",
    subtitle: "Double-Walled 24hr Cold / 12hr Hot",
    image_url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=800&auto=format&fit=crop",
    desc: "Food-grade 304 stainless steel flask with temperature retention and laser-etched associate credentials.",
    badge: "Daily Essential",
    badge_style: "border-emerald-400/40 bg-emerald-500/20 text-emerald-300",
    is_active: true,
  },
  {
    id: "prod-powerbank",
    category: "Gadgets",
    title: "High-Capacity Fast-Charge Powerbank",
    subtitle: "20,000mAh Dual Type-C PD 65W",
    image_url: "https://images.unsplash.com/photo-1609592426815-397750868a25?q=80&w=800&auto=format&fit=crop",
    desc: "High-speed 20,000mAh portable charger with LED digital indicator and laser-etched Vyntyra badge.",
    badge: "Essential Tech",
    badge_style: "border-sky-400/40 bg-sky-500/20 text-sky-300",
    is_active: true,
    featured_in_gadgets: true,
  },
  {
    id: "prod-earbuds",
    category: "Gadgets",
    title: "Active Noise-Canceling (ANC) Earbuds",
    subtitle: "Bluetooth 5.4 Ultra-Low Latency",
    image_url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=800&auto=format&fit=crop",
    desc: "Environmental noise cancellation with 35dB hybrid ANC and 40-hour total battery life with wireless charging case.",
    badge: "Audio Excellence",
    badge_style: "border-sky-400/40 bg-sky-500/20 text-sky-300",
    is_active: true,
    featured_in_gadgets: true,
  },
  {
    id: "prod-soundbar",
    category: "Gadgets",
    title: "Cinematic Bluetooth Soundbar",
    subtitle: "Deep-Bass Dual Acoustic Drivers",
    image_url: "https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=800&auto=format&fit=crop",
    desc: "Portable stereo soundbar engineered for clear webinar presentations, dorm gaming, and pitch meetings.",
    badge: "Acoustic Gear",
    badge_style: "border-sky-400/40 bg-sky-500/20 text-sky-300",
    is_active: true,
    featured_in_gadgets: true,
  },
  {
    id: "prod-smartwatch",
    category: "Gadgets",
    title: "Next-Gen AMOLED Smartwatch",
    subtitle: "Bluetooth Calling & Health Sensors",
    image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop",
    desc: "High-resolution AMOLED display, heart rate, SpO2 tracking, multiple sports modes, and corporate executive watch faces.",
    badge: "Wearable Tech",
    badge_style: "border-sky-400/40 bg-sky-500/20 text-sky-300",
    is_active: true,
    featured_in_gadgets: true,
  },
  {
    id: "prod-webcam",
    category: "Gadgets",
    title: "Full HD 1080p AI Auto-Focus Webcam",
    subtitle: "Dual Stereo Mics & Privacy Shutter",
    image_url: "https://images.unsplash.com/photo-1588508065123-287b28e013da?q=80&w=800&auto=format&fit=crop",
    desc: "Wide-angle glass optics, dual noise-filtering microphones, and physical privacy shutter for interviews and webinars.",
    badge: "Remote Setup",
    badge_style: "border-sky-400/40 bg-sky-500/20 text-sky-300",
    is_active: true,
    featured_in_gadgets: true,
  },
  {
    id: "prod-retreat",
    category: "Travel Retreat",
    title: "Top 10 Curated Leadership Retreat",
    subtitle: "All-Expenses-Paid Corporate Getaway",
    image_url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop",
    desc: "Pinnacle achievement retreat featuring luxury resort stays, flight tickets, leadership dinners with directors, and adventure excursions.",
    badge: "Pinnacle Top 10",
    badge_style: "border-pink-400/40 bg-pink-500/20 text-pink-300",
    is_active: true,
    featured_in_gadgets: false,
  },
];

export const DEFAULT_AMBASSADOR_PILLARS: AmbassadorPillarItem[] = [
  {
    id: "pillar-welcome-kit",
    icon_name: "Gift",
    title: "Exclusive IRA Welcome Kit",
    highlight: "Custom Associate Badge & ID",
    desc: "Receive the official Institutional Relations Associate physical welcome box with your personalized executive ID card, lanyard, custom IRA pin, welcome stationery, and collectible stickers.",
    badgeColor: "border-amber-500/40 bg-amber-500/10 text-amber-400",
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "pillar-merch",
    icon_name: "Award",
    title: "Corporate Branded Merchandise",
    highlight: "Performance-Based Apparel",
    desc: "Wear the brand with pride: unlock limited-edition embroidered hoodies, cotton tech tees, padded laptop sleeves, sleek steel bottles, and heavy-duty tech backpacks upon milestone completion.",
    badgeColor: "border-pink-500/40 bg-pink-500/10 text-pink-400",
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "pillar-rewards",
    icon_name: "TrendingUp",
    title: "Ambassador Rewards: Up to ₹15,000",
    highlight: "Direct Milestone Incentives",
    desc: "Earn substantial performance-driven milestone stipends, referral bonuses, and institutional project incentives of up to ₹15,000 within the cohort period (*Performance & Terms and Conditions Apply).",
    badgeColor: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
    image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "pillar-gadgets",
    icon_name: "Zap",
    title: "Branded Electronic Gadgets",
    highlight: "Powerbanks, Earbuds & Watches",
    desc: "Top performers are rewarded with cutting-edge electronics: fast-charging Powerbanks, ANC Earbuds, portable Soundbars, AMOLED Smartwatches, and Full HD Webcams.",
    badgeColor: "border-sky-500/40 bg-sky-500/10 text-sky-400",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "pillar-travel",
    icon_name: "Plane",
    title: "Curated Travel Experience (Top 10)",
    highlight: "All-Expenses-Paid Retreat",
    desc: "The Top 10 Associates will earn an exclusive, all-expenses-paid curated travel experience and leadership retreat with co-associates and corporate executives.",
    badgeColor: "border-purple-500/40 bg-purple-500/10 text-purple-400",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "pillar-certificate",
    icon_name: "FileCheck2",
    title: "Dual Certification of Recognisation",
    highlight: "Internship & Leadership Credential",
    desc: "Boost your resume with dual verifiable statutory credentials: an official Certificate of Recognition as an Institutional Relations Associate plus an accredited Corporate Internship Letter.",
    badgeColor: "border-cyan-500/40 bg-cyan-500/10 text-cyan-400",
    image: "https://images.unsplash.com/photo-1450133064473-71024230f91b?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "pillar-vvip",
    icon_name: "Crown",
    title: "VVIP All-Access Pass to Vyntyra",
    highlight: "Free VIP Access to all Events",
    desc: "Enjoy lifetime complimentary VVIP access to all Vyntyra technical & non-technical Workshops, AI Bootcamps, Executive Masterclasses, Hackathons, Learning Portals, and Advanced Courses.",
    badgeColor: "border-amber-400/40 bg-amber-400/10 text-amber-300",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop",
  },
];

export const DEFAULT_AMBASSADOR_FAQS: AmbassadorFaqItem[] = [
  {
    id: "faq-1",
    q: "Who is eligible to apply for the First Cohort?",
    a: "Any undergraduate or postgraduate student enrolled in recognized colleges or universities across India (B.Tech, B.E., BCA, MCA, MBA, BBA, B.Sc, etc.) passionate about technology, event leadership, and institutional growth is eligible.",
  },
  {
    id: "faq-2",
    q: "How does the Ambassador Rewards earn up to ₹15,000 work?",
    a: "Associates earn milestone-based incentives by hosting campus workshops, connecting college clubs, coordinating hackathons, and introducing peers to Vyntyra accredited programs. Reaching tiered performance milestones unlocks progressive payouts up to ₹15,000 (*Performance & Terms and Conditions Apply).",
  },
  {
    id: "faq-3",
    q: "When will the First Cohort officially launch?",
    a: "The First Cohort 2026-27 is currently in its pre-registration phase. Candidates who pre-register now will receive priority screening, interview invitations, and early welcome kit dispatches as soon as selection rounds begin.",
  },
  {
    id: "faq-4",
    q: "What is the Curated Travel Experience for Top 10 Associates?",
    a: "At the conclusion of the cohort, the top 10 highest-ranked Institutional Relations Associates will be awarded an all-inclusive travel retreat to a premier destination alongside fellow high-achievers and company mentors.",
  },
  {
    id: "faq-5",
    q: "Does this count as a formal college internship?",
    a: "Yes. Every associate who successfully completes their tenure receives an accredited Internship Certificate & Letter of Recommendation from Vyntyra Consultancy Services Pvt. Ltd. (MSME registered, ISO graded, Great Place to Work® Certified).",
  },
];

export const DEFAULT_AMBASSADOR_THEME: AmbassadorThemeSettings = {
  page_bg_color: "#070b14",
  page_bg_secondary: "#0d1527",
  glow_primary: "#6366f1",
  glow_secondary: "#ec4899",
  glow_accent: "#f59e0b",
  hero_badge_bg: "rgba(245, 158, 11, 0.15)",
  hero_badge_border: "rgba(245, 158, 11, 0.4)",
  hero_badge_text: "#fbbf24",
  hero_heading_gradient_start: "#fbbf24",
  hero_heading_gradient_mid: "#fb7185",
  hero_heading_gradient_end: "#818cf8",
  hero_description_color: "#cbd5e1",
  card_bg_color: "#0b1226",
  card_border_color: "#1e293b",
  primary_btn_bg_start: "#f59e0b",
  primary_btn_bg_end: "#eab308",
  primary_btn_text: "#020617",
  accent_text_color: "#fbbf24",
};

export const DEFAULT_AMBASSADOR_SETTINGS: AmbassadorProgramSettings = {
  applications_enabled: true,
  disabled_notice: "Pre-registrations for the First Cohort are currently paused while our admissions committee reviews submissions. Stay tuned for the next batch announcement!",
  cohort_name: "First Cohort 2026-27",
  target_rewards: "₹15,000",

  theme: DEFAULT_AMBASSADOR_THEME,

  hero: {
    badge_text: "FIRST COHORT 2026-27 · LAUNCHING SOON",
    title_prefix: "Vyntyra Institutional Relations Associate",
    title_gradient: "(Campus Ambassador Program)",
    description: "Become the official student leader representing Vyntyra Consultancy Services at your institution. Unlock exclusive welcome kits, rewards up to ₹15,000, branded electronic gadgets, and qualify for an all-expenses-paid curated travel retreat for the Top 10.",
    primary_cta_label: "Claim Early-Bird VIP Spot (Coming Soon)",
    secondary_cta_label: "Full Expression of Interest Form",
    metrics: [
      { value: "₹15,000", label: "Earn Up To Rewards*", color: "#fbbf24" },
      { value: "5+ Gadgets", label: "Branded Electronics", color: "#38bdf8" },
      { value: "Top 10", label: "Curated Travel Retreat", color: "#ec4899" },
      { value: "100% VVIP", label: "Free Access To Events", color: "#34d399" },
    ],
  },

  pillars_section: {
    badge_text: "EXCLUSIVE COHORT PRIVILEGES",
    heading: "Everything You Receive in First Cohort",
    description: "Designed to elevate your student profile, provide authentic executive experience, and celebrate institutional leadership with industry-first perks.",
    pillars: DEFAULT_AMBASSADOR_PILLARS,
  },

  gadgets_section: {
    badge_text: "HIGH-PERFORMANCE TECH GEAR",
    heading: "Branded Electronic Gadgets Showcase",
    description: "As an Institutional Relations Associate, meeting tiered engagement milestones equips your workstation with genuine top-tier consumer electronics.",
    callout_title: "Unlock All Electronic Gadgets",
    callout_desc: "Institutional Relations Associates who fulfill comprehensive college outreach & workshop benchmarks qualify for the full branded workstation ecosystem.",
    callout_footer: "*Performance Criteria Announced at Launch",
  },

  retreat_section: {
    badge_text: "PINNACLE RECOGNITION",
    heading: "Top 10 Associates: Curated Travel Experience",
    description: "Work hard, lead your campus, and travel in style. The Top 10 Institutional Relations Associates will be awarded an all-expenses-paid curated corporate and leisure retreat with co-associates and company executives.",
    image_url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop",
    bullets: [
      "Flight & Luxury Resort Stay Included",
      "Executive Networking Gala",
      "Team Building & Adventure Sports",
      "Exclusive Trophy & Honors Night",
    ],
    card_title: "First Cohort Leadership Retreat",
    card_subtitle: "Top 10 Associates Qualifier",
    card_desc: "Evaluated based on institutional engagement, student community growth, and overall leadership performance.",
    card_cta_label: "Claim Early-Bird Waitlist Pass",
  },

  faqs: DEFAULT_AMBASSADOR_FAQS,

  form_section: {
    badge_text: "FULL EXPRESSION OF INTEREST FORM",
    heading: "Pre-Register for the First Cohort",
    description: "Official announcement launching soon. Pre-registered candidates receive priority screening, interview invites, and early allocation of Welcome Kits.",
    quick_pass_banner_title: "Prefer Quick 1-Minute VIP Pass?",
    quick_pass_banner_desc: "Get an instant numbered ticket code & VIP waitlist confirmation popup.",
    submit_btn_text: "Submit Priority Pre-Registration",
    confirmation_title: "Pre-Registration Confirmed!",
    confirmation_message: "You are officially on the First Cohort Priority List for Vyntyra Institutional Relations Associates. We will reach out to you as soon as selection rounds begin.",
  },

  popup: {
    badge: "EXCLUSIVE VIP PASS",
    title: "Vyntyra Institutional Relations Associate",
    subtitle: "First Cohort 2026-27 · Launching Soon",
    announcement_message: "Official Announcement launching soon. Reserve your VIP Priority Spot before national onboarding begins. Early applicants receive guaranteed welcome kits and interview priority.",
    rewards_text: "Ambassador Rewards Earn up to ₹15,000 (*Performance & T&C Apply)",
    perks_summary: "Branded Gadgets · Top 10 Retreat · Dual Certificates · 100% Free VVIP Events Pass",
    ticket_label: "VIP ADMISSION PASS",
  },

  // Legacy flat fields for backwards compatibility
  popup_title: "Vyntyra Institutional Relations Associate",
  popup_subtitle: "First Cohort 2026-27 · Launching Soon",
  popup_badge: "EXCLUSIVE VIP PASS",
  popup_announcement_message: "Official Announcement launching soon. Reserve your VIP Priority Spot before national onboarding begins. Early applicants receive guaranteed welcome kits and interview priority.",
  popup_rewards_text: "Ambassador Rewards Earn up to ₹15,000 (*Performance & T&C Apply)",
  popup_perks_summary: "Branded Gadgets · Top 10 Retreat · Dual Certificates · 100% Free VVIP Events Pass",

  products: DEFAULT_AMBASSADOR_PRODUCTS,
};

async function checkIsAdmin(userId: string) {
  const admin = getAdminClient();
  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin");
  if (roles && roles.length > 0) return true;

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return profile?.role === "admin";
}

// ─── Get Ambassador Program Settings (Public / Admin) ──────────────
export const getAmbassadorProgramSettings = createServerFn({ method: "GET" }).handler(async () => {
  const admin = getAdminClient();
  try {
    const { data: setting } = await admin
      .from("site_settings")
      .select("value")
      .eq("id", "ambassador_program_settings")
      .maybeSingle();

    if (setting?.value) {
      const parsed = typeof setting.value === "string" ? JSON.parse(setting.value) : setting.value;
      return {
        ...DEFAULT_AMBASSADOR_SETTINGS,
        ...parsed,
        theme: {
          ...DEFAULT_AMBASSADOR_THEME,
          ...(parsed?.theme || {}),
        },
        hero: {
          ...DEFAULT_AMBASSADOR_SETTINGS.hero,
          ...(parsed?.hero || {}),
        },
        pillars_section: {
          ...DEFAULT_AMBASSADOR_SETTINGS.pillars_section,
          ...(parsed?.pillars_section || {}),
          pillars:
            Array.isArray(parsed?.pillars_section?.pillars) && parsed.pillars_section.pillars.length > 0
              ? parsed.pillars_section.pillars
              : DEFAULT_AMBASSADOR_PILLARS,
        },
        gadgets_section: {
          ...DEFAULT_AMBASSADOR_SETTINGS.gadgets_section,
          ...(parsed?.gadgets_section || {}),
        },
        retreat_section: {
          ...DEFAULT_AMBASSADOR_SETTINGS.retreat_section,
          ...(parsed?.retreat_section || {}),
          bullets:
            Array.isArray(parsed?.retreat_section?.bullets) && parsed.retreat_section.bullets.length > 0
              ? parsed.retreat_section.bullets
              : DEFAULT_AMBASSADOR_SETTINGS.retreat_section.bullets,
        },
        faqs:
          Array.isArray(parsed?.faqs) && parsed.faqs.length > 0
            ? parsed.faqs
            : DEFAULT_AMBASSADOR_FAQS,
        form_section: {
          ...DEFAULT_AMBASSADOR_SETTINGS.form_section,
          ...(parsed?.form_section || {}),
        },
        popup: {
          ...DEFAULT_AMBASSADOR_SETTINGS.popup,
          ...(parsed?.popup || {}),
          // Merge legacy flat fields if present
          title: parsed?.popup?.title || parsed?.popup_title || DEFAULT_AMBASSADOR_SETTINGS.popup.title,
          subtitle: parsed?.popup?.subtitle || parsed?.popup_subtitle || DEFAULT_AMBASSADOR_SETTINGS.popup.subtitle,
          badge: parsed?.popup?.badge || parsed?.popup_badge || DEFAULT_AMBASSADOR_SETTINGS.popup.badge,
          announcement_message: parsed?.popup?.announcement_message || parsed?.popup_announcement_message || DEFAULT_AMBASSADOR_SETTINGS.popup.announcement_message,
          rewards_text: parsed?.popup?.rewards_text || parsed?.popup_rewards_text || DEFAULT_AMBASSADOR_SETTINGS.popup.rewards_text,
          perks_summary: parsed?.popup?.perks_summary || parsed?.popup_perks_summary || DEFAULT_AMBASSADOR_SETTINGS.popup.perks_summary,
        },
        products:
          Array.isArray(parsed?.products) && parsed.products.length > 0
            ? parsed.products
            : DEFAULT_AMBASSADOR_PRODUCTS,
      } as AmbassadorProgramSettings;
    }
  } catch (err) {
    console.warn("[getAmbassadorProgramSettings] error reading settings:", err);
  }
  return DEFAULT_AMBASSADOR_SETTINGS;
});

// ─── Update Ambassador Program Settings (Super Admin Only) ─────────
export const updateAmbassadorProgramSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => {
    // Permissive object validation so any pin-to-pin field can be saved
    if (typeof d !== "object" || d === null) {
      throw new Error("Invalid payload: object required");
    }
    return d as AmbassadorProgramSettings;
  })
  .handler(async ({ data, context }) => {
    if (!(await checkIsAdmin(context.userId))) {
      throw new Error("Forbidden: Super Admin access required.");
    }

    const admin = getAdminClient();
    const { error: upsertErr } = await admin.from("site_settings").upsert({
      id: "ambassador_program_settings",
      value: data,
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    });

    if (upsertErr) {
      console.error("[updateAmbassadorProgramSettings] failed:", upsertErr);
      throw new Error("Failed to save ambassador settings.");
    }

    return { success: true, settings: data };
  });

// ─── Upload Ambassador Product Image to Supabase Storage ────────────
export const uploadAmbassadorProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({
      base64Data: z.string().min(10),
      fileName: z.string().min(3),
      contentType: z.string().default("image/jpeg"),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    if (!(await checkIsAdmin(context.userId))) {
      throw new Error("Forbidden: Super Admin access required.");
    }

    const admin = getAdminClient();
    const cleanBase64 = data.base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(cleanBase64, "base64");
    const ext = data.fileName.split(".").pop() || "jpg";
    const filePath = `ambassador-products/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { error: uploadErr } = await admin.storage
      .from("default")
      .upload(filePath, buffer, {
        contentType: data.contentType,
        upsert: true,
      });

    if (uploadErr) {
      console.error("[uploadAmbassadorProductImage] error:", uploadErr);
      throw new Error(`Upload failed: ${uploadErr.message}`);
    }

    const { data: urlData } = admin.storage.from("default").getPublicUrl(filePath);
    return { success: true, publicUrl: urlData.publicUrl };
  });

// ─── Pre-Register Candidate for First Cohort ───────────────────────
export const submitAmbassadorApplication = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({
      full_name: z.string().trim().min(2, "Name must be at least 2 characters"),
      email: z.string().trim().email("Invalid email address"),
      phone: z.string().trim().min(10, "Phone number must be at least 10 digits"),
      college_name: z.string().trim().min(3, "College name is required"),
      degree_branch: z.string().trim().min(2, "Degree & branch is required"),
      graduation_year: z.string().trim().min(4, "Graduation year is required"),
      city_state: z.string().trim().min(2, "City & State is required"),
      linkedin_profile: z.string().optional(),
      motivation: z.string().optional(),
    }).parse(d)
  )
  .handler(async ({ data }) => {
    const admin = getAdminClient();

    // Check if applications are enabled
    const { data: settingsRow } = await admin
      .from("site_settings")
      .select("value")
      .eq("id", "ambassador_program_settings")
      .maybeSingle();

    if (settingsRow?.value) {
      const parsedSettings = typeof settingsRow.value === "string" ? JSON.parse(settingsRow.value) : settingsRow.value;
      if (parsedSettings && parsedSettings.applications_enabled === false) {
        throw new Error(
          parsedSettings.disabled_notice || "Applications for this cohort are currently paused by administrator."
        );
      }
    }

    const cleanEmail = data.email.toLowerCase().trim();

    const record: AmbassadorRegistration = {
      id: `amb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      full_name: data.full_name.trim(),
      email: cleanEmail,
      phone: data.phone.trim(),
      college_name: data.college_name.trim(),
      degree_branch: data.degree_branch.trim(),
      graduation_year: data.graduation_year.trim(),
      city_state: data.city_state.trim(),
      linkedin_profile: data.linkedin_profile?.trim() || "",
      motivation: data.motivation?.trim() || "",
      created_at: new Date().toISOString(),
      status: "pending",
    };

    // Store in site_settings under 'ambassador_first_cohort_registrations'
    const { data: existingSetting } = await admin
      .from("site_settings")
      .select("value")
      .eq("id", "ambassador_first_cohort_registrations")
      .maybeSingle();

    let list: AmbassadorRegistration[] = [];
    if (existingSetting?.value) {
      try {
        list = Array.isArray(existingSetting.value) ? existingSetting.value : JSON.parse(existingSetting.value);
      } catch {
        list = [];
      }
    }

    // Check if already registered
    const existingIndex = list.findIndex((r) => r.email === cleanEmail);
    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...record, id: list[existingIndex].id };
    } else {
      list.unshift(record);
    }

    const { error: upsertErr } = await admin.from("site_settings").upsert({
      id: "ambassador_first_cohort_registrations",
      value: list,
      updated_at: new Date().toISOString(),
    });

    if (upsertErr) {
      console.error("Failed to save ambassador registration:", upsertErr);
      throw new Error("Unable to save your registration. Please try again.");
    }

    // Optionally notify via user_notifications if profile exists
    try {
      const { data: profile } = await admin
        .from("profiles")
        .select("id")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (profile?.id) {
        await admin.from("user_notifications").insert({
          user_id: profile.id,
          title: "Ambassador First Cohort — Registration Confirmed!",
          message: "You have successfully pre-registered for the Vyntyra Institutional Relations Associate (Campus Ambassador) First Cohort. Stay tuned for selection updates!",
          type: "announcement",
          read: false,
          created_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn("Notification logging failed silently:", e);
    }

    return { success: true, id: record.id, message: "Successfully pre-registered for First Cohort!" };
  });

// ─── List Registered Campus Ambassadors for Admin ───────────────────
export const listAmbassadorRegistrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const admin = getAdminClient();
    const { data: setting } = await admin
      .from("site_settings")
      .select("value")
      .eq("id", "ambassador_first_cohort_registrations")
      .maybeSingle();

    if (!setting?.value) return [];
    try {
      const parsed = Array.isArray(setting.value) ? setting.value : JSON.parse(setting.value);
      return (parsed || []) as AmbassadorRegistration[];
    } catch {
      return [];
    }
  });

// ─── Fetch Interns for Promotional Ambassador Campaign ─────────────
export const getInternsForAmbassadorCampaign = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const admin = getAdminClient();

    const { data: apps } = await admin
      .from("applications")
      .select("id, email, phone, full_name, college, domain, sub_domain")
      .order("created_at", { ascending: false })
      .limit(300);

    const { data: profiles } = await admin
      .from("profiles")
      .select("id, email, full_name, role, phone")
      .eq("role", "intern")
      .limit(300);

    const map = new Map<string, { email: string; name: string; phone: string; college: string; domain: string }>();

    (apps || []).forEach((a) => {
      if (a.email) {
        map.set(a.email.toLowerCase(), {
          email: a.email.toLowerCase(),
          name: a.full_name || "Intern",
          phone: a.phone || "",
          college: a.college || "",
          domain: a.domain || "",
        });
      }
    });

    (profiles || []).forEach((p) => {
      if (p.email && !map.has(p.email.toLowerCase())) {
        map.set(p.email.toLowerCase(), {
          email: p.email.toLowerCase(),
          name: p.full_name || "Intern",
          phone: p.phone || "",
          college: "",
          domain: "",
        });
      }
    });

    return Array.from(map.values());
  });

// ─── Send Campus Ambassador Promotional Email (1-Click) ────────────
export const sendAmbassadorPromotionalEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({
      recipient_email: z.string().trim().email(),
      recipient_name: z.string().optional(),
      college_name: z.string().optional(),
      custom_subject: z.string().optional(),
    }).parse(d)
  )
  .handler(async ({ data }) => {
    const admin = getAdminClient();
    const recipientEmail = data.recipient_email.trim().toLowerCase();
    const recipientName = data.recipient_name?.trim() || "Associate";
    const collegeName = data.college_name?.trim() || "Your Institution";
    const subject = data.custom_subject?.trim() || "🚀 Launching Soon: Vyntyra Institutional Relations Associate (Campus Ambassador) — First Cohort";

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b1120; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b1120; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background: linear-gradient(180deg, #131d36 0%, #0d1527 100%); border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          <tr>
            <td style="height: 6px; background: linear-gradient(90deg, #f59e0b 0%, #ec4899 50%, #6366f1 100%);"></td>
          </tr>
          <tr>
            <td style="padding: 36px 36px 20px 36px; text-align: center;">
              <div style="display: inline-block; padding: 6px 14px; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 9999px; margin-bottom: 16px;">
                <span style="font-size: 11px; font-weight: 800; letter-spacing: 0.15em; color: #fbbf24; text-transform: uppercase;">✨ FIRST COHORT 2026-27 · LAUNCHING SOON</span>
              </div>
              <h1 style="margin: 0 0 12px 0; font-size: 26px; line-height: 1.25; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
                Vyntyra Institutional Relations Associate<br/>
                <span style="background: linear-gradient(90deg, #fbbf24, #f43f5e); -webkit-background-clip: text; -webkit-text-fill-color: transparent; color: #fbbf24;">(Campus Ambassador Program)</span>
              </h1>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                Dear <strong>${recipientName}</strong>, represent Vyntyra Consultancy Services at <strong>${collegeName}</strong>. Build executive leadership, unlock prestigious rewards, and bridge institutional technology networks.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 32px 30px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(148, 163, 184, 0.15); border-radius: 12px; padding: 20px;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
                    <div style="font-size: 14px; font-weight: 700; color: #f8fafc;">🎁 Exclusive IRA Welcome Kit</div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 3px;">Official Associate Badge, Corporate ID Card, Welcome Stationery & Premium Swag.</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
                    <div style="font-size: 14px; font-weight: 700; color: #f8fafc;">👕 Performance-Based Corporate Merchandise</div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 3px;">Exclusive branded apparel, premium hoodies, t-shirts, laptop bags, and water bottles.</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
                    <div style="font-size: 14px; font-weight: 700; color: #10b981;">💰 Ambassador Rewards: Earn up to ₹15,000</div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 3px;">Generous milestone stipends & cash incentives within the program (*Performance & T&C Apply).</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
                    <div style="font-size: 14px; font-weight: 700; color: #38bdf8;">⚡ Branded Electronic Gadgets</div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 3px;">Top performers receive high-capacity Powerbanks, True Wireless Earbuds, Soundbars, Smartwatches & Webcams.</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
                    <div style="font-size: 14px; font-weight: 700; color: #ec4899;">✈️ Curated Travel Experience (Top 10 Associates)</div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 3px;">Top 10 Associates win an all-expenses-paid curated corporate & retreat experience with co-associates.</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
                    <div style="font-size: 14px; font-weight: 700; color: #f8fafc;">📜 Certificate of Recognition & Internship</div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 3px;">Dual credentials for your resume: Institutional Leadership & Corporate Relations Internship Letter.</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <div style="font-size: 14px; font-weight: 700; color: #a855f7;">👑 Exclusive VVIP Access to all Vyntyra Events</div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 3px;">Free VIP access to all Workshops, Bootcamps, Masterclasses, Sessions, Learning Modules & Courses.</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 0 32px 36px 32px;">
              <a href="https://vyntyraconsultancyservices.in/campus-ambassador" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #0b1120; font-weight: 800; font-size: 15px; text-decoration: none; padding: 14px 36px; border-radius: 8px; box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.4); text-transform: uppercase; letter-spacing: 0.05em;">
                Pre-Register for First Cohort &rarr;
              </a>
              <p style="margin: 14px 0 0 0; font-size: 12px; color: #64748b;">
                Announcement coming soon. Early applicants receive priority review for Cohort 1.0.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #080d19; padding: 24px; text-align: center; border-top: 1px solid #1e293b;">
              <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.6;">
                Vyntyra Consultancy Services Pvt. Ltd. · Great Place to Work® Certified 2026-27<br/>
                Recognized by NASSCOM FutureSkills Prime · MSME Registered Govt. of India<br/>
                Questions? Email us at <a href="mailto:hr@vyntyraconsultancyservices.in" style="color: #fbbf24; text-decoration: none;">hr@vyntyraconsultancyservices.in</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    let sent = false;
    let provider = "none";
    let errorMsg: string | null = null;

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: "Vyntyra Careers <careers@vyntyraconsultancyservices.in>",
            to: [recipientEmail],
            subject,
            html: htmlBody,
          }),
        });

        if (res.ok) {
          sent = true;
          provider = "resend";
        } else {
          const errJson = await res.json().catch(() => ({}));
          errorMsg = `Resend error: ${JSON.stringify(errJson)}`;
        }
      } catch (e: any) {
        errorMsg = e.message;
      }
    }

    if (!sent && process.env.BREVO_API_KEY) {
      try {
        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": process.env.BREVO_API_KEY,
          },
          body: JSON.stringify({
            sender: { name: "Vyntyra Consultancy Services", email: "hr@vyntyraconsultancyservices.in" },
            to: [{ email: recipientEmail, name: recipientName }],
            subject,
            htmlContent: htmlBody,
          }),
        });

        if (res.ok) {
          sent = true;
          provider = "brevo";
        } else {
          const errJson = await res.json().catch(() => ({}));
          errorMsg = `Brevo error: ${JSON.stringify(errJson)}`;
        }
      } catch (e: any) {
        errorMsg = e.message;
      }
    }

    try {
      await admin.from("automated_email_logs").insert({
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        subject,
        status: sent ? "sent" : "failed",
        provider_used: provider,
        error_message: errorMsg,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Ignored
    }

    if (!sent && errorMsg) {
      throw new Error(`Email delivery failed: ${errorMsg}`);
    }

    return { success: true, provider, recipient: recipientEmail };
  });
