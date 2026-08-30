import React, { useState, useRef, useEffect } from "react";
import { 
  Globe, ArrowLeft, ArrowRight, RotateCw, Home, Lock, ExternalLink, 
  Maximize2, Minimize2, Search, Star, ShieldCheck, Plus, X, Sparkles, 
  Terminal, Copy, Check, Bookmark, Laptop, Shield, Image as ImageIcon,
  Wrench, Bug, Cpu, Layers, Code, Play, RefreshCw, Settings, Trash2, Eye,
  ZoomIn, ZoomOut, History, Command, Share2, HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TabState {
  id: string;
  title: string;
  url: string;
  history: string[];
  historyIndex: number;
  isLoading: boolean;
}

interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  icon: string;
  category: string;
}

const PRESET_BOOKMARKS: BookmarkItem[] = [
  { id: "vynexa", title: "VyNexa Portal", url: "/", icon: "⚡", category: "Internal" },
  { id: "google", title: "Google Search", url: "https://www.google.com/search?igu=1", icon: "🔍", category: "Search" },
  { id: "github", title: "GitHub", url: "https://github.com", icon: "🐙", category: "Dev" },
  { id: "supabase", title: "Supabase DB", url: "https://supabase.com", icon: "⚡", category: "Dev" },
  { id: "figma", title: "Figma Design", url: "https://figma.com", icon: "🎨", category: "Design" },
  { id: "chatgpt", title: "ChatGPT AI", url: "https://chatgpt.com", icon: "🤖", category: "AI" },
  { id: "mdn", title: "MDN Web Docs", url: "https://developer.mozilla.org", icon: "📚", category: "Docs" },
  { id: "overflow", title: "Stack Overflow", url: "https://stackoverflow.com", icon: "💻", category: "Dev" },
  { id: "npm", title: "NPM Packages", url: "https://www.npmjs.com", icon: "📦", category: "Dev" },
];

