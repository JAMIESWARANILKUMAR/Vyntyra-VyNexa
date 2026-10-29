import React, { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Award,
  Sparkles,
  Gift,
  Zap,
  Plane,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Edit,
  Eye,
  RotateCcw,
  Save,
  Loader2,
  Image as ImageIcon,
  ExternalLink,
  Sliders,
  Palette,
  Layout,
  HelpCircle,
  FileText,
  Mail,
  Copy,
  TrendingUp,
  FileCheck2,
  Crown,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getAmbassadorProgramSettings,
  updateAmbassadorProgramSettings,
  uploadAmbassadorProductImage,
  listAmbassadorRegistrations,
  DEFAULT_AMBASSADOR_PRODUCTS,
  DEFAULT_AMBASSADOR_SETTINGS,
  DEFAULT_AMBASSADOR_THEME,
  DEFAULT_AMBASSADOR_PILLARS,
  DEFAULT_AMBASSADOR_FAQS,
  type AmbassadorProgramSettings,
  type AmbassadorProductItem,
  type AmbassadorPillarItem,
  type AmbassadorFaqItem,
  type AmbassadorThemeSettings,
} from "@/lib/ambassador.functions";
import { AmbassadorComingSoonModal } from "@/components/ambassador-coming-soon-modal";
import { AdminAmbassadorCampaign } from "@/components/admin-ambassador-campaign";

// Preset Luxury Palettes
const LUXURY_PALETTES: Array<{ name: string; theme: Partial<AmbassadorThemeSettings> }> = [
  {
    name: "Obsidian Gold Luxe (Default)",
    theme: {
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
      card_bg_color: "#0b1226",
      card_border_color: "#1e293b",
      primary_btn_bg_start: "#f59e0b",
      primary_btn_bg_end: "#eab308",
      primary_btn_text: "#020617",
      accent_text_color: "#fbbf24",
    },
  },
  {
    name: "Cyber Neon & Deep Space",
    theme: {
      page_bg_color: "#050811",
      page_bg_secondary: "#0a1026",
      glow_primary: "#06b6d4",
      glow_secondary: "#a855f7",
      glow_accent: "#38bdf8",
      hero_badge_bg: "rgba(6, 182, 212, 0.15)",
      hero_badge_border: "rgba(6, 182, 212, 0.4)",
      hero_badge_text: "#22d3ee",
      hero_heading_gradient_start: "#38bdf8",
      hero_heading_gradient_mid: "#c084fc",
      hero_heading_gradient_end: "#f472b6",
      card_bg_color: "#0a1228",
      card_border_color: "#1e293b",
      primary_btn_bg_start: "#06b6d4",
      primary_btn_bg_end: "#3b82f6",
      primary_btn_text: "#ffffff",
      accent_text_color: "#38bdf8",
    },
  },
  {
    name: "Royal Emerald Velvet",
    theme: {
      page_bg_color: "#04100c",
      page_bg_secondary: "#071e17",
      glow_primary: "#10b981",
      glow_secondary: "#059669",
      glow_accent: "#34d399",
      hero_badge_bg: "rgba(16, 185, 129, 0.15)",
      hero_badge_border: "rgba(16, 185, 129, 0.4)",
      hero_badge_text: "#34d399",
      hero_heading_gradient_start: "#34d399",
      hero_heading_gradient_mid: "#fbbf24",
      hero_heading_gradient_end: "#10b981",
      card_bg_color: "#081d16",
      card_border_color: "#134e4a",
      primary_btn_bg_start: "#10b981",
      primary_btn_bg_end: "#059669",
      primary_btn_text: "#ffffff",
      accent_text_color: "#34d399",
    },
  },
  {
    name: "Velvet Rose & Platinum",
    theme: {
      page_bg_color: "#12050e",
      page_bg_secondary: "#1f0a18",
      glow_primary: "#ec4899",
      glow_secondary: "#f43f5e",
      glow_accent: "#f59e0b",
      hero_badge_bg: "rgba(236, 72, 153, 0.15)",
      hero_badge_border: "rgba(236, 72, 153, 0.4)",
      hero_badge_text: "#f472b6",
      hero_heading_gradient_start: "#fb7185",
      hero_heading_gradient_mid: "#f43f5e",
      hero_heading_gradient_end: "#fbbf24",
      card_bg_color: "#1c0c17",
      card_border_color: "#4a1532",
      primary_btn_bg_start: "#ec4899",
      primary_btn_bg_end: "#f43f5e",
      primary_btn_text: "#ffffff",
      accent_text_color: "#f472b6",
    },
  },
];

