import React, { useMemo, useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { 
  Users, 
  Video, 
  Phone, 
  Mail, 
  MessageSquare, 
  ArrowRight, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface TeammateInfo {
  id?: string;
  full_name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  department?: string;
  domain?: string;
  role?: string;
  intern_id?: string;
}

interface TaskRichDescriptionProps {
  description: string;
  teamMembers?: (TeammateInfo | string)[];
  className?: string;
  compact?: boolean;
}

// Clean LaTeX symbols & fix unformatted pasted ChatGPT / Gemini text
export function formatTaskText(rawText: string): {
  cleanMarkdown: string;
  meetingUrl: string | null;
  parsedTeamNames: string[];
} {
  if (!rawText) return { cleanMarkdown: "", meetingUrl: null, parsedTeamNames: [] };

  let text = rawText;
  let meetingUrl: string | null = null;
  const parsedTeamNames: string[] = [];

  // 1. Extract [Meet: https://...] or raw Google Meet/Teams links
  const meetMatch = text.match(/\[Meet:\s*(https?:\/\/[^\s\]]+)\]/i) || 
                    text.match(/(https?:\/\/meet\.google\.com\/[a-z0-9-]+)/i) ||
                    text.match(/(https?:\/\/teams\.microsoft\.com\/[^\s\]]+)/i);
  if (meetMatch) {
    meetingUrl = meetMatch[1];
    text = text.replace(/\[Meet:\s*https?:\/\/[^\s\]]+\]/gi, "").trim();
  }

  // 2. Extract [👥 Team: Name 1, Name 2, ...] or [Team: Name 1, Name 2, ...]
  const teamMatch = text.match(/\[(?:👥\s*)?Team:\s*([^\]]+)\]/i);
  if (teamMatch) {
    const namesStr = teamMatch[1];
    namesStr.split(",").forEach(n => {
      const trimmed = n.trim();
      if (trimmed) parsedTeamNames.push(trimmed);
    });
    text = text.replace(/\[(?:👥\s*)?Team:\s*[^\]]+\]/gi, "").trim();
  }

  // 3. Replace LaTeX symbols with clean visual characters/arrows
  text = text
    .replace(/\$\\rightarrow\$/gi, " ➔ ")
    .replace(/\\rightarrow\b/gi, " ➔ ")
    .replace(/\$\\Rightarrow\$/gi, " ➔ ")
    .replace(/\\Rightarrow\b/gi, " ➔ ")
    .replace(/\$\\leftrightarrow\$/gi, " ↔ ")
    .replace(/\\leftrightarrow\b/gi, " ↔ ")
    .replace(/\$\\leftarrow\$/gi, " ⬅ ")
    .replace(/\\leftarrow\b/gi, " ⬅ ")
    .replace(/\$\\le\$/gi, " ≤ ")
    .replace(/\\le\b/gi, " ≤ ")
    .replace(/\$\\ge\$/gi, " ≥ ")
    .replace(/\\ge\b/gi, " ≥ ")
    .replace(/\$\\times\$/gi, " × ")
    .replace(/\\times\b/gi, " × ");

  // 4. Auto-structure squished numbered sections (e.g. "1. Problem ... 2. Workflow ... 3. Required ...")
  // Ensure "1. ", "2. ", "3. ", "4. " get heading breaks even if at start or mid-string
  if (/^\d+\.\s+[A-Z]/.test(text)) {
    text = "### " + text;
  }
  text = text.replace(/([^\n])\s*(\d+\.\s+[A-Z])/g, "$1\n\n### $2");

  // 5. Structure Screens ("Screen 1 (...", "Screen 2 (...", etc.)
  text = text.replace(/\b(Screen\s+\d+\s*\([^)]+\):?)/gi, "\n\n- **$1** ");

  // 6. Structure bold key labels like "Challenge:", "Primary Persona:", "Key Components:", "Visual Palette:"
  text = text
    .replace(/\b(Challenge|Primary Persona|Secondary Persona|Visual Palette|Key Components|Required Screens|Required 4-Screen Wireframes):\s*/gi, "\n  - **$1:** ");

  return {
    cleanMarkdown: text,
    meetingUrl,
    parsedTeamNames,
  };
}

