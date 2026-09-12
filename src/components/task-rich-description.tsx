import React, { useMemo, useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { 
  Users, 
  Video, 
  Phone, 
  Mail, 
  MessageSquare, 
  ExternalLink,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  teamMembers?: (TeammateInfo | any | string)[] | null;
  className?: string;
  compact?: boolean;
  teamId?: string | null;
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

  // Strip [TeamId: ...] and [TeamName: ...] markers from display
  text = text
    .replace(/\[TeamId:\s*[^\]\s]+\]\s*/gi, "")
    .replace(/\[TeamName:\s*[^\]]+\]\s*/gi, "");

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
    .replace(/\$\\rightarrow\$/gi, " -> ")
    .replace(/\\rightarrow\b/gi, " -> ")
    .replace(/\$\\Rightarrow\$/gi, " => ")
    .replace(/\\Rightarrow\b/gi, " => ")
    .replace(/\$\\leftrightarrow\$/gi, " <-> ")
    .replace(/\\leftrightarrow\b/gi, " <-> ")
    .replace(/\$\\leftarrow\$/gi, " <- ")
    .replace(/\\leftarrow\b/gi, " <- ")
    .replace(/\$\\le\$/gi, " <= ")
    .replace(/\\le\b/gi, " <= ")
    .replace(/\$\\ge\$/gi, " >= ")
    .replace(/\\ge\b/gi, " >= ")
    .replace(/\$\\times\$/gi, " x ")
    .replace(/\\times\b/gi, " x ");

  // 4. Normalize weird non-standard AI bullets (like •) into standard Markdown dashes
  text = text.replace(/^[•]\s*/gim, "- ");
  
  // 5. Remove loose bullet points that AI sometimes generates at the start of bold lines
  text = text.replace(/^[\-\*]\s*(Challenge|Primary Persona|Secondary Persona|Visual Palette|Key Components|Required Screens)/gim, "$1");

  // 6. Auto-structure squished numbered sections (e.g. "1. Problem ... 2. Workflow ... 3. Required ...")
  if (/^\d+\.\s+[A-Z]/.test(text)) {
    text = "### " + text;
  }
  text = text.replace(/([^\n])\s*(\d+\.\s+[A-Z])/g, "$1\n\n### $2");

  // 5. Structure Screens ("Screen 1 (...", "Screen 2 (...", etc.)
  text = text.replace(/\b(Screen\s+\d+\s*\([^)]+\):?)/gi, "\n\n- **$1** ");

  // 6. Structure bold key labels like "Challenge:", "Primary Persona:", "Key Components:", "Visual Palette:"
  // Use double newline so Markdown interprets it cleanly as a top-level list or paragraph.
  text = text
    .replace(/\b(Challenge|Primary Persona|Secondary Persona|Visual Palette|Key Components|Required Screens|Required 4-Screen Wireframes):\s*/gi, "\n\n**$1:** ");

  // Clean up any double/triple empty list artifacts
  text = text.replace(/\n\n-\s*\n\n-/g, "\n\n-");

  return {
    cleanMarkdown: text,
    meetingUrl,
    parsedTeamNames,
  };
}

class TaskRichDescriptionErrorBoundary extends React.Component<
  { children: React.ReactNode; fallbackText: string; className?: string },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.warn("[TaskRichDescription] Captured render error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={`text-sm text-slate-700 whitespace-pre-wrap ${this.props.className || ""}`}>
          {this.props.fallbackText}
        </div>
      );
    }
    return this.props.children;
  }
}