export function AdminAmbassadorOperations() {
  const qc = useQueryClient();

  const fetchSettings = useServerFn(getAmbassadorProgramSettings);
  const saveSettingsFn = useServerFn(updateAmbassadorProgramSettings);
  const uploadImageFn = useServerFn(uploadAmbassadorProductImage);
  const fetchRegistrations = useServerFn(listAmbassadorRegistrations);

  // Queries
  const settingsQ = useQuery({
    queryKey: ["admin-ambassador-settings"],
    queryFn: () => fetchSettings(),
  });

  const registrationsQ = useQuery({
    queryKey: ["admin-ambassador-registrations"],
    queryFn: () => fetchRegistrations(),
  });

  // Local Form State
  const [settings, setSettings] = useState<AmbassadorProgramSettings>(DEFAULT_AMBASSADOR_SETTINGS);
  const [activeTab, setActiveTab] = useState<
    "theme" | "hero" | "pillars" | "products" | "gadgets_retreat" | "faqs" | "form" | "popup" | "applicants"
  >("theme");
  const [isSaving, setIsSaving] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);

  // Product Add / Edit Modal State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AmbassadorProductItem | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Pillar Add / Edit Modal State
  const [pillarModalOpen, setPillarModalOpen] = useState(false);
  const [editingPillar, setEditingPillar] = useState<AmbassadorPillarItem | null>(null);

  // FAQ Add / Edit Modal State
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<AmbassadorFaqItem | null>(null);

  // Sync state from query
  useEffect(() => {
    if (settingsQ.data) {
      setSettings(settingsQ.data);
    }
  }, [settingsQ.data]);

  // Handle Save
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await saveSettingsFn({ data: settings });
      toast.success("All Ambassador Program settings & styling published successfully!");
      qc.invalidateQueries({ queryKey: ["admin-ambassador-settings"] });
      qc.invalidateQueries({ queryKey: ["ambassador-settings"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  // Image Upload Handler
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onSuccess: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file must be under 5MB.");
      return;
    }

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await uploadImageFn({
            data: {
              base64Data,
              fileName: file.name,
              contentType: file.type || "image/jpeg",
            },
          });

          if (res?.publicUrl) {
            onSuccess(res.publicUrl);
            toast.success("Image uploaded to Supabase Storage!");
          }
        } catch (uploadErr: any) {
          toast.error(uploadErr.message || "Upload failed.");
        } finally {
          setUploadingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error("Failed to read image file.");
      setUploadingImage(false);
    }
  };

  // Preset Palette Apply
  const applyPalette = (palette: Partial<AmbassadorThemeSettings>) => {
    setSettings({
      ...settings,
      theme: {
        ...settings.theme,
        ...palette,
      },
    });
    toast.success("Palette applied to draft. Click 'Save All Changes' to publish!");
  };

  // Product Handlers
  const openCreateProduct = () => {
    setEditingProduct({
      id: `prod-${Date.now()}`,
      title: "",
      subtitle: "",
      category: "Welcome Kit",
      image_url: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800&auto=format&fit=crop",
      desc: "",
      badge: "Guaranteed Upon Onboarding",
      badge_style: "border-amber-400/40 bg-amber-500/20 text-amber-300",
      is_active: true,
      featured_in_gadgets: false,
    });
    setProductModalOpen(true);
  };

  const openEditProduct = (prod: AmbassadorProductItem) => {
    setEditingProduct({ ...prod });
    setProductModalOpen(true);
  };

  const handleSaveProduct = () => {
    if (!editingProduct) return;
    if (!editingProduct.title || !editingProduct.image_url) {
      toast.error("Title and image URL are required.");
      return;
    }

    const exists = settings.products.some((p) => p.id === editingProduct.id);
    const updatedProducts = exists
      ? settings.products.map((p) => (p.id === editingProduct.id ? editingProduct : p))
      : [editingProduct, ...settings.products];

    setSettings({ ...settings, products: updatedProducts });
    setProductModalOpen(false);
    toast.success(`Product "${editingProduct.title}" updated in draft.`);
  };

  const handleDeleteProduct = (id: string) => {
    setSettings({
      ...settings,
      products: settings.products.filter((p) => p.id !== id),
    });
    toast.info("Product removed from draft.");
  };

  // Pillar Handlers
  const openCreatePillar = () => {
    setEditingPillar({
      id: `pillar-${Date.now()}`,
      title: "",
      highlight: "Special Perk",
      desc: "",
      badgeColor: "border-amber-500/40 bg-amber-500/10 text-amber-400",
      image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800&auto=format&fit=crop",
      icon_name: "Gift",
    });
    setPillarModalOpen(true);
  };

  const openEditPillar = (pillar: AmbassadorPillarItem) => {
    setEditingPillar({ ...pillar });
    setPillarModalOpen(true);
  };

  const handleSavePillar = () => {
    if (!editingPillar) return;
    const list = settings.pillars_section.pillars || [];
    const exists = list.some((p) => p.id === editingPillar.id);
    const updated = exists
      ? list.map((p) => (p.id === editingPillar.id ? editingPillar : p))
      : [...list, editingPillar];

    setSettings({
      ...settings,
      pillars_section: {
        ...settings.pillars_section,
        pillars: updated,
      },
    });
    setPillarModalOpen(false);
    toast.success("Pillar updated in draft.");
  };

  const handleDeletePillar = (id: string) => {
    setSettings({
      ...settings,
      pillars_section: {
        ...settings.pillars_section,
        pillars: settings.pillars_section.pillars.filter((p) => p.id !== id),
      },
    });
  };

  // FAQ Handlers
  const openCreateFaq = () => {
    setEditingFaq({
      id: `faq-${Date.now()}`,
      q: "",
      a: "",
    });
    setFaqModalOpen(true);
  };

  const handleSaveFaq = () => {
    if (!editingFaq || !editingFaq.q || !editingFaq.a) {
      toast.error("Question and answer are required.");
      return;
    }
    const list = settings.faqs || [];
    const exists = list.some((f) => f.id === editingFaq.id);
    const updated = exists
      ? list.map((f) => (f.id === editingFaq.id ? editingFaq : f))
      : [...list, editingFaq];

    setSettings({ ...settings, faqs: updated });
    setFaqModalOpen(false);
  };

  const handleDeleteFaq = (id: string) => {
    setSettings({ ...settings, faqs: settings.faqs.filter((f) => f.id !== id) });
  };

  // Reset to Factory Default
  const handleResetDefaults = () => {
    if (confirm("Reset ALL Ambassador styling, text, and catalog to official factory defaults?")) {
      setSettings(DEFAULT_AMBASSADOR_SETTINGS);
      toast.info("Settings reset to defaults. Click 'Save All Changes' to publish.");
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Super Admin Control Header ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-950 via-[#0d1633] to-slate-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-10 h-64 w-64 rounded-full bg-pink-500/15 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
              <Award className="h-3.5 w-3.5 text-amber-400" />
              PIN-TO-PIN SUPER ADMIN OPERATIONS ENGINE
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Campus Ambassador Ultra-Control Hub
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-light">
              Customize every pixel: background colors, text gradients, hero typography, metrics, perks, swags, gadgets, travel retreat, FAQs, and popup tickets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-6 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-2"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{isSaving ? "Publishing..." : "Save All Changes"}</span>
            </Button>

            <Button
              onClick={() => setTestModalOpen(true)}
              variant="outline"
              className="border-slate-700 bg-slate-900/70 text-slate-200 hover:text-white rounded-xl text-xs flex items-center gap-1.5"
            >
              <Eye className="h-4 w-4 text-amber-400" />
              <span>Test Live VIP Popup</span>
            </Button>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                settings.applications_enabled ? "bg-emerald-400 animate-pulse" : "bg-rose-500"
              }`}
            />
            <div>
              <div className="text-xs text-slate-400 uppercase font-mono">Applications</div>
              <div className="text-sm font-bold text-white">
                {settings.applications_enabled ? "Accepting Entries" : "Paused"}
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-400 uppercase font-mono">Products in Catalog</div>
            <div className="text-sm font-bold text-amber-400">
              {settings.products.filter((p) => p.is_active).length} Active / {settings.products.length} Total
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-400 uppercase font-mono">Registered Candidates</div>
            <div className="text-sm font-bold text-sky-400">
              {(registrationsQ.data || []).length} Applicants
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-400 uppercase font-mono">Active Cohort</div>
            <div className="text-sm font-bold text-pink-400 truncate">
              {settings.cohort_name || "First Cohort 2026-27"}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Pin-to-Pin Tab Navigation ─── */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-3 overflow-x-auto scrollbar-none">
        {[
          { id: "theme", label: "🎨 Colors & Themes", icon: Palette },
          { id: "hero", label: "🚀 Hero & Metrics", icon: Layout },
          { id: "pillars", label: "💎 Perks & Pillars", icon: Sparkles, count: settings.pillars_section.pillars.length },
          { id: "products", label: "📸 Product Photography", icon: ImageIcon, count: settings.products.length },
          { id: "gadgets_retreat", label: "⚡ Gadgets & Retreat", icon: Zap },
          { id: "faqs", label: "❓ FAQs", icon: HelpCircle, count: settings.faqs.length },
          { id: "form", label: "📝 Application Form", icon: FileText },
          { id: "popup", label: "🎟️ Coming Soon VIP Popup", icon: Eye },
          { id: "applicants", label: "👥 Applications, Lifecycle & Email Automation", icon: Mail, count: (registrationsQ.data || []).length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs shrink-0 transition-all cursor-pointer ${
                isActive
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? "text-amber-400" : "text-slate-500"}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ═════════ TAB 1: 🎨 THEME & COLORS (PIN-TO-PIN) ═════════ */}
      {activeTab === "theme" && (
        <div className="space-y-6">
          {/* Preset Palettes Bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Palette className="h-4 w-4 text-amber-500" /> One-Click Luxury Color Palettes
                </h3>
                <p className="text-xs text-slate-500">
                  Select a designer palette or customize each individual color below.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetDefaults}
                className="text-xs text-slate-600 rounded-xl"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset All Defaults
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {LUXURY_PALETTES.map((pal) => (
                <button
                  key={pal.name}
                  onClick={() => applyPalette(pal.theme)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-amber-400 bg-slate-50 hover:bg-white text-left transition-all group"
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <span
                      className="w-4 h-4 rounded-full border border-black/20"
                      style={{ backgroundColor: pal.theme.page_bg_color }}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-black/20"
                      style={{ backgroundColor: pal.theme.hero_heading_gradient_start }}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-black/20"
                      style={{ backgroundColor: pal.theme.primary_btn_bg_start }}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-black/20"
                      style={{ backgroundColor: pal.theme.glow_primary }}
                    />
                  </div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-amber-600">
                    {pal.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Granular Color Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Background & Ambient Glow Colors */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-900 pb-2 border-b">
                Page Background &amp; Ambient Lights
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Page Background
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.theme.page_bg_color}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        theme: { ...settings.theme, page_bg_color: e.target.value },
                      })
                    }
                    className="w-9 h-9 rounded cursor-pointer border"
                  />
                  <Input
                    value={settings.theme.page_bg_color}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        theme: { ...settings.theme, page_bg_color: e.target.value },
                      })
                    }
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Secondary Section Background
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.theme.page_bg_secondary}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        theme: { ...settings.theme, page_bg_secondary: e.target.value },
                      })
                    }
                    className="w-9 h-9 rounded cursor-pointer border"
                  />
                  <Input
                    value={settings.theme.page_bg_secondary}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        theme: { ...settings.theme, page_bg_secondary: e.target.value },
                      })
                    }
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ambient Glow Light (Top Center)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.theme.glow_primary}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        theme: { ...settings.theme, glow_primary: e.target.value },
                      })
                    }
                    className="w-9 h-9 rounded cursor-pointer border"
                  />
                  <Input
                    value={settings.theme.glow_primary}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        theme: { ...settings.theme, glow_primary: e.target.value },
                      })
                    }
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Accent Light (Left Orb)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.theme.glow_secondary}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        theme: { ...settings.theme, glow_secondary: e.target.value },
                      })
                    }
                    className="w-9 h-9 rounded cursor-pointer border"
                  />
                  <Input
                    value={settings.theme.glow_secondary}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        theme: { ...settings.theme, glow_secondary: e.target.value },
                      })
                    }
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Typography & Heading Gradient Colors */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-900 pb-2 border-b">
                Typography &amp; Gradient Colors
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Heading Gradient (Start Color)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.theme.hero_heading_gradient_start}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        theme: { ...settings.theme, hero_heading_gradient_start: e.target.value },
                      })
                    }
                    className="w-9 h-9 rounded cursor-pointer border"
                  />
                  <Input
                    value={settings.theme.hero_heading_gradient_start}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        theme: { ...settings.theme, hero_heading_gradient_start: e.target.value },
                      })
                    }
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Heading Gradient (Mid Color)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.theme.hero_heading_gradient_mid}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        theme: { ...settings.theme, hero_heading_gradient_mid: e.target.value },
                      })
                    }
                    className="w-9 h-9 rounded cursor-pointer border"
                  />
                  <Input
                    value={settings.theme.hero_heading_gradient_mid}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        theme: { ...settings.theme, hero_heading_gradient_mid: e.target.value },
                      })
                    }
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Heading Gradient (End Color)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.theme.hero_heading_gradient_end}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        theme: { ...settings.theme, hero_heading_gradient_end: e.target.value },
                      })
                    }
                    className="w-9 h-9 rounded cursor-pointer border"
                  />
                  <Input
                    value={settings.theme.hero_heading_gradient_end}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        theme: { ...settings.theme, hero_heading_gradient_end: e.target.value },
                      })
                    }
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hero Description Text Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.theme.hero_description_color}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        theme: { ...settings.theme, hero_description_color: e.target.value },
                      })
                    }
                    className="w-9 h-9 rounded cursor-pointer border"
                  />
                  <Input
                    value={settings.theme.hero_description_color}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        theme: { ...settings.theme, hero_description_color: e.target.value },
                      })
                    }
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Buttons & Cards Styling */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-900 pb-2 border-b">
                Buttons &amp; Cards
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary CTA Button (Start Gradient)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.theme.primary_btn_bg_start}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        theme: { ...settings.theme, primary_btn_bg_start: e.target.value },
                      })
                    }
                    className="w-9 h-9 rounded cursor-pointer border"
                  />
                  <Input
                    value={settings.theme.primary_btn_bg_start}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        theme: { ...settings.theme, primary_btn_bg_start: e.target.value },
                      })
                    }
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary CTA Button (End Gradient)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.theme.primary_btn_bg_end}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        theme: { ...settings.theme, primary_btn_bg_end: e.target.value },
                      })
                    }
                    className="w-9 h-9 rounded cursor-pointer border"
                  />
                  <Input
                    value={settings.theme.primary_btn_bg_end}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        theme: { ...settings.theme, primary_btn_bg_end: e.target.value },
                      })
                    }
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Button Text Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.theme.primary_btn_text}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        theme: { ...settings.theme, primary_btn_text: e.target.value },
                      })
                    }
                    className="w-9 h-9 rounded cursor-pointer border"
                  />
                  <Input
                    value={settings.theme.primary_btn_text}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        theme: { ...settings.theme, primary_btn_text: e.target.value },
                      })
                    }
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Card Background Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.theme.card_bg_color}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        theme: { ...settings.theme, card_bg_color: e.target.value },
                      })
                    }
                    className="w-9 h-9 rounded cursor-pointer border"
                  />
                  <Input
                    value={settings.theme.card_bg_color}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        theme: { ...settings.theme, card_bg_color: e.target.value },
                      })
                    }
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════ TAB 2: 🚀 HERO & METRICS ═════════ */}
      {activeTab === "hero" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Hero Section Content</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Hero Top Badge Text
                </label>
                <Input
                  value={settings.hero.badge_text}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      hero: { ...settings.hero, badge_text: e.target.value },
                    })
                  }
                  className="h-10 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Primary CTA Button Label
                </label>
                <Input
                  value={settings.hero.primary_cta_label}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      hero: { ...settings.hero, primary_cta_label: e.target.value },
                    })
                  }
                  className="h-10 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Main Title (White Text)
                </label>
                <Input
                  value={settings.hero.title_prefix}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      hero: { ...settings.hero, title_prefix: e.target.value },
                    })
                  }
                  className="h-10 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Gradient Title (Highlighted Text)
                </label>
                <Input
                  value={settings.hero.title_gradient}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      hero: { ...settings.hero, title_gradient: e.target.value },
                    })
                  }
                  className="h-10 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Hero Description Text
              </label>
              <Textarea
                rows={3}
                value={settings.hero.description}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    hero: { ...settings.hero, description: e.target.value },
                  })
                }
                className="text-xs leading-relaxed"
              />
            </div>
          </div>

          {/* Metrics Editor */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">4 Key Metrics Bar</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {settings.hero.metrics.map((metric, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="text-xs font-bold text-slate-600 uppercase">Metric #{i + 1}</div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase">Value / Number</label>
                    <Input
                      value={metric.value}
                      onChange={(e) => {
                        const updated = [...settings.hero.metrics];
                        updated[i] = { ...updated[i], value: e.target.value };
                        setSettings({
                          ...settings,
                          hero: { ...settings.hero, metrics: updated },
                        });
                      }}
                      className="h-8 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase">Label</label>
                    <Input
                      value={metric.label}
                      onChange={(e) => {
                        const updated = [...settings.hero.metrics];
                        updated[i] = { ...updated[i], label: e.target.value };
                        setSettings({
                          ...settings,
                          hero: { ...settings.hero, metrics: updated },
                        });
                      }}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="color"
                      value={metric.color}
                      onChange={(e) => {
                        const updated = [...settings.hero.metrics];
                        updated[i] = { ...updated[i], color: e.target.value };
                        setSettings({
                          ...settings,
                          hero: { ...settings.hero, metrics: updated },
                        });
                      }}
                      className="w-6 h-6 rounded cursor-pointer border"
                    />
                    <span className="text-[10px] text-slate-600 font-mono">{metric.color}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═════════ TAB 3: 💎 PERKS & PILLARS (CRUD) ═════════ */}
      {activeTab === "pillars" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Exclusive Privileges &amp; Pillars ({settings.pillars_section.pillars.length})
              </h3>
              <p className="text-xs text-slate-500">
                Add, edit, reorder or customize the perk pillar cards displayed to candidates.
              </p>
            </div>
            <Button
              onClick={openCreatePillar}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add Pillar
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {settings.pillars_section.pillars.map((pillar) => (
              <div
                key={pillar.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-amber-400/50 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {pillar.highlight}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        onClick={() => openEditPillar(pillar)}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-slate-600"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        onClick={() => handleDeletePillar(pillar.id)}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-rose-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{pillar.title}</h4>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{pillar.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═════════ TAB 4: 📸 PRODUCT PHOTOGRAPHY & CATALOG ═════════ */}
      {activeTab === "products" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Product Photography &amp; Swags Catalog ({settings.products.length} Items)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload real photography for swags, merchandise, gadgets, and retreat.
              </p>
            </div>

            <Button
              onClick={openCreateProduct}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              <span>Add Product Photography</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {settings.products.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl border bg-white overflow-hidden shadow-xs flex flex-col justify-between transition-all ${
                  item.is_active ? "border-slate-200" : "border-slate-200 opacity-60 bg-slate-50"
                }`}
              >
                <div>
                  <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900/80 text-white backdrop-blur-md">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-1.5">
                    <div className="text-[11px] font-mono text-amber-600 font-bold uppercase tracking-wider truncate">
                      {item.subtitle}
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 leading-snug line-clamp-1">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.is_active}
                      onCheckedChange={() => {
                        const updated = settings.products.map((p) =>
                          p.id === item.id ? { ...p, is_active: !p.is_active } : p
                        );
                        setSettings({ ...settings, products: updated });
                      }}
                    />
                    <span className="text-[11px] font-medium text-slate-600">
                      {item.is_active ? "Visible" : "Hidden"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => openEditProduct(item)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-slate-600"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteProduct(item.id)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-rose-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═════════ TAB 5: ⚡ GADGETS & TRAVEL RETREAT ═════════ */}
      {activeTab === "gadgets_retreat" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gadgets Section Settings */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Zap className="h-4 w-4 text-sky-500" /> Electronic Gadgets Showcase
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Badge Text
              </label>
              <Input
                value={settings.gadgets_section.badge_text}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    gadgets_section: { ...settings.gadgets_section, badge_text: e.target.value },
                  })
                }
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Heading</label>
              <Input
                value={settings.gadgets_section.heading}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    gadgets_section: { ...settings.gadgets_section, heading: e.target.value },
                  })
                }
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Description
              </label>
              <Textarea
                rows={2}
                value={settings.gadgets_section.description}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    gadgets_section: { ...settings.gadgets_section, description: e.target.value },
                  })
                }
                className="text-xs"
              />
            </div>

            <div className="pt-2 border-t">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Callout Box Title
              </label>
              <Input
                value={settings.gadgets_section.callout_title}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    gadgets_section: { ...settings.gadgets_section, callout_title: e.target.value },
                  })
                }
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Callout Box Description
              </label>
              <Textarea
                rows={2}
                value={settings.gadgets_section.callout_desc}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    gadgets_section: { ...settings.gadgets_section, callout_desc: e.target.value },
                  })
                }
                className="text-xs"
              />
            </div>
          </div>

          {/* Travel Retreat Settings */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Plane className="h-4 w-4 text-pink-500" /> Curated Travel Retreat (Top 10)
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Badge Text
              </label>
              <Input
                value={settings.retreat_section.badge_text}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    retreat_section: { ...settings.retreat_section, badge_text: e.target.value },
                  })
                }
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Heading</label>
              <Input
                value={settings.retreat_section.heading}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    retreat_section: { ...settings.retreat_section, heading: e.target.value },
                  })
                }
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Retreat Photo URL
              </label>
              <Input
                value={settings.retreat_section.image_url}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    retreat_section: { ...settings.retreat_section, image_url: e.target.value },
                  })
                }
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Description
              </label>
              <Textarea
                rows={3}
                value={settings.retreat_section.description}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    retreat_section: { ...settings.retreat_section, description: e.target.value },
                  })
                }
                className="text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* ═════════ TAB 6: ❓ FAQS ═════════ */}
      {activeTab === "faqs" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Frequently Asked Questions ({settings.faqs.length})
              </h3>
              <p className="text-xs text-slate-500">
                Add, edit, or remove candidate FAQ items.
              </p>
            </div>
            <Button
              onClick={openCreateFaq}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add FAQ
            </Button>
          </div>

          <div className="space-y-3">
            {settings.faqs.map((faq, i) => (
              <div
                key={faq.id || i}
                className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="font-bold text-sm text-slate-900">{faq.q}</div>
                  <div className="text-xs text-slate-500 leading-relaxed">{faq.a}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    onClick={() => {
                      setEditingFaq({ ...faq });
                      setFaqModalOpen(true);
                    }}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-600"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteFaq(faq.id)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-rose-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═════════ TAB 7: 📝 FORM & APPLICATION CONTROLS ═════════ */}
      {activeTab === "form" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="text-base font-bold text-slate-900">Application Intake Control</h3>
                <p className="text-xs text-slate-500">Enable or pause pre-registration submissions.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold ${settings.applications_enabled ? "text-emerald-600" : "text-rose-600"}`}>
                  {settings.applications_enabled ? "ACCEPTING" : "PAUSED"}
                </span>
                <Switch
                  checked={settings.applications_enabled}
                  onCheckedChange={(val) => setSettings({ ...settings, applications_enabled: val })}
                />
              </div>
            </div>

            {!settings.applications_enabled && (
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 space-y-2">
                <label className="text-xs font-bold text-rose-800">Custom Paused Notice</label>
                <Textarea
                  rows={2}
                  value={settings.disabled_notice}
                  onChange={(e) => setSettings({ ...settings, disabled_notice: e.target.value })}
                  className="bg-white text-xs"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Active Cohort Name
                </label>
                <Input
                  value={settings.cohort_name}
                  onChange={(e) => setSettings({ ...settings, cohort_name: e.target.value })}
                  className="h-10 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Target Rewards Headline
                </label>
                <Input
                  value={settings.target_rewards}
                  onChange={(e) => setSettings({ ...settings, target_rewards: e.target.value })}
                  className="h-10 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Form Heading Title
                </label>
                <Input
                  value={settings.form_section.heading}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      form_section: { ...settings.form_section, heading: e.target.value },
                    })
                  }
                  className="h-10 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Submit Button Text
                </label>
                <Input
                  value={settings.form_section.submit_btn_text}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      form_section: { ...settings.form_section, submit_btn_text: e.target.value },
                    })
                  }
                  className="h-10 text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════ TAB 8: 🎟️ COMING SOON VIP POPUP ═════════ */}
      {activeTab === "popup" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">VIP Ticket Dialog Copy</h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Popup Badge Text
                </label>
                <Input
                  value={settings.popup.badge}
                  onChange={(e) =>
                    setSettings({ ...settings, popup: { ...settings.popup, badge: e.target.value } })
                  }
                  className="h-10 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Popup Main Title
                </label>
                <Input
                  value={settings.popup.title}
                  onChange={(e) =>
                    setSettings({ ...settings, popup: { ...settings.popup, title: e.target.value } })
                  }
                  className="h-10 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Popup Subtitle
                </label>
                <Input
                  value={settings.popup.subtitle}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      popup: { ...settings.popup, subtitle: e.target.value },
                    })
                  }
                  className="h-10 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Announcement Message
                </label>
                <Textarea
                  rows={3}
                  value={settings.popup.announcement_message}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      popup: { ...settings.popup, announcement_message: e.target.value },
                    })
                  }
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Rewards Headline Text
                </label>
                <Input
                  value={settings.popup.rewards_text}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      popup: { ...settings.popup, rewards_text: e.target.value },
                    })
                  }
                  className="h-10 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Perks Summary
                </label>
                <Input
                  value={settings.popup.perks_summary}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      popup: { ...settings.popup, perks_summary: e.target.value },
                    })
                  }
                  className="h-10 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Popup Preview Card */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-slate-800 bg-[#070b14] p-5 text-white shadow-xl space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-amber-400">
                <span>POPUP PREVIEW</span>
                <Badge variant="outline" className="border-amber-400/40 text-amber-300">
                  {settings.popup.badge}
                </Badge>
              </div>

              <div className="p-4 rounded-xl border border-amber-500/30 bg-slate-900/80 space-y-2">
                <div className="text-sm font-bold text-white">{settings.popup.title}</div>
                <div className="text-xs text-amber-400 font-mono">{settings.popup.subtitle}</div>
                <p className="text-xs text-slate-300 leading-relaxed pt-1">
                  {settings.popup.announcement_message}
                </p>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-emerald-400 font-semibold">
                  💰 {settings.popup.rewards_text}
                </div>
              </div>

              <Button
                onClick={() => setTestModalOpen(true)}
                className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
              >
                Open Real Interactive Dialog &rarr;
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════ TAB 9: 👥 APPLICANTS & BROADCAST ═════════ */}
      {activeTab === "applicants" && (
        <div className="space-y-6">
          <AdminAmbassadorCampaign />
        </div>
      )}

      {/* ─── Product Edit/Add Modal ─── */}
      <Dialog open={productModalOpen} onOpenChange={setProductModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingProduct && settings.products.some((p) => p.id === editingProduct.id)
                ? "Edit Product Photography Item"
                : "Add New Product Photography Item"}
            </DialogTitle>
          </DialogHeader>

          {editingProduct && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Title *
                  </label>
                  <Input
                    value={editingProduct.title}
                    onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Subtitle / Tech Spec
                  </label>
                  <Input
                    value={editingProduct.subtitle}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, subtitle: e.target.value })
                    }
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Category *
                  </label>
                  <Select
                    value={editingProduct.category}
                    onValueChange={(val: any) =>
                      setEditingProduct({ ...editingProduct, category: val })
                    }
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Welcome Kit">Welcome Kit</SelectItem>
                      <SelectItem value="Apparel">Apparel</SelectItem>
                      <SelectItem value="Gear">Gear</SelectItem>
                      <SelectItem value="Drinkware">Drinkware</SelectItem>
                      <SelectItem value="Gadgets">Gadgets</SelectItem>
                      <SelectItem value="Travel Retreat">Travel Retreat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Badge Text
                  </label>
                  <Input
                    value={editingProduct.badge}
                    onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Photo Upload & Preview */}
              <div className="space-y-2 p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4 text-amber-600" />
                    <span>Product Photo</span>
                  </label>
                  {uploadingImage && (
                    <span className="text-xs text-amber-600 flex items-center gap-1 font-semibold">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading to Supabase...
                    </span>
                  )}
                </div>

                {editingProduct.image_url && (
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-900">
                    <img
                      src={editingProduct.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <label className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shrink-0">
                    <UploadCloud className="h-4 w-4" />
                    <span>Upload Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleFileUpload(e, (url) =>
                          setEditingProduct({ ...editingProduct, image_url: url })
                        )
                      }
                      className="hidden"
                    />
                  </label>

                  <Input
                    value={editingProduct.image_url}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, image_url: e.target.value })
                    }
                    placeholder="Or enter direct image URL..."
                    className="h-9 text-xs flex-1 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Description
                </label>
                <Textarea
                  rows={2}
                  value={editingProduct.desc}
                  onChange={(e) => setEditingProduct({ ...editingProduct, desc: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingProduct.is_active}
                    onCheckedChange={(val) =>
                      setEditingProduct({ ...editingProduct, is_active: val })
                    }
                  />
                  <span className="text-xs font-medium text-slate-700">Display in Catalog</span>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={!!editingProduct.featured_in_gadgets}
                    onCheckedChange={(val) =>
                      setEditingProduct({ ...editingProduct, featured_in_gadgets: val })
                    }
                  />
                  <span className="text-xs font-medium text-slate-700">Feature in Gadgets Strip</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setProductModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button onClick={handleSaveProduct} className="bg-amber-400 text-slate-950 font-bold text-xs">
              Update Product Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Pillar Edit/Add Modal ─── */}
      <Dialog open={pillarModalOpen} onOpenChange={setPillarModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingPillar && settings.pillars_section.pillars.some((p) => p.id === editingPillar.id)
                ? "Edit Pillar"
                : "Add New Pillar"}
            </DialogTitle>
          </DialogHeader>

          {editingPillar && (
            <div className="space-y-3 py-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Pillar Title *
                </label>
                <Input
                  value={editingPillar.title}
                  onChange={(e) => setEditingPillar({ ...editingPillar, title: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Highlight Badge Text
                </label>
                <Input
                  value={editingPillar.highlight}
                  onChange={(e) =>
                    setEditingPillar({ ...editingPillar, highlight: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Description
                </label>
                <Textarea
                  rows={3}
                  value={editingPillar.desc}
                  onChange={(e) => setEditingPillar({ ...editingPillar, desc: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPillarModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button onClick={handleSavePillar} className="bg-amber-400 text-slate-950 font-bold text-xs">
              Save Pillar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── FAQ Edit/Add Modal ─── */}
      <Dialog open={faqModalOpen} onOpenChange={setFaqModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingFaq && settings.faqs.some((f) => f.id === editingFaq.id)
                ? "Edit FAQ"
                : "Add New FAQ"}
            </DialogTitle>
          </DialogHeader>

          {editingFaq && (
            <div className="space-y-3 py-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Question *
                </label>
                <Input
                  value={editingFaq.q}
                  onChange={(e) => setEditingFaq({ ...editingFaq, q: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Answer *
                </label>
                <Textarea
                  rows={4}
                  value={editingFaq.a}
                  onChange={(e) => setEditingFaq({ ...editingFaq, a: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setFaqModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button onClick={handleSaveFaq} className="bg-amber-400 text-slate-950 font-bold text-xs">
              Save FAQ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Interactive Live Popup Preview ─── */}
      <AmbassadorComingSoonModal
        open={testModalOpen}
        onOpenChange={setTestModalOpen}
        settings={settings}
      />
    </div>
  );
}
