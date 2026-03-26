import { NextResponse } from 'next/server';
import { getCachedImageKeys, r2Client, bucketName } from '@/lib/r2';
import { GetObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function GET() {
  try {
    const keys = await getCachedImageKeys();
    
    // Generate presigned URLs for all images
    const images = await Promise.all(
      keys.map(async (key) => {
        const getCommand = new GetObjectCommand({ Bucket: bucketName, Key: key });
        const url = await getSignedUrl(r2Client, getCommand, { expiresIn: 3600 });
        return { key, url };
      })
    );

    // Sort by timestamp (reverse chronological so newest are first)
    // The keys are of the form: images/1774456293837-UUID-file.jpg
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
