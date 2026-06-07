import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { env } from "@/lib/env";
import {
  buildTrustedOrigins,
  isMutatingMethod,
  isTrustedOriginRequest,
  parseTrustedOrigins
} from "@/lib/origin";
import {
  createRequestId,
  forwardedMethodHeaderName,
  forwardedPathHeaderName,
  requestIdHeaderName
} from "@/lib/request-context";
import { sessionAudience, sessionIssuer, sessionSecret } from "@/lib/session-config";

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
  try {
    const { payload } = await jwtVerify(
      token,
      sessionSecret,
      {
        issuer: sessionIssuer,
        audience: sessionAudience
      }
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
  const forwardedHeaders = new Headers(req.headers);
  forwardedHeaders.set(requestIdHeaderName, requestId);
  forwardedHeaders.set(forwardedMethodHeaderName, req.method);
  forwardedHeaders.set(forwardedPathHeaderName, req.nextUrl.pathname);

  const withSecurityHeaders = (response: NextResponse) => {
    if (isServerActionRequest) {
      return response;
    }

    response.headers.set(requestIdHeaderName, requestId);
    response.headers.set("x-content-type-options", "nosniff");
    response.headers.set("x-frame-options", "DENY");
    response.headers.set("cross-origin-opener-policy", "same-origin");
    response.headers.set("cross-origin-resource-policy", "same-origin");
    response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
    response.headers.set(
      "permissions-policy",
      "camera=(), microphone=(), geolocation=(), payment=()"
    );
    return response;
  };

  const next = () =>
    withSecurityHeaders(
      NextResponse.next({
        request: {
          headers: forwardedHeaders
        }
      })
    );

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
    return withSecurityHeaders(new NextResponse("Forbidden", { status: 403 }));
  }

  if (isBypassedPath(pathname)) {
    return next();
  }

  if (pathname === "/admin/login") {
    return withSecurityHeaders(NextResponse.redirect(new URL("/admin-login", req.url)));
  }

  const isAdminLoginPath = pathname === "/admin-login";
  const isCustomerAuthPath = pathname === "/login" || pathname === "/register";
  const isAdminPath = pathname.startsWith("/admin");
  const isAccountPath = pathname.startsWith("/account");

  if (isAdminLoginPath || isCustomerAuthPath) {
    return next();
  }

  if (!isAdminPath && !isAccountPath) {
    return next();
  }

  const token = req.cookies.get("adakan_session")?.value;
  if (!token) {
    return withSecurityHeaders(
      NextResponse.redirect(new URL(isAdminPath ? "/admin-login" : "/login", req.url))
    );
  }

  const payload = await verifySessionToken(token);
  if (!payload) {
    return withSecurityHeaders(
      NextResponse.redirect(new URL(isAdminPath ? "/admin-login" : "/login", req.url))
    );
  }

  if (isAdminPath && payload.role !== "ADMIN") {
    return withSecurityHeaders(NextResponse.redirect(new URL("/", req.url)));
  }

  return next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map)$).*)"
  ]
};