export function TaskRichDescription({
  description,
  teamMembers = [],
  className = "",
  compact = false,
}: TaskRichDescriptionProps) {
  const { cleanMarkdown, meetingUrl, parsedTeamNames } = useMemo(
    () => formatTaskText(description || ""),
    [description]
  );

  const [fetchedProfiles, setFetchedProfiles] = useState<TeammateInfo[]>([]);

  // Combine passed team members and parsed names
  const rawTeammatesList = useMemo(() => {
    const list: TeammateInfo[] = [];
    const nameSet = new Set<string>();

    teamMembers.forEach(m => {
      if (typeof m === "string") {
        if (m.trim() && !nameSet.has(m.toLowerCase().trim())) {
          nameSet.add(m.toLowerCase().trim());
          list.push({ full_name: m.trim() });
        }
      } else if (m && m.full_name) {
        if (!nameSet.has(m.full_name.toLowerCase().trim())) {
          nameSet.add(m.full_name.toLowerCase().trim());
          list.push(m);
        }
      }
    });

    parsedTeamNames.forEach(name => {
      if (name.trim() && !nameSet.has(name.toLowerCase().trim())) {
        nameSet.add(name.toLowerCase().trim());
        list.push({ full_name: name.trim() });
      }
    });

    return list;
  }, [teamMembers, parsedTeamNames]);

  // Fetch full profile details (email, phone, avatar, domain) for teammates from DB if missing
  useEffect(() => {
    let isMounted = true;
    async function lookupTeammateProfiles() {
      if (rawTeammatesList.length === 0) return;

      const searchNames = rawTeammatesList.map(t => t.full_name).filter(Boolean);
      if (searchNames.length === 0) return;

      try {
        const { data: dbProfiles } = await supabase
          .from("profiles")
          .select("id, full_name, email, phone, avatar_url, department, domain, role, intern_id");

        if (dbProfiles && isMounted) {
          const profileMap = new Map<string, TeammateInfo>();
          dbProfiles.forEach(p => {
            if (p.full_name) profileMap.set(p.full_name.toLowerCase().trim(), p as TeammateInfo);
            if (p.email) profileMap.set(p.email.toLowerCase().trim(), p as TeammateInfo);
          });

          const enriched = rawTeammatesList.map(item => {
            const matched = profileMap.get(item.full_name.toLowerCase().trim()) || 
                            (item.email ? profileMap.get(item.email.toLowerCase().trim()) : null);
            return {
              ...item,
              ...(matched || {})
            };
          });

          setFetchedProfiles(enriched);
        }
      } catch (err) {
        console.warn("Failed to lookup teammate profiles:", err);
      }
    }

    lookupTeammateProfiles();
    return () => { isMounted = false; };
  }, [rawTeammatesList]);

  const displayTeammates = fetchedProfiles.length > 0 ? fetchedProfiles : rawTeammatesList;

  if (!description && displayTeammates.length === 0 && !meetingUrl) {
    return <span className="text-slate-400 italic text-xs">No description provided.</span>;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ── 1-CLICK MEETING SYNC BANNER ── */}
      {meetingUrl && (
        <div className="bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 border border-indigo-500/40 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 bg-indigo-500/20 border border-indigo-400/40 rounded-xl flex items-center justify-center text-indigo-300 shadow-xs">
              <Video className="h-6 w-6 animate-pulse text-indigo-400" />
            </div>
            <div>
              <div className="text-xs font-black text-white tracking-wide uppercase flex items-center gap-2">
                <span>Google Meet / Live Team Sync</span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-widest">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-indigo-200 font-mono truncate max-w-xs sm:max-w-md mt-0.5">
                {meetingUrl}
              </p>
            </div>
          </div>

          <a
            href={meetingUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
          >
            <span>Join 1-on-1 Sync</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      )}

      {/* ── COLLABORATIVE TEAMMATES CONTACT CARDS ── */}
      {displayTeammates.length > 0 && (
        <div className="bg-[#090D16] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400">
              <Users className="h-4 w-4" /> Assigned Collaborative Team ({displayTeammates.length} Members)
            </div>
            <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider">
              Team Deliverable
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {displayTeammates.map((member, idx) => {
              const phoneClean = member.phone ? member.phone.replace(/[^0-9]/g, "") : "";
              const whatsappUrl = phoneClean
                ? `https://wa.me/${phoneClean.startsWith("91") ? phoneClean : "91" + phoneClean}?text=${encodeURIComponent(`Hi ${member.full_name}, regarding our team task on Vyntyra!`)}`
                : `https://chat.whatsapp.com/FXsC4CT1hVRHvKzGH0k5y5`;

              return (
                <div
                  key={idx}
                  className="bg-[#0E131F] border border-slate-800/90 hover:border-slate-700 p-3.5 rounded-xl flex items-center justify-between gap-3 transition-all shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10 border border-indigo-500/30 shadow-xs">
                      <AvatarImage src={member.avatar_url} alt={member.full_name} />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-950 to-slate-900 text-indigo-300 font-black text-xs">
                        {member.full_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                        <span>{member.full_name}</span>
                        {member.intern_id && (
                          <span className="text-[9px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.2 rounded">
                            {member.intern_id}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-indigo-400 font-semibold truncate mt-0.5">
                        {member.domain || member.department || member.role || "Engineering & Tech"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="Direct WhatsApp Message"
                      className="h-8 w-8 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center transition-colors"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </a>
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        title="Send Email"
                        className="h-8 w-8 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center transition-colors"
                      >
                        <Mail className="h-4 w-4" />
                      </a>
                    )}
                    {member.phone && (
                      <a
                        href={`tel:${member.phone}`}
                        title="Direct Call"
                        className="h-8 w-8 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center transition-colors"
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STRUCTURED RICH MARKDOWN DESCRIPTION ── */}
      {cleanMarkdown && (
        <div
          className={`prose prose-slate max-w-none dark:prose-invert text-slate-200 text-xs leading-relaxed ${
            compact ? "line-clamp-4" : ""
          }`}
        >
          <ReactMarkdown
            components={{
              h1({ children }) {
                return <h1 className="text-base font-black text-white mt-4 mb-2 border-b border-slate-800 pb-1">{children}</h1>;
              },
              h2({ children }) {
                return <h2 className="text-sm font-extrabold text-indigo-300 mt-4 mb-2">{children}</h2>;
              },
              h3({ children }) {
                return (
                  <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider mt-4 mb-2 bg-amber-950/40 border-l-4 border-amber-400 px-3 py-1.5 rounded-r-xl shadow-xs">
                    {children}
                  </h3>
                );
              },
              p({ children }) {
                return <p className="mb-2 text-slate-300 whitespace-pre-wrap leading-relaxed font-normal">{children}</p>;
              },
              ul({ children }) {
                return <ul className="list-disc list-inside space-y-1.5 my-2 text-slate-300 pl-2">{children}</ul>;
              },
              ol({ children }) {
                return <ol className="list-decimal list-inside space-y-1.5 my-2 text-slate-300 pl-2">{children}</ol>;
              },
              li({ children }) {
                return <li className="text-slate-300 font-medium leading-relaxed">{children}</li>;
              },
              strong({ children }) {
                return <strong className="font-extrabold text-white">{children}</strong>;
              },
              code({ children }) {
                return (
                  <code className="bg-slate-800/90 text-indigo-300 text-[11px] font-mono px-2 py-0.5 rounded-md border border-slate-700/80">
                    {children}
                  </code>
                );
              },
            }}
          >
            {cleanMarkdown}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}
