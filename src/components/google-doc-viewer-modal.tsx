import React, { useState } from "react";
import { FileText, Table, ExternalLink, Download, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocViewerModalProps {
  url: string;
  title?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function GoogleDocViewerModal({ url, title, isOpen, onClose }: DocViewerModalProps) {
  const [activeMode, setActiveMode] = useState<"google" | "sheet">(() => {
    if (url.endsWith(".xlsx") || url.endsWith(".xls") || url.endsWith(".csv") || url.includes("spreadsheet") || url.includes("excel")) {
      return "sheet";
    }
    return "google";
  });

  // Interactive Tabular Spreadsheet State
  const [columns] = useState<string[]>(["ID", "Task / Item Name", "Assigned To", "Status", "Progress", "Budget / Hours"]);
  const [rows, setRows] = useState<string[][]>([]);

  if (!isOpen) return null;

  // Format Google Embed URL
  const getEmbedUrl = (rawUrl: string) => {
    if (!rawUrl) return "";
    if (rawUrl.includes("docs.google.com") || rawUrl.includes("sheets.google.com")) {
      if (rawUrl.includes("/edit")) return rawUrl.replace("/edit", "/preview");
      return rawUrl;
    }
    return `https://docs.google.com/gview?url=${encodeURIComponent(rawUrl)}&embedded=true`;
  };

  const handleCellChange = (rowIndex: number, colIndex: number, val: string) => {
    const nextRows = [...rows];
    nextRows[rowIndex][colIndex] = val;
    setRows(nextRows);
  };

  const handleAddRow = () => {
    const newRow = columns.map((_, i) => (i === 0 ? `${100 + rows.length + 1}` : ""));
    setRows([...rows, newRow]);
  };

  const handleDeleteRow = (idx: number) => {
    setRows(rows.filter((_, i) => i !== idx));
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + [columns.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title || "document"}_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              {activeMode === "sheet" ? <Table className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
            </div>
            <div>
              <h3 className="font-semibold text-sm leading-tight text-slate-100">{title || "Inbuilt Document & Spreadsheet Viewer"}</h3>
              <p className="text-[11px] text-slate-400 font-mono truncate max-w-md">{url}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-800 p-1 rounded-lg flex items-center gap-1 border border-slate-700">
              <button
                onClick={() => setActiveMode("google")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${activeMode === "google" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-400 hover:text-white"}`}
              >
                Google Docs / Embedded
              </button>
              <button
                onClick={() => setActiveMode("sheet")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${activeMode === "sheet" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-400 hover:text-white"}`}
              >
                Interactive Tabular Sheet
              </button>
            </div>

            <a href={url} target="_blank" rel="noreferrer">
              <Button size="sm" variant="ghost" className="h-8 text-xs text-slate-300 hover:text-white hover:bg-slate-800">
                <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open Direct
              </Button>
            </a>

            <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 bg-slate-100 overflow-hidden relative flex flex-col">
          {activeMode === "google" ? (
            <iframe
              src={getEmbedUrl(url)}
              className="w-full h-full border-0 bg-white"
              title="Google Document / Sheet Viewer"
              allow="fullscreen"
            />
          ) : (
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
              {/* Spreadsheet Actions Bar */}
              <div className="p-3 border-b bg-slate-50 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleAddRow}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Row
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs text-slate-700" onClick={handleExportCSV}>
                    <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
                  </Button>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  Interactive Live Cell Editing ({rows.length} rows, {columns.length} columns)
                </div>
              </div>

              {/* Editable Spreadsheet Table */}
              <div className="flex-1 overflow-auto p-4">
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-900 text-white font-mono uppercase text-[11px] sticky top-0 z-10">
                      <tr>
                        <th className="p-3 border-r border-slate-800 w-12 text-center">#</th>
                        {columns.map((col, ci) => (
                          <th key={ci} className="p-3 border-r border-slate-800 font-semibold">{col}</th>
                        ))}
                        <th className="p-3 w-16 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={columns.length + 2} className="p-8 text-center text-slate-400 text-xs">
                            No spreadsheet rows added yet. Click "+ Add Row" above to insert data.
                          </td>
                        </tr>
                      ) : (
                        rows.map((row, ri) => (
                        <tr key={ri} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono text-center text-slate-400 font-bold border-r bg-slate-50/50">{ri + 1}</td>
                          {row.map((cell, ci) => (
                            <td key={ci} className="p-1 border-r border-slate-200">
                              <input
                                type="text"
                                className="w-full px-2 py-1.5 rounded text-xs bg-transparent focus:bg-emerald-50/50 focus:ring-1 focus:ring-emerald-500 outline-none font-sans"
                                value={cell}
                                onChange={(e) => handleCellChange(ri, ci, e.target.value)}
                              />
                            </td>
                          ))}
                          <td className="p-2 text-center">
                            <button
                              onClick={() => handleDeleteRow(ri)}
                              className="h-7 w-7 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 inline-flex items-center justify-center transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      )))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
