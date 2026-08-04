import React, { useState } from "react";
import { 
  FileCode, Play, Terminal, Folder, Search, GitBranch, Settings, 
  Plus, X, Copy, Check, Sparkles, RefreshCw, FileText, Code2, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface VirtualFile {
  name: string;
  language: string;
  content: string;
}

const DEFAULT_FILES: Record<string, VirtualFile> = {
  "App.tsx": {
    name: "App.tsx",
    language: "typescript",
    content: `import React, { useState } from 'react';

export default function VyntyraApp() {
  const [status, setStatus] = useState("Vyntyra Enterprise AI Operational");

  return (
    <div className="p-8 bg-slate-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold text-emerald-400">Vyntyra Connect — IDE Workspace</h1>
      <p className="mt-2 text-slate-300">Status: {status}</p>
      <button 
        onClick={() => setStatus("Compilation Success & Deployed")}
        className="mt-4 px-4 py-2 bg-emerald-600 rounded font-semibold text-xs hover:bg-emerald-500"
      >
        Run Diagnostics
      </button>
    </div>
  );
}`,
  },
  "index.css": {
    name: "index.css",
    language: "css",
    content: `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Inter', sans-serif;
  background-color: #0f172a;
  color: #f8fafc;
}`,
  },
  "api.ts": {
    name: "api.ts",
    language: "typescript",
    content: `// Vyntyra Server Function SDK
export async function fetchUserData(userId: string) {
  const res = await fetch(\`/api/users/\${userId}\`);
  return res.json();
}`,
  },
  "README.md": {
    name: "README.md",
    language: "markdown",
    content: `# Vyntyra Intern Development Workspace
Welcome to your in-app VS Code IDE! 
You can edit files, run test scripts, inspect terminal outputs, and sync changes directly with your project repository.`,
  },
};

export function VSCodeIDEWindow() {
  const [files, setFiles] = useState<Record<string, VirtualFile>>(DEFAULT_FILES);
  const [activeFileName, setActiveFileName] = useState<string>("App.tsx");
  const [openTabs, setOpenTabs] = useState<string[]>(["App.tsx", "index.css"]);
  const [activeSidebar, setActiveSidebar] = useState<"explorer" | "search" | "git" | "settings">("explorer");
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "vyntyra-ide@intern-workspace:~$ npm run dev",
    "> vyntyra-connect@2.0.0 dev",
    "> vite --host 0.0.0.0 --port 3000",
    "  VITE v5.4.2  ready in 240 ms",
    "  ➜  Local:   http://localhost:3000/",
    "  ➜  Network: http://192.168.1.100:3000/",
    "  ➜  press h + enter to show help",
  ]);
  const [termInput, setTermInput] = useState("");
  const [copied, setCopied] = useState(false);

  const activeFile = files[activeFileName] || files["App.tsx"];

  const handleContentChange = (newContent: string) => {
    setFiles((prev) => ({
      ...prev,
      [activeFileName]: { ...prev[activeFileName], content: newContent },
    }));
  };

  const handleTabClick = (fileName: string) => {
    setActiveFileName(fileName);
    if (!openTabs.includes(fileName)) {
      setOpenTabs([...openTabs, fileName]);
    }
  };

  const handleTabClose = (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextTabs = openTabs.filter((t) => t !== fileName);
    setOpenTabs(nextTabs);
    if (activeFileName === fileName && nextTabs.length > 0) {
      setActiveFileName(nextTabs[nextTabs.length - 1]);
    }
  };

  const handleCreateFile = () => {
    const name = prompt("Enter new filename (e.g. utils.ts):");
    if (name && !files[name]) {
      const newFile: VirtualFile = { name, language: "typescript", content: `// ${name}\n` };
      setFiles({ ...files, [name]: newFile });
      setOpenTabs([...openTabs, name]);
      setActiveFileName(name);
    }
  };

  const handleRunCode = () => {
    setTerminalOpen(true);
    setTerminalLogs((prev) => [
      ...prev,
      `vyntyra-ide@intern-workspace:~$ node ${activeFileName}`,
      `[BUILD SUCCESS] Compiled ${activeFileName} successfully in 42ms.`,
      `[OUTPUT] ${activeFile.content.includes("console.log") ? "Console logs executed." : "Code evaluated cleanly without runtime errors."}`,
    ]);
  };

  const handleTermSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!termInput.trim()) return;
    const cmd = termInput.trim();
    let res = `Command not recognized: ${cmd}. Type 'help' for available commands.`;
    if (cmd === "clear") {
      setTerminalLogs([]);
      setTermInput("");
      return;
    }
    if (cmd === "help") res = "Available commands: npm run dev, git status, node script.js, clear, help";
    if (cmd === "git status") res = "On branch main\nYour branch is up to date with 'origin/main'.\nnothing to commit, working tree clean";
    if (cmd === "npm run dev") res = "Vite dev server restarted at http://localhost:3000/";

    setTerminalLogs((prev) => [...prev, `vyntyra-ide@intern-workspace:~$ ${cmd}`, res]);
    setTermInput("");
  };

  const lines = activeFile.content.split("\n");

  return (
    <div className="w-full h-[85vh] bg-[#1e1e1e] text-[#cccccc] rounded-2xl overflow-hidden shadow-2xl flex border border-slate-800 font-sans">
      
      {/* 1. VS Code Left Activity Bar */}
      <div className="w-12 bg-[#333333] flex flex-col items-center py-3 gap-5 shrink-0 border-r border-[#252526]">
        <button
          onClick={() => setActiveSidebar("explorer")}
          className={`p-2 rounded transition-colors ${activeSidebar === "explorer" ? "text-white bg-[#37373d]" : "text-slate-400 hover:text-white"}`}
          title="Explorer"
        >
          <Folder className="h-5 w-5" />
        </button>
        <button
          onClick={() => setActiveSidebar("search")}
          className={`p-2 rounded transition-colors ${activeSidebar === "search" ? "text-white bg-[#37373d]" : "text-slate-400 hover:text-white"}`}
          title="Search"
        >
          <Search className="h-5 w-5" />
        </button>
        <button
          onClick={() => setActiveSidebar("git")}
          className={`p-2 rounded transition-colors ${activeSidebar === "git" ? "text-white bg-[#37373d]" : "text-slate-400 hover:text-white"}`}
          title="Source Control"
        >
          <GitBranch className="h-5 w-5" />
        </button>
        <div className="mt-auto flex flex-col gap-3">
          <button
            onClick={() => setActiveSidebar("settings")}
            className={`p-2 rounded transition-colors ${activeSidebar === "settings" ? "text-white bg-[#37373d]" : "text-slate-400 hover:text-white"}`}
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 2. Primary Sidebar (Explorer / Search) */}
      <div className="w-60 bg-[#252526] border-r border-[#1e1e1e] flex flex-col shrink-0">
        <div className="p-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-[#333333]">
          <span>Explorer: Vyntyra Workspace</span>
          <button onClick={handleCreateFile} className="hover:text-white p-1 rounded" title="New File">
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="p-2 space-y-1 overflow-y-auto flex-1 text-xs">
          <div className="text-slate-500 font-bold uppercase text-[10px] px-2 py-1">Files</div>
          {Object.keys(files).map((fileName) => (
            <button
              key={fileName}
              onClick={() => handleTabClick(fileName)}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded transition-colors text-left ${
                activeFileName === fileName ? "bg-[#37373d] text-white font-medium" : "text-slate-400 hover:bg-[#2a2d2e] hover:text-slate-200"
              }`}
            >
              <FileCode className={`h-4 w-4 shrink-0 ${fileName.endsWith(".tsx") ? "text-blue-400" : fileName.endsWith(".css") ? "text-sky-300" : "text-amber-400"}`} />
              <span className="truncate">{fileName}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Main Editor Area */}
      <div className="flex-1 flex flex-col bg-[#1e1e1e] overflow-hidden">
        
        {/* Editor Tabs & Control Toolbar */}
        <div className="bg-[#252526] flex items-center justify-between border-b border-[#333333] shrink-0">
          <div className="flex items-center overflow-x-auto scrollbar-none">
            {openTabs.map((tab) => (
              <div
                key={tab}
                onClick={() => setActiveFileName(tab)}
                className={`flex items-center gap-2 px-3 py-2 text-xs border-r border-[#333333] cursor-pointer transition-colors ${
                  activeFileName === tab ? "bg-[#1e1e1e] text-white border-t-2 border-t-blue-500" : "bg-[#2d2d2d] text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileCode className="h-3.5 w-3.5 text-blue-400" />
                <span>{tab}</span>
                <button onClick={(e) => handleTabClose(tab, e)} className="hover:text-red-400 rounded p-0.5 ml-1">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 px-3">
            <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-1 px-3" onClick={handleRunCode}>
              <Play className="h-3.5 w-3.5 fill-current" /> Run Code
            </Button>
            <button
              onClick={() => setTerminalOpen(!terminalOpen)}
              className={`p-1.5 rounded transition-colors ${terminalOpen ? "bg-[#37373d] text-white" : "text-slate-400 hover:text-white"}`}
              title="Toggle Terminal"
            >
              <Terminal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Code Viewport with Line Numbers */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* Line Numbers */}
          <div className="w-12 bg-[#1e1e1e] text-[#858585] text-xs font-mono py-3 select-none text-right pr-3 border-r border-[#2d2d2d] shrink-0">
            {lines.map((_, i) => (
              <div key={i} className="leading-6">{i + 1}</div>
            ))}
          </div>

          {/* Code Textarea */}
          <div className="flex-1 overflow-auto bg-[#1e1e1e] p-3">
            <textarea
              value={activeFile.content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full h-full bg-transparent text-[#d4d4d4] font-mono text-xs leading-6 outline-none resize-none whitespace-pre"
              spellCheck={false}
            />
          </div>
        </div>

        {/* 4. Bottom Terminal & Output Console */}
        {terminalOpen && (
          <div className="h-48 bg-[#181818] border-t border-[#333333] flex flex-col font-mono text-xs shrink-0">
            <div className="px-4 py-1.5 bg-[#252526] flex items-center justify-between border-b border-[#333333]">
              <div className="flex items-center gap-4 text-[11px] text-slate-400">
                <span className="text-white font-bold flex items-center gap-1"><Terminal className="h-3.5 w-3.5" /> TERMINAL</span>
                <span>PROBLEMS (0)</span>
                <span>OUTPUT</span>
              </div>
              <button onClick={() => setTerminalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-1 text-slate-300">
              {terminalLogs.map((log, idx) => (
                <div key={idx} className={log.startsWith("vyntyra-ide") ? "text-emerald-400 font-bold" : ""}>
                  {log}
                </div>
              ))}
              <form onSubmit={handleTermSubmit} className="flex items-center gap-2 text-emerald-400 mt-2">
                <span>vyntyra-ide@intern-workspace:~$</span>
                <input
                  type="text"
                  value={termInput}
                  onChange={(e) => setTermInput(e.target.value)}
                  className="flex-1 bg-transparent text-white outline-none font-mono text-xs"
                  placeholder="Type 'npm run dev' or 'help'..."
                />
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
