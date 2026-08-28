import { useState } from "react";
import { ChevronLeft, ChevronRight, PartyPopper, Calendar as CalendarIcon, Sparkles, Video } from "lucide-react";

export interface CalendarEvent {
  id: string;
  title: string;
  event_date: string;
  event_time?: string;
  target_role?: string;
  description?: string;
  meeting_url?: string;
  meeting_link?: string;
  gcal_url?: string;
  scheduled_at?: string;
  start_time?: string;
  date?: string;
}

export interface CalendarHoliday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  type?: "public" | "company" | "festive" | "optional" | string;
  description?: string;
}

interface MonthlyCalendarProps {
  events?: CalendarEvent[];
  holidays?: CalendarHoliday[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function MonthlyCalendar({ events = [], holidays = [] }: MonthlyCalendarProps) {
  const today = new Date();
  const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selected, setSelected] = useState<number | null>(today.getDate());

  const firstDay = new Date(current.year, current.month, 1).getDay();
  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();
  const daysInPrev = new Date(current.year, current.month, 0).getDate();

  const cells: { day: number; cur: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, cur: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, cur: true });
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - daysInMonth - firstDay + 1, cur: false });

  const eventsForDay = (day: number) =>
    events.filter((e: any) => {
      const rawDate = e.event_date || e.scheduled_at || e.start_time || e.date;
      if (!rawDate) return false;
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return false;
      return d.getFullYear() === current.year && d.getMonth() === current.month && d.getDate() === day;
    });

  const holidaysForDay = (day: number) => {
    const formattedDate = `${current.year}-${String(current.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return holidays.filter((h) => {
      if (h.date === formattedDate) return true;
      const hd = new Date(h.date);
      if (isNaN(hd.getTime())) return false;
      return hd.getFullYear() === current.year && hd.getMonth() === current.month && hd.getDate() === day;
    });
  };

  const selectedEvents = selected !== null ? eventsForDay(selected) : [];
  const selectedHolidays = selected !== null ? holidaysForDay(selected) : [];

  const prev = () => setCurrent(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 });
  const next = () => setCurrent(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 });

  const isToday = (day: number) =>
    day === today.getDate() && current.month === today.getMonth() && current.year === today.getFullYear();

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-[#0B101E]/95 shadow-xl backdrop-blur-xl overflow-hidden text-slate-100">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-800/80 bg-gradient-to-r from-indigo-950/40 via-[#0E1528] to-slate-900/60">
        <button 
          onClick={prev} 
          className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border border-transparent hover:border-slate-700"
          title="Previous Month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-950/80 border border-indigo-500/30 text-indigo-400">
            <CalendarIcon className="h-4 w-4" />
          </div>
          <h3 className="font-extrabold text-sm tracking-wide text-white">
            {MONTHS[current.month]} {current.year}
          </h3>
        </div>
        <button 
          onClick={next} 
          className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border border-transparent hover:border-slate-700"
          title="Next Month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day Labels */}
      <div className="grid grid-cols-7 border-b border-slate-800/80 bg-slate-950/60">
        {DAYS.map((d, i) => (
          <div key={d} className={`py-2 text-center text-[10px] font-bold uppercase tracking-wider ${i === 0 || i === 6 ? "text-rose-400" : "text-slate-400"}`}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-800/40 border-b border-slate-800/80">
        {cells.map((cell, i) => {
          const dayEvents = cell.cur ? eventsForDay(cell.day) : [];
          const dayHolidays = cell.cur ? holidaysForDay(cell.day) : [];
          const hasEvents = dayEvents.length > 0;
          const hasHolidays = dayHolidays.length > 0;
          const isSelected = cell.cur && selected === cell.day;

          return (
            <button
              key={i}
              onClick={() => cell.cur && setSelected(cell.day)}
              className={`relative py-2.5 text-sm text-center transition-all min-h-[52px] ${
                !cell.cur ? "text-slate-700 pointer-events-none" : "cursor-pointer hover:bg-slate-800/60"
              } ${isSelected ? "bg-indigo-950/40" : ""} ${hasHolidays ? "bg-amber-950/20" : ""}`}
            >
              <span className={`inline-flex h-7 w-7 items-center justify-center rounded-xl text-xs transition-all ${
                isToday(cell.day) && cell.cur
                  ? "bg-indigo-600 text-white font-black shadow-[0_0_12px_rgba(99,102,241,0.5)] border border-indigo-400/40"
                  : hasHolidays && cell.cur
                  ? "bg-amber-500/90 text-white font-black shadow-[0_0_10px_rgba(245,158,11,0.3)] border border-amber-400/40"
                  : isSelected
                  ? "font-extrabold text-indigo-400 ring-1 ring-indigo-500/50 bg-slate-900"
                  : cell.cur
                  ? "font-semibold text-slate-300 hover:text-white"
                  : "text-slate-700"
              }`}>
                {cell.day}
              </span>

              {/* Badges / Dots */}
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1">
                {hasHolidays && (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24]" title={dayHolidays[0].name} />
                )}
                {hasEvents && dayEvents.slice(0, 2).map((_, ei) => (
                  <span key={ei} className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_6px_#818cf8]" />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Day Details */}
      {selected !== null && (
        <div className="px-4 py-3.5 bg-slate-950/80 min-h-[75px] space-y-2.5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1.5 text-white font-extrabold">
              <Sparkles className="h-3 w-3 text-indigo-400" />
              {MONTHS[current.month]} {selected}, {current.year}
            </span>
            {selectedHolidays.length > 0 && (
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <PartyPopper className="h-3 w-3 text-amber-400" /> Official Holiday
              </span>
            )}
          </div>

          {/* Holiday List on this day */}
          {selectedHolidays.map((h) => (
            <div key={h.id} className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 flex items-start gap-2.5">
              <PartyPopper className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span>{h.name}</span>
                  <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-amber-900/80 text-amber-300 border border-amber-500/30">
                    {h.type || "Holiday"}
                  </span>
                </div>
                {h.description && <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{h.description}</p>}
              </div>
            </div>
          ))}

          {/* Events list on this day */}
          {selectedEvents.length === 0 && selectedHolidays.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-2 font-medium">No schedules or holidays recorded on this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((e: any) => {
                const meetingUrl = e.meeting_link || e.meeting_url;
                const eventTime = e.event_time || (e.scheduled_at ? new Date(e.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null);

                return (
                  <div key={e.id} className="flex flex-col gap-1.5 text-xs bg-[#0E1528] p-3 rounded-xl border border-slate-800 shadow-md">
                    <div className="flex items-center gap-2 flex-wrap justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${meetingUrl ? "bg-indigo-400 shadow-[0_0_8px_#818cf8] animate-pulse" : "bg-emerald-400 shadow-[0_0_8px_#34d399]"}`} />
                        <span className="font-bold text-white text-xs">{e.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {e.target_role && (
                          <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                            {e.target_role === "all" ? "Everyone" : e.target_role}
                          </span>
                        )}
                        {eventTime && (
                          <span className="text-indigo-300 bg-indigo-950/80 border border-indigo-500/30 font-bold px-2 py-0.5 rounded-full text-[10px]">
                            ⏰ {eventTime}
                          </span>
                        )}
                      </div>
                    </div>
                    {e.description && <div className="text-slate-400 text-[11px] leading-relaxed pt-0.5">{e.description}</div>}
                    
                    {meetingUrl && (
                      <div className="flex items-center gap-2 pt-1.5 flex-wrap">
                        <a 
                          href={meetingUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded-xl transition-all shadow-md shadow-indigo-950/60 cursor-pointer"
                        >
                          <Video className="h-3 w-3" /> Join Live Meeting
                        </a>
                        {e.gcal_url && (
                          <a 
                            href={e.gcal_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                          >
                            🗓️ Google Calendar
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

