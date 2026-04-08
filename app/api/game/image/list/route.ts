import { NextResponse } from 'next/server';
import { getCachedImageKeys } from '@/lib/r2';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    
    let keys: string[] = [];
    
    if (category && category !== 'all') {
      keys = await redis.smembers(`category:${category}`);
    } else {
      keys = await getCachedImageKeys();
    }
    
    if (!keys || keys.length === 0) {
      return NextResponse.json(
        { error: 'No images available.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ keys });
  } catch (error) {
    console.error('Error fetching image list:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching image list' },
      { status: 500 }
    );
  }
}
