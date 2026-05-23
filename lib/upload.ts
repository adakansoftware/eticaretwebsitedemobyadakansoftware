import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const allowedMimeTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"]
]);

export async function uploadFile(file: File, folder: string): Promise<string> {
  const extension = allowedMimeTypes.get(file.type);

  if (!extension) {
    throw new Error("Yalnizca JPEG, PNG, WEBP veya GIF dosyalari yuklenebilir.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Dosya boyutu en fazla 5 MB olabilir.");
  }

  const uploadDirectory = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(uploadDirectory, { recursive: true });

  const fileName = `${randomUUID()}.${extension}`;
  const filePath = path.join(uploadDirectory, fileName);
  const arrayBuffer = await file.arrayBuffer();

  await writeFile(filePath, Buffer.from(arrayBuffer));

  return `/uploads/${folder}/${fileName}`;
}
