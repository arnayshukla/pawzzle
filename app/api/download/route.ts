import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json({ error: 'Missing Image URL' }, { status: 400 });
  }

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error('Failed to fetch image from R2');

    const headers = new Headers(response.headers);
    // Force the browser to download the file instead of displaying it
    headers.set('Content-Disposition', 'attachment; filename="pawzzle_dog.jpg"');

    // Return the raw readable stream back to the client
    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Proxy Error:', error);
    return NextResponse.json({ error: 'Failed to proxy download' }, { status: 500 });
  }
}
