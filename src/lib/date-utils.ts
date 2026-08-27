/**
 * Timezone-safe Date & Time Utilities
 * Handles exact conversions between local datetime-local picker strings (e.g. "2026-08-23T23:58")
 * and ISO 8601 UTC strings stored in Postgres timestamptz columns.
 */

export function localDateTimeToIso(localStr: string | null | undefined): string | null {
  if (!localStr || !localStr.trim()) return null;
  const trimmed = localStr.trim();
  
  // If already an ISO string with Z or explicit offset
  if (trimmed.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  // Parses "YYYY-MM-DDTHH:mm" in the browser's local timezone (e.g. IST UTC+5:30)
  const d = new Date(trimmed);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function isoToLocalDateTimeInput(isoStr: string | null | undefined): string {
  if (!isoStr || !isoStr.trim()) return "";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return "";
  
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function formatDateTimeDisplay(dateStr?: string | null, fallback = "—"): string {
  if (!dateStr) return fallback;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return fallback;
  }
}

export function generateGoogleCalendarUrl({
  title,
  description,
  location,
  startTime,
  endTime,
}: {
  title: string;
  description?: string | null;
  location?: string | null;
  startTime: string | Date;
  endTime?: string | Date | null;
}): string {
  const start = new Date(startTime);
  if (isNaN(start.getTime())) return "https://calendar.google.com/calendar/";

  const end = endTime && !isNaN(new Date(endTime).getTime())
    ? new Date(endTime)
    : new Date(start.getTime() + 45 * 60 * 1000);

  const formatGCalDate = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, "");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${formatGCalDate(start)}/${formatGCalDate(end)}`,
    details: `${description || "VyNexa Connect Scheduled Meeting"}\n\nJoin Live Link: ${location || "Online"}`,
    location: location || "",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function formatMeetingTimeRange(
  startTimeStr: string,
  endTimeStr?: string | null,
  durationMinutes = 30
): {
  dateStr: string;
  fromTimeStr: string;
  toTimeStr: string;
  rangeStr: string;
} {
  const start = new Date(startTimeStr);
  const end = endTimeStr ? new Date(endTimeStr) : new Date(start.getTime() + durationMinutes * 60 * 1000);

  const dateStr = start.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const fromTimeStr = start.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const toTimeStr = end.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const rangeStr = `${fromTimeStr} – ${toTimeStr}`;

  return { dateStr, fromTimeStr, toTimeStr, rangeStr };
}

