import { useEffect, useState } from "react";

type City = { label: string; tz: string; abbr: string };

const CITIES: City[] = [
  { label: "Visakhapatnam", tz: "Asia/Kolkata", abbr: "IST" },
  { label: "Bengaluru", tz: "Asia/Kolkata", abbr: "IST" },
  { label: "New Delhi", tz: "Asia/Kolkata", abbr: "IST" },
  { label: "New York", tz: "America/New_York", abbr: "ET" },
  { label: "Kuala Lumpur", tz: "Asia/Kuala_Lumpur", abbr: "MYT" },
];

function partsForTz(tz: string, now: Date) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const parts = fmt.formatToParts(now).reduce<Record<string, string>>((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});
  return {
    h: parseInt(parts.hour ?? "0", 10),
    m: parseInt(parts.minute ?? "0", 10),
    s: parseInt(parts.second ?? "0", 10),
    date: `${parts.weekday}, ${parts.day} ${parts.month} ${parts.year}`,
    time: `${parts.hour}:${parts.minute}:${parts.second}`,
  };
}

function AnalogClock({ h, m, s, size = 68 }: { h: number; m: number; s: number; size?: number }) {
  const hourAngle = ((h % 12) + m / 60) * 30;
  const minAngle = (m + s / 60) * 6;
  const secAngle = s * 6;
  const r = size / 2;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="shrink-0">
      <circle cx={r} cy={r} r={r - 1.5} fill="white" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        const x1 = r + Math.sin(a) * (r - 4);
        const y1 = r - Math.cos(a) * (r - 4);
        const x2 = r + Math.sin(a) * (r - (i % 3 === 0 ? 8 : 6));
        const y2 = r - Math.cos(a) * (r - (i % 3 === 0 ? 8 : 6));
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeOpacity={i % 3 === 0 ? 0.7 : 0.35} strokeWidth={i % 3 === 0 ? 1.4 : 0.9} />;
      })}
      {/* hour */}
      <line x1={r} y1={r} x2={r + Math.sin((hourAngle * Math.PI) / 180) * (r * 0.45)} y2={r - Math.cos((hourAngle * Math.PI) / 180) * (r * 0.45)} stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      {/* minute */}
      <line x1={r} y1={r} x2={r + Math.sin((minAngle * Math.PI) / 180) * (r * 0.7)} y2={r - Math.cos((minAngle * Math.PI) / 180) * (r * 0.7)} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* second */}
      <line x1={r} y1={r} x2={r + Math.sin((secAngle * Math.PI) / 180) * (r * 0.78)} y2={r - Math.cos((secAngle * Math.PI) / 180) * (r * 0.78)} stroke="#C9A227" strokeWidth="1" strokeLinecap="round" />
      <circle cx={r} cy={r} r="1.8" fill="#C9A227" />
    </svg>
  );
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isMobile;
}

export function WorldClocks({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const d = new Date();
      setNow(d);
      // Align to the next wall-clock second (drift-free, one update per second)
      const delay = 1000 - (d.getTime() % 1000);
      timeoutId = setTimeout(tick, delay);
    };

    const start = () => {
      if (timeoutId) clearTimeout(timeoutId);
      tick();
    };
    const stop = () => {
      if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
    };
    const onVis = () => (document.hidden ? stop() : start());

    start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const isMobile = useIsMobile();

  if (!now) {
    return <div className="h-[110px]" aria-hidden />;
  }

  const isDark = variant === "dark";
  return (
    <div className={"rounded-md border " + (isDark ? "border-primary-foreground/15 bg-primary-foreground/[0.03]" : "border-border bg-card")}>
      <div className={"px-3 sm:px-4 py-2 border-b flex items-center justify-between " + (isDark ? "border-primary-foreground/10" : "border-border bg-surface")}>
        <div className={"text-[10px] uppercase tracking-[0.2em] font-semibold " + (isDark ? "text-gold" : "text-secondary")}>
          Global Operations · Live Time
        </div>
        <div className={"text-[10px] sm:text-[11px] font-mono " + (isDark ? "text-primary-foreground/60" : "text-muted-foreground")}>
          {Intl.DateTimeFormat().resolvedOptions().timeZone}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 p-3 sm:p-4">
        {CITIES.map((c) => {
          const p = partsForTz(c.tz, now);
          return (
            <div key={c.label} className={"flex items-center gap-2 sm:gap-3 rounded-sm border px-2 sm:px-3 py-2 " + (isDark ? "border-primary-foreground/10 bg-primary-foreground/[0.03] text-primary-foreground" : "border-border bg-surface text-foreground")}>
              <div className={isDark ? "text-primary-foreground/85" : "text-primary"}>
                <AnalogClock h={p.h} m={p.m} s={p.s} size={isMobile ? 52 : 68} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold truncate">{c.label}</div>
                <div className="font-mono text-base sm:text-lg leading-tight tabular-nums">{p.time}</div>
                <div className={"text-[9px] sm:text-[10px] mt-0.5 leading-tight " + (isDark ? "text-primary-foreground/55" : "text-muted-foreground")}>
                  <span className="hidden sm:inline">{p.date} · </span>{c.abbr}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
