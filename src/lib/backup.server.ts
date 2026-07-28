export async function syncToReplica<T>(collection: string, payload: T, id: string): Promise<void> {
  // Fire and forget, don't await inside the main thread if possible, or catch all errors.
  try {
    const firebaseUrl = process.env.FIREBASE_BACKUP_URL;
    const cloudflareUrl = process.env.CLOUDFLARE_KV_URL;

    const promises: Promise<any>[] = [];

    if (firebaseUrl) {
      promises.push(
        fetch(`${firebaseUrl}/${collection}/${id}.json`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch(e => console.error("[Firebase Backup Error]", e))
      );
    }

    if (cloudflareUrl) {
      promises.push(
        fetch(`${cloudflareUrl}/${collection}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch(e => console.error("[Cloudflare KV Backup Error]", e))
      );
    }

    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
  } catch (error) {
    // Silently log so we never crash Supabase transactions
    console.error("[Backup Service Critical Error]", error);
  }
}
