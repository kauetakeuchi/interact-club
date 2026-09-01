import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs";

export const UPLOAD_DIR = path.join(__dirname, "../../../public/uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

let cloudinaryConfigured = false;
try {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    cloudinaryConfigured = true;
  }
} catch {}

export function isCloudinaryEnabled(): boolean {
  return cloudinaryConfigured;
}

export async function uploadToCloudinary(fileBuffer: Buffer, fileName: string): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "interact-club", public_id: fileName, resource_type: "image" },
      (error: any, result: any) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    uploadStream.end(fileBuffer);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error: any) => {
      if (error) return reject(error);
      resolve();
    });
  });
}

export async function deleteImage(imageUrl: string | null | undefined): Promise<void> {
  if (!imageUrl) return;
  if (isCloudinaryUrl(imageUrl)) {
    const publicId = extractCloudinaryPublicId(imageUrl);
    if (publicId) await deleteFromCloudinary(publicId);
  } else {
    deleteLocalFile(imageUrl);
  }
}

export function deleteLocalFile(imageUrl: string | null | undefined) {
  if (!imageUrl) return;
  if (!imageUrl.startsWith("/uploads/")) return;
  try {
    fs.unlinkSync(path.join(__dirname, "../../../public", imageUrl));
  } catch {}
}

export function extractCloudinaryPublicId(imageUrl: string | undefined): string | null {
  if (!imageUrl) return null;
  const match = imageUrl.match(/\/upload\/v\d+\/(.+)$/);
  if (!match) return null;
  const withoutQuery = match[1].split("?")[0];
  return decodeURIComponent(withoutQuery.replace(/\.[^/.]+$/, ""));
}

export function isCloudinaryUrl(imageUrl: string | undefined): boolean {
  if (!imageUrl) return false;
  return imageUrl.includes("cloudinary.com") || imageUrl.startsWith("https://res.cloudinary.com");
}
