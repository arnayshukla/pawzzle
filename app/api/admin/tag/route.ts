import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function POST(req: Request) {
  try {
    const { keys, tag } = await req.json();

    if (!keys || !Array.isArray(keys) || keys.length === 0 || !tag) {
      return NextResponse.json({ error: 'Missing keys or tag' }, { status: 400 });
    }

    const sanitizedTag = tag.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (!sanitizedTag) {
      return NextResponse.json({ error: 'Invalid tag format' }, { status: 400 });
    }

    const p = redis.pipeline();
    // Register the category in the master catalog
    p.sadd('categories', sanitizedTag);
    
    // Add all uploaded keys to this category bin
    for (const key of keys) {
      p.sadd(`category:${sanitizedTag}`, key);
    }
    
    await p.exec();

    return NextResponse.json({ success: true, count: keys.length, tag: sanitizedTag });
  } catch (error) {
    console.error('Error back-tagging images:', error);
    return NextResponse.json({ error: 'Internal server error while tagging' }, { status: 500 });
  }
}
