import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

// Force dynamic so it doesn't get statically cached forever at build time
export const dynamic = 'force-dynamic';

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
