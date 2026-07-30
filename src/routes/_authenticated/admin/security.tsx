import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Shield, KeyRound, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/security")({
  head: () => ({ meta: [{ title: "Security Settings — Vyntyra Super Admin" }] }),
  component: AdminSecurityPage,
});

function AdminSecurityPage() {
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // MFA / 2FA States
  const [mfaStatus, setMfaStatus] = useState<"checking" | "enrolled" | "unenrolled" | "enrolling">("checking");
  const [mfaQrCode, setMfaQrCode] = useState<string | null>(null);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");

  useEffect(() => {
    checkMfa();
  }, []);

  async function checkMfa() {
    try {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error) throw error;
      if (data && (data.currentLevel === 'aal2' || data.nextLevel === 'aal2')) {
        setMfaStatus('enrolled');
      } else {
        const { data: factors, error: factorsErr } = await supabase.auth.mfa.listFactors();
        if (factorsErr) throw factorsErr;
        const verified = factors?.totp?.find((f: any) => f.status === 'verified');
        if (verified) {
          setMfaStatus('enrolled');
        } else {
          setMfaStatus('unenrolled');
        }
      }
    } catch (err) {
      console.error(err);
      setMfaStatus('unenrolled');
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error("Passwords do not match");
    }
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
      if (error) throw error;
      toast.success("Password updated successfully");
      setPasswordForm({ newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleEnrollMfa() {
    setMfaStatus("enrolling");
    try {
      // Clean up previous unverified factors first
      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (factors && factors.all) {
        const unverified = factors.all.filter((f: any) => f.status === 'unverified');
        for (const f of unverified) {
          await supabase.auth.mfa.unenroll({ factorId: f.id });
        }
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "Vyntyra Careers",
        friendlyName: "Super Admin",
      });

      if (error || !data) throw error || new Error("MFA Enroll failed");
      setMfaFactorId(data.id);
      setMfaQrCode(data.totp.uri);
    } catch (err: any) {
      toast.error(err.message || "Failed to enroll MFA");
      setMfaStatus("unenrolled");
    }
  }

  async function handleVerifyMfa(e: React.FormEvent) {
    e.preventDefault();
    if (!mfaFactorId || !mfaCode) return;
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
      if (challenge.error) throw challenge.error;
      const verify = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.data.id,
        code: mfaCode
      });
      if (verify.error) throw verify.error;

      setMfaStatus("enrolled");
      setMfaQrCode(null);
      setMfaCode("");
      toast.success("2FA enabled successfully using Authenticator app!");
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
    }
  }

  async function handleDisableMfa() {
    if (!window.confirm("Are you sure you want to disable 2FA? This will make your account less secure.")) return;
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (factors && factors.all) {
        for (const f of factors.all) {
          await supabase.auth.mfa.unenroll({ factorId: f.id });
        }
      }
      toast.success("2FA has been disabled");
      setMfaStatus("unenrolled");
    } catch (err: any) {
      toast.error(err.message || "Failed to disable 2FA");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <header className="border-b border-border bg-white sticky top-0 z-40">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground mr-2 bg-transparent hover:bg-slate-50">
              <Link to="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back to Admin
              </Link>
            </Button>
            <div>
              <div className="text-lg font-bold text-primary leading-none">Security Settings</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
                Super Admin Account Protection
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Change Password Card */}
          <div className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-slate-900/5 text-slate-950">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Change Password</h3>
                  <p className="text-xs text-slate-500 font-light">Update your Super Admin login credentials.</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-600">New Password</Label>
                  <Input 
                    type="password" 
                    required 
                    minLength={6} 
                    value={passwordForm.newPassword} 
                    onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} 
                    className="bg-slate-50 border-slate-100 rounded-xl focus:border-gold focus:ring-1 focus:ring-gold" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-600">Confirm New Password</Label>
                  <Input 
                    type="password" 
                    required 
                    minLength={6} 
                    value={passwordForm.confirmPassword} 
                    onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} 
                    className="bg-slate-50 border-slate-100 rounded-xl focus:border-gold focus:ring-1 focus:ring-gold" 
                  />
                </div>
                <Button type="submit" disabled={isChangingPassword} className="w-full bg-slate-950 hover:bg-slate-900 text-white rounded-xl h-11 border-0">
                  {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Update Password
                </Button>
              </form>
            </div>
          </div>

          {/* MFA / 2FA Card */}
          <div className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-gold/10 text-gold">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Two-Factor Authentication (2FA)</h3>
                  <p className="text-xs text-slate-500 font-light">Secure your Super Admin account using Google/Microsoft Authenticator.</p>
                </div>
              </div>

              <div className="mt-6">
                {mfaStatus === "checking" ? (
                  <div className="text-sm text-slate-500 flex items-center gap-2 py-6 justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-gold" /> Checking security status...
                  </div>
                ) : mfaStatus === "enrolled" ? (
                  <div className="space-y-6">
                    <div className="bg-emerald-50 text-emerald-700 p-6 rounded-2xl border border-emerald-100 flex flex-col gap-2">
                      <div className="font-semibold flex items-center gap-2 text-base">
                        <CheckCircle2 className="h-5 w-5" /> 2FA is currently Active
                      </div>
                      <p className="text-xs font-light">Your Super Admin login is highly secured with a TOTP authenticator app verification check.</p>
                    </div>
                    <Button 
                      onClick={handleDisableMfa} 
                      variant="outline" 
                      className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-11 font-semibold text-xs tracking-wider uppercase bg-transparent"
                    >
                      REMOVE 2FA
                    </Button>
                  </div>
                ) : mfaStatus === "enrolling" && mfaQrCode ? (
                  <div className="space-y-6 flex flex-col items-center">
                    <div className="bg-white p-3 rounded-2xl shadow-xl border border-slate-100">
                      <QRCodeSVG value={mfaQrCode} size={150} />
                    </div>
                    <p className="text-xs text-slate-500 text-center leading-relaxed">
                      Scan the QR code with your mobile authenticator app, then verify the code below.
                    </p>
                    <form onSubmit={handleVerifyMfa} className="w-full space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-600">6-Digit Verification Code</Label>
                        <Input 
                          required 
                          type="text" 
                          placeholder="e.g. 123456" 
                          value={mfaCode} 
                          onChange={e => setMfaCode(e.target.value)} 
                          className="bg-slate-50 border-slate-100 rounded-xl text-center tracking-widest text-lg font-mono focus:border-gold focus:ring-1 focus:ring-gold" 
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button 
                          type="button" 
                          onClick={() => setMfaStatus("unenrolled")}
                          variant="outline" 
                          className="flex-1 border-slate-200 text-slate-500 rounded-xl h-11 bg-transparent"
                        >
                          Back
                        </Button>
                        <Button 
                          type="submit" 
                          className="flex-1 bg-gold hover:bg-gold/90 text-primary font-bold rounded-xl h-11 border-0"
                        >
                          Verify & Enable
                        </Button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl text-xs text-slate-500 leading-relaxed space-y-2">
                      <div className="font-semibold text-slate-800">Security benefits:</div>
                      <div>1. Protects dashboard access against password leaks.</div>
                      <div>2. Adds a secondary cryptographic layer.</div>
                      <div>3. Fully compatible with Google and Microsoft Authenticator.</div>
                    </div>
                    <Button 
                      onClick={handleEnrollMfa} 
                      className="w-full bg-gold hover:bg-gold/90 text-primary font-bold rounded-xl h-11 border-0 shadow-[0_0_15px_rgba(212,175,55,0.15)]"
                    >
                      ADD 2FA
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
