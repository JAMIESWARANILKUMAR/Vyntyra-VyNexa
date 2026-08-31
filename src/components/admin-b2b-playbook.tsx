import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Utensils, 
  GraduationCap, 
  Sparkles, 
  Armchair, 
  Scissors, 
  Mail, 
  PhoneCall, 
  Copy, 
  Check, 
  Send, 
  Calendar, 
  Target, 
  ShieldCheck, 
  TrendingUp, 
  AlertTriangle, 
  FileText, 
  ChevronRight,
  Layers,
  Zap,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  Edit3,
  Save,
  RotateCcw,
  Eye,
  MessageSquare,
  Smartphone,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export interface PlaybookIndustry {
  id: string;
  name: string;
  icon: React.ElementType;
  targetRole: string;
  painPoint: string;
  emailSubject: string;
  emailBodyTemplate: string;
  pitchScriptTemplate: string;
  whatsAppTemplate: string;
  defaultVars: Record<string, string>;
}

export const INITIAL_PLAYBOOK_INDUSTRIES: PlaybookIndustry[] = [
  {
    id: "restaurants",
    name: "Restaurants & Cafes",
    icon: Utensils,
    targetRole: "Owner, General Manager, or Operations Head",
    painPoint: "25–35% marketplace commissions (Swiggy/Zomato/Uber Eats) and lost customer data",
    emailSubject: "Quick question regarding direct orders at {{Restaurant_Name}}",
    emailBodyTemplate: `Hi {{First_Name}},

Noticed the great reviews for {{Restaurant_Name}}’s {{popular_dish_or_specialty}} around {{City_or_Neighborhood}}.

Most restaurant owners we speak with mention that third-party delivery platforms take between 20% and 30% on every order, while keeping customer data locked behind their apps.

At Vyntyra Consultancy Services, we build direct, commission-free online ordering systems and WhatsApp-integrated menus that:

• Keep 100% of order revenue directly in your bank account
• Automate order routing straight to your kitchen/POS printer
• Build a direct customer database for repeat promo SMS/WhatsApp campaigns

Would you be open to a 7-minute call this Thursday at 3:00 PM to see how a direct ordering setup works for {{Restaurant_Name}}?

Best regards,

Team Vyntyra
Vyntyra Consultancy Services Pvt. Ltd.
{{Website_URL}} | {{Phone_Number}}`,
    pitchScriptTemplate: `"Hi {{First_Name}}, I love what you’ve built with {{Restaurant_Name}}. Quick question: are you currently looking for ways to capture direct online orders without paying the heavy 25–30% aggregator commissions?

I run tech consulting at Vyntyra. We help local dining brands launch their own branded online ordering platform and automated WhatsApp booking system. It routes directly to your kitchen, retains your customer database, and has zero per-order commissions. Could I leave a quick 1-page breakdown with you, or can we chat for 5 minutes after your lunch rush?"`,
    whatsAppTemplate: `Hi {{First_Name}}! 👋 Noticed the great reviews for {{Restaurant_Name}}’s {{popular_dish_or_specialty}} around {{City_or_Neighborhood}}.

Are 25-35% Zomato/Swiggy commissions eating into your margins? 🍕

At Vyntyra Consultancy Services, we build direct, 0% commission online ordering & WhatsApp menu systems. Routes straight to your kitchen POS!

Can I share a quick 2-minute demo video or 1-page breakdown with you today? 📈`,
    defaultVars: {
      Restaurant_Name: "The Grand Bistro",
      First_Name: "Rajesh",
      popular_dish_or_specialty: "Wood-fired Artisan Pizzas",
      City_or_Neighborhood: "Visakhapatnam",
      Website_URL: "https://vyntyra.com",
      Phone_Number: "+91 98765 43210"
    }
  },
  {
    id: "schools",
    name: "Schools, Colleges & Coaching",
    icon: GraduationCap,
    targetRole: "Principal, Director, Chairman, or Administrative Head",
    painPoint: "Fragmented administrative tasks, manual fee collection delays, and poor parent communication",
    emailSubject: "Streamlining fee collection and administrative workflows for {{School_Name}}",
    emailBodyTemplate: `Respected {{First_Name}},

Managing student admissions, timetable coordination, and parent updates across fragmented tools often creates administrative bottlenecks for growing institutions.

Vyntyra Consultancy Services develops custom, all-in-one Campus ERP and Learning Management Systems specifically built to simplify academic administration:

• Automated Fee Management: Direct payment gateway integration with instant SMS/WhatsApp fee reminders and auto-generated receipts
• Unified Parent Portal: Real-time mobile attendance, grade reports, and digital notices in one place
• Zero Clutter: A customized interface containing only the modules your staff actually uses, with no unnecessary recurring license bloat

Could we schedule a brief 10-minute online walkthrough next Tuesday to demonstrate how this can streamline operations at {{School_Name}}?

Warm regards,

Team Vyntyra
Vyntyra Consultancy Services Pvt. Ltd.
{{Website_URL}} | {{Phone_Number}}`,
    pitchScriptTemplate: `"Good morning {{First_Name}}. I’m contacting you from Vyntyra Consultancy Services. We specialize in custom educational ERP software.

Many institutional heads tell us that off-the-shelf software is either too complex for teachers or lacks automated fee tracking. We build simplified, unified portals for attendance, auto-receipt fee collection, and parent communication customized to your exact syllabus and fee structures. I’d appreciate the opportunity to show you a quick 1-minute demo of how other institutes automated their administrative reporting."`,
    whatsAppTemplate: `Respected {{First_Name}}, greetings from Vyntyra Consultancy Services! 🎓

Streamline fee collections & parent communications at {{School_Name}} with our custom Campus ERP:

✅ Auto Fee Reminders & Receipt Generation via WhatsApp
✅ Real-time Parent & Attendance Mobile Portal
✅ Zero License Bloat — Built for your exact syllabus

Would you be available for a brief 5-minute online walkthrough next Tuesday? 📅`,
    defaultVars: {
      School_Name: "St. Xavier Academy",
      First_Name: "Dr. Sharma",
      City_or_Neighborhood: "Hyderabad",
      Website_URL: "https://vyntyra.com",
      Phone_Number: "+91 98765 43210"
    }
  },
  {
    id: "salons",
    name: "Beauty Salons & Wellness Spas",
    icon: Scissors,
    targetRole: "Salon Owner, Studio Director, or Lead Esthetician",
    painPoint: "Appointment no-shows, messy manual booking calendars, and lost repeat bookings",
    emailSubject: "Reducing no-shows and boosting rebookings at {{Salon_Name}}",
    emailBodyTemplate: `Hi {{First_Name}},

Running a high-volume salon like {{Salon_Name}} means every empty appointment slot or last-minute cancellation directly impacts your daily chair revenue.

At Vyntyra Consultancy Services, we develop custom appointment booking web apps and automated reminder systems for premium salons:

• Automated WhatsApp Reminders: Cut no-shows by up to 40% with automated confirmations and calendar sync
• Seamless 24/7 Online Booking: Let clients book their favorite stylist and service directly from your Instagram bio or website
• Stylist Commission & Inventory Tracking: Automatically calculate staff commissions and monitor product stock levels in real time

Would you be open to a quick 5-minute chat this week to see how a streamlined booking flow can increase weekday chair occupancy?

Best,

Team Vyntyra
Vyntyra Consultancy Services Pvt. Ltd.
{{Website_URL}} | {{Phone_Number}}`,
    pitchScriptTemplate: `"Hi {{First_Name}}, your salon’s work on Instagram looks incredible. Quick question—how are you currently handling appointment reminders and weekday bookings?

We build custom online booking and automated WhatsApp reminder systems for salons. It allows your clients to book specific stylists 24/7 without calling, and sends automatic reminders to eliminate no-shows while tracking staff commissions automatically. If you have two minutes, I’d love to share a quick preview of how it looks on mobile."`,
    whatsAppTemplate: `Hi {{First_Name}}! ✨ Loved the salon transformations at {{Salon_Name}} on Instagram!

Tired of last-minute appointment no-shows and empty chairs? 💇‍♀️

We build custom 24/7 online booking apps with automated WhatsApp appointment reminders that cut no-shows by up to 40% & auto-track stylist commissions.

Got 2 minutes to see how it looks on mobile? 📲`,
    defaultVars: {
      Salon_Name: "Glow & Grace Luxury Spa",
      First_Name: "Priya",
      City_or_Neighborhood: "Bengaluru",
      Website_URL: "https://vyntyra.com",
      Phone_Number: "+91 98765 43210"
    }
  },
  {
    id: "furniture",
    name: "Furniture & Interior Showrooms",
    icon: Armchair,
    targetRole: "Showroom Owner, Managing Partner, or Sales Director",
    painPoint: "Long sales cycles, difficulties visualizing products in customer spaces, and manual inventory/delivery tracking",
    emailSubject: "Accelerating custom quotes and visual sales for {{Showroom_Name}}",
    emailBodyTemplate: `Hi {{First_Name}},

When customers shop for furniture at {{Showroom_Name}}, one of the biggest reasons they hesitate before purchasing is uncertain spatial sizing and visualization.

Vyntyra Consultancy Services designs custom digital catalogs, 3D/AR product visualizers, and showroom ERPs tailored for the furniture and interior design trade:

• Interactive Digital Catalogs: Enable clients to view dimensions, fabric variants, and finish options interactively
• Instant Quotation Calculators: Allow sales staff to generate detailed modular pricing and PDF invoices on an iPad in seconds
• Warehouse & Dispatch Tracking: Track custom manufacturing orders from workshop production to home delivery

Would you be open to a 10-minute demo on Friday to explore how interactive digital catalogs can help shorten your showroom sales cycle?

Best regards,

Team Vyntyra
Vyntyra Consultancy Services Pvt. Ltd.
{{Website_URL}} | {{Phone_Number}}`,
    pitchScriptTemplate: `"Hello {{First_Name}}, you have a great collection in the showroom. Quick question: when clients are considering custom pieces or modular sets, do your reps have a fast way to generate instant visual quotes?

At Vyntyra, we build custom digital catalog apps and showroom inventory software. Your sales team can showcase custom material options, generate itemized estimates on the spot, and track dispatch schedules effortlessly. Could I show you a 60-second demo on a tablet?"`,
    whatsAppTemplate: `Hello {{First_Name}}! 🛋️ Great furniture collection at {{Showroom_Name}}!

Hesitating buyers holding back due to size or fabric uncertainty? 📐

We design 3D/AR interactive digital catalogs and instant iPad quote calculators for showroom teams to close custom orders 2x faster.

Could I drop a 60-second tablet demo link here for you? 🚀`,
    defaultVars: {
      Showroom_Name: "Urban Living Furniture Studio",
      First_Name: "Vikram",
      City_or_Neighborhood: "Visakhapatnam",
      Website_URL: "https://vyntyra.com",
      Phone_Number: "+91 98765 43210"
    }
  }
];

