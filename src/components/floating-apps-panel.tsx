import { useState, useRef } from "react";
import {
  X, Minus, Square, BotMessageSquare, ChevronUp,
  Sparkles, MessageSquare, Grid3X3, ExternalLink
} from "lucide-react";

interface AppItem {
  id: string;
  name: string;
  icon: string;
  url: string;
  color: string;
  description: string;
}

const AI_APPS: AppItem[] = [
  {
    id: "gemini",
    name: "Gemini",
    icon: "✦",
    url: "https://gemini.google.com",
    color: "from-blue-500 to-purple-600",
    description: "Google's AI assistant",
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    icon: "◆",
    url: "https://chatgpt.com",
    color: "from-emerald-500 to-teal-600",
    description: "OpenAI's chat AI",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    icon: "⊕",
    url: "https://www.perplexity.ai",
    color: "from-cyan-500 to-blue-600",
    description: "AI-powered search",
  },
];

const GOOGLE_APPS: AppItem[] = [
  {
    id: "drive",
    name: "Drive",
    icon: "▲",
    url: "https://drive.google.com",
    color: "from-yellow-400 to-orange-500",
    description: "Cloud storage",
  },
  {
    id: "docs",
    name: "Docs",
    icon: "📄",
    url: "https://docs.google.com",
    color: "from-blue-400 to-blue-600",
    description: "Word processing",
  },
  {
    id: "sheets",
    name: "Sheets",
    icon: "📊",
    url: "https://sheets.google.com",
    color: "from-green-400 to-green-600",
    description: "Spreadsheets",
  },
  {
    id: "slides",
    name: "Slides",
    icon: "📑",
    url: "https://slides.google.com",
    color: "from-orange-400 to-red-500",
    description: "Presentations",
  },
  {
    id: "gmail",
    name: "Gmail",
    icon: "✉",
    url: "https://mail.google.com",
    color: "from-red-400 to-red-600",
    description: "Email",
  },
  {
    id: "meet",
    name: "Meet",
    icon: "📹",
    url: "https://meet.google.com",
    color: "from-green-500 to-emerald-600",
    description: "Video calls",
  },
];

function openApp(url: string, name: string) {
  const w = 1100, h = 700;
  const left = Math.max(0, (window.screen.width - w) / 2);
  const top = Math.max(0, (window.screen.height - h) / 2);
  const popup = window.open(
    url,
    `app_${name.toLowerCase()}`,
    `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes,toolbar=no,menubar=no`
  );
  if (!popup || popup.closed) {
    window.open(url, "_blank");
  }
}

type Tab = "ai" | "google";

export function FloatingAppsPanel() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("ai");

  return (
    <>
      {/* Floating Trigger Button */}
      {!open && (
        <button
          onClick={() => { setOpen(true); setMinimized(false); }}
          className="fixed bottom-6 right-6 z-[200] group flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-[0_8px_30px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.35)] px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95"
          aria-label="Open Apps"
        >
          <Grid3X3 className="h-4 w-4" />
          <span>Apps</span>
          <Sparkles className="h-3.5 w-3.5 opacity-70" />
        </button>
      )}

      {/* Floating Panel */}
      {open && (
        <div className={`fixed bottom-6 right-6 z-[200] w-80 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] border border-white/10 overflow-hidden transition-all duration-300 bg-[#0f172a] text-white ${minimized ? "h-12" : "h-auto"}`}>

          {/* Title Bar */}
          <div className="flex items-center justify-between px-4 h-12 bg-gradient-to-r from-primary/30 to-purple-600/20 border-b border-white/10 cursor-default select-none">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Grid3X3 className="h-4 w-4 text-primary" />
              Workspace Apps
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setMinimized(m => !m)}
                className="h-6 w-6 rounded-full bg-yellow-500/20 hover:bg-yellow-400/40 flex items-center justify-center transition-colors"
                title={minimized ? "Expand" : "Minimize"}
              >
                {minimized ? <ChevronUp className="h-3 w-3 text-yellow-300" /> : <Minus className="h-3 w-3 text-yellow-300" />}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="h-6 w-6 rounded-full bg-red-500/20 hover:bg-red-400/40 flex items-center justify-center transition-colors"
                title="Close"
              >
                <X className="h-3 w-3 text-red-300" />
              </button>
            </div>
          </div>

          {/* Body */}
          {!minimized && (
            <div className="p-4 space-y-4">
              {/* Tabs */}
              <div className="flex rounded-lg bg-white/5 p-0.5 gap-0.5">
                <button
                  onClick={() => setActiveTab("ai")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === "ai" ? "bg-primary text-white shadow" : "text-white/50 hover:text-white"}`}
                >
                  ✦ AI Research
                </button>
                <button
                  onClick={() => setActiveTab("google")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === "google" ? "bg-primary text-white shadow" : "text-white/50 hover:text-white"}`}
                >
                  G Suite
                </button>
              </div>

              {/* AI Apps */}
              {activeTab === "ai" && (
                <div className="space-y-2">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Sign in with your account to use</p>
                  {AI_APPS.map((app) => (
                    <AppCard key={app.id} app={app} />
                  ))}
                </div>
              )}

              {/* Google Apps */}
              {activeTab === "google" && (
                <div className="space-y-3">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Sign in with your Google account</p>
                  <div className="grid grid-cols-3 gap-2">
                    {GOOGLE_APPS.map((app) => (
                      <GoogleAppIcon key={app.id} app={app} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

function AppCard({ app }: { app: AppItem }) {
  return (
    <button
      onClick={() => openApp(app.url, app.name)}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all text-left group"
    >
      <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${app.color} flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg`}>
        {app.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">{app.name}</div>
        <div className="text-[11px] text-white/40">{app.description}</div>
      </div>
      <ExternalLink className="h-3.5 w-3.5 text-white/20 group-hover:text-white/50 transition-colors shrink-0" />
    </button>
  );
}

function GoogleAppIcon({ app }: { app: AppItem }) {
  return (
    <button
      onClick={() => openApp(app.url, app.name)}
      className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group"
      title={app.description}
    >
      <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${app.color} flex items-center justify-center text-xl shadow-md group-hover:scale-110 transition-transform`}>
        {app.icon}
      </div>
      <span className="text-[10px] font-medium text-white/60">{app.name}</span>
    </button>
  );
}
