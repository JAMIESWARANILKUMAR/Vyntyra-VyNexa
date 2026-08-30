import React, { useState, useRef, useEffect } from "react";
import { 
  Globe, ArrowLeft, ArrowRight, RotateCw, Home, Lock, ExternalLink, 
  Maximize2, Minimize2, Search, Star, ShieldCheck, Plus, X, Sparkles, 
  Terminal, Copy, Check, Bookmark, Laptop, Shield, Image as ImageIcon,
  Wrench, Bug, Cpu, Layers, Code, Play, RefreshCw, Settings, Trash2, Eye,
  ZoomIn, ZoomOut, History, Command, Share2, HelpCircle, Monitor, Sliders,
  MousePointer, Filter, Ban, PlayCircle, StopCircle, HardDrive, Database,
  Activity, Layout, Sun, Moon, MoreVertical, ChevronDown, ChevronRight, AlertCircle, AlertTriangle
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
  { id: "vynexa-emerald", title: "Minimalist Obsidian Aurora", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80" },
  { id: "cyber-city", title: "Neon Cyberpunk Horizon", url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1920&q=80" },
  { id: "cosmic-space", title: "Deep Space Nebula", url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=80" },
  { id: "tokyo-sunset", title: "Tokyo Sunset Skyline", url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=80" },
  { id: "dark-mountain", title: "Minimalist Mountain Peak", url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80" },
  { id: "aqua-waves", title: "Radiant Aqua Geometry", url: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1920&q=80" },
  { id: "synthwave", title: "Synthwave Sunset Grid", url: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1920&q=80" },
];

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

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const [inputUrl, setInputUrl] = useState(activeTab.url);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [useProxyMode, setUseProxyMode] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [copied, setCopied] = useState(false);

  // Security Modal State
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  // Background Customization State
  const [wallpaperUrl, setWallpaperUrl] = useState<string>(() => {
    return localStorage.getItem("vynexa-search-bg-v4") || PRESET_WALLPAPERS[0].url;
  });
  const [wallpaperOpacity, setWallpaperOpacity] = useState<number>(() => {
    return parseFloat(localStorage.getItem("vynexa-search-bg-op-v4") || "0.45");
  });
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [customBgInput, setCustomBgInput] = useState("");

  // ─── EXACT GOOGLE CHROME DEVTOOLS STATE (Matching Reference Image) ───
  const [showDevTools, setShowDevTools] = useState(true);
  const [devDockPosition, setDevDockPosition] = useState<"bottom" | "right">("bottom");
  const [chromeTab, setChromeTab] = useState<"Elements" | "Console" | "Sources" | "Network" | "Performance" | "Memory" | "Application" | "Security" | "Lighthouse" | "Recorder">("Elements");
  const [elementsSubTab, setElementsSubTab] = useState<"Styles" | "Computed" | "Layout" | "Event Listeners">("Layout");

  // DOM Inspection Tree State
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    html: true,
    head: false,
    body: true,
  });
  const [selectedNode, setSelectedNode] = useState("body");

  // Console Execution State
  const [jsPromptInput, setJsPromptInput] = useState("");
  const [consoleEntries, setConsoleEntries] = useState<Array<{ id: string; type: "log" | "warn" | "error" | "info"; text: string; time: string }>>([
    { id: "1", type: "info", text: "Chrome DevTools Protocol v128.0 Active", time: new Date().toLocaleTimeString() },
    { id: "2", type: "log", text: "VyNexa Viewport loaded cleanly with 0 unhandled promise rejections.", time: new Date().toLocaleTimeString() },
  ]);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Sync Omnibox URL on tab change
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
    localStorage.setItem("vynexa-search-bg-v4", url);
    toast.success("Wallpaper updated!");
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

    setConsoleEntries((prev) => [
      { id: String(Date.now()), type: "info", text: `[Chrome Engine] Loaded ${target}`, time: new Date().toLocaleTimeString() },
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
    setTimeout(() => updateActiveTab((t) => ({ ...t, isLoading: false })), 500);
  };

  const handleExecuteJs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jsPromptInput.trim()) return;

    const cmd = jsPromptInput.trim();
    let res = "";
    try {
      if (cmd === "clear") {
        setConsoleEntries([]);
        setJsPromptInput("");
        return;
      }
      res = String(eval(cmd));
    } catch (err: any) {
      res = `Uncaught ${err?.message || "Execution Error"}`;
    }

    setConsoleEntries((prev) => [
      { id: String(Date.now()), type: res.startsWith("Uncaught") ? "error" : "log", text: `> ${cmd}\n  ${res}`, time: new Date().toLocaleTimeString() },
      ...prev,
    ]);
    setJsPromptInput("");
  };

  const toggleNode = (nodeName: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeName]: !prev[nodeName] }));
  };

  return (
    <div 
      className={`transition-all duration-300 flex flex-col relative overflow-hidden shadow-2xl ${
        isFullscreen 
          ? "fixed inset-0 z-50 bg-[#04060C] p-1" 
          : "w-full rounded-3xl border border-slate-800/90 bg-[#060812] min-h-[92vh]"
      }`}
    >
      {/* ─── HD WALLPAPER LAYER ─── */}
      {wallpaperUrl && (
        <div 
          className="absolute inset-0 pointer-events-none transition-all duration-500 z-0"
          style={{
            backgroundImage: `url('${wallpaperUrl}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: wallpaperOpacity,
          }}
        />
      )}

      {/* ─── VYNEXA SEARCH BROWSER WINDOW HEADER & TABS ─── */}
      <div className="relative z-10 bg-[#090D18]/95 border-b border-slate-800/90 px-3 py-2 flex flex-col gap-2 backdrop-blur-xl">
        {/* Top Window Bar: Traffic Dots & Multi-Tabs */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Chrome Traffic Dots */}
            <div className="flex items-center gap-1.5 shrink-0 pl-1">
              <span className="h-3 w-3 rounded-full bg-rose-500/90 border border-rose-400/40 inline-block shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
              <span className="h-3 w-3 rounded-full bg-amber-500/90 border border-amber-400/40 inline-block shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/90 border border-emerald-400/40 inline-block shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            </div>

            {/* VyNexa Brand Badge */}
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-slate-900 px-3 py-1 rounded-xl border border-emerald-500/40 text-emerald-300 text-[11px] font-black shrink-0 shadow-inner">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              <span className="tracking-tight">VyNexa Search</span>
            </div>

            {/* Multi-Tab Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-1 min-w-0">
              {tabs.map((t) => {
                const isActive = t.id === activeTabId;
                return (
                  <div
                    key={t.id}
                    onClick={() => setActiveTabId(t.id)}
                    className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-t-2xl text-xs max-w-[180px] sm:max-w-[220px] transition-all cursor-pointer border ${
                      isActive
                        ? "bg-[#10172A] border-slate-700/80 text-white font-bold shadow-lg"
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
            {/* Viewport Zoom Controls */}
            <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-xl px-2 py-0.5 text-xs text-slate-300 gap-1.5">
              <button 
                type="button" 
                onClick={() => setZoomLevel((z) => Math.max(50, z - 10))} 
                className="hover:text-white font-bold"
                title="Zoom Out"
              >
                -
              </button>
              <span className="text-[10px] font-mono font-bold text-emerald-400">{zoomLevel}%</span>
              <button 
                type="button" 
                onClick={() => setZoomLevel((z) => Math.min(200, z + 10))} 
                className="hover:text-white font-bold"
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

            {/* Wallpaper Customizer */}
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

            {/* Google Chrome DevTools Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDevTools(!showDevTools)}
              className={`h-7 text-xs font-bold gap-1 px-2.5 cursor-pointer border rounded-xl ${
                showDevTools 
                  ? "bg-[#332b1a] border-[#f5a623] text-[#f5a623] shadow-[0_0_12px_rgba(245,166,35,0.4)]"
                  : "bg-slate-900 border-slate-700 text-slate-300 hover:text-white"
              }`}
              title="Toggle Google Chrome DevTools Dock"
            >
              <Wrench className="h-3.5 w-3.5 text-[#f5a623]" />
              <span>DevTools</span>
            </Button>

            {/* Fullscreen Toggle */}
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

        {/* ─── VYNEXA OMNISEARCH ADDRESS BAR ─── */}
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

      {/* Loading Progress Bar */}
      {activeTab.isLoading && (
        <div className="relative z-10 w-full bg-slate-900 h-1 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 h-full w-full animate-pulse" />
        </div>
      )}

      {/* ─── MAIN BROWSER VIEWPORT & DEVTOOLS DOCK SPLIT ─── */}
      <div className={`relative z-10 flex-1 flex ${devDockPosition === "right" ? "flex-col lg:flex-row" : "flex-col"} min-h-[72vh] w-full overflow-hidden`}>
        {/* Render Active Browser Page */}
        <div className="flex-1 flex flex-col relative w-full h-full">
          {activeTab.url === "vynexa://search" ? (
            /* ─── VYNEXA SEARCH HOME LANDING PAGE ─── */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8 min-h-[65vh]">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-3xl bg-gradient-to-r from-emerald-950/90 via-teal-950/70 to-indigo-950/90 border border-emerald-500/50 shadow-[0_0_35px_rgba(52,211,153,0.25)]">
                  <Globe className="h-8 w-8 text-emerald-400 animate-spin-slow" />
                  <span className="text-3xl font-black tracking-tight text-white font-mono">VyNexa Search</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto font-medium leading-relaxed drop-shadow">
                  Next-generation executive web browser and Chrome developer inspection workspace for VyNexa Connect interns.
                </p>
              </div>

              {/* Search Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  navigateTo(inputUrl);
                }}
                className="w-full max-w-2xl flex items-center bg-[#070B16]/90 border-2 border-emerald-500/50 focus-within:border-emerald-400 rounded-3xl px-5 py-3.5 shadow-[0_0_35px_rgba(52,211,153,0.2)] transition-all backdrop-blur-xl"
              >
                <Search className="h-5 w-5 text-emerald-400 shrink-0 mr-3" />
                <input
                  type="text"
                  value={inputUrl === "vynexa://search" ? "" : inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="Search Google, developer docs, or paste web URL..."
                  className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
                />
                <Button type="submit" size="sm" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs h-10 px-6 rounded-2xl cursor-pointer shadow-lg shadow-emerald-950/80">
                  Search
                </Button>
              </form>

              {/* Trending Tech Pills */}
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300 flex items-center justify-center gap-1.5 drop-shadow">
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
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/60 text-slate-200 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-md"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Bookmark Cards Grid */}
              <div className="w-full max-w-3xl pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {PRESET_BOOKMARKS.map((bm) => (
                    <button
                      key={bm.id}
                      type="button"
                      onClick={() => navigateTo(bm.url)}
                      className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col items-center gap-2.5 group shadow-xl backdrop-blur-md"
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
        </div>

        {/* ─── EXACT 1:1 REPLICA OF GOOGLE CHROME DEVTOOLS (Matching Reference Image) ─── */}
        {showDevTools && (
          <div 
            className={`border-[#3c362e] bg-[#1e1a15] text-[#d4cfbf] font-mono text-xs flex flex-col shadow-2xl z-30 transition-all ${
              devDockPosition === "right" 
                ? "w-full lg:w-[500px] border-t lg:border-t-0 lg:border-l h-96 lg:h-auto" 
                : "w-full border-t h-80"
            }`}
          >
            {/* 1. Chrome DevTools Top Header Bar */}
            <div className="bg-[#241f1a] border-b border-[#3c362e] px-2 py-1 flex items-center justify-between shrink-0 select-none text-[11px]">
              {/* Left Side: Inspect Pointer & Device Mode */}
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => toast.info("Inspect element mode active. Click any node to select.")}
                  className="p-1 rounded hover:bg-[#3c362e] text-[#f5a623] cursor-pointer"
                  title="Select an element in the page to inspect it (Ctrl+Shift+C)"
                >
                  <MousePointer className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  className="p-1 rounded hover:bg-[#3c362e] text-[#b3ac9a] hover:text-white cursor-pointer"
                  title="Toggle device toolbar (Ctrl+Shift+M)"
                >
                  <Laptop className="h-3.5 w-3.5" />
                </button>

                <div className="h-3 w-[1px] bg-[#4a4237] mx-1" />

                {/* Main Chrome DevTools Tabs (Exact Replica of Reference Screenshot) */}
                {[
                  "Elements", "Console", "Sources", "Network", "Performance", 
                  "Memory", "Application", "Security", "Lighthouse", "Recorder"
                ].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setChromeTab(t as any)}
                    className={`px-2 py-1 text-xs font-semibold relative transition-all cursor-pointer ${
                      chromeTab === t 
                        ? "text-[#f5a623] font-bold" 
                        : "text-[#b3ac9a] hover:text-[#e8eaed]"
                    }`}
                  >
                    {t}
                    {chromeTab === t && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#f5a623]" />
                    )}
                  </button>
                ))}
              </div>

              {/* Right Side Status & Dock Controls */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Error/Warning Badges matching image: 🔴 1 ⚠️ 1 */}
                <div className="flex items-center gap-1 text-[10px] font-bold font-mono">
                  <span className="flex items-center text-[#ff7b72] gap-0.5"><span className="h-2 w-2 rounded-full bg-[#ff7b72] inline-block" /> 1</span>
                  <span className="flex items-center text-[#fdd663] gap-0.5"><span className="h-2 w-2 rounded-full bg-[#fdd663] inline-block" /> 1</span>
                </div>

                <Settings className="h-3.5 w-3.5 text-[#b3ac9a] hover:text-white cursor-pointer" />
                <MoreVertical className="h-3.5 w-3.5 text-[#b3ac9a] hover:text-white cursor-pointer" />

                <button
                  type="button"
                  onClick={() => setShowDevTools(false)}
                  className="text-[#b3ac9a] hover:text-white font-bold px-1 text-xs"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 2. Breadcrumb Navigation Bar (Matching Reference Screenshot) */}
            <div className="bg-[#1e1a15] border-b border-[#3c362e] px-3 py-0.5 text-[10px] text-[#b3ac9a] font-mono flex items-center gap-1 shrink-0 overflow-x-auto scrollbar-none">
              <span className="text-[#f5a623]">#adopted-style-sheets</span>
              <span>&gt;</span>
              <span>html.focus-outline-visible</span>
              <span>&gt;</span>
              <span className="text-white font-bold">body</span>
            </div>

            {/* 3. DevTools Main Body Panel (Split 2-Column Inspector for Elements Tab) */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#171410]">
              {/* ─── ELEMENTS TAB ─── */}
              {chromeTab === "Elements" && (
                <>
                  {/* Left Column: Interactive DOM Tree Inspector */}
                  <div className="flex-1 p-3 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1.5 border-b lg:border-b-0 lg:border-r border-[#3c362e]">
                    <div className="text-[#807765]">&lt;!DOCTYPE html&gt;</div>

                    {/* HTML Root */}
                    <div>
                      <div 
                        onClick={() => toggleNode("html")} 
                        className="flex items-center gap-1 cursor-pointer hover:bg-[#28231d] px-1 rounded"
                      >
                        <ChevronDown className={`h-3 w-3 text-[#b3ac9a] transition-transform ${expandedNodes.html ? "" : "-rotate-90"}`} />
                        <span className="text-[#ff7b72]">&lt;html</span>
                        <span className="text-[#f2cc60]">dir</span>=<span className="text-[#7ee787]">"ltr"</span>
                        <span className="text-[#f2cc60]">lang</span>=<span className="text-[#7ee787]">"en"</span>
                        <span className="text-[#f2cc60]">class</span>=<span className="text-[#7ee787]">"focus-outline-visible"</span>
                        <span className="text-[#ff7b72]">&gt;</span>
                      </div>

                      {expandedNodes.html && (
                        <div className="pl-4 space-y-1">
                          {/* HEAD Node */}
                          <div 
                            onClick={() => toggleNode("head")}
                            className="flex items-center gap-1 cursor-pointer hover:bg-[#28231d] px-1 rounded text-[#ff7b72]"
                          >
                            <ChevronRight className="h-3 w-3 text-[#b3ac9a]" />
                            <span>&lt;head&gt;...&lt;/head&gt;</span>
                          </div>

                          {/* BODY Node */}
                          <div>
                            <div 
                              onClick={() => {
                                toggleNode("body");
                                setSelectedNode("body");
                              }}
                              className={`flex items-center gap-1 cursor-pointer px-1 rounded ${selectedNode === "body" ? "bg-[#332b1a] text-[#f5a623] font-bold" : "hover:bg-[#28231d]"}`}
                            >
                              <ChevronDown className="h-3 w-3 text-[#b3ac9a]" />
                              <span className="text-[#ff7b72]">&lt;body</span>
                              <span className="text-[#f2cc60]">style</span>=<span className="text-[#7ee787]">"background-color: rgb(76, 56, 33);"</span>
                              <span className="text-[#ff7b72]">&gt;</span>
                              <span className="text-[#807765] ml-2 font-bold">== $0</span>
                            </div>

                            {expandedNodes.body && (
                              <div className="pl-4 space-y-1 text-[10.5px]">
                                <div className="text-[#ff7b72] pl-2">
                                  &lt;iframe <span className="text-[#f2cc60]">id</span>=<span className="text-[#7ee787]">"backgroundImage"</span> <span className="text-[#f2cc60]">src</span>=""&gt;&lt;/iframe&gt;
                                </div>
                                <div className="text-[#ff7b72] pl-2">
                                  &lt;ntp-app <span className="text-[#f2cc60]">style</span>=<span className="text-[#7ee787]">"--ntp-logo-color: rgba(254, 185, 104, 1.00);"</span>&gt;&lt;/ntp-app&gt;
                                </div>
                                <div className="text-[#ff7b72] pl-2">
                                  &lt;script <span className="text-[#f2cc60]">type</span>=<span className="text-[#7ee787]">"module"</span> <span className="text-[#f2cc60]">src</span>=<span className="text-[#7ee787]">"new_tab_page.js"</span>&gt;&lt;/script&gt;
                                </div>
                                <div className="text-[#ff7b72] pl-2">
                                  &lt;link <span className="text-[#f2cc60]">rel</span>=<span className="text-[#7ee787]">"stylesheet"</span> <span className="text-[#f2cc60]">href</span>=<span className="text-[#7ee787]">"chrome://resources/css/text_defaults.css"</span>&gt;
                                </div>
                                <div className="text-[#ff7b72] pl-2">
                                  &lt;link <span className="text-[#f2cc60]">rel</span>=<span className="text-[#7ee787]">"stylesheet"</span> <span className="text-[#f2cc60]">href</span>=<span className="text-[#7ee787]">"chrome://theme/colors.css?sets=ui,chrome"</span>&gt;
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Styles / Computed / Layout / Event Listeners Panel */}
                  <div className="w-full lg:w-72 bg-[#1e1a15] p-3 overflow-y-auto font-mono text-xs space-y-3 shrink-0">
                    {/* Sub-Tabs: Styles | Computed | Layout | Event Listeners */}
                    <div className="flex items-center gap-2 border-b border-[#3c362e] pb-1.5 text-[11px] overflow-x-auto scrollbar-none">
                      {["Styles", "Computed", "Layout", "Event Listeners"].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setElementsSubTab(st as any)}
                          className={`font-semibold cursor-pointer whitespace-nowrap ${
                            elementsSubTab === st ? "text-[#f5a623] border-b-2 border-[#f5a623] font-bold" : "text-[#b3ac9a] hover:text-white"
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>

                    {/* Sub-Panel View 1: LAYOUT (Matching Reference Image) */}
                    {elementsSubTab === "Layout" && (
                      <div className="space-y-3 text-[11px]">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between font-bold text-[#f5a623]">
                            <span className="flex items-center gap-1"><ChevronDown className="h-3 w-3" /> Grid / Grid Lanes</span>
                          </div>

                          <div className="pl-2 space-y-2 text-[#b3ac9a]">
                            <div>Overlay display settings</div>
                            <select className="bg-[#28231d] border border-[#3c362e] rounded px-2 py-1 text-xs text-white outline-none w-full">
                              <option>Show line numbers</option>
                              <option>Hide line numbers</option>
                            </select>

                            <div className="space-y-1.5 pt-1">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded accent-[#f5a623]" />
                                <span>Show track sizes</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded accent-[#f5a623]" />
                                <span>Show area names</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded accent-[#f5a623]" />
                                <span>Extend grid lines</span>
                              </label>
                            </div>
                          </div>

                          <div className="text-[10px] text-[#807765] italic pt-1">
                            No grid or grid lanes layouts found on this page
                          </div>
                        </div>

                        {/* Flexbox Overlays (Matching Reference Image) */}
                        <div className="space-y-2 pt-2 border-t border-[#3c362e]">
                          <div className="flex items-center justify-between font-bold text-[#f5a623]">
                            <span className="flex items-center gap-1"><ChevronDown className="h-3 w-3" /> Flexbox Overlays</span>
                          </div>

                          <div className="pl-2 space-y-1.5 max-h-52 overflow-y-auto text-[#79c0ff]">
                            {[
                              "div#content", "div#oneGoogleBarStackingContext", "ntp-logo#logo", 
                              "div#searchBoxContainer", "div#inputWrapper", "cr-searchbox-input#input", 
                              "div#inputInnerContainer", "div#container", "div#contextMenuContainer",
                              "cr-composebox-contextual-entrypoint", "cr-icon-button#entrypoint.ai-mode",
                              "div#icon", "cr-icon", "button#imageUpload.dropdown-item", "button#fileUpload.dropdown-item"
                            ].map((flexNode, idx) => (
                              <label key={idx} className="flex items-center gap-2 cursor-pointer text-[10.5px]">
                                <input type="checkbox" className="rounded accent-[#f5a623]" />
                                <span className="hover:underline truncate">{flexNode}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sub-Panel View 2: STYLES */}
                    {elementsSubTab === "Styles" && (
                      <div className="space-y-2 text-[11px] font-mono">
                        <div className="text-[#f5a623] font-bold">element.style &#123;</div>
                        <div className="pl-3 text-[#79c0ff]">background-color: <span className="text-[#ffa657]">rgb(76, 56, 33)</span>;</div>
                        <div className="text-[#f5a623] font-bold">&#125;</div>

                        <div className="pt-2 text-[#f5a623] font-bold">html.focus-outline-visible &#123;</div>
                        <div className="pl-3 text-[#79c0ff]">display: <span className="text-[#ffa657]">flex</span>;</div>
                        <div className="pl-3 text-[#79c0ff]">flex-direction: <span className="text-[#ffa657]">column</span>;</div>
                        <div className="pl-3 text-[#79c0ff]">font-family: <span className="text-[#7ee787]">"Segoe UI", sans-serif</span>;</div>
                        <div className="text-[#f5a623] font-bold">&#125;</div>
                      </div>
                    )}

                    {/* Sub-Panel View 3: COMPUTED */}
                    {elementsSubTab === "Computed" && (
                      <div className="space-y-2 text-[11px] font-mono text-[#79c0ff]">
                        <div className="flex justify-between border-b border-[#3c362e] pb-1"><span>display</span> <span className="text-[#ffa657]">flex</span></div>
                        <div className="flex justify-between border-b border-[#3c362e] pb-1"><span>height</span> <span className="text-[#ffa657]">742px</span></div>
                        <div className="flex justify-between border-b border-[#3c362e] pb-1"><span>width</span> <span className="text-[#ffa657]">1280px</span></div>
                        <div className="flex justify-between border-b border-[#3c362e] pb-1"><span>margin</span> <span className="text-[#ffa657]">0px</span></div>
                      </div>
                    )}

                    {/* Sub-Panel View 4: EVENT LISTENERS */}
                    {elementsSubTab === "Event Listeners" && (
                      <div className="space-y-1.5 text-[11px] text-[#b3ac9a]">
                        <div className="font-bold text-[#f5a623]">▼ click (2)</div>
                        <div className="pl-3">div#searchBoxContainer</div>
                        <div className="pl-3">button#imageUpload</div>
                        <div className="font-bold text-[#f5a623] pt-1">▼ keydown (1)</div>
                        <div className="pl-3">input#search</div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ─── CONSOLE TAB ─── */}
              {chromeTab === "Console" && (
                <div className="flex-1 p-3 overflow-y-auto space-y-2 font-mono text-xs">
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {consoleEntries.map((c) => (
                      <div key={c.id} className="p-1 border-b border-[#3c362e] flex items-start gap-2">
                        <span className="text-[9px] text-[#807765]">[{c.time}]</span>
                        <span className={`flex-1 whitespace-pre-wrap ${c.type === "error" ? "text-[#ff7b72]" : c.type === "warn" ? "text-[#fdd663]" : "text-[#d4cfbf]"}`}>
                          {c.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleExecuteJs} className="pt-2 border-t border-[#3c362e] flex items-center gap-2">
                    <span className="text-[#f5a623] font-bold">&gt;</span>
                    <input
                      type="text"
                      value={jsPromptInput}
                      onChange={(e) => setJsPromptInput(e.target.value)}
                      placeholder="Type JavaScript expression to evaluate..."
                      className="flex-1 bg-[#241f1a] border border-[#3c362e] rounded px-2 py-1 text-xs text-white placeholder:text-[#807765] outline-none font-mono focus:border-[#f5a623]"
                    />
                    <Button type="submit" size="sm" className="h-7 bg-[#28231d] hover:bg-[#3c362e] text-[#f5a623] border border-[#3c362e] text-xs px-3 cursor-pointer">
                      Run
                    </Button>
                  </form>
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

            {/* Presets Grid */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aesthetic 4K Background Wallpapers</span>
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
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-all flex items-end p-2">
                      <span className="text-[11px] font-bold text-white drop-shadow truncate">{wp.title}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Opacity Control Slider */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span className="font-bold flex items-center gap-1.5"><Sliders className="h-3.5 w-3.5 text-teal-400" /> Wallpaper Opacity:</span>
                <span className="font-mono font-bold text-emerald-400">{Math.round(wallpaperOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={wallpaperOpacity}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setWallpaperOpacity(val);
                  localStorage.setItem("vynexa-search-bg-op-v4", String(val));
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
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
                    localStorage.removeItem("vynexa-search-bg-v4");
                    setWallpaperUrl("");
                    setShowWallpaperModal(false);
                    toast.success("Background reset to dark obsidian");
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
