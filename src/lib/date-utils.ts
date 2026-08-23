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
