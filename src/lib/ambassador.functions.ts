import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getAdminClient } from "@/integrations/supabase/admin";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface AmbassadorRegistration {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  full_address?: string;
  state?: string;
  district?: string;
  college_name: string;
  college_location?: string;
  branch?: string;
  department?: string;
  expected_graduation_year?: string;
  languages_known?: string[];
  video_pitch_url?: string;
  linkedin_url?: string;
  instagram_url?: string;
  portrait_photo_url?: string;
  agreement_accepted?: boolean;
  terms_accepted?: boolean;
  // Legacy / convenience fields
  degree_branch?: string;
  graduation_year?: string;
  city_state?: string;
  linkedin_profile?: string;
  motivation?: string;
  created_at: string;
  status: "pending" | "shortlisted" | "enrolled" | "rejected";
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

  // Dynamic Progression Milestones & Reward Tiers (Editable in Admin Panel)
  progression_table: AmbassadorProgressionSettings;
}

export interface AmbassadorRewardTier {
  id: string;
  category: string;
  points: number;
  voucher_amount?: number;
  rewards_text: string;
  digital_rewards: string;
  highlight?: boolean;
}

export interface AmbassadorProgressionSettings {
  badge_text: string;
  heading: string;
  description: string;
  max_reward_amount: string;
  notes: string[];
  tiers: AmbassadorRewardTier[];
}

export const DEFAULT_AMBASSADOR_TIERS: AmbassadorRewardTier[] = [
  {
    id: "tier-400",
    category: "The Spark",
    points: 400,
    voucher_amount: 500,
    rewards_text: "₹500 E-Voucher + Exclusive IRA Welcome Kit (Dispatched after 1st milestone: Executive ID Card, Lanyard, Custom Metallic IRA Pin, Welcome Stationery & Collectibles)",
    digital_rewards: "Digital Badge + Certificate of Enrolment",
  },
  {
    id: "tier-600",
    category: "The Pioneer",
    points: 600,
    voucher_amount: 1000,
    rewards_text: "₹1,000 E-Voucher + Sleek Stainless Steel Water Bottle & Cotton Tech Tee",
    digital_rewards: "Digital Badge",
  },
  {
    id: "tier-800",
    category: "The Trailblazer",
    points: 800,
    voucher_amount: 1500,
    rewards_text: "₹1,500 E-Voucher + Fast-Charging Powerbank",
    digital_rewards: "Digital Badge",
  },
  {
    id: "tier-1000",
    category: "The Catalyst",
    points: 1000,
    voucher_amount: 2000,
    rewards_text: "₹2,000 E-Voucher + Padded Laptop Sleeve & Hardcover Tech Notebook",
    digital_rewards: "Digital Badge",
  },
  {
    id: "tier-1200",
    category: "The Changemaker",
    points: 1200,
    voucher_amount: 2500,
    rewards_text: "₹2,500 E-Voucher + Active Noise Cancelling (ANC) Wireless Earbuds",
    digital_rewards: "Digital Badge + Certificate of Perseverance / Certificate of Completion",
  },
  {
    id: "tier-1400",
    category: "The Powerhouse",
    points: 1400,
    voucher_amount: 3000,
    rewards_text: "₹3,000 E-Voucher + Limited-Edition Embroidered Corporate Hoodie",
    digital_rewards: "Digital Badge",
  },
  {
    id: "tier-1600",
    category: "The Luminary",
    points: 1600,
    voucher_amount: 4000,
    rewards_text: "₹4,000 E-Voucher + Portable Bluetooth Soundbar & Heavy-Duty Tech Backpack",
    digital_rewards: "Digital Badge + Certificate of Prominence",
  },
  {
    id: "tier-1800",
    category: "The Vanguard",
    points: 1800,
    voucher_amount: 6000,
    rewards_text: "₹6,000 Direct Milestone Incentive + Full HD Executive Webcam",
    digital_rewards: "Digital Badge + Executive Recommendation Letter",
  },
  {
    id: "tier-2000",
    category: "The Apex Legend",
    points: 2000,
    voucher_amount: 15000,
    rewards_text: "Grand ₹15,000 Milestone Incentive / E-Voucher Package + AMOLED Smartwatch & Complete Merch Ecosystem",
    digital_rewards: "Digital Badge + Certificate of Ascendancy & Letter of Recommendation",
    highlight: true,
  },
];

export const DEFAULT_AMBASSADOR_PROGRESSION: AmbassadorProgressionSettings = {
  badge_text: "PERFORMANCE MILESTONES & REWARDS",
  heading: "Ambassador Tiered Reward Structure",
  description: "Progression tiers based on total points accumulated throughout the program duration.",
  max_reward_amount: "₹15,000",
  notes: [
    "Milestone Dispatch Notice: Everywhere swags, branded hoodies, customized stationery, and official welcome kits will be dispatched after reaching the 1st milestone only.",
    "The Certificate of Perseverance is for Semester 1 ambassadors continuing into Semester 2.",
    "The Certificate of Completion is for newly onboarded ambassadors who successfully complete the programme.",
    "Certificates will be given upon the completion of the programme.",
  ],
  tiers: DEFAULT_AMBASSADOR_TIERS,
};

