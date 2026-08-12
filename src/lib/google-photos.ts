/**
 * Helper utility to resolve Google Photos shared links (photos.app.goo.gl or photos.google.com)
 * into direct raw image URLs (lh3.googleusercontent.com) for profile photos, PDFs, and avatars.
 */

export async function resolveGooglePhotosUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("data:image")) return trimmed;

  // 1. Resolve Google Drive Sharing links
  // Match formats: /file/d/ID/view or ?id=ID or open?id=ID
  const driveIdMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (trimmed.includes("drive.google.com") && driveIdMatch && driveIdMatch[1]) {
    return `https://drive.google.com/uc?export=download&id=${driveIdMatch[1]}`;
  }

  // 2. Resolve Dropbox Sharing links
  if (trimmed.includes("dropbox.com")) {
    let directUrl = trimmed.replace("www.dropbox.com", "dl.dropboxusercontent.com");
    directUrl = directUrl.split("?")[0];
    return directUrl;
  }

  // 3. Resolve Google Photos shared links
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

        // Og match
        const ogMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                        html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);

        if (ogMatch && ogMatch[1]) {
          let directUrl = ogMatch[1];
          if (directUrl.includes("googleusercontent.com")) {
            directUrl = directUrl.split("=")[0] + "=w1000-h1000";
          }
          return directUrl;
        }

        // Lh3 match
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

  // 4. Resolve standard Google User Content links
  if (trimmed.includes("googleusercontent.com")) {
    const baseUrl = trimmed.split("=")[0];
    return `${baseUrl}=w1000-h1000`;
  }

  return trimmed;
}
