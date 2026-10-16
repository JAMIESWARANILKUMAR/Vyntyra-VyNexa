/**
 * Cookie Maintenance & 24-Hour Lifecycle Management
 * 
 * Automatically purges browser cookies and bloated session state every 24 hours
 * to prevent oversized request headers from triggering Cloudflare Worker CPU limits (Error 1102).
 */

import { useEffect } from "react";

const LAST_PURGE_KEY = "vynexa_last_cookie_purge_v1";
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Helper to purge a single cookie across multiple possible domain/path permutations
 */
export function removeCookie(name: string) {
  if (typeof document === "undefined") return;

  const hostname = window.location.hostname;
  const domainParts = hostname.split(".");
  const rootDomain = domainParts.length > 1 ? `.${domainParts.slice(-2).join(".")}` : `.${hostname}`;

  const pastDate = "Thu, 01 Jan 1970 00:00:00 GMT";
  const paths = ["/", window.location.pathname];
  const domains = ["", hostname, `.${hostname}`, rootDomain];

  for (const path of paths) {
    for (const domain of domains) {
      const domainAttr = domain ? `; domain=${domain}` : "";
      document.cookie = `${name}=; path=${path}${domainAttr}; expires=${pastDate}; max-age=0; SameSite=Lax`;
      document.cookie = `${name}=; path=${path}${domainAttr}; expires=${pastDate}; max-age=0; SameSite=None; Secure`;
    }
  }
}

/**
 * Completely purges all readable browser cookies for this origin
 */
export function clearAllCookies() {
  if (typeof document === "undefined") return;

  try {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
      if (name) {
        removeCookie(name);
      }
    }

    // Explicitly target known application & authentication cookie keys
    const knownKeys = [
      "sidebar_state",
      "vyntyra_intern_session_id",
      "vyntyra_intern_session_expiry",
      "sb-access-token",
      "sb-refresh-token",
      "supabase-auth-token",
    ];

    for (const key of knownKeys) {
      removeCookie(key);
    }
  } catch (err) {
    console.error("[CookieMaintenance] Failed to clear cookies:", err);
  }
}

/**
 * Checks if 24 hours have elapsed since the last cookie cleanup.
 * If elapsed (or on first session initialization), cleans all stale cookies to preserve CPU limits.
 */
export function run24HourCookieMaintenance(force = false): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  try {
    const now = Date.now();
    const lastPurgeStr = localStorage.getItem(LAST_PURGE_KEY);
    const lastPurge = lastPurgeStr ? Number(lastPurgeStr) : null;

    // Check if 24 hours have passed or if never purged
    const shouldPurge = force || !lastPurge || isNaN(lastPurge) || (now - lastPurge) >= TWENTY_FOUR_HOURS_MS;

    if (shouldPurge) {
      console.info("[CookieMaintenance] 24-hour cycle reached: Purging stale cookies to protect CPU limits.");
      clearAllCookies();
      localStorage.setItem(LAST_PURGE_KEY, now.toString());
      return true;
    }

    // Defensive check: If document.cookie is bloated (> 2KB), prune immediately to avoid Cloudflare 1102 CPU limit
    if (document.cookie && document.cookie.length > 2048) {
      console.warn(`[CookieMaintenance] Cookie header size (${document.cookie.length} bytes) exceeds safe threshold. Clearing to prevent CPU limits.`);
      clearAllCookies();
      localStorage.setItem(LAST_PURGE_KEY, now.toString());
      return true;
    }
  } catch (err) {
    console.warn("[CookieMaintenance] Maintenance check encountered error:", err);
  }

  return false;
}

/**
 * React hook to automate the 24-hour cookie clearing lifecycle across the entire application
 */
export function use24HourCookieCleaner() {
  useEffect(() => {
    // 1. Run immediately on component mount
    run24HourCookieMaintenance();

    // 2. Run whenever the browser tab receives focus (user returns after computer sleep/idle)
    const onFocus = () => {
      run24HourCookieMaintenance();
    };
    window.addEventListener("focus", onFocus);

    // 3. Periodic check every 30 minutes to catch users with long-running active sessions
    const intervalId = setInterval(() => {
      run24HourCookieMaintenance();
    }, 30 * 60 * 1000);

    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(intervalId);
    };
  }, []);
}
