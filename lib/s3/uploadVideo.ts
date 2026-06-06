import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { createReadStream, statSync } from "fs";

/**
 * Returns a configured S3 client.
 * Throws clearly if any required env var is missing.
 */
function getS3Client() {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Missing AWS credentials. Set AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY in .env.local"
    );
  }

  return new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export interface UploadToS3Options {
  /** Absolute path to the local temp file */
  filePath: string;
  /** Original file name (used to determine Content-Type) */
  fileName: string;
  /** S3 key prefix, e.g. "videos/uploads/" */
  keyPrefix?: string;
  /** Called with upload percentage (0–100) as the upload progresses */
  onProgress?: (percent: number) => void | Promise<void>;
}

export interface UploadToS3Result {
  /** S3 URL of the uploaded object */
  s3Url: string;
  /** Full S3 key of the object */
  s3Key: string;
  /** Bucket the object was uploaded to */
  bucket: string;
}

/**
 * Uploads a local video file to S3 using multipart upload.
 *
 * ⚠️  ACL is intentionally omitted — AWS blocks "public-read" on all new
 * buckets by default ("Block Public Access" setting). Instead, make the
 * bucket publicly accessible via a bucket policy if you need public URLs.
 *
 * Uses @aws-sdk/lib-storage Upload which:
 *  - Automatically splits large files into parts (5 MB each)
 *  - Retries failed parts automatically
 *  - Emits progress events per part
 *
 * @returns { s3Url, s3Key, bucket }
 */
export async function uploadVideoToS3({
  filePath,
  fileName,
  keyPrefix = "videos/uploads/",
  onProgress,
}: UploadToS3Options): Promise<UploadToS3Result> {
  const bucket = process.env.AWS_S3_BUCKET?.trim();
  if (!bucket) {
    throw new Error("Missing or empty AWS_S3_BUCKET env var");
  }

  const region = process.env.AWS_REGION!.trim();
  const s3Client = getS3Client();

  // Build a unique S3 key
  const sanitisedName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const s3Key = `${keyPrefix}${Date.now()}-${sanitisedName}`;

  // Detect MIME type from file extension
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const mimeTypes: Record<string, string> = {
    mp4: "video/mp4",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    mkv: "video/x-matroska",
    webm: "video/webm",
    m4v: "video/x-m4v",
    wmv: "video/x-ms-wmv",
    flv: "video/x-flv",
  };
  const contentType = mimeTypes[ext] ?? "video/mp4";

  // Get file size for progress tracking
  const fileStat = statSync(filePath);
  const totalBytes = fileStat.size;

  console.log(`[S3] Starting upload: ${fileName} (${(totalBytes / 1024 / 1024).toFixed(2)} MB) → s3://${bucket}/${s3Key}`);

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: bucket,
      Key: s3Key,
      Body: createReadStream(filePath),
      ContentType: contentType,
      // NOTE: No ACL here — new S3 buckets block ACLs by default.
      // To make files publicly accessible, add a bucket policy instead.
    },
    // Use 5 MB parts (minimum for multipart), 3 concurrent uploads
    // Small file (< 5 MB) will be uploaded as a single part automatically
    partSize: 5 * 1024 * 1024,
    queueSize: 3,
  });

  // Wire up progress events
  if (onProgress) {
    upload.on("httpUploadProgress", (progress) => {
      const loaded = progress.loaded ?? 0;
      const total = progress.total ?? totalBytes;
      if (total > 0) {
        const percent = Math.min(Math.round((loaded / total) * 100), 99);
        // Fire-and-forget so it doesn't block or throw inside the event handler
        Promise.resolve(onProgress(percent)).catch((e) => {
          console.warn("[S3] onProgress callback error (non-fatal):", e);
        });
      }
    });
  }

  try {
    await upload.done();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[S3] Upload failed: ${msg}`);
    throw new Error(`S3 upload failed: ${msg}`);
  }

  // Standard S3 virtual-hosted URL
  const s3Url = `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;
  console.log(`[S3] Upload complete → ${s3Url}`);

  return { s3Url, s3Key, bucket };
}
