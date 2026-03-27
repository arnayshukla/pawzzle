import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { unstable_cache } from "next/cache";
import { getSeededRandom } from "./random";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

export const bucketName = process.env.R2_BUCKET_NAME;

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId || "",
    secretAccessKey: secretAccessKey || "",
  },
});

export const getCachedImageKeys = unstable_cache(
  async () => {
    if (!bucketName) return [];
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: "images/",
    });
    try {
      const response = await r2Client.send(command);
      return response.Contents?.map(c => c.Key!).filter(Boolean) || [];
    } catch (error) {
      console.error("Error fetching objects from R2:", error);
      return [];
    }
  },
  ['r2-image-list'],
  { revalidate: 5 }
);

export async function getRandomImage() {
  const keys = await getCachedImageKeys();
  
  if (keys.length === 0) {
    return null;
  }

  // Pick a random image
  const key = keys[Math.floor(Math.random() * keys.length)];

  // Generate a presigned URL valid for 15 minutes (900 seconds)
  const getCommand = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const url = await getSignedUrl(r2Client, getCommand, { expiresIn: 900 });

  return { key, url };
}

export async function getDailyImage(seedString: string) {
  const keys = await getCachedImageKeys();
  
  if (keys.length === 0) {
    return null;
  }

  // Use the PRNG seeded by today's date to deterministically pick one image
  const prng = getSeededRandom(seedString);
  const randomIndex = Math.floor(prng() * keys.length);
  const key = keys[randomIndex];

  const getCommand = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const url = await getSignedUrl(r2Client, getCommand, { expiresIn: 900 });

  return { key, url };
}
