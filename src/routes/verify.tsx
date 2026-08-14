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
  QrCode,
  Loader2,
  RefreshCw,
  Globe2,
  ArrowRight,
  Shield,
  FileText,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SmartAvatar } from "@/components/SmartAvatar";
import { Footer } from "@/components/footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/verify")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      id: typeof search.id === "string" ? search.id : undefined,
      ref: typeof search.ref === "string" ? search.ref : undefined,
      email: typeof search.email === "string" ? search.email : undefined,
      q: typeof search.q === "string" ? search.q : undefined,
      tab: typeof search.tab === "string" ? search.tab : undefined,
    };
  },
  component: VerifyPage,
});

function VerifyPage() {
  const searchParams = Route.useSearch() as Record<string, string | undefined>;
  const initialQuery = searchParams.id || searchParams.ref || searchParams.email || searchParams.q || "";
  const initialTab = searchParams.tab || "application";

  const [activeTab, setActiveTab] = useState(initialTab);
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
        message: err.message || "Failed to query verification database.",
      });
    } finally {
      setLoading(false);
    }
  }

  const renderResult = () => {
    if (!hasSearched || loading || !result) return null;

    if (!result.found || !result.certificate) {
      return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-card border border-destructive/30 rounded-3xl p-8 text-center space-y-4 shadow-xl">
            <div className="h-16 w-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mx-auto">
              <XCircle className="h-10 w-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-foreground">
                No Record Found
              </h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                {result.message || "We could not find any official record matching your query."}
              </p>
            </div>
            <div className="pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setHasSearched(false);
                }}
                className="border-border text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-4 w-4 mr-2" /> Try Another Search
              </Button>
            </div>
          </div>
        </div>
      );
    }

    const { certificate } = result;

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl relative">
          {/* Top Status Banner */}
          <div className="bg-secondary/10 border-b border-border p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-inner">
                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg text-emerald-600 dark:text-emerald-400">
                    AUTHENTIC &amp; VERIFIED {activeTab.toUpperCase()}
                  </span>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  Ref: {certificate.referenceId}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider">
                Status: {certificate.status}
              </span>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-surface rounded-2xl p-6 border border-border">
              {/* Photo Box */}
              <div className="flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-border pb-6 md:pb-0 md:pr-6">
                <div className="h-28 w-24 rounded-xl overflow-hidden border border-border shadow-sm bg-background flex items-center justify-center mb-3">
                  <SmartAvatar
                    src={certificate.profilePhotoUrl}
                    alt={certificate.fullName}
                    fallbackInitials={(certificate.fullName || "C")[0]}
                    className="h-full w-full rounded-none border-none"
                  />
                </div>
                <h3 className="font-bold text-foreground text-base">
                  {certificate.fullName}
                </h3>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  ID: {certificate.internId}
                </p>
              </div>

              {/* Details Grid */}
              <div className="md:col-span-2 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-background p-3 rounded-xl border border-border">
                    <span className="text-muted-foreground flex items-center gap-1.5 mb-1 font-medium">
                      <Mail className="h-3.5 w-3.5 text-blue-500" /> Candidate Email
                    </span>
                    <span className="font-semibold text-foreground truncate block">
                      {certificate.email}
                    </span>
                  </div>

                  <div className="bg-background p-3 rounded-xl border border-border">
                    <span className="text-muted-foreground flex items-center gap-1.5 mb-1 font-medium">
                      <GraduationCap className="h-3.5 w-3.5 text-indigo-500" /> Institution
                    </span>
                    <span className="font-semibold text-foreground truncate block">
                      {certificate.college}
                    </span>
                  </div>

                  <div className="bg-background p-3 rounded-xl border border-border">
                    <span className="text-muted-foreground flex items-center gap-1.5 mb-1 font-medium">
                      <Award className="h-3.5 w-3.5 text-emerald-500" /> Domain Track
                    </span>
                    <span className="font-semibold text-foreground truncate block">
                      {certificate.domain}
                    </span>
                  </div>

                  <div className="bg-background p-3 rounded-xl border border-border">
                    <span className="text-muted-foreground flex items-center gap-1.5 mb-1 font-medium">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Specialization
                    </span>
                    <span className="font-semibold text-foreground truncate block">
                      {certificate.subDomain}
                    </span>
                  </div>

                  <div className="bg-background p-3 rounded-xl border border-border">
                    <span className="text-muted-foreground flex items-center gap-1.5 mb-1 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-teal-500" /> Internship Start
                    </span>
                    <span className="font-semibold text-foreground truncate block">
                      {certificate.startDate}
                    </span>
                  </div>

                  <div className="bg-background p-3 rounded-xl border border-border">
                    <span className="text-muted-foreground flex items-center gap-1.5 mb-1 font-medium">
                      <Building2 className="h-3.5 w-3.5 text-purple-500" /> Issuer / Org
                    </span>
                    <span className="font-semibold text-foreground truncate block">
                      Vyntyra Consultancy Services
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Section */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div>UDYAM Reg: <span className="text-foreground font-mono font-semibold">{certificate.udyamReg}</span></div>
                <div>Address: <span className="text-foreground">{certificate.corporateAddress}</span></div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {activeTab === "noc" && certificate.pdfUrl && (
                  <a
                    href={certificate.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-initial"
                  >
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-sm">
                      <FileDown className="h-4 w-4" /> Download Official NOC
                    </Button>
                  </a>
                )}
                {activeTab === "certificate" && certificate.certificateUrl && (
                  <a
                    href={certificate.certificateUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-initial"
                  >
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 shadow-sm">
                      <FileDown className="h-4 w-4" /> Download Certificate
                    </Button>
                  </a>
                )}
              </div>
            </div>

            {/* Formal Statement */}
            <div className="bg-secondary/5 p-4 rounded-xl border border-border text-xs text-muted-foreground space-y-1">
              <div className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                Corporate HR Compliance Statement
              </div>
              <p className="leading-relaxed">
                This {activeTab === "noc" ? "No Objection Certificate (NOC)" : activeTab === "certificate" ? "Internship Certificate" : "Application Record"} has been officially issued by Vyntyra Consultancy Services under Project VyNexa. The candidate named above is authorized and authenticated. Verification is digitally registered and available 24/7 on this portal.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Accent Header Stripe */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-emerald-500 to-sky-500" />
      
      {/* Utility bar */}
      <div className="border-b border-border bg-primary text-primary-foreground/80 text-xs">
        <div className="mx-auto max-w-6xl px-6 h-9 flex items-center justify-between">
          <div className="hidden sm:flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5"><Globe2 className="h-3 w-3" /> IN · Global Delivery</span>
            <span className="opacity-40">|</span>
            <span className="inline-flex items-center gap-1.5"><Mail className="h-3 w-3" /> hr@vyntyraconsultancyservices.in</span>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <a href="/careers" className="hover:text-gold">Careers</a>
            <span className="opacity-40">|</span>
            <a href="/status" className="hover:text-gold">Track Application</a>
            <span className="opacity-40">|</span>
            <a href="/verify" className="hover:text-gold text-emerald-400 font-medium flex items-center gap-1"><Shield className="h-3 w-3" /> Verify Intern</a>
            <span className="opacity-40">|</span>
            <a href="/auth/admin" className="hover:text-gold">Super Admin</a>
          </div>
        </div>
      </div>

      {/* Top bar */}
      <header className="border-b border-border bg-card sticky top-0 z-40 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img src="/icon-512.png" alt="Vyntyra Consultancy Services" className="h-11 w-auto" />
          </a>
          <nav className="hidden md:flex items-center gap-1 text-sm">
            <a href="/" className="px-3 py-2 text-muted-foreground hover:text-primary hover:bg-surface rounded-sm">About</a>
            <a href="/careers" className="px-3 py-2 text-muted-foreground hover:text-primary hover:bg-surface rounded-sm">Careers</a>
            <a href="/status" className="px-3 py-2 text-muted-foreground hover:text-primary hover:bg-surface rounded-sm">Track Status</a>
            <a href="/verify" className="px-3 py-2 text-primary font-medium rounded-sm bg-surface flex items-center gap-1"><Shield className="h-4 w-4"/> Verify</a>
            <div className="w-px h-5 bg-border mx-2" />
            <a href="/careers" className="inline-flex items-center gap-1.5 bg-primary hover:bg-secondary text-primary-foreground px-4 py-2 rounded-sm text-sm font-medium transition-colors">
              Apply Now <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12">
        <div className="text-center space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="h-3.5 w-3.5" /> Official Credential Checker
          </div>

          <h1 className="text-3xl sm:text-4xl font-semibold text-primary tracking-tight">
            Verification Portal
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
            Scan the QR code on your document or enter the candidate's Registration Reference ID or Email address to instantly verify authenticity against Vyntyra's central database.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setHasSearched(false); setQuery(""); }} className="w-full mb-10">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-surface p-1 rounded-xl h-14">
            <TabsTrigger value="application" className="rounded-lg py-2.5 h-full data-[state=active]:bg-background data-[state=active]:shadow-sm">Verify Application</TabsTrigger>
            <TabsTrigger value="certificate" className="rounded-lg py-2.5 h-full data-[state=active]:bg-background data-[state=active]:shadow-sm">Verify Certificate</TabsTrigger>
            <TabsTrigger value="noc" className="rounded-lg py-2.5 h-full data-[state=active]:bg-background data-[state=active]:shadow-sm">Verify NOC</TabsTrigger>
          </TabsList>

          <TabsContent value="application" className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch();
                }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter Application ID or Email address..."
                    className="pl-12 pr-4 h-12 bg-background border-border focus:border-primary rounded-xl"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="h-12 px-8 bg-primary hover:bg-secondary text-primary-foreground font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Briefcase className="h-4 w-4" />}
                  Verify Application
                </Button>
              </form>
            </div>
            {renderResult()}
          </TabsContent>

          <TabsContent value="certificate" className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch();
                }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter Certificate ID or Email address..."
                    className="pl-12 pr-4 h-12 bg-background border-border focus:border-primary rounded-xl"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="h-12 px-8 bg-primary hover:bg-secondary text-primary-foreground font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
                  Verify Certificate
                </Button>
              </form>
            </div>
            {renderResult()}
          </TabsContent>

          <TabsContent value="noc" className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch();
                }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter NOC Registration ID or Email address..."
                    className="pl-12 pr-4 h-12 bg-background border-border focus:border-primary rounded-xl"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="h-12 px-8 bg-primary hover:bg-secondary text-primary-foreground font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  Verify NOC
                </Button>
              </form>
            </div>
            {renderResult()}
          </TabsContent>
        </Tabs>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <QrCode className="h-3.5 w-3.5 text-muted-foreground/80" /> Direct QR Scan Supported
          </span>
          <span>·</span>
          <span>Registration ID e.g. NOC/VYN/2026/...</span>
          <span>·</span>
          <span>Candidate Email</span>
        </div>
      </main>

      <Footer />
    </div>
  );
}
