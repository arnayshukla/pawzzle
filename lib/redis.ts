import { Redis } from '@upstash/redis';

// Vercel KV injects KV_REST_API_URL and KV_REST_API_TOKEN
// Alternatively if using raw Upstash, it might use UPSTASH_REDIS_REST_URL
export const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});
