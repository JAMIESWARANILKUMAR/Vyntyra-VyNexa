import React, { useState, useRef } from "react";
import { 
  Globe, ArrowLeft, ArrowRight, RotateCw, Home, Lock, ExternalLink, 
  Maximize2, Minimize2, Search, Star, ShieldCheck, Plus, X, Sparkles, 
  Terminal, Copy, Check, Bookmark, Laptop, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  icon: string;
  color: string;
}

const PRESET_BOOKMARKS: BookmarkItem[] = [
  { id: "google", title: "Google", url: "https://www.google.com/search?igu=1", icon: "🔍", color: "from-blue-500 to-red-500" },
  { id: "github", title: "GitHub", url: "https://github.com", icon: "🐙", color: "from-[#24292e] to-[#040d21]" },
  { id: "supabase", title: "Supabase", url: "https://supabase.com", icon: "⚡", color: "from-emerald-500 to-teal-700" },
  { id: "figma", title: "Figma", url: "https://figma.com", icon: "🎨", color: "from-pink-500 to-purple-600" },
  { id: "chatgpt", title: "ChatGPT", url: "https://chatgpt.com", icon: "🤖", color: "from-emerald-600 to-green-600" },
  { id: "mdn", title: "MDN Docs", url: "https://developer.mozilla.org", icon: "📚", color: "from-sky-500 to-blue-600" },
  { id: "overflow", title: "Stack Overflow", url: "https://stackoverflow.com", icon: "💻", color: "from-orange-500 to-[#f48024]" },
  { id: "npm", title: "NPM Registry", url: "https://www.npmjs.com", icon: "📦", color: "from-red-600 to-rose-700" },
  { id: "vynexa", title: "VyNexa Portal", url: "/", icon: "🌐", color: "from-emerald-500 to-teal-500" },
];

