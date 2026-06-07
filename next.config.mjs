import path from "node:path";
import { fileURLToPath } from "node:url";
import { withSentryConfig } from "@sentry/nextjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const remotePatterns = [
  { protocol: "https", hostname: "images.unsplash.com" },
  { protocol: "http", hostname: "localhost", port: "3000" }
];

for (const candidate of [
  process.env.UPLOAD_PUBLIC_BASE_URL,
  process.env.UPLOAD_S3_ENDPOINT
].filter(Boolean)) {
  try {
    const url = new URL(candidate);
    remotePatterns.push({
      protocol: url.protocol.replace(":", ""),
      hostname: url.hostname,
      port: url.port || undefined
    });
  } catch {}
}

if (
  process.env.UPLOAD_STORAGE_DRIVER === "s3" &&
  process.env.UPLOAD_S3_BUCKET &&
  process.env.UPLOAD_S3_REGION &&
  !process.env.UPLOAD_S3_ENDPOINT &&
  !process.env.UPLOAD_PUBLIC_BASE_URL
) {
  remotePatterns.push({
    protocol: "https",
    hostname: `${process.env.UPLOAD_S3_BUCKET}.s3.${process.env.UPLOAD_S3_REGION}.amazonaws.com`
  });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname
  },
  images: {
    remotePatterns
  }
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN
  }
});