export const DEFAULT_AMBASSADOR_PRODUCTS: AmbassadorProductItem[] = [
  {
    id: "prod-welcome-box",
    category: "Welcome Kit",
    title: "Executive IRA Corporate Welcome Box",
    subtitle: "Custom IRA Badge & Official Metal ID",
    image_url: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800&auto=format&fit=crop",
    desc: "Luxury unboxing box with personalized institutional associate ID card, custom metallic IRA badge, executive lanyard, pen, notebook, and collectible laptop stickers (dispatched after reaching 1st milestone only).",
    badge: "Dispatched After 1st Milestone",
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
    highlight: "Dispatched After 1st Milestone",
    desc: "Receive the official Institutional Relations Associate physical welcome box with your personalized executive ID card, lanyard, custom IRA pin, welcome stationery, and collectible stickers (dispatched after reaching 1st milestone only).",
    badgeColor: "border-amber-500/40 bg-amber-500/10 text-amber-400",
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "pillar-merch",
    icon_name: "Award",
    title: "Corporate Branded Merchandise",
    highlight: "Dispatched After 1st Milestone",
    desc: "Wear the brand with pride: unlock limited-edition embroidered hoodies, cotton tech tees, padded laptop sleeves, sleek steel bottles, and heavy-duty tech backpacks (dispatched after reaching 1st milestone only).",
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
    id: "faq-welcome-kit",
    q: "When will I receive my Welcome Kit & Swags?",
    a: "Official Welcome Kits, personalized Executive IRA ID Badges, goodies, and corporate swags will be dispatched after reaching 1st milestone only. Once your Milestone 1 achievements are verified, the physical kit is couriered directly to your residential address with active tracking.",
  },
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
    a: "The First Cohort 2026-27 is currently in its pre-registration phase. Candidates who pre-register now receive priority screening, interview invitations, and early cohort onboarding as soon as selection rounds begin. Please note that swags and welcome kits are dispatched after reaching 1st milestone only.",
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
  progression_table: DEFAULT_AMBASSADOR_PROGRESSION,
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
        progression_table: {
          ...DEFAULT_AMBASSADOR_PROGRESSION,
          ...(parsed?.progression_table || {}),
          tiers:
            Array.isArray(parsed?.progression_table?.tiers) && parsed.progression_table.tiers.length > 0
              ? parsed.progression_table.tiers
              : DEFAULT_AMBASSADOR_TIERS,
          notes:
            Array.isArray(parsed?.progression_table?.notes) && parsed.progression_table.notes.length > 0
              ? parsed.progression_table.notes
              : DEFAULT_AMBASSADOR_PROGRESSION.notes,
        },
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
    const input = (d as any)?.data !== undefined ? (d as any).data : d;
    // Permissive object validation so any pin-to-pin field can be saved
    if (typeof input !== "object" || input === null) {
      throw new Error("Invalid payload: object required");
    }
    return input as AmbassadorProgramSettings;
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
  .validator((d: unknown) => {
    const input = (d as any)?.data !== undefined ? (d as any).data : d;
    return z.object({
      base64Data: z.string().min(10),
      fileName: z.string().min(3),
      contentType: z.string().default("image/jpeg"),
    }).parse(input);
  })
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

// ─── Upload Ambassador Professional Portrait to Supabase Storage ────
export const uploadAmbassadorPortraitImage = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const input = (d as any)?.data !== undefined ? (d as any).data : d;
    return z.object({
      base64Data: z.string().min(10, "Base64 data required"),
      fileName: z.string().min(3),
      contentType: z.string().default("image/jpeg"),
    }).parse(input);
  })
  .handler(async ({ data }) => {
    const admin = getAdminClient();
    const cleanBase64 = data.base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(cleanBase64, "base64");
    const ext = data.fileName.split(".").pop() || "jpg";
    const filePath = `ambassador-portraits/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { error: uploadErr } = await admin.storage
      .from("default")
      .upload(filePath, buffer, {
        contentType: data.contentType,
        upsert: true,
      });

    if (uploadErr) {
      console.error("[uploadAmbassadorPortraitImage] error:", uploadErr);
      throw new Error(`Portrait upload failed: ${uploadErr.message}`);
    }

    const { data: urlData } = admin.storage.from("default").getPublicUrl(filePath);
    return { success: true, publicUrl: urlData.publicUrl };
  });

// ─── Automated Email Dispatcher (Applicant & Admin) ─────────────────
async function sendAmbassadorAutomatedEmails(record: AmbassadorRegistration) {
  const admin = getAdminClient();
  const resendKey = process.env.RESEND_API_KEY;
  const brevoKey = process.env.BREVO_API_KEY;

  const languagesList = Array.isArray(record.languages_known)
    ? record.languages_known.join(", ")
    : (record.languages_known as any) || "English";

  const applicantSubject = `🎓 Application Received: Vyntyra Institutional Relations Associate (${record.college_name || "First Cohort"})`;
  const adminSubject = `🚨 New Ambassador Application: ${record.full_name} — ${record.college_name}`;

  // 1. Applicant Confirmation HTML
  const applicantHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${applicantSubject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070b14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #070b14; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="620" cellspacing="0" cellpadding="0" style="max-width: 620px; width: 100%; background: linear-gradient(180deg, #0d1527 0%, #080d19 100%); border: 1px solid #1e293b; border-radius: 18px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
          <tr>
            <td style="height: 6px; background: linear-gradient(90deg, #f59e0b 0%, #ec4899 50%, #6366f1 100%);"></td>
          </tr>
          <tr>
            <td style="padding: 36px 36px 20px 36px; text-align: center;">
              <div style="display: inline-block; padding: 6px 14px; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 9999px; margin-bottom: 16px;">
                <span style="font-size: 11px; font-weight: 800; letter-spacing: 0.15em; color: #fbbf24; text-transform: uppercase;">✨ FIRST COHORT 2026-27 · APPLICATION CONFIRMED</span>
              </div>
              <h1 style="margin: 0 0 12px 0; font-size: 26px; line-height: 1.25; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
                Application Received Successfully!
              </h1>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                Dear <strong>${record.full_name}</strong>, thank you for applying to become the official <strong>Vyntyra Institutional Relations Associate (Campus Ambassador)</strong> representing <strong>${record.college_name}</strong>.
              </p>
            </td>
          </tr>

          <!-- 6-MONTH AGREEMENT IMPORTANT NOTICE -->
          <tr>
            <td style="padding: 0 32px 20px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 18px;">
                <tr>
                  <td>
                    <div style="font-size: 13px; font-weight: 800; color: #fbbf24; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">
                      📋 Mandatory 6-Month Tenure Agreement Notice
                    </div>
                    <div style="font-size: 13px; color: #cbd5e1; line-height: 1.6;">
                      The Institutional Relations Associate appointment is applicable for a <strong>formal 6-month tenure</strong>. Following internal candidate shortlisting and interview rounds, the official <strong>6-Month Association Agreement & Terms Document</strong> will be dispatched directly to your registered email for digital signing.<br/>
                      <strong style="color: #fbbf24;">📦 Important Dispatch Policy:</strong> Official Swags, Goodies, and Executive Welcome Kits will be dispatched <strong>after reaching 1st milestone only</strong>.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- SUBMITTED APPLICATION SUMMARY -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(15, 23, 42, 0.8); border: 1px solid #1e293b; border-radius: 12px; padding: 20px;">
                <tr>
                  <td colspan="2" style="padding-bottom: 12px; border-bottom: 1px solid #1e293b; font-size: 14px; font-weight: 700; color: #f8fafc;">
                    📌 Application Details Summary
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 12px; color: #94a3b8; width: 40%;">Reference ID:</td>
                  <td style="padding: 8px 0; font-size: 12px; color: #fbbf24; font-family: monospace; font-weight: 700;">${record.id}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 12px; color: #94a3b8;">Full Name:</td>
                  <td style="padding: 8px 0; font-size: 12px; color: #f8fafc; font-weight: 600;">${record.full_name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 12px; color: #94a3b8;">Email & WhatsApp:</td>
                  <td style="padding: 8px 0; font-size: 12px; color: #f8fafc;">${record.email} / ${record.phone}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 12px; color: #94a3b8;">College & Location:</td>
                  <td style="padding: 8px 0; font-size: 12px; color: #f8fafc;">${record.college_name} (${record.college_location || "Campus"}, ${record.district || ""}, ${record.state || ""})</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 12px; color: #94a3b8;">Branch & Department:</td>
                  <td style="padding: 8px 0; font-size: 12px; color: #f8fafc;">${record.branch || record.degree_branch || "N/A"} (${record.department || "General"})</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 12px; color: #94a3b8;">Graduation Year:</td>
                  <td style="padding: 8px 0; font-size: 12px; color: #f8fafc;">${record.expected_graduation_year || record.graduation_year || "2026"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 12px; color: #94a3b8;">Languages Known:</td>
                  <td style="padding: 8px 0; font-size: 12px; color: #f8fafc;">${languagesList}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 12px; color: #94a3b8;">Video Pitch (Google Drive):</td>
                  <td style="padding: 8px 0; font-size: 12px; color: #38bdf8;">
                    <a href="${record.video_pitch_url}" style="color: #38bdf8; text-decoration: underline;" target="_blank">View Video Pitch &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- PRIVILEGES RECAP -->
          <tr>
            <td style="padding: 0 32px 30px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(15, 23, 42, 0.5); border: 1px solid #1e293b; border-radius: 12px; padding: 18px;">
                <tr>
                  <td style="font-size: 13px; font-weight: 700; color: #f8fafc; padding-bottom: 8px;">
                    💎 Exclusive Cohort 1.0 Privileges Awaiting You:
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #cbd5e1; line-height: 1.8;">
                    🎁 <strong>IRA Executive Welcome Kit:</strong> Personalized ID Card, Lanyard, Pin & Stationery (<em>Dispatched after reaching 1st milestone only</em>).<br/>
                    👕 <strong>Corporate Merchandise:</strong> Performance hoodies, tees, laptop sleeves & bottles (<em>Dispatched after reaching 1st milestone only</em>).<br/>
                    💰 <strong>Ambassador Rewards:</strong> Earn up to <strong>₹15,000</strong> milestone stipends (*T&C Apply).<br/>
                    ⚡ <strong>Electronic Gadgets:</strong> Powerbanks, ANC Earbuds, Soundbars, Smartwatches & Webcams.<br/>
                    ✈️ <strong>Top 10 Travel Retreat:</strong> All-expenses-paid curated corporate & leisure experience.<br/>
                    📜 <strong>Dual Certification:</strong> Certificate of Recognition + Accredited Corporate Internship Letter.<br/>
                    👑 <strong>VVIP All-Access Pass:</strong> Lifetime complimentary access to all Vyntyra workshops & courses.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 0 32px 36px 32px;">
              <a href="https://vyntyraconsultancyservices.in/campus-ambassador" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #0b1120; font-weight: 800; font-size: 14px; text-decoration: none; padding: 12px 32px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.05em;">
                Visit Ambassador Portal &rarr;
              </a>
            </td>
          </tr>

          <tr>
            <td style="background-color: #050811; padding: 22px; text-align: center; border-top: 1px solid #1e293b;">
              <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.6;">
                Vyntyra Consultancy Services Pvt. Ltd. · Great Place to Work® Certified 2026-27<br/>
                Institutional Relations & Campus Ambassador Program Cell<br/>
                Official Desk: <a href="mailto:ambassadorprogram@vyntyraconsultancyservices.in" style="color: #fbbf24; text-decoration: none;">ambassadorprogram@vyntyraconsultancyservices.in</a>
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

  // 2. Admin Notification HTML
  const adminHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${adminSubject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b1120; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="620" cellspacing="0" cellpadding="0" style="max-width: 620px; width: 100%; background: #131d36; border: 1px solid #334155; border-radius: 14px; overflow: hidden;">
          <tr>
            <td style="height: 6px; background: #f59e0b;"></td>
          </tr>
          <tr>
            <td style="padding: 24px;">
              <div style="font-size: 11px; font-weight: 800; color: #fbbf24; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">
                NEW AMBASSADOR APPLICATION RECEIVED
              </div>
              <h2 style="margin: 0 0 16px 0; color: #ffffff; font-size: 20px;">
                ${record.full_name} (${record.college_name})
              </h2>

              <table role="presentation" width="100%" style="border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
                <tr style="border-bottom: 1px solid #1e293b;">
                  <td style="padding: 8px 0; color: #94a3b8; width: 35%;">Applicant ID:</td>
                  <td style="padding: 8px 0; color: #f8fafc; font-family: monospace;">${record.id}</td>
                </tr>
                <tr style="border-bottom: 1px solid #1e293b;">
                  <td style="padding: 8px 0; color: #94a3b8;">Email:</td>
                  <td style="padding: 8px 0; color: #f8fafc;"><a href="mailto:${record.email}" style="color: #38bdf8;">${record.email}</a></td>
                </tr>
                <tr style="border-bottom: 1px solid #1e293b;">
                  <td style="padding: 8px 0; color: #94a3b8;">WhatsApp / Phone:</td>
                  <td style="padding: 8px 0; color: #f8fafc;"><a href="https://wa.me/${record.phone.replace(/[^0-9]/g, "")}" style="color: #34d399;">${record.phone}</a></td>
                </tr>
                <tr style="border-bottom: 1px solid #1e293b;">
                  <td style="padding: 8px 0; color: #94a3b8;">College & Location:</td>
                  <td style="padding: 8px 0; color: #f8fafc;">${record.college_name} (${record.college_location || "N/A"})</td>
                </tr>
                <tr style="border-bottom: 1px solid #1e293b;">
                  <td style="padding: 8px 0; color: #94a3b8;">State & District:</td>
                  <td style="padding: 8px 0; color: #f8fafc;">${record.district || "N/A"}, ${record.state || "N/A"}</td>
                </tr>
                <tr style="border-bottom: 1px solid #1e293b;">
                  <td style="padding: 8px 0; color: #94a3b8;">Full Address:</td>
                  <td style="padding: 8px 0; color: #f8fafc;">${record.full_address || "N/A"}</td>
                </tr>
                <tr style="border-bottom: 1px solid #1e293b;">
                  <td style="padding: 8px 0; color: #94a3b8;">Education:</td>
                  <td style="padding: 8px 0; color: #f8fafc;">${record.branch || record.degree_branch} (${record.department || "General"}) · Grad: ${record.expected_graduation_year || record.graduation_year}</td>
                </tr>
                <tr style="border-bottom: 1px solid #1e293b;">
                  <td style="padding: 8px 0; color: #94a3b8;">Languages:</td>
                  <td style="padding: 8px 0; color: #f8fafc;">${languagesList}</td>
                </tr>
                <tr style="border-bottom: 1px solid #1e293b;">
                  <td style="padding: 8px 0; color: #94a3b8;">LinkedIn:</td>
                  <td style="padding: 8px 0; color: #38bdf8;">${record.linkedin_url || record.linkedin_profile || "N/A"}</td>
                </tr>
                <tr style="border-bottom: 1px solid #1e293b;">
                  <td style="padding: 8px 0; color: #94a3b8;">Instagram:</td>
                  <td style="padding: 8px 0; color: #f43f5e;">${record.instagram_url || "N/A"}</td>
                </tr>
                <tr style="border-bottom: 1px solid #1e293b;">
                  <td style="padding: 8px 0; color: #94a3b8;">6-Month Agreement:</td>
                  <td style="padding: 8px 0; color: #34d399; font-weight: 700;">Accepted (6 Months Applicable)</td>
                </tr>
              </table>

              <!-- Action Links -->
              <div style="margin-top: 20px; text-align: center;">
                <a href="${record.video_pitch_url}" target="_blank" style="display: inline-block; background: #3b82f6; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 13px; margin-right: 10px;">
                  📹 Watch 5-10 Min Video Pitch (Google Drive)
                </a>
                ${
                  record.portrait_photo_url
                    ? `<a href="${record.portrait_photo_url}" target="_blank" style="display: inline-block; background: #475569; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 13px;">
                        🖼️ View Portrait Photo
                      </a>`
                    : ""
                }
              </div>

              <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #334155; text-align: center;">
                <a href="https://vyntyraconsultancyservices.in/admin/operations?tab=ambassador" style="color: #fbbf24; font-size: 12px; text-decoration: underline;">
                  Open Admin Panel &rarr; Operations &rarr; Ambassador Program
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  // Function to dispatch an email via Resend / Brevo
  const dispatchEmail = async (toEmail: string, toName: string, subject: string, html: string) => {
    let sent = false;
    let provider = "none";
    let errorMsg: string | null = null;

    if (resendKey) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: "Vyntyra Ambassador Program <ambassadorprogram@vyntyraconsultancyservices.in>",
            to: [toEmail],
            subject,
            html,
          }),
        });

        if (res.ok) {
          sent = true;
          provider = "resend";
        } else {
          // Retry with careers@ if custom sender domain check fails
          const resRetry = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendKey}`,
            },
            body: JSON.stringify({
              from: "Vyntyra Careers <careers@vyntyraconsultancyservices.in>",
              to: [toEmail],
              subject,
              html,
            }),
          });
          if (resRetry.ok) {
            sent = true;
            provider = "resend_careers";
          } else {
            const errJson = await resRetry.json().catch(() => ({}));
            errorMsg = `Resend error: ${JSON.stringify(errJson)}`;
          }
        }
      } catch (e: any) {
        errorMsg = e.message;
      }
    }

    if (!sent && brevoKey) {
      try {
        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": brevoKey,
          },
          body: JSON.stringify({
            sender: {
              name: "Vyntyra Institutional Relations Cell",
              email: "ambassadorprogram@vyntyraconsultancyservices.in",
            },
            to: [{ email: toEmail, name: toName }],
            subject,
            htmlContent: html,
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

    // Log to automated_email_logs
    try {
      await admin.from("automated_email_logs").insert({
        recipient_email: toEmail,
        recipient_name: toName,
        subject,
        status: sent ? "sent" : "failed",
        provider_used: provider,
        error_message: errorMsg,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Ignored
    }

    return { sent, provider, errorMsg };
  };

  // Dispatch concurrently
  await Promise.allSettled([
    dispatchEmail(record.email, record.full_name, applicantSubject, applicantHtml),
    dispatchEmail(
      "ambassadorprogram@vyntyraconsultancyservices.in",
      "Vyntyra Ambassador Desk",
      adminSubject,
      adminHtml
    ),
  ]);
}

// ─── Pre-Register / Apply for First Cohort ─────────────────────────
export const submitAmbassadorApplication = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const input = (d as any)?.data !== undefined ? (d as any).data : d;
    return z.object({
      full_name: z.string().trim().min(2, "Full name must be at least 2 characters"),
      email: z.string().trim().email("Invalid email address"),
      phone: z.string().trim().min(10, "WhatsApp / phone number must be at least 10 digits"),
      full_address: z.string().trim().min(5, "Full address is required").optional().default(""),
      state: z.string().trim().min(2, "State is required").optional().default("Andhra Pradesh"),
      district: z.string().trim().min(2, "District is required").optional().default("Visakhapatnam"),
      college_name: z.string().trim().min(3, "College name is required"),
      college_location: z.string().trim().min(2, "College location is required").optional().default("Main Campus"),
      branch: z.string().trim().min(2, "Branch is required").optional().default("Computer Science & Engineering"),
      department: z.string().trim().min(2, "Department is required").optional().default("Engineering & Technology"),
      expected_graduation_year: z.string().trim().min(4, "Graduation year is required").optional().default("2026"),
      languages_known: z.array(z.string()).min(1, "Select at least 1 language").optional().default(["English", "Hindi"]),
      video_pitch_url: z
        .string()
        .trim()
        .url("Valid URL required")
        .refine(
          (url) => /(drive\.google\.com|docs\.google\.com)/i.test(url),
          "Only public Google Drive links (https://drive.google.com/...) are acceptable for the 5-10 min video pitch."
        )
        .optional()
        .default("https://drive.google.com/file/d/sample/view"),
      portrait_photo_url: z.string().trim().min(5, "Portrait photo is required").optional().default(""),
      linkedin_url: z.string().trim().optional().default(""),
      instagram_url: z.string().trim().optional().default(""),
      agreement_accepted: z.boolean().optional().default(true),
      terms_accepted: z.boolean().optional().default(true),
      // Backwards-compatibility fallbacks
      degree_branch: z.string().optional(),
      graduation_year: z.string().optional(),
      city_state: z.string().optional(),
      linkedin_profile: z.string().optional(),
      motivation: z.string().optional(),
    }).parse(input);
  })
  .handler(async ({ data }) => {
    const admin = getAdminClient();

    // Check if applications are enabled in settings
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
    const branchVal = data.branch || data.degree_branch || "Computer Science & Engineering";
    const gradYearVal = data.expected_graduation_year || data.graduation_year || "2026";
    const cityStateVal = data.district ? `${data.district}, ${data.state}` : data.city_state || "Visakhapatnam, AP";

    const record: AmbassadorRegistration = {
      id: `VCS-IRA-${Date.now().toString().slice(-4)}${Math.floor(100 + Math.random() * 900)}`,
      full_name: data.full_name.trim(),
      email: cleanEmail,
      phone: data.phone.trim(),
      full_address: data.full_address?.trim() || "",
      state: data.state?.trim() || "Andhra Pradesh",
      district: data.district?.trim() || "Visakhapatnam",
      college_name: data.college_name.trim(),
      college_location: data.college_location?.trim() || "Main Campus",
      branch: branchVal.trim(),
      department: data.department?.trim() || "Engineering & Technology",
      expected_graduation_year: gradYearVal.trim(),
      languages_known: data.languages_known || ["English"],
      video_pitch_url: data.video_pitch_url?.trim() || "",
      portrait_photo_url: data.portrait_photo_url?.trim() || "",
      linkedin_url: data.linkedin_url?.trim() || data.linkedin_profile?.trim() || "",
      instagram_url: data.instagram_url?.trim() || "",
      agreement_accepted: data.agreement_accepted ?? true,
      terms_accepted: data.terms_accepted ?? true,
      // Legacy backwards-compatible fields
      degree_branch: branchVal.trim(),
      graduation_year: gradYearVal.trim(),
      city_state: cityStateVal.trim(),
      linkedin_profile: data.linkedin_url?.trim() || data.linkedin_profile?.trim() || "",
      motivation: data.motivation?.trim() || `Video Pitch: ${data.video_pitch_url}`,
      created_at: new Date().toISOString(),
      status: "pending",
    };

    // 0. Primary dedicated table: ambassador_applications (if migrated)
    try {
      await admin.from("ambassador_applications").upsert({
        id: record.id,
        full_name: record.full_name,
        email: record.email,
        phone: record.phone,
        full_address: record.full_address,
        state: record.state,
        district: record.district,
        college_name: record.college_name,
        college_location: record.college_location,
        branch: record.branch,
        department: record.department,
        expected_graduation_year: record.expected_graduation_year,
        languages_known: record.languages_known,
        video_pitch_url: record.video_pitch_url,
        portrait_photo_url: record.portrait_photo_url,
        linkedin_url: record.linkedin_url || null,
        instagram_url: record.instagram_url || null,
        agreement_accepted: record.agreement_accepted,
        terms_accepted: record.terms_accepted,
        status: record.status,
        cohort_name: "First Cohort 2026-27",
        applicant_email_confirmed: true,
        admin_notified: true,
        created_at: record.created_at,
        updated_at: record.created_at,
      });
    } catch (tblErr) {
      console.warn("[ambassador_applications] table insert skipped (run SQL migration to create table):", tblErr);
    }

    // 1. Store in site_settings under 'ambassador_first_cohort_registrations'
    // Try updating in ambassador_applications table if migrated
    try {
      await admin
        .from("ambassador_applications")
        .update({ status: data.status, updated_at: new Date().toISOString() })
        .eq("id", data.applicant_id);
    } catch {
      // Table may not exist yet
    }

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

    // 2. Also record in applications table with role_applied
    try {
      await admin.from("applications").insert({
        id: crypto.randomUUID(),
        full_name: record.full_name,
        email: cleanEmail,
        phone: record.phone,
        role_applied: "Institutional Relations Associate (Campus Ambassador)",
        college: record.college_name,
        state: record.state,
        graduation_year: parseInt(record.expected_graduation_year, 10) || 2026,
        linkedin_url: record.linkedin_url || null,
        profile_photo_url: record.portrait_photo_url || null,
        agreement_accepted: true,
        status: "new",
        message: `Video Pitch: ${record.video_pitch_url}. Languages: ${(record.languages_known || []).join(", ")}. Address: ${record.full_address}.`,
      });
    } catch (appErr) {
      console.warn("[applications] optional dual-table insert skipped:", appErr);
    }

    // 3. Automated Emails to Applicant and Admin
    try {
      await sendAmbassadorAutomatedEmails(record);
    } catch (emailErr) {
      console.error("[ambassador] Automated confirmation email error:", emailErr);
    }

    // 4. In-App Notification if user profile exists
    try {
      const { data: profile } = await admin
        .from("profiles")
        .select("id")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (profile?.id) {
        await admin.from("user_notifications").insert({
          user_id: profile.id,
          title: "Ambassador First Cohort — Application Received!",
          message: `Your application (${record.id}) for Vyntyra Institutional Relations Associate at ${record.college_name} has been received. Check your email for agreement details!`,
          type: "announcement",
          read: false,
          created_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn("Notification logging failed silently:", e);
    }

    return {
      success: true,
      id: record.id,
      message: "Application submitted successfully! Confirmation email dispatched.",
    };
  });

// ─── Update Candidate Status (Admin) ──────────────────────────────
export const updateAmbassadorApplicantStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => {
    const input = (d as any)?.data !== undefined ? (d as any).data : d;
    return z.object({
      applicant_id: z.string().min(1),
      status: z.enum(["pending", "shortlisted", "enrolled", "rejected"]),
    }).parse(input);
  })
  .handler(async ({ data, context }) => {
    if (!(await checkIsAdmin(context.userId))) {
      throw new Error("Forbidden: Super Admin access required.");
    }

    const admin = getAdminClient();
    // Try updating in ambassador_applications table if migrated
    try {
      await admin
        .from("ambassador_applications")
        .update({ status: data.status, updated_at: new Date().toISOString() })
        .eq("id", data.applicant_id);
    } catch {
      // Table may not exist yet
    }

    const { data: existingSetting } = await admin
      .from("site_settings")
      .select("value")
      .eq("id", "ambassador_first_cohort_registrations")
      .maybeSingle();

    if (!existingSetting?.value) {
      throw new Error("No applicant records found.");
    }

    let list: AmbassadorRegistration[] = Array.isArray(existingSetting.value)
      ? existingSetting.value
      : JSON.parse(existingSetting.value);

    const target = list.find((a) => a.id === data.applicant_id);
    if (!target) {
      throw new Error("Applicant not found.");
    }

    target.status = data.status;

    await admin.from("site_settings").upsert({
      id: "ambassador_first_cohort_registrations",
      value: list,
      updated_at: new Date().toISOString(),
    });

    return { success: true, applicant: target };
  });

// ─── List Registered Campus Ambassadors for Admin ───────────────────
export const listAmbassadorRegistrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const admin = getAdminClient();

    // Check dedicated ambassador_applications table first
    try {
      const { data: rows, error: tblErr } = await admin
        .from("ambassador_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (!tblErr && rows && rows.length > 0) {
        return rows as AmbassadorRegistration[];
      }
    } catch {
      // Table may not exist yet, fallback to site_settings
    }

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
  .validator((d: unknown) => {
    const input = (d as any)?.data !== undefined ? (d as any).data : d;
    return z.object({
      recipient_email: z.string().trim().email(),
      recipient_name: z.string().optional().nullable(),
      college_name: z.string().optional().nullable(),
      custom_subject: z.string().optional().nullable(),
    }).parse(input);
  })
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

// ═════════════════════════════════════════════════════════════════════
// ─── AMBASSADOR APPLICATION LIFECYCLE & AUTOMATED EMAIL TEMPLATES ────
// ═════════════════════════════════════════════════════════════════════

export interface AmbassadorEmailTemplate {
  id: string;
  status_trigger: "under_review" | "shortlisted" | "selected" | "agreement_sent" | "rejected";
  title: string;
  subject: string;
  body_html: string;
  body_text?: string;
  is_enabled: boolean;
  sender_name?: string;
  sender_email?: string;
  agreement_url?: string;
  updated_at?: string;
}

export const DEFAULT_AMBASSADOR_EMAIL_TEMPLATES: AmbassadorEmailTemplate[] = [
  {
    id: "tmpl_under_review",
    status_trigger: "under_review",
    title: "Application Under Review Notification",
    subject: "🔍 Application Under Review: Vyntyra Institutional Relations Associate — {{cohort_name}}",
    body_html: `<p>Dear <strong>{{full_name}}</strong>,</p>
<p>Your application for <strong>Vyntyra Institutional Relations Associate (Campus Ambassador)</strong> representing <strong>{{college_name}}</strong> is officially <strong>under committee review</strong>.</p>
<p>Our selection panel is currently reviewing your academic background, campus leadership profile, and your 5-10 minute video pitch.</p>
<p>We will notify you shortly regarding candidate shortlisting and interview rounds.</p>
<p>Best regards,<br/><strong>Vyntyra Institutional Relations Committee</strong></p>`,
    is_enabled: true,
  },
  {
    id: "tmpl_shortlisted",
    status_trigger: "shortlisted",
    title: "Candidate Shortlisted Notification",
    subject: "🎉 Congratulations! You are Shortlisted for Vyntyra Institutional Relations Associate",
    body_html: `<p>Dear <strong>{{full_name}}</strong>,</p>
<p>We are delighted to inform you that you have been <strong>Shortlisted</strong> for the <strong>First Cohort 2026-27</strong> of the Vyntyra Institutional Relations Associate Program representing <strong>{{college_name}}</strong>!</p>
<p>Your video pitch and academic track record demonstrated exemplary leadership potential.</p>
<p><strong>Next Steps:</strong> You will receive an interview slot invitation and identity verification schedule within the next 48 hours.</p>
<p>Warm regards,<br/><strong>Vyntyra Campus Leadership Cell</strong></p>`,
    is_enabled: true,
  },
  {
    id: "tmpl_selected",
    status_trigger: "selected",
    title: "Selection Letter & 6-Month Agreement Dispatched",
    subject: "🏆 Official Selection: Vyntyra Institutional Relations Associate & 6-Month Agreement",
    body_html: `<p>Dear <strong>{{full_name}}</strong>,</p>
<p>Heartiest congratulations! You have been officially <strong>SELECTED</strong> as the <strong>Vyntyra Institutional Relations Associate (Campus Ambassador)</strong> for <strong>{{college_name}}</strong> in Cohort 1.0!</p>
<p>As outlined in our program terms, your appointment is for a <strong>formal 6-month tenure</strong>.</p>
<p><strong>Action Required - 6-Month Agreement:</strong><br/>
Please download, review, and digitally sign your official <strong>6-Month Association Agreement Document</strong> using the link below:</p>
<p><a href="{{agreement_link}}" style="display:inline-block;padding:12px 24px;background:#f59e0b;color:#0b1120;font-weight:bold;text-decoration:none;border-radius:6px;">Review &amp; Sign 6-Month Agreement &rarr;</a></p>
<p><strong>📦 Dispatch Policy Notice:</strong> Please note that as per company policy, your personalized Executive IRA Welcome Kit, ID Badge, and corporate swags will be dispatched <strong>after reaching your 1st milestone only</strong>.</p>
<p>Warm congratulations,<br/><strong>Board of Directors · Vyntyra Consultancy Services Pvt. Ltd.</strong></p>`,
    agreement_url: "https://vyntyraconsultancyservices.in/campus-ambassador/agreement-sample.pdf",
    is_enabled: true,
  },
  {
    id: "tmpl_agreement_sent",
    status_trigger: "agreement_sent",
    title: "Onboarding & 1st Milestone Welcome Kit Dispatch Notice",
    subject: "🚀 Welcome Onboard! Official Onboarding Active — Vyntyra IRA",
    body_html: `<p>Dear <strong>{{full_name}}</strong>,</p>
<p>Your 6-month agreement has been recorded. You are officially an active <strong>Institutional Relations Associate</strong> representing Vyntyra at <strong>{{college_name}}</strong>!</p>
<p>📦 <strong>Welcome Kit &amp; Swags Policy:</strong> Scheduled for priority packaging &amp; courier dispatch <strong>immediately upon reaching your 1st milestone</strong>.<br/>
💼 <strong>Rewards Portal:</strong> Milestone stipends up to ₹15,000 are now active.<br/>
📲 <strong>Ambassador Community:</strong> You will be added to the private Cohort 1.0 Executive Slack &amp; WhatsApp group.</p>
<p>Welcome to the family!<br/><strong>Vyntyra Corporate Leadership Team</strong></p>`,
    is_enabled: true,
  },
  {
    id: "tmpl_rejected",
    status_trigger: "rejected",
    title: "Application Status Update (Not Shortlisted)",
    subject: "Update regarding your Vyntyra Campus Ambassador Application (First Cohort)",
    body_html: `<p>Dear <strong>{{full_name}}</strong>,</p>
<p>Thank you very much for your interest and the time you invested in applying for the Vyntyra Institutional Relations Associate First Cohort from <strong>{{college_name}}</strong>.</p>
<p>Due to exceptional application volumes and strictly limited allocations per institution, we are unable to advance your application for Cohort 1.0 at this time.</p>
<p>We thoroughly enjoyed reviewing your profile and invite you to participate in upcoming Vyntyra technical hackathons, bootcamps, and future cohort cycles.</p>
<p>Wishing you the very best in your academic and professional endeavors.<br/><strong>Vyntyra Talent Acquisition &amp; Student Relations</strong></p>`,
    is_enabled: true,
  },
];

// Helper to replace template tokens
function renderEmailTemplateText(
  templateText: string,
  variables: Record<string, string>
): string {
  let rendered = templateText;
  Object.entries(variables).forEach(([k, v]) => {
    const regex = new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, "g");
    rendered = rendered.replace(regex, v || "");
  });
  return rendered;
}

// ─── Fetch Automated Email Templates (Admin) ────────────────────────
export const getAmbassadorEmailTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await checkIsAdmin(context.userId))) {
      throw new Error("Forbidden: Super Admin access required.");
    }
    const admin = getAdminClient();

    // 1. Try fetching from public.ambassador_email_templates table
    try {
      const { data: rows, error } = await admin
        .from("ambassador_email_templates")
        .select("*")
        .order("created_at", { ascending: true });

      if (!error && rows && rows.length > 0) {
        return rows as AmbassadorEmailTemplate[];
      }
    } catch {
      // Table may not exist yet
    }

    // 2. Try fetching from site_settings
    try {
      const { data: setting } = await admin
        .from("site_settings")
        .select("value")
        .eq("id", "ambassador_automated_email_templates")
        .maybeSingle();

      if (setting?.value) {
        const parsed = Array.isArray(setting.value)
          ? setting.value
          : JSON.parse(setting.value);
        if (parsed && parsed.length > 0) {
          return parsed as AmbassadorEmailTemplate[];
        }
      }
    } catch {
      // Fallback
    }

    return DEFAULT_AMBASSADOR_EMAIL_TEMPLATES;
  });

