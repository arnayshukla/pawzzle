import { NextResponse } from 'next/server';
import { getDailyImage } from '@/lib/r2';
import { getDailySeedString } from '@/lib/random';

export async function GET() {
  try {
    const seed = getDailySeedString();
    const imageData = await getDailyImage(seed);
    
    if (!imageData) {
      return NextResponse.json(
        { error: 'No images available for the daily challenge.' },
        { status: 404 }
      );
    }
    
    // Pass the seed to the client so it knows the exact challenge date
    return NextResponse.json({ ...imageData, seedDate: seed });
  } catch (error) {
    console.error('Error fetching daily image:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching daily image' },
      { status: 500 }
    );
  }
}
