import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateReferralCode, getMyReferralConversions } from "@/lib/operations.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Loader2, Award, Check, Link2, Send, FileText, Users, 
  Coins, ShieldCheck, Sparkles
} from "lucide-react";

export function EmployeeReferEarn() {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const fetchReferralCode = useServerFn(getOrCreateReferralCode);
  const fetchReferralConversions = useServerFn(getMyReferralConversions);

  const sessionQ = useQuery({ queryKey: ["session"], queryFn: async () => (await supabase.auth.getSession()).data.session });
  
  const referralCodeQ = useQuery({
    queryKey: ["my-referral-code", sessionQ.data?.user?.id || "current"],
    queryFn: () => fetchReferralCode(),
  });

  const referralConversionsQ = useQuery({
    queryKey: ["my-referrals", sessionQ.data?.user?.id || "current"],
    queryFn: () => fetchReferralConversions(),
    refetchInterval: 5000,
  });

  const referralData: any = referralConversionsQ.data || {};
  const referralCode = referralData.referralCode || referralCodeQ.data?.referralCode || "";
  const candidates: any[] = referralData.candidates || (Array.isArray(referralData) ? referralData : []);

  const totalReferred = referralData.totalReferred ?? candidates.length;
  const paidCount = referralData.paidCount ?? candidates.filter((c: any) => c.is_paid).length;
  const grossRevenue = referralData.grossRevenue ?? (paidCount * (referralData.candidateExamFee || 499));
  const gatewayCost = referralData.gatewayCost ?? Math.round(grossRevenue * (25.78 / 998) * 100) / 100;
  const gatewayCostReferrerShare = referralData.gatewayCostReferrerShare ?? Math.round((gatewayCost / 2) * 100) / 100;
  const gatewayCostCompanyShare = referralData.gatewayCostCompanyShare ?? Math.round((gatewayCost - gatewayCostReferrerShare) * 100) / 100;
  const govtCertAllocation = referralData.govtCertAllocation ?? (paidCount * 199);
  const commissionRate = referralData.commissionRate || 200;
  const grossCommission = referralData.grossCommission ?? (paidCount * commissionRate);
  const netCommissionEarnings = referralData.netCommissionEarnings ?? Math.max(0, Math.round((grossCommission - gatewayCostReferrerShare) * 100) / 100);
  const netCompanyProfit = referralData.netCompanyProfit ?? Math.round((grossRevenue - grossCommission - govtCertAllocation - gatewayCostCompanyShare) * 100) / 100;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 w-full max-w-7xl mx-auto text-slate-100">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes darkShine {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-dark-shine {
          background: linear-gradient(120deg, #131B2E 30%, #1e293b 50%, #131B2E 70%);
          background-size: 200% 100%;
          animation: darkShine 3.5s infinite linear;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.08); opacity: 0.4; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }
        .animate-pulse-ring {
          animation: pulse-ring 2.5s ease-in-out infinite;
        }
      `}} />

      {/* Header Banner */}
      <div className="bg-[#0E131F]/90 rounded-3xl border border-slate-800/80 p-6 shadow-xl backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2.5">
            <Coins className="h-6 w-6 text-amber-400" /> Referral &amp; Commission Earnings Hub
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Share your unique invite code, track candidate enrollments, and withdraw real-time commission earnings.
          </p>
        </div>

        {referralCode && (
          <div className="flex items-center gap-2 bg-indigo-950/80 border border-indigo-500/30 px-4 py-2 rounded-2xl shadow-lg">
            <span className="text-xs font-bold text-indigo-300">Your Code:</span>
            <span className="font-mono font-black text-sm text-white bg-indigo-600/50 border border-indigo-400/40 px-2.5 py-0.5 rounded-lg shadow-inner">
              {referralCode}
            </span>
          </div>
        )}
      </div>

      {/* ─── Partner Earnings & Fee Breakdown Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl border border-slate-800/80 bg-[#0E131F]/90 shadow-xl backdrop-blur-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Referred</span>
            <Users className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalReferred}</div>
          <span className="text-[10px] text-slate-500 font-medium">Registered Applicants</span>
        </div>

        <div className="p-5 rounded-3xl border border-slate-800/80 bg-[#0E131F]/90 shadow-xl backdrop-blur-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Paid &amp; Verified</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{paidCount}</div>
          <span className="text-[10px] text-slate-500 font-medium">Successfully Enrolled</span>
        </div>

        <div className="p-5 rounded-3xl border border-purple-500/40 bg-purple-950/30 shadow-xl backdrop-blur-xl space-y-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-12 w-12 bg-purple-500/10 rounded-bl-full" />
          <div className="flex items-center justify-between text-purple-300 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider">Your Net Earnings</span>
            <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-purple-200">₹{Number(netCommissionEarnings).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <span className="text-[10px] text-purple-400/80 font-semibold">₹{grossCommission} gross − ₹{gatewayCostReferrerShare} (50% PG share)</span>
        </div>
      </div>

      {/* Transparent Fee & Allocation Note */}
      <div className="p-5 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/60 border border-indigo-500/30 rounded-3xl text-xs flex items-start gap-3.5 shadow-xl backdrop-blur-xl">
        <Sparkles className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-slate-300 leading-relaxed">
          <div className="font-extrabold text-white">50/50 Equal Gateway &amp; Tax Sharing Policy:</div>
          <div className="text-slate-400 text-xs">
            Payment gateway processing charges, settlement fees, and applicable taxes are <strong className="text-indigo-300">divided equally (50% / 50%)</strong> between the Referrer's Commission and Company Income across all transactions. ₹199 per paid candidate is dedicated to Government Certification reserves.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          
          {/* Referral Code Card */}
          <div className="rounded-3xl border border-slate-800/80 bg-[#0E131F]/90 p-6 shadow-xl backdrop-blur-xl flex flex-col items-center text-center relative overflow-hidden transition-all duration-300 hover:border-slate-700">
            <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/10 rounded-bl-full flex items-center justify-center">
              <Award className="h-5 w-5 text-emerald-400 translate-x-2 -translate-y-2 animate-float" />
            </div>
            
            <h2 className="font-extrabold text-white text-base flex items-center gap-2 mb-1">
              Your Referral Code
            </h2>
            <p className="text-xs text-slate-400 mb-6 px-4">
              Share your code with friends and colleagues to earn ₹200 per paid enrollment.
            </p>
            
            {referralCodeQ.isLoading ? (
              <div className="py-6 flex items-center gap-2 text-slate-400 text-xs justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-400" /> Generating unique code...
              </div>
            ) : (
              <div className="w-full space-y-4">
                <div 
                  onClick={() => {
                    navigator.clipboard.writeText(referralCode);
                    setCopiedCode(true);
                    toast.success("Referral Code copied to clipboard!");
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="relative animate-dark-shine border-2 border-dashed border-indigo-500/40 p-5 rounded-2xl font-mono text-3xl font-black tracking-widest text-indigo-300 overflow-hidden flex items-center justify-center gap-2 select-all shadow-inner group hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer"
                >
                  {referralCode}
                  <span className="absolute bottom-1 right-2 text-[9px] font-sans font-medium text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">Click to copy</span>
                </div>
                
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(referralCode);
                    setCopiedCode(true);
                    toast.success("Referral Code copied!");
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className={`w-full font-bold text-xs h-10 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                    copiedCode 
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
                >
                  {copiedCode ? (
                    <>
                      <Check className="h-4 w-4 animate-bounce" /> Copied!
                    </>
                  ) : (
                    <>
                      <Link2 className="h-4 w-4" /> Copy Referral Code
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Invitation Message Card */}
          <div className="rounded-3xl border border-slate-800/80 bg-[#0E131F]/90 p-6 shadow-xl backdrop-blur-xl space-y-3.5 transition-all duration-300 hover:border-slate-700">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
              <Send className="h-4 w-4 text-indigo-400" /> Share Invitation Message
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">Send this invite directly to candidates wishing to apply.</p>
            
            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl text-xs font-light text-slate-300 font-mono select-all leading-relaxed whitespace-pre-wrap max-h-[140px] overflow-y-auto shadow-inner">
              {`Hey! Apply for the industrial internship at Vyntyra Consultancy Services using my referral code "${referralCode}" to get scholarship benefits: https://careers.vyntyraconsultancyservices.in/careers`}
            </div>

            <Button
              onClick={() => {
                const shareText = `Hey! Apply for the industrial internship at Vyntyra Consultancy Services using my referral code "${referralCode}" to get scholarship benefits: https://careers.vyntyraconsultancyservices.in/careers`;
                navigator.clipboard.writeText(shareText);
                setCopiedInvite(true);
                toast.success("Invitation message copied to clipboard!");
                setTimeout(() => setCopiedInvite(false), 2000);
              }}
              variant="outline"
              className={`w-full text-xs font-bold h-10 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 border-slate-700 cursor-pointer ${
                copiedInvite 
                  ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-300" 
                  : "bg-[#131B2E] text-slate-200 hover:text-white hover:bg-slate-800"
              }`}
            >
              {copiedInvite ? (
                <>
                  <Check className="h-4 w-4 animate-bounce" /> Message Copied!
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" /> Copy Invite Message
                </>
              )}
            </Button>
          </div>

        </div>

        {/* Referred Candidates Table */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-800/80 bg-[#0E131F]/90 p-6 shadow-xl backdrop-blur-xl flex flex-col h-full min-h-[450px]">
          <div className="border-b border-slate-800 pb-4 mb-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-400" /> Referred Candidates &amp; Financial Breakdown
              </h3>
              <p className="text-xs text-slate-400 mt-1">Real-time status, payments, and individual commission calculation per referral.</p>
            </div>
            {candidates.length > 0 && (
              <span className="bg-purple-950/80 border border-purple-500/30 text-purple-300 text-xs font-bold px-3 py-1 rounded-full">
                {paidCount} Paid / {candidates.length} Total
              </span>
            )}
          </div>

          <div className="flex-1 overflow-x-auto">
            {referralCodeQ.isLoading || referralConversionsQ.isLoading ? (
              <div className="p-8 flex flex-col items-center justify-center gap-3 text-slate-400 text-sm h-full min-h-[250px]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" /> 
                <span>Loading referral conversions...</span>
              </div>
            ) : candidates.length === 0 ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 text-slate-400 gap-4">
                <div className="relative flex items-center justify-center">
                  <div className="absolute h-16 w-16 bg-indigo-500/10 rounded-full animate-pulse-ring" />
                  <div className="relative h-12 w-12 bg-indigo-950/80 border border-indigo-500/30 rounded-full flex items-center justify-center shadow-lg">
                    <Users className="h-6 w-6 text-indigo-400 animate-float" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-200">No referrals yet</p>
                  <p className="text-xs max-w-[220px] mx-auto text-slate-400">Share your code with friends. When they apply, they'll appear here automatically.</p>
                </div>
              </div>
            ) : (
              <table className="w-full text-xs text-left whitespace-nowrap min-w-[600px]">
                <thead className="text-[11px] text-slate-400 bg-slate-950/80 uppercase sticky top-0 z-10 border-b border-slate-800 font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-xl">Candidate</th>
                    <th className="px-4 py-3">Applied Role</th>
                    <th className="px-4 py-3">Date Applied</th>
                    <th className="px-4 py-3">Payment Status</th>
                    <th className="px-4 py-3 text-right rounded-tr-xl">Your Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {candidates.map((r: any, idx: number) => {
                    const dateObj = new Date(r.created_at);
                    const isPaid = r.is_paid;
                    const commission = r.earned_commission || (isPaid ? 200 : 0);
                    return (
                      <tr key={r.id || idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-medium text-white flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 flex items-center justify-center text-xs font-bold shrink-0">
                            {r.candidate_name ? r.candidate_name[0].toUpperCase() : "?"}
                          </div>
                          <div>
                            <div className="font-bold text-white">{r.candidate_name || "Unknown Candidate"}</div>
                            {r.email && <div className="text-[10px] text-slate-400">{r.email}</div>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{r.role_applied || "N/A"}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {dateObj.toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full uppercase tracking-wider ${
                            isPaid
                              ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/30"
                              : "bg-amber-950/80 text-amber-300 border border-amber-500/30"
                          }`}>
                            {isPaid ? "Paid & Verified" : "Pending Payment"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-extrabold">
                          {isPaid ? (
                            <div>
                              <span className="text-purple-300 font-bold bg-purple-950/80 border border-purple-500/30 px-2.5 py-1 rounded-xl shadow-xs">
                                +₹{Number(r.net_earnings !== undefined ? r.net_earnings : Math.max(0, commission - Math.round(((r.gateway_fee || 12.89) / 2) * 100) / 100)).toFixed(2)}
                              </span>
                              <div className="text-[9px] text-slate-500 font-normal mt-1">
                                ₹{commission} gross − ₹{Number(r.gateway_fee_share ?? Math.round(((r.gateway_fee || 12.89) / 2) * 100) / 100).toFixed(2)} (50% PG &amp; Tax)
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500 font-normal">₹0 (Pending)</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
