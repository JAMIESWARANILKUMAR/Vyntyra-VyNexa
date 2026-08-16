import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateReferralCode, getMyReferralConversions } from "@/lib/operations.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Award, Check, Link2, Target, Send, FileText, Users } from "lucide-react";

export function EmployeeReferEarn() {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const fetchReferralCode = useServerFn(getOrCreateReferralCode);
  const fetchReferralConversions = useServerFn(getMyReferralConversions);

  const sessionQ = useQuery({ queryKey: ["session"], queryFn: async () => (await supabase.auth.getSession()).data.session });
  
  const referralCodeQ = useQuery({
    queryKey: ["my-referral-code", sessionQ.data?.user?.id],
    queryFn: () => fetchReferralCode(),
    enabled: !!sessionQ.data?.user?.id,
  });

  const referralConversionsQ = useQuery({
    queryKey: ["my-referrals", sessionQ.data?.user?.id],
    queryFn: () => fetchReferralConversions(),
    enabled: !!sessionQ.data?.user?.id,
    refetchInterval: 5000,
  });

  const referralCode = referralCodeQ.data?.referralCode || "";
  const referralConversions: any[] = referralConversionsQ.data || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 w-full max-w-7xl mx-auto">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shine {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shine {
          background: linear-gradient(120deg, #f5f3ff 30%, #e0e7ff 50%, #f5f3ff 70%);
          background-size: 200% 100%;
          animation: shine 3.5s infinite linear;
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

      <h2 className="text-2xl font-light tracking-tight text-slate-900 mb-8">Refer & Earn Program</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          
          <div className="rounded-xl border bg-white p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
            <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/10 rounded-bl-full flex items-center justify-center">
              <Award className="h-5 w-5 text-emerald-600 translate-x-2 -translate-y-2 animate-float" />
            </div>
            
            <h2 className="font-bold text-slate-800 text-base flex items-center gap-2 mb-1">
              Refer & Earn
            </h2>
            <p className="text-xs text-slate-500 mb-6 px-4">
              Vyntyra Pays For You! Share your code and earn bonuses.
            </p>
            
            {referralCodeQ.isLoading ? (
              <div className="py-6 flex items-center gap-2 text-slate-400 text-xs justify-center"><Loader2 className="h-4 w-4 animate-spin text-indigo-600" /> Generating unique code...</div>
            ) : (
              <div className="w-full space-y-4">
                <div 
                  onClick={() => {
                    navigator.clipboard.writeText(referralCode);
                    setCopiedCode(true);
                    toast.success("Referral Code copied to clipboard!");
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="relative animate-shine border-2 border-dashed border-indigo-200/80 p-5 rounded-xl font-mono text-3xl font-extrabold tracking-widest text-indigo-700 overflow-hidden flex items-center justify-center gap-2 select-all shadow-inner group hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer"
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
                  className={`w-full font-bold text-xs h-10 transition-all duration-300 flex items-center justify-center gap-2 shadow-xs ${
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

          <div className="rounded-xl border bg-white p-6 shadow-sm space-y-5 transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b pb-2.5">
              <Target className="h-4.5 w-4.5 text-indigo-600" /> Milestone Tracking
            </h3>
            
            {(() => {
              const completedCount = referralConversions.filter((r: any) => 
                r.status === 'selected' || r.status === 'hired' || r.status === 'completed'
              ).length;
              
              const nextMilestone = completedCount >= 5 ? 10 : 5;
              const progressPercent = Math.min((completedCount / nextMilestone) * 100, 100);
              
              return (
                <div className="space-y-4">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span className="font-medium">Progress to next tier:</span>
                    <span className="font-bold text-indigo-600">{completedCount} / {nextMilestone} Referrals</span>
                  </div>
                  
                  <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden relative shadow-inner">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className={`p-3.5 rounded-xl border text-center transition-all duration-300 transform hover:scale-[1.03] ${
                      completedCount >= 5 
                        ? "bg-emerald-50/70 border-emerald-200 text-emerald-950 shadow-xs" 
                        : "bg-slate-50 border-slate-200/80 text-slate-500"
                    }`}>
                      <div className="text-xs font-bold">Tier 1: 5 Referrals</div>
                      <div className="text-[10px] mt-1 font-semibold">Bonus ₹500</div>
                      {completedCount >= 5 && <div className="text-[9px] font-bold text-emerald-600 mt-1 flex items-center justify-center gap-0.5"><Check className="h-3 w-3" /> ✓ Achieved!</div>}
                    </div>
                    
                    <div className={`p-3.5 rounded-xl border text-center transition-all duration-300 transform hover:scale-[1.03] ${
                      completedCount >= 10 
                        ? "bg-emerald-50/70 border-emerald-200 text-emerald-950 shadow-xs" 
                        : "bg-slate-50 border-slate-200/80 text-slate-500"
                    }`}>
                      <div className="text-xs font-bold">Tier 2: 10 Referrals</div>
                      <div className="text-[10px] mt-1 font-semibold">Bonus ₹1500</div>
                      {completedCount >= 10 && <div className="text-[9px] font-bold text-emerald-600 mt-1 flex items-center justify-center gap-0.5"><Check className="h-3 w-3" /> ✓ Achieved!</div>}
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-normal text-center pt-1">
                    *A referral is marked as completed once their application is selected/hired.
                  </p>
                </div>
              );
            })()}
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm space-y-3.5 transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Send className="h-4 w-4 text-indigo-600" /> Share Invitation
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">Send this template message directly to friends who want to apply.</p>
            
            <div className="bg-slate-50 border p-3.5 rounded-xl text-xs font-light text-slate-600 font-mono select-all leading-normal whitespace-pre-wrap max-h-[140px] overflow-y-auto shadow-inner relative group border-slate-200/80">
              {`Hey! I'm currently working at Vyntyra Consultancy Services. Apply using my unique referral code "${referralCode}" to join: https://careers.vyntyraconsultancyservices.in/careers`}
            </div>

            <Button
              onClick={() => {
                const shareText = `Hey! I'm currently working at Vyntyra Consultancy Services. Apply using my unique referral code "${referralCode}" to join: https://careers.vyntyraconsultancyservices.in/careers`;
                navigator.clipboard.writeText(shareText);
                setCopiedInvite(true);
                toast.success("Invitation message copied to clipboard!");
                setTimeout(() => setCopiedInvite(false), 2000);
              }}
              variant="outline"
              className={`w-full text-xs font-semibold h-10 transition-all duration-300 flex items-center justify-center gap-2 border-slate-300 ${
                copiedInvite 
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800" 
                  : "bg-white text-slate-700 hover:bg-slate-50"
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

        <div className="lg:col-span-2 rounded-xl border bg-white p-6 shadow-sm flex flex-col h-full min-h-[450px] transition-all duration-300 hover:shadow-md">
          <div className="border-b pb-4 mb-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" /> Referred Candidates Tracker
              </h3>
              <p className="text-xs text-slate-500 mt-1">Track the application status and progress of friends you referred.</p>
            </div>
            {referralConversions.length > 0 && (
              <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                {referralConversions.length} Referrals Total
              </span>
            )}
          </div>

          <div className="flex-1 overflow-x-auto">
            {referralCodeQ.isLoading || referralConversionsQ.isLoading ? (
              <div className="p-8 flex flex-col items-center justify-center gap-3 text-slate-400 text-sm h-full min-h-[250px]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" /> 
                <span>Loading referral conversions...</span>
              </div>
            ) : referralConversions.length === 0 ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 text-slate-400 gap-4">
                <div className="relative flex items-center justify-center">
                  <div className="absolute h-16 w-16 bg-indigo-500/10 rounded-full animate-pulse-ring" />
                  <div className="relative h-12 w-12 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center shadow-xs">
                    <Users className="h-6 w-6 text-indigo-600 animate-float" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-slate-600">No referrals yet</p>
                  <p className="text-xs max-w-[200px] mx-auto text-slate-400">Share your code with friends. When they apply, they'll appear here.</p>
                </div>
              </div>
            ) : (
              <table className="w-full text-sm text-left whitespace-nowrap min-w-[500px]">
                <thead className="text-xs text-slate-500 bg-slate-50/80 uppercase sticky top-0 z-10 border-b">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Candidate Name</th>
                    <th className="px-4 py-3">Applied Role</th>
                    <th className="px-4 py-3">Date Applied</th>
                    <th className="px-4 py-3 rounded-tr-lg">Current Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {referralConversions.map((r: any, idx: number) => {
                    const dateObj = new Date(r.created_at);
                    const isComplete = r.status === 'selected' || r.status === 'hired' || r.status === 'completed';
                    return (
                      <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-700 flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                            {r.candidate_name ? r.candidate_name[0].toUpperCase() : "?"}
                          </div>
                          {r.candidate_name || "Unknown"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{r.role_applied || "N/A"}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {dateObj.toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                            isComplete
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                              : r.status === 'rejected'
                                ? "bg-rose-100 text-rose-700 border border-rose-200"
                                : "bg-amber-100 text-amber-700 border border-amber-200"
                          }`}>
                            {r.status || "Pending"}
                          </span>
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