function TaskRichDescriptionInner({
  description,
  teamMembers,
  className = "",
  compact = false,
  teamId,
}: TaskRichDescriptionProps) {
  const { cleanMarkdown, meetingUrl, parsedTeamNames } = useMemo(
    () => formatTaskText(description || ""),
    [description]
  );

  const effectiveTeamId = useMemo(() => {
    if (teamId) return teamId;
    const m = (description || "").match(/\[TeamId:\s*([^\]\s]+)\]/i);
    return m ? m[1] : null;
  }, [teamId, description]);

  const [fetchedProfiles, setFetchedProfiles] = useState<TeammateInfo[]>([]);
  const [dbTeamMembers, setDbTeamMembers] = useState<TeammateInfo[]>([]);

  // Combine passed team members and parsed names safely
  const rawTeammatesList = useMemo(() => {
    const list: TeammateInfo[] = [];
    const nameSet = new Set<string>();

    const safeTeamMembers = Array.isArray(teamMembers) ? teamMembers : [];
    
    safeTeamMembers.forEach((m: any) => {
      if (typeof m === "string") {
        if (m.trim() && !nameSet.has(m.toLowerCase().trim())) {
          nameSet.add(m.toLowerCase().trim());
          list.push({ full_name: m.trim() });
        }
      } else if (m) {
        const name = m.full_name || m.name || (m.email ? m.email.split("@")[0] : "");
        if (name && !nameSet.has(name.toLowerCase().trim())) {
          nameSet.add(name.toLowerCase().trim());
          list.push({
            id: m.id,
            full_name: name.trim(),
            email: m.email,
            phone: m.phone || m.phone_number,
            avatar_url: m.avatar_url,
            department: m.department,
            domain: m.domain,
            role: m.role,
            intern_id: m.intern_id,
          });
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

  // Fetch live team members directly from Supabase by team_id
  useEffect(() => {
    if (!effectiveTeamId) return;
    let isMounted = true;

    async function loadLiveTeam() {
      try {
        const { data: teamTasks } = await supabase
          .from("tasks")
          .select("assigned_to")
          .eq("team_id", effectiveTeamId);

        const assignedIds = (teamTasks || []).map((t: any) => t.assigned_to).filter(Boolean);
        if (assignedIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, email, phone, phone_number, avatar_url, department, domain, role, intern_id")
            .in("id", assignedIds);

          if (profiles && isMounted) {
            const list: TeammateInfo[] = profiles.map((p: any) => ({
              id: p.id,
              full_name: p.full_name || p.name || p.email || "Intern",
              email: p.email,
              phone: p.phone || p.phone_number,
              avatar_url: p.avatar_url,
              department: p.department,
              domain: p.domain,
              role: p.role,
              intern_id: p.intern_id,
            }));
            setDbTeamMembers(list);
          }
        }
      } catch (err) {
        console.warn("[TaskRichDescription] loadLiveTeam error:", err);
      }
    }

    loadLiveTeam();

    // Supabase Realtime WebSocket subscription for live team tasks changes
    let channel: any = null;
    try {
      const channelTopic = `team-live-ws-${effectiveTeamId}-${Math.random().toString(36).slice(2, 9)}`;
      channel = supabase
        .channel(channelTopic)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "tasks", filter: `team_id=eq.${effectiveTeamId}` },
          () => {
            if (isMounted) loadLiveTeam();
          }
        )
        .subscribe();
    } catch (err) {
      console.warn("[TaskRichDescription] Supabase Realtime subscription error:", err);
    }

    return () => {
      isMounted = false;
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, [effectiveTeamId]);

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
          .select("id, full_name, email, phone, phone_number, avatar_url, department, domain, role, intern_id");

        if (dbProfiles && isMounted) {
          const profileMap = new Map<string, TeammateInfo>();
          dbProfiles.forEach(p => {
            const mappedP = { ...p, phone: p.phone || p.phone_number } as TeammateInfo;
            if (p.full_name) profileMap.set(p.full_name.toLowerCase().trim(), mappedP);
            if (p.email) profileMap.set(p.email.toLowerCase().trim(), mappedP);
          });

          const enriched = rawTeammatesList.map(item => {
            // 1. Try Exact match
            let matched = profileMap.get(item.full_name.toLowerCase().trim()) || 
                            (item.email ? profileMap.get(item.email.toLowerCase().trim()) : null);
            
            // 2. Try Fuzzy match by first name if exact fails
            if (!matched) {
               const firstName = item.full_name.split(' ')[0].toLowerCase().trim();
               const fuzzy = dbProfiles.find(p => p.full_name && p.full_name.toLowerCase().includes(firstName));
               if (fuzzy) matched = { ...fuzzy, phone: fuzzy.phone || fuzzy.phone_number } as TeammateInfo;
            }

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

  const displayTeammates = useMemo(() => {
    // If DB has all live team members by team_id, prefer DB team members
    if (dbTeamMembers.length > 0 && dbTeamMembers.length >= rawTeammatesList.length) {
      return dbTeamMembers;
    }
    return fetchedProfiles.length > 0 ? fetchedProfiles : rawTeammatesList;
  }, [dbTeamMembers, fetchedProfiles, rawTeammatesList]);

  if (!description && displayTeammates.length === 0 && !meetingUrl) {
    return <span className="text-slate-400 italic text-xs">No description provided.</span>;
  }

  return (
    <div className={`space-y-5 ${className}`}>
      {/* ── 1-CLICK MEETING SYNC BANNER ── */}
      {meetingUrl && (
        <div className="bg-white border-l-4 border-l-blue-600 border-y border-r border-slate-200 rounded-r-lg p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Google Meet / Live Team Sync</span>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wide">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-1">
                {meetingUrl}
              </p>
            </div>
          </div>

          <a
            href={meetingUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-md transition-colors shrink-0"
          >
            <Video className="h-4 w-4" />
            <span>Join Meeting</span>
          </a>
        </div>
      )}

      {/* ── COLLABORATIVE TEAMMATES CONTACT CARDS ── */}
      {displayTeammates.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Users className="h-4 w-4 text-slate-500" /> 
              Project Team ({displayTeammates.length})
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {displayTeammates.map((member, idx) => {
              const phoneClean = member.phone ? member.phone.replace(/[^0-9]/g, "") : "";
              const whatsappUrl = phoneClean
                ? `https://wa.me/${phoneClean.startsWith("91") ? phoneClean : "91" + phoneClean}?text=${encodeURIComponent(`Hi ${member.full_name}, regarding our team task on Vyntyra!`)}`
                : null;

              return (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <Avatar className="h-12 w-12 border border-slate-200">
                      <AvatarImage src={member.avatar_url} alt={member.full_name} />
                      <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-sm">
                        {member.full_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span className="truncate">{member.full_name}</span>
                        {member.intern_id && (
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded shrink-0">
                            {member.intern_id}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-medium truncate mt-0.5">
                        {member.domain || member.department || member.role || "Engineering & Tech"}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0 border-t border-slate-100 pt-3 md:border-t-0 md:pt-0">
                    {!member.email && !member.phone && (
                      <div className="text-[11px] text-slate-400 italic flex items-center gap-1">
                         <span>Contact info unavailable</span>
                      </div>
                    )}
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        className="flex items-center gap-2 text-xs text-slate-600 hover:text-blue-600 transition-colors"
                      >
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        {member.email}
                      </a>
                    )}
                    
                    <div className="flex items-center gap-5">
                      {member.phone && (
                        <a
                          href={`tel:${member.phone}`}
                          className="flex items-center gap-2 text-xs text-slate-600 hover:text-blue-600 transition-colors"
                        >
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {member.phone}
                        </a>
                      )}
                      {whatsappUrl && (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 🚀 STRUCTURED RICH MARKDOWN DESCRIPTION 🚀 */}
      {cleanMarkdown && (
        <div
          className={`prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed break-words prose-p:break-words prose-a:break-all prose-pre:overflow-x-auto prose-table:overflow-x-auto ${
            compact ? "line-clamp-4" : ""
          }`}
        >
          <ReactMarkdown
            components={{
              h1({ children }) {
                return <h1 className="text-lg font-bold text-slate-900 mt-6 mb-3 border-b border-slate-200 pb-2">{children}</h1>;
              },
              h2({ children }) {
                return <h2 className="text-base font-bold text-slate-800 mt-5 mb-2">{children}</h2>;
              },
              h3({ children }) {
                return (
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mt-5 mb-2 pb-1 border-b border-slate-100">
                    {children}
                  </h3>
                );
              },
              p({ children }) {
                return <p className="mb-3 text-slate-600 whitespace-pre-wrap leading-relaxed last:mb-0">{children}</p>;
              },
              ul({ children }) {
                return <ul className="list-disc list-outside pl-5 space-y-2 my-3 text-slate-700">{children}</ul>;
              },
              ol({ children }) {
                return <ol className="list-decimal list-outside pl-5 space-y-2 my-3 text-slate-700">{children}</ol>;
              },
              li({ children }) {
                return <li className="text-slate-700 marker:text-slate-400">{children}</li>;
              },
              strong({ children }) {
                return <strong className="font-semibold text-slate-900">{children}</strong>;
              },
              code({ children }) {
                return (
                  <code className="bg-slate-50 text-slate-800 text-xs font-mono px-1.5 py-0.5 rounded border border-slate-200">
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

export function TaskRichDescription(props: TaskRichDescriptionProps) {
  return (
    <TaskRichDescriptionErrorBoundary fallbackText={props.description || ""} className={props.className}>
      <TaskRichDescriptionInner {...props} />
    </TaskRichDescriptionErrorBoundary>
  );
}
