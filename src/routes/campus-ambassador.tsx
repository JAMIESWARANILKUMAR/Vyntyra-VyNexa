import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Sparkles,
  Award,
  Gift,
  Zap,
  TrendingUp,
  Plane,
  FileCheck2,
  Crown,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  Ticket,
  ShieldCheck,
  Building2,
  Layers,
  HeartHandshake,
  AlertTriangle,
  Flame,
  Star,
  Users,
  Video,
  UploadCloud,
  FileText,
  MapPin,
  GraduationCap,
  Globe,
  Camera,
  ExternalLink,
  Check,
  X,
  Search,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/Header";
import {
  submitAmbassadorApplication,
  uploadAmbassadorPortraitImage,
  getAmbassadorProgramSettings,
  DEFAULT_AMBASSADOR_SETTINGS,
  DEFAULT_AMBASSADOR_PROGRESSION,
  DEFAULT_AMBASSADOR_TIERS,
  type AmbassadorProgramSettings,
  type AmbassadorProductItem,
  type AmbassadorRewardTier,
} from "@/lib/ambassador.functions";
import { STATES, COLLEGES, type StateName } from "@/lib/colleges";
import { getDistrictsForState } from "@/lib/districts";
import { AmbassadorComingSoonModal } from "@/components/ambassador-coming-soon-modal";
import { GLOBAL_SEO_META_TAGS } from "@/lib/seo-metadata";

export const Route = createFileRoute("/campus-ambassador")({
  head: () => ({
    meta: [
      {
        title:
          "Vyntyra Institutional Relations Associate (Campus Ambassador Program) — First Cohort 2026-27",
      },
      {
        name: "description",
        content:
          "Official Launching Soon: Vyntyra Institutional Relations Associate (Campus Ambassador) Program First Cohort. Exclusive welcome kit, branded gadgets (Earbuds, Powerbanks, Soundbars, Smartwatches), rewards up to ₹15,000, top 10 curated travel retreat, dual internship certificates & VVIP event access across Indian colleges.",
      },
      {
        name: "keywords",
        content:
          "Campus Ambassador Program 2026, Vyntyra Institutional Relations Associate, College Ambassador Internship India, Student Partner Program, Campus Lead, Earn up to 15k College Students, Free Tech Gadgets Internship, Best Campus Ambassador India, Visakhapatnam, Hyderabad, Bengaluru, Delhi, Mumbai, Pune, Chennai, Kolkata, Engineering Student Internships",
      },
      { name: "geo.region", content: "IN-AP" },
      { name: "geo.placename", content: "Visakhapatnam, Andhra Pradesh, India" },
      { name: "geo.position", content: "17.6868;83.2185" },
      { name: "ICBM", content: "17.6868, 83.2185" },
      {
        property: "og:title",
        content:
          "Vyntyra Institutional Relations Associate (Campus Ambassador) — First Cohort Launching Soon",
      },
      {
        property: "og:description",
        content:
          "Join the elite First Cohort. Earn up to ₹15,000, win electronic gadgets, curated travel retreat for Top 10, executive welcome kits, and official dual certification.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://vyntyraconsultancyservices.in/campus-ambassador" },
      ...GLOBAL_SEO_META_TAGS,
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOccupationalProgram",
          name: "Vyntyra Institutional Relations Associate (Campus Ambassador Program) — First Cohort",
          description:
            "Premier student leadership and institutional partnership program by Vyntyra Consultancy Services Pvt. Ltd. Offering ₹15,000 performance rewards, branded electronics, top 10 travel retreats, welcome kits and certified internship recognition.",
          provider: {
            "@type": "Organization",
            name: "Vyntyra Consultancy Services Pvt. Ltd.",
            url: "https://vyntyraconsultancyservices.in",
            logo: "https://vyntyraconsultancyservices.in/icon-512.png",
          },
          timeToComplete: "P6M",
          occupationalCategory: "Institutional Relations, Brand Advocacy, Student Leadership",
          educationalProgramMode: "hybrid",
        }),
      },
    ],
  }),
  component: CampusAmbassadorPage,
});

const ICON_MAP: Record<string, any> = {
  Gift,
  Award,
  TrendingUp,
  Zap,
  Plane,
  FileCheck2,
  Crown,
  Sparkles,
  ShieldCheck,
  Building2,
  HeartHandshake,
  Layers,
  CheckCircle2,
  Ticket,
  Flame,
  Star,
  Users,
};

const COMMON_BRANCHES = [
  "Computer Science & Engineering (CSE)",
  "Artificial Intelligence & Machine Learning (AI/ML)",
  "Data Science & Big Data Analytics",
  "Information Technology (IT)",
  "Electronics & Communication Engineering (ECE)",
  "Electrical & Electronics Engineering (EEE)",
  "Mechanical Engineering",
  "Civil Engineering",
  "Master of Business Administration (MBA)",
  "Bachelor of Business Administration (BBA)",
  "Master of Computer Applications (MCA)",
  "Bachelor of Computer Applications (BCA)",
  "Other / Multidisciplinary",
];

const COMMON_DEPARTMENTS = [
  "Department of Engineering & Technology",
  "Department of Computer Applications & IT",
  "Department of Management Studies & Commerce",
  "Department of Sciences & Humanities",
  "Department of Institutional Affairs / Student Affairs",
  "Other Department",
];

const PRESET_LANGUAGES = [
  "English",
  "Hindi",
  "Telugu",
  "Tamil",
  "Kannada",
  "Malayalam",
  "Marathi",
  "Bengali",
  "Gujarati",
  "Punjabi",
  "Odia",
  "Urdu",
];

function isGoogleDriveUrl(url: string): boolean {
  if (!url) return false;
  return /(drive\.google\.com|docs\.google\.com)/i.test(url.trim());
}

