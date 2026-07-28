import { useEffect, useState } from "react";

export function AnalogClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Visakhapatnam time (IST = UTC + 5:30)
  const utc = time.getTime() + (time.getTimezoneOffset() * 60000);
  const istTime = new Date(utc + (3600000 * 5.5));

  const seconds = istTime.getSeconds();
  const minutes = istTime.getMinutes();
  const hours = istTime.getHours() % 12;

  const secondDegrees = (seconds / 60) * 360;
  const minuteDegrees = ((minutes + seconds / 60) / 60) * 360;
  const hourDegrees = ((hours + minutes / 60) / 12) * 360;

  const digitalTime = istTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="flex flex-col items-center justify-center gap-1.5 shrink-0">
      <div className="relative w-14 h-14 rounded-full border-[3px] border-white/20 bg-black/10 backdrop-blur-md shadow-inner flex items-center justify-center">
        {/* Center dot */}
        <div className="absolute w-1.5 h-1.5 bg-white rounded-full z-10 shadow-sm" />
        
        {/* Hour Hand */}
        <div
          className="absolute w-1 bg-white rounded-full origin-bottom shadow-sm"
          style={{ height: '24%', bottom: '50%', transform: `rotate(${hourDegrees}deg)` }}
        />
        
        {/* Minute Hand */}
        <div
          className="absolute w-[2px] bg-white/90 rounded-full origin-bottom shadow-sm"
          style={{ height: '36%', bottom: '50%', transform: `rotate(${minuteDegrees}deg)` }}
        />
        
        {/* Second Hand */}
        <div
          className="absolute w-[1px] bg-red-400 origin-bottom shadow-sm"
          style={{ height: '42%', bottom: '50%', transform: `rotate(${secondDegrees}deg)` }}
        />

        {/* Clock marks */}
        {[0, 3, 6, 9].map((mark) => (
          <div
            key={mark}
            className="absolute w-[2px] h-1.5 bg-white/40 rounded-full"
            style={{
              transform: `rotate(${mark * 30}deg) translateY(-22px)`,
            }}
          />
        ))}
      </div>
      <div className="flex flex-col items-center">
        <div className="text-[11px] font-bold tracking-wide">{digitalTime}</div>
        <div className="text-[8px] uppercase tracking-widest font-semibold opacity-70">Visakhapatnam</div>
      </div>
    </div>
  );
}
