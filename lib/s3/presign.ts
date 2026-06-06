import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

/**
 * Given an S3 URL like `https://mybucket.s3.ap-south-1.amazonaws.com/videos/uploads/file.mp4`,
 * returns a presigned URL valid for 1 hour.
 * If the URL is not an S3 URL, it returns the original URL.
 */
export async function getPresignedUrl(videoUrl: string): Promise<string> {
  // Regex to extract bucket and key from standard S3 virtual-hosted URL
  const match = videoUrl.match(/https:\/\/([^.]+)\.s3\.[^.]+\.amazonaws\.com\/(.+)/);
  if (!match) {
    // Not an S3 URL, return as-is
    return videoUrl;
  }

  const bucket = match[1];
  const key = decodeURIComponent(match[2]);

  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  // Presign URL valid for 1 hour
  return await getSignedUrl(client, command, { expiresIn: 3600 });
}
