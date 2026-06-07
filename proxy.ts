import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { env } from "@/lib/env";
import {
  buildTrustedOrigins,
  isMutatingMethod,
  isTrustedOriginRequest,
  parseTrustedOrigins
} from "@/lib/origin";
import { createRequestId, requestIdHeaderName } from "@/lib/request-context";

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
  const requestId = req.headers.get(requestIdHeaderName) ?? createRequestId();
  const isServerActionRequest = req.headers.has("next-action");

  const withRequestId = (response: NextResponse) => {
    if (isServerActionRequest) {
      return response;
    }

    response.headers.set(requestIdHeaderName, requestId);
    response.headers.set("x-content-type-options", "nosniff");
    response.headers.set("x-frame-options", "DENY");
    response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
    response.headers.set(
      "permissions-policy",
      "camera=(), microphone=(), geolocation=(), payment=()"
    );
    return response;
  };

  if (
    isMutatingMethod(req.method) &&
    !isTrustedOriginRequest({
      siteUrl: env.NEXT_PUBLIC_SITE_URL,
      configuredOrigins: buildTrustedOrigins(
        env.NEXT_PUBLIC_SITE_URL,
        parseTrustedOrigins(env.TRUSTED_ORIGINS)
      ),
      origin: req.headers.get("origin"),
      referer: req.headers.get("referer"),
      host: req.headers.get("host"),
      forwardedHost: req.headers.get("x-forwarded-host"),
      forwardedProto: req.headers.get("x-forwarded-proto")
    })
  ) {
    return withRequestId(new NextResponse("Forbidden", { status: 403 }));
  }

  if (isBypassedPath(pathname)) {
    return withRequestId(NextResponse.next());
  }

  if (pathname === "/admin/login") {
    return withRequestId(NextResponse.redirect(new URL("/admin-login", req.url)));
  }

  const isAdminLoginPath = pathname === "/admin-login";
  const isCustomerAuthPath = pathname === "/login" || pathname === "/register";
  const isAdminPath = pathname.startsWith("/admin");
  const isAccountPath = pathname.startsWith("/account");

  if (isAdminLoginPath || isCustomerAuthPath) {
    return withRequestId(NextResponse.next());
  }

  if (!isAdminPath && !isAccountPath) {
    return withRequestId(NextResponse.next());
  }

  const token = req.cookies.get("adakan_session")?.value;
  if (!token) {
    return withRequestId(
      NextResponse.redirect(new URL(isAdminPath ? "/admin-login" : "/login", req.url))
    );
  }

  const payload = await verifySessionToken(token);
  if (!payload) {
    return withRequestId(
      NextResponse.redirect(new URL(isAdminPath ? "/admin-login" : "/login", req.url))
    );
  }

  if (isAdminPath && payload.role !== "ADMIN") {
    return withRequestId(NextResponse.redirect(new URL("/", req.url)));
  }

  return withRequestId(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map)$).*)"
  ]
};
