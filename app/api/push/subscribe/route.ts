import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function POST(req: Request) {
  try {
    const { subscription, timezone } = await req.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    // Save subscription to Redis
    await redis.hset('push:subscriptions', {
      [subscription.endpoint]: JSON.stringify({
        subscription,
        timezone,
        createdAt: Date.now()
      })
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving subscription:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
