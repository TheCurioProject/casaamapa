import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@/auth';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
    if (!allowedTypes.has(file.type)) {
      return NextResponse.json({ error: 'Formato de imagen no permitido' }, { status: 415 });
    }
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: 'La imagen excede el límite de 8 MB' }, { status: 413 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary using upload_stream
    const uploadResult = await new Promise<{ secure_url?: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'casaamapa/ids' },
        (error, result) => {
          if (error) reject(error);
          else if (result) resolve(result);
          else reject(new Error('Cloudinary no devolvió resultado'));
        }
      );
      uploadStream.end(buffer);
    });

    if (!uploadResult.secure_url) {
      return NextResponse.json({ error: 'Cloudinary no devolvió una URL segura' }, { status: 502 });
    }
    return NextResponse.json({ success: true, url: uploadResult.secure_url });
  } catch (error: unknown) {
    console.error('Error uploading to Cloudinary:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error uploading file' }, { status: 500 });
  }
}