export function IntegratedChromeBrowser() {
  const [currentUrl, setCurrentUrl] = useState("https://www.google.com/search?igu=1");
  const [inputUrl, setInputUrl] = useState("https://www.google.com/search?igu=1");
  const [history, setHistory] = useState<string[]>(["https://www.google.com/search?igu=1"]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTabTitle, setActiveTabTitle] = useState("Chrome Workspace Browser");
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const navigateTo = (urlInput: string) => {
    let target = urlInput.trim();
    if (!target) return;

    // Handle standard search vs URL parsing
    if (!target.startsWith("http://") && !target.startsWith("https://") && !target.startsWith("/")) {
      if (target.includes(".") && !target.includes(" ")) {
        target = `https://${target}`;
      } else {
        target = `https://www.google.com/search?q=${encodeURIComponent(target)}&igu=1`;
      }
    }

    setCurrentUrl(target);
    setInputUrl(target);
    setIsLoading(true);

    // Update history stack
    const updated = history.slice(0, historyIndex + 1);
    updated.push(target);
    setHistory(updated);
    setHistoryIndex(updated.length - 1);

    // Set readable tab title
    try {
      const u = new URL(target.startsWith("/") ? window.location.origin + target : target);
      setActiveTabTitle(u.hostname.replace("www.", "") || "Browser Workspace");
    } catch {
      setActiveTabTitle("Web Workspace");
    }
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      const prevUrl = history[prevIdx];
      setCurrentUrl(prevUrl);
      setInputUrl(prevUrl);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      const nextUrl = history[nextIdx];
      setCurrentUrl(nextUrl);
      setInputUrl(nextUrl);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = currentUrl;
    }
    setTimeout(() => setIsLoading(false), 800);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    toast.success("URL copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`transition-all duration-300 flex flex-col ${
      isFullscreen 
        ? "fixed inset-0 z-50 bg-[#04060C] p-2" 
        : "w-full rounded-3xl border border-slate-800/80 bg-[#070A14]/90 shadow-2xl backdrop-blur-2xl overflow-hidden"
    }`}>
      {/* ─── CHROME WINDOW HEADER BAR ─── */}
      <div className="bg-[#0A0E1A] border-b border-slate-800/90 px-3 py-2 flex flex-col gap-2">
        {/* Top Window Controls & Tabs */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mac/Chrome Window Dots */}
            <div className="flex items-center gap-1.5 shrink-0 pl-1">
              <span className="h-3 w-3 rounded-full bg-rose-500/80 border border-rose-400/30 inline-block" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80 border border-amber-400/30 inline-block" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80 border border-emerald-400/30 inline-block" />
            </div>

            {/* Active Chrome Tab */}
            <div className="flex items-center gap-2 bg-[#10172A] border border-slate-700/60 rounded-t-xl px-3 py-1.5 text-xs text-white max-w-xs sm:max-w-md truncate shadow-inner">
              <Globe className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="font-bold truncate text-[11px] sm:text-xs">{activeTabTitle}</span>
              <span className="ml-2 text-slate-500 hover:text-slate-300 text-xs font-mono cursor-pointer">×</span>
            </div>

            <button 
              type="button"
              onClick={() => navigateTo("https://www.google.com/search?igu=1")}
              className="h-6 w-6 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer text-xs"
              title="New Tab"
            >
              +
            </button>
          </div>

          {/* Window Utility Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyUrl}
              className="h-7 text-xs text-slate-400 hover:text-white gap-1 px-2 cursor-pointer"
              title="Copy URL"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{copied ? "Copied" : "Copy Link"}</span>
            </Button>

            <a
              href={currentUrl}
              target="_blank"
              rel="noreferrer"
              className="h-7 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
              title="Open in external Chrome window"
            >
              <ExternalLink className="h-3.5 w-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Open Native</span>
            </a>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-7 w-7 p-0 text-slate-300 border-slate-700 hover:border-emerald-500/50 cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5 text-amber-400" /> : <Maximize2 className="h-3.5 w-3.5 text-emerald-400" />}
            </Button>
          </div>
        </div>

        {/* ─── CHROME OMNIBOX & NAVIGATION BAR ─── */}
        <div className="flex items-center gap-2">
          {/* Nav Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleBack}
              disabled={historyIndex <= 0}
              className="h-8 w-8 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-all cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleForward}
              disabled={historyIndex >= history.length - 1}
              className="h-8 w-8 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-all cursor-pointer"
              title="Forward"
            >
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              className="h-8 w-8 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="Reload page"
            >
              <RotateCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-emerald-400" : ""}`} />
            </button>

            <button
              type="button"
              onClick={() => navigateTo("https://www.google.com/search?igu=1")}
              className="h-8 w-8 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="Google Home"
            >
              <Home className="h-3.5 w-3.5 text-emerald-400" />
            </button>
          </div>

          {/* Chrome Omnibox URL Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigateTo(inputUrl);
            }}
            className="flex-1 min-w-0 flex items-center bg-[#060912] border border-slate-700/80 focus-within:border-emerald-500/80 rounded-2xl px-3 py-1 shadow-inner transition-all"
          >
            <Lock className="h-3.5 w-3.5 text-emerald-400 shrink-0 mr-2" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="w-full bg-transparent text-xs font-mono text-white placeholder:text-slate-500 outline-none"
              placeholder="Search Google or enter web URL (https://...)"
            />
            <button type="submit" className="text-slate-400 hover:text-emerald-400 shrink-0 ml-1 cursor-pointer">
              <Search className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>

        {/* ─── QUICK BOOKMARK BAR ─── */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none text-xs border-t border-slate-800/60 pt-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 shrink-0 mr-1 flex items-center gap-1">
            <Bookmark className="h-3 w-3 text-amber-400" /> Bookmarks:
          </span>
          {PRESET_BOOKMARKS.map((bm) => (
            <button
              key={bm.id}
              type="button"
              onClick={() => navigateTo(bm.url)}
              className="shrink-0 px-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-[11px] font-medium cursor-pointer"
            >
              <span>{bm.icon}</span>
              <span>{bm.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Loading Bar Indicator */}
      {isLoading && (
        <div className="w-full bg-slate-900 h-1 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 h-full w-full animate-pulse" />
        </div>
      )}

      {/* ─── INTEGRATED BROWSER VIEWPORT FRAME ─── */}
      <div className="relative flex-1 bg-black min-h-[75vh] w-full overflow-hidden flex flex-col">
        <iframe
          ref={iframeRef}
          src={currentUrl}
          title="Integrated Chrome Workspace"
          className="w-full h-full flex-1 border-none bg-white min-h-[72vh]"
          onLoad={() => setIsLoading(false)}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
        />

        {/* Security & X-Frame Helper Bar */}
        <div className="bg-[#080B15] border-t border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2 truncate">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="truncate">
              Browsing: <strong className="text-white font-mono">{currentUrl}</strong>
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[10px] text-slate-500 hidden sm:inline">
              Note: Websites with strict X-Frame policies (like main Google search or GitHub login) work best via 1-click Native window.
            </span>
            <a
              href={currentUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline"
            >
              Open in Chrome Window <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
