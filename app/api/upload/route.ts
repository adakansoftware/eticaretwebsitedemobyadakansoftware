import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { enforceRateLimit, getRequestFingerprint } from "@/lib/rate-limit";
import { uploadFile } from "@/lib/upload";

const allowedFolders = new Set(["products", "banners", "brands", "categories"]);

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ message: "Yetkisiz erisim" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const folder = searchParams.get("field")?.trim() ?? "";

  if (!allowedFolders.has(folder)) {
    return NextResponse.json({ message: "Gecersiz yukleme alani" }, { status: 400 });
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
            : "Yukleme limiti asildi. Lutfen daha sonra tekrar deneyin."
      },
      { status: 429 }
    );
  }

  const formData = await request.formData();
  const files = formData.getAll("file");

  if (files.length !== 1) {
    return NextResponse.json({ message: "Tek seferde yalnizca bir dosya yuklenebilir." }, { status: 400 });
  }

  const [file] = files;

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Gecerli bir dosya secilmedi." }, { status: 400 });
  }

  try {
    const url = await uploadFile(file, folder);
    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Dosya yuklenemedi. Lutfen tekrar deneyin."
      },
      { status: 400 }
    );
  }
}
