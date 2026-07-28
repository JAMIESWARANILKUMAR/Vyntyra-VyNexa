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
