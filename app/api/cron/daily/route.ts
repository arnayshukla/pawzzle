import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:hello@arnayshukla.com', // placeholder
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

export async function GET(req: Request) {
  try {
    const targetTime = process.env.NEXT_PUBLIC_NOTIFICATION_TIME || '08:30';
    const [targetHour, targetMinute] = targetTime.split(':').map(Number);
    
    const subscriptionsRaw = await redis.hgetall('push:subscriptions');
    if (!subscriptionsRaw) {
      return NextResponse.json({ success: true, message: 'No subscriptions found' });
    }

    const payload = JSON.stringify({
      title: process.env.NOTIFICATION_TITLE || 'New Daily Pawzzle! 🐶',
      body: process.env.NOTIFICATION_BODY || 'Can you beat today\'s challenge?',
      url: '/daily'
    });

    let sentCount = 0;
    const errors: string[] = [];
    const staleEndpoints: string[] = [];

    const subscriptions = typeof subscriptionsRaw === 'object' && !Array.isArray(subscriptionsRaw) 
      ? Object.values(subscriptionsRaw) 
      : (subscriptionsRaw as any[]);

    const pushPromises = subscriptions.map(async (subStr) => {
      try {
        const data = typeof subStr === 'string' ? JSON.parse(subStr) : subStr;
        const { subscription, timezone } = data;

        if (!timezone || !subscription) return;

        const nowInTimezone = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          hour: 'numeric',
          minute: 'numeric',
          hour12: false
        }).format(new Date()); 
        
        const [currentHour, currentMinute] = nowInTimezone.split(':').map(Number);
        
        // Match the target hour and allow a 15 min drift (since the cron runs explicitly on the 0 and 30 intervals)
        const isTargetTime = currentHour === targetHour && Math.abs(currentMinute - targetMinute) <= 15;

        const url = new URL(req.url);
        const force = url.searchParams.get('force') === 'true';

        if (isTargetTime || force) {
          await webpush.sendNotification(subscription, payload);
          sentCount++;
        }
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Track stale endpoints to clean up Redis logic
          const data = typeof subStr === 'string' ? JSON.parse(subStr) : subStr;
          staleEndpoints.push(data.subscription?.endpoint);
        }
        errors.push(err.message || 'Unknown error');
      }
    });

    await Promise.allSettled(pushPromises);
    
    // Cleanup unsubs
    if (staleEndpoints.length > 0) {
      await redis.hdel('push:subscriptions', ...staleEndpoints);
    }

    return NextResponse.json({ success: true, sentCount, staleEndpointsRemoved: staleEndpoints.length, errors });
  } catch (error: any) {
    console.error('Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
