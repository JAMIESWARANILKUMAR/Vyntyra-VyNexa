import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, Zap } from "lucide-react";
import { AdminB2bPlaybook } from "@/components/admin-b2b-playbook";

export const Route = createFileRoute("/_authenticated/admin/b2b-playbook")({
  head: () => ({ meta: [{ title: "B2B Sales & Cold Pitch Playbook — Vyntyra Super Admin" }] }),
  component: B2bPlaybookRoutePage,
});

function B2bPlaybookRoutePage() {
  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-md px-4 sm:px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors bg-muted/50 px-2.5 py-1.5 rounded-md"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Super Admin
            </Link>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-gold" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">B2B Pitch Engine</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <AdminB2bPlaybook />
      </main>
    </div>
  );
}
