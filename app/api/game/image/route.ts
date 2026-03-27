import { NextResponse } from 'next/server';
import { getRandomImage, getRandomImageByCategory } from '@/lib/r2';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    
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
