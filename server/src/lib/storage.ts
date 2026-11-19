import { v2 as cloudinary, type UploadApiErrorResponse, type UploadApiResponse } from "cloudinary";
import path from "path";
import fs from "fs";
import { logError } from "./logger";

export const publicDir = path.resolve(__dirname, "../../../public");
export const UPLOAD_DIR = path.join(publicDir, "uploads");

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
      (error?: UploadApiErrorResponse, result?: UploadApiResponse) => {
        if (error || !result) return reject(error ?? new Error("Upload sem resposta do Cloudinary"));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    uploadStream.end(fileBuffer);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error?: UploadApiErrorResponse) => {
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

/**
 * Apaga uma imagem que deixou de ser usada, sem nunca derrubar a requisição.
 * Usado depois que o banco já foi atualizado: se a limpeza falhar (ex.: Cloudinary
 * fora do ar), a alteração continua valendo e o erro fica só no log.
 */
export async function discardImage(imageUrl: string | null | undefined, context: string): Promise<void> {
  try {
    await deleteImage(imageUrl);
  } catch (err) {
    logError(`storage/${context}`, err);
  }
}

export function deleteLocalFile(imageUrl: string | null | undefined) {
  if (!imageUrl) return;
  if (!/^\/uploads\/[A-Za-z0-9_-]+\.(?:jpe?g|png|webp|gif)$/i.test(imageUrl)) return;
  try {
    fs.unlinkSync(path.join(UPLOAD_DIR, path.basename(imageUrl)));
  } catch {}
}

export function extractCloudinaryPublicId(imageUrl: string | undefined): string | null {
  if (!isCloudinaryUrl(imageUrl)) return null;
  const url = new URL(imageUrl!);
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const prefix = `/${cloudName}/image/upload/`;
  if (!url.pathname.startsWith(prefix)) return null;
  const match = url.pathname.slice(prefix.length).match(/^v\d+\/(interact-club\/[A-Za-z0-9_-]+)\.(?:jpe?g|png|webp|gif)$/i);
  return match?.[1] ?? null;
}

export function isCloudinaryUrl(imageUrl: string | undefined): boolean {
  if (!imageUrl) return false;
  try {
    const url = new URL(imageUrl);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}
