import assert from "node:assert/strict";
import test from "node:test";
import {
  CANONICAL_SHA256_NI_PATTERN_SOURCE,
  isCanonicalSha256NiUri,
  sha256DigestBytesFromNiUri,
  sha256DigestFromNiUri,
  sha256NiUri,
  sha256NiUriFromDigestBytes,
  verifySha256NiUri,
} from "../src/ni.mjs";

test("dependency-light NI subpath reproduces the estate conformance vector", () => {
  const bytes = Buffer.from("semantic-content-ni-api", "utf8");
  const expected = "ni:///sha-256;koqacr8nz6PJjJUPQ9zy04JpLJiP3DSvPGDioN_dqBU";

  assert.equal(sha256NiUri(bytes), expected);
  assert.equal(isCanonicalSha256NiUri(expected), true);
  assert.equal(new RegExp(`^${CANONICAL_SHA256_NI_PATTERN_SOURCE}$`, "u").test(expected), true);
  assert.equal(sha256DigestFromNiUri(expected), expected.slice("ni:///sha-256;".length));

  const digestBytes = sha256DigestBytesFromNiUri(expected);
  assert.equal(digestBytes.byteLength, 32);
  assert.equal(sha256NiUriFromDigestBytes(digestBytes), expected);
  assert.equal(verifySha256NiUri(bytes, expected), true);
  assert.equal(verifySha256NiUri(Buffer.from("changed", "utf8"), expected), false);
});

test("NI subpath refuses malformed inputs instead of inventing aliases", () => {
  assert.throws(
    () => sha256NiUri("not bytes"),
    (error) => error.code === "malformed-content-address",
  );
  assert.throws(
    () => sha256NiUriFromDigestBytes(new Uint8Array(31)),
    (error) => error.code === "malformed-content-address",
  );
  assert.equal(isCanonicalSha256NiUri("sha256:deadbeef"), false);
});
