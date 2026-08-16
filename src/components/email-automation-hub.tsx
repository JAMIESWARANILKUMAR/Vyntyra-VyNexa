import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  ShieldCheck, Mail, Clock, Award, Search, Trash2, 
  AlertCircle, CheckCircle, RefreshCw, X, Send,
  CheckCircle2, FileText, UploadCloud, Download, Users,
  Play, Pause, Square, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { getEmailQuotaStats, getPromotionalEmailConversionStats } from "@/lib/operations.functions";

function EmailAutomationHub({ emailLogsQ, doSendPromotionalEmail, doDeleteAutomatedEmailLog, qc }: any) {
  const [inputText, setInputText] = useState("");
  const [subjectText, setSubjectText] = useState("Invitation: 2026 Official Internship Program â€” Vyntyra Consultancy Services");
  const [recipients, setRecipients] = useState<{ email: string; name: string; university: string; domain: string; subDomain: string }[]>([]);

  // Email Quota & Service Health Query
  const quotaQ = useQuery({
    queryKey: ["email-quota-stats"],
    queryFn: () => getEmailQuotaStats(),
    staleTime: 0,
    refetchInterval: 3000,
  });

  const quota = quotaQ.data || {
    totalSentThisMonth: 0,
    resendSentThisMonth: 0,
    resendSentToday: 0,
    resendAvailable: 3000,
    resendAvailableMonth: 3000,
    resendAvailableToday: 100,
    resendQuotaMonth: 3000,
    resendQuotaDay: 100,
    brevoSentThisMonth: 0,
    brevoAvailable: 9000,
    brevoQuota: 9000,
    hasResendKey: true,
    hasBrevoKey: true,
  };
  
  // Campaign automation state
  const [isAutomating, setIsAutomating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [activeStatus, setActiveStatus] = useState("Idle");

  // Log table filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Download Sample CSV Audience Template
  function downloadCsvTemplate() {
    const csvContent = `Email Address, Candidate Name, University / Organization, Domain, Sub-Domain\njamianil37@gmail.com, Jami Eswar Anil Kumar, Andhra University, Engineering & Technology, Full Stack Development\npriya.sharma@iitm.ac.in, Priya Sharma, IIT Madras, Engineering & Technology, DevOps & Cloud Architecture\nrahul.verma@bits.ac.in, Rahul Verma, BITS Pilani, Growth & Strategy, B2B Sales & Financial Modeling\n`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Vyntyra_Internship_Email_Audience_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Downloaded CSV Audience Template with Domain & Sub-Domain!");
  }

  // Parse text or files into recipients
  function handleParse(text: string) {
    const extracted = extractEmails(text);
    setRecipients(extracted);
    if (extracted.length > 0) {
      toast.success(`Extracted ${extracted.length} recipient records with details!`);
    } else {
      toast.error("No valid email addresses found in the input.");
    }
  }

  function extractEmails(raw: string) {
    const lines = raw.split(/[\r\n]+/);
    const list: { email: string; name: string; university: string; domain: string; subDomain: string }[] = [];
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      const emailMatch = line.match(emailRegex);
      if (emailMatch) {
        const email = emailMatch[0].toLowerCase().trim();

        // Split line by comma, tab, or pipe to parse: Email, Name, University, Domain, Sub-Domain
        const parts = line.split(/[,;\t|]+/).map((p) => p.replace(/[<>"']/g, "").trim());
        let name = "";
        let university = "";
        let domain = "";
        let subDomain = "";

        const emailIdx = parts.findIndex((p) => p.toLowerCase().includes(email));
        if (emailIdx !== -1) {
          const otherParts = parts.filter((_, idx) => idx !== emailIdx && _ !== "");
          if (otherParts.length >= 1) name = otherParts[0];
          if (otherParts.length >= 2) university = otherParts[1];
          if (otherParts.length >= 3) domain = otherParts[2];
          if (otherParts.length >= 4) subDomain = otherParts[3];
        }

        if (!name) {
          name = email.split("@")[0];
        }

        list.push({ email, name, university, domain, subDomain });
      }
    }
    return list;
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        setInputText(content);
        handleParse(content);
      }
    };
    reader.readAsText(file);
  }

  // Automation Runner
  useEffect(() => {
    let timer: any;
    if (isAutomating && !isPaused && currentIndex < recipients.length) {
      const currentItem = recipients[currentIndex];
      setActiveStatus(`Sending to ${currentItem.email}...`);

      doSendPromotionalEmail({
        data: {
          recipient_email: currentItem.email,
          recipient_name: currentItem.name,
          university_name: currentItem.university,
          domain: currentItem.domain,
          sub_domain: currentItem.subDomain,
          custom_subject: subjectText,
        }
      })
      .then(() => {
        setSentCount((prev) => prev + 1);
        qc.invalidateQueries({ queryKey: ["admin-email-logs"] });
        qc.invalidateQueries({ queryKey: ["promotional-email-conversion-stats"] });
        qc.invalidateQueries({ queryKey: ["email-quota-stats"] });
      })
      .catch((err: any) => {
        setFailedCount((prev) => prev + 1);
        toast.error(`Failed sending to ${currentItem.email}: ${err.message}`);
      })
      .finally(() => {
        // 2-second rate limit countdown
        setCountdown(2);
        let secondsLeft = 2;
        const countdownInterval = setInterval(() => {
          secondsLeft -= 1;
          setCountdown(secondsLeft);
          if (secondsLeft <= 0) {
            clearInterval(countdownInterval);
            setCurrentIndex((prev) => prev + 1);
          }
        }, 1000);
      });
    } else if (isAutomating && currentIndex >= recipients.length && recipients.length > 0) {
      setIsAutomating(false);
      setActiveStatus("Campaign Completed");
      toast.success(`Bulk Email Campaign finished! Sent: ${sentCount}, Failed: ${failedCount}`);
    }
    return () => clearTimeout(timer);
  }, [isAutomating, isPaused, currentIndex]);

  function startAutomation() {
    if (recipients.length === 0) {
      toast.error("Please add or upload recipient email addresses first!");
      return;
    }
    setIsAutomating(true);
    setIsPaused(false);
    setActiveStatus("Starting campaign...");
    toast.info("Started Automated Email Campaign (2s delay per email)");
  }

  function pauseAutomation() {
    setIsPaused(true);
    setActiveStatus("Paused");
    toast.info("Campaign paused.");
  }

  function resumeAutomation() {
    setIsPaused(false);
    toast.info("Campaign resumed.");
  }

  function stopAutomation() {
    setIsAutomating(false);
    setIsPaused(false);
    setCurrentIndex(0);
    setSentCount(0);
    setFailedCount(0);
    setCountdown(0);
    setActiveStatus("Stopped");
    toast.warning("Campaign stopped.");
  }

  // Filter logs
  const rawLogs: any[] = emailLogsQ.data || [];
  const filteredLogs = rawLogs.filter((log: any) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = (log.recipient_email || "").toLowerCase().includes(searchLower) ||
                          (log.recipient_name || "").toLowerCase().includes(searchLower) ||
                          (log.university_name || "").toLowerCase().includes(searchLower) ||
                          (log.subject || "").toLowerCase().includes(searchLower);
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Promotional Email Conversion & Registration Analytics Query
  const conversionQ = useQuery({
    queryKey: ["promotional-email-conversion-stats"],
    queryFn: () => getPromotionalEmailConversionStats(),
    staleTime: 0,
    refetchInterval: 3000,
  });

  const conv = conversionQ.data || {
    totalSent: 0,
    totalMatched: 0,
    totalPending: 0,
    conversionRate: 0,
    logs: [],
    domainCounts: [],
    allApplicationsCount: 0,
  };

  const pieData = [
    { name: "Registered (Matched)", value: conv.totalMatched, color: "#10B981" },
    { name: "Pending Registration", value: conv.totalPending, color: "#F59E0B" },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mt-8">
      {/* Banner */}
      <div className="bg-slate-900 text-white px-6 py-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" /> Resend High-Deliverability Inbox Engine
          </div>
          <h2 className="text-xl font-bold mt-1 text-white flex items-center gap-2">
            <Mail className="h-5 w-5 text-emerald-400" /> Automated Email Campaign Hub
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Automate bulk promotional internship invitations to up to <strong>1,000 email addresses</strong> with a mandatory <strong>2-second delay per email</strong> to ensure inbox delivery, prevent spam folder flagging, and align with SPF/DKIM verification standards.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60 text-xs">
          <Clock className="h-4 w-4 text-emerald-400 shrink-0" />
          <div>
            <div className="text-slate-300 font-medium">Auto Rate Limit</div>
            <div className="text-emerald-400 font-bold">2s Interval Delay</div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Graphical Representation of Promotional Emails & Internship Registrations */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-600" />
                Promotional Email Conversion &amp; Internship Registration Analytics
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time tracking of sent promotional email recipients vs actual registered internship applications.
              </p>
            </div>
            <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold px-3 py-1 rounded-full">
              Conversion Rate: {conv.conversionRate}%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
              <div className="text-xs font-semibold text-slate-500 uppercase">Promotional Emails Sent</div>
              <div className="text-2xl font-black text-slate-900">{conv.totalSent}</div>
              <div className="text-[11px] text-slate-400">Total email dispatches</div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 shadow-xs space-y-1">
              <div className="text-xs font-semibold text-emerald-800 uppercase flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Registered (Matched)
              </div>
              <div className="text-2xl font-black text-emerald-950">{conv.totalMatched}</div>
              <div className="text-[11px] text-emerald-700 font-medium">Applied for Internship</div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 shadow-xs space-y-1">
              <div className="text-xs font-semibold text-amber-800 uppercase flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-amber-600" /> Pending Registration
              </div>
              <div className="text-2xl font-black text-amber-950">{conv.totalPending}</div>
              <div className="text-[11px] text-amber-700 font-medium">Email Sent / Not Registered</div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 shadow-xs space-y-1">
              <div className="text-xs font-semibold text-indigo-800 uppercase">Total Portal Applications</div>
              <div className="text-2xl font-black text-indigo-950">{conv.allApplicationsCount}</div>
              <div className="text-[11px] text-indigo-700 font-medium">Across All Channels</div>
            </div>
          </div>

          {/* Graphical Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            {/* Donut Chart: Matched vs Pending */}
            <div className="lg:col-span-5 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Conversion Breakdown (Matched vs Pending)
              </div>
              <div className="h-48 w-full flex items-center justify-center">
                {conv.totalSent > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`${value} Recipients`, 'Count']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-slate-400 italic">No promotional emails dispatched yet to render chart.</div>
                )}
              </div>
              <div className="flex justify-center gap-4 text-xs mt-1">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
                  <span className="h-3 w-3 rounded-full bg-emerald-500" /> Matched ({conv.totalMatched})
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-amber-700">
                  <span className="h-3 w-3 rounded-full bg-amber-500" /> Pending ({conv.totalPending})
                </div>
              </div>
            </div>

            {/* Bar Chart: Domain Distribution */}
            <div className="lg:col-span-7 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Internship Registrations by Selected Domain
              </div>
              <div className="h-48 w-full">
                {conv.domainCounts.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={conv.domainCounts}>
                      <XAxis dataKey="domain" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="matched" name="Matched / Registered" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pending" name="Pending Registration" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                    Domain distribution will display as promotional emails are sent.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Safety Email Service Quota & Load Balancer Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Resend Quota */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Resend Primary Service</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                100 / day &middot; 3k / mo
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-black text-slate-900">{(quota.resendAvailableMonth ?? quota.resendAvailable ?? 3000).toLocaleString()}</div>
              <div className="text-xs text-slate-500 font-medium">Available Month</div>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full transition-all" 
                style={{ width: `${Math.min(100, ((quota.resendSentThisMonth || 0) / 3000) * 100)}%` }} 
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
              <span>Today: <strong>{quota.resendSentToday || 0} / 100 max</strong></span>
              <span className="text-emerald-700 font-semibold font-mono">
                {(quota.resendSentToday || 0) >= 100 ? "âš ï¸ Auto-Brevo" : quota.hasResendKey ? "âœ“ API Active" : "âš ï¸ Key Missing"}
              </span>
            </div>
          </div>

          {/* Card 2: Brevo Secondary Quota */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Brevo Secondary Service</span>
              <span className="bg-sky-100 text-sky-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                9,000 / mo Quota
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-black text-slate-900">{quota.brevoAvailable.toLocaleString()}</div>
              <div className="text-xs text-slate-500 font-medium">Available Emails</div>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-sky-500 h-full transition-all" 
                style={{ width: `${Math.min(100, (quota.brevoSentThisMonth / quota.brevoQuota) * 100)}%` }} 
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
              <span>Sent: <strong>{quota.brevoSentThisMonth.toLocaleString()}</strong></span>
              <span className="text-sky-700 font-semibold">{quota.hasBrevoKey ? "âœ“ API Active" : "âš ï¸ BREVO_API_KEY Optional"}</span>
            </div>
          </div>

          {/* Card 3: Total Load Balancer Safety */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">Total Safety Capacity</span>
              <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                Equal Load Balancer
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-black text-emerald-950">{quota.totalSentThisMonth.toLocaleString()}</div>
              <div className="text-xs text-emerald-800 font-medium">Total Sent This Month</div>
            </div>
            <div className="text-[11px] text-emerald-800 leading-snug pt-1">
              Emails are automatically balanced equally between Resend &amp; Brevo to ensure 100% inbox delivery and zero quota exhaustion.
            </div>
          </div>
        </div>

        {/* Recipient Extraction Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-emerald-600" /> Upload Excel / CSV or Paste Email, Name, University
              </label>
              <span className="text-xs text-slate-400 font-mono">Up to 1,000 Emails</span>
            </div>

            <Textarea 
              rows={5}
              value={inputText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setInputText(e.target.value);
                handleParse(e.target.value);
              }}
              placeholder={`Paste format: Email Address, Candidate Name, University / Organization\ne.g.\njamianil37@gmail.com, Jami Eswar Anil Kumar, Andhra University\npriya.sharma@iitm.ac.in, Priya Sharma, IIT Madras`}
              className="font-mono text-xs p-3 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer inline-flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-xs">
                  <UploadCloud className="h-4 w-4 text-emerald-600" /> Upload Excel / CSV
                  <input type="file" accept=".csv,.xlsx,.xls,.txt" onChange={handleFileUpload} className="hidden" />
                </label>

                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={downloadCsvTemplate}
                  className="text-xs gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  <Download className="h-3.5 w-3.5" /> Download CSV Template
                </Button>

                <Button variant="ghost" size="sm" onClick={() => handleParse(inputText)} className="text-xs text-slate-600 hover:text-slate-900">
                  Re-Parse Input
                </Button>
              </div>

              <div className="text-xs font-semibold text-slate-700 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Extracted Audience: <strong className="text-emerald-900 font-bold">{recipients.length} Recipients</strong>
              </div>
            </div>
          </div>

          {/* Campaign Subject & Template Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
                Campaign Subject Line
              </label>
              <Input 
                value={subjectText} 
                onChange={(e) => setSubjectText(e.target.value)} 
                placeholder="Exclusive Internship Opportunity 2026..."
                className="text-xs rounded-xl border-slate-200"
              />
            </div>

            {/* Template Specs */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2.5 text-xs text-slate-700">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5 text-sm">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Verified High-Inbox Template Features:
              </div>
              <ul className="space-y-1.5 text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <strong>Format:</strong> Email, Name, University, Domain, Sub-Domain
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <strong>Apply CTA:</strong> "Apply For Internship" button linking to Careers portal
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <strong>Official Contact:</strong> internships@vyntyraconsultancyservices.in
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <strong>Anti-Spam Standards:</strong> Clean HTML-to-text ratio & DKIM signed header
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Live Automation Controls & Progress Engine */}
        <div className="rounded-2xl border border-slate-200 bg-slate-900 text-white p-6 space-y-4 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase font-bold tracking-widest text-emerald-400">Live Campaign Controller</div>
              <div className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                Status: <span className="text-emerald-400">{activeStatus}</span>
                {isAutomating && !isPaused && <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!isAutomating ? (
                <Button 
                  onClick={startAutomation} 
                  disabled={recipients.length === 0}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg transition-all gap-2 text-xs"
                >
                  <Play className="h-4 w-4 fill-slate-950" /> Start 2s Delay Campaign ({recipients.length})
                </Button>
              ) : isPaused ? (
                <Button 
                  onClick={resumeAutomation} 
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs gap-2"
                >
                  <Play className="h-4 w-4 fill-slate-950" /> Resume Campaign
                </Button>
              ) : (
                <Button 
                  onClick={pauseAutomation} 
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs gap-2"
                >
                  <Pause className="h-4 w-4 fill-slate-950" /> Pause Campaign
                </Button>
              )}

              {isAutomating && (
                <Button 
                  onClick={stopAutomation} 
                  variant="outline" 
                  className="border-rose-500 text-rose-400 hover:bg-rose-950/40 text-xs px-4 py-2.5 rounded-xl gap-1.5"
                >
                  <Square className="h-3.5 w-3.5 fill-rose-400" /> Stop Campaign
                </Button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
              <span>
                Progress: <strong>{currentIndex}</strong> / {recipients.length} ({recipients.length > 0 ? Math.round((currentIndex / recipients.length) * 100) : 0}%)
              </span>
              {isAutomating && countdown > 0 && (
                <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 animate-spin" /> Next email in {countdown}s
                </span>
              )}
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
              <div 
                className="bg-emerald-500 h-full transition-all duration-500 ease-out" 
                style={{ width: `${recipients.length > 0 ? (currentIndex / recipients.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Campaign Metrics */}
          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-800 text-center text-xs">
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-800">
              <div className="text-slate-400">Total Queued</div>
              <div className="text-base font-bold text-white mt-0.5">{recipients.length}</div>
            </div>
            <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-900/50">
              <div className="text-emerald-400">Successfully Sent</div>
              <div className="text-base font-bold text-emerald-400 mt-0.5">{sentCount}</div>
            </div>
            <div className="bg-rose-950/40 p-3 rounded-xl border border-rose-900/50">
              <div className="text-rose-400">Failed / Errors</div>
              <div className="text-base font-bold text-rose-400 mt-0.5">{failedCount}</div>
            </div>
          </div>
        </div>

        {/* â”€â”€ Sent Emails Log Management Table â”€â”€ */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden space-y-4">
          <div className="p-5 border-b bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Mail className="h-4 w-4 text-emerald-600" /> Sent Emails Log Management
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Track all sent promotional email dispatches with recipient email, name, university/organization, sent date, sent time, email ID, and delivery status.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search email, name, university..."
                  className="pl-8 text-xs h-8 w-56 rounded-lg border-slate-200"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-xs w-32 rounded-lg border-slate-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={() => emailLogsQ.refetch()} className="h-8 text-xs gap-1.5">
                <RefreshCw className={`h-3.5 w-3.5 ${emailLogsQ.isFetching ? "animate-spin" : ""}`} /> Refresh Log
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100/70 text-slate-700 uppercase tracking-wider font-semibold border-b text-[10px]">
                <tr>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Recipient Email</th>
                  <th className="px-5 py-3">Recipient Name</th>
                  <th className="px-5 py-3">University / Organization</th>
                  <th className="px-5 py-3">Domain</th>
                  <th className="px-5 py-3">Sub-Domain</th>
                  <th className="px-5 py-3">Provider</th>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3">Sent Date</th>
                  <th className="px-5 py-3">Sent Time</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Internship Registration</th>
                  <th className="px-5 py-3">Email / Message ID</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {emailLogsQ.isLoading ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-600" /> Loading sent email logs...
                      </div>
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-400">
                      No sent email logs found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log: any) => {
                    const dateObj = new Date(log.sent_at || log.created_at);
                    const sentDate = dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
                    const sentTime = dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

                    const isMatched = log.applicant_status && log.applicant_status !== "Not Applied";

                    const isSelectionEmail = String(log.id).startsWith("sel_");
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5">
                          {isSelectionEmail ? (
                            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap">Selection</span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap">Promotional</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-900">{log.recipient_email}</td>
                        <td className="px-5 py-3.5 text-slate-600">{log.recipient_name || "—"}</td>
                        <td className="px-5 py-3.5 text-slate-600">{log.university_name || "—"}</td>
                        <td className="px-5 py-3.5 text-slate-600 font-medium">{log.domain || "—"}</td>
                        <td className="px-5 py-3.5 text-emerald-700 font-bold">{log.sub_domain || "—"}</td>
                        <td className="px-5 py-3.5">
                          {log.provider === "brevo" ? (
                            <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              Brevo
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              Resend
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-slate-700 max-w-xs truncate" title={log.subject}>{log.subject}</td>
                        <td className="px-5 py-3.5 text-slate-600 font-mono">{sentDate}</td>
                        <td className="px-5 py-3.5 text-slate-600 font-mono">{sentTime}</td>
                        <td className="px-5 py-3.5">
                          {log.status === "sent" ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Sent
                            </span>
                          ) : log.status === "pending" ? (
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" /> Pending
                            </span>
                          ) : (
                            <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> Failed
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {isMatched ? (
                            <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-extrabold px-2.5 py-1 rounded-full inline-flex items-center gap-1 shadow-xs uppercase">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" /> REGISTERED ({log.applicant_status})
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">PENDING</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 font-mono text-[10px] truncate max-w-[120px]" title={log.id}>
                          {log.id}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button variant="ghost" size="sm" className="h-7 text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                            Resend
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EmailAutomationHub;
