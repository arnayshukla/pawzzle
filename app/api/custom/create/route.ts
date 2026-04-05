import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, bucketName } from '@/lib/r2';
import { redis } from '@/lib/redis';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimitKey = `rl:custom_upload:${ip}`;
    
    // Max 2 pack creations per 24 hours per IP to combat spam
    const uploadAttempts = await redis.incr(rateLimitKey);
    if (uploadAttempts === 1) {
      await redis.expire(rateLimitKey, 86400); // 24 hours
    }
    
    if (uploadAttempts > 2) {
      return NextResponse.json({ error: 'Upload limit reached. Try again tomorrow.' }, { status: 429 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    const maxImages = parseInt(process.env.NEXT_PUBLIC_MAX_CUSTOM_IMAGES || '5', 10);
    const expiryDays = parseInt(process.env.CUSTOM_PACK_EXPIRY_DAYS || '7', 10);

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (files.length > maxImages) {
      return NextResponse.json({ error: `You can only upload up to ${maxImages} images per pack.` }, { status: 400 });
    }

    if (!bucketName) {
      return NextResponse.json({ error: 'R2 bucket not configured' }, { status: 500 });
    }

    const packId = randomUUID();
    const allowedMimeTypes = ['image/webp', 'image/jpeg', 'image/png'];
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB guard (mostly pre-compressed by client)

    const uploadPromises = files.map(async (file, index) => {
      // Security Validation
      if (!allowedMimeTypes.includes(file.type)) {
        throw new Error(`File type ${file.type} is not allowed.`);
      }
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File ${file.name} exceeds 5MB limit.`);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      // Enforce webp format saving to match client-side optimization
      const fileName = `custom/${packId}/${index}.webp`;

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: buffer,
        ContentType: file.type, // usually image/webp
      });

      await r2Client.send(command);
      return fileName;
    });

    const uploadedKeys = await Promise.all(uploadPromises);

    // Save pack mapping to Redis with Expiry to match the R2 Lifecycle Rule
    const expirySeconds = expiryDays * 24 * 60 * 60;
    
    const p = redis.pipeline();
    uploadedKeys.forEach(key => p.sadd(`custom_pack:${packId}`, key));
    p.expire(`custom_pack:${packId}`, expirySeconds);
    await p.exec();

    return NextResponse.json({ success: true, packId });
  } catch (error: any) {
    console.error('Custom Pack Upload Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload images' }, { status: 500 });
  }
}
