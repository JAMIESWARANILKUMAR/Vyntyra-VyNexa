import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { 
  ShieldCheck, Mail, Clock, Award, Search, Trash2, 
  AlertCircle, CheckCircle2, RefreshCw, X, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  listAutomatedEmailLogs, 
  deleteAutomatedEmailLog, 
  getEmailQuotaStats, 
  getPromotionalEmailConversionStats,
  sendPromotionalInternshipEmail 
} from "@/lib/operations.functions";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import EmailAutomationHub from "@/components/email-automation-hub";

export const Route = createFileRoute("/_authenticated/admin/email-campaigns")({
  component: EmailCampaignsPage,
});

function EmailCampaignsPage() {
  const qc = useQueryClient();
  const fetchEmailLogs = useServerFn(listAutomatedEmailLogs);
  const doDeleteAutomatedEmailLog = useServerFn(deleteAutomatedEmailLog);
  const doSendPromotionalEmail = useServerFn(sendPromotionalInternshipEmail);

  const emailLogsQ = useQuery({
    queryKey: ["admin-automated-email-logs"],
    queryFn: () => fetchEmailLogs(),
    staleTime: 0,
    refetchInterval: 5000,
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <header className="bg-white border-b sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Mail className="h-5 w-5 text-emerald-600" />
              Email Campaign Hub
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Automate and track bulk promotional emails</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto w-full max-w-7xl mx-auto">
        <EmailAutomationHub 
          emailLogsQ={emailLogsQ} 
          doSendPromotionalEmail={doSendPromotionalEmail} 
          doDeleteAutomatedEmailLog={doDeleteAutomatedEmailLog} 
          qc={qc} 
        />
      </main>
    </div>
  );
}
