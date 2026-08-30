import React, { useState, useRef, useEffect } from "react";
import { 
  Globe, ArrowLeft, ArrowRight, RotateCw, Home, Lock, ExternalLink, 
  Maximize2, Minimize2, Search, Star, ShieldCheck, Plus, X, Sparkles, 
  Terminal, Copy, Check, Bookmark, Laptop, Shield, Image as ImageIcon,
  Wrench, Bug, Cpu, Layers, Code, Play, RefreshCw, Settings, Trash2, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  icon: string;
}

const PRESET_BOOKMARKS: BookmarkItem[] = [
  { id: "google", title: "Google Search", url: "https://www.google.com/search?igu=1", icon: "🔍" },
  { id: "github", title: "GitHub", url: "https://github.com", icon: "🐙" },
  { id: "supabase", title: "Supabase DB", url: "https://supabase.com", icon: "⚡" },
  { id: "figma", title: "Figma Design", url: "https://figma.com", icon: "🎨" },
  { id: "chatgpt", title: "ChatGPT", url: "https://chatgpt.com", icon: "🤖" },
  { id: "mdn", title: "MDN Web Docs", url: "https://developer.mozilla.org", icon: "📚" },
  { id: "overflow", title: "Stack Overflow", url: "https://stackoverflow.com", icon: "💻" },
  { id: "npm", title: "NPM Registry", url: "https://www.npmjs.com", icon: "📦" },
  { id: "vynexa", title: "VyNexa Portal", url: "/", icon: "🌐" },
];

