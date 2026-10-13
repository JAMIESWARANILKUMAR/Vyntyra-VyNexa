import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function generateUploadUrl(filename: string, contentType: string) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY;
  const bucketName = process.env.CLOUDFLARE_BUCKET_NAME;

  if (!bucketName || !accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Cloudflare R2 environment variables are missing. Please restart your dev server.");
  }

  const S3 = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  // Generate a unique path: year/month/random-filename
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const randomPrefix = Math.random().toString(36).substring(2, 10);
  const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `uploads/${year}/${month}/${randomPrefix}-${safeFilename}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  // URL expires in 15 minutes
  const url = await getSignedUrl(S3, command, { expiresIn: 900 });
  
  // Fallback to the known public dev URL if the env var is missing
  const publicUrl = process.env.VITE_CLOUDFLARE_PUBLIC_URL || "https://pub-31cdacf0ce134d38bfc7490b92bbcb00.r2.dev";

  return {
    uploadUrl: url,
    fileUrl: `${publicUrl}/${key}`,
    key,
  };
}

export async function uploadBufferToR2(buffer: Buffer | Uint8Array, key: string, contentType: string): Promise<string> {
  const { getEnv } = await import("@/lib/env");
  const accountId = getEnv("CLOUDFLARE_ACCOUNT_ID") || process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = getEnv("CLOUDFLARE_ACCESS_KEY_ID") || process.env.CLOUDFLARE_ACCESS_KEY_ID;
  const secretAccessKey = getEnv("CLOUDFLARE_SECRET_ACCESS_KEY") || process.env.CLOUDFLARE_SECRET_ACCESS_KEY;
  const bucketName = getEnv("CLOUDFLARE_BUCKET_NAME") || process.env.CLOUDFLARE_BUCKET_NAME;

  // 1. Try Cloudflare R2 direct S3 upload
  if (bucketName && accountId && accessKeyId && secretAccessKey) {
    try {
      const S3 = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });

      await S3.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }));

      const publicUrl = getEnv("VITE_CLOUDFLARE_PUBLIC_URL") || process.env.VITE_CLOUDFLARE_PUBLIC_URL || "https://pub-31cdacf0ce134d38bfc7490b92bbcb00.r2.dev";
      return `${publicUrl}/${key}`;
    } catch (r2Err) {
      console.warn("[uploadBufferToR2] Cloudflare R2 upload error, falling back to storage:", r2Err);
    }
  }

  // 2. Resilient fallback to Supabase Storage
  try {
    const { getAdminClient } = await import("@/integrations/supabase/admin");
    const supabase = getAdminClient();
    const { error } = await supabase.storage.from("default").upload(key, buffer, {
      contentType,
      upsert: true
    });
    if (!error) {
      const { data: signedData } = await supabase.storage.from("default").createSignedUrl(key, 7776000);
      if (signedData?.signedUrl) return signedData.signedUrl;
      const { data } = supabase.storage.from("default").getPublicUrl(key);
      return data.publicUrl;
    }
  } catch (storageErr) {
    console.warn("[uploadBufferToR2] Fallback storage error:", storageErr);
  }

  return "";
}
