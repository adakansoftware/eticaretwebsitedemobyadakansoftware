import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { logError } from "@/lib/logger";
import { enforceRateLimit, getRequestFingerprint } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-context";
import { assertTrustedMutation } from "@/lib/security";
import { uploadFile } from "@/lib/upload";

const allowedFolders = new Set(["products", "banners", "brands", "categories"]);

export async function POST(request: Request) {
  const requestId = await getRequestId();

  try {
    await assertTrustedMutation("admin:upload");
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Yetkisiz istek", requestId },
      { status: 403, headers: { "x-request-id": requestId } }
    );
  }

  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json(
      { message: "Yetkisiz erisim", requestId },
      { status: 403, headers: { "x-request-id": requestId } }
    );
  }

  const { searchParams } = new URL(request.url);
  const folder = searchParams.get("field")?.trim() ?? "";

  if (!allowedFolders.has(folder)) {
    return NextResponse.json(
      { message: "Gecersiz yukleme alani", requestId },
      { status: 400, headers: { "x-request-id": requestId } }
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
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Yukleme limiti asildi. Lutfen daha sonra tekrar deneyin.",
        requestId
      },
      { status: 429, headers: { "x-request-id": requestId } }
    );
  }

  const formData = await request.formData();
  const files = formData.getAll("file");

  if (files.length !== 1) {
    return NextResponse.json(
      { message: "Tek seferde yalnizca bir dosya yuklenebilir.", requestId },
      { status: 400, headers: { "x-request-id": requestId } }
    );
  }

  const [file] = files;

  if (!(file instanceof File)) {
    return NextResponse.json(
      { message: "Gecerli bir dosya secilmedi.", requestId },
      { status: 400, headers: { "x-request-id": requestId } }
    );
  }

  try {
    const url = await uploadFile(file, folder);
    return NextResponse.json({ url, requestId }, { headers: { "x-request-id": requestId } });
  } catch (error) {
    await logError("admin.upload_failed", error, {
      adminUserId: currentUser.id,
      folder
    });
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Dosya yuklenemedi. Lutfen tekrar deneyin.",
        requestId
      },
      { status: 400, headers: { "x-request-id": requestId } }
    );
  }
}
