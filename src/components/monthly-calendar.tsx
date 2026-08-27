import { useState } from "react";
import { ChevronLeft, ChevronRight, PartyPopper, Calendar as CalendarIcon, Flag } from "lucide-react";

export interface CalendarEvent {
  id: string;
  title: string;
  event_date: string;
  event_time?: string;
  target_role?: string;
  description?: string;
  meeting_url?: string;
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
    events.filter((e) => {
      const d = new Date(e.event_date);
      return d.getFullYear() === current.year && d.getMonth() === current.month && d.getDate() === day;
    });

  const holidaysForDay = (day: number) => {
    const formattedDate = `${current.year}-${String(current.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return holidays.filter((h) => {
      if (h.date === formattedDate) return true;
      const hd = new Date(h.date);
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
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b bg-gradient-to-r from-primary/5 via-amber-500/5 to-transparent">
        <button onClick={prev} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-sm tracking-wide text-slate-800">
            {MONTHS[current.month]} {current.year}
          </h3>
        </div>
        <button onClick={next} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Day Labels */}
      <div className="grid grid-cols-7 border-b bg-slate-50/50">
        {DAYS.map((d, i) => (
          <div key={d} className={`py-2 text-center text-[10px] font-bold uppercase tracking-wider ${i === 0 || i === 6 ? "text-rose-500" : "text-muted-foreground"}`}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7">
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
              className={`relative py-2 text-sm text-center transition-all hover:bg-primary/5 min-h-[48px] ${
                !cell.cur ? "text-muted-foreground/30" : "cursor-pointer"
              } ${isSelected ? "bg-primary/10 font-semibold" : ""} ${hasHolidays ? "bg-amber-50/40" : ""}`}
            >
              <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                isToday(cell.day) && cell.cur
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : hasHolidays && cell.cur
                  ? "bg-amber-500 text-white font-bold"
                  : isSelected
                  ? "font-bold text-primary"
                  : ""
              }`}>
                {cell.day}
              </span>

              {/* Badges / Dots */}
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5">
                {hasHolidays && (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" title={dayHolidays[0].name} />
                )}
                {hasEvents && dayEvents.slice(0, 2).map((_, ei) => (
                  <span key={ei} className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Day Details */}
      {selected !== null && (
        <div className="border-t px-4 py-3 bg-slate-50/70 min-h-[70px] space-y-2.5">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between border-b border-slate-200/60 pb-1.5">
            <span>{MONTHS[current.month]} {selected}, {current.year}</span>
            {selectedHolidays.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                <PartyPopper className="h-3 w-3 text-amber-600" /> Official Holiday
              </span>
            )}
          </div>

          {/* Holiday List on this day */}
          {selectedHolidays.map((h) => (
            <div key={h.id} className="p-2.5 rounded-lg bg-amber-100/70 border border-amber-300/80 text-amber-950 flex items-start gap-2">
              <PartyPopper className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-bold flex items-center gap-1.5">
                  <span>{h.name}</span>
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-800">
                    {h.type || "Holiday"}
                  </span>
                </div>
                {h.description && <p className="text-[11px] text-amber-900/80 mt-0.5">{h.description}</p>}
              </div>
            </div>
          ))}

          {/* Events list on this day */}
          {selectedEvents.length === 0 && selectedHolidays.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">No schedules or holidays on this day</p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((e) => (
                <div key={e.id} className="flex flex-col gap-1 text-xs border-b border-slate-200/50 last:border-0 pb-2 last:pb-0">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
                    <span className="font-semibold text-slate-800">{e.title}</span>
                    {e.event_time && <span className="text-muted-foreground ml-auto shrink-0 font-mono text-[10px]">{new Date(e.event_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                  </div>
                  {e.description && <div className="pl-3.5 text-slate-500 text-[10px] leading-relaxed">{e.description}</div>}
                  {e.meeting_url && (
                    <a href={e.meeting_url} target="_blank" rel="noreferrer" className="pl-3.5 text-indigo-600 hover:underline text-[10px] font-medium flex items-center gap-1 mt-0.5">
                      Join Meeting
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

