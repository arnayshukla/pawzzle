import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, bucketName } from '@/lib/r2';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ packId: string }> }) {
  try {
    // Next 15+ compatible params destructuring
    const resolved = await params;
    const packId = resolved.packId;

    if (!packId || typeof packId !== 'string') {
      return NextResponse.json({ error: 'Invalid pack ID' }, { status: 400 });
    }

    // Check if flagged for moderation
    const isFlagged = await redis.get(`custom_pack:${packId}:flagged`);
    if (isFlagged) {
      return NextResponse.json({ 
        error: 'This puzzle pack has been suspended pending review due to a user report.',
        flagged: true 
      }, { status: 403 });
    }

    // O(1) random key select directly from the Redis set!
    const key = await redis.srandmember(`custom_pack:${packId}`);
    
    if (!key || typeof key !== 'string') {
      return NextResponse.json({ 
        error: 'This custom pack has expired or does not exist.',
        expired: true
      }, { status: 404 });
    }

    if (!bucketName) {
      return NextResponse.json({ error: 'R2 bucket not configured' }, { status: 500 });
    }

    // Generate signed URL
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const url = await getSignedUrl(r2Client, getCommand, { expiresIn: 900 });

    return NextResponse.json({ key, url });
  } catch (error) {
    console.error('Error fetching custom pack image:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching custom pack image' },
      { status: 500 }
    );
  }
}
