import React, { useState, useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { 
  Menu, X, Shield, ArrowRight, Globe2, Mail, Sparkles, Briefcase, GraduationCap, Lock 
} from "lucide-react";
import { InstallPwaButton } from "./install-pwa-button";

interface HeaderProps {
  live?: boolean;
}

export function Header({ live = true }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  // Track active route
  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  const handleApplyClick = (e: React.MouseEvent) => {
    if (pathname === "/careers") {
      e.preventDefault();
      setMenuOpen(false);
      const el = document.getElementById("form");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.location.hash = "form";
      }
    }
  };

  return (
    <>
      {/* Top Accent Header Stripe */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-emerald-500 to-sky-500 shrink-0" />
      
      {/* Utility Bar */}
      <div className="border-b border-border bg-primary text-primary-foreground/80 text-[11px] sm:text-xs shrink-0">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 h-8 sm:h-9 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <span className="inline-flex items-center gap-1 sm:gap-1.5 shrink-0">
              <Globe2 className="h-3 w-3 shrink-0" /> IN · Global
            </span>
            <span className="opacity-40 hidden xs:inline sm:inline">|</span>
            <a href="mailto:hr@vyntyraconsultancyservices.in" className="inline-flex items-center gap-1 sm:gap-1.5 truncate hover:text-gold min-w-0">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">hr@vyntyraconsultancyservices.in</span>
            </a>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 ml-auto shrink-0">
            <a href="https://vyntyraconsultancyservices.in" target="_blank" rel="noreferrer" className="hover:text-gold hidden sm:inline">
              Vyntyra.in
            </a>
            <span className="opacity-40 hidden sm:inline">|</span>
            <Link to="/status" className="hover:text-gold">
              Track
            </Link>
            <span className="opacity-40">|</span>
            <Link to="/verify" className="hover:text-gold text-emerald-400 font-medium flex items-center gap-1">
              <Shield className="h-3 w-3" /> Verify Intern
            </Link>
            <span className="opacity-40">|</span>
            <Link to="/auth/admin" className="hover:text-gold">
              Super Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Main Top Bar */}
      <header className="border-b border-border bg-card sticky top-0 z-40 backdrop-blur shrink-0">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 min-w-0 shrink">
            <img src="/icon-512.png" alt="Vyntyra Consultancy Services" className="h-8 sm:h-11 w-auto shrink-0" />
          </Link>
          
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {live ? (
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-sm border border-destructive/30 bg-destructive/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-destructive">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive"></span>
                </span>
                Live · Accepting Applications
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-sm border border-border bg-surface px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/60" />
                Applications Paused
              </span>
            )}
            
            <InstallPwaButton />
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 text-sm">
              <Link 
                to="/" 
                className={`px-3 py-2 rounded-sm transition-colors ${
                  isActive("/") 
                    ? "text-primary font-medium bg-surface" 
                    : "text-muted-foreground hover:text-primary hover:bg-surface"
                }`}
              >
                About
              </Link>
              <Link 
                to="/careers" 
                className={`px-3 py-2 rounded-sm transition-colors ${
                  isActive("/careers") 
                    ? "text-primary font-medium bg-surface" 
                    : "text-muted-foreground hover:text-primary hover:bg-surface"
                }`}
              >
                Careers
              </Link>
              <Link 
                to="/status" 
                className={`px-3 py-2 rounded-sm transition-colors ${
                  isActive("/status") 
                    ? "text-primary font-medium bg-surface" 
                    : "text-muted-foreground hover:text-primary hover:bg-surface"
                }`}
              >
                Track Status
              </Link>
              <Link 
                to="/verify" 
                className={`px-3 py-2 rounded-sm transition-colors flex items-center gap-1 ${
                  isActive("/verify") 
                    ? "text-emerald-600 dark:text-emerald-400 font-medium bg-surface" 
                    : "text-emerald-600 dark:text-emerald-400 hover:bg-surface"
                }`}
              >
                <Shield className="h-4 w-4" /> Verify
              </Link>
              
              <div className="flex items-center gap-2 ml-2">
                <Link to="/auth/employee" className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors">
                  Employee
                </Link>
                <Link to="/auth/intern" className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors">
                  Intern
                </Link>
              </div>
              
              <div className="w-px h-5 bg-border mx-2" />
              
              <Link 
                to="/careers" 
                hash="form"
                onClick={handleApplyClick}
                className="group relative inline-flex items-center gap-1.5 bg-primary hover:bg-secondary text-primary-foreground px-4 py-2 rounded-sm text-sm font-medium transition-colors overflow-hidden"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out" />
                Apply Now
                <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </nav>

            {/* Mobile Actions: Apply Now button + Hamburger Trigger */}
            <Link
              to="/careers"
              hash="form"
              onClick={handleApplyClick}
              className="group relative md:hidden inline-flex items-center gap-1 bg-primary hover:bg-secondary text-primary-foreground px-3 py-1.5 rounded-sm text-xs font-medium overflow-hidden max-w-[62vw]"
            >
              Apply Now
              <ArrowRight className="h-3 w-3 shrink-0" />
            </Link>
            
            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-sm border border-border text-primary hover:bg-surface transition-colors"
            >
              <span className="relative h-5 w-5">
                <Menu className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${menuOpen ? "rotate-90 opacity-0 scale-75" : "rotate-0 opacity-100 scale-100"}`} />
                <X className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${menuOpen ? "rotate-0 opacity-100 scale-100" : "-rotate-90 opacity-0 scale-75"}`} />
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            menuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="border-t border-border bg-card">
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-3 flex flex-col text-sm">
              {live ? (
                <span className="sm:hidden inline-flex items-center gap-1.5 self-start rounded-sm border border-destructive/30 bg-destructive/10 px-2 py-1 mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-destructive">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive"></span>
                  </span>
                  Live · Accepting Applications
                </span>
              ) : (
                <span className="sm:hidden inline-flex items-center gap-1.5 self-start rounded-sm border border-border bg-surface px-2 py-1 mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/60" />
                  Applications Paused
                </span>
              )}
              
              <Link 
                to="/" 
                onClick={() => setMenuOpen(false)} 
                className={`px-2 py-2.5 border-b border-border hover:bg-surface rounded-sm transition-colors ${
                  isActive("/") ? "text-primary font-semibold" : "text-muted-foreground"
                }`}
              >
                About
              </Link>
              <Link 
                to="/careers" 
                onClick={() => setMenuOpen(false)} 
                className={`px-2 py-2.5 border-b border-border hover:bg-surface rounded-sm transition-colors ${
                  isActive("/careers") ? "text-primary font-semibold" : "text-muted-foreground"
                }`}
              >
                Careers
              </Link>
              <Link 
                to="/status" 
                onClick={() => setMenuOpen(false)} 
                className={`px-2 py-2.5 border-b border-border hover:bg-surface rounded-sm transition-colors ${
                  isActive("/status") ? "text-primary font-semibold" : "text-muted-foreground"
                }`}
              >
                Track Status
              </Link>
              <Link 
                to="/verify" 
                onClick={() => setMenuOpen(false)} 
                className={`px-2 py-2.5 border-b border-border hover:bg-surface rounded-sm transition-colors flex items-center gap-1.5 ${
                  isActive("/verify") ? "text-emerald-500 font-semibold" : "text-emerald-500/80"
                }`}
              >
                <Shield className="h-4 w-4" /> Verify Credentials
              </Link>
              
              <div className="flex flex-col gap-2 pt-4 px-2">
                <Link 
                  to="/auth/employee" 
                  onClick={() => setMenuOpen(false)} 
                  className="px-3 py-2 text-sm text-center font-medium text-slate-500 hover:text-slate-900 transition-colors border border-border/80 hover:bg-slate-50 rounded-sm flex items-center justify-center gap-1.5"
                >
                  <Briefcase className="h-4 w-4" /> Employee Portal
                </Link>
                <Link 
                  to="/auth/intern" 
                  onClick={() => setMenuOpen(false)} 
                  className="px-3 py-2 text-sm text-center font-medium text-slate-500 hover:text-slate-900 transition-colors border border-border/80 hover:bg-slate-50 rounded-sm flex items-center justify-center gap-1.5"
                >
                  <GraduationCap className="h-4 w-4" /> Intern Portal
                </Link>
                <Link 
                  to="/auth/admin" 
                  onClick={() => setMenuOpen(false)} 
                  className="px-3 py-2 text-sm text-center font-medium text-gold/80 hover:text-gold transition-colors border border-gold/20 hover:bg-gold/5 rounded-sm flex items-center justify-center gap-1.5"
                >
                  <Lock className="h-4 w-4" /> Super Admin Control
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
