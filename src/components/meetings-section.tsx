import { Video, Clock, Calendar, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface Meeting {
  id: string;
  title: string;
  description?: string;
  meeting_link: string;
  scheduled_at: string;
  duration_minutes?: number;
  target_role?: string;
}

interface MeetingsSectionProps {
  meetings: Meeting[];
  isLoading?: boolean;
  isError?: boolean;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
    time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
  };
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
  const windowStart = scheduledTime - 10 * 60 * 1000;
  const windowEnd = scheduledTime + 10 * 60 * 1000;
  
  const countKey = `meeting-join-count-${meetingId}`;
  let joinCount = 0;
  try {
    joinCount = parseInt(localStorage.getItem(countKey) || "0", 10);
  } catch (e) {}
  
  if (joinCount >= 10) {
    return { enabled: false, reason: "Limit reached (10 joins max)" };
  }
  
  if (joinCount > 0) {
    return { enabled: true, reason: `Joined ${joinCount}/10 times` };
  }
  
  if (now >= windowStart && now <= windowEnd) {
    return { enabled: true, reason: "Active" };
  }
  
  if (now < windowStart) {
    return { enabled: false, reason: "Too early (Opens 10m before)" };
  }
  
  return { enabled: false, reason: "Closed (Joined limit or past window)" };
}

export function MeetingsSection({ meetings, isLoading, isError }: MeetingsSectionProps) {
  const upcoming = meetings.filter((m) => isUpcoming(m.scheduled_at));
  const past = meetings.filter((m) => !isUpcoming(m.scheduled_at));
  const todayMeetings = meetings.filter((m) => isToday(m.scheduled_at));

  function joinMeeting(meetingId: string, link: string) {
    // Open in current tab only as requested
    window.location.href = link;
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
      {upcoming.filter(m => !isToday(m.scheduled_at)).length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Upcoming</div>
          <div className="space-y-2">
            {upcoming.filter(m => !isToday(m.scheduled_at)).slice(0, 5).map((m) => (
              <MeetingCard key={m.id} meeting={m} onJoin={joinMeeting} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {upcoming.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <Video className="h-8 w-8 mx-auto mb-2 opacity-20" />
          No upcoming meetings
        </div>
      )}
    </div>
  );
}

function MeetingCard({ meeting, highlight, onJoin }: { meeting: Meeting; highlight?: boolean; onJoin: (meetingId: string, l: string) => void }) {
  const { date, time } = formatDateTime(meeting.scheduled_at);
  const [state, setState] = useState(() => getJoinButtonState(meeting.scheduled_at, meeting.id));

  useEffect(() => {
    const timer = setInterval(() => {
      setState(getJoinButtonState(meeting.scheduled_at, meeting.id));
    }, 5000);
    return () => clearInterval(timer);
  }, [meeting.scheduled_at, meeting.id]);
  
  // Choose animated video icon class and container class based on highlight/urgency
  const iconContainerClass = highlight 
    ? "bg-emerald-50 border-emerald-100 text-emerald-600"
    : "bg-indigo-50 border-indigo-100 text-indigo-600";
  
  const pingColorClass = highlight ? "bg-emerald-400" : "bg-indigo-400";
  const videoIconColorClass = highlight ? "text-emerald-600" : "text-indigo-600";

  return (
    <div className={`rounded-lg border p-3.5 transition-all hover:shadow-sm ${highlight ? "border-emerald-200 bg-emerald-50/50" : "bg-white"}`}>
      <div className="flex items-start gap-4 justify-between">
        
        {/* Animated video meeting logo */}
        <div className={`relative flex h-10 w-10 items-center justify-center rounded-xl border ${iconContainerClass} shrink-0 overflow-hidden`}>
          <span className={`animate-ping absolute inline-flex h-8 w-8 rounded-full ${pingColorClass} opacity-40`} />
          <Video className={`relative h-5 w-5 ${videoIconColorClass} animate-pulse`} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold text-sm truncate max-w-[200px] md:max-w-xs">{meeting.title}</h4>
            <MeetingCountdown targetDate={meeting.scheduled_at} />
          </div>
          
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{date}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{time}</span>
            {meeting.duration_minutes && <span>{meeting.duration_minutes} min</span>}
          </div>
          {meeting.description && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">{meeting.description}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <Button
            size="sm"
            disabled={!state.enabled}
            onClick={() => {
              const countKey = `meeting-join-count-${meeting.id}`;
              const currentCount = parseInt(localStorage.getItem(countKey) || "0", 10);
              localStorage.setItem(countKey, (currentCount + 1).toString());
              setState(getJoinButtonState(meeting.scheduled_at, meeting.id));
              onJoin(meeting.id, meeting.meeting_link);
            }}
            className={`gap-1.5 text-xs h-8 ${highlight && state.enabled ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
            variant={highlight && state.enabled ? "default" : "outline"}
          >
            <Video className="h-3.5 w-3.5" /> Join
          </Button>
          <span className="text-[9px] text-muted-foreground font-semibold">{state.reason}</span>
        </div>
      </div>
    </div>
  );
}