// ─── Update an Automated Email Template (Admin) ─────────────────────
export const updateAmbassadorEmailTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => {
    const input = (d as any)?.data !== undefined ? (d as any).data : d;
    return z.object({
      id: z.string().min(1),
      status_trigger: z.enum([
        "under_review",
        "shortlisted",
        "selected",
        "agreement_sent",
        "rejected",
      ]),
      title: z.string().min(1),
      subject: z.string().min(1),
      body_html: z.string().min(1),
      agreement_url: z.string().optional().nullable(),
      is_enabled: z.boolean(),
    }).parse(input);
  })
  .handler(async ({ data, context }) => {
    if (!(await checkIsAdmin(context.userId))) {
      throw new Error("Forbidden: Super Admin access required.");
    }
    const admin = getAdminClient();

    // Update in table if exists
    try {
      await admin.from("ambassador_email_templates").upsert({
        id: data.id,
        status_trigger: data.status_trigger,
        title: data.title,
        subject: data.subject,
        body_html: data.body_html,
        agreement_url: data.agreement_url || null,
        is_enabled: data.is_enabled,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("ambassador_email_templates table update skipped:", e);
    }

    // Also update in site_settings for fail-safe persistence
    try {
      const { data: setting } = await admin
        .from("site_settings")
        .select("value")
        .eq("id", "ambassador_automated_email_templates")
        .maybeSingle();

      let list: AmbassadorEmailTemplate[] = [];
      if (setting?.value) {
        list = Array.isArray(setting.value)
          ? setting.value
          : JSON.parse(setting.value);
      } else {
        list = [...DEFAULT_AMBASSADOR_EMAIL_TEMPLATES];
      }

      const idx = list.findIndex(
        (t) => t.status_trigger === data.status_trigger || t.id === data.id
      );
      const updatedItem: AmbassadorEmailTemplate = {
        id: data.id,
        status_trigger: data.status_trigger,
        title: data.title,
        subject: data.subject,
        body_html: data.body_html,
        agreement_url: data.agreement_url || undefined,
        is_enabled: data.is_enabled,
        updated_at: new Date().toISOString(),
      };

      if (idx >= 0) {
        list[idx] = updatedItem;
      } else {
        list.push(updatedItem);
      }

      await admin.from("site_settings").upsert({
        id: "ambassador_automated_email_templates",
        value: list,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("site_settings template update skipped:", e);
    }

    return { success: true };
  });

// ─── Update Application Status with Automated Email Trigger (Admin) ─
export const updateAmbassadorApplicationStatusWithEmail = createServerFn({
  method: "POST",
})
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => {
    const input = (d as any)?.data !== undefined ? (d as any).data : d;
    return z.object({
      application_id: z.string().min(1),
      new_status: z.enum([
        "pending",
        "under_review",
        "shortlisted",
        "selected",
        "accepted",
        "agreement_sent",
        "enrolled",
        "rejected",
      ]),
      notes: z.string().optional().nullable().default(""),
      send_email: z.boolean().default(true),
      custom_email_subject: z.string().optional().nullable(),
      custom_email_body: z.string().optional().nullable(),
      agreement_document_url: z.string().optional().nullable(),
    }).parse(input);
  })
  .handler(async ({ data, context }) => {
    if (!(await checkIsAdmin(context.userId))) {
      throw new Error("Forbidden: Super Admin access required.");
    }
    const admin = getAdminClient();

    // 1. Fetch current application record
    let applicant: AmbassadorRegistration | null = null;

    try {
      const { data: row } = await admin
        .from("ambassador_applications")
        .select("*")
        .eq("id", data.application_id)
        .maybeSingle();
      if (row) applicant = row as AmbassadorRegistration;
    } catch {
      // Fallback to site_settings
    }

    const { data: setting } = await admin
      .from("site_settings")
      .select("value")
      .eq("id", "ambassador_first_cohort_registrations")
      .maybeSingle();

    let list: AmbassadorRegistration[] = [];
    if (setting?.value) {
      list = Array.isArray(setting.value)
        ? setting.value
        : JSON.parse(setting.value);
    }

    const target = list.find((a) => a.id === data.application_id);
    if (!applicant && target) {
      applicant = target;
    }

    if (!applicant) {
      throw new Error("Candidate application not found.");
    }

    const previousStatus = applicant.status;
    const nowIso = new Date().toISOString();

    // Update timestamps based on status
    const updatePayload: Record<string, any> = {
      status: data.new_status,
      updated_at: nowIso,
      review_notes: data.notes || (applicant as any).review_notes,
      reviewed_by: context.userId,
    };

    if (data.new_status === "under_review") {
      updatePayload.under_review_at = nowIso;
    } else if (data.new_status === "shortlisted") {
      updatePayload.shortlisted_at = nowIso;
    } else if (data.new_status === "selected" || data.new_status === "accepted") {
      updatePayload.selected_at = nowIso;
      if (data.agreement_document_url) {
        updatePayload.agreement_document_url = data.agreement_document_url;
      }
    } else if (data.new_status === "agreement_sent" || data.new_status === "enrolled") {
      updatePayload.agreement_sent_at = nowIso;
    } else if (data.new_status === "rejected") {
      updatePayload.rejected_at = nowIso;
    }

    // 2. Persist in ambassador_applications table
    try {
      await admin
        .from("ambassador_applications")
        .update(updatePayload)
        .eq("id", data.application_id);
    } catch (e) {
      console.warn("ambassador_applications update skipped:", e);
    }

    // 3. Persist in site_settings list
    if (target) {
      target.status = data.new_status as any;
      (target as any).review_notes = data.notes;
      (target as any).updated_at = nowIso;
      await admin.from("site_settings").upsert({
        id: "ambassador_first_cohort_registrations",
        value: list,
        updated_at: nowIso,
      });
    }

    // 4. Handle Automated Email Dispatch if enabled
    let emailSent = false;
    let emailError: string | null = null;
    let emailProvider = "none";

    if (data.send_email) {
      try {
        // Resolve status trigger for template lookup
        const triggerKey =
          data.new_status === "accepted"
            ? "selected"
            : data.new_status === "enrolled"
            ? "agreement_sent"
            : data.new_status;

        // Fetch template
        let template: AmbassadorEmailTemplate | undefined;
        try {
          const { data: tRow } = await admin
            .from("ambassador_email_templates")
            .select("*")
            .eq("status_trigger", triggerKey)
            .maybeSingle();
          if (tRow) template = tRow as AmbassadorEmailTemplate;
        } catch {
          // Fallback
        }

        if (!template) {
          template = DEFAULT_AMBASSADOR_EMAIL_TEMPLATES.find(
            (t) => t.status_trigger === triggerKey
          );
        }

        if (template && (template.is_enabled || data.custom_email_body)) {
          const agreementLink =
            data.agreement_document_url ||
            template.agreement_url ||
            "https://vyntyraconsultancyservices.in/campus-ambassador/agreement-sample.pdf";

          const variables: Record<string, string> = {
            full_name: applicant.full_name,
            email: applicant.email,
            phone: applicant.phone,
            college_name: applicant.college_name,
            id: applicant.id,
            branch: applicant.branch || applicant.degree_branch || "Technology",
            cohort_name: "First Cohort 2026-27",
            agreement_link: agreementLink,
          };

          const finalSubject = renderEmailTemplateText(
            data.custom_email_subject || template.subject,
            variables
          );
          const rawBody = data.custom_email_body || template.body_html;
          const renderedInnerHtml = renderEmailTemplateText(rawBody, variables);

          // Wrap in Luxury Shell
          const finalHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#070b14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="620" cellspacing="0" cellpadding="0" style="max-width:620px;width:100%;background:#0d1527;border:1px solid #1e293b;border-radius:16px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
          <tr><td style="height:6px;background:linear-gradient(90deg, #f59e0b, #ec4899, #6366f1);"></td></tr>
          <tr>
            <td style="padding:32px 32px 10px 32px;text-align:center;">
              <div style="display:inline-block;padding:5px 12px;background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.3);border-radius:9999px;font-size:11px;font-weight:800;color:#fbbf24;text-transform:uppercase;margin-bottom:12px;">
                ✨ VYNTYRA CAMPUS AMBASSADOR PROGRAM · COHORT 1.0
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 32px 30px 32px;font-size:14px;line-height:1.7;color:#cbd5e1;">
              ${renderedInnerHtml}
            </td>
          </tr>
          <tr>
            <td style="background-color:#050811;padding:20px;text-align:center;border-top:1px solid #1e293b;">
              <p style="margin:0;font-size:11px;color:#64748b;line-height:1.6;">
                Vyntyra Consultancy Services Pvt. Ltd. · Great Place to Work® Certified<br/>
                Institutional Relations & Campus Ambassador Cell<br/>
                Desk: <a href="mailto:ambassadorprogram@vyntyraconsultancyservices.in" style="color:#fbbf24;text-decoration:none;">ambassadorprogram@vyntyraconsultancyservices.in</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

          // Send via Resend / Brevo
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
                  from: "Vyntyra Ambassador Program <careers@vyntyraconsultancyservices.in>",
                  to: [applicant.email],
                  subject: finalSubject,
                  html: finalHtml,
                }),
              });
              if (res.ok) {
                emailSent = true;
                emailProvider = "resend";
              }
            } catch (err: any) {
              emailError = err.message;
            }
          }

          if (!emailSent && process.env.BREVO_API_KEY) {
            try {
              const res = await fetch("https://api.brevo.com/v3/smtp/email", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "api-key": process.env.BREVO_API_KEY,
                },
                body: JSON.stringify({
                  sender: {
                    name: "Vyntyra Institutional Relations Cell",
                    email: "ambassadorprogram@vyntyraconsultancyservices.in",
                  },
                  to: [{ email: applicant.email, name: applicant.full_name }],
                  subject: finalSubject,
                  htmlContent: finalHtml,
                }),
              });
              if (res.ok) {
                emailSent = true;
                emailProvider = "brevo";
              }
            } catch (err: any) {
              emailError = err.message;
            }
          }

          // Record in automated_email_logs
          try {
            await admin.from("automated_email_logs").insert({
              recipient_email: applicant.email,
              recipient_name: applicant.full_name,
              subject: finalSubject,
              status: emailSent ? "sent" : "failed",
              provider_used: emailProvider,
              error_message: emailError,
              created_at: nowIso,
            });
          } catch {
            // Ignored
          }
        }
      } catch (err: any) {
        emailError = err.message;
      }
    }

    // 5. Record Audit Log in ambassador_application_logs
    try {
      await admin.from("ambassador_application_logs").insert({
        application_id: data.application_id,
        previous_status: previousStatus,
        new_status: data.new_status,
        changed_by: context.userId,
        notes: data.notes || null,
        email_dispatched: emailSent,
        email_provider: emailProvider,
        email_error: emailError,
        created_at: nowIso,
      });
    } catch {
      // Ignored
    }

    return {
      success: true,
      application_id: data.application_id,
      new_status: data.new_status,
      email_dispatched: emailSent,
      email_provider: emailProvider,
      email_error: emailError,
    };
  });

