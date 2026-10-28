import React, { useState, useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { 
  Menu, X, Shield, ArrowRight, Globe2, Mail, Briefcase, GraduationCap, Lock 
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

  // Auto-close menu when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleApplyClick = () => {
    setMenuOpen(false);
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
            <Link to="/verify" search={{ id: undefined, ref: undefined, email: undefined, q: undefined, tab: undefined }} className="hover:text-gold text-emerald-400 font-medium flex items-center gap-1">
              <Shield className="h-3 w-3" /> Verify Intern
            </Link>
            <span className="opacity-40 hidden sm:inline">|</span>
            <Link to="/auth/admin" className="hover:text-gold hidden sm:inline">
              Super Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Main Top Bar */}
      <header className="border-b border-border bg-card sticky top-0 z-40 backdrop-blur shrink-0">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3 min-w-0 shrink">
            <img src="/icon-512.png" alt="Vyntyra Consultancy Services" className="h-8 sm:h-11 w-auto shrink-0 object-contain" />
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
            
            {/* Desktop Navigation Links (Visible on desktop >= lg) */}
            <nav className="hidden lg:flex items-center gap-1 text-sm">
              <Link 
                to="/" 
                className={`px-3 py-2 rounded-sm transition-colors ${
                  pathname === "/" 
                    ? "text-primary font-medium bg-surface" 
                    : "text-muted-foreground hover:text-primary hover:bg-surface"
                }`}
              >
                Home
              </Link>
              <Link 
                to="/about" 
                className={`px-3 py-2 rounded-sm transition-colors ${
                  pathname === "/about" 
                    ? "text-primary font-medium bg-surface" 
                    : "text-muted-foreground hover:text-primary hover:bg-surface"
                }`}
              >
                About Us
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
                search={{ id: undefined, ref: undefined, email: undefined, q: undefined, tab: undefined }}
                className={`px-3 py-2 rounded-sm transition-colors flex items-center gap-1 ${
                  isActive("/verify") 
                    ? "text-emerald-600 dark:text-emerald-400 font-medium bg-surface" 
                    : "text-emerald-600 dark:text-emerald-400 hover:bg-surface"
                }`}
              >
                <Shield className="h-4 w-4" /> Verify
              </Link>
              
              <div className="flex items-center gap-2 ml-1">
                <Link to="/auth/employee" className="px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors">
                  Employee
                </Link>
                <Link to="/auth/intern" className="px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors">
                  Intern
                </Link>
              </div>
              
              <div className="w-px h-5 bg-border mx-1" />
            </nav>

            {/* Permanent Action Area: Apply Now (Visible on ALL screens) + Mobile Hamburger Button */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Apply Now Button - ALWAYS VISIBLE ON EVERY SCREEN */}
              <Link 
                to="/apply"
                onClick={handleApplyClick}
                className="group relative inline-flex items-center gap-1.5 bg-primary hover:bg-secondary text-primary-foreground px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-sm text-xs sm:text-sm font-semibold tracking-wide transition-all duration-200 shadow-sm whitespace-nowrap overflow-hidden shrink-0"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out" />
                <span>Apply Now</span>
                <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
              </Link>

              {/* Hamburger Toggle button - right beside Apply button on mobile & tablet */}
              <button
                type="button"
                aria-label={menuOpen ? "Close menu" : "Open navigation menu"}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                className="lg:hidden inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-sm border border-border bg-card text-primary hover:bg-surface hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shrink-0 shadow-xs"
              >
                <span className="relative h-5 w-5 flex items-center justify-center">
                  <Menu className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${menuOpen ? "rotate-90 opacity-0 scale-75" : "rotate-0 opacity-100 scale-100"}`} />
                  <X className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${menuOpen ? "rotate-0 opacity-100 scale-100" : "-rotate-90 opacity-0 scale-75"}`} />
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            menuOpen ? "max-h-[600px] opacity-100 border-b border-border shadow-lg" : "max-h-0 opacity-0 pointer-events-none"
          }`}
        >
          <div className="border-t border-border bg-card/98 backdrop-blur-md">
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-3.5 flex flex-col gap-1 text-sm">
              {live ? (
                <div className="flex items-center justify-between pb-2 mb-1 border-b border-border/50">
                  <span className="inline-flex items-center gap-1.5 rounded-sm border border-destructive/30 bg-destructive/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-destructive">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive"></span>
                    </span>
                    Live · Accepting Applications
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium">VCS Corporate</span>
                </div>
              ) : null}
              
              <Link 
                to="/" 
                onClick={() => setMenuOpen(false)} 
                className={`px-3 py-2.5 rounded-sm transition-colors flex items-center justify-between ${
                  pathname === "/" ? "text-primary font-semibold bg-surface" : "text-muted-foreground hover:text-primary hover:bg-surface"
                }`}
              >
                <span>Home</span>
                {pathname === "/" && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
              </Link>
              <Link 
                to="/about" 
                onClick={() => setMenuOpen(false)} 
                className={`px-3 py-2.5 rounded-sm transition-colors flex items-center justify-between ${
                  pathname === "/about" ? "text-primary font-semibold bg-surface" : "text-muted-foreground hover:text-primary hover:bg-surface"
                }`}
              >
                <span>About Us</span>
                {pathname === "/about" && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
              </Link>
              <Link 
                to="/careers" 
                onClick={() => setMenuOpen(false)} 
                className={`px-3 py-2.5 rounded-sm transition-colors flex items-center justify-between ${
                  isActive("/careers") ? "text-primary font-semibold bg-surface" : "text-muted-foreground hover:text-primary hover:bg-surface"
                }`}
              >
                <span>Careers</span>
                {isActive("/careers") && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
              </Link>
              <Link 
                to="/status" 
                onClick={() => setMenuOpen(false)} 
                className={`px-3 py-2.5 rounded-sm transition-colors flex items-center justify-between ${
                  isActive("/status") ? "text-primary font-semibold bg-surface" : "text-muted-foreground hover:text-primary hover:bg-surface"
                }`}
              >
                <span>Track Application Status</span>
                {isActive("/status") && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
              </Link>
              <Link 
                to="/verify" 
                search={{ id: undefined, ref: undefined, email: undefined, q: undefined, tab: undefined }}
                onClick={() => setMenuOpen(false)} 
                className={`px-3 py-2.5 rounded-sm transition-colors flex items-center justify-between ${
                  isActive("/verify") ? "text-emerald-500 font-semibold bg-emerald-500/10" : "text-emerald-600 dark:text-emerald-400 hover:bg-surface"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Verify Intern Credentials
                </span>
                {isActive("/verify") && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
              </Link>
              
              <div className="grid grid-cols-2 gap-2 pt-3 mt-1 border-t border-border">
                <Link 
                  to="/auth/employee" 
                  onClick={() => setMenuOpen(false)} 
                  className="px-3 py-2 text-xs text-center font-medium text-slate-700 dark:text-slate-300 hover:text-primary transition-colors border border-border hover:bg-surface rounded-sm flex items-center justify-center gap-1.5"
                >
                  <Briefcase className="h-3.5 w-3.5" /> Employee Portal
                </Link>
                <Link 
                  to="/auth/intern" 
                  onClick={() => setMenuOpen(false)} 
                  className="px-3 py-2 text-xs text-center font-medium text-slate-700 dark:text-slate-300 hover:text-primary transition-colors border border-border hover:bg-surface rounded-sm flex items-center justify-center gap-1.5"
                >
                  <GraduationCap className="h-3.5 w-3.5" /> Intern Portal
                </Link>
              </div>

              <div className="pt-2">
                <Link 
                  to="/auth/admin" 
                  onClick={() => setMenuOpen(false)} 
                  className="w-full px-3 py-2 text-xs text-center font-medium text-gold hover:text-gold transition-colors border border-gold/30 hover:bg-gold/5 rounded-sm flex items-center justify-center gap-1.5"
                >
                  <Lock className="h-3.5 w-3.5" /> Super Admin Control
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
