import React, { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  ShieldAlert,
  MessageSquare,
  Mail,
  Copy,
  Share2,
  Sliders,
  Layers,
  Tag,
  Check,
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
  type AmbassadorProgramSettings,
  type AmbassadorProductItem,
} from "@/lib/ambassador.functions";
import { AmbassadorComingSoonModal } from "@/components/ambassador-coming-soon-modal";
import { AdminAmbassadorCampaign } from "@/components/admin-ambassador-campaign";

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
  const [activeSubTab, setActiveSubTab] = useState<"controls" | "popup" | "products" | "applicants">("controls");
  const [isSaving, setIsSaving] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);

  // Product Add / Edit Modal State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AmbassadorProductItem | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

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
      toast.success("Ambassador program controls & photography settings saved successfully!");
      qc.invalidateQueries({ queryKey: ["admin-ambassador-settings"] });
      qc.invalidateQueries({ queryKey: ["ambassador-settings"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  // Image Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

          if (res?.publicUrl && editingProduct) {
            setEditingProduct({ ...editingProduct, image_url: res.publicUrl });
            toast.success("Product photography uploaded to Supabase Storage!");
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

  // Open Create Product
  const openCreateProduct = () => {
    setEditingProduct({
      id: `prod-${Date.now()}`,
      title: "",
      subtitle: "",
      category: "Welcome Kit",
      image_url: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800&auto=format&fit=crop",
      desc: "",
      badge: "Included in Cohort",
      badge_style: "border-amber-400/40 bg-amber-500/20 text-amber-300",
      is_active: true,
      featured_in_gadgets: false,
    });
    setProductModalOpen(true);
  };

  // Open Edit Product
  const openEditProduct = (prod: AmbassadorProductItem) => {
    setEditingProduct({ ...prod });
    setProductModalOpen(true);
  };

  // Save Product
  const handleSaveProduct = () => {
    if (!editingProduct) return;
    if (!editingProduct.title || !editingProduct.image_url) {
      toast.error("Title and image URL are required.");
      return;
    }

    const exists = settings.products.some((p) => p.id === editingProduct.id);
    let updatedProducts: AmbassadorProductItem[];
    if (exists) {
      updatedProducts = settings.products.map((p) =>
        p.id === editingProduct.id ? editingProduct : p
      );
    } else {
      updatedProducts = [editingProduct, ...settings.products];
    }

    setSettings({ ...settings, products: updatedProducts });
    setProductModalOpen(false);
    toast.success(`Product "${editingProduct.title}" updated in local draft. Remember to click "Save All Changes"!`);
  };

  // Delete Product
  const handleDeleteProduct = (id: string) => {
    const updated = settings.products.filter((p) => p.id !== id);
    setSettings({ ...settings, products: updated });
    toast.info("Product removed from draft. Click 'Save All Changes' to persist.");
  };

  // Toggle Product Active
  const toggleProductActive = (id: string) => {
    const updated = settings.products.map((p) =>
      p.id === id ? { ...p, is_active: !p.is_active } : p
    );
    setSettings({ ...settings, products: updated });
  };

  // Reset to Factory Default
  const handleResetDefaults = () => {
    if (confirm("Reset products and popup messages to official high-res factory defaults?")) {
      setSettings(DEFAULT_AMBASSADOR_SETTINGS);
      toast.info("Settings reset to defaults. Click 'Save All Changes' to publish.");
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Hero / Header Strip ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-950 via-[#0d1633] to-slate-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-10 h-64 w-64 rounded-full bg-pink-500/15 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
              <Award className="h-3.5 w-3.5 text-amber-400" />
              SUPER ADMIN OPERATIONS · CAMPUS AMBASSADOR ENGINE
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Institutional Relations Associate (Ambassador) Control
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-light">
              Manage product photography, upload branded merchandise imagery, toggle student application entries, and customize the Coming Soon VIP popup messages in real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-6 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-2"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{isSaving ? "Saving..." : "Save All Changes"}</span>
            </Button>

            <Button
              onClick={() => setTestModalOpen(true)}
              variant="outline"
              className="border-slate-700 bg-slate-900/70 text-slate-200 hover:text-white rounded-xl text-xs flex items-center gap-1.5"
            >
              <Eye className="h-4 w-4 text-amber-400" />
              <span>Preview Live Popup</span>
            </Button>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${settings.applications_enabled ? "bg-emerald-400 animate-pulse" : "bg-rose-500"}`} />
            <div>
              <div className="text-xs text-slate-400 uppercase font-mono">Application Status</div>
              <div className="text-sm font-bold text-white">
                {settings.applications_enabled ? "Accepting Entries" : "Applications Paused"}
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-400 uppercase font-mono">Catalog Items</div>
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

      {/* ─── Sub-Tab Navigation Bar ─── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: "controls", label: "Application & Program Controls", icon: Sliders },
          { id: "popup", label: "Coming Soon Popup Customizer", icon: Sparkles },
          { id: "products", label: "Product Photography & Catalog", icon: ImageIcon, count: settings.products.length },
          { id: "applicants", label: "Applicants & Marketing Broadcast", icon: Mail, count: (registrationsQ.data || []).length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                isActive
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-amber-400" : "text-slate-500"}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
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

      {/* ─── SUB-TAB 1: Application & Program Controls ─── */}
      {activeSubTab === "controls" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Application Entry Status</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Toggle whether students and interns can submit pre-registrations for the First Cohort.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold ${settings.applications_enabled ? "text-emerald-600" : "text-rose-600"}`}>
                    {settings.applications_enabled ? "ENABLED" : "DISABLED"}
                  </span>
                  <Switch
                    checked={settings.applications_enabled}
                    onCheckedChange={(val) => setSettings({ ...settings, applications_enabled: val })}
                  />
                </div>
              </div>

              {!settings.applications_enabled && (
                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/70 space-y-2">
                  <div className="flex items-center gap-2 text-rose-800 text-xs font-bold">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    <span>Applications Currently Paused Message</span>
                  </div>
                  <Textarea
                    rows={2}
                    value={settings.disabled_notice}
                    onChange={(e) => setSettings({ ...settings, disabled_notice: e.target.value })}
                    className="bg-white text-xs text-slate-800"
                    placeholder="Message shown when student attempts to register..."
                  />
                  <p className="text-[11px] text-rose-600">
                    This message will be displayed on the landing page, careers section, and popup when registration is paused.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Cohort Name / Label
                  </label>
                  <Input
                    value={settings.cohort_name}
                    onChange={(e) => setSettings({ ...settings, cohort_name: e.target.value })}
                    placeholder="e.g. First Cohort 2026-27"
                    className="h-10 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Rewards Headline
                  </label>
                  <Input
                    value={settings.target_rewards}
                    onChange={(e) => setSettings({ ...settings, target_rewards: e.target.value })}
                    placeholder="e.g. ₹15,000"
                    className="h-10 text-xs font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-900">Program Management Actions</h4>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
                >
                  <Save className="h-4 w-4 mr-1.5" />
                  <span>Save Configuration</span>
                </Button>
                <Button
                  onClick={handleResetDefaults}
                  variant="outline"
                  className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs rounded-xl"
                >
                  <RotateCcw className="h-4 w-4 mr-1.5 text-slate-500" />
                  <span>Reset to Factory Defaults</span>
                </Button>
                <a
                  href="/campus-ambassador"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
                >
                  <span>Open Public Page</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Help Card */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <span>Super Admin Tip</span>
              </div>
              <p className="text-xs text-amber-950 leading-relaxed">
                Changes saved here reflect <strong>instantly across all student surfaces</strong> including the public landing page (<code>/campus-ambassador</code>), the Careers spotlight, and the Intern Dashboard.
              </p>
              <div className="pt-2 text-[11px] text-amber-800">
                • <strong>Disable applications</strong> before screening rounds start to avoid late submissions.<br/>
                • <strong>Upload original brand photos</strong> in the catalog tab for maximum trust.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── SUB-TAB 2: Coming Soon Popup Customizer ─── */}
      {activeSubTab === "popup" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Coming Soon Modal Popup Settings</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customize the title, badges, announcement message, and rewards copy shown inside the VIP Ticket pass dialog.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Popup Badge Text
                  </label>
                  <Input
                    value={settings.popup_badge}
                    onChange={(e) => setSettings({ ...settings, popup_badge: e.target.value })}
                    placeholder="e.g. EXCLUSIVE VIP PASS"
                    className="h-10 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Popup Main Title
                  </label>
                  <Input
                    value={settings.popup_title}
                    onChange={(e) => setSettings({ ...settings, popup_title: e.target.value })}
                    placeholder="e.g. Vyntyra Institutional Relations Associate"
                    className="h-10 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Popup Subtitle
                  </label>
                  <Input
                    value={settings.popup_subtitle}
                    onChange={(e) => setSettings({ ...settings, popup_subtitle: e.target.value })}
                    placeholder="e.g. First Cohort 2026-27 · Launching Soon"
                    className="h-10 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Popup Announcement Message
                  </label>
                  <Textarea
                    rows={3}
                    value={settings.popup_announcement_message}
                    onChange={(e) =>
                      setSettings({ ...settings, popup_announcement_message: e.target.value })
                    }
                    placeholder="Enter the message displayed to applicants..."
                    className="text-xs leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Rewards Headline Text
                  </label>
                  <Input
                    value={settings.popup_rewards_text}
                    onChange={(e) => setSettings({ ...settings, popup_rewards_text: e.target.value })}
                    placeholder="e.g. Rewards Earn up to ₹15,000 (*Performance & T&C Apply)"
                    className="h-10 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Perks Summary Line
                  </label>
                  <Input
                    value={settings.popup_perks_summary}
                    onChange={(e) => setSettings({ ...settings, popup_perks_summary: e.target.value })}
                    placeholder="e.g. Branded Gadgets · Top 10 Retreat · Dual Certificates"
                    className="h-10 text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <Button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl"
                >
                  <Save className="h-4 w-4 mr-1.5" />
                  <span>Save Popup Copy</span>
                </Button>
                <Button
                  onClick={() => setTestModalOpen(true)}
                  variant="outline"
                  className="text-xs font-bold rounded-xl"
                >
                  <Eye className="h-4 w-4 mr-1.5 text-amber-500" />
                  <span>Test Open Popup</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Live Preview Column */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-slate-800 bg-[#070b14] p-5 text-white shadow-xl space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-amber-400">
                <span>LIVE PREVIEW CARD</span>
                <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-300">
                  {settings.popup_badge}
                </Badge>
              </div>

              <div className="p-4 rounded-xl border border-amber-500/30 bg-slate-900/80 space-y-2">
                <div className="text-sm font-bold text-white">{settings.popup_title}</div>
                <div className="text-xs text-amber-400 font-mono">{settings.popup_subtitle}</div>
                <p className="text-xs text-slate-300 leading-relaxed pt-1">
                  {settings.popup_announcement_message}
                </p>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-emerald-400 font-semibold">
                  💰 {settings.popup_rewards_text}
                </div>
                <div className="text-[11px] text-slate-400">
                  🎁 {settings.popup_perks_summary}
                </div>
              </div>

              <Button
                onClick={() => setTestModalOpen(true)}
                className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
              >
                Click to Test Interactive Dialog &rarr;
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── SUB-TAB 3: Product Photography & Catalog ─── */}
      {activeSubTab === "products" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Product Photography &amp; Merchandise Catalog ({settings.products.length} Items)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload real product photos for goodies, swags, corporate apparel, electronic gadgets, and travel retreat.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={openCreateProduct}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Add Product Photography</span>
              </Button>
              <Button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl"
              >
                <Save className="h-4 w-4 mr-1.5" />
                <span>Save Catalog</span>
              </Button>
            </div>
          </div>

          {/* Products Grid */}
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
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900/80 text-white backdrop-blur-md">
                        {item.category}
                      </span>
                    </div>

                    <div className="absolute top-2 right-2">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border backdrop-blur-md ${
                          item.badge_style || "border-amber-400/40 bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {item.badge}
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
                      onCheckedChange={() => toggleProductActive(item.id)}
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
                      className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteProduct(item.id)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
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

      {/* ─── SUB-TAB 4: Applicants & Marketing Broadcast Hub ─── */}
      {activeSubTab === "applicants" && (
        <div className="space-y-6">
          <AdminAmbassadorCampaign />
        </div>
      )}

      {/* ─── Add/Edit Product Photography Modal ─── */}
      <Dialog open={productModalOpen} onOpenChange={setProductModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingProduct && settings.products.some((p) => p.id === editingProduct.id)
                ? "Edit Product Photography & Merchandise"
                : "Add New Product Photography Item"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Upload product photo to Supabase Storage or specify a CDN image URL.
            </DialogDescription>
          </DialogHeader>

          {editingProduct && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Product Title *
                  </label>
                  <Input
                    required
                    value={editingProduct.title}
                    onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                    placeholder="e.g. Executive Corporate Welcome Box"
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
                    placeholder="e.g. 20,000mAh PD Fast Charge"
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
                      <SelectValue placeholder="Select Category" />
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
                    placeholder="e.g. Guaranteed Upon Onboarding"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Photo Upload & Preview Section */}
              <div className="space-y-2 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
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

                {/* Image Preview */}
                {editingProduct.image_url && (
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-900">
                    <img
                      src={editingProduct.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Upload File Input */}
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <label className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition-colors shrink-0">
                    <UploadCloud className="h-4 w-4" />
                    <span>Upload Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <Input
                    value={editingProduct.image_url}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, image_url: e.target.value })
                    }
                    placeholder="Or enter direct HTTPS image URL..."
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
                  placeholder="Describe the product specifications, material, and qualification..."
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
                  <span className="text-xs font-medium text-slate-700">Display in Public Catalog</span>
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

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setProductModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveProduct}
              className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs"
            >
              Update Product Draft
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
