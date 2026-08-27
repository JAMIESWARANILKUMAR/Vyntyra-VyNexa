import { Video, Clock, Calendar, Loader2, AlertCircle, Share2, CalendarPlus, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { generateGoogleCalendarUrl, formatMeetingTimeRange } from "@/lib/date-utils";
import { toast } from "sonner";

interface Meeting {
  id: string;
  title: string;
  description?: string | null;
  meeting_link: string;
  scheduled_at: string;
  start_time?: string;
  end_at?: string | null;
  end_time?: string | null;
  duration_minutes?: number;
  target_role?: string;
  gcal_url?: string;
}

interface MeetingsSectionProps {
  meetings: Meeting[];
  isLoading?: boolean;
  isError?: boolean;
}

function isUpcoming(iso: string) {
  return new Date(iso) >= new Date();
}

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export function MeetingCountdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculate = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Live");
        return;
      }
      const secs = Math.floor(diff / 1000) % 60;
      const mins = Math.floor(diff / (1000 * 60)) % 60;
      const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      if (mins > 0) parts.push(`${mins}m`);
      parts.push(`${secs}s`);

      setTimeLeft(parts.join(" "));
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft === "Live") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100 animate-pulse">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Live
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 bg-indigo-50/50 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-medium border border-indigo-100/50">
      Starts in: {timeLeft}
    </span>
  );
}

export function getJoinButtonState(scheduledAt: string, meetingId: string) {
  const now = Date.now();
  const scheduledTime = new Date(scheduledAt).getTime();
  const windowStart = scheduledTime - 15 * 60 * 1000;
  const windowEnd = scheduledTime + 120 * 60 * 1000;
  
  const countKey = `meeting-join-count-${meetingId}`;
  let joinCount = 0;
  try {
    joinCount = parseInt(localStorage.getItem(countKey) || "0", 10);
  } catch (e) {}
  
  if (joinCount >= 20) {
    return { enabled: false, reason: "Join limit reached" };
  }
  
  if (now >= windowStart && now <= windowEnd) {
    return { enabled: true, reason: "Active" };
  }
  
  if (now < windowStart) {
    return { enabled: false, reason: "Opens 15m prior" };
  }
  
  return { enabled: false, reason: "Meeting concluded" };
}

