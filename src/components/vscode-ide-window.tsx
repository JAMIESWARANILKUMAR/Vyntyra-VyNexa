import React, { useState } from "react";
import { Code2, ExternalLink, RefreshCw, Shield, Terminal, Sparkles, Folder, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VSCodeIDEWindow() {
  const [iframeKey, setIframeKey] = useState(0);
  const [repoInput, setRepoInput] = useState("");
  const [vscodeUrl, setVscodeUrl] = useState("https://vscode.dev");

  const handleLoadRepo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoInput.trim()) return;
    let url = repoInput.trim();
    if (!url.startsWith("http")) url = `https://github.com/${url}`;
    // vscode.dev format for github repos
    const vsUrl = url.replace("github.com", "vscode.dev/github");
    setVscodeUrl(vsUrl);
    setIframeKey(prev => prev + 1);
  };

  return (
    <div className="w-full h-[88vh] bg-[#1e1e1e] rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-slate-800">
      
      {/* Top VS Code Navigation Bar */}
      <div className="p-3 bg-[#252526] border-b border-[#333333] flex items-center justify-between gap-3 text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
            <Code2 className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="font-bold text-xs leading-none text-slate-100 flex items-center gap-2">
              Official VS Code Web (vscode.dev)
              <span className="text-[10px] font-mono bg-blue-950 text-blue-400 border border-blue-800 px-2 py-0.5 rounded">Microsoft Official Engine</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">{vscodeUrl}</p>
          </div>
        </div>

        {/* GitHub Repo Launcher Form */}
        <form onSubmit={handleLoadRepo} className="flex items-center gap-2 max-w-md w-full">
          <input
            type="text"
            className="flex-1 rounded-md bg-[#1e1e1e] border border-[#333333] px-3 py-1 text-xs text-slate-200 outline-none focus:border-blue-500 font-mono"
            placeholder="GitHub repo URL or user/repo (e.g. vyntyra/core)..."
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
          />
          <Button type="submit" size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-500 text-white shrink-0">
            Open Repo
          </Button>
        </form>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIframeKey(prev => prev + 1)}
            className="p-1.5 rounded hover:bg-[#37373d] text-slate-400 hover:text-white transition-colors"
            title="Reload Editor"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <a href={vscodeUrl} target="_blank" rel="noreferrer">
            <Button size="sm" variant="outline" className="h-7 text-xs border-[#333333] text-slate-300 hover:bg-[#37373d]">
              <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open Full Screen
            </Button>
          </a>
        </div>
      </div>

      {/* Official VS Code Web Iframe Container */}
      <div className="flex-1 bg-[#1e1e1e] relative">
        <iframe
          key={iframeKey}
          src={vscodeUrl}
          className="w-full h-full border-0 bg-[#1e1e1e]"
          title="Official VS Code Web"
          allow="clipboard-read; clipboard-write; microphone; camera; midi; encrypted-media; autoplay; fullscreen"
        />
      </div>

    </div>
  );
}
