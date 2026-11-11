import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { 
  Mail, ArrowLeft, Sparkles, MessageSquare
} from "lucide-react";
import { 
  listAutomatedEmailLogs, 
  deleteAutomatedEmailLog, 
  sendPromotionalInternshipEmail 
} from "@/lib/operations.functions";
import EmailAutomationHub from "@/components/email-automation-hub";
import { AdminAmbassadorCampaign } from "@/components/admin-ambassador-campaign";

export const Route = createFileRoute("/_authenticated/admin/email-campaigns")({
  component: EmailCampaignsPage,
});

export function EmailCampaignsPage({ embedded = false }: { embedded?: boolean }) {
  const qc = useQueryClient();
  const fetchEmailLogs = useServerFn(listAutomatedEmailLogs);
  const doDeleteAutomatedEmailLog = useServerFn(deleteAutomatedEmailLog);
  const doSendPromotionalEmail = useServerFn(sendPromotionalInternshipEmail);

  const [activeTab, setActiveTab] = useState<"ambassador" | "standard">("ambassador");

  const emailLogsQ = useQuery({
    queryKey: ["admin-automated-email-logs"],
    queryFn: () => fetchEmailLogs(),
    staleTime: 0,
    refetchInterval: 5000,
  });

  return (
    <div className={embedded ? "w-full" : "min-h-screen bg-[#f8fafc] flex flex-col"}>
      {!embedded && (
        <header className="bg-white border-b sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin/operations" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Mail className="h-5 w-5 text-slate-800" />
                Campaign & Outreach Hub
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Automate and track bulk promotional emails & WhatsApp outreach</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab("ambassador")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "ambassador"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" /> First Cohort Ambassador
            </button>
            <button
              onClick={() => setActiveTab("standard")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "standard"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Mail className="h-3.5 w-3.5" /> General Internship Engine
            </button>
          </div>
        </header>
      )}

      {embedded && (
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Mail className="h-5 w-5 text-slate-800" />
              Campaign & Outreach Hub
            </h2>
            <p className="text-xs text-slate-500">Automate and track bulk promotional emails & WhatsApp outreach</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab("ambassador")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "ambassador"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" /> First Cohort Ambassador
            </button>
            <button
              onClick={() => setActiveTab("standard")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "standard"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Mail className="h-3.5 w-3.5" /> General Internship Engine
            </button>
          </div>
        </div>
      )}

      <main className={embedded ? "w-full" : "flex-1 p-6 overflow-y-auto w-full max-w-7xl mx-auto"}>
        {activeTab === "ambassador" ? (
          <AdminAmbassadorCampaign />
        ) : (
          <EmailAutomationHub 
            emailLogsQ={emailLogsQ} 
            doSendPromotionalEmail={doSendPromotionalEmail} 
            doDeleteAutomatedEmailLog={doDeleteAutomatedEmailLog} 
            qc={qc} 
          />
        )}
      </main>
    </div>
  );
}
