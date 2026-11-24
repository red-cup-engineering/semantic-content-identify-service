export declare const CANONICAL_SHA256_NI_PATTERN_SOURCE:
  "ni:///sha-256;[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]";

export declare function sha256NiUriFromDigestBytes(
  digestBytes: Uint8Array,
): `ni:///sha-256;${string}`;

export declare function sha256NiUri(
  bytes: Uint8Array,
): `ni:///sha-256;${string}`;

export declare function isCanonicalSha256NiUri(
  value: unknown,
): value is `ni:///sha-256;${string}`;

export declare function sha256DigestFromNiUri(value: unknown): string;
export declare function sha256DigestBytesFromNiUri(value: unknown): Uint8Array;
export declare function verifySha256NiUri(bytes: Uint8Array, value: unknown): boolean;