// ─── Send Test Status Email (Admin) ─────────────────────────────────
export const sendTestAmbassadorStatusEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => {
    const input = (d as any)?.data !== undefined ? (d as any).data : d;
    return z.object({
      target_email: z.string().email(),
      status_trigger: z.enum([
        "under_review",
        "shortlisted",
        "selected",
        "agreement_sent",
        "rejected",
      ]),
      custom_subject: z.string().optional().nullable(),
      custom_body: z.string().optional().nullable(),
      agreement_url: z.string().optional().nullable(),
    }).parse(input);
  })
  .handler(async ({ data, context }) => {
    if (!(await checkIsAdmin(context.userId))) {
      throw new Error("Forbidden: Super Admin access required.");
    }

    const triggerKey = data.status_trigger;
    const template =
      DEFAULT_AMBASSADOR_EMAIL_TEMPLATES.find(
        (t) => t.status_trigger === triggerKey
      ) || DEFAULT_AMBASSADOR_EMAIL_TEMPLATES[0];

    const variables: Record<string, string> = {
      full_name: "Sample Applicant (Test Preview)",
      email: data.target_email,
      phone: "+91 98765 43210",
      college_name: "Indian Institute of Technology, Madras",
      id: "VCS-IRA-TEST-001",
      branch: "Computer Science & Engineering",
      cohort_name: "First Cohort 2026-27",
      agreement_link:
        data.agreement_url ||
        template.agreement_url ||
        "https://vyntyraconsultancyservices.in/campus-ambassador/agreement-sample.pdf",
    };

    const finalSubject = `[TEST PREVIEW] ${renderEmailTemplateText(
      data.custom_subject || template.subject,
      variables
    )}`;
    const rawBody = data.custom_body || template.body_html;
    const renderedBody = renderEmailTemplateText(rawBody, variables);

    const finalHtml = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:20px;background-color:#070b14;font-family:sans-serif;color:#f8fafc;">
  <div style="max-width:600px;margin:auto;background:#0d1527;border:1px solid #1e293b;border-radius:12px;padding:24px;">
    <div style="background:#f59e0b;color:#000;font-weight:bold;font-size:11px;padding:4px 8px;border-radius:4px;display:inline-block;margin-bottom:12px;">
      PREVIEW EMAIL
    </div>
    ${renderedBody}
  </div>
</body>
</html>`;

    let sent = false;
    let lastError = "";
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
            to: [data.target_email],
            subject: finalSubject,
            html: finalHtml,
          }),
        });
        if (res.ok) {
          sent = true;
        } else {
          const errData: any = await res.json().catch(() => ({}));
          lastError = errData?.message || `Resend HTTP ${res.status}`;
        }
      } catch (err: any) {
        lastError = err.message;
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
            sender: {
              name: "Vyntyra Institutional Relations Cell",
              email: "ambassadorprogram@vyntyraconsultancyservices.in",
            },
            to: [{ email: data.target_email, name: "Admin Preview" }],
            subject: finalSubject,
            htmlContent: finalHtml,
          }),
        });
        if (res.ok) {
          sent = true;
        } else {
          const errData: any = await res.json().catch(() => ({}));
          lastError = errData?.message || `Brevo HTTP ${res.status}`;
        }
      } catch (err: any) {
        lastError = err.message;
      }
    }

    if (!sent && !resendKey && !process.env.BREVO_API_KEY) {
      lastError = "No email provider credentials found (RESEND_API_KEY / BREVO_API_KEY).";
    }

    return { success: sent, recipient: data.target_email, error: lastError || undefined };
  });
