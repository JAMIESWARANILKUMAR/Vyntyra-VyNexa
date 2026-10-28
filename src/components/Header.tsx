import React, { useState, useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { 
  Menu, X, Shield, ArrowRight, Globe2, Mail, Briefcase, GraduationCap, Lock, ChevronRight, Sparkles 
} from "lucide-react";
import { InstallPwaButton } from "./install-pwa-button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";

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
            {/* Campus Ambassador Highlight Pill */}
            <Link 
              to="/campus-ambassador" 
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-indigo-500/20 border border-amber-500/40 text-[10px] font-extrabold text-amber-300 hover:text-white transition-all shadow-xs animate-pulse"
            >
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span>Ambassador Cohort 1.0</span>
            </Link>

            <span className="opacity-40 hidden sm:inline">|</span>
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

              {/* Ambassador Link in Desktop Nav */}
              <Link 
                to="/campus-ambassador" 
                className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all flex items-center gap-1 shrink-0 ${
                  isActive("/campus-ambassador")
                    ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                    : "text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30"
                }`}
              >
                <Sparkles className="h-3 w-3" />
                <span>Ambassador</span>
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

              {/* Hamburger Toggle button with Right-Side Drawer (Sheet) */}
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    aria-label="Open navigation menu"
                    className="lg:hidden inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-sm border border-border bg-card text-primary hover:bg-surface hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shrink-0 shadow-xs cursor-pointer"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                </SheetTrigger>

                <SheetContent 
                  side="right" 
                  className="w-[85vw] max-w-[340px] sm:max-w-sm p-0 flex flex-col justify-between bg-card border-l border-border shadow-2xl z-50"
                >
                  <div className="flex flex-col h-full overflow-y-auto">
                    {/* Drawer Header */}
                    <SheetHeader className="p-4 border-b border-border bg-surface/50 text-left">
                      <div className="flex items-center justify-between gap-3 pr-6">
                        <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5">
                          <img src="/icon-512.png" alt="VCS Logo" className="h-8 w-auto shrink-0 object-contain" />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-foreground leading-tight tracking-wide">VYNTYRA</span>
                            <span className="text-[10px] text-muted-foreground tracking-wider uppercase">Consultancy</span>
                          </div>
                        </Link>
                        {live && (
                          <span className="inline-flex items-center gap-1 rounded-sm border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-destructive shrink-0">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
                              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-destructive"></span>
                            </span>
                            Live
                          </span>
                        )}
                      </div>
                      <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                      <SheetDescription className="sr-only">Main website navigation and access portals</SheetDescription>
                    </SheetHeader>

                    {/* Navigation Items */}
                    <div className="p-4 flex flex-col gap-1 flex-1">
                      {/* Special Ambassador Drawer Card */}
                      <Link
                        to="/campus-ambassador"
                        onClick={() => setMenuOpen(false)}
                        className="p-3 mb-2 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-pink-500/10 to-indigo-500/15 text-left block transition-all hover:scale-[1.02] shadow-xs"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-500 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" /> First Cohort 2026-27
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 uppercase">
                            Soon
                          </span>
                        </div>
                        <div className="text-xs font-bold text-foreground">
                          Campus Ambassador Program
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Earn up to ₹15k, gadgets & travel retreat &rarr;
                        </div>
                      </Link>

                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70 px-3 py-1 mb-1">
                        Navigation
                      </div>

                      <Link 
                        to="/" 
                        onClick={() => setMenuOpen(false)} 
                        className={`px-3 py-2.5 rounded-md transition-colors flex items-center justify-between text-sm ${
                          pathname === "/" 
                            ? "text-primary font-semibold bg-primary/10 border-l-2 border-primary" 
                            : "text-foreground/80 hover:text-primary hover:bg-surface"
                        }`}
                      >
                        <span>Home</span>
                        <ChevronRight className="h-4 w-4 opacity-40" />
                      </Link>

                      <Link 
                        to="/about" 
                        onClick={() => setMenuOpen(false)} 
                        className={`px-3 py-2.5 rounded-md transition-colors flex items-center justify-between text-sm ${
                          pathname === "/about" 
                            ? "text-primary font-semibold bg-primary/10 border-l-2 border-primary" 
                            : "text-foreground/80 hover:text-primary hover:bg-surface"
                        }`}
                      >
                        <span>About Us</span>
                        <ChevronRight className="h-4 w-4 opacity-40" />
                      </Link>

                      <Link 
                        to="/careers" 
                        onClick={() => setMenuOpen(false)} 
                        className={`px-3 py-2.5 rounded-md transition-colors flex items-center justify-between text-sm ${
                          isActive("/careers") 
                            ? "text-primary font-semibold bg-primary/10 border-l-2 border-primary" 
                            : "text-foreground/80 hover:text-primary hover:bg-surface"
                        }`}
                      >
                        <span>Careers</span>
                        <ChevronRight className="h-4 w-4 opacity-40" />
                      </Link>

                      <Link 
                        to="/status" 
                        onClick={() => setMenuOpen(false)} 
                        className={`px-3 py-2.5 rounded-md transition-colors flex items-center justify-between text-sm ${
                          isActive("/status") 
                            ? "text-primary font-semibold bg-primary/10 border-l-2 border-primary" 
                            : "text-foreground/80 hover:text-primary hover:bg-surface"
                        }`}
                      >
                        <span>Track Application Status</span>
                        <ChevronRight className="h-4 w-4 opacity-40" />
                      </Link>

                      <Link 
                        to="/verify" 
                        search={{ id: undefined, ref: undefined, email: undefined, q: undefined, tab: undefined }}
                        onClick={() => setMenuOpen(false)} 
                        className={`px-3 py-2.5 rounded-md transition-colors flex items-center justify-between text-sm ${
                          isActive("/verify") 
                            ? "text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 border-l-2 border-emerald-500" 
                            : "text-emerald-700 dark:text-emerald-400 hover:bg-surface"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Shield className="h-4 w-4" /> Verify Intern Credentials
                        </span>
                        <ChevronRight className="h-4 w-4 opacity-40" />
                      </Link>

                      {/* Corporate Portals Section */}
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70 px-3 py-1 mb-2">
                          Portals & Access
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <Link 
                            to="/auth/employee" 
                            onClick={() => setMenuOpen(false)} 
                            className="px-3 py-2.5 text-xs text-center font-medium text-foreground hover:text-primary transition-colors border border-border hover:bg-surface rounded-md flex flex-col items-center justify-center gap-1.5 shadow-xs"
                          >
                            <Briefcase className="h-4 w-4 text-primary" />
                            <span>Employee</span>
                          </Link>
                          <Link 
                            to="/auth/intern" 
                            onClick={() => setMenuOpen(false)} 
                            className="px-3 py-2.5 text-xs text-center font-medium text-foreground hover:text-primary transition-colors border border-border hover:bg-surface rounded-md flex flex-col items-center justify-center gap-1.5 shadow-xs"
                          >
                            <GraduationCap className="h-4 w-4 text-primary" />
                            <span>Intern</span>
                          </Link>
                        </div>

                        <Link 
                          to="/auth/admin" 
                          onClick={() => setMenuOpen(false)} 
                          className="w-full px-3 py-2 text-xs font-medium text-gold hover:text-gold transition-colors border border-gold/30 hover:bg-gold/5 rounded-md flex items-center justify-center gap-2 shadow-xs"
                        >
                          <Lock className="h-3.5 w-3.5" />
                          <span>Super Admin Control</span>
                        </Link>
                      </div>
                    </div>

                    {/* Drawer Footer Action Area */}
                    <div className="p-4 border-t border-border bg-surface/30 mt-auto flex flex-col gap-3">
                      <Link
                        to="/apply"
                        onClick={handleApplyClick}
                        className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-secondary text-primary-foreground py-2.5 px-4 rounded-md text-sm font-semibold transition-colors shadow-sm"
                      >
                        <span>Apply Now</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>

                      <div className="flex flex-col gap-1 text-[11px] text-muted-foreground text-center">
                        <a href="mailto:hr@vyntyraconsultancyservices.in" className="hover:text-gold transition-colors truncate">
                          hr@vyntyraconsultancyservices.in
                        </a>
                        <span className="text-[10px] opacity-70">Vyntyra Consultancy Services Pvt. Ltd.</span>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