export function MeetingsSection({ meetings, isLoading, isError }: MeetingsSectionProps) {
  const upcoming = meetings.filter((m) => isUpcoming(m.scheduled_at || m.start_time || ""));
  const past = meetings.filter((m) => !isUpcoming(m.scheduled_at || m.start_time || ""));
  const todayMeetings = meetings.filter((m) => isToday(m.scheduled_at || m.start_time || ""));

  function joinMeeting(meetingId: string, link: string) {
    window.open(link, "_blank", "noopener,noreferrer");
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading meetings...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-8 gap-2 text-destructive/60 text-sm">
        <AlertCircle className="h-4 w-4" /> Could not load meetings
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Today's Meetings */}
      {todayMeetings.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-2 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            Today's Meetings
          </div>
          <div className="space-y-2">
            {todayMeetings.map((m) => (
              <MeetingCard key={m.id} meeting={m} highlight onJoin={joinMeeting} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.filter(m => !isToday(m.scheduled_at || m.start_time || "")).length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Upcoming Meetings</div>
          <div className="space-y-2">
            {upcoming.filter(m => !isToday(m.scheduled_at || m.start_time || "")).slice(0, 10).map((m) => (
              <MeetingCard key={m.id} meeting={m} onJoin={joinMeeting} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {upcoming.length === 0 && (
        <div className="text-center py-10 text-muted-foreground text-xs bg-white rounded-xl border p-6">
          <Video className="h-8 w-8 mx-auto mb-2 opacity-20 text-indigo-600" />
          No upcoming meetings scheduled right now.
        </div>
      )}
    </div>
  );
}

function MeetingCard({ meeting, highlight, onJoin }: { meeting: Meeting; highlight?: boolean; onJoin: (meetingId: string, l: string) => void }) {
  const scheduledTime = meeting.scheduled_at || meeting.start_time || new Date().toISOString();
  const durationMins = meeting.duration_minutes || 30;
  const { dateStr, fromTimeStr, toTimeStr, rangeStr } = formatMeetingTimeRange(scheduledTime, meeting.end_at || meeting.end_time, durationMins);
  
  const gcalUrl = meeting.gcal_url || generateGoogleCalendarUrl({
    title: meeting.title,
    description: meeting.description,
    location: meeting.meeting_link,
    startTime: scheduledTime,
    endTime: meeting.end_at || meeting.end_time,
  });

  const [state, setState] = useState(() => getJoinButtonState(scheduledTime, meeting.id));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setState(getJoinButtonState(scheduledTime, meeting.id));
    }, 5000);
    return () => clearInterval(timer);
  }, [scheduledTime, meeting.id]);

  function handleShareWhatsApp() {
    const text = `📢 *OFFICIAL MEETING NOTICE · PROJECT VYNEXA*

📌 *Topic:* ${meeting.title}
📅 *Date:* ${dateStr}
⏰ *Time:* ${rangeStr} (${durationMins} Mins)
🔗 *Meeting Link:* ${meeting.meeting_link}

📝 *Agenda:*
${meeting.description || "General sync and milestone review."}

🗓️ *Google Calendar:*
${gcalUrl}

— *Vyntyra Directorate*`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }

  function handleCopyAnnouncement() {
    const text = `📢 OFFICIAL MEETING NOTICE · PROJECT VYNEXA\nTopic: ${meeting.title}\nDate: ${dateStr}\nTime: ${rangeStr} (${durationMins} Mins)\nMeeting Link: ${meeting.meeting_link}\nAgenda: ${meeting.description || "General sync and milestone review."}\nCalendar Link: ${gcalUrl}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Meeting announcement copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }
  
  const iconContainerClass = highlight 
    ? "bg-emerald-50 border-emerald-100 text-emerald-600"
    : "bg-indigo-50 border-indigo-100 text-indigo-600";
  
  const pingColorClass = highlight ? "bg-emerald-400" : "bg-indigo-400";
  const videoIconColorClass = highlight ? "text-emerald-600" : "text-indigo-600";

  return (
    <div className={`rounded-xl border p-4 transition-all hover:shadow-xs ${highlight ? "border-emerald-200 bg-emerald-50/40" : "bg-white"}`}>
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        
        <div className="flex items-start gap-3.5 min-w-0 flex-1">
          {/* Animated video meeting logo */}
          <div className={`relative flex h-10 w-10 items-center justify-center rounded-xl border ${iconContainerClass} shrink-0 overflow-hidden mt-0.5`}>
            <span className={`animate-ping absolute inline-flex h-8 w-8 rounded-full ${pingColorClass} opacity-40`} />
            <Video className={`relative h-5 w-5 ${videoIconColorClass} animate-pulse`} />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-bold text-sm text-slate-900 truncate">{meeting.title}</h4>
              <MeetingCountdown targetDate={scheduledTime} />
              {meeting.target_role && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {meeting.target_role === "all" ? "Everyone" : meeting.target_role}
                </span>
              )}
            </div>
            
            {/* Time Schedule Display: From Time to What Time */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-slate-400" /> {dateStr}</span>
              <span className="flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                <Clock className="h-3.5 w-3.5 text-indigo-600" /> {rangeStr}
              </span>
              <span className="text-slate-400 text-[11px]">({durationMins} Mins)</span>
            </div>

            {meeting.description && (
              <p className="text-xs text-slate-500 pt-0.5 line-clamp-2 leading-relaxed">{meeting.description}</p>
            )}
          </div>
        </div>

        {/* Action Buttons: Join, Google Calendar, WhatsApp */}
        <div className="flex items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Add to Google Calendar Button */}
            <a
              href={gcalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1.5 rounded-lg transition-colors shadow-2xs"
              title="Add meeting schedule to your Google Calendar"
            >
              <CalendarPlus className="h-3.5 w-3.5 text-indigo-600" />
              <span>Google Calendar</span>
            </a>

            {/* WhatsApp Group Share Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleShareWhatsApp}
              className="h-8 px-2.5 text-[11px] font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border-teal-200 gap-1"
              title="Share formatted meeting notice on WhatsApp Group"
            >
              <Share2 className="h-3.5 w-3.5 text-teal-600" />
              <span>WhatsApp</span>
            </Button>

            {/* Copy Announcement Button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyAnnouncement}
              className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700"
              title="Copy meeting details"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>

          <div className="flex flex-col items-end gap-0.5">
            <Button
              size="sm"
              disabled={!state.enabled}
              onClick={() => {
                const countKey = `meeting-join-count-${meeting.id}`;
                const currentCount = parseInt(localStorage.getItem(countKey) || "0", 10);
                localStorage.setItem(countKey, (currentCount + 1).toString());
                setState(getJoinButtonState(scheduledTime, meeting.id));
                onJoin(meeting.id, meeting.meeting_link);
              }}
              className={`gap-1.5 text-xs h-8 font-bold ${highlight && state.enabled ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}
            >
              <Video className="h-3.5 w-3.5" /> Join Live
            </Button>
            <span className="text-[9px] text-muted-foreground font-semibold">{state.reason}</span>
          </div>
        </div>

      </div>
    </div>
  );
}

