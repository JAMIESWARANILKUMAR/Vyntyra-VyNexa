import { Video, Clock, ExternalLink, Calendar, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export function MeetingsSection({ meetings, isLoading, isError }: MeetingsSectionProps) {
  const upcoming = meetings.filter((m) => isUpcoming(m.scheduled_at));
  const past = meetings.filter((m) => !isUpcoming(m.scheduled_at));
  const todayMeetings = meetings.filter((m) => isToday(m.scheduled_at));

  function joinMeeting(link: string) {
    const popup = window.open(
      link,
      "meeting_popup",
      "width=1100,height=700,left=80,top=60,resizable=yes,scrollbars=yes"
    );
    if (!popup) window.open(link, "_blank");
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

function MeetingCard({ meeting, highlight, onJoin }: { meeting: Meeting; highlight?: boolean; onJoin: (l: string) => void }) {
  const { date, time } = formatDateTime(meeting.scheduled_at);
  return (
    <div className={`rounded-lg border p-3.5 transition-all hover:shadow-sm ${highlight ? "border-emerald-200 bg-emerald-50/50" : "bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-sm truncate">{meeting.title}</h4>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{date}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{time}</span>
            {meeting.duration_minutes && <span>{meeting.duration_minutes} min</span>}
          </div>
          {meeting.description && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">{meeting.description}</p>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => onJoin(meeting.meeting_link)}
          className={`shrink-0 gap-1.5 text-xs h-8 ${highlight ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
          variant={highlight ? "default" : "outline"}
        >
          <Video className="h-3.5 w-3.5" /> Join
        </Button>
      </div>
    </div>
  );
}
