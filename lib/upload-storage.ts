import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { env } from "@/lib/env";
import { buildSignedS3PutRequest, buildUploadObjectKey } from "@/lib/upload-storage-core";

type UploadObjectInput = {
  bytes: Uint8Array;
  contentType: string;
  extension: string;
  folder: string;
};

type UploadedObjectResult = {
  key: string;
  provider: "local" | "s3";
  url: string;
};

async function uploadToLocalStorage(input: UploadObjectInput): Promise<UploadedObjectResult> {
  const objectKey = buildUploadObjectKey(input.folder, input.extension, randomUUID());
  const filePath = path.join(process.cwd(), "public", "uploads", ...objectKey.split("/"));
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, Buffer.from(input.bytes));

  return {
    key: objectKey,
    provider: "local",
    url: `/uploads/${objectKey}`
  };
}

async function uploadToS3CompatibleStorage(input: UploadObjectInput): Promise<UploadedObjectResult> {
  const bucket = env.UPLOAD_S3_BUCKET;
  const region = env.UPLOAD_S3_REGION;
  const accessKeyId = env.UPLOAD_S3_ACCESS_KEY_ID;
  const secretAccessKey = env.UPLOAD_S3_SECRET_ACCESS_KEY;

  if (!bucket || !region || !accessKeyId || !secretAccessKey) {
    throw new Error("S3 upload konfigurasyonu eksik.");
  }

  const objectKey = buildUploadObjectKey(input.folder, input.extension, randomUUID());
  const signedRequest = buildSignedS3PutRequest({
    bucket,
    region,
    endpoint: env.UPLOAD_S3_ENDPOINT || undefined,
    forcePathStyle: env.UPLOAD_S3_FORCE_PATH_STYLE,
    publicBaseUrl: env.UPLOAD_PUBLIC_BASE_URL || undefined,
    accessKeyId,
    secretAccessKey,
    key: objectKey,
    body: input.bytes,
    contentType: input.contentType
  });

  const response = await fetch(signedRequest.url, {
    method: "PUT",
    headers: signedRequest.headers,
    body: Buffer.from(input.bytes)
  });

  if (!response.ok) {
    throw new Error(
      `Cloud upload basarisiz oldu (${response.status} ${response.statusText || "UNKNOWN"}).`
    );
  }

  return {
    key: objectKey,
    provider: "s3",
    url: signedRequest.publicUrl
  };
}

export async function uploadObject(input: UploadObjectInput): Promise<UploadedObjectResult> {
  if (env.UPLOAD_STORAGE_DRIVER === "s3") {
    return uploadToS3CompatibleStorage(input);
  }

  return uploadToLocalStorage(input);
}
