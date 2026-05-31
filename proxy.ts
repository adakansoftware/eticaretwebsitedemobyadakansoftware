import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const publicAssetPattern = /\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map)$/i;

function isBypassedPath(pathname: string) {
  return (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    publicAssetPattern.test(pathname)
  );
}

async function verifySessionToken(token: string) {
  if (!process.env.AUTH_SECRET) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.AUTH_SECRET)
    );

    return payload;
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isBypassedPath(pathname)) {
    return NextResponse.next();
  }

  if (pathname === "/admin/login") {
    return NextResponse.redirect(new URL("/admin-login", req.url));
  }

  const isAdminLoginPath = pathname === "/admin-login";
  const isCustomerAuthPath = pathname === "/login" || pathname === "/register";
  const isAdminPath = pathname.startsWith("/admin");
  const isAccountPath = pathname.startsWith("/account");

  if (isAdminLoginPath || isCustomerAuthPath) {
    return NextResponse.next();
  }

  if (!isAdminPath && !isAccountPath) {
    return NextResponse.next();
  }

  const token = req.cookies.get("adakan_session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL(isAdminPath ? "/admin-login" : "/login", req.url));
  }

  const payload = await verifySessionToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL(isAdminPath ? "/admin-login" : "/login", req.url));
  }

  if (isAdminPath && payload.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map)$).*)"
  ]
};
