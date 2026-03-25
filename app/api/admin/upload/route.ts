import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, bucketName } from '@/lib/r2';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (!bucketName) {
      return NextResponse.json({ error: 'R2 bucket not configured' }, { status: 500 });
    }

    const uploadPromises = files.map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      const uniqueId = crypto.randomUUID();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `images/${Date.now()}-${uniqueId}-${safeName}`;

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
      });

      await r2Client.send(command);
      return fileName;
    });

    const uploadedKeys = await Promise.all(uploadPromises);

    return NextResponse.json({ success: true, uploadedKeys });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload files' }, { status: 500 });
  }
}
