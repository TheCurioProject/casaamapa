import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function uploadVideos() {
  const videosDir = path.join(process.cwd(), 'public', 'videos');
  const dataDir = path.join(process.cwd(), 'public', 'data');

  if (!fs.existsSync(videosDir)) {
    console.error('Directory public/videos/ does not exist.');
    return;
  }

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const files = fs.readdirSync(videosDir).filter(f => f.toLowerCase().endsWith('.mov') || f.toLowerCase().endsWith('.mp4'));
  
  const toursData: Record<string, any> = {};

  console.log(`Found ${files.length} videos. Starting upload...`);

  for (const file of files) {
    const filePath = path.join(videosDir, file);
    // Determine apt id from filename (e.g. agua-rec.MOV -> agua)
    const aptId = file.split('-')[0].toLowerCase();
    
    console.log(`Uploading ${file} for apt ${aptId}...`);
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: "video",
        folder: "amapa/tours",
        public_id: aptId,
        overwrite: true
      });
      
      console.log(`Upload successful for ${aptId}: ${result.secure_url}`);
      console.log(`Duration: ${result.duration} seconds`);
      
      toursData[aptId] = {
        publicId: result.public_id,
        url: result.secure_url,
        duration: result.duration, // floating point seconds
        format: result.format
      };
    } catch (error) {
      console.error(`Error uploading ${file}:`, error);
    }
  }

  const outputJson = path.join(dataDir, 'tours.json');
  fs.writeFileSync(outputJson, JSON.stringify(toursData, null, 2));
  console.log(`Successfully wrote metadata to ${outputJson}`);
}

uploadVideos();
