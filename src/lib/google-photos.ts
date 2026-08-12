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

  // 3. Resolve ImgBB Sharing / Viewer links (e.g. ibb.co or imgbb.com)
  if (trimmed.includes("ibb.co") || trimmed.includes("imgbb.com")) {
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
          return ogMatch[1];
        }

        // Direct search for ibb.co links in source
        const imgMatch = html.match(/(https:\/\/i\.ibb\.co\/[^\s"'<>]+)/);
        if (imgMatch && imgMatch[1]) {
          return imgMatch[1];
        }
      }
    } catch (e) {
      console.warn("[ImgBB] Failed to resolve link:", e);
    }
  }

  // 4. Resolve Komodo / Komodo Decks sharing links (e.g. kommodo.ai or komododecks.com)
  if (trimmed.includes("kommodo.ai") || trimmed.includes("komododecks.com")) {
    try {
      const res = await fetch(trimmed, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        redirect: "follow",
      });

      if (res.ok) {
        const html = await res.text();
        const ogMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                        html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);

        if (ogMatch && ogMatch[1]) {
          return ogMatch[1];
        }
      }
    } catch (e) {
      console.warn("[Komodo] Failed to resolve link:", e);
    }
  }

  // 5. Resolve Google Photos shared links
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

  // 5. Resolve standard Google User Content links
  if (trimmed.includes("googleusercontent.com")) {
    const baseUrl = trimmed.split("=")[0];
    return `${baseUrl}=w1000-h1000`;
  }

  // 6. Universal og:image scraper for any website domain/extension
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const isDirectImage = /\.(jpg|jpeg|png|gif|webp|svg)($|\?)/i.test(trimmed);
    if (!isDirectImage) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 sec timeout

        const res = await fetch(trimmed, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          signal: controller.signal,
          redirect: "follow",
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const html = await res.text();
          const ogMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                          html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
          if (ogMatch && ogMatch[1]) {
            return ogMatch[1];
          }
        }
      } catch (e) {
        console.warn("[UniversalScraper] Failed to resolve link:", trimmed, e);
      }
    }
  }

  return trimmed;
}