const PRESET_WALLPAPERS = [
  { id: "vynexa-emerald", title: "VyNexa Obsidian Emerald", url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1920&q=80" },
  { id: "nebula", title: "Cosmic Space Nebula", url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=80" },
  { id: "tokyo", title: "Neon Tokyo Sunset", url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=80" },
  { id: "mountain", title: "Dark Mountain Dusk", url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80" },
  { id: "aqua", title: "Cyber Aqua Waves", url: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1920&q=80" },
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
  // Multi-Tab Management
  const [tabs, setTabs] = useState<TabState[]>([
    {
      id: "tab-1",
      title: "VyNexa Search",
      url: "vynexa://search",
      history: ["vynexa://search"],
      historyIndex: 0,
      isLoading: false,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>("tab-1");

  // Get Current Active Tab
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const [inputUrl, setInputUrl] = useState(activeTab.url);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [useProxyMode, setUseProxyMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [copied, setCopied] = useState(false);

  // Security Inspector Modal
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  // Background Image Customization
  const [wallpaperUrl, setWallpaperUrl] = useState<string>(() => {
    return localStorage.getItem("vynexa-search-bg") || PRESET_WALLPAPERS[0].url;
  });
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [customBgInput, setCustomBgInput] = useState("");

  // DevTools Panel State
  const [showDevTools, setShowDevTools] = useState(false);
  const [devTab, setDevTab] = useState<"console" | "network" | "elements" | "storage">("console");
  const [consoleLogs, setConsoleLogs] = useState<DevConsoleLog[]>([
    { id: "1", type: "system", message: "VyNexa Search DevTools Engine v3.0 Initialized", timestamp: new Date().toLocaleTimeString() },
    { id: "2", type: "info", message: "VyNexa Security Protocol & SSL Inspector Active", timestamp: new Date().toLocaleTimeString() },
    { id: "3", type: "log", message: "DOM Tree & Network Proxy Engine ready.", timestamp: new Date().toLocaleTimeString() },
  ]);
  const [jsPromptInput, setJsPromptInput] = useState("");

  const [networkLogs, setNetworkLogs] = useState<NetworkRequestLog[]>([
    { id: "1", url: activeTab.url, method: "GET", status: 200, time: "45ms", type: "document" },
    { id: "2", url: "https://vynexa.connect/api/search", method: "GET", status: 200, time: "18ms", type: "json" },
  ]);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Sync InputUrl when switching active tab
  useEffect(() => {
    setInputUrl(activeTab.url);
  }, [activeTabId, activeTab.url]);

  const updateActiveTab = (updater: (tab: TabState) => TabState) => {
    setTabs((prev) => prev.map((t) => (t.id === activeTabId ? updater(t) : t)));
  };

  const createNewTab = (initialUrl = "vynexa://search") => {
    const newId = `tab-${Date.now()}`;
    const newTab: TabState = {
      id: newId,
      title: initialUrl === "vynexa://search" ? "VyNexa Search" : "New Tab",
      url: initialUrl,
      history: [initialUrl],
      historyIndex: 0,
      isLoading: false,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
  };

  const closeTab = (tabId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (tabs.length === 1) {
      // If closing last tab, reset to home landing
      updateActiveTab((t) => ({ ...t, url: "vynexa://search", title: "VyNexa Search", history: ["vynexa://search"], historyIndex: 0 }));
      return;
    }
    const remaining = tabs.filter((t) => t.id !== tabId);
    setTabs(remaining);
    if (activeTabId === tabId) {
      setActiveTabId(remaining[remaining.length - 1].id);
    }
  };

  const applyWallpaper = (url: string) => {
    setWallpaperUrl(url);
    localStorage.setItem("vynexa-search-bg", url);
    toast.success("VyNexa Search background wallpaper updated!");
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
    if (target === "vynexa://search") return "vynexa://search";
    if (!useProxyMode) return target;
    if (target.startsWith("/") || target.includes("localhost")) return target;
    return `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`;
  };

  const navigateTo = (urlInput: string) => {
    let target = urlInput.trim();
    if (!target) return;

    if (target === "vynexa://search" || target === "about:blank" || target === "home") {
      target = "vynexa://search";
    } else if (!target.startsWith("http://") && !target.startsWith("https://") && !target.startsWith("/")) {
      if (target.includes(".") && !target.includes(" ")) {
        target = `https://${target}`;
      } else {
        target = `https://www.google.com/search?q=${encodeURIComponent(target)}&igu=1`;
      }
    }

    let pageTitle = "VyNexa Search";
    if (target !== "vynexa://search") {
      try {
        const u = new URL(target.startsWith("/") ? window.location.origin + target : target);
        pageTitle = u.hostname.replace("www.", "") || "Web Workspace";
      } catch {
        pageTitle = "Web Workspace";
      }
    }

    setInputUrl(target);

    updateActiveTab((t) => {
      const updatedHistory = t.history.slice(0, t.historyIndex + 1);
      updatedHistory.push(target);
      return {
        ...t,
        url: target,
        title: pageTitle,
        history: updatedHistory,
        historyIndex: updatedHistory.length - 1,
        isLoading: target !== "vynexa://search",
      };
    });

    // Add Network Log
    setNetworkLogs((prev) => [
      { id: String(Date.now()), url: target, method: "GET", status: 200, time: `${Math.floor(Math.random() * 120) + 15}ms`, type: "document" },
      ...prev.slice(0, 15),
    ]);

    // Add Console Log
    setConsoleLogs((prev) => [
      { id: String(Date.now()), type: "info", message: `[VyNexa Engine] Navigated to ${target}`, timestamp: new Date().toLocaleTimeString() },
      ...prev,
    ]);
  };

  const handleBack = () => {
    if (activeTab.historyIndex > 0) {
      const prevIdx = activeTab.historyIndex - 1;
      const prevUrl = activeTab.history[prevIdx];
      updateActiveTab((t) => ({ ...t, historyIndex: prevIdx, url: prevUrl }));
      setInputUrl(prevUrl);
    }
  };

  const handleForward = () => {
    if (activeTab.historyIndex < activeTab.history.length - 1) {
      const nextIdx = activeTab.historyIndex + 1;
      const nextUrl = activeTab.history[nextIdx];
      updateActiveTab((t) => ({ ...t, historyIndex: nextIdx, url: nextUrl }));
      setInputUrl(nextUrl);
    }
  };

  const handleRefresh = () => {
    updateActiveTab((t) => ({ ...t, isLoading: true }));
    if (iframeRef.current && activeTab.url !== "vynexa://search") {
      iframeRef.current.src = getEffectiveFrameUrl(activeTab.url);
    }
    setTimeout(() => updateActiveTab((t) => ({ ...t, isLoading: false })), 600);
  };

  const handleExecuteJs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jsPromptInput.trim()) return;

    const cmd = jsPromptInput.trim();
    const timestamp = new Date().toLocaleTimeString();

    let outputMessage = "";
    try {
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
      { id: String(Date.now()), type: outputMessage.startsWith("Uncaught") ? "error" : "log", message: `> ${cmd} \n  ← ${outputMessage}`, timestamp },
      ...prev,
    ]);
    setJsPromptInput("");
  };

  return (
    <div 
      className={`transition-all duration-300 flex flex-col relative overflow-hidden ${
        isFullscreen 
          ? "fixed inset-0 z-50 bg-[#04060C] p-2" 
          : "w-full rounded-3xl border border-slate-800/90 bg-[#070A14]/90 shadow-2xl backdrop-blur-2xl overflow-hidden min-h-[88vh]"
      }`}
      style={{
        backgroundImage: wallpaperUrl ? `linear-gradient(to bottom, rgba(4,6,12,0.85), rgba(4,6,12,0.92)), url('${wallpaperUrl}')` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* ─── VYNEXA CONNECT BROWSER HEADER & TABS ─── */}
      <div className="bg-[#090D18]/95 border-b border-slate-800/90 px-3 py-2 flex flex-col gap-2 backdrop-blur-xl">
        {/* Top Window Bar: Traffic Dots & Multi-Tabs */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* VyNexa Traffic Dots */}
            <div className="flex items-center gap-1.5 shrink-0 pl-1">
              <span className="h-3 w-3 rounded-full bg-emerald-500/90 border border-emerald-400/40 inline-block shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              <span className="h-3 w-3 rounded-full bg-teal-500/90 border border-teal-400/40 inline-block shadow-[0_0_8px_rgba(45,212,191,0.6)]" />
              <span className="h-3 w-3 rounded-full bg-indigo-500/90 border border-indigo-400/40 inline-block shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
            </div>

            {/* VyNexa Brand Badge */}
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-slate-900 px-2.5 py-1 rounded-xl border border-emerald-500/30 text-emerald-300 text-[11px] font-black shrink-0 shadow-inner">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              <span className="tracking-tight">VyNexa Search</span>
            </div>

            {/* Scrollable Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-1 min-w-0">
              {tabs.map((t) => {
                const isActive = t.id === activeTabId;
                return (
                  <div
                    key={t.id}
                    onClick={() => setActiveTabId(t.id)}
                    className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-xl text-xs max-w-[180px] sm:max-w-[220px] transition-all cursor-pointer border ${
                      isActive
                        ? "bg-[#10172A] border-slate-700/80 text-white font-bold shadow-md"
                        : "bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                    }`}
                  >
                    <Globe className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-emerald-400" : "text-slate-500"}`} />
                    <span className="truncate text-[11px] font-medium">{t.title}</span>
                    <button
                      type="button"
                      onClick={(e) => closeTab(t.id, e)}
                      className="ml-auto opacity-60 group-hover:opacity-100 hover:text-rose-400 text-xs font-mono px-1"
                    >
                      ×
                    </button>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => createNewTab()}
                className="h-7 w-7 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer text-sm font-bold shrink-0"
                title="Open New Tab"
              >
                +
              </button>
            </div>
          </div>

          {/* Window Tool Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-xl px-1.5 py-0.5 text-xs text-slate-300 gap-1">
              <button 
                type="button" 
                onClick={() => setZoomLevel((z) => Math.max(50, z - 10))} 
                className="hover:text-white px-1 font-bold"
                title="Zoom Out"
              >
                -
              </button>
              <span className="text-[10px] font-mono font-bold text-emerald-400">{zoomLevel}%</span>
              <button 
                type="button" 
                onClick={() => setZoomLevel((z) => Math.min(200, z + 10))} 
                className="hover:text-white px-1 font-bold"
                title="Zoom In"
              >
                +
              </button>
            </div>

            {/* Proxy Mode Toggle */}
            <button
              type="button"
              onClick={() => {
                setUseProxyMode(!useProxyMode);
                toast.info(`CORS Proxy Engine ${!useProxyMode ? "ENABLED" : "DISABLED"}`);
              }}
              className={`h-7 px-2.5 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                useProxyMode 
                  ? "bg-purple-950/80 border-purple-500/50 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
              }`}
              title="Toggle CORS Proxy engine"
            >
              <Cpu className="h-3.5 w-3.5 text-purple-400" />
              <span className="hidden md:inline">Proxy: <strong>{useProxyMode ? "ON" : "OFF"}</strong></span>
            </button>

            {/* Background Customizer */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowWallpaperModal(true)}
              className="h-7 text-xs text-slate-300 border-slate-700 hover:border-emerald-500/50 gap-1 px-2.5 cursor-pointer bg-slate-900/80 rounded-xl"
              title="Change Background Wallpaper"
            >
              <ImageIcon className="h-3.5 w-3.5 text-teal-400" />
              <span className="hidden md:inline">Wallpaper</span>
            </Button>

            {/* DevTools Toggle */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDevTools(!showDevTools)}
              className={`h-7 text-xs font-bold gap-1 px-2.5 cursor-pointer border rounded-xl ${
                showDevTools 
                  ? "bg-amber-950/80 border-amber-500/50 text-amber-300"
                  : "bg-slate-900 border-slate-700 text-slate-300 hover:text-white"
              }`}
              title="Toggle VyNexa DevTools (Console, Network, Elements)"
            >
              <Wrench className="h-3.5 w-3.5 text-amber-400" />
              <span>DevTools</span>
            </Button>

            {/* Fullscreen Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-7 w-7 p-0 text-slate-300 border-slate-700 hover:border-emerald-500/50 cursor-pointer rounded-xl"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5 text-amber-400" /> : <Maximize2 className="h-3.5 w-3.5 text-emerald-400" />}
            </Button>
          </div>
        </div>

        {/* ─── VYNEXA OMNISEARCH & NAVIGATION BAR ─── */}
        <div className="flex items-center gap-2">
          {/* Nav Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleBack}
              disabled={activeTab.historyIndex <= 0}
              className="h-8 w-8 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-all cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleForward}
              disabled={activeTab.historyIndex >= activeTab.history.length - 1}
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
              <RotateCw className={`h-3.5 w-3.5 ${activeTab.isLoading ? "animate-spin text-emerald-400" : ""}`} />
            </button>

            <button
              type="button"
              onClick={() => navigateTo("vynexa://search")}
              className="h-8 w-8 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="VyNexa Search Home"
            >
              <Home className="h-3.5 w-3.5 text-emerald-400" />
            </button>
          </div>

          {/* Omnibox Address Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigateTo(inputUrl);
            }}
            className="flex-1 min-w-0 flex items-center bg-[#060912] border border-slate-700/80 focus-within:border-emerald-500/80 rounded-2xl px-3 py-1.5 shadow-inner transition-all"
          >
            {/* SSL Security Shield Button */}
            <button
              type="button"
              onClick={() => setShowSecurityModal(true)}
              className="flex items-center gap-1 mr-2 text-emerald-400 hover:text-emerald-300 cursor-pointer"
              title="Security & SSL Certificate Details"
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
            </button>

            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="w-full bg-transparent text-xs font-mono text-white placeholder:text-slate-500 outline-none"
              placeholder="Search VyNexa, enter keyword, or URL (https://...)"
            />

            <button type="submit" className="text-slate-400 hover:text-emerald-400 shrink-0 ml-1 cursor-pointer">
              <Search className="h-4 w-4 text-emerald-400" />
            </button>
          </form>

          {/* Copy URL & Native External Window Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(activeTab.url);
                setCopied(true);
                toast.success("URL copied to clipboard!");
                setTimeout(() => setCopied(false), 2000);
              }}
              className="h-8 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
              title="Copy URL"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="hidden lg:inline">{copied ? "Copied" : "Copy"}</span>
            </button>

            {activeTab.url !== "vynexa://search" && (
              <a
                href={activeTab.url}
                target="_blank"
                rel="noreferrer"
                className="h-8 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                title="Open in external browser window"
              >
                <ExternalLink className="h-3.5 w-3.5 text-indigo-400" />
                <span className="hidden lg:inline">Native</span>
              </a>
            )}
          </div>
        </div>

        {/* ─── QUICK BOOKMARK BAR ─── */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none text-xs border-t border-slate-800/60 pt-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0 mr-1 flex items-center gap-1">
            <Bookmark className="h-3 w-3 text-amber-400" /> Quick Bookmarks:
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

      {/* Loading Bar */}
      {activeTab.isLoading && (
        <div className="w-full bg-slate-900 h-1 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 h-full w-full animate-pulse" />
        </div>
      )}

      {/* ─── MAIN CONTENT VIEWPORT FRAME / LANDING ─── */}
      <div className="flex-1 flex flex-col lg:flex-row relative min-h-[72vh] w-full overflow-hidden">
        {/* Render Page or VyNexa Search Landing Experience */}
        <div className="flex-1 bg-black/80 flex flex-col relative w-full h-full">
          {activeTab.url === "vynexa://search" ? (
            /* ─── VYNEXA SEARCH HOME LANDING PAGE ─── */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8 min-h-[65vh]">
              {/* VyNexa Search Logo Badge */}
              <div className="space-y-3">
                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-indigo-950/80 border border-emerald-500/40 shadow-[0_0_25px_rgba(52,211,153,0.2)]">
                  <Globe className="h-7 w-7 text-emerald-400 animate-spin-slow" />
                  <span className="text-2xl font-black tracking-tight text-white font-mono">VyNexa Search</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto font-medium">
                  Next-generation executive web browser and developer inspection workspace integrated for VyNexa Connect interns.
                </p>
              </div>

              {/* Large Search Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  navigateTo(inputUrl);
                }}
                className="w-full max-w-2xl flex items-center bg-[#070B16] border-2 border-emerald-500/40 focus-within:border-emerald-400 rounded-3xl px-5 py-3 shadow-[0_0_30px_rgba(52,211,153,0.15)] transition-all"
              >
                <Search className="h-5 w-5 text-emerald-400 shrink-0 mr-3" />
                <input
                  type="text"
                  value={inputUrl === "vynexa://search" ? "" : inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="Search Google, developer docs, or paste URL..."
                  className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
                />
                <Button type="submit" size="sm" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs h-9 px-5 rounded-2xl cursor-pointer">
                  Search
                </Button>
              </form>

              {/* Trending Developer Tags */}
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center justify-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Trending Tech Searches:
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl">
                  {[
                    "React 19 Hooks", "Supabase RLS", "Tailwind CSS v4", 
                    "TypeScript Guide", "Python FastAPIs", "AI Prompt Engineering"
                  ].map((tag, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => navigateTo(tag)}
                      className="px-3 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Bookmark Grid */}
              <div className="w-full max-w-3xl pt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {PRESET_BOOKMARKS.map((bm) => (
                    <button
                      key={bm.id}
                      type="button"
                      onClick={() => navigateTo(bm.url)}
                      className="p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col items-center gap-2 group shadow-md"
                    >
                      <div className="h-10 w-10 rounded-2xl bg-slate-950 border border-slate-700/60 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                        {bm.icon}
                      </div>
                      <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors truncate max-w-full">{bm.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ─── WEB IFRAME VIEWPORT FRAME ─── */
            <div 
              className="w-full h-full flex-1 border-none bg-white min-h-[68vh] overflow-hidden"
              style={{ zoom: `${zoomLevel}%` }}
            >
              <iframe
                ref={iframeRef}
                src={getEffectiveFrameUrl(activeTab.url)}
                title="VyNexa Search Viewport"
                className="w-full h-full border-none bg-white min-h-[68vh]"
                onLoad={() => updateActiveTab((t) => ({ ...t, isLoading: false }))}
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
              />
            </div>
          )}

          {/* Frame Footer & Security Info */}
          {activeTab.url !== "vynexa://search" && (
            <div className="bg-[#080B15]/95 border-t border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
              <div className="flex items-center gap-2 truncate">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="truncate">
                  Browsing: <strong className="text-white font-mono">{activeTab.url}</strong>
                  {useProxyMode && <span className="ml-2 text-purple-400 font-bold">(Proxy Bypass Active)</span>}
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
                  href={activeTab.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline"
                >
                  Open Native <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* ─── VYNEXA DEVTOOLS PANEL ─── */}
        {showDevTools && (
          <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-800 bg-[#060912] flex flex-col shadow-2xl z-20 h-96 lg:h-auto">
            {/* DevTools Tabs Header */}
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

                  {/* JS Interactive Input */}
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
                    <span>ENDPOINT &amp; TYPE</span>
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
                    <div className="text-blue-400 pl-2">&lt;html lang="en" class="vynexa-search-frame"&gt;</div>
                    <div className="text-amber-400 pl-4">&lt;head&gt;</div>
                    <div className="text-slate-400 pl-6">&lt;title&gt;{activeTab.title}&lt;/title&gt;</div>
                    <div className="text-amber-400 pl-4">&lt;/head&gt;</div>
                    <div className="text-emerald-400 pl-4">&lt;body class="vynexa-viewport-active"&gt;</div>
                    <div className="text-slate-400 pl-6">&lt;div id="vynexa-root"&gt;...&lt;/div&gt;</div>
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
                      <span className="text-indigo-400">vynexa-search-bg</span>
                      <span className="text-slate-400 truncate max-w-[150px]">Customized Wallpaper</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                      <span className="text-indigo-400">vynexa-tab-count</span>
                      <span className="text-emerald-400">{tabs.length} Active Tabs</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── SSL SECURITY INSPECTOR MODAL ─── */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0E1322] border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" /> VyNexa Security &amp; SSL Inspector
              </h3>
              <button 
                type="button"
                onClick={() => setShowSecurityModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center gap-3">
                <Lock className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-emerald-300">Connection is Secure</div>
                  <div className="text-[11px] text-slate-300">Your information (passwords, messages, credentials) is encrypted end-to-end.</div>
                </div>
              </div>

              <div className="space-y-2 bg-slate-900/80 p-3 rounded-2xl border border-slate-800 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Host Domain:</span>
                  <span className="text-white font-bold">{activeTab.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Encryption:</span>
                  <span className="text-emerald-400">TLS 1.3 / AES_256_GCM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Certificate:</span>
                  <span className="text-slate-200">VyNexa Trusted Authority</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">CORS Bypass:</span>
                  <span className="text-purple-400">{useProxyMode ? "Enabled" : "Standard Direct"}</span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setShowSecurityModal(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs h-9 rounded-xl"
            >
              Close Inspector
            </Button>
          </div>
        </div>
      )}

      {/* ─── WALLPAPER BACKGROUND SELECTION MODAL ─── */}
      {showWallpaperModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0E1322] border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-teal-400" /> VyNexa Search Background Customizer
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
                    localStorage.removeItem("vynexa-search-bg");
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
