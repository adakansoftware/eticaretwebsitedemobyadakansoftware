import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_UPLOAD_REQUEST_SIZE = 6 * 1024 * 1024;

const allowedMimeTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"]
]);

function hasSignature(bytes: Uint8Array, signature: number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

export async function detectUploadExtension(file: File) {
  const extension = allowedMimeTypes.get(file.type);

  if (!extension) {
    throw new Error("Yalnizca JPEG, PNG, WEBP veya GIF dosyalari yuklenebilir.");
  }

  if (file.size <= 0) {
    throw new Error("Bos dosya yuklenemez.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Dosya boyutu en fazla 5 MB olabilir.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const validSignature =
    (extension === "jpg" && hasSignature(bytes, [0xff, 0xd8, 0xff])) ||
    (extension === "png" && hasSignature(bytes, [0x89, 0x50, 0x4e, 0x47])) ||
    (extension === "gif" &&
      (hasSignature(bytes, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
        hasSignature(bytes, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]))) ||
    (extension === "webp" &&
      hasSignature(bytes, [0x52, 0x49, 0x46, 0x46]) &&
      hasSignature(bytes.slice(8), [0x57, 0x45, 0x42, 0x50]));

  if (!validSignature) {
    throw new Error("Dosya icerigi bildirilen gorsel turu ile eslesmiyor.");
  }

  return { extension, bytes };
}

export async function uploadFile(file: File, folder: string): Promise<string> {
  const { extension, bytes } = await detectUploadExtension(file);
  const uploadDirectory = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(uploadDirectory, { recursive: true });

  const fileName = `${randomUUID()}.${extension}`;
  const filePath = path.join(uploadDirectory, fileName);

  await writeFile(filePath, Buffer.from(bytes));

  return `/uploads/${folder}/${fileName}`;
}
