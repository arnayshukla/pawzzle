import { NextResponse } from 'next/server';
import { r2Client, bucketName } from '@/lib/r2';
import { GetObjectCommand, DeleteObjectsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!bucketName) {
      return NextResponse.json({ error: 'R2 bucket not configured' }, { status: 500 });
    }

    // Always fetch a perfectly fresh list for the admin interface (bypassing Next cache)
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: "images/",
    });
    const listRes = await r2Client.send(listCommand);
    const keys = listRes.Contents?.map(c => c.Key!).filter(Boolean) || [];
    
    // Fetch all categories and build a reverse map in memory O(C) reads
    const categories = await redis.smembers('categories');
    const imageTags = new Map<string, string[]>();
    
    if (categories && categories.length > 0) {
      const p = redis.pipeline();
      categories.forEach(cat => p.smembers(`category:${cat}`));
      const categorySets = await p.exec();
      
      categories.forEach((cat, index) => {
        const catKeys = categorySets[index] as string[];
        if (catKeys && Array.isArray(catKeys)) {
          catKeys.forEach(key => {
            if (!imageTags.has(key)) imageTags.set(key, []);
            imageTags.get(key)!.push(cat);
          });
        }
      });
    }

    // Generate presigned URLs for all images
    const images = await Promise.all(
      keys.map(async (key) => {
        const getCommand = new GetObjectCommand({ Bucket: bucketName, Key: key });
        const url = await getSignedUrl(r2Client, getCommand, { expiresIn: 3600 });
        return { key, url, tags: imageTags.get(key) || [] };
      })
    );

    // Sort by timestamp (reverse chronological so newest are first)
    images.sort((a, b) => b.key.localeCompare(a.key));
    
    return NextResponse.json(images);
  } catch (error) {
    console.error('Failed to fetch admin images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { keys } = await request.json();
    
    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json({ error: 'No keys provided' }, { status: 400 });
    }

    if (!bucketName) {
      return NextResponse.json({ error: 'R2 bucket not configured' }, { status: 500 });
    }

    const command = new DeleteObjectsCommand({
      Bucket: bucketName,
      Delete: {
        Objects: keys.map(k => ({ Key: k })),
      }
    });

    await r2Client.send(command);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete images' }, { status: 500 });
  }
}
