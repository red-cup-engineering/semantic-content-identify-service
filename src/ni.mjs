import { createHash } from "node:crypto";

export const CANONICAL_SHA256_NI_PATTERN_SOURCE =
  "ni:///sha-256;[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]";

const NI_PREFIX = "ni:///sha-256;";
const NI_PATTERN = new RegExp(`^${CANONICAL_SHA256_NI_PATTERN_SOURCE}$`, "u");

function malformed(message) {
  const error = new TypeError(message);
  error.code = "malformed-content-address";
  return error;
}

export function sha256NiUriFromDigestBytes(digestBytes) {
  if (!(digestBytes instanceof Uint8Array) || digestBytes.byteLength !== 32) {
    throw malformed("SHA-256 digest must be exactly 32 bytes");
  }
  return `${NI_PREFIX}${Buffer.from(digestBytes).toString("base64url")}`;
}

export function sha256NiUri(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    throw malformed("bytes must be a Uint8Array");
  }
  return sha256NiUriFromDigestBytes(createHash("sha256").update(bytes).digest());
}

export function isCanonicalSha256NiUri(value) {
  if (typeof value !== "string" || !NI_PATTERN.test(value)) return false;
  const encoded = value.slice(NI_PREFIX.length);
  const digest = Buffer.from(encoded, "base64url");
  return digest.length === 32 && digest.toString("base64url") === encoded;
}

export function sha256DigestFromNiUri(value) {
  if (!isCanonicalSha256NiUri(value)) {
    throw malformed("value must be one canonical RFC 6920 SHA-256 ni URI");
  }
  return value.slice(NI_PREFIX.length);
}

export function sha256DigestBytesFromNiUri(value) {
  return Buffer.from(sha256DigestFromNiUri(value), "base64url");
}

export function verifySha256NiUri(bytes, value) {
  if (!(bytes instanceof Uint8Array) || !isCanonicalSha256NiUri(value)) return false;
  return createHash("sha256").update(bytes).digest().equals(sha256DigestBytesFromNiUri(value));
}
