import { uploadObject } from "@/lib/upload-storage";
import { detectUploadExtension, MAX_FILE_SIZE, MAX_UPLOAD_REQUEST_SIZE } from "@/lib/upload-core";

export { MAX_FILE_SIZE, MAX_UPLOAD_REQUEST_SIZE, detectUploadExtension };

export async function uploadFile(file: File, folder: string): Promise<string> {
  const { extension, bytes } = await detectUploadExtension(file);
  const result = await uploadObject({
    bytes,
    contentType: file.type,
    extension,
    folder
  });

  return result.url;
}
