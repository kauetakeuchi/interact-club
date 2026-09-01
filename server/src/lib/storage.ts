import path from "path";
import fs from "fs";

export const UPLOAD_DIR = path.join(__dirname, "../../../public/uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export function deleteLocalFile(imageUrl: string | null | undefined) {
  if (!imageUrl) return;
  if (!imageUrl.startsWith("/uploads/")) return;
  try {
    fs.unlinkSync(path.join(__dirname, "../../../public", imageUrl));
  } catch {}
}
