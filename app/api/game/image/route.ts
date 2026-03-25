import { NextResponse } from 'next/server';
import { getRandomImage } from '@/lib/r2';

export async function GET() {
  try {
    const imageData = await getRandomImage();
    
    if (!imageData) {
      return NextResponse.json(
        { error: 'No images available in the pool yet. Admin needs to upload some!' },
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
