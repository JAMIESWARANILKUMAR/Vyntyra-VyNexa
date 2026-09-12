import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, LogOut, Clock, Layers } from "lucide-react";
import { InstallPwaButton } from "@/components/install-pwa-button";

export function DashboardHeader({ 
  panelName, 
  links, 
  onSignOut,
  userProfileName = ""
}: { 
  panelName: string; 
  links: { href: string; label: string; icon: any; colorClass?: string; onClick?: () => void; isSpecial?: boolean }[];
  onSignOut: () => void;
  userProfileName?: string;
}) {
  const [time, setTime] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="border-b border-border bg-card sticky top-0 z-40 shadow-sm">
        <div className="mx-auto w-full max-w-[1800px] px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Left Side: Logo & Company Name */}
          <div className="flex items-center gap-3 shrink-0">
            <img src="/icon-512.png" alt="Vyntyra" className="h-8 sm:h-10 w-auto shrink-0 rounded-lg shadow-sm" />
            <div>
              <h1 className="text-sm sm:text-base font-bold text-primary tracking-tight">Vyntyra Consultancy Services</h1>
              {userProfileName && (
                <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Welcome, {userProfileName}</div>
              )}
            </div>
          </div>

          {/* Right Side: Panel Name, Time & Hamburger */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            <div className="hidden md:flex flex-col items-end justify-center h-full border-r border-border pr-4 sm:pr-6">
              <span className="text-[10px] sm:text-xs font-bold text-emerald-600 uppercase tracking-wider">{panelName}</span>
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3 h-3" />
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>

            <button 
              onClick={() => setMenuOpen(true)} 
              className="p-2 sm:px-3 sm:py-2 flex items-center gap-2 rounded-md hover:bg-surface text-primary border border-border shadow-sm bg-card hover:shadow transition-all"
            >
              <Menu className="h-5 w-5" />
              <span className="hidden sm:inline text-sm font-medium">Menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Slide-over Hamburger Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setMenuOpen(false)}
          />

          {/* Menu Drawer */}
          <div className="relative w-full max-w-sm bg-card border-l border-border shadow-2xl h-full flex flex-col z-10 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-surface">
              <div>
                <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{panelName}</div>
                <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mt-1">
                  <Clock className="w-3 h-3" />
                  {time.toLocaleDateString()} • {time.toLocaleTimeString()}
                </div>
              </div>
              <button onClick={() => setMenuOpen(false)} className="p-2 rounded-full hover:bg-slate-200 text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Links */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
              <div className="mb-2">
                <InstallPwaButton />
              </div>
              
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4 px-2">Navigation</div>
              
              {links.map((link, idx) => {
                if (link.onClick) {
                  return (
                    <button
                      key={idx}
                      onClick={() => { setMenuOpen(false); link.onClick!(); }}
                      className={"flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors w-full text-left " + (link.colorClass || "text-slate-700 hover:bg-surface hover:text-primary")}
                    >
                      <link.icon className="w-5 h-5" />
                      {link.label}
                    </button>
                  )
                }

                return (
                  <Link
                    key={idx}
                    to={link.href}
                    className={"flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors " + (link.colorClass || "text-slate-700 hover:bg-surface hover:text-primary")}
                    onClick={() => setMenuOpen(false)}
                  >
                    <link.icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-surface">
              <button
                onClick={() => { setMenuOpen(false); onSignOut(); }}
                className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-md text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm transition-all"
              >
                <LogOut className="w-5 h-5" />
                Sign out completely
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
