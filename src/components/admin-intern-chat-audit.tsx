import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  MessageSquare, ShieldCheck, ShieldAlert, AlertTriangle, Trash2,
  Search, Users, Filter, RefreshCw, Loader2, Eye, ExternalLink, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  adminListAllChatsFn,
  adminDeleteChatMessageFn,
  type ChatMessage,
  type ModerationLog
} from "@/lib/intern-chat.functions";

export function AdminInternChatAuditView() {
  const qc = useQueryClient();
  const fetchAllChats = useServerFn(adminListAllChatsFn);
  const doDeleteMessage = useServerFn(adminDeleteChatMessageFn);

  const [activeTab, setActiveTab] = useState<"messages" | "moderation">("messages");
  const [searchQuery, setSearchQuery] = useState("");

  const chatsQuery = useQuery({
    queryKey: ["admin-intern-chats"],
    queryFn: () => fetchAllChats(),
    refetchInterval: 10000
  });

  const data = chatsQuery.data || {
    totalMessages: 0,
    recentMessages: [],
    moderationLogs: [],
    activeChannels: [],
    activeDMs: []
  };

  const messages: ChatMessage[] = data.recentMessages || [];
  const moderationLogs: ModerationLog[] = data.moderationLogs || [];

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this message as Super Admin?")) return;
    try {
      await doDeleteMessage({ data: { messageId } });
      toast.success("Message removed from workspace.");
      qc.invalidateQueries({ queryKey: ["admin-intern-chats"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete message");
    }
  };

  const filteredMessages = messages.filter(m => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.content.toLowerCase().includes(q) ||
      m.sender_name.toLowerCase().includes(q) ||
      (m.sender_email && m.sender_email.toLowerCase().includes(q))
    );
  });

  const filteredModeration = moderationLogs.filter(log => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.sender_name.toLowerCase().includes(q) ||
      log.blocked_content.toLowerCase().includes(q) ||
      log.violation_type.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* ─── Header & Stats Banner ─── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black shadow-xs">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Vyntyra Chat Audit &amp; Moderation Hub
                </h1>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-white uppercase tracking-wider">
                  Super Admin Master
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Real-time monitoring, D1 storage audit, and automated AI safety enforcement across all intern messaging channels.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => qc.invalidateQueries({ queryKey: ["admin-intern-chats"] })}
            className="text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50 gap-2 h-9 rounded-xl"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${chatsQuery.isFetching ? "animate-spin" : ""}`} />
            <span>Refresh Logs</span>
          </Button>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Recorded Messages</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{messages.length}</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active DM / Channel Threads</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{data.activeDMs.length + data.activeChannels.length}</div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80">
            <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700">AI Blocked Violations</div>
            <div className="text-2xl font-bold text-rose-900 mt-1">{moderationLogs.length}</div>
          </div>
        </div>
      </div>

      {/* ─── Filter Tabs & Search Bar ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("messages")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "messages"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>All Messages ({messages.length})</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab("moderation")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "moderation"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span className="flex items-center gap-2">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>AI Blocked Violations ({moderationLogs.length})</span>
            </span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by sender, keyword..."
            className="pl-9 h-9 text-xs rounded-xl bg-white border-slate-200"
          />
        </div>
      </div>

      {/* ─── TAB 1: ALL MESSAGES AUDIT LOG ─── */}
      {activeTab === "messages" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="px-5 py-3.5">Sender</th>
                  <th className="px-5 py-3.5">Room / Type</th>
                  <th className="px-5 py-3.5">Message Content</th>
                  <th className="px-5 py-3.5">Date &amp; Time</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMessages.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400 font-medium">
                      No chat messages found in audit logs.
                    </td>
                  </tr>
                ) : (
                  filteredMessages.map((msg) => (
                    <tr key={msg.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{msg.sender_name}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[160px]">{msg.sender_email || "intern"}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                          {msg.room_id.startsWith("ai_") ? "AI Copilot" : msg.room_id.startsWith("channel_") ? "General Channel" : "Direct Message"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 max-w-md">
                        {msg.file_url ? (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 truncate">{msg.content}</span>
                            <a
                              href={msg.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1 text-[11px]"
                            >
                              <span>View file</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        ) : (
                          <div className="text-slate-800 line-clamp-2">{msg.content}</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(msg.created_at).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="text-rose-600 hover:bg-rose-50 h-8 px-2.5 rounded-xl font-bold gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 2: AI MODERATION BLOCKED VIOLATIONS ─── */}
      {activeTab === "moderation" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-rose-50/50 border-b border-rose-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-rose-800 font-bold">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <span>Messages in this table were quarantined and prevented from reaching any recipient.</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="px-5 py-3.5">Offending Sender</th>
                  <th className="px-5 py-3.5">Blocked Content</th>
                  <th className="px-5 py-3.5">Flagged Reason</th>
                  <th className="px-5 py-3.5">Action Taken</th>
                  <th className="px-5 py-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredModeration.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400 font-medium">
                      No safety policy violations logged. Workspace communication is clean.
                    </td>
                  </tr>
                ) : (
                  filteredModeration.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{log.sender_name}</div>
                        <div className="text-[10px] text-slate-400">{log.sender_email || "intern"}</div>
                      </td>
                      <td className="px-5 py-3.5 max-w-xs font-mono text-[11px] text-rose-900 bg-rose-50/50 rounded-lg p-2 m-1">
                        "{log.blocked_content}"
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          {log.violation_type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Blocked Before Delivery
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
