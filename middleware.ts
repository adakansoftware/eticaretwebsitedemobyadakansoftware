import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("adakan_session")?.value;
  const isAdminPath = req.nextUrl.pathname.startsWith("/admin");
  if (!isAdminPath) return NextResponse.next();
  if (!token || !process.env.AUTH_SECRET) return NextResponse.redirect(new URL("/login", req.url));
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
    if (payload.role !== "ADMIN") return NextResponse.redirect(new URL("/", req.url));
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = { matcher: ["/admin/:path*"] };
