import assert from "node:assert/strict";
import test from "node:test";
import { tm, ty } from "@red-cup-engineering/relation-model-notation";
import {
  admitNormalizedSemanticContent,
  EMPTY_WITNESS_ROOT,
  identifyNormalizedSemanticContent,
  IDENTITY_SETTLEMENT_PROFILE,
  isCanonicalSha256NiUri,
  RMN_NORMALIZATION_PROFILE,
  sha256DigestBytesFromNiUri,
  sha256DigestFromNiUri,
  verifySha256NiUri,
  verifyNormalizedSemanticContent,
} from "../src/semantic-content-identity.mjs";

test("canonical NI parsing and byte verification share the semantic-content boundary", () => {
  const bytes = Buffer.from("semantic-content-ni-api", "utf8");
  const token = "ni:///sha-256;koqacr8nz6PJjJUPQ9zy04JpLJiP3DSvPGDioN_dqBU";
  assert.equal(isCanonicalSha256NiUri(token), true);
  assert.equal(sha256DigestFromNiUri(token), token.slice("ni:///sha-256;".length));
  assert.equal(sha256DigestBytesFromNiUri(token).length, 32);
  assert.equal(verifySha256NiUri(bytes, token), true);
  assert.equal(isCanonicalSha256NiUri(`${token.slice(0, -1)}t`), false);
});

const witnessA = "ni:///sha-256;U3uKJJT0vR4Qw4-gzCLa9apzf5Y3QXY-dXiIFV5IPA4";
const witnessB = "ni:///sha-256;As10nkr7yVtaiUQ44SzVlS20Iy8ucJi2qwvP4OJ9X_8";

test("v2 normalization converges a redex and its normal form under the exact profile", () => {
  const common = {
    objectKind: "example.normalized-mark",
    semanticType: ty.base(),
    witnessRoot: witnessA,
  };
  const redex = identifyNormalizedSemanticContent({
    ...common,
    term: tm.fst(tm.pair(tm.mark("left"), tm.mark("right"))),
  });
  const normal = identifyNormalizedSemanticContent({ ...common, term: tm.mark("left") });

  assert.equal(redex.token, normal.token);
  assert.deepEqual(redex.envelope.settledBody, tm.mark("left"));
  assert.equal(redex.envelope.normalizationProfile, RMN_NORMALIZATION_PROFILE);
  assert.equal(redex.envelope.settlementProfile, IDENTITY_SETTLEMENT_PROFILE);
  assert.equal(verifyNormalizedSemanticContent(redex.token, redex.envelope), true);
  assert.deepEqual(admitNormalizedSemanticContent(redex.bytes, redex.token).envelope, redex.envelope);
});

test("identity settlement names an explicit shared empty witness bundle", () => {
  const identified = identifyNormalizedSemanticContent({
    objectKind: "example.unwitnessed-mark",
    semanticType: ty.base(),
    term: tm.mark("body"),
    witnessRoot: EMPTY_WITNESS_ROOT,
  });
  assert.match(EMPTY_WITNESS_ROOT, /^ni:\/\/\/sha-256;/u);
  assert.equal(identified.envelope.witnessRoot, EMPTY_WITNESS_ROOT);
});

test("v2 refuses unsupported profiles, malformed witnesses, and mutation", () => {
  const input = { objectKind: "example.mark", semanticType: ty.base(), term: tm.mark("body"), witnessRoot: witnessA };
  assert.throws(
    () => identifyNormalizedSemanticContent({ ...input, normalizationProfile: "urn:foreign:normalizer" }),
    (error) => error.code === "unsupported-normalization-profile",
  );
  assert.throws(
    () => identifyNormalizedSemanticContent({ ...input, settlementProfile: "urn:lenticule:articulating:fregean-four:1" }),
    (error) => error.code === "unsupported-settlement-profile",
  );
  assert.throws(
    () => identifyNormalizedSemanticContent({ ...input, witnessRoot: "ni:///sha-256:not-canonical" }),
    (error) => error.code === "malformed-content-address",
  );

  const identified = identifyNormalizedSemanticContent(input);
  const changedEnvelope = structuredClone(identified.envelope);
  changedEnvelope.witnessRoot = witnessB;
  assert.equal(verifyNormalizedSemanticContent(identified.token, changedEnvelope), false);
  const changedBytes = Buffer.from(identified.bytes);
  changedBytes[changedBytes.length - 1] ^= 1;
  assert.throws(
    () => admitNormalizedSemanticContent(changedBytes, identified.token),
    (error) => error.code === "malformed-normalized-content" || error.code === "normalized-content-commitment-mismatch",
  );
});