function CampusAmbassadorPage() {
  const submitApplicationFn = useServerFn(submitAmbassadorApplication);
  const uploadPortraitFn = useServerFn(uploadAmbassadorPortraitImage);
  const fetchSettingsFn = useServerFn(getAmbassadorProgramSettings);

  // Dynamic Admin Settings
  const settingsQ = useQuery({
    queryKey: ["ambassador-settings"],
    queryFn: () => fetchSettingsFn(),
  });

  const settings: AmbassadorProgramSettings = settingsQ.data || DEFAULT_AMBASSADOR_SETTINGS;
  const theme = settings.theme || DEFAULT_AMBASSADOR_SETTINGS.theme;
  const isEnabled = settings.applications_enabled !== false;

  // Dynamic Progression Milestones & Tiers
  const progressionData = settings.progression_table || DEFAULT_AMBASSADOR_PROGRESSION;
  const progressionTiers = useMemo(() => {
    return Array.isArray(progressionData.tiers) && progressionData.tiers.length > 0
      ? progressionData.tiers
      : DEFAULT_AMBASSADOR_TIERS;
  }, [progressionData.tiers]);
  const progressionNotes = useMemo(() => {
    return Array.isArray(progressionData.notes) && progressionData.notes.length > 0
      ? progressionData.notes
      : DEFAULT_AMBASSADOR_PROGRESSION.notes;
  }, [progressionData.notes]);

  // Active products
  const allActiveProducts = useMemo(() => {
    const list = settings.products || DEFAULT_AMBASSADOR_SETTINGS.products;
    return list.filter((p) => p.is_active);
  }, [settings.products]);

  const swagsAndGoodies = useMemo(
    () => allActiveProducts.filter((p) => p.category !== "Gadgets"),
    [allActiveProducts]
  );
  const gadgetsList = useMemo(
    () => allActiveProducts.filter((p) => p.category === "Gadgets" || p.featured_in_gadgets),
    [allActiveProducts]
  );

  // Coming Soon Modal State
  const [comingSoonModalOpen, setComingSoonModalOpen] = useState(false);

  // ─── Comprehensive Application Form State ───
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  
  // Location
  const [state, setState] = useState<string>("Andhra Pradesh");
  const [district, setDistrict] = useState<string>("Visakhapatnam");
  const [customDistrict, setCustomDistrict] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [customCollege, setCustomCollege] = useState("");
  const [collegeLocation, setCollegeLocation] = useState("");

  // Education
  const [branch, setBranch] = useState("Computer Science & Engineering (CSE)");
  const [customBranch, setCustomBranch] = useState("");
  const [department, setDepartment] = useState("Department of Engineering & Technology");
  const [graduationYear, setGraduationYear] = useState("2026");
  const [languages, setLanguages] = useState<string[]>(["English", "Hindi"]);
  const [otherLanguage, setOtherLanguage] = useState("");

  // Video Pitch (Mandatory Google Drive Link)
  const [videoPitchUrl, setVideoPitchUrl] = useState("");
  const [videoTouched, setVideoTouched] = useState(false);

  // Professional Portrait Image (White Background)
  const [portraitUrl, setPortraitUrl] = useState("");
  const [uploadingPortrait, setUploadingPortrait] = useState(false);

  // Social Links
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");

  // Mandatory 6-Month Agreement & Terms Checkboxes
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submittedApp, setSubmittedApp] = useState<{ id: string; name: string; email: string } | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [selectedGalleryCategory, setSelectedGalleryCategory] = useState<string>("All");

  // Districts for selected state
  const availableDistricts = useMemo(() => {
    return getDistrictsForState(state);
  }, [state]);

  // College search & selection state
  const [collegeSearch, setCollegeSearch] = useState("");
  const [isCollegeFocused, setIsCollegeFocused] = useState(false);

  // All Colleges for selected state (Full directory without slice truncation)
  const stateCollegesList = useMemo(() => {
    if (!state) return [];
    return (COLLEGES as Record<string, string[]>)[state] || [];
  }, [state]);

  // Filtered colleges matching search query across state (or all 14,682 colleges nationally if no state selected)
  const filteredColleges = useMemo(() => {
    const q = collegeSearch.toLowerCase().trim();
    if (state && stateCollegesList.length > 0) {
      if (!q) {
        return stateCollegesList.slice(0, 100);
      }
      return stateCollegesList.filter((c) => c.toLowerCase().includes(q));
    }

    // If state is not selected yet, enable global search across all 14,682 colleges
    if (q.length >= 2) {
      const results: { name: string; state: string }[] = [];
      for (const [stName, colleges] of Object.entries(COLLEGES)) {
        for (const c of colleges) {
          if (c.toLowerCase().includes(q)) {
            results.push({ name: c, state: stName });
            if (results.length >= 100) break;
          }
        }
        if (results.length >= 100) break;
      }
      return results;
    }

    return [];
  }, [state, stateCollegesList, collegeSearch]);

  // Handle State Change
  const handleStateChange = (newState: string) => {
    setState(newState);
    const districts = getDistrictsForState(newState);
    setDistrict(districts[0] || "");
    setCollegeName("");
    setCustomCollege("");
    setCollegeSearch("");
  };

  // Toggle Language
  const toggleLanguage = (lang: string) => {
    if (languages.includes(lang)) {
      if (languages.length > 1) {
        setLanguages(languages.filter((l) => l !== lang));
      }
    } else {
      setLanguages([...languages, lang]);
    }
  };

  const addCustomLanguage = () => {
    if (otherLanguage.trim() && !languages.includes(otherLanguage.trim())) {
      setLanguages([...languages, otherLanguage.trim()]);
      setOtherLanguage("");
    }
  };

  // Portrait Photo Upload Handler
  const handlePortraitUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPEG, PNG, or WebP).");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image file size must be less than 8MB.");
      return;
    }

    setUploadingPortrait(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const res = await uploadPortraitFn({
            data: {
              base64Data: base64,
              fileName: file.name,
              contentType: file.type,
            },
          });
          setPortraitUrl(res.publicUrl);
          toast.success("Professional portrait uploaded successfully!");
        } catch (err: any) {
          toast.error(err.message || "Failed to upload portrait photo.");
        } finally {
          setUploadingPortrait(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error("Error reading file.");
      setUploadingPortrait(false);
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEnabled) {
      toast.error(settings.disabled_notice || "Applications are currently paused.");
      return;
    }

    // Required fields check
    if (!fullName.trim() || !email.trim() || !phone.trim() || !fullAddress.trim()) {
      toast.error("Please fill in your personal contact details and residential address.");
      return;
    }

    const finalCollege = collegeName === "OTHER" ? customCollege.trim() : collegeName.trim();
    if (!finalCollege) {
      toast.error("Please select or enter your college / institution name.");
      return;
    }

    if (!collegeLocation.trim()) {
      toast.error("Please specify your college campus location / city.");
      return;
    }

    const finalBranch = branch === "Other / Multidisciplinary" ? customBranch.trim() : branch;
    if (!finalBranch) {
      toast.error("Please provide your academic branch / discipline.");
      return;
    }

    // Video Pitch validation: Strict Google Drive check
    if (!videoPitchUrl.trim()) {
      toast.error("5 to 10 min Video Pitch link is mandatory to apply.");
      return;
    }

    if (!isGoogleDriveUrl(videoPitchUrl)) {
      toast.error("Invalid Video Pitch Link! Rather than Google Drive links, no other links are acceptable (must be https://drive.google.com/...).");
      return;
    }

    // Portrait image check
    if (!portraitUrl.trim()) {
      toast.error("Please upload your professional portrait image with a white background.");
      return;
    }

    // 6-Month Agreement & Terms check
    if (!agreementAccepted) {
      toast.error("You must acknowledge that this appointment is for a 6-month tenure and agree to sign the formal agreement upon shortlisting.");
      return;
    }

    if (!termsAccepted) {
      toast.error("Please accept the Campus Ambassador Terms & Conditions to proceed.");
      return;
    }

    setLoading(true);
    try {
      const finalDistrict = district === "OTHER" ? customDistrict.trim() : district;

      const res = await submitApplicationFn({
        data: {
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          full_address: fullAddress.trim(),
          state,
          district: finalDistrict || "Visakhapatnam",
          college_name: finalCollege,
          college_location: collegeLocation.trim(),
          branch: finalBranch,
          department,
          expected_graduation_year: graduationYear,
          languages_known: languages,
          video_pitch_url: videoPitchUrl.trim(),
          portrait_photo_url: portraitUrl.trim(),
          linkedin_url: linkedinUrl.trim(),
          instagram_url: instagramUrl.trim(),
          agreement_accepted: true,
          terms_accepted: true,
        },
      });

      setSubmittedApp({
        id: res.id,
        name: fullName.trim(),
        email: email.trim(),
      });
      toast.success("Application submitted successfully! Confirmation email dispatched to your inbox and the admin desk.");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit application. Please check your entries.");
    } finally {
      setLoading(false);
    }
  };

  const scrollToForm = () => {
    const el = document.getElementById("ambassador-application-form");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Gallery categories
  const galleryCategories = useMemo(() => {
    const set = new Set<string>(["All"]);
    swagsAndGoodies.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [swagsAndGoodies]);

  const filteredGallery = useMemo(() => {
    if (selectedGalleryCategory === "All") return swagsAndGoodies;
    return swagsAndGoodies.filter((item) => item.category === selectedGalleryCategory);
  }, [selectedGalleryCategory, swagsAndGoodies]);

  const pillarsList = settings.pillars_section?.pillars || DEFAULT_AMBASSADOR_SETTINGS.pillars_section.pillars;
  const faqsList = settings.faqs || DEFAULT_AMBASSADOR_SETTINGS.faqs;

  return (
    <div
      style={{
        backgroundColor: theme.page_bg_color || "#070b14",
        color: "#f1f5f9",
      }}
      className="min-h-screen selection:bg-amber-500/30 selection:text-amber-200 font-sans relative overflow-x-hidden"
    >
      {/* Top Global Header */}
      <Header />

      {/* Cyber-Luxe Dynamic Background Ambient Light Effects */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          style={{
            background: `radial-gradient(circle, ${theme.glow_primary || "#6366f1"}33 0%, transparent 70%)`,
          }}
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1200px] h-[650px] blur-[150px] opacity-80"
        />
        <div
          style={{
            background: `radial-gradient(circle, ${theme.glow_secondary || "#ec4899"}26 0%, transparent 70%)`,
          }}
          className="absolute top-[800px] -left-48 w-[600px] h-[600px] rounded-full blur-[160px] opacity-70"
        />
        <div
          style={{
            background: `radial-gradient(circle, ${theme.glow_accent || "#f59e0b"}26 0%, transparent 70%)`,
          }}
          className="absolute top-[1800px] -right-48 w-[600px] h-[600px] rounded-full blur-[160px] opacity-70"
        />
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:32px_32px] opacity-20" />
      </div>

      <main className="relative z-10">
        {/* ─── Top Live Priority Countdown Bar ─── */}
        <div className="border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 backdrop-blur-md py-2.5 px-4">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
              </span>
              <span className="font-extrabold uppercase tracking-wider text-amber-300">
                ⚡ Priority Intake: {settings.cohort_name || "First Cohort 2026-27"}
              </span>
              <span className="hidden sm:inline text-slate-400">|</span>
              <span className="hidden sm:inline text-slate-300">
                Official Welcome Kits (Dispatched upon 1st Milestone), ₹15,000 Rewards &amp; Top 10 Curated Retreat
              </span>
            </div>
            <button
              onClick={() => setComingSoonModalOpen(true)}
              className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline underline-offset-4 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Instant VIP Pass</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* ─── Hero Section ─── */}
        <section className="pt-14 pb-20 sm:pt-20 sm:pb-28 px-4 sm:px-6 max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/40 bg-gradient-to-r from-amber-500/20 via-pink-500/15 to-indigo-500/20 backdrop-blur-md shadow-lg shadow-amber-500/10 mb-8 animate-pulse">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400"></span>
            </span>
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.2em] bg-gradient-to-r from-amber-300 via-pink-300 to-indigo-200 bg-clip-text text-transparent">
              {settings.hero?.badge_text || `${settings.cohort_name || "FIRST COHORT 2026-27"} · LAUNCHING SOON`}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08] max-w-5xl mx-auto">
            {settings.hero?.title_prefix || "Vyntyra Institutional Relations Associate"}{" "}
            <span
              style={{
                backgroundImage: `linear-gradient(to right, ${theme.hero_heading_gradient_start || "#fbbf24"}, ${theme.hero_heading_gradient_mid || "#f43f5e"}, ${theme.hero_heading_gradient_end || "#818cf8"})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
              className="block mt-2"
            >
              {settings.hero?.title_gradient || "(Campus Ambassador Program)"}
            </span>
          </h1>

          <p
            style={{ color: theme.hero_desc_color || "#cbd5e1" }}
            className="mt-6 text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed font-light"
          >
            {settings.hero?.description || (
              <>
                Become the official student leader representing Vyntyra Consultancy Services at your institution.
                Unlock <strong className="text-amber-300 font-semibold">exclusive welcome kits (dispatched after reaching 1st milestone only)</strong>,{" "}
                <strong className="text-emerald-300 font-semibold">rewards up to {settings.target_rewards || "₹15,000"}</strong>,{" "}
                <strong className="text-sky-300 font-semibold">branded electronic gadgets</strong>, and qualify for an{" "}
                <strong className="text-pink-300 font-semibold">all-expenses-paid curated travel retreat</strong> for the Top 10.
              </>
            )}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={scrollToForm}
              style={{
                background: `linear-gradient(to right, ${theme.primary_btn_bg_start || "#f59e0b"}, ${theme.primary_btn_bg_end || "#eab308"})`,
                color: theme.primary_btn_text || "#020617",
              }}
              className="font-black px-8 py-5 rounded-full text-base shadow-xl shadow-amber-500/25 transition-all duration-300 hover:scale-105 cursor-pointer uppercase tracking-wider flex items-center gap-2"
            >
              <FileText className="h-5 w-5" />
              <span>Fill Official Application Form</span>
            </button>

            <Button
              onClick={() => setComingSoonModalOpen(true)}
              variant="outline"
              size="lg"
              className="border-slate-700 bg-slate-900/70 hover:bg-slate-800 text-slate-200 hover:text-white px-7 py-6 rounded-full text-sm font-bold backdrop-blur cursor-pointer"
            >
              <Ticket className="mr-2 h-4 w-4 text-amber-400" />
              <span>Quick VIP Pass (Coming Soon)</span>
            </Button>

            <Link
              to="/careers"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-sm transition-all backdrop-blur"
            >
              <Building2 className="h-4 w-4" />
              <span>Explore Corporate Careers</span>
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {(settings.hero?.metrics || DEFAULT_AMBASSADOR_SETTINGS.hero.metrics).map((metric, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: `${theme.card_bg_color || "#0f172a"}80`,
                  borderColor: `${theme.card_border_color || "#1e293b"}`,
                }}
                className="p-4 rounded-xl border backdrop-blur transition-transform hover:-translate-y-1 duration-200"
              >
                <div
                  style={{ color: metric.color || "#fbbf24" }}
                  className="text-2xl sm:text-3xl font-black"
                >
                  {metric.value}
                </div>
                <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Dedicated Goodies, Swags & Merchandise Showcase with Real Images ─── */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto border-t border-slate-800/80">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-pink-500/30 bg-pink-500/10 text-pink-400 text-xs font-mono font-bold tracking-widest uppercase mb-3">
              <Gift className="h-3.5 w-3.5" />
              EXCLUSIVE PHYSICAL SWAGS &amp; MERCHANDISE
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              Goodies, Swags &amp; Corporate Merchandise
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
              Every Institutional Relations Associate represents the gold standard of Vyntyra. Wear the brand, carry the tech gear, and unpack physical premium merchandise delivered directly to your doorstep.
            </p>

            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-lg shadow-amber-500/5">
              <Sparkles className="h-4 w-4 shrink-0 text-amber-400" />
              <span>⭐ Important Dispatch Policy: Physical swags, goodies, and executive welcome kits will be dispatched after reaching 1st milestone only.</span>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {galleryCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedGalleryCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    selectedGalleryCategory === cat
                      ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-500/30 scale-105"
                      : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredGallery.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: `${theme.card_bg_color || "#0f172a"}99`,
                  borderColor: theme.card_border_color || "#1e293b",
                }}
                className="group relative rounded-2xl border overflow-hidden hover:border-amber-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10 flex flex-col justify-between"
              >
                <div className="relative aspect-video sm:aspect-[4/3] w-full overflow-hidden bg-slate-950">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 group-hover:opacity-95"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  <span
                    className={`absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border backdrop-blur-md ${
                      item.badge_style || "border-amber-400/40 bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    {item.badge === "Guaranteed Upon Onboarding" ? "Dispatched After 1st Milestone" : item.badge}
                  </span>
                </div>

                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] font-mono text-amber-400 uppercase tracking-widest mb-1">
                      {item.subtitle}
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono text-[11px]">{settings.cohort_name || "First Cohort"}</span>
                    <button
                      onClick={scrollToForm}
                      className="text-amber-400 hover:text-amber-300 font-semibold text-xs flex items-center gap-1 group/btn cursor-pointer"
                    >
                      <span>Apply Now</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Pillars & Perks Showcase ─── */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400 text-xs font-mono font-bold tracking-widest uppercase mb-3">
              <Sparkles className="h-3 w-3" />
              {settings.pillars_section?.badge || "EXCLUSIVE COHORT PRIVILEGES"}
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              {settings.pillars_section?.heading || `Everything You Receive in ${settings.cohort_name || "First Cohort"}`}
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
              {settings.pillars_section?.description ||
                "Designed to elevate your student profile, provide authentic executive experience, and celebrate institutional leadership with industry-first perks."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pillarsList.map((pillar, idx) => {
              const Icon = ICON_MAP[pillar.icon] || Sparkles;
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: `${theme.card_bg_color || "#0f172a"}90`,
                    borderColor: theme.card_border_color || "#1e293b",
                  }}
                  className="group relative rounded-2xl border p-6 sm:p-7 backdrop-blur hover:border-amber-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col justify-between overflow-hidden"
                >
                  <div className="absolute -right-20 -top-20 w-40 h-40 bg-gradient-to-br from-indigo-500/10 via-amber-500/5 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform shadow-md">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${pillar.badgeColor || "border-amber-500/40 bg-amber-500/10 text-amber-400"}`}>
                        {pillar.highlight}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                      {pillar.title}
                    </h3>
                    <p className="mt-2.5 text-xs sm:text-sm text-slate-400 leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/70 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>{settings.cohort_name || "Cohort 1.0"}</span>
                    <span className="text-amber-400 flex items-center gap-1 font-sans font-semibold">
                      Included <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── Electronic Gadgets Spotlight ─── */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto">
          <div
            style={{
              backgroundColor: `${theme.card_bg_color || "#0f172a"}`,
              borderColor: theme.card_border_color || "#1e293b",
            }}
            className="rounded-3xl border bg-gradient-to-b from-slate-900/90 via-[#0b1329] to-slate-950 p-8 sm:p-12 relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-3xl mb-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-sky-400/30 bg-sky-400/10 text-sky-300 text-xs font-mono font-bold tracking-widest uppercase mb-3">
                <Zap className="h-3.5 w-3.5" />
                {settings.gadgets_section?.badge || "HIGH-PERFORMANCE TECH GEAR"}
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {settings.gadgets_section?.heading || "Branded Electronic Gadgets Showcase"}
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-400 leading-relaxed">
                {settings.gadgets_section?.description ||
                  "As an Institutional Relations Associate, meeting tiered engagement milestones equips your workstation with genuine top-tier consumer electronics."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {gadgetsList.map((gadget) => (
                <div
                  key={gadget.id}
                  className="rounded-2xl border border-slate-800/90 bg-slate-950/60 backdrop-blur hover:border-sky-500/40 transition-all group overflow-hidden flex flex-col justify-between"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                    <img
                      src={gadget.image_url}
                      alt={gadget.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3 w-9 h-9 rounded-lg bg-slate-900/80 backdrop-blur border border-slate-700/60 text-sky-400 flex items-center justify-center">
                      <Zap className="h-4 w-4" />
                    </div>
                    <span className="absolute top-3 right-3 text-[10px] font-mono text-sky-300 bg-sky-500/20 backdrop-blur px-2 py-0.5 rounded border border-sky-400/40">
                      {gadget.badge || "Tech Gear"}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-sky-400 font-bold uppercase mb-1">
                        {gadget.subtitle}
                      </div>
                      <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-sky-300 transition-colors">
                        {gadget.title}
                      </h3>
                      <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                        {gadget.desc}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500 font-mono">Performance Tier</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                        Eligible in Cohort <CheckCircle2 className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              <div className="p-6 rounded-2xl border border-dashed border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-slate-950 to-slate-950 backdrop-blur flex flex-col justify-between">
                <div>
                  <div className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" /> Complete Ecosystem
                  </div>
                  <h4 className="text-lg font-black text-white">
                    Unlock All Electronic Gadgets
                  </h4>
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                    Institutional Relations Associates who fulfill comprehensive college outreach &amp; workshop benchmarks qualify for the full branded workstation ecosystem.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-amber-500/20 flex flex-col gap-3">
                  <button
                    onClick={scrollToForm}
                    style={{
                      background: `linear-gradient(to right, ${theme.primary_btn_bg_start || "#f59e0b"}, ${theme.primary_btn_bg_end || "#eab308"})`,
                      color: theme.primary_btn_text || "#020617",
                    }}
                    className="w-full font-black py-2.5 rounded-lg text-xs cursor-pointer uppercase tracking-wider hover:scale-[1.02] transition-transform"
                  >
                    Apply for First Cohort &rarr;
                  </button>
                  <div className="text-[11px] text-amber-300/80 font-mono text-center">
                    *Performance Criteria Announced at Launch
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Top 10 Curated Travel Experience ─── */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto">
          <div className="rounded-3xl border border-pink-500/30 bg-gradient-to-r from-pink-950/30 via-slate-900 to-indigo-950/40 p-8 sm:p-12 relative overflow-hidden shadow-2xl">
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-pink-500/40 bg-pink-500/10 text-pink-400 text-xs font-mono font-bold tracking-widest uppercase mb-4">
                  <Plane className="h-3.5 w-3.5" />
                  {settings.retreat_section?.badge || "PINNACLE RECOGNITION"}
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                  {settings.retreat_section?.heading || "Top 10 Associates: Curated Travel Experience"}
                </h2>
                <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed font-light">
                  {settings.retreat_section?.description ||
                    "Work hard, lead your campus, and travel in style. The Top 10 Institutional Relations Associates will be awarded an all-expenses-paid curated corporate and leisure retreat with co-associates and company executives."}
                </p>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                  {(
                    settings.retreat_section?.bullets || [
                      "Flight & Luxury Resort Stay Included",
                      "Executive Networking Gala",
                      "Team Building & Adventure Sports",
                      "Exclusive Trophy & Honors Night",
                    ]
                  ).map((bullet, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-pink-400 shrink-0" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 flex justify-center">
                <div className="relative rounded-2xl border border-pink-500/30 bg-slate-900/95 shadow-xl max-w-sm w-full overflow-hidden text-center">
                  <div className="aspect-video w-full overflow-hidden bg-slate-950">
                    <img
                      src={
                        settings.retreat_section?.image_url ||
                        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop"
                      }
                      alt="Curated Travel Retreat"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <div className="text-lg font-bold text-white">
                      {settings.retreat_section?.card_title || "First Cohort Leadership Retreat"}
                    </div>
                    <div className="text-xs text-pink-300 mt-1 uppercase tracking-wider font-mono">
                      {settings.retreat_section?.card_subtitle || "Top 10 Associates Qualifier"}
                    </div>
                    <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                      {settings.retreat_section?.card_description ||
                        "Evaluated based on institutional engagement, student community growth, and overall leadership performance."}
                    </p>
                    <button
                      onClick={scrollToForm}
                      className="mt-5 w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-2.5 rounded-lg shadow-md flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Submit Candidate Application</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── AMBASSADOR TIERED REWARD STRUCTURE ─── */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto">
          <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 via-[#0a1026] to-slate-950 p-8 sm:p-12 relative overflow-hidden shadow-2xl text-white">
            {/* Background Floating Glows */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="text-center max-w-3xl mx-auto mb-12 relative">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 backdrop-blur-md border border-amber-500/30 text-amber-300 shadow-xl mb-4">
                <Trophy className="h-8 w-8 text-amber-400 drop-shadow-md" />
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                {progressionData.heading || "Ambassador Tiered Reward Structure"}
              </h2>
              <p className="mt-3 text-base sm:text-lg text-slate-300 font-medium">
                {progressionData.description || "Progression tiers based on total points accumulated throughout the program duration. Total rewards strictly capped at ₹15,000."}
              </p>
            </div>

            {/* Structured Progression Table */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-md overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[750px]">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 text-white font-bold text-xs sm:text-sm tracking-wide border-b border-slate-800">
                      <th className="py-4 px-6">Tier Category</th>
                      <th className="py-4 px-6 text-center">Points</th>
                      <th className="py-4 px-6 text-center">Milestone Voucher</th>
                      <th className="py-4 px-6">E-Vouchers &amp; Physical Rewards</th>
                      <th className="py-4 px-6">Digital Rewards</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-xs sm:text-sm">
                    {progressionTiers.map((tier) => (
                      <tr
                        key={tier.id}
                        className={`hover:bg-slate-900/60 transition-colors ${
                          tier.highlight ? "bg-gradient-to-r from-amber-500/10 via-slate-900/60 to-indigo-500/10" : ""
                        }`}
                      >
                        <td className={`py-4 px-6 font-bold ${tier.highlight ? "font-black text-amber-300 flex items-center gap-1.5" : "text-white"}`}>
                          {tier.highlight && <Crown className="h-4 w-4 text-amber-400 shrink-0" />}
                          {tier.category}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full font-mono font-bold text-xs ${
                              tier.highlight
                                ? "bg-amber-500/20 border border-amber-400/50 text-amber-300"
                                : "bg-blue-500/15 border border-blue-400/40 text-sky-300"
                            }`}
                          >
                            {tier.points.toLocaleString()} pts
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg font-mono font-bold text-xs ${
                              tier.highlight
                                ? "bg-emerald-500/20 border border-emerald-400/50 text-emerald-300"
                                : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                            }`}
                          >
                            ₹{tier.voucher_amount ? tier.voucher_amount.toLocaleString() : "0"}
                          </span>
                          {tier.cumulative_amount !== undefined && (
                            <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                              Total: ₹{tier.cumulative_amount.toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td className={`py-4 px-6 ${tier.highlight ? "text-emerald-300 font-bold" : "text-slate-200"}`}>
                          {tier.rewards_text}
                        </td>
                        <td className={`py-4 px-6 ${tier.highlight ? "text-slate-200 font-medium" : "text-slate-300"}`}>
                          {tier.digital_rewards}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes Section */}
            <div className="mt-8 pt-6 border-t border-slate-800 text-slate-300 text-xs sm:text-sm space-y-2.5">
              <div className="font-bold text-white flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                Important Progression Notes (Strict ₹15,000 Cap):
              </div>
              <ul className="space-y-2 pl-4 list-disc text-slate-300 leading-relaxed">
                {progressionNotes.map((note, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ─── ARE YOU THE NEXT VYNTYRA INDIA CAMPUS AMBASSADOR? ─── */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-4xl mx-auto">
          <div className="rounded-3xl border border-slate-700/60 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-8 sm:p-12 relative overflow-hidden shadow-2xl">
            {/* Top-Left Glowing 4-Point Star Badge */}
            <div className="absolute top-6 left-6">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-600 p-0.5 shadow-lg shadow-sky-500/30 flex items-center justify-center animate-pulse">
                  <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-sky-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center max-w-2xl mx-auto pt-4 mb-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Are You the Next
              </h2>
              <div className="text-3xl sm:text-4xl md:text-5xl font-black mt-2 tracking-tight">
                <span className="text-amber-400">Vyntyra</span>{" "}
                <span className="text-white">India</span>{" "}
                <span className="text-sky-400">Campus Ambassador?</span>
              </div>
            </div>

            <div className="space-y-6">
              {/* Eligibility Criteria Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-6 sm:p-8 hover:border-slate-700 transition-colors">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                  Eligibility Criteria
                </h3>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  <li className="flex items-start gap-2.5">
                    <span className="text-slate-500 shrink-0 mt-1">•</span>
                    <span>An Indian citizen aged <strong className="text-white">18–25</strong> as of April 1, 2026.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-slate-500 shrink-0 mt-1">•</span>
                    <span>Must not be an alumnus of previous student ambassador cohorts.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-slate-500 shrink-0 mt-1">•</span>
                    <span>
                      Must be an active student (B.Tech / Degree / Diploma / PG) at an Indian university or college, from any major or semester, and <strong className="text-white font-bold underline decoration-amber-400/60 decoration-2">must not be graduating before December 31, 2026</strong>, allowing for the Semester 2 programme period and the additional 10–15 days required for final validation and programme closure.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-slate-500 shrink-0 mt-1">•</span>
                    <span>Curious about AI, passionate about technology, and an active learner/innovator.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-slate-500 shrink-0 mt-1">•</span>
                    <span>Eager to explore and apply AI in meaningful, practical ways.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-slate-500 shrink-0 mt-1">•</span>
                    <span>Must have an active Instagram presence and LinkedIn profile and be willing to share content about Vyntyra initiatives.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-slate-500 shrink-0 mt-1">•</span>
                    <span>Willing to dedicate time and commitment to ambassador activities.</span>
                  </li>
                </ul>
              </div>

              {/* What Sets You Apart Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-6 sm:p-8 hover:border-slate-700 transition-colors">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400 inline-block"></span>
                  What Sets You Apart:
                </h3>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  <li className="flex items-start gap-2.5">
                    <span className="text-slate-500 shrink-0 mt-1">•</span>
                    <span>You simplify complex ideas with clarity and confidence.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-slate-500 shrink-0 mt-1">•</span>
                    <span>You're comfortable leading sessions and guiding peers.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-slate-500 shrink-0 mt-1">•</span>
                    <span>You think originally and bring fresh perspectives.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-slate-500 shrink-0 mt-1">•</span>
                    <span>You experiment, take initiative, and find creative solutions.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-slate-500 shrink-0 mt-1">•</span>
                    <span>You're active on campus and naturally connect communities.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-slate-500 shrink-0 mt-1">•</span>
                    <span>You have experience in or a strong interest in learning AI / machine learning &amp; modern software development.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={scrollToForm}
                style={{
                  background: `linear-gradient(to right, ${theme.primary_btn_bg_start || "#f59e0b"}, ${theme.primary_btn_bg_end || "#eab308"})`,
                  color: theme.primary_btn_text || "#020617",
                }}
                className="font-black px-8 py-3.5 rounded-xl shadow-lg cursor-pointer uppercase tracking-wider text-xs sm:text-sm hover:scale-105 transition-transform inline-flex items-center gap-2"
              >
                <span>Proceed to Official Ambassador Application</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* ─── OFFICIAL AMBASSADOR APPLICATION FORM ─── */}
        <section
          id="ambassador-application-form"
          className="py-16 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto scroll-mt-14"
        >
          <div
            style={{
              backgroundColor: `${theme.card_bg_color || "#070b14"}`,
              borderColor: `${theme.card_border_color || "#1e293b"}`,
            }}
            className="rounded-3xl border bg-gradient-to-b from-slate-900/95 via-slate-950 to-[#070b14] p-6 sm:p-10 lg:p-12 shadow-2xl relative"
          >
            {/* Quick VIP Pass Shortcut Banner */}
            <div className="mb-8 p-4 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-pink-500/10 to-indigo-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 font-bold">
                  <Ticket className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Want a Quick 1-Minute VIP Preview Pass?</h4>
                  <p className="text-xs text-slate-300">
                    Get an instant numbered ticket code &amp; VIP waitlist confirmation popup.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setComingSoonModalOpen(true)}
                style={{
                  background: `linear-gradient(to right, ${theme.primary_btn_bg_start || "#f59e0b"}, ${theme.primary_btn_bg_end || "#eab308"})`,
                  color: theme.primary_btn_text || "#020617",
                }}
                className="font-black text-xs px-5 py-2.5 rounded-xl shrink-0 cursor-pointer uppercase tracking-wider hover:scale-105 transition-transform"
              >
                Open Coming Soon Popup &rarr;
              </button>
            </div>

            {/* Applications Disabled Alert Banner if Paused in Admin */}
            {!isEnabled && (
              <div className="mb-8 p-5 rounded-2xl border border-rose-500/40 bg-rose-500/10 text-rose-200 text-xs flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white text-sm block">Applications Currently Paused</span>
                  <p className="mt-1 leading-relaxed text-slate-300">
                    {settings.disabled_notice || "Applications for this cohort are temporarily paused."}
                  </p>
                </div>
              </div>
            )}

            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-400 text-xs font-mono font-bold tracking-widest uppercase mb-3">
                <Sparkles className="h-3 w-3" />
                OFFICIAL FIRST COHORT APPLICATION
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                Vyntyra Institutional Relations Associate Application
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-400">
                Submit your official application, campus credentials, professional portrait, and 5-10 minute video pitch. An automated confirmation email will be delivered to your inbox and the admin desk.
              </p>
            </div>

            {submittedApp ? (
              /* Success Confirmation Card */
              <div className="py-12 px-6 sm:px-10 text-center rounded-2xl border border-emerald-500/40 bg-emerald-500/10 max-w-xl mx-auto space-y-5">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold mb-2">
                    REF ID: {submittedApp.id}
                  </div>
                  <h3 className="text-2xl font-black text-white">Application Confirmed!</h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-200 leading-relaxed">
                    Thank you, <strong>{submittedApp.name}</strong>. Your application for <strong>Vyntyra Institutional Relations Associate ({settings.cohort_name || "First Cohort 2026-27"})</strong> has been officially recorded in our institutional database.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-left space-y-2 text-slate-300">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-[11px] uppercase tracking-wider">
                    <ShieldCheck className="h-4 w-4" /> Automated Confirmation Dispatched
                  </div>
                  <p>
                    A comprehensive confirmation receipt has been sent to <strong>{submittedApp.email}</strong> and the program management team at <strong>ambassadorprogram@vyntyraconsultancyservices.in</strong>.
                  </p>
                  <p className="text-slate-400 text-[11px] pt-1 border-t border-slate-800">
                    📋 <strong>Tenure &amp; Agreement:</strong> Appointment is for a 6-month period. Following review and shortlisting, the official 6-Month Association Agreement document will be issued to your email for digital acceptance.
                  </p>
                </div>

                <Button
                  onClick={() => setSubmittedApp(null)}
                  variant="outline"
                  size="sm"
                  className="mt-4 border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                >
                  Submit Another Application
                </Button>
              </div>
            ) : (
              /* The Comprehensive Application Form */
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* ── Section 1: Candidate Identity & Contact Details ── */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-amber-400 text-xs font-mono font-bold tracking-wider uppercase">
                    <Users className="h-4 w-4" />
                    <span>01. Personal Identity &amp; Contact Information</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                        Full Name *
                      </label>
                      <Input
                        required
                        disabled={!isEnabled}
                        placeholder="e.g. Ananya Sharma"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="bg-slate-900/80 border-slate-800 text-white placeholder:text-slate-500 rounded-lg h-11"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                        Email Address *
                      </label>
                      <Input
                        required
                        disabled={!isEnabled}
                        type="email"
                        placeholder="e.g. ananya@college.edu / personal"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-slate-900/80 border-slate-800 text-white placeholder:text-slate-500 rounded-lg h-11"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                        WhatsApp Number *
                      </label>
                      <Input
                        required
                        disabled={!isEnabled}
                        placeholder="e.g. +91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="bg-slate-900/80 border-slate-800 text-white placeholder:text-slate-500 rounded-lg h-11"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      Full Residential Address (Door No, Street/Locality &amp; Pincode) *
                    </label>
                    <Input
                      required
                      disabled={!isEnabled}
                      placeholder="e.g. Flat 402, Sai Residency, MVP Colony, Visakhapatnam - 530017"
                      value={fullAddress}
                      onChange={(e) => setFullAddress(e.target.value)}
                      className="bg-slate-900/80 border-slate-800 text-white placeholder:text-slate-500 rounded-lg h-11"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Required for courier delivery of your official IRA Executive Welcome Kit &amp; physical corporate merchandise (dispatched after reaching 1st milestone only).
                    </p>
                  </div>
                </div>

                {/* ── Section 2: College & Geographic Location ── */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-sky-400 text-xs font-mono font-bold tracking-wider uppercase">
                    <MapPin className="h-4 w-4" />
                    <span>02. Institution, State &amp; District</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                        State *
                      </label>
                      <Select
                        disabled={!isEnabled}
                        value={state}
                        onValueChange={handleStateChange}
                      >
                        <SelectTrigger className="bg-slate-900/80 border-slate-800 text-white h-11 rounded-lg">
                          <SelectValue placeholder="Select State" />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          {STATES.map((st) => (
                            <SelectItem key={st} value={st}>
                              {st}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                        District *
                      </label>
                      <Select
                        disabled={!isEnabled}
                        value={district}
                        onValueChange={setDistrict}
                      >
                        <SelectTrigger className="bg-slate-900/80 border-slate-800 text-white h-11 rounded-lg">
                          <SelectValue placeholder="Select District" />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          {availableDistricts.map((dist) => (
                            <SelectItem key={dist} value={dist}>
                              {dist}
                            </SelectItem>
                          ))}
                          <SelectItem value="OTHER">Other / Enter District</SelectItem>
                        </SelectContent>
                      </Select>
                      {district === "OTHER" && (
                        <Input
                          required
                          placeholder="Type your district..."
                          value={customDistrict}
                          onChange={(e) => setCustomDistrict(e.target.value)}
                          className="bg-slate-900/80 border-slate-800 text-white h-10 mt-2 text-xs"
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          College / Institution Name *
                        </label>
                        {state && (
                          <span className="text-[10px] text-amber-400 font-mono font-medium">
                            {stateCollegesList.length} Colleges in {state}
                          </span>
                        )}
                      </div>

                      {/* If a college is selected (not OTHER), display selected badge */}
                      {collegeName && collegeName !== "OTHER" ? (
                        <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <Building2 className="h-4 w-4 text-amber-400 shrink-0" />
                            <div className="min-w-0">
                              <div className="font-bold text-white truncate" title={collegeName}>
                                {collegeName}
                              </div>
                              <div className="text-[10px] text-amber-300/80">
                                Approved Institution ({state || "India"})
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setCollegeName("");
                              setCollegeSearch("");
                              setIsCollegeFocused(true);
                            }}
                            className="px-2.5 py-1 rounded bg-slate-900/80 hover:bg-slate-800 text-amber-300 hover:text-white text-[11px] font-bold border border-amber-500/30 shrink-0 cursor-pointer"
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="relative">
                            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                            <Input
                              disabled={!isEnabled}
                              placeholder={
                                state
                                  ? `Type to search all ${stateCollegesList.length} colleges in ${state}...`
                                  : "Type to search 14,682 colleges across India..."
                              }
                              value={collegeSearch}
                              onChange={(e) => {
                                setCollegeSearch(e.target.value);
                                setIsCollegeFocused(true);
                              }}
                              onFocus={() => setIsCollegeFocused(true)}
                              className="pl-9 pr-8 bg-slate-900/80 border-slate-800 text-white placeholder:text-slate-500 rounded-lg h-11 text-xs"
                            />
                            {collegeSearch && (
                              <button
                                type="button"
                                onClick={() => setCollegeSearch("")}
                                className="absolute right-2.5 top-3.5 text-slate-400 hover:text-white"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>

                          {/* Live search matches dropdown */}
                          {isCollegeFocused && (
                            <div className="rounded-xl border border-slate-800 bg-slate-950/95 backdrop-blur-md shadow-2xl p-2 max-h-64 overflow-y-auto space-y-1 text-xs">
                              <div className="flex items-center justify-between px-2 py-1 text-[10px] text-slate-400 border-b border-slate-800/80">
                                <span>
                                  {state
                                    ? collegeSearch
                                      ? `Found ${(filteredColleges as string[]).length} matches in ${state}`
                                      : `Showing first 100 of ${stateCollegesList.length} colleges in ${state}`
                                    : collegeSearch.length >= 2
                                    ? `National search: ${(filteredColleges as any[]).length} matches found`
                                    : "Select state or type 2+ letters to search across India"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setIsCollegeFocused(false)}
                                  className="text-slate-400 hover:text-white underline cursor-pointer"
                                >
                                  Close
                                </button>
                              </div>

                              {/* Manual "Other" option always at top */}
                              <button
                                type="button"
                                onClick={() => {
                                  setCollegeName("OTHER");
                                  setIsCollegeFocused(false);
                                }}
                                className="w-full text-left px-3 py-2 rounded-lg text-amber-300 hover:bg-amber-500/10 font-bold flex items-center justify-between transition-colors border border-dashed border-amber-500/30"
                              >
                                <span>➕ Other / Can't find your college? (Enter manually)</span>
                                <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-200">
                                  Custom
                                </span>
                              </button>

                              {/* Render matching colleges */}
                              {state ? (
                                (filteredColleges as string[]).length === 0 ? (
                                  <div className="p-4 text-center text-slate-400 text-xs">
                                    No institution matching "{collegeSearch}" in {state}.<br />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCollegeName("OTHER");
                                        setCustomCollege(collegeSearch);
                                        setIsCollegeFocused(false);
                                      }}
                                      className="mt-2 text-amber-400 hover:underline font-bold"
                                    >
                                      Use "{collegeSearch}" as custom institution name &rarr;
                                    </button>
                                  </div>
                                ) : (
                                  (filteredColleges as string[]).map((c, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => {
                                        setCollegeName(c);
                                        setCustomCollege("");
                                        setIsCollegeFocused(false);
                                      }}
                                      className="w-full text-left px-3 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-slate-900 transition-colors flex items-center justify-between group cursor-pointer"
                                    >
                                      <span className="truncate pr-2">{c}</span>
                                      <Check className="h-3.5 w-3.5 text-amber-400 opacity-0 group-hover:opacity-100 shrink-0" />
                                    </button>
                                  ))
                                )
                              ) : (
                                (filteredColleges as { name: string; state: string }[]).map((item, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      setState(item.state);
                                      const districts = getDistrictsForState(item.state);
                                      setDistrict(districts[0] || "");
                                      setCollegeName(item.name);
                                      setCustomCollege("");
                                      setIsCollegeFocused(false);
                                    }}
                                    className="w-full text-left px-3 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-slate-900 transition-colors flex items-center justify-between group cursor-pointer"
                                  >
                                    <span className="truncate pr-2">{item.name}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-sky-400 shrink-0">
                                      {item.state}
                                    </span>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Custom College Input if OTHER */}
                      {collegeName === "OTHER" && (
                        <div className="mt-2 space-y-1">
                          <Input
                            required
                            placeholder="Enter your college / university full name..."
                            value={customCollege}
                            onChange={(e) => setCustomCollege(e.target.value)}
                            className="bg-slate-900/80 border-slate-800 text-white h-11 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setCollegeName("");
                              setCustomCollege("");
                              setIsCollegeFocused(true);
                            }}
                            className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            &larr; Back to college directory search
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                        College Campus Location / City *
                      </label>
                      <Input
                        required
                        disabled={!isEnabled}
                        placeholder="e.g. Madhurawada Campus, Visakhapatnam"
                        value={collegeLocation}
                        onChange={(e) => setCollegeLocation(e.target.value)}
                        className="bg-slate-900/80 border-slate-800 text-white placeholder:text-slate-500 rounded-lg h-11"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Section 3: Academic & Education Details ── */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-purple-400 text-xs font-mono font-bold tracking-wider uppercase">
                    <GraduationCap className="h-4 w-4" />
                    <span>03. Education &amp; Linguistic Profile</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                        Branch / Discipline *
                      </label>
                      <Select
                        disabled={!isEnabled}
                        value={branch}
                        onValueChange={setBranch}
                      >
                        <SelectTrigger className="bg-slate-900/80 border-slate-800 text-white h-11 rounded-lg">
                          <SelectValue placeholder="Select Branch" />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                          {COMMON_BRANCHES.map((b) => (
                            <SelectItem key={b} value={b}>
                              {b}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {branch === "Other / Multidisciplinary" && (
                        <Input
                          required
                          placeholder="Specify branch name..."
                          value={customBranch}
                          onChange={(e) => setCustomBranch(e.target.value)}
                          className="bg-slate-900/80 border-slate-800 text-white h-10 mt-2 text-xs"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                        Department *
                      </label>
                      <Select
                        disabled={!isEnabled}
                        value={department}
                        onValueChange={setDepartment}
                      >
                        <SelectTrigger className="bg-slate-900/80 border-slate-800 text-white h-11 rounded-lg">
                          <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                          {COMMON_DEPARTMENTS.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                        Expected Year of Graduation *
                      </label>
                      <Select
                        disabled={!isEnabled}
                        value={graduationYear}
                        onValueChange={setGraduationYear}
                      >
                        <SelectTrigger className="bg-slate-900/80 border-slate-800 text-white h-11 rounded-lg">
                          <SelectValue placeholder="Graduation Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {["2024", "2025", "2026", "2027", "2028", "2029"].map((yr) => (
                            <SelectItem key={yr} value={yr}>
                              {yr}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Languages Known Checkable Chips */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-purple-400" />
                      <span>Languages Known (Select all applicable) *</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_LANGUAGES.map((lang) => {
                        const isSelected = languages.includes(lang);
                        return (
                          <button
                            type="button"
                            key={lang}
                            onClick={() => toggleLanguage(lang)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? "bg-purple-600 text-white border border-purple-400 shadow-sm shadow-purple-500/30"
                                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                            }`}
                          >
                            {isSelected ? <Check className="h-3 w-3" /> : null}
                            <span>{lang}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Add Custom Language */}
                    <div className="mt-3 flex items-center gap-2 max-w-sm">
                      <Input
                        placeholder="Add other language (e.g. French, Sanskrit)..."
                        value={otherLanguage}
                        onChange={(e) => setOtherLanguage(e.target.value)}
                        className="bg-slate-900/80 border-slate-800 text-white h-9 text-xs"
                      />
                      <Button
                        type="button"
                        onClick={addCustomLanguage}
                        size="sm"
                        variant="outline"
                        className="border-slate-700 text-slate-300 text-xs shrink-0"
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>

                {/* ── Section 4: Video Pitch & Professional Portrait (MANDATORY) ── */}
                <div className="space-y-5 p-5 sm:p-6 rounded-2xl border border-amber-500/40 bg-gradient-to-b from-amber-500/5 via-slate-900/60 to-slate-950">
                  <div className="flex items-center gap-2 pb-2 border-b border-amber-500/20 text-amber-400 text-xs font-mono font-bold tracking-wider uppercase">
                    <Video className="h-4 w-4" />
                    <span>04. Video Pitch &amp; Professional Portrait (Mandatory)</span>
                  </div>

                  {/* 5 to 10 min Video Pitch (Google Drive Only Validation) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <span>5 to 10 Min Video Pitch Link (Google Drive Public Link) *</span>
                      </label>
                      {videoPitchUrl && (
                        <span
                          className={`text-[11px] font-mono flex items-center gap-1 ${
                            isGoogleDriveUrl(videoPitchUrl)
                              ? "text-emerald-400 font-bold"
                              : "text-rose-400 font-bold"
                          }`}
                        >
                          {isGoogleDriveUrl(videoPitchUrl) ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" /> Valid Google Drive Link
                            </>
                          ) : (
                            <>
                              <X className="h-3.5 w-3.5" /> Google Drive Link Required Only
                            </>
                          )}
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <Input
                        required
                        disabled={!isEnabled}
                        placeholder="https://drive.google.com/file/d/YOUR_VIDEO_ID/view?usp=sharing"
                        value={videoPitchUrl}
                        onChange={(e) => {
                          setVideoPitchUrl(e.target.value);
                          setVideoTouched(true);
                        }}
                        className={`bg-slate-900/90 text-white placeholder:text-slate-500 rounded-lg h-11 pr-10 ${
                          videoTouched && !isGoogleDriveUrl(videoPitchUrl)
                            ? "border-rose-500/80 focus-visible:ring-rose-500"
                            : "border-slate-800"
                        }`}
                      />
                      {videoPitchUrl && isGoogleDriveUrl(videoPitchUrl) && (
                        <a
                          href={videoPitchUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute right-3 top-3 text-sky-400 hover:text-sky-300"
                          title="Test Link"
                        >
                          <ExternalLink className="h-5 w-5" />
                        </a>
                      )}
                    </div>

                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 leading-relaxed">
                      💡 <strong>Video Pitch Guidelines:</strong> Record a 5-10 minute video introducing yourself, your campus network, why you are enthusiastic to represent Vyntyra, and how you will drive workshop &amp; student engagements. Upload to Google Drive and ensure permissions are set to <strong>&ldquo;Anyone with the link can view&rdquo;</strong>. <em>Note: Rather than Google Drive links, no other platform links are acceptable.</em>
                    </div>
                  </div>

                  {/* Professional Portrait Image (White Background) */}
                  <div className="space-y-3 pt-3 border-t border-slate-800">
                    <label className="block text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Camera className="h-4 w-4 text-amber-400" />
                      <span>Professional Portrait Photo (White Background) *</span>
                    </label>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {portraitUrl ? (
                        <div className="relative w-24 h-28 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-lg bg-white shrink-0">
                          <img
                            src={portraitUrl}
                            alt="Portrait Preview"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-0 inset-x-0 bg-emerald-600 text-white text-[9px] text-center font-bold py-0.5">
                            Uploaded
                          </span>
                        </div>
                      ) : (
                        <div className="w-24 h-28 rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/50 flex flex-col items-center justify-center text-slate-500 shrink-0">
                          <Camera className="h-6 w-6 mb-1" />
                          <span className="text-[10px] text-center">White BG Headshot</span>
                        </div>
                      )}

                      <div className="flex-1 space-y-2 w-full">
                        <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs cursor-pointer shadow-md transition-all">
                          {uploadingPortrait ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" /> Uploading to Supabase...
                            </>
                          ) : (
                            <>
                              <UploadCloud className="h-4 w-4" /> Upload Portrait Image (White Background)
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            disabled={uploadingPortrait || !isEnabled}
                            onChange={handlePortraitUpload}
                            className="hidden"
                          />
                        </label>
                        <p className="text-[11px] text-slate-400">
                          Used for your official physical Associate ID badge, welcome box credential, and official website listing.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Section 5: Professional & Social Profiles ── */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-emerald-400 text-xs font-mono font-bold tracking-wider uppercase">
                    <Globe className="h-4 w-4" />
                    <span>05. Professional &amp; Social Links (Optional)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                        LinkedIn Profile URL
                      </label>
                      <Input
                        disabled={!isEnabled}
                        placeholder="https://linkedin.com/in/username"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        className="bg-slate-900/80 border-slate-800 text-white placeholder:text-slate-500 rounded-lg h-11"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                        Instagram Profile / Handle
                      </label>
                      <Input
                        disabled={!isEnabled}
                        placeholder="https://instagram.com/handle or @handle"
                        value={instagramUrl}
                        onChange={(e) => setInstagramUrl(e.target.value)}
                        className="bg-slate-900/80 border-slate-800 text-white placeholder:text-slate-500 rounded-lg h-11"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Section 6: 6-Month Tenure Agreement & Statutory Terms (MANDATORY) ── */}
                <div className="p-5 sm:p-6 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-slate-900 to-indigo-500/10 space-y-4">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                    <ShieldCheck className="h-5 w-5" />
                    <span>6-Month Tenure Agreement &amp; Statutory Terms Notice</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    The appointment as a <strong>Vyntyra Institutional Relations Associate</strong> is applicable for a <strong>formal 6-month tenure</strong>. Following internal screening and shortlisting, the official <strong>6-Month Association Agreement &amp; Terms Document</strong> will be transmitted directly via email to your registered address for digital signing prior to cohort onboarding.<br/>
                    <strong className="text-amber-300">📦 Important Dispatch Notice:</strong> Official Swags, Goodies, and Executive Welcome Kits will be dispatched <strong>after reaching 1st milestone only</strong>.
                  </p>

                  <div className="space-y-3 pt-2">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        required
                        checked={agreementAccepted}
                        onChange={(e) => setAgreementAccepted(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-amber-500/50 bg-slate-900 text-amber-500 focus:ring-amber-400"
                      />
                      <span className="text-xs text-slate-200 group-hover:text-white leading-relaxed">
                        I understand and agree that the appointment is for a <strong>6-month tenure</strong>, and that <strong>swags and welcome kits will be dispatched after reaching 1st milestone only</strong>. I agree to review and digitally sign the formal 6-month agreement document sent to my email upon shortlisting. *
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        required
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-amber-500/50 bg-slate-900 text-amber-500 focus:ring-amber-400"
                      />
                      <span className="text-xs text-slate-200 group-hover:text-white leading-relaxed">
                        I accept the Vyntyra Campus Ambassador Program Terms &amp; Conditions and certify that all details, college affiliation, professional portrait, and video pitch submitted are accurate and my own. *
                      </span>
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || !isEnabled}
                    style={{
                      background: `linear-gradient(to right, ${theme.primary_btn_bg_start || "#f59e0b"}, ${theme.primary_btn_bg_end || "#eab308"})`,
                      color: theme.primary_btn_text || "#020617",
                    }}
                    className="w-full font-black h-13 rounded-xl text-base shadow-xl shadow-amber-500/25 cursor-pointer uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2 transition-transform hover:scale-[1.01]"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" /> Submitting Application &amp; Sending Confirmation Email...
                      </span>
                    ) : !isEnabled ? (
                      <span>Applications Currently Paused</span>
                    ) : (
                      <span className="flex items-center gap-2">
                        {settings.form_section?.submit_btn_text || "Submit Official Ambassador Application"} <ArrowRight className="h-5 w-5" />
                      </span>
                    )}
                  </button>
                  <p className="mt-3 text-center text-[11px] text-slate-500">
                    ⚡ An automated confirmation email will be dispatched to your email and the admin team at ambassadorprogram@vyntyraconsultancyservices.in upon submission.<br/>
                    <span className="text-amber-400 font-medium">📦 Note: Official Swags and Welcome Kits will be dispatched after reaching 1st milestone only.</span>
                  </p>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* ─── Frequently Asked Questions ─── */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-white">Frequently Asked Questions</h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Everything you need to know about the {settings.cohort_name || "First Cohort"} Campus Ambassador Program.
            </p>
          </div>

          <div className="space-y-3">
            {faqsList.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  style={{
                    backgroundColor: `${theme.card_bg_color || "#0f172a"}80`,
                    borderColor: theme.card_border_color || "#1e293b",
                  }}
                  className="rounded-xl border overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-white hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="h-5 w-5 text-amber-400 shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-500 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/40 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* ─── Coming Soon VIP Pass Modal ─── */}
      <AmbassadorComingSoonModal
        open={comingSoonModalOpen}
        onOpenChange={setComingSoonModalOpen}
        settings={settings}
      />
    </div>
  );
}
