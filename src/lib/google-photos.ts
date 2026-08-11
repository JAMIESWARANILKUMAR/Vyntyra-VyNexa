/**
 * Helper utility to resolve Google Photos shared links (photos.app.goo.gl or photos.google.com)
 * into direct raw image URLs (lh3.googleusercontent.com) for profile photos, PDFs, and avatars.
 */

export async function resolveGooglePhotosUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("data:image")) return trimmed;

  // Check if it's a Google Photos shared album or shortened link
  if (trimmed.includes("photos.app.goo.gl") || trimmed.includes("photos.google.com")) {
    try {
      const res = await fetch(trimmed, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        redirect: "follow",
      });

      if (res.ok) {
        const html = await res.text();

        // 1. Search for <meta property="og:image" content="...">
        const ogMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                        html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);

        if (ogMatch && ogMatch[1]) {
          let directUrl = ogMatch[1];
          if (directUrl.includes("googleusercontent.com")) {
            directUrl = directUrl.split("=")[0] + "=w1000-h1000";
          }
          return directUrl;
        }

        // 2. Search for any googleusercontent photo link in HTML
        const lh3Match = html.match(/(https:\/\/[a-zA-Z0-9\.-]+\.googleusercontent\.com\/[^\s"'<>]+)/);
        if (lh3Match && lh3Match[1]) {
          let directUrl = lh3Match[1];
          if (directUrl.includes("googleusercontent.com")) {
            directUrl = directUrl.split("=")[0] + "=w1000-h1000";
          }
          return directUrl;
        }
      }
    } catch (e) {
      console.warn("[GooglePhotos] Failed to resolve link:", e);
    }
  }

  // If already a googleusercontent link, ensure proper sizing parameter
  if (trimmed.includes("googleusercontent.com")) {
    const baseUrl = trimmed.split("=")[0];
    return `${baseUrl}=w1000-h1000`;
  }

  return trimmed;
}
