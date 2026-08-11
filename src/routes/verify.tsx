import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { verifyNocCertificate } from "@/lib/noc.functions";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  FileDown,
  Building2,
  Mail,
  GraduationCap,
  Calendar,
  Award,
  Sparkles,
  ExternalLink,
  QrCode,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/verify")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      id: typeof search.id === "string" ? search.id : undefined,
      ref: typeof search.ref === "string" ? search.ref : undefined,
      email: typeof search.email === "string" ? search.email : undefined,
      q: typeof search.q === "string" ? search.q : undefined,
    };
  },
  component: VerifyNocPage,
});

function VerifyNocPage() {
  const searchParams = Route.useSearch() as Record<string, string | undefined>;
  const initialQuery = searchParams.id || searchParams.ref || searchParams.email || searchParams.q || "";

  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const doVerify = useServerFn(verifyNocCertificate);

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  async function handleSearch(searchTerm?: string) {
    const q = (searchTerm !== undefined ? searchTerm : query).trim();
    if (!q) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await doVerify({ data: { query: q } });
      setResult(res);
    } catch (err: any) {
      setResult({
        found: false,
        message: err.message || "Failed to query NOC verification database.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Gold & Navy Accent Header Stripe */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-emerald-500 to-sky-500" />

      {/* Main Header Container */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 group">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/10 group-hover:border-emerald-400 transition-colors">
              <img
                src="https://careers.vyntyraconsultancyservices.in/icon-512.png"
                alt="Vyntyra Logo"
                className="h-7 w-7 object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <div className="font-extrabold text-lg text-white tracking-tight flex items-center gap-2">
                VYNTYRA CONSULTANCY SERVICES
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  VERIFIED
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Official NOC &amp; Selection Verification Portal · Project VyNexa
              </p>
            </div>
          </a>

          <div className="hidden md:flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Award className="h-4 w-4 text-amber-400" /> ISO 9001:2015 Certified
            </span>
            <span className="h-3 w-px bg-slate-800" />
            <span className="text-emerald-400 font-mono">UDYAM-AP-10-0143100</span>
          </div>
        </div>
      </header>

      {/* Hero Section & Search Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" /> Official Certificate Credential Checker
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Verify No Objection Certificate (NOC)
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            Scan the QR code on your certificate or enter the candidate's Registration Reference ID or Email address to instantly verify authenticity against Vyntyra's central database.
          </p>
        </div>

        {/* Search Input Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl mb-10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter Registration ID (e.g. NOC/VYN/2026/1A2B3C4D) or Email address..."
                className="pl-12 pr-4 h-13 bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-500 rounded-xl focus:border-emerald-500 focus:ring-emerald-500/20 text-sm"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !query.trim()}
              className="h-13 px-8 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-5 w-5" /> Verify Certificate
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <QrCode className="h-3.5 w-3.5 text-slate-400" /> Direct QR Scan Supported
            </span>
            <span>·</span>
            <span>Registration ID e.g. NOC/VYN/2026/...</span>
            <span>·</span>
            <span>Candidate Email</span>
          </div>
        </div>

        {/* Verification Result Display */}
        {hasSearched && !loading && result && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            {result.found && result.certificate ? (
              <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl overflow-hidden shadow-2xl relative">
                {/* Top Glowing Status Banner */}
                <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border-b border-emerald-500/20 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
                      <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-lg text-emerald-300">
                          AUTHENTIC &amp; VERIFIED CERTIFICATE
                        </span>
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                      </div>
                      <p className="text-xs text-emerald-400/80 font-mono mt-0.5">
                        Ref: {result.certificate.referenceId}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
                      Status: {result.certificate.status}
                    </span>
                  </div>
                </div>

                {/* Candidate Information Body */}
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-slate-950/60 rounded-2xl p-6 border border-slate-800/80">
                    {/* Photo Box */}
                    <div className="flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-slate-800 pb-6 md:pb-0 md:pr-6">
                      <div className="h-28 w-24 rounded-xl overflow-hidden border-2 border-emerald-500/40 shadow-md bg-slate-900 flex items-center justify-center mb-3">
                        {result.certificate.profilePhotoUrl ? (
                          <img
                            src={result.certificate.profilePhotoUrl}
                            alt={result.certificate.fullName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="text-slate-600 text-xs font-bold">CANDIDATE</div>
                        )}
                      </div>
                      <h3 className="font-bold text-white text-base">
                        {result.certificate.fullName}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        ID: {result.certificate.internId}
                      </p>
                    </div>

                    {/* Details Grid */}
                    <div className="md:col-span-2 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                          <span className="text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
                            <Mail className="h-3.5 w-3.5 text-sky-400" /> Candidate Email
                          </span>
                          <span className="font-semibold text-white truncate block">
                            {result.certificate.email}
                          </span>
                        </div>

                        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                          <span className="text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
                            <GraduationCap className="h-3.5 w-3.5 text-indigo-400" /> Institution
                          </span>
                          <span className="font-semibold text-white truncate block">
                            {result.certificate.college}
                          </span>
                        </div>

                        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                          <span className="text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
                            <Award className="h-3.5 w-3.5 text-emerald-400" /> Domain Track
                          </span>
                          <span className="font-semibold text-white truncate block">
                            {result.certificate.domain}
                          </span>
                        </div>

                        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                          <span className="text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
                            <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Specialization
                          </span>
                          <span className="font-semibold text-white truncate block">
                            {result.certificate.subDomain}
                          </span>
                        </div>

                        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                          <span className="text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
                            <Calendar className="h-3.5 w-3.5 text-teal-400" /> Internship Start
                          </span>
                          <span className="font-semibold text-white truncate block">
                            {result.certificate.startDate}
                          </span>
                        </div>

                        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                          <span className="text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
                            <Building2 className="h-3.5 w-3.5 text-purple-400" /> Issuer / Org
                          </span>
                          <span className="font-semibold text-white truncate block">
                            Vyntyra Consultancy Services
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Section & PDF Download */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
                    <div className="text-xs text-slate-400 space-y-0.5">
                      <div>UDYAM Reg: <span className="text-slate-200 font-mono font-semibold">{result.certificate.udyamReg}</span></div>
                      <div>Address: <span className="text-slate-200">{result.certificate.corporateAddress}</span></div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      {result.certificate.pdfUrl && (
                        <a
                          href={result.certificate.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 sm:flex-initial"
                        >
                          <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2 shadow-lg shadow-emerald-600/20">
                            <FileDown className="h-4 w-4" /> Download Official NOC (PDF)
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Formal Certification Statement */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/60 text-xs text-slate-400 space-y-1">
                    <div className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                      Corporate HR Compliance Statement
                    </div>
                    <p className="leading-relaxed">
                      This No Objection Certificate (NOC) has been officially issued by Vyntyra Consultancy Services under Project VyNexa. The candidate named above is authorized to participate in the designated industrial internship program. Authenticity is digitally registered and verifiable 24/7 on this portal.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
                <div className="h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
                  <XCircle className="h-10 w-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">
                    No Record Found
                  </h3>
                  <p className="text-slate-400 text-sm max-w-md mx-auto">
                    {result.message || "We could not find an official NOC or internship selection record matching your query."}
                  </p>
                </div>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQuery("");
                      setHasSearched(false);
                    }}
                    className="border-slate-700 text-slate-300 hover:text-white"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" /> Try Another Search
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-8 mt-12 text-center text-xs text-slate-500 space-y-2">
        <div>Vyntyra Consultancy Services · Dwaraka Nagar, Visakhapatnam - 530016, AP, India</div>
        <div>UDYAM: UDYAM-AP-10-0143100 · ISO 9001:2015 Certified</div>
        <div className="text-slate-600">&copy; {new Date().getFullYear()} Vyntyra Consultancy Services. All rights reserved.</div>
      </footer>
    </div>
  );
}
