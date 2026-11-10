import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Send, Paperclip, Smile, Search, Sparkles,
  Bot, Users, User, ShieldCheck, Check, CheckCheck, Clock,
  Image as ImageIcon, FileText, Download, ExternalLink, X,
  AlertTriangle, Info, ArrowLeft, RefreshCw, Loader2, Heart,
  ThumbsUp, Flame, PartyPopper, Rocket, Laptop, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  listChatInternsFn,
  getOrCreateRoomFn,
  getChatMessagesFn,
  sendChatMessageFn,
  askVyntyraChatAiFn,
  updateChatPresenceFn,
  type ChatMessage,
  type ChatRoom,
  type SafeInternProfile
} from "@/lib/intern-chat.functions";

interface InternChatViewProps {
  currentUserId: string;
  currentUserName: string;
  currentUserEmail?: string;
  currentUserAvatar?: string;
  onNavigateTab?: (tabId: string) => void;
}

const GENERAL_ROOM_ID = "channel_general_community";

const QUICK_EMOJIS = ["👍", "❤️", "🔥", "🎉", "🚀", "👏", "😊", "💻", "✨", "🙏"];

export function InternChatView({
  currentUserId,
  currentUserName,
  currentUserEmail,
  currentUserAvatar,
  onNavigateTab
}: InternChatViewProps) {
  const qc = useQueryClient();

  // Server functions
  const fetchInterns = useServerFn(listChatInternsFn);
  const doCreateRoom = useServerFn(getOrCreateRoomFn);
  const fetchMessages = useServerFn(getChatMessagesFn);
  const doSendMessage = useServerFn(sendChatMessageFn);
  const doAskAi = useServerFn(askVyntyraChatAiFn);
  const doUpdatePresence = useServerFn(updateChatPresenceFn);

  // States
  const [selectedContact, setSelectedContact] = useState<SafeInternProfile | null>(null);
  const [activeRoomType, setActiveRoomType] = useState<"channel" | "direct" | "ai">("channel");
  const [activeRoomId, setActiveRoomId] = useState<string>(GENERAL_ROOM_ID);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<SafeInternProfile | null>(null);
  const [enlargedImageUrl, setEnlargedImageUrl] = useState<string | null>(null);
  const [typingTimer, setTypingTimer] = useState<any>(null);
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch Interns Directory
  const internsQuery = useQuery({
    queryKey: ["chat-interns"],
    queryFn: () => fetchInterns(),
    refetchInterval: 30000
  });
  const interns: SafeInternProfile[] = internsQuery.data || [];

  // Filtered interns list
  const filteredInterns = interns.filter(i => {
    if (i.id === currentUserId) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      i.full_name.toLowerCase().includes(q) ||
      i.intern_id.toLowerCase().includes(q) ||
      i.domain.toLowerCase().includes(q) ||
      i.stream.toLowerCase().includes(q)
    );
  });

  // 2. Fetch Active Room Messages (Real-time polling every 2.5s for instant snappy feel)
  const messagesQuery = useQuery({
    queryKey: ["chat-messages", activeRoomId],
    queryFn: () => fetchMessages({ data: { roomId: activeRoomId, limit: 100 } }),
    refetchInterval: 2500,
    enabled: Boolean(activeRoomId)
  });
  const messages: ChatMessage[] = messagesQuery.data || [];

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isAiThinking]);

  // Presence Heartbeat
  useEffect(() => {
    const sendHeartbeat = async () => {
      try {
        await doUpdatePresence({
          data: {
            userId: currentUserId,
            userName: currentUserName,
            isOnline: true
          }
        });
      } catch (e) {
        // Silently ignore
      }
    };
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 45000);
    return () => clearInterval(interval);
  }, [currentUserId, currentUserName]);

  // Switch Conversation Handler
  const handleSelectContact = async (intern: SafeInternProfile) => {
    setSelectedContact(intern);
    setActiveRoomType("direct");
    try {
      const room = await doCreateRoom({
        data: {
          currentUserId,
          otherUserId: intern.id,
          type: "direct"
        }
      });
      setActiveRoomId(room.id);
    } catch (err: any) {
      toast.error("Failed to connect to chat room");
    }
  };

  const handleSelectGeneral = () => {
    setSelectedContact(null);
    setActiveRoomType("channel");
    setActiveRoomId(GENERAL_ROOM_ID);
  };

  const handleSelectAi = () => {
    setSelectedContact(null);
    setActiveRoomType("ai");
    setActiveRoomId(`ai_copilot_${currentUserId}`);
  };

  // Send Message Dispatcher with AI Content Moderation
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanContent = inputText.trim();
    if (!cleanContent || isSending) return;

    setInputText("");
    setIsSending(true);

    // AI Copilot Mode
    if (activeRoomType === "ai") {
      setIsAiThinking(true);
      try {
        const res = await doAskAi({
          data: {
            prompt: cleanContent,
            internId: currentUserId,
            internName: currentUserName
          }
        });
        qc.invalidateQueries({ queryKey: ["chat-messages", activeRoomId] });
      } catch (err: any) {
        toast.error(err.message || "AI was unable to answer");
      } finally {
        setIsSending(false);
        setIsAiThinking(false);
      }
      return;
    }

    // Direct Intern or General Community Chat
    try {
      const res = await doSendMessage({
        data: {
          roomId: activeRoomId,
          senderId: currentUserId,
          senderName: currentUserName,
          senderEmail: currentUserEmail,
          senderAvatar: currentUserAvatar,
          receiverId: selectedContact?.id || undefined,
          content: cleanContent,
          messageType: cleanContent.startsWith("http://") || cleanContent.startsWith("https://") ? "url" : "text"
        }
      });

      if (res.blocked) {
        toast.error(res.reason, {
          duration: 6000,
          icon: <AlertTriangle className="h-5 w-5 text-rose-500" />
        });
      } else {
        qc.invalidateQueries({ queryKey: ["chat-messages", activeRoomId] });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to dispatch message");
    } finally {
      setIsSending(false);
    }
  };

  // File Upload Handler (Simulated instant safe cloud storage)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error("File exceeds 15MB upload limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const fileDataUrl = reader.result as string;
      const isImg = file.type.startsWith("image/");
      try {
        const res = await doSendMessage({
          data: {
            roomId: activeRoomId,
            senderId: currentUserId,
            senderName: currentUserName,
            senderEmail: currentUserEmail,
            senderAvatar: currentUserAvatar,
            receiverId: selectedContact?.id || undefined,
            content: `Sent an attachment: ${file.name}`,
            messageType: isImg ? "image" : "file",
            fileUrl: fileDataUrl,
            fileName: file.name,
            fileSize: file.size
          }
        });

        if (res.blocked) {
          toast.error(res.reason);
        } else {
          toast.success("Attachment sent!");
          qc.invalidateQueries({ queryKey: ["chat-messages", activeRoomId] });
        }
      } catch (err: any) {
        toast.error("Failed to send attachment");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-4">
      {/* ─── Top Brand & Capabilities Header ─── */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black shadow-md shadow-slate-900/10">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Vyntyra Chat
              </h1>
              <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-black text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs animate-pulse">
                BETA
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Secure peer-to-peer workspace messaging with Cloudflare D1 &amp; automated AI safety filtering.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            size="sm"
            onClick={handleSelectAi}
            className="flex-1 sm:flex-none h-9 px-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs gap-1.5 shadow-xs cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Ask Vyntyra AI</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleSelectGeneral}
            className="flex-1 sm:flex-none h-9 px-3.5 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs gap-1.5 cursor-pointer"
          >
            <Users className="h-3.5 w-3.5 text-slate-500" />
            <span>Intern Lounge</span>
          </Button>
        </div>
      </div>

      {/* ─── Main Chat Glassmorphism Canvas ─── */}
      <div className="bg-white/80 backdrop-blur-2xl border border-slate-200/90 rounded-3xl shadow-lg overflow-hidden flex flex-col md:flex-row h-[720px] max-h-[82vh]">
        
        {/* ── LEFT COLUMN: DIRECTORY & SEARCH ── */}
        <div className="w-full md:w-80 border-r border-slate-200/80 flex flex-col shrink-0 bg-slate-50/50">
          {/* Search Box */}
          <div className="p-3.5 border-b border-slate-200/80 bg-white/60">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search intern by name, ID, domain..."
                className="pl-9 h-9 text-xs rounded-xl bg-white border-slate-200 focus:border-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Directory Rail */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
            {/* Pinned 1: Ask Vyntyra Chat AI */}
            <button
              onClick={handleSelectAi}
              className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer flex items-center gap-3 ${
                activeRoomType === "ai"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-gradient-to-r from-purple-50 to-indigo-50/60 hover:from-purple-100 hover:to-indigo-100 border border-purple-200/80 text-slate-900"
              }`}
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                <Sparkles className="h-5 w-5 text-amber-300" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs truncate">Ask Vyntyra AI</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                    activeRoomType === "ai" ? "bg-white/20 text-white" : "bg-purple-100 text-purple-800"
                  }`}>
                    OpenRouter
                  </span>
                </div>
                <p className={`text-[11px] truncate mt-0.5 ${activeRoomType === "ai" ? "text-slate-300" : "text-slate-500"}`}>
                  Tasks, deadlines, coding help...
                </p>
              </div>
            </button>

            {/* Pinned 2: Vyntyra Community Lounge */}
            <button
              onClick={handleSelectGeneral}
              className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer flex items-center gap-3 ${
                activeRoomType === "channel"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "hover:bg-slate-100/80 text-slate-800"
              }`}
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                activeRoomType === "channel" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}>
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs truncate">Intern Community Lounge</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                </div>
                <p className={`text-[11px] truncate mt-0.5 ${activeRoomType === "channel" ? "text-slate-300" : "text-slate-500"}`}>
                  General channel for all interns
                </p>
              </div>
            </button>

            <div className="px-2 pt-3 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Direct Messages ({filteredInterns.length})
            </div>

            {/* Interns List */}
            {filteredInterns.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 font-medium">
                No matching interns found.
              </div>
            ) : (
              filteredInterns.map((intern) => {
                const isSelected = selectedContact?.id === intern.id;
                return (
                  <button
                    key={intern.id}
                    onClick={() => handleSelectContact(intern)}
                    className={`w-full text-left p-2.5 rounded-2xl transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? "bg-slate-900 text-white shadow-sm"
                        : "hover:bg-slate-100 text-slate-800"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="h-10 w-10 rounded-xl bg-slate-200 flex items-center justify-center font-extrabold text-sm overflow-hidden text-slate-700 border border-slate-300/50">
                        {intern.avatar_url ? (
                          <img src={intern.avatar_url} alt={intern.full_name} className="h-full w-full object-cover" />
                        ) : (
                          intern.full_name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      {intern.is_online && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs truncate">{intern.full_name}</span>
                        <span className={`text-[9px] font-mono font-bold ${
                          isSelected ? "text-slate-300" : "text-slate-400"
                        }`}>
                          {intern.intern_id}
                        </span>
                      </div>
                      <p className={`text-[11px] truncate mt-0.5 ${
                        isSelected ? "text-slate-300" : "text-slate-500"
                      }`}>
                        {intern.domain}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: ACTIVE CHAT VIEWPORT ── */}
        <div className="flex-1 flex flex-col min-w-0 bg-white/70">
          
          {/* Chat Header */}
          <div className="h-16 px-5 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-white/90">
            <div className="flex items-center gap-3 min-w-0">
              {activeRoomType === "ai" ? (
                <>
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                    <Sparkles className="h-5 w-5 text-amber-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                        Ask Vyntyra Chat AI
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-purple-100 text-purple-800">
                        Smart Copilot
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Trained on your active tasks, deadlines, sprint guidelines &amp; external technical knowledge.
                    </p>
                  </div>
                </>
              ) : activeRoomType === "channel" ? (
                <>
                  <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                        Vyntyra Intern Community Lounge
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {interns.length} Interns
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Official peer-to-peer workspace channel. All communications are verified.
                    </p>
                  </div>
                </>
              ) : (
                selectedContact && (
                  <>
                    <button
                      onClick={() => setViewingProfile(selectedContact)}
                      className="relative shrink-0 hover:opacity-85 transition-opacity cursor-pointer"
                      title="Click to view profile (WhatsApp style)"
                    >
                      <div className="h-10 w-10 rounded-xl bg-slate-200 flex items-center justify-center font-extrabold text-sm overflow-hidden text-slate-700 border border-slate-300">
                        {selectedContact.avatar_url ? (
                          <img src={selectedContact.avatar_url} alt={selectedContact.full_name} className="h-full w-full object-cover" />
                        ) : (
                          selectedContact.full_name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      {selectedContact.is_online && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingProfile(selectedContact)}
                          className="font-extrabold text-sm text-slate-900 leading-tight hover:underline cursor-pointer truncate"
                        >
                          {selectedContact.full_name}
                        </button>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.2 rounded-full bg-slate-100 text-slate-600">
                          {selectedContact.intern_id}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="truncate">{selectedContact.domain}</span>
                        <span>·</span>
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active now
                        </span>
                      </div>
                    </div>
                  </>
                )
              )}
            </div>

            {/* Profile Action button */}
            {selectedContact && activeRoomType === "direct" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewingProfile(selectedContact)}
                className="text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-100 gap-1.5 rounded-xl cursor-pointer"
              >
                <User className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">View Profile</span>
              </Button>
            )}
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin bg-slate-50/30">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div className="max-w-xs space-y-1">
                  <div className="font-bold text-sm text-slate-800">No messages yet</div>
                  <p className="text-xs text-slate-500">
                    {activeRoomType === "ai"
                      ? "Ask Vyntyra AI any question about your internship sprint, task deliverables, or software engineering!"
                      : "Start the conversation! Say hello, ask for peer review, or share project insights."}
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === currentUserId;
                const isAi = msg.sender_id === "vyntyra_ai_bot" || msg.message_type === "ai";

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    {!isMe && !isAi && (
                      <span className="text-[10px] font-bold text-slate-400 mb-1 px-1">
                        {msg.sender_name}
                      </span>
                    )}

                    <div
                      className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                        isMe
                          ? "bg-slate-900 text-white rounded-tr-xs"
                          : isAi
                          ? "bg-gradient-to-br from-purple-50/90 to-indigo-50/90 border border-purple-200/80 text-slate-900 rounded-tl-xs"
                          : "bg-white border border-slate-200/90 text-slate-900 rounded-tl-xs"
                      }`}
                    >
                      {/* AI Header Badge inside bubble */}
                      {isAi && (
                        <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-purple-200/60 font-bold text-[11px] text-purple-900">
                          <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                          <span>Vyntyra Chat AI</span>
                        </div>
                      )}

                      {/* Image Preview */}
                      {msg.message_type === "image" && msg.file_url && (
                        <div className="mb-2 rounded-xl overflow-hidden cursor-pointer" onClick={() => setEnlargedImageUrl(msg.file_url || null)}>
                          <img src={msg.file_url} alt="Shared file" className="max-h-60 rounded-xl object-cover hover:scale-[1.02] transition-transform" />
                        </div>
                      )}

                      {/* File Download Preview */}
                      {msg.message_type === "file" && msg.file_url && (
                        <div className="mb-2 p-2.5 rounded-xl bg-slate-100/80 border border-slate-200 flex items-center justify-between gap-3 text-slate-800">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-4 w-4 text-slate-600 shrink-0" />
                            <span className="truncate font-semibold">{msg.file_name || "Attachment"}</span>
                          </div>
                          <a
                            href={msg.file_url}
                            download={msg.file_name || "download"}
                            className="p-1 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors"
                            title="Download file"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      )}

                      {/* Content Body */}
                      {isAi ? (
                        <div className="prose prose-xs max-w-none text-slate-900">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : msg.message_type === "url" ? (
                        <a
                          href={msg.content}
                          target="_blank"
                          rel="noreferrer"
                          className="underline flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 break-all"
                        >
                          <span>{msg.content}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ) : (
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      )}

                      {/* Timestamp */}
                      <div className={`text-[9px] font-mono mt-1.5 flex items-center gap-1 justify-end ${
                        isMe ? "text-slate-400" : "text-slate-400"
                      }`}>
                        <span>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {isMe && <CheckCheck className="h-3 w-3 text-emerald-400" />}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}

            {/* AI Thinking Animation */}
            {isAiThinking && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs w-fit"
              >
                <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                <span className="font-bold">Vyntyra AI is analyzing and composing answer...</span>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reaction Bar */}
          <div className="px-4 py-1.5 bg-white/60 border-t border-slate-200/60 flex items-center gap-1 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
              React:
            </span>
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setInputText((prev) => prev + " " + emoji)}
                className="h-7 w-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-sm transition-transform active:scale-125 cursor-pointer shrink-0"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Input & Dispatch Bar */}
          <form onSubmit={handleSendMessage} className="p-3 sm:p-4 bg-white border-t border-slate-200/80 flex items-center gap-2">
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,.pdf,.docx,.txt,.zip"
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="h-10 w-10 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer shrink-0"
              title="Attach File or Image"
            >
              <Paperclip className="h-4.5 w-4.5" />
            </Button>

            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                activeRoomType === "ai"
                  ? "Ask Vyntyra AI about tasks, deadlines, code architecture, or guidelines..."
                  : `Message ${selectedContact ? selectedContact.full_name.split(" ")[0] : "the community"}...`
              }
              className="h-10 text-xs rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:border-slate-400 flex-1 min-w-0"
            />

            <Button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs gap-1.5 shadow-xs cursor-pointer shrink-0"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span className="hidden sm:inline">Send</span>
                  <Send className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* ─── WHATSAPP-STYLE SAFE INTERN PROFILE MODAL (Strictly safe fields) ─── */}
      <Dialog open={Boolean(viewingProfile)} onOpenChange={(open) => !open && setViewingProfile(null)}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-3xl bg-white border-slate-200 shadow-2xl">
          {viewingProfile && (
            <div>
              {/* Profile Header Canvas */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white text-center relative">
                <button
                  onClick={() => setViewingProfile(null)}
                  className="absolute right-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="mx-auto h-24 w-24 rounded-3xl bg-slate-700 border-4 border-white/20 shadow-xl overflow-hidden flex items-center justify-center text-3xl font-black mb-3">
                  {viewingProfile.avatar_url ? (
                    <img src={viewingProfile.avatar_url} alt={viewingProfile.full_name} className="h-full w-full object-cover" />
                  ) : (
                    viewingProfile.full_name.slice(0, 2).toUpperCase()
                  )}
                </div>

                <h3 className="text-xl font-black tracking-tight">{viewingProfile.full_name}</h3>
                <p className="text-xs text-slate-300 font-mono mt-0.5">{viewingProfile.intern_id}</p>
              </div>

              {/* Safe Information Grid (WhatsApp layout) */}
              <div className="p-6 space-y-4 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Official Email</span>
                  <div className="font-semibold text-slate-900">{viewingProfile.email}</div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Domain Track</span>
                    <div className="font-semibold text-slate-900">{viewingProfile.domain}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Internship Period</span>
                    <div className="font-semibold text-slate-900">{viewingProfile.internship_period}</div>
                  </div>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Stream / University</span>
                  <div className="font-semibold text-slate-900">{viewingProfile.stream}</div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <Button
                    onClick={() => {
                      handleSelectContact(viewingProfile);
                      setViewingProfile(null);
                    }}
                    className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs gap-2 cursor-pointer shadow-xs"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Start Direct Message</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── ENLARGED IMAGE VIEWER MODAL ─── */}
      <Dialog open={Boolean(enlargedImageUrl)} onOpenChange={() => setEnlargedImageUrl(null)}>
        <DialogContent className="max-w-3xl p-2 bg-black/90 border-0 rounded-2xl overflow-hidden flex items-center justify-center">
          {enlargedImageUrl && (
            <img src={enlargedImageUrl} alt="Enlarged view" className="max-h-[80vh] w-auto rounded-xl object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
