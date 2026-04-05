import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

// Cache categories for 1 hour (3600 seconds) so homepage loads consume 0 KV reads!
export const revalidate = 3600;

export async function GET() {
  try {
    // Read list of unique categories we've saved
    const categories = await redis.smembers('categories');
    return NextResponse.json({ categories: categories || [] });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ categories: [] });
  }
}
