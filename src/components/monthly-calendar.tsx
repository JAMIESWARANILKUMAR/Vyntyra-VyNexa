import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  event_date: string;
  event_time?: string;
  target_role?: string;
  description?: string;
  meeting_url?: string;
}

interface MonthlyCalendarProps {
  events?: CalendarEvent[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function MonthlyCalendar({ events = [] }: MonthlyCalendarProps) {
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

  const selectedEvents = selected !== null ? eventsForDay(selected) : [];

  const prev = () => setCurrent(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 });
  const next = () => setCurrent(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 });

  const isToday = (day: number) =>
    day === today.getDate() && current.month === today.getMonth() && current.year === today.getFullYear();

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b bg-gradient-to-r from-primary/5 to-transparent">
        <button onClick={prev} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <h3 className="font-semibold text-sm tracking-wide">
          {MONTHS[current.month]} {current.year}
        </h3>
        <button onClick={next} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Day Labels */}
      <div className="grid grid-cols-7 border-b">
        {DAYS.map((d) => (
          <div key={d} className="py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          const hasEvents = cell.cur && eventsForDay(cell.day).length > 0;
          const isSelected = cell.cur && selected === cell.day;
          return (
            <button
              key={i}
              onClick={() => cell.cur && setSelected(cell.day)}
              className={`relative py-2 text-sm text-center transition-all hover:bg-primary/5 ${
                !cell.cur ? "text-muted-foreground/30" : "cursor-pointer"
              } ${isSelected ? "bg-primary/10 font-semibold" : ""}`}
            >
              <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm transition-colors ${
                isToday(cell.day) && cell.cur
                  ? "bg-primary text-primary-foreground font-bold"
                  : isSelected
                  ? "font-semibold text-primary"
                  : ""
              }`}>
                {cell.day}
              </span>
              {hasEvents && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {eventsForDay(cell.day).slice(0, 3).map((_, ei) => (
                    <span key={ei} className="h-1 w-1 rounded-full bg-primary" />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Events */}
      {selected !== null && (
        <div className="border-t px-4 py-3 bg-slate-50/50 min-h-[60px]">
          {selectedEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">No events on this day</p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((e) => (
                <div key={e.id} className="flex flex-col gap-1 text-xs border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{e.title}</span>
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
