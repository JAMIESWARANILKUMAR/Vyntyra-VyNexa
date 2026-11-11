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
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden text-slate-900">
      {/* Header */}
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-200 bg-slate-50/80">
        <button 
          onClick={prev} 
          className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer border border-transparent"
          title="Previous Month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-900 text-white flex items-center justify-center">
            <CalendarIcon className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-extrabold text-sm tracking-tight text-slate-900">
            {MONTHS[current.month]} {current.year}
          </h3>
        </div>
        <button 
          onClick={next} 
          className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer border border-transparent"
          title="Next Month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day Labels */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/40">
        {DAYS.map((d, i) => (
          <div key={d} className={`py-2 text-center text-[10px] font-black uppercase tracking-wider ${i === 0 ? "text-slate-900 font-black" : "text-slate-600"}`}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 border-b border-slate-200">
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
              className={`relative py-2.5 text-sm text-center transition-all min-h-[50px] ${
                !cell.cur ? "text-slate-300 pointer-events-none" : "cursor-pointer hover:bg-slate-100/70"
              } ${isSelected ? "bg-slate-100/80" : ""}`}
            >
              <span className={`inline-flex h-7 w-7 items-center justify-center rounded-xl text-xs transition-all ${
                isToday(cell.day) && cell.cur
                  ? "bg-slate-900 text-white font-black shadow-xs"
                  : hasHolidays && cell.cur
                  ? "bg-slate-800 text-white font-bold"
                  : isSelected
                  ? "font-extrabold text-slate-900 ring-2 ring-slate-900 bg-white"
                  : cell.cur
                  ? "font-bold text-slate-800 hover:text-slate-900"
                  : "text-slate-300"
              }`}>
                {cell.day}
              </span>

              {/* Badges / Dots */}
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1">
                {hasHolidays && (
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-600" title={dayHolidays[0].name} />
                )}
                {hasEvents && dayEvents.slice(0, 2).map((_, ei) => (
                  <span key={ei} className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Day Details */}
      {selected !== null && (
        <div className="px-4 py-3.5 bg-slate-50/60 min-h-[75px] space-y-2.5">
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="flex items-center gap-1.5 text-slate-900 font-black">
              <Sparkles className="h-3.5 w-3.5 text-slate-700" />
              {MONTHS[current.month]} {selected}, {current.year}
            </span>
            {selectedHolidays.length > 0 && (
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-900 border border-slate-300 flex items-center gap-1">
                <PartyPopper className="h-3 w-3 text-slate-700" /> Official Holiday
              </span>
            )}
          </div>

          {/* Holiday List on this day */}
          {selectedHolidays.map((h) => (
            <div key={h.id} className="p-3 rounded-xl bg-white border border-slate-200 text-slate-900 flex items-start gap-2.5 shadow-2xs">
              <PartyPopper className="h-4 w-4 text-slate-700 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <span>{h.name}</span>
                  <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                    {h.type || "Holiday"}
                  </span>
                </div>
                {h.description && <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{h.description}</p>}
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
                  <div key={e.id} className="flex flex-col gap-1.5 text-xs bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center gap-2 flex-wrap justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${meetingUrl ? "bg-slate-900 animate-pulse" : "bg-slate-600"}`} />
                        <span className="font-extrabold text-slate-900 text-xs">{e.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {e.target_role && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {e.target_role === "all" ? "Everyone" : e.target_role}
                          </span>
                        )}
                        {eventTime && (
                          <span className="text-slate-900 bg-slate-100 border border-slate-200 font-bold px-2 py-0.5 rounded-full text-[10px]">
                            {eventTime}
                          </span>
                        )}
                      </div>
                    </div>
                    {e.description && <div className="text-slate-600 text-[11px] leading-relaxed pt-0.5">{e.description}</div>}
                    
                    {meetingUrl && (
                      <div className="flex items-center gap-2 pt-1.5 flex-wrap">
                        <a 
                          href={meetingUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-slate-900 hover:bg-slate-800 px-3 py-1 rounded-xl transition-all shadow-xs cursor-pointer"
                        >
                          <Video className="h-3 w-3 text-white" /> Join Live Meeting
                        </a>
                        {e.gcal_url && (
                          <a 
                            href={e.gcal_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                          >
                            Google Calendar
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
