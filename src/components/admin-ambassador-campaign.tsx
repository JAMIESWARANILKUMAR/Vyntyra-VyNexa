import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Sparkles,
  Mail,
  Send,
  MessageSquare,
  Users,
  CheckCircle2,
  Copy,
  ExternalLink,
  Gift,
  Award,
  TrendingUp,
  Zap,
  Plane,
  FileCheck2,
  Crown,
  Search,
  CheckSquare,
  Square,
  RefreshCw,
  Loader2,
  Phone,
  Building2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getInternsForAmbassadorCampaign,
  sendAmbassadorPromotionalEmail,
  listAmbassadorRegistrations,
  updateAmbassadorApplicantStatus,
  AmbassadorRegistration,
} from "@/lib/ambassador.functions";

export function AdminAmbassadorCampaign() {
  const qc = useQueryClient();
  const fetchInternsFn = useServerFn(getInternsForAmbassadorCampaign);
  const sendEmailFn = useServerFn(sendAmbassadorPromotionalEmail);
  const listRegistrationsFn = useServerFn(listAmbassadorRegistrations);
  const updateStatusFn = useServerFn(updateAmbassadorApplicantStatus);

  // Queries
  const internsQuery = useQuery({
    queryKey: ["admin-ambassador-interns"],
    queryFn: () => fetchInternsFn(),
    staleTime: 60000,
  });

  const registrationsQuery = useQuery({
    queryKey: ["admin-ambassador-registrations"],
    queryFn: () => listRegistrationsFn(),
    staleTime: 30000,
  });

  const interns = internsQuery.data || [];
  const registrations: AmbassadorRegistration[] = registrationsQuery.data || [];

  const handleUpdateStatus = async (
    applicantId: string,
    status: "pending" | "shortlisted" | "enrolled" | "rejected"
  ) => {
    try {
      await updateStatusFn({
        data: { applicant_id: applicantId, status },
      });
      toast.success(`Applicant status updated to ${status}`);
      qc.invalidateQueries({ queryKey: ["admin-ambassador-registrations"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  // State
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [activeChannel, setActiveChannel] = useState<"email" | "whatsapp" | "registrations">("email");
  const [subjectText, setSubjectText] = useState(
    "🚀 Launching Soon: Vyntyra Institutional Relations Associate (Campus Ambassador) — First Cohort"
  );

  // Email sending progress
  const [isSending, setIsSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [testEmail, setTestEmail] = useState("");

  // Filtered interns list
  const filteredInterns = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return interns;
    return interns.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.email.toLowerCase().includes(q) ||
        i.college.toLowerCase().includes(q) ||
        i.phone.includes(q)
    );
  }, [interns, search]);

  const toggleSelectAll = () => {
    if (selectedEmails.size === filteredInterns.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(filteredInterns.map((i) => i.email)));
    }
  };

  const toggleSelectOne = (email: string) => {
    const next = new Set(selectedEmails);
    if (next.has(email)) next.delete(email);
    else next.add(email);
    setSelectedEmails(next);
  };

  // WhatsApp Message Generator
  const generateWhatsAppMessage = (name: string, college: string) => {
    return `🚀 *EXCLUSIVE LAUNCH: Vyntyra Institutional Relations Associate (Campus Ambassador) — First Cohort 2026-27*

Hi *${name || "Associate"}*, represent Vyntyra Consultancy Services at *${college || "your campus"}*!

🎁 *Exclusive Perks for First Cohort:*
• 📦 *Official IRA Welcome Kit:* Personalized Associate ID, Custom Badge, Stationery & Swag
• 👕 *Corporate Merchandise:* Branded Hoodies, Tees, Laptop Sleeves & Bottles
• 💰 *Ambassador Rewards:* Earn up to *₹15,000* (*T&C Apply)
• ⚡ *Branded Electronic Gadgets:* Powerbanks, Wireless Earbuds, Soundbars, Smartwatches & Webcams
• ✈️ *Top 10 Travel Retreat:* All-expenses-paid curated corporate retreat with co-associates
• 📜 *Dual Certification:* Certificate of Recognition + Corporate Internship Experience Letter
• 👑 *VVIP Access:* Free VIP access to all Vyntyra Workshops, Bootcamps, Masterclasses & Sessions

📢 *Pre-Register Now for First Cohort Priority Access:*
👉 https://vyntyraconsultancyservices.in/campus-ambassador

— Vyntyra Consultancy Services Pvt. Ltd. (Great Place to Work® Certified)`;
  };

  const handleCopyWhatsApp = (name: string, college: string) => {
    const text = generateWhatsAppMessage(name, college);
    navigator.clipboard.writeText(text);
    toast.success("WhatsApp message copied to clipboard!");
  };

  const handleOpenWhatsApp = (phone: string, name: string, college: string) => {
    if (!phone) {
      toast.error("No phone number available for this intern.");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const text = encodeURIComponent(generateWhatsAppMessage(name, college));
    window.open(`https://wa.me/${formattedPhone}?text=${text}`, "_blank");
  };

  // Send single test email
  const handleSendTestEmail = async () => {
    if (!testEmail || !testEmail.includes("@")) {
      toast.error("Please provide a valid test email address.");
      return;
    }
    try {
      await sendEmailFn({
        data: {
          recipient_email: testEmail,
          recipient_name: "Test Associate",
          college_name: "Vyntyra Test Campus",
          custom_subject: subjectText,
        },
      });
      toast.success(`Test email sent to ${testEmail}!`);
    } catch (e: any) {
      toast.error(e.message || "Failed to send test email.");
    }
  };

  // Bulk Email Broadcast
  const handleBulkEmailBroadcast = async () => {
    const targets = interns.filter((i) => selectedEmails.has(i.email));
    if (targets.length === 0) {
      toast.error("Please select at least one recipient.");
      return;
    }

    setIsSending(true);
    setSentCount(0);
    setFailedCount(0);

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      try {
        await sendEmailFn({
          data: {
            recipient_email: target.email,
            recipient_name: target.name,
            college_name: target.college,
            custom_subject: subjectText,
          },
        });
        setSentCount((c) => c + 1);
      } catch (err) {
        console.warn(`Failed sending to ${target.email}:`, err);
        setFailedCount((c) => c + 1);
      }
      // 1-second delay between dispatches
      await new Promise((res) => setTimeout(res, 1000));
    }

    setIsSending(false);
    toast.success("Broadcast completed!");
    qc.invalidateQueries({ queryKey: ["admin-automated-email-logs"] });
  };

  return (
    <div className="space-y-6">
      {/* Campaign Banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-slate-950 via-amber-950/20 to-slate-900 p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs font-mono font-bold tracking-widest uppercase">
              <Sparkles className="h-3 w-3" />
              SPECIAL PROMOTIONAL CAMPAIGN
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Campus Ambassador First Cohort Launch Campaign
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Broadcast the <strong>Vyntyra Institutional Relations Associate (Campus Ambassador)</strong> First Cohort announcement via <strong>1-Click Email</strong> and <strong>1-Click WhatsApp</strong> to registered interns.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                internsQuery.refetch();
                registrationsQuery.refetch();
              }}
              className="border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white"
            >
              <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
            </Button>
            <a
              href="/campus-ambassador"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition-colors"
            >
              <span>Live Landing Page</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Quick Nav Tabs */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-4">
          <button
            onClick={() => setActiveChannel("email")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeChannel === "email"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800"
            }`}
          >
            <Mail className="h-4 w-4" /> 1-Click Email Broadcast
          </button>
          <button
            onClick={() => setActiveChannel("whatsapp")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeChannel === "whatsapp"
                ? "bg-emerald-500 text-white shadow-md"
                : "bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800"
            }`}
          >
            <MessageSquare className="h-4 w-4" /> 1-Click WhatsApp Broadcast
          </button>
          <button
            onClick={() => setActiveChannel("registrations")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeChannel === "registrations"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800"
            }`}
          >
            <Users className="h-4 w-4" /> Pre-Registered Applicants ({registrations.length})
          </button>
        </div>
      </div>

      {/* ─── EMAIL BROADCAST MODE ─── */}
      {activeChannel === "email" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Audience Selector */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Select Intern Audience</h3>
                <p className="text-xs text-slate-500">
                  {selectedEmails.size} of {filteredInterns.length} selected
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                className="text-xs border-slate-300 h-8 gap-1.5"
              >
                {selectedEmails.size === filteredInterns.length && filteredInterns.length > 0 ? (
                  <>
                    <CheckSquare className="h-3.5 w-3.5 text-amber-600" /> Deselect All
                  </>
                ) : (
                  <>
                    <Square className="h-3.5 w-3.5" /> Select All ({filteredInterns.length})
                  </>
                )}
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, email, college..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Scrollable list */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 border rounded-xl">
              {filteredInterns.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">No interns found.</div>
              ) : (
                filteredInterns.map((intern, i) => {
                  const isChecked = selectedEmails.has(intern.email);
                  return (
                    <div
                      key={i}
                      onClick={() => toggleSelectOne(intern.email)}
                      className={`p-3 flex items-center justify-between gap-3 text-xs cursor-pointer transition-colors ${
                        isChecked ? "bg-amber-50/60" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-amber-600 h-4 w-4 shrink-0 pointer-events-none"
                        />
                        <div className="truncate">
                          <div className="font-bold text-slate-900 truncate">{intern.name}</div>
                          <div className="text-[11px] text-slate-500 truncate">{intern.email}</div>
                          {intern.college && (
                            <div className="text-[10px] text-slate-400 truncate">{intern.college}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Test Email Row */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Send Test Email</label>
              <div className="flex gap-2">
                <Input
                  placeholder="admin@email.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="h-9 text-xs"
                />
                <Button
                  onClick={handleSendTestEmail}
                  size="sm"
                  variant="outline"
                  className="text-xs h-9 shrink-0 border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  <Send className="h-3.5 w-3.5 mr-1" /> Test
                </Button>
              </div>
            </div>
          </div>

          {/* Right: Email Template & Broadcast Control */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Subject Line
                </label>
                <Input
                  value={subjectText}
                  onChange={(e) => setSubjectText(e.target.value)}
                  className="text-xs h-9 font-medium"
                />
              </div>

              {/* Email Content Preview */}
              <div className="border rounded-xl p-4 bg-slate-950 text-white space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px]">
                  <span className="font-bold text-amber-400">✨ FIRST COHORT 2026-27</span>
                  <span className="text-slate-400">Official Preview</span>
                </div>
                <div className="text-sm font-bold text-white">
                  Vyntyra Institutional Relations Associate (Campus Ambassador Program)
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Hi [Candidate Name], represent Vyntyra at your institution. Unlock exclusive welcome kits, earn rewards up to ₹15,000, win branded electronic gadgets, and qualify for an all-expenses-paid curated travel retreat for Top 10.
                </p>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-300">
                  <div>🎁 Exclusive IRA Welcome Kit</div>
                  <div>👕 Corporate Branded Merchandise</div>
                  <div className="text-emerald-400">💰 Earn up to ₹15,000 Rewards*</div>
                  <div className="text-sky-400">⚡ Branded Electronic Gadgets</div>
                  <div className="text-pink-400">✈️ Top 10 Curated Travel Retreat</div>
                  <div>📜 Dual Certificate of Recognition</div>
                </div>

                <div className="pt-2 text-center">
                  <span className="inline-block px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider">
                    Pre-Register for First Cohort &rarr;
                  </span>
                </div>
              </div>
            </div>

            {/* Broadcast Action Box */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Target: {selectedEmails.size} Interns Selected
                </div>
                {isSending && (
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Progress: {sentCount} sent, {failedCount} failed
                  </div>
                )}
              </div>

              <Button
                disabled={isSending || selectedEmails.size === 0}
                onClick={handleBulkEmailBroadcast}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs px-6 h-10 rounded-xl shadow-md cursor-pointer"
              >
                {isSending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Broadcasting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="h-4 w-4" /> 1-Click Send Email Broadcast ({selectedEmails.size})
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── WHATSAPP BROADCAST MODE ─── */}
      {activeChannel === "whatsapp" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Interns List for WhatsApp */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Registered Interns & Contacts</h3>
                <p className="text-xs text-slate-500">{filteredInterns.length} interns loaded</p>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search intern name, college, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100 border rounded-xl">
              {filteredInterns.map((intern, i) => (
                <div
                  key={i}
                  className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{intern.name}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Phone className="h-3 w-3 text-emerald-600" />
                      <span>{intern.phone || "No phone recorded"}</span>
                    </div>
                    {intern.college && (
                      <div className="text-[10px] text-slate-400 truncate">{intern.college}</div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      onClick={() => handleCopyWhatsApp(intern.name, intern.college)}
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 text-[11px] border-slate-200"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      onClick={() => handleOpenWhatsApp(intern.phone, intern.name, intern.college)}
                      size="sm"
                      className="h-8 px-3 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1"
                    >
                      <MessageSquare className="h-3 w-3" /> Send
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: WhatsApp Copy Preview & Fast Copy */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-emerald-600" />
                  Pre-Formatted WhatsApp Copy (First Cohort)
                </h3>
                <Button
                  onClick={() => handleCopyWhatsApp("Candidate", "Your College")}
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 border-emerald-300 text-emerald-700 hover:bg-emerald-50 gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy Broadcast Text
                </Button>
              </div>

              {/* Chat Bubble Preview */}
              <div className="p-4 rounded-2xl bg-[#0b141a] text-[#e9edef] border border-[#202c33] font-mono text-xs whitespace-pre-line leading-relaxed shadow-inner max-h-[420px] overflow-y-auto">
                {generateWhatsAppMessage("Rahul Sharma", "Andhra University, Vizag")}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
              <span>Click <strong>Send</strong> on any intern card to directly launch WhatsApp Web with this customized text.</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── PRE-REGISTERED APPLICANTS ─── */}
      {activeChannel === "registrations" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Campus Ambassador First Cohort Applicants
              </h3>
              <p className="text-xs text-slate-500">
                Official applications received via the public portal with video pitches, white-background portraits, and 6-month agreement acceptance.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                Total Applicants: {registrations.length}
              </span>
              <Button
                onClick={() => qc.invalidateQueries({ queryKey: ["admin-ambassador-registrations"] })}
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1"
              >
                <RefreshCw className="h-3 w-3" /> Refresh
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b">
                <tr>
                  <th className="p-3">Candidate &amp; ID</th>
                  <th className="p-3">Contact &amp; Address</th>
                  <th className="p-3">Institution &amp; Location</th>
                  <th className="p-3">Education &amp; Languages</th>
                  <th className="p-3">Video Pitch (Drive)</th>
                  <th className="p-3">Agreement &amp; Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registrations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No applications submitted yet. Candidates applying on the landing page will appear here immediately.
                    </td>
                  </tr>
                ) : (
                  registrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Candidate & ID */}
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {reg.portrait_photo_url ? (
                            <img
                              src={reg.portrait_photo_url}
                              alt={reg.full_name}
                              className="w-10 h-10 rounded-full object-cover border border-slate-300 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                              {reg.full_name?.charAt(0) || "A"}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900">{reg.full_name}</div>
                            <div className="text-[10px] text-amber-600 font-mono font-bold">
                              {reg.id}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {(reg.linkedin_url || reg.linkedin_profile) && (
                                <a
                                  href={reg.linkedin_url || reg.linkedin_profile}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-sky-600 hover:underline"
                                >
                                  LinkedIn
                                </a>
                              )}
                              {reg.instagram_url && (
                                <a
                                  href={
                                    reg.instagram_url.startsWith("http")
                                      ? reg.instagram_url
                                      : `https://instagram.com/${reg.instagram_url.replace("@", "")}`
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-pink-600 hover:underline"
                                >
                                  Instagram
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact & Address */}
                      <td className="p-3">
                        <div className="text-slate-900 font-medium">{reg.email}</div>
                        <div className="text-slate-500 text-[11px] font-mono">{reg.phone}</div>
                        {reg.full_address && (
                          <div className="text-[10px] text-slate-400 mt-1 max-w-xs truncate" title={reg.full_address}>
                            🏠 {reg.full_address}
                          </div>
                        )}
                      </td>

                      {/* Institution & Location */}
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{reg.college_name}</div>
                        <div className="text-[11px] text-slate-500">
                          {reg.college_location || "Campus"}
                        </div>
                        <div className="text-[10px] text-indigo-600 font-medium">
                          {reg.district ? `${reg.district}, ${reg.state}` : reg.city_state}
                        </div>
                      </td>

                      {/* Education & Languages */}
                      <td className="p-3">
                        <div className="font-medium text-slate-800">
                          {reg.branch || reg.degree_branch}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {reg.department || "General"} · Grad: {reg.expected_graduation_year || reg.graduation_year}
                        </div>
                        {reg.languages_known && reg.languages_known.length > 0 && (
                          <div className="text-[10px] text-purple-600 mt-0.5">
                            🗣️ {Array.isArray(reg.languages_known) ? reg.languages_known.join(", ") : reg.languages_known}
                          </div>
                        )}
                      </td>

                      {/* Video Pitch Link */}
                      <td className="p-3">
                        {reg.video_pitch_url ? (
                          <a
                            href={reg.video_pitch_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 font-bold text-[11px] transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>Watch Drive Pitch</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No video provided</span>
                        )}
                      </td>

                      {/* Agreement & Status */}
                      <td className="p-3 space-y-1.5">
                        <div className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>6-Mo Agreement Signed</span>
                        </div>

                        <div>
                          <select
                            value={reg.status || "pending"}
                            onChange={(e) =>
                              handleUpdateStatus(
                                reg.id,
                                e.target.value as "pending" | "shortlisted" | "enrolled" | "rejected"
                              )
                            }
                            className={`text-[10px] font-bold uppercase rounded px-2 py-1 border cursor-pointer outline-none ${
                              reg.status === "shortlisted"
                                ? "bg-amber-100 text-amber-800 border-amber-300"
                                : reg.status === "enrolled"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : reg.status === "rejected"
                                ? "bg-rose-100 text-rose-800 border-rose-300"
                                : "bg-slate-100 text-slate-700 border-slate-300"
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="enrolled">Enrolled</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3 space-y-1">
                        <Button
                          onClick={() => handleOpenWhatsApp(reg.phone, reg.full_name, reg.college_name)}
                          size="sm"
                          className="w-full h-7 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1"
                        >
                          <MessageSquare className="h-3 w-3" /> WhatsApp
                        </Button>
                        <a
                          href={`mailto:${reg.email}?subject=${encodeURIComponent(
                            `Vyntyra Institutional Relations Associate — Application Update (${reg.id})`
                          )}`}
                          className="w-full inline-flex items-center justify-center gap-1 h-7 px-2.5 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-800 rounded border border-slate-300 font-medium"
                        >
                          <Mail className="h-3 w-3" /> Email
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
