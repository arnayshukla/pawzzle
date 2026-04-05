import { NextResponse } from 'next/server';
import { getRandomImage, getRandomImageByCategory } from '@/lib/r2';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const specificKey = searchParams.get('key');
    
    // Allow secure direct signing for Endless Mode challenge sharing
    if (specificKey && specificKey.startsWith('images/')) {
      const { bucketName, r2Client } = await import('@/lib/r2');
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
      
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: specificKey,
      });
      const url = await getSignedUrl(r2Client, getCommand, { expiresIn: 900 });
      return NextResponse.json({ key: specificKey, url });
    }

    let imageData;
    if (category && category !== 'all') {
      imageData = await getRandomImageByCategory(category);
    } else {
      // Fallback to purely random selection from default R2 bucket
      imageData = await getRandomImage();
    }
    
    if (!imageData) {
      return NextResponse.json(
        { error: 'No images available. Admin needs to upload some!' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(imageData);
  } catch (error) {
    console.error('Error fetching game image:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching image' },
      { status: 500 }
    );
  }
}
