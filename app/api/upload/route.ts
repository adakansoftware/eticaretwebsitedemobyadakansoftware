import { buildErrorApiResponse, buildJsonApiResponse } from "@/lib/api-response";
import { adminPermissions, requireAdminPermission } from "@/lib/auth";
import { logError } from "@/lib/logger";
import { enforceRateLimit, getRequestFingerprint } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-context";
import { assertTrustedMutation } from "@/lib/security";
import { MAX_UPLOAD_REQUEST_SIZE, uploadFile } from "@/lib/upload";

const allowedFolders = new Set(["products", "banners", "brands", "categories"]);

export async function POST(request: Request) {
  const requestId = await getRequestId();
  const contentLength = Number(request.headers.get("content-length") ?? 0);

  try {
    await assertTrustedMutation("admin:upload");
  } catch (error) {
    return buildErrorApiResponse(error, requestId, "Yetkisiz istek", 403);
  }

  let currentUser;
  try {
    currentUser = await requireAdminPermission(adminPermissions.mediaUpload);
  } catch {
    return buildJsonApiResponse(
      { message: "Yetkisiz erisim", requestId },
      requestId,
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const folder = searchParams.get("field")?.trim() ?? "";

  if (!allowedFolders.has(folder)) {
    return buildJsonApiResponse(
      { message: "Gecersiz yukleme alani", requestId },
      requestId,
      { status: 400 }
    );
  }

  if (contentLength > MAX_UPLOAD_REQUEST_SIZE) {
    return buildJsonApiResponse(
      { message: "Istek boyutu siniri asildi.", requestId },
      requestId,
      { status: 413 }
    );
  }

  try {
    const fingerprint = await getRequestFingerprint();
    await enforceRateLimit({
      scope: "admin:upload",
      key: `${currentUser.id}|${folder}|${fingerprint}`,
      limit: 30,
      windowMs: 60 * 1000,
      message: "Cok fazla dosya yukleme denemesi yapildi. Lutfen biraz sonra tekrar deneyin."
    });
  } catch (error) {
    return buildErrorApiResponse(
      error,
      requestId,
      "Yukleme limiti asildi. Lutfen daha sonra tekrar deneyin.",
      429
    );
  }

  const formData = await request.formData();
  const files = formData.getAll("file");

  if (files.length !== 1) {
    return buildJsonApiResponse(
      { message: "Tek seferde yalnizca bir dosya yuklenebilir.", requestId },
      requestId,
      { status: 400 }
    );
  }

  const [file] = files;

  if (!(file instanceof File)) {
    return buildJsonApiResponse(
      { message: "Gecerli bir dosya secilmedi.", requestId },
      requestId,
      { status: 400 }
    );
  }

  try {
    const url = await uploadFile(file, folder);
    return buildJsonApiResponse({ url, requestId }, requestId);
  } catch (error) {
    await logError("admin.upload_failed", error, {
      adminUserId: currentUser.id,
      folder
    });
    return buildErrorApiResponse(error, requestId, "Dosya yuklenemedi. Lutfen tekrar deneyin.");
  }
}