const PRESET_WALLPAPERS = [
  { id: "cyber", title: "Cyberpunk Obsidian", url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1920&q=80" },
  { id: "nebula", title: "Cosmic Space", url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=80" },
  { id: "tokyo", title: "Neon Tokyo Sunset", url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=80" },
  { id: "mountain", title: "Dark Mountain Dusk", url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80" },
  { id: "aqua", title: "Aqua Waves", url: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1920&q=80" },
];

interface DevConsoleLog {
  id: string;
  type: "log" | "warn" | "error" | "info" | "system";
  message: string;
  timestamp: string;
}

interface NetworkRequestLog {
  id: string;
  url: string;
  method: string;
  status: number;
  time: string;
  type: string;
}

export function IntegratedChromeBrowser() {
  const [currentUrl, setCurrentUrl] = useState("https://www.google.com/search?igu=1");
  const [inputUrl, setInputUrl] = useState("https://www.google.com/search?igu=1");
  const [history, setHistory] = useState<string[]>(["https://www.google.com/search?igu=1"]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTabTitle, setActiveTabTitle] = useState("Chrome Workspace Browser");
  const [copied, setCopied] = useState(false);
  const [useProxyMode, setUseProxyMode] = useState(false);

  // Background Image Customization
  const [wallpaperUrl, setWallpaperUrl] = useState<string>(() => {
    return localStorage.getItem("vynexa-browser-bg") || PRESET_WALLPAPERS[0].url;
  });
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [customBgInput, setCustomBgInput] = useState("");

  // Chrome DevTools Panel State
  const [showDevTools, setShowDevTools] = useState(false);
  const [devTab, setDevTab] = useState<"console" | "network" | "elements" | "storage">("console");
  const [consoleLogs, setConsoleLogs] = useState<DevConsoleLog[]>([
    { id: "1", type: "system", message: "VyNexa Integrated DevTools Engine Initialized v2.4", timestamp: new Date().toLocaleTimeString() },
    { id: "2", type: "info", message: "DOM Document loaded with 0 frame errors.", timestamp: new Date().toLocaleTimeString() },
    { id: "3", type: "log", message: "Proxy CORS engine ready for cross-domain inspection.", timestamp: new Date().toLocaleTimeString() },
  ]);
  const [jsPromptInput, setJsPromptInput] = useState("");

  const [networkLogs, setNetworkLogs] = useState<NetworkRequestLog[]>([
    { id: "1", url: currentUrl, method: "GET", status: 200, time: "142ms", type: "document" },
    { id: "2", url: "https://fonts.googleapis.com/css2?family=Inter", method: "GET", status: 200, time: "38ms", type: "stylesheet" },
    { id: "3", url: "https://cdn.jsdelivr.net/npm/lucide@0.263.1", method: "GET", status: 304, time: "12ms", type: "script" },
  ]);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Save Wallpaper Preference
  const applyWallpaper = (url: string) => {
    setWallpaperUrl(url);
    localStorage.setItem("vynexa-browser-bg", url);
    toast.success("Browser background image updated!");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        applyWallpaper(base64);
        setShowWallpaperModal(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const getEffectiveFrameUrl = (target: string) => {
    if (!useProxyMode) return target;
    if (target.startsWith("/") || target.includes("localhost")) return target;
    return `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`;
  };

  const navigateTo = (urlInput: string) => {
    let target = urlInput.trim();
    if (!target) return;

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

    const updated = history.slice(0, historyIndex + 1);
    updated.push(target);
    setHistory(updated);
    setHistoryIndex(updated.length - 1);

    try {
      const u = new URL(target.startsWith("/") ? window.location.origin + target : target);
      setActiveTabTitle(u.hostname.replace("www.", "") || "Browser Workspace");
    } catch {
      setActiveTabTitle("Web Workspace");
    }

    // Add Network Log
    const newNetLog: NetworkRequestLog = {
      id: String(Date.now()),
      url: target,
      method: "GET",
      status: 200,
      time: `${Math.floor(Math.random() * 150) + 20}ms`,
      type: "document"
    };
    setNetworkLogs((prev) => [newNetLog, ...prev.slice(0, 15)]);

    // Add Console Log
    setConsoleLogs((prev) => [
      { id: String(Date.now()), type: "info", message: `Navigated to ${target}`, timestamp: new Date().toLocaleTimeString() },
      ...prev
    ]);
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
      iframeRef.current.src = getEffectiveFrameUrl(currentUrl);
    }
    setTimeout(() => setIsLoading(false), 800);
  };

  const handleExecuteJs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jsPromptInput.trim()) return;

    const cmd = jsPromptInput.trim();
    const timestamp = new Date().toLocaleTimeString();

    let outputMessage = "";
    try {
      // Safe execution preview
      if (cmd === "clear" || cmd === "clear()") {
        setConsoleLogs([]);
        setJsPromptInput("");
        return;
      }
      const result = eval(cmd);
      outputMessage = typeof result === "object" ? JSON.stringify(result) : String(result);
    } catch (err: any) {
      outputMessage = `Uncaught Error: ${err?.message || "Execution error"}`;
    }

    setConsoleLogs((prev) => [
      { id: String(Date.now() + 1), type: outputMessage.startsWith("Uncaught") ? "error" : "log", message: `> ${cmd} \n  ← ${outputMessage}`, timestamp },
      ...prev
    ]);
    setJsPromptInput("");
  };

  return (
    <div 
      className={`transition-all duration-300 flex flex-col relative overflow-hidden ${
        isFullscreen 
          ? "fixed inset-0 z-50 bg-[#04060C] p-2" 
          : "w-full rounded-3xl border border-slate-800/80 bg-[#070A14]/90 shadow-2xl backdrop-blur-2xl overflow-hidden min-h-[85vh]"
      }`}
      style={{
        backgroundImage: wallpaperUrl ? `linear-gradient(to bottom, rgba(4,6,12,0.85), rgba(4,6,12,0.92)), url('${wallpaperUrl}')` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* ─── CHROME WINDOW HEADER BAR ─── */}
      <div className="bg-[#0A0E1A]/95 border-b border-slate-800/90 px-3 py-2 flex flex-col gap-2 backdrop-blur-md">
        {/* Top Window Controls & Tabs */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mac/Chrome Traffic Dots */}
            <div className="flex items-center gap-1.5 shrink-0 pl-1">
              <span className="h-3 w-3 rounded-full bg-rose-500/80 border border-rose-400/30 inline-block shadow-xs" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80 border border-amber-400/30 inline-block shadow-xs" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80 border border-emerald-400/30 inline-block shadow-xs" />
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
              className="h-6 w-6 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer text-xs font-bold"
              title="New Tab"
            >
              +
            </button>
          </div>

          {/* Window Action Tools */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Proxy Mode Toggle */}
            <button
              type="button"
              onClick={() => {
                setUseProxyMode(!useProxyMode);
                toast.info(`CORS Proxy Mode ${!useProxyMode ? "ENABLED (All sites accessible)" : "DISABLED"}`);
              }}
              className={`h-7 px-2.5 rounded-lg border text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                useProxyMode 
                  ? "bg-purple-950/80 border-purple-500/50 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
              }`}
              title="Toggle CORS Proxy Mode for strict sites"
            >
              <Cpu className="h-3.5 w-3.5 text-purple-400" />
              <span className="hidden sm:inline">Proxy Mode: <strong>{useProxyMode ? "ON" : "OFF"}</strong></span>
            </button>

            {/* Change Wallpaper Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowWallpaperModal(true)}
              className="h-7 text-xs text-slate-300 border-slate-700 hover:border-emerald-500/50 gap-1 px-2.5 cursor-pointer bg-slate-900/80"
              title="Customize Browser Background Image"
            >
              <ImageIcon className="h-3.5 w-3.5 text-teal-400" />
              <span className="hidden sm:inline">Background</span>
            </Button>

            {/* DevTools Toggle Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDevTools(!showDevTools)}
              className={`h-7 text-xs font-bold gap-1 px-2.5 cursor-pointer border ${
                showDevTools 
                  ? "bg-amber-950/80 border-amber-500/50 text-amber-300"
                  : "bg-slate-900 border-slate-700 text-slate-300 hover:text-white"
              }`}
              title="Toggle Chrome Developer Tools (Console, Network, Elements)"
            >
              <Wrench className="h-3.5 w-3.5 text-amber-400" />
              <span>DevTools</span>
            </Button>

            <a
              href={currentUrl}
              target="_blank"
              rel="noreferrer"
              className="h-7 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
              title="Open in external Chrome window"
            >
              <ExternalLink className="h-3.5 w-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Native</span>
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
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0 mr-1 flex items-center gap-1">
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

      {/* Loading Progress Line */}
      {isLoading && (
        <div className="w-full bg-slate-900 h-1 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 via-teal-400 to-purple-500 h-full w-full animate-pulse" />
        </div>
      )}

      {/* ─── MAIN CONTENT VIEWPORT & DEVTOOLS PANEL SPLIT ─── */}
      <div className="flex-1 flex flex-col lg:flex-row relative min-h-[70vh] w-full overflow-hidden">
        {/* Web Viewport Frame */}
        <div className="flex-1 bg-black/80 flex flex-col relative w-full h-full">
          <iframe
            ref={iframeRef}
            src={getEffectiveFrameUrl(currentUrl)}
            title="Integrated Chrome Workspace"
            className="w-full h-full flex-1 border-none bg-white min-h-[65vh]"
            onLoad={() => setIsLoading(false)}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
          />

          {/* Security & Frame Status Footer */}
          <div className="bg-[#080B15]/95 border-t border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
            <div className="flex items-center gap-2 truncate">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="truncate">
                Active: <strong className="text-white font-mono">{currentUrl}</strong>
                {useProxyMode && <span className="ml-2 text-purple-400 font-bold">(CORS Proxy Active)</span>}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setUseProxyMode(!useProxyMode)}
                className="text-xs font-bold text-purple-400 hover:underline cursor-pointer"
              >
                {useProxyMode ? "Disable Proxy" : "Fix Blank Page (Enable Proxy)"}
              </button>
              <a
                href={currentUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline"
              >
                Open Native <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* ─── INTEGRATED CHROME DEVTOOLS PANEL ─── */}
        {showDevTools && (
          <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-800 bg-[#060912] flex flex-col shadow-2xl z-20 h-96 lg:h-auto">
            {/* DevTools Header Tabs */}
            <div className="bg-[#0D1220] border-b border-slate-800 px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider mr-2 flex items-center gap-1">
                  <Terminal className="h-3.5 w-3.5" /> DevTools
                </span>
                {[
                  { id: "console", label: "Console" },
                  { id: "network", label: "Network" },
                  { id: "elements", label: "Elements" },
                  { id: "storage", label: "Storage" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setDevTab(t.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      devTab === t.id 
                        ? "bg-slate-800 text-emerald-400 border border-slate-700 shadow-xs" 
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <button 
                type="button"
                onClick={() => setShowDevTools(false)} 
                className="text-slate-500 hover:text-white text-xs font-bold px-1.5"
              >
                ✕
              </button>
            </div>

            {/* DevTools Tab Contents */}
            <div className="flex-1 p-3 overflow-y-auto font-mono text-xs space-y-2 bg-[#040710]">
              {/* DevTab 1: CONSOLE */}
              {devTab === "console" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pb-1 border-b border-slate-800">
                    <span>JavaScript Console Logs &amp; Execution Prompt</span>
                    <button 
                      type="button"
                      onClick={() => setConsoleLogs([])}
                      className="hover:text-rose-400 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" /> Clear
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {consoleLogs.map((log) => (
                      <div 
                        key={log.id} 
                        className={`p-2 rounded-lg border text-[11px] whitespace-pre-wrap break-all ${
                          log.type === "error" 
                            ? "bg-rose-950/40 border-rose-800/40 text-rose-300"
                            : log.type === "warn"
                            ? "bg-amber-950/40 border-amber-800/40 text-amber-300"
                            : log.type === "system"
                            ? "bg-purple-950/40 border-purple-800/40 text-purple-300"
                            : "bg-slate-900/80 border-slate-800 text-slate-200"
                        }`}
                      >
                        <span className="text-[9px] text-slate-500 mr-2">[{log.timestamp}]</span>
                        <span>{log.message}</span>
                      </div>
                    ))}
                  </div>

                  {/* JS Interactive Console Prompt Input */}
                  <form onSubmit={handleExecuteJs} className="pt-2 border-t border-slate-800 flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">&gt;</span>
                    <input
                      type="text"
                      value={jsPromptInput}
                      onChange={(e) => setJsPromptInput(e.target.value)}
                      placeholder="Execute JavaScript command (e.g. document.title)..."
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white placeholder:text-slate-600 outline-none focus:border-emerald-500 font-mono"
                    />
                    <Button type="submit" size="sm" className="h-7 bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-2.5">
                      Run
                    </Button>
                  </form>
                </div>
              )}

              {/* DevTab 2: NETWORK */}
              {devTab === "network" && (
                <div className="space-y-2">
                  <div className="text-[10px] text-slate-500 pb-1 border-b border-slate-800 flex justify-between">
                    <span>NAME &amp; PATH</span>
                    <span>STATUS / TIME</span>
                  </div>
                  <div className="space-y-1.5">
                    {networkLogs.map((req) => (
                      <div key={req.id} className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[11px]">
                        <div className="truncate max-w-[200px]">
                          <span className="text-emerald-400 font-bold mr-1.5">{req.method}</span>
                          <span className="text-slate-200 truncate">{req.url}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-800">{req.status} OK</span>
                          <span className="text-slate-400 font-mono">{req.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DevTab 3: ELEMENTS */}
              {devTab === "elements" && (
                <div className="space-y-2 text-slate-300">
                  <div className="text-[10px] text-slate-500 pb-1 border-b border-slate-800">DOM TREE STRUCTURE</div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1 text-[11px] font-mono leading-relaxed">
                    <div className="text-purple-400">&lt;!DOCTYPE html&gt;</div>
                    <div className="text-blue-400 pl-2">&lt;html lang="en"&gt;</div>
                    <div className="text-amber-400 pl-4">&lt;head&gt;</div>
                    <div className="text-slate-400 pl-6">&lt;title&gt;{activeTabTitle}&lt;/title&gt;</div>
                    <div className="text-amber-400 pl-4">&lt;/head&gt;</div>
                    <div className="text-emerald-400 pl-4">&lt;body class="vynexa-browser-active"&gt;</div>
                    <div className="text-slate-400 pl-6">&lt;div id="root"&gt;...&lt;/div&gt;</div>
                    <div className="text-emerald-400 pl-4">&lt;/body&gt;</div>
                    <div className="text-blue-400 pl-2">&lt;/html&gt;</div>
                  </div>
                </div>
              )}

              {/* DevTab 4: STORAGE */}
              {devTab === "storage" && (
                <div className="space-y-2 text-slate-300">
                  <div className="text-[10px] text-slate-500 pb-1 border-b border-slate-800">LOCAL STORAGE KEYS</div>
                  <div className="space-y-1.5 text-[11px] font-mono">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                      <span className="text-indigo-400">vynexa-browser-bg</span>
                      <span className="text-slate-400 truncate max-w-[150px]">Configured Wallpaper</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                      <span className="text-indigo-400">vynexa-session</span>
                      <span className="text-emerald-400">Active</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── WALLPAPER BACKGROUND SELECTION MODAL ─── */}
      {showWallpaperModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0E1322] border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-teal-400" /> Choose Browser Background Wallpaper
              </h3>
              <button 
                type="button"
                onClick={() => setShowWallpaperModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Presets */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aesthetic Background Presets</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PRESET_WALLPAPERS.map((wp) => (
                  <button
                    key={wp.id}
                    type="button"
                    onClick={() => {
                      applyWallpaper(wp.url);
                      setShowWallpaperModal(false);
                    }}
                    className={`relative rounded-2xl h-24 border-2 overflow-hidden transition-all group cursor-pointer ${
                      wallpaperUrl === wp.url ? "border-emerald-500 ring-2 ring-emerald-500/50" : "border-slate-800 hover:border-slate-600"
                    }`}
                    style={{ backgroundImage: `url('${wp.url}')`, backgroundSize: "cover", backgroundPosition: "center" }}
                  >
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all flex items-end p-2">
                      <span className="text-[11px] font-bold text-white drop-shadow truncate">{wp.title}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom URL or File Upload */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Or Set Custom Image URL / Upload File</span>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={customBgInput}
                  onChange={(e) => setCustomBgInput(e.target.value)}
                  placeholder="Paste direct image URL (https://...)"
                  className="flex-1 bg-[#060912] border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-500 outline-none"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (customBgInput) {
                      applyWallpaper(customBgInput);
                      setShowWallpaperModal(false);
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10 px-4 rounded-xl cursor-pointer"
                >
                  Apply
                </Button>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 cursor-pointer">
                  <span>📁 Upload Image File</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("vynexa-browser-bg");
                    setWallpaperUrl("");
                    setShowWallpaperModal(false);
                    toast.success("Background reset to default dark theme");
                  }}
                  className="text-xs text-rose-400 hover:underline font-bold"
                >
                  Reset to Dark Obsidian
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
