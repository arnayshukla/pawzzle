import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function POST(req: Request) {
  try {
    const { packId } = await req.json();

    if (!packId || typeof packId !== 'string') {
      return NextResponse.json({ error: 'Valid packId is required' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimitKey = `rl:report:${ip}`;
    
    // Prevent spamming the report button
    const reports = await redis.incr(rateLimitKey);
    if (reports === 1) await redis.expire(rateLimitKey, 3600); // 1 hour cool off

    if (reports > 5) {
      return NextResponse.json({ error: 'Too many reports submitted' }, { status: 429 });
    }

    // Flag the pack for admin review
    const p = redis.pipeline();
    p.sadd('flagged:custom_packs', packId);
    // Setting a flag on the specific pack itself so the GET route instantly blocks it
    p.set(`custom_pack:${packId}:flagged`, 'true', { ex: 604800 }); // 7 days (max life)
    await p.exec();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reporting pack:', error);
    return NextResponse.json({ error: 'Internal server error while reporting' }, { status: 500 });
  }
}