const LOCAL_STORAGE_PLAYBOOK_KEY = "vyntyra_b2b_playbook_custom_templates_v2";

export function AdminB2bPlaybook() {
  const [activeTab, setActiveTab] = useState<string>("restaurants");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [targetPhone, setTargetPhone] = useState<string>("919876543210");
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Industry Template States with Local Storage Support
  const [industries, setIndustries] = useState<PlaybookIndustry[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(LOCAL_STORAGE_PLAYBOOK_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (err) {
          console.error("Failed to parse saved playbook templates:", err);
        }
      }
    }
    return INITIAL_PLAYBOOK_INDUSTRIES;
  });

  const selectedIndustry = industries.find((i) => i.id === activeTab) || industries[0];

  // Editable Form Draft State
  const [editSubject, setEditSubject] = useState<string>(selectedIndustry.emailSubject);
  const [editEmailBody, setEditEmailBody] = useState<string>(selectedIndustry.emailBodyTemplate);
  const [editPitchScript, setEditPitchScript] = useState<string>(selectedIndustry.pitchScriptTemplate);
  const [editWhatsApp, setEditWhatsApp] = useState<string>(selectedIndustry.whatsAppTemplate);

  // Variable Substitutions Form State
  const [formVars, setFormVars] = useState<Record<string, string>>({
    First_Name: selectedIndustry.defaultVars.First_Name || "Decision Maker",
    Restaurant_Name: selectedIndustry.defaultVars.Restaurant_Name || selectedIndustry.defaultVars.School_Name || selectedIndustry.defaultVars.Salon_Name || selectedIndustry.defaultVars.Showroom_Name || "Target Business",
    popular_dish_or_specialty: selectedIndustry.defaultVars.popular_dish_or_specialty || "Specialty Services",
    City_or_Neighborhood: selectedIndustry.defaultVars.City_or_Neighborhood || "Visakhapatnam",
    Website_URL: "https://vyntyra.com",
    Phone_Number: "+91 98765 43210"
  });

  // Keep Edit Fields Synced when Switching Tabs or resetting
  useEffect(() => {
    setEditSubject(selectedIndustry.emailSubject);
    setEditEmailBody(selectedIndustry.emailBodyTemplate);
    setEditPitchScript(selectedIndustry.pitchScriptTemplate);
    setEditWhatsApp(selectedIndustry.whatsAppTemplate);
  }, [activeTab, selectedIndustry]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    setIsEditing(false);
    const ind = industries.find((i) => i.id === val);
    if (ind) {
      setFormVars((prev) => ({
        ...prev,
        First_Name: ind.defaultVars.First_Name || "Decision Maker",
        Restaurant_Name: ind.defaultVars.Restaurant_Name || ind.defaultVars.School_Name || ind.defaultVars.Salon_Name || ind.defaultVars.Showroom_Name || "Target Business",
        popular_dish_or_specialty: ind.defaultVars.popular_dish_or_specialty || "Core Offerings",
        City_or_Neighborhood: ind.defaultVars.City_or_Neighborhood || "Visakhapatnam",
      }));
    }
  };

  const handleSaveCustomTemplates = () => {
    const updated = industries.map((ind) => {
      if (ind.id === activeTab) {
        return {
          ...ind,
          emailSubject: editSubject,
          emailBodyTemplate: editEmailBody,
          pitchScriptTemplate: editPitchScript,
          whatsAppTemplate: editWhatsApp
        };
      }
      return ind;
    });

    setIndustries(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_PLAYBOOK_KEY, JSON.stringify(updated));
    }
    setIsEditing(false);
    toast.success(`Saved custom ${selectedIndustry.name} templates!`);
  };

  const handleResetTemplates = () => {
    const initialForTab = INITIAL_PLAYBOOK_INDUSTRIES.find((i) => i.id === activeTab);
    if (!initialForTab) return;

    const updated = industries.map((ind) => {
      if (ind.id === activeTab) {
        return initialForTab;
      }
      return ind;
    });

    setIndustries(updated);
    setEditSubject(initialForTab.emailSubject);
    setEditEmailBody(initialForTab.emailBodyTemplate);
    setEditPitchScript(initialForTab.pitchScriptTemplate);
    setEditWhatsApp(initialForTab.whatsAppTemplate);

    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_PLAYBOOK_KEY, JSON.stringify(updated));
    }
    setIsEditing(false);
    toast.info(`Reset ${selectedIndustry.name} templates to defaults.`);
  };

  const getSubstitutedText = (template: string): string => {
    let result = template || "";
    const currentBusinessName = formVars.Restaurant_Name || "Target Business";
    result = result.replaceAll("{{Restaurant_Name}}", currentBusinessName);
    result = result.replaceAll("{{School_Name}}", currentBusinessName);
    result = result.replaceAll("{{Salon_Name}}", currentBusinessName);
    result = result.replaceAll("{{Showroom_Name}}", currentBusinessName);
    result = result.replaceAll("{{First_Name}}", formVars.First_Name || "Owner");
    result = result.replaceAll("{{popular_dish_or_specialty}}", formVars.popular_dish_or_specialty || "specialty services");
    result = result.replaceAll("{{City/Neighborhood}}", formVars.City_or_Neighborhood || "City");
    result = result.replaceAll("{{City_or_Neighborhood}}", formVars.City_or_Neighborhood || "City");
    result = result.replaceAll("{{Website_URL}}", formVars.Website_URL || "https://vyntyra.com");
    result = result.replaceAll("{{Phone_Number}}", formVars.Phone_Number || "+91 98765 43210");
    return result;
  };

  const copyToClipboard = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const openWhatsAppLink = (messageText: string) => {
    const cleanedPhone = targetPhone.replace(/[^0-9]/g, "");
    const encodedText = encodeURIComponent(messageText);
    const url = cleanedPhone
      ? `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(url, "_blank");
    toast.success("Opening WhatsApp with pre-filled pitch message!");
  };

  const renderedSubject = getSubstitutedText(isEditing ? editSubject : selectedIndustry.emailSubject);
  const renderedBody = getSubstitutedText(isEditing ? editEmailBody : selectedIndustry.emailBodyTemplate);
  const renderedPitch = getSubstitutedText(isEditing ? editPitchScript : selectedIndustry.pitchScriptTemplate);
  const renderedWhatsApp = getSubstitutedText(isEditing ? editWhatsApp : selectedIndustry.whatsAppTemplate);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 text-white p-6 sm:p-8 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.15),transparent_70%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-300 backdrop-blur-md">
              <Zap className="h-3.5 w-3.5 text-gold animate-pulse" />
              High-Converting B2B Cold Email, WhatsApp & Pitch Engine
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              B2B Client Acquisition & Pitch Playbook
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Targeted outreach templates for local decision-makers in Restaurants, Schools, Salons, and Furniture Showrooms. Edit, save, preview live email/WhatsApp mockups, and launch 1-click WhatsApp messages.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isEditing ? (
              <>
                <Button
                  onClick={handleSaveCustomTemplates}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg flex items-center gap-1.5"
                >
                  <Save className="h-4 w-4" /> Save Edits
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="text-xs bg-slate-800 text-slate-200 border-slate-700"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg flex items-center gap-1.5"
              >
                <Edit3 className="h-4 w-4" /> Edit Templates
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleResetTemplates}
              title="Reset templates to factory defaults"
              className="text-xs border-slate-700 bg-slate-900/80 text-slate-300 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
        <div className="border-b border-border pb-2 overflow-x-auto">
          <TabsList className="bg-muted/60 p-1.5 rounded-lg flex gap-1 h-auto min-w-max">
            {industries.map((ind) => {
              const Icon = ind.icon;
              return (
                <TabsTrigger
                  key={ind.id}
                  value={ind.id}
                  className="data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm px-4 py-2.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all"
                >
                  <Icon className="h-4 w-4" />
                  {ind.name}
                </TabsTrigger>
              );
            })}
            <TabsTrigger
              value="best-practices"
              className="data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm px-4 py-2.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Outreach Best Practices & Cadence
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Industry Specific Content */}
        {industries.map((ind) => {
          if (ind.id !== activeTab) return null;

          return (
            <TabsContent key={ind.id} value={ind.id} className="space-y-6 animate-in fade-in-50 duration-200">
              {/* Target & Painpoint Summary Card */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border border-border/80 shadow-sm bg-surface/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 text-secondary" /> Decision-Maker Target Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-semibold text-foreground">{ind.targetRole}</div>
                  </CardContent>
                </Card>

                <Card className="border border-amber-500/20 bg-amber-500/5 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" /> Revenue & Operational Bottleneck
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-semibold text-amber-900 dark:text-amber-200">{ind.painPoint}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Dynamic Variables Personalizer & WhatsApp Phone Bar */}
              <Card className="border border-secondary/20 bg-card shadow-sm">
                <CardHeader className="pb-3 border-b border-border">
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-gold" />
                      Outreach Variable Personalizer & Contact Setup
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                      Live Variable Substitution
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Update business details to customize the Email, Phone Pitch, and WhatsApp messages in real time.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Decision Maker Name</label>
                    <Input
                      value={formVars.First_Name}
                      onChange={(e) => setFormVars({ ...formVars, First_Name: e.target.value })}
                      placeholder="e.g. Rajesh"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Business / Institution Name</label>
                    <Input
                      value={formVars.Restaurant_Name}
                      onChange={(e) => setFormVars({ ...formVars, Restaurant_Name: e.target.value })}
                      placeholder="e.g. The Grand Bistro"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Specialty / Feature</label>
                    <Input
                      value={formVars.popular_dish_or_specialty}
                      onChange={(e) => setFormVars({ ...formVars, popular_dish_or_specialty: e.target.value })}
                      placeholder="e.g. Artisan Pizzas"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">City / Neighborhood</label>
                    <Input
                      value={formVars.City_or_Neighborhood}
                      onChange={(e) => setFormVars({ ...formVars, City_or_Neighborhood: e.target.value })}
                      placeholder="e.g. Visakhapatnam"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" /> Target WhatsApp Number
                    </label>
                    <Input
                      value={targetPhone}
                      onChange={(e) => setTargetPhone(e.target.value)}
                      placeholder="919876543210"
                      className="h-8 text-xs border-emerald-500/40 focus:border-emerald-500 font-mono"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Template Editor Drawer if in Editing Mode */}
              {isEditing && (
                <Card className="border-2 border-indigo-500 bg-card shadow-xl animate-in slide-in-from-top-4 duration-300">
                  <CardHeader className="bg-indigo-950 text-white p-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Edit3 className="h-4 w-4 text-gold" />
                        Edit {ind.name} Master Templates
                      </CardTitle>
                      <Badge className="bg-gold text-slate-950 font-bold text-[10px]">Editing Active</Badge>
                    </div>
                    <CardDescription className="text-xs text-slate-300">
                      Use placeholder tags like <code className="bg-indigo-900 px-1 py-0.5 rounded text-gold">{"{{First_Name}}"}</code>, <code className="bg-indigo-900 px-1 py-0.5 rounded text-gold">{"{{Restaurant_Name}}"}</code>, etc.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">Email Subject Line Template</label>
                      <Input
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        className="text-xs font-mono"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground">Cold Email Body Template</label>
                        <Textarea
                          value={editEmailBody}
                          onChange={(e) => setEditEmailBody(e.target.value)}
                          rows={12}
                          className="text-xs font-mono leading-relaxed"
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-foreground">45-Second Phone Pitch Script</label>
                          <Textarea
                            value={editPitchScript}
                            onChange={(e) => setEditPitchScript(e.target.value)}
                            rows={5}
                            className="text-xs font-mono leading-relaxed"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" /> WhatsApp Message Template
                          </label>
                          <Textarea
                            value={editWhatsApp}
                            onChange={(e) => setEditWhatsApp(e.target.value)}
                            rows={5}
                            className="text-xs font-mono leading-relaxed border-emerald-500/40"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-border">
                      <Button
                        size="sm"
                        onClick={handleSaveCustomTemplates}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5"
                      >
                        <Save className="h-4 w-4" /> Save All Templates
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Showcase Grid: Email Code vs Interactive Email Preview */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* 1. Email Source / Raw Text */}
                <Card className="border border-border bg-card shadow-corp flex flex-col justify-between">
                  <div>
                    <CardHeader className="border-b border-border bg-muted/30 pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <FileText className="h-4 w-4 text-secondary" />
                          Substituted Email Text & Subject
                        </CardTitle>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(`${renderedSubject}\n\n${renderedBody}`, `email_${ind.id}`, "Cold Email")}
                          className="h-7 text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
                        >
                          {copiedKey === `email_${ind.id}` ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          Copy Full Email
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      {/* Subject Line */}
                      <div className="bg-surface rounded-md p-3 border border-border">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                          Subject Line:
                        </div>
                        <div className="text-xs font-semibold text-foreground select-all">
                          {renderedSubject}
                        </div>
                      </div>

                      {/* Email Body */}
                      <div className="bg-surface rounded-md p-4 border border-border font-mono text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed select-all max-h-[380px] overflow-y-auto">
                        {renderedBody}
                      </div>
                    </CardContent>
                  </div>
                  <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-between">
                    <div className="text-[11px] text-muted-foreground">
                      💡 Tip: Personalize line 1 with real details from Google Maps.
                    </div>
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(renderedBody, `body_${ind.id}`, "Email Body")}
                      className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                    >
                      Copy Body Only
                    </Button>
                  </div>
                </Card>

                {/* 2. Interactive Real-Time Email Preview Card */}
                <Card className="border border-border bg-card shadow-corp flex flex-col justify-between overflow-hidden">
                  <div>
                    <CardHeader className="border-b border-border bg-slate-900 text-white pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <Eye className="h-4 w-4 text-gold" />
                          Live Email Client Preview (Recipient View)
                        </CardTitle>
                        <Badge className="bg-gold/20 text-gold border-gold/40 text-[10px]">Corporate View</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {/* Inbox Mail Header Bar */}
                      <div className="bg-muted/40 p-4 border-b border-border space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="font-semibold text-foreground w-12">From:</span>
                          <span className="text-foreground">Team Vyntyra &lt;outreach@vyntyra.com&gt;</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="font-semibold text-foreground w-12">To:</span>
                          <span className="text-foreground">{formVars.First_Name || "Decision Maker"} &lt;{formVars.First_Name?.toLowerCase() || "owner"}@{formVars.Restaurant_Name?.toLowerCase().replaceAll(/\s+/g, "") || "business"}.com&gt;</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground border-t border-border/50 pt-2">
                          <span className="font-semibold text-foreground w-12">Subject:</span>
                          <span className="font-bold text-primary truncate">{renderedSubject}</span>
                        </div>
                      </div>

                      {/* Rendered Email Body in Corporate Card */}
                      <div className="p-6 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 max-h-[380px] overflow-y-auto space-y-4 text-xs leading-relaxed font-sans">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                          <div className="h-6 w-6 rounded bg-indigo-900 flex items-center justify-center text-gold font-bold text-xs">
                            V
                          </div>
                          <span className="font-bold text-indigo-950 dark:text-indigo-300">Vyntyra Consultancy Services</span>
                        </div>

                        <div className="whitespace-pre-wrap font-sans text-slate-800 dark:text-slate-200">
                          {renderedBody}
                        </div>

                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Vyntyra Consultancy Services Pvt. Ltd.</span>
                          <a href={formVars.Website_URL} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-semibold flex items-center gap-1">
                            Visit Portal <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                  <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">HTML Corporate Styling Applied</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(renderedSubject, `subj_${ind.id}`, "Subject Line")}
                      className="h-8 text-xs font-semibold"
                    >
                      Copy Subject Line
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Showcase Grid: 45-Second Phone Pitch vs WhatsApp Message & Live Preview */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* 1. Phone Pitch Script */}
                <Card className="border border-border bg-card shadow-corp flex flex-col justify-between">
                  <div>
                    <CardHeader className="border-b border-border bg-muted/30 pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <PhoneCall className="h-4 w-4 text-emerald-600" />
                          45-Second Phone / Walk-in Pitch Script
                        </CardTitle>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(renderedPitch, `pitch_${ind.id}`, "Pitch Script")}
                          className="h-7 text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
                        >
                          {copiedKey === `pitch_${ind.id}` ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          Copy Script
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="bg-emerald-500/5 rounded-md p-4 border border-emerald-500/20 text-xs text-foreground/90 leading-relaxed font-sans italic whitespace-pre-wrap select-all">
                        {renderedPitch}
                      </div>

                      <div className="space-y-2 pt-2">
                        <div className="text-xs font-semibold text-foreground">Key Pitch Objectives:</div>
                        <ul className="space-y-1.5 text-xs text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            Hook within 10 seconds by mentioning their exact business name and core product.
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            Highlight immediate ROI: 0% commissions, automated workflow, or zero no-shows.
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            Low-friction call-to-action: Offer a 1-page breakdown or quick 5-minute off-peak chat.
                          </li>
                        </ul>
                      </div>
                    </CardContent>
                  </div>
                  <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-between">
                    <div className="text-[11px] text-muted-foreground">
                      ⏱️ Duration: 45–60 Seconds
                    </div>
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(renderedPitch, `pitch_btn_${ind.id}`, "Phone Pitch")}
                      className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                      Copy Phone Pitch
                    </Button>
                  </div>
                </Card>

                {/* 2. One-Click WhatsApp Action & Authentic Mobile WhatsApp Preview */}
                <Card className="border border-emerald-500/30 bg-card shadow-corp flex flex-col justify-between overflow-hidden">
                  <div>
                    <CardHeader className="border-b border-emerald-500/30 bg-emerald-950 text-white pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-emerald-400" />
                          One-Click WhatsApp Outreach & Mobile Preview
                        </CardTitle>
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/40 text-[10px]">
                          Direct WA API
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 space-y-4">
                      {/* WhatsApp Mobile Chat Interface Mockup */}
                      <div className="rounded-xl overflow-hidden border border-emerald-800/40 bg-slate-950 shadow-2xl">
                        {/* WhatsApp Top Header Bar */}
                        <div className="bg-emerald-900 px-4 py-2.5 flex items-center justify-between text-white border-b border-emerald-800">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-xs text-white">
                              {formVars.First_Name?.[0] || "B"}
                            </div>
                            <div>
                              <div className="text-xs font-bold flex items-center gap-1">
                                {formVars.First_Name || "Decision Maker"} ({formVars.Restaurant_Name || "Client"})
                                <UserCheck className="h-3 w-3 text-emerald-300" />
                              </div>
                              <div className="text-[10px] text-emerald-200">Online · Business Account</div>
                            </div>
                          </div>
                          <Smartphone className="h-4 w-4 text-emerald-300" />
                        </div>

                        {/* WhatsApp Chat Area */}
                        <div className="p-4 bg-[#0b141a] bg-opacity-95 min-h-[220px] flex flex-col justify-end space-y-3">
                          <div className="self-end max-w-[90%] bg-[#005c4b] text-slate-100 rounded-2xl rounded-tr-none px-3.5 py-2.5 shadow-md text-xs whitespace-pre-wrap leading-relaxed select-all border border-emerald-600/30">
                            {renderedWhatsApp}
                            <div className="text-[9px] text-emerald-300/80 text-right mt-1.5 flex items-center justify-end gap-1">
                              <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              <span className="text-sky-300 font-bold">✓✓</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </div>

                  <div className="p-4 border-t border-border bg-emerald-500/5 flex flex-wrap items-center justify-between gap-2">
                    <Button
                      size="sm"
                      onClick={() => openWhatsAppLink(renderedWhatsApp)}
                      className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-md"
                    >
                      <Send className="h-3.5 w-3.5" /> 1-Click Send on WhatsApp
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(renderedWhatsApp, `wa_${ind.id}`, "WhatsApp Message")}
                      className="h-8 text-xs border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 font-semibold"
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy Message Text
                    </Button>
                  </div>
                </Card>
              </div>
            </TabsContent>
          );
        })}

        {/* Outreach Best Practices & Cadence Tab */}
        <TabsContent value="best-practices" className="space-y-6 animate-in fade-in-50 duration-200">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border border-border bg-card shadow-sm">
              <CardHeader className="pb-2">
                <Badge variant="outline" className="w-fit text-[10px] bg-secondary/10 text-secondary border-secondary/30 mb-1">Stage 1</Badge>
                <CardTitle className="text-sm font-bold">Customization</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed">
                Always replace placeholders (<code className="text-foreground font-mono">popular_dish</code>, <code className="text-foreground font-mono">City</code>) with verified details from their Google Maps listing or social profile before hitting send.
              </CardContent>
            </Card>

            <Card className="border border-border bg-card shadow-sm">
              <CardHeader className="pb-2">
                <Badge variant="outline" className="w-fit text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30 mb-1">Stage 2</Badge>
                <CardTitle className="text-sm font-bold">Follow-Up 1 (Day 3)</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed">
                Send a soft reminder thread: <br />
                <span className="italic text-foreground font-medium">"Hi {"{{First_Name}}"}, just floating this to the top of your inbox in case you missed it."</span>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card shadow-sm">
              <CardHeader className="pb-2">
                <Badge variant="outline" className="w-fit text-[10px] bg-indigo-500/10 text-indigo-600 border-indigo-500/30 mb-1">Stage 3</Badge>
                <CardTitle className="text-sm font-bold">Follow-Up 2 (Day 6)</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed">
                Share a quick 3-bullet mini case study or feature highlight showing concrete metrics (e.g., 30% commission savings or 40% reduction in no-shows).
              </CardContent>
            </Card>

            <Card className="border border-border bg-card shadow-sm">
              <CardHeader className="pb-2">
                <Badge variant="outline" className="w-fit text-[10px] bg-destructive/10 text-destructive border-destructive/30 mb-1">Stage 4</Badge>
                <CardTitle className="text-sm font-bold">Breakup Email (Day 10)</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed">
                Polite closing email: <br />
                <span className="italic text-foreground font-medium">"Assuming direct online orders/automation isn't a priority right now, I'll stop reaching out."</span>
              </CardContent>
            </Card>
          </div>

          <Card className="border border-indigo-500/20 bg-indigo-500/5 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                Delivery Mechanism & Domain Security Compliance
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Crucial steps to maintain domain reputation and ensure 99%+ inbox placement.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-foreground/90">
              <div className="flex items-start gap-3 p-3 bg-card rounded-md border border-border">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">Verified Domain Sender:</span> Always send cold emails from a verified corporate domain email address (e.g., <code className="bg-muted px-1 py-0.5 rounded text-foreground font-mono">anil@vyntyra.com</code>).
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-card rounded-md border border-border">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">SPF, DKIM, and DMARC Records:</span> Ensure your DNS records are configured with valid SPF, DKIM, and DMARC policies to prevent emails from landing in spam/junk folders.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-card rounded-md border border-border">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">Gradual Warmup:</span> Limit new outreach volume to 30–50 targeted personalized emails per day per inbox.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
