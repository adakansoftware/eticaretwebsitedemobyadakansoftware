import { createHash, createHmac, randomUUID } from "node:crypto";

type S3TargetInput = {
  bucket: string;
  region: string;
  key: string;
  endpoint?: string;
  forcePathStyle?: boolean;
  publicBaseUrl?: string;
};

type SignedS3PutRequestInput = S3TargetInput & {
  accessKeyId: string;
  secretAccessKey: string;
  body: Uint8Array;
  contentType: string;
  now?: Date;
};

function toHexSha256(value: Uint8Array | string) {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key: Uint8Array | string, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

function formatAmzDate(value: Date) {
  const iso = value.toISOString();
  return `${iso.slice(0, 4)}${iso.slice(5, 7)}${iso.slice(8, 10)}T${iso.slice(11, 13)}${iso.slice(14, 16)}${iso.slice(17, 19)}Z`;
}

function encodePathSegment(value: string) {
  return encodeURIComponent(value).replace(/[!*'()]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function normalizeBasePath(pathname: string) {
  if (!pathname || pathname === "/") {
    return "";
  }

  return pathname.replace(/\/+$/, "");
}

function inferAwsEndpoint(region: string) {
  return new URL(`https://s3.${region}.amazonaws.com`);
}

export function sanitizeUploadFolder(folder: string) {
  const normalized = folder.trim().replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");

  if (!normalized) {
    throw new Error("Gecersiz yukleme klasoru.");
  }

  const segments = normalized.split("/");

  if (
    segments.some(
      (segment) =>
        !segment ||
        segment === "." ||
        segment === ".." ||
        !/^[a-z0-9_-]+$/i.test(segment)
    )
  ) {
    throw new Error("Gecersiz yukleme klasoru.");
  }

  return segments.join("/");
}

export function buildUploadObjectKey(folder: string, extension: string, objectId = randomUUID()) {
  const normalizedFolder = sanitizeUploadFolder(folder);
  const normalizedExtension = extension.trim().replace(/^\.+/, "").toLowerCase();

  if (!/^[a-z0-9]+$/i.test(normalizedExtension)) {
    throw new Error("Gecersiz dosya uzantisi.");
  }

  return `${normalizedFolder}/${objectId}.${normalizedExtension}`;
}

export function resolveS3ObjectTarget(input: S3TargetInput) {
  const endpoint = input.endpoint ? new URL(input.endpoint) : inferAwsEndpoint(input.region);
  const normalizedBasePath = normalizeBasePath(endpoint.pathname);
  const normalizedKey = input.key
    .split("/")
    .filter(Boolean)
    .map((segment) => encodePathSegment(segment))
    .join("/");

  if (normalizedBasePath && !input.forcePathStyle) {
    throw new Error(
      "Path prefix iceren S3 endpoint'lerinde UPLOAD_S3_FORCE_PATH_STYLE=true kullanilmalidir."
    );
  }

  const host = input.forcePathStyle
    ? endpoint.host
    : `${input.bucket}.${endpoint.host}`;
  const pathname = input.forcePathStyle
    ? `${normalizedBasePath}/${encodePathSegment(input.bucket)}/${normalizedKey}`
    : `${normalizedBasePath}/${normalizedKey}`;
  const targetUrl = new URL(endpoint.toString());
  targetUrl.host = host;
  targetUrl.pathname = pathname;

  const publicBase = input.publicBaseUrl?.trim();
  const publicUrl = publicBase
    ? new URL(normalizedKey, `${publicBase.replace(/\/+$/, "")}/`).toString()
    : targetUrl.toString();

  return {
    url: targetUrl.toString(),
    publicUrl,
    host,
    pathname,
    region: input.region
  };
}

export function buildSignedS3PutRequest(input: SignedS3PutRequestInput) {
  const target = resolveS3ObjectTarget(input);
  const now = input.now ?? new Date();
  const amzDate = formatAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = toHexSha256(input.body);
  const credentialScope = `${dateStamp}/${target.region}/s3/aws4_request`;
  const canonicalHeaders =
    `content-type:${input.contentType}\n` +
    `host:${target.host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest =
    `PUT\n${target.pathname}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const stringToSign =
    `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${toHexSha256(canonicalRequest)}`;
  const signingKey = hmac(
    hmac(
      hmac(hmac(`AWS4${input.secretAccessKey}`, dateStamp), target.region),
      "s3"
    ),
    "aws4_request"
  );
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");

  return {
    url: target.url,
    publicUrl: target.publicUrl,
    headers: {
      "content-type": input.contentType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      authorization:
        `AWS4-HMAC-SHA256 Credential=${input.accessKeyId}/${credentialScope}, ` +
        `SignedHeaders=${signedHeaders}, Signature=${signature}`
    }
  };
}
