import {
  decodeNormalizedCarrier,
  normalizedCarrierBytes,
} from "@red-cup-engineering/relation-model-notation-cbor-codec";
import { isDeepStrictEqual } from "node:util";
import { createHash } from "node:crypto";
import { normalize as normalizeRmn001 } from "@red-cup-engineering/relation-model-notation-eval";
import { jsonToTerm, termToJson } from "@red-cup-engineering/relation-model-notation-json-codec";
import { checkTy, inferTy, isClosed } from "@red-cup-engineering/relation-model-notation-typing";

export const RMN_NORMALIZATION_PROFILE = "urn:rce:rmn:normalize:0.0.1";
export const IDENTITY_SETTLEMENT_PROFILE = "urn:rce:settlement:identity:0.0.1";

const V2_KIND = "relation-model-notation.normalized-semantic-content";
const NI_PATTERN = /^ni:\/\/\/sha-256;[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/u;
const NI_PREFIX = "ni:///sha-256;";
const V2_KEYS = Object.freeze([
  "kind",
  "version",
  "objectKind",
  "semanticType",
  "normalizationProfile",
  "settlementProfile",
  "settledBody",
  "witnessRoot",
]);

/** Explicit root for semantic material whose named settlement profile consumes
 * no evidential witnesses. This is a raw canonical-carrier commitment, not a
 * second semantic identity law. */
const bytesNiUri = (bytes) => `${NI_PREFIX}${createHash("sha256").update(bytes).digest("base64url")}`;

export const EMPTY_WITNESS_ROOT = bytesNiUri(normalizedCarrierBytes(Object.freeze({
  kind: "semantic-content.empty-witness-bundle",
  version: 1,
})));

function refusal(code, message) {
  const error = new TypeError(message);
  error.code = code;
  return error;
}

function commitmentOf(value) {
  const bytes = normalizedCarrierBytes(value);
  const id = bytesNiUri(bytes);
  return Object.freeze({
    id,
    token: id,
    algorithm: "sha-256",
    mediaType: "application/rmn+cbor",
    bytes,
  });
}

function immutableCopy(value) {
  const copy = structuredClone(value);
  const freeze = (node) => {
    if (node !== null && typeof node === "object") {
      for (const child of Object.values(node)) freeze(child);
      Object.freeze(node);
    }
    return node;
  };
  return freeze(copy);
}

function canonicalNi(value, field) {
  if (!isCanonicalSha256NiUri(value)) {
    throw refusal("malformed-content-address", `${field} must be one canonical RFC 6920 SHA-256 ni URI`);
  }
  return value;
}

export function isCanonicalSha256NiUri(value) {
  if (typeof value !== "string" || !NI_PATTERN.test(value)) return false;
  const encoded = value.slice(NI_PREFIX.length);
  const digest = Buffer.from(encoded, "base64url");
  return digest.length === 32 && digest.toString("base64url") === encoded;
}

export function sha256DigestFromNiUri(value) {
  if (!isCanonicalSha256NiUri(value)) throw refusal("malformed-content-address", "value must be one canonical RFC 6920 SHA-256 ni URI");
  return value.slice(NI_PREFIX.length);
}

export function sha256DigestBytesFromNiUri(value) {
  return Buffer.from(sha256DigestFromNiUri(value), "base64url");
}

export function verifySha256NiUri(bytes, value) {
  if (!(bytes instanceof Uint8Array) || !isCanonicalSha256NiUri(value)) return false;
  return createHash("sha256").update(bytes).digest().equals(sha256DigestBytesFromNiUri(value));
}

function canonicalString(value, field) {
  if (typeof value !== "string") throw refusal("malformed-normalized-content", `${field} must be a finite string`);
  return value.normalize("NFC");
}

function admitV2Envelope(envelope, { requireNormal = true } = {}) {
  if (envelope === null || typeof envelope !== "object" || Array.isArray(envelope)) {
    throw refusal("malformed-normalized-content", "normalized semantic content must be one envelope object");
  }
  const keys = Object.keys(envelope).sort();
  if (!isDeepStrictEqual(keys, [...V2_KEYS].sort()) || envelope.kind !== V2_KIND || envelope.version !== 2) {
    throw refusal("malformed-normalized-content", "normalized semantic content has unknown fields, kind, or version");
  }
  const objectKind = canonicalString(envelope.objectKind, "objectKind");
  if (objectKind.length === 0) throw refusal("malformed-normalized-content", "objectKind must not be empty");
  if (envelope.normalizationProfile !== RMN_NORMALIZATION_PROFILE) {
    throw refusal("unsupported-normalization-profile", `unsupported normalization profile ${String(envelope.normalizationProfile)}`);
  }
  if (envelope.settlementProfile !== IDENTITY_SETTLEMENT_PROFILE) {
    throw refusal("unsupported-settlement-profile", `unsupported settlement profile ${String(envelope.settlementProfile)}`);
  }
  const witnessRoot = canonicalNi(envelope.witnessRoot, "witnessRoot");
  let admitted = false;
  try {
    admitted = isClosed(envelope.settledBody) && checkTy([], envelope.settledBody, envelope.semanticType);
  } catch {
    admitted = false;
  }
  if (!admitted) {
    throw refusal("non-relational-content", "settledBody must be a closed RMN term inhabiting semanticType");
  }
  if (requireNormal) {
    let normalized;
    try {
      normalized = normalizeRmn001(envelope.settledBody);
    } catch {
      throw refusal("normalization-failure", "settledBody could not be checked under the declared normalization profile");
    }
    if (!isDeepStrictEqual(normalized, envelope.settledBody)) {
      throw refusal("non-normal-content", "settledBody is not normal under the declared normalization profile");
    }
  }
  return immutableCopy({
    kind: V2_KIND,
    version: 2,
    objectKind,
    semanticType: envelope.semanticType,
    normalizationProfile: RMN_NORMALIZATION_PROFILE,
    settlementProfile: envelope.settlementProfile,
    settledBody: envelope.settledBody,
    witnessRoot,
  });
}

function identifyV2Envelope(envelope) {
  const admitted = admitV2Envelope(envelope);
  return Object.freeze({ ...commitmentOf(jsonToTerm(admitted)), envelope: admitted });
}

/** Normalize one explicitly typed RMN term and bind its identity settlement witness. */
export function identifyNormalizedSemanticContent({
  objectKind,
  semanticType,
  term,
  witnessRoot,
  normalizationProfile = RMN_NORMALIZATION_PROFILE,
  settlementProfile = IDENTITY_SETTLEMENT_PROFILE,
} = {}) {
  if (normalizationProfile !== RMN_NORMALIZATION_PROFILE) {
    throw refusal("unsupported-normalization-profile", `unsupported normalization profile ${String(normalizationProfile)}`);
  }
  if (settlementProfile !== IDENTITY_SETTLEMENT_PROFILE) {
    throw refusal("unsupported-settlement-profile", `identifyNormalizedSemanticContent requires ${IDENTITY_SETTLEMENT_PROFILE}`);
  }
  let admitted = false;
  try {
    admitted = isClosed(term) && checkTy([], term, semanticType);
  } catch {
    admitted = false;
  }
  if (!admitted) throw refusal("non-relational-content", "term must be a closed RMN term inhabiting semanticType");
  let settledBody;
  try {
    settledBody = normalizeRmn001(term);
  } catch {
    throw refusal("normalization-failure", "term could not be normalized under the declared normalization profile");
  }
  try {
    if (!isClosed(settledBody) || !checkTy([], settledBody, semanticType)) throw new TypeError();
  } catch {
    throw refusal("normalization-type-mismatch", "normalized term no longer inhabits its admitted semanticType");
  }
  return identifyV2Envelope({
    kind: V2_KIND,
    version: 2,
    objectKind,
    semanticType,
    normalizationProfile,
    settlementProfile,
    settledBody,
    witnessRoot,
  });
}

/** Admit one JSON value through the injective JSON→RMN bridge, infer its exact
 * closed product type, and identify only the resulting normalized envelope. */
export function identifyJsonSemanticContent({ objectKind, value, witnessRoot } = {}) {
  let term;
  try {
    term = jsonToTerm(value);
  } catch {
    throw refusal("non-relational-content", "value must cross the admitted JSON-to-RMN boundary");
  }
  const semanticType = inferTy([], term);
  if (semanticType === null) throw refusal("non-relational-content", "admitted JSON did not derive an RMN type");
  return identifyNormalizedSemanticContent({ objectKind, semanticType, term, witnessRoot });
}

export function identifyBytesSemanticContent({ objectKind, bytes, mediaType = "application/octet-stream", witnessRoot } = {}) {
  if (!(bytes instanceof Uint8Array)) throw refusal("non-relational-content", "bytes must be a Uint8Array");
  if (typeof mediaType !== "string" || mediaType.length === 0) throw refusal("malformed-normalized-content", "mediaType must be nonempty text");
  return identifyJsonSemanticContent({ objectKind, value: { mediaType, contentBase64: Buffer.from(bytes).toString("base64") }, witnessRoot });
}

/** Admit v2 transport only when its normal body is exactly one injectively
 * encoded JSON value of the receiver's demanded object kind. */
export function admitJsonSemanticContent({ bytes, token, objectKind } = {}) {
  const identified = admitNormalizedSemanticContent(bytes, token);
  if (identified.envelope.objectKind !== objectKind) {
    throw refusal("semantic-object-kind-mismatch", `expected semantic object kind ${String(objectKind)}`);
  }
  let value;
  try {
    value = termToJson(identified.envelope.settledBody);
  } catch {
    throw refusal("non-json-semantic-content", "settled body is not an admitted JSON term");
  }
  if (!isDeepStrictEqual(jsonToTerm(value), identified.envelope.settledBody)) {
    throw refusal("non-json-semantic-content", "settled body is not the injective JSON-to-RMN representation");
  }
  return Object.freeze({ ...identified, value: immutableCopy(value) });
}

/** Admit canonical v2 bytes and reproduce their typed normalized commitment. */
export function admitNormalizedSemanticContent(bytes, token = undefined) {
  if (!(bytes instanceof Uint8Array)) throw refusal("malformed-normalized-content", "normalized content bytes must be a Uint8Array");
  let decoded;
  try {
    decoded = termToJson(decodeNormalizedCarrier(bytes));
  } catch {
    throw refusal("malformed-normalized-content", "bytes must carry one canonical RMN normalized-content envelope");
  }
  const identified = identifyV2Envelope(decoded);
  if (!Buffer.from(identified.bytes).equals(Buffer.from(bytes))) {
    throw refusal("normalized-content-commitment-mismatch", "bytes do not reproduce their canonical normalized-content commitment");
  }
  if (token !== undefined && token !== identified.token) {
    throw refusal("normalized-content-commitment-mismatch", "token does not commit to the supplied normalized-content bytes");
  }
  return identified;
}

/** Verify a visible v2 envelope against its opaque token. */
export function verifyNormalizedSemanticContent(token, envelope) {
  try {
    return typeof token === "string" && identifyV2Envelope(envelope).token === token;
  } catch {
    return false;
  }
}
