import {
  decodeCanonical,
  encodeCanonical,
} from "@red-cup-engineering/relation-model-notation-cbor-codec";
import { canonicalizeSemioticJson } from "@red-cup-engineering/canonicalize-semiotic-json-service";
const normalizedCarrierBytes = value => encodeCanonical(canonicalizeSemioticJson(value));
const decodeNormalizedCarrier = bytes => canonicalizeSemioticJson(decodeCanonical(bytes));
import { isDeepStrictEqual } from "node:util";
import { normalize as normalizeRmn001 } from "@red-cup-engineering/relation-model-notation-eval";
import { jsonToTerm, termToJson } from "@red-cup-engineering/relation-model-notation-json-codec";
import { checkTy, inferTy, isClosed } from "@red-cup-engineering/relation-model-notation-typing";
import {
  CANONICAL_SHA256_NI_PATTERN_SOURCE,
  isCanonicalSha256NiUri,
  sha256DigestBytesFromNiUri,
  sha256DigestFromNiUri,
  sha256NiUri,
  sha256NiUriFromDigestBytes,
  verifySha256NiUri,
} from "./ni.mjs";
export {
  CANONICAL_SHA256_NI_PATTERN_SOURCE,
  isCanonicalSha256NiUri,
  sha256DigestBytesFromNiUri,
  sha256DigestFromNiUri,
  sha256NiUri,
  sha256NiUriFromDigestBytes,
  verifySha256NiUri,
} from "./ni.mjs";

export const RMN_NORMALIZATION_PROFILE = "urn:rce:rmn:normalize:0.0.1";
export const IDENTITY_SETTLEMENT_PROFILE = "urn:rce:settlement:identity:0.0.1";
export const GENERATIVE_PROOF_PATH_PROFILE = "urn:rce:proof-path:generative:0.0.1";
export const PROOF_PATH_WITNESS_KIND = "semiotic-content.proof-path-witness";

const V2_KIND = "relation-model-notation.normalized-semantic-content";
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

export const EMPTY_WITNESS_ROOT = sha256NiUri(normalizedCarrierBytes(Object.freeze({
  kind: "semantic-content.empty-witness-bundle",
  version: 1,
})));

function rejection(code, message) {
  const error = new TypeError(message);
  error.code = code;
  return error;
}

function commitmentOf(value) {
  const bytes = normalizedCarrierBytes(value);
  const id = sha256NiUri(bytes);
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
    throw rejection("malformed-content-address", `${field} must be one canonical RFC 6920 SHA-256 ni URI`);
  }
  return value;
}

function canonicalString(value, field) {
  if (typeof value !== "string") throw rejection("malformed-normalized-content", `${field} must be a finite string`);
  return value.normalize("NFC");
}

function validateV2Envelope(envelope, { requireNormal = true } = {}) {
  if (envelope === null || typeof envelope !== "object" || Array.isArray(envelope)) {
    throw rejection("malformed-normalized-content", "normalized semantic content must be one envelope object");
  }
  const keys = Object.keys(envelope).sort();
  if (!isDeepStrictEqual(keys, [...V2_KEYS].sort()) || envelope.kind !== V2_KIND || envelope.version !== 2) {
    throw rejection("malformed-normalized-content", "normalized semantic content has unknown fields, kind, or version");
  }
  const objectKind = canonicalString(envelope.objectKind, "objectKind");
  if (objectKind.length === 0) throw rejection("malformed-normalized-content", "objectKind must not be empty");
  if (envelope.normalizationProfile !== RMN_NORMALIZATION_PROFILE) {
    throw rejection("unsupported-normalization-profile", `unsupported normalization profile ${String(envelope.normalizationProfile)}`);
  }
  if (envelope.settlementProfile !== IDENTITY_SETTLEMENT_PROFILE) {
    throw rejection("unsupported-settlement-profile", `unsupported settlement profile ${String(envelope.settlementProfile)}`);
  }
  const witnessRoot = canonicalNi(envelope.witnessRoot, "witnessRoot");
  let validated = false;
  try {
    validated = isClosed(envelope.settledBody) && checkTy([], envelope.settledBody, envelope.semanticType);
  } catch {
    validated = false;
  }
  if (!validated) {
    throw rejection("non-relational-content", "settledBody must be a closed RMN term inhabiting semanticType");
  }
  if (requireNormal) {
    let normalized;
    try {
      normalized = normalizeRmn001(envelope.settledBody);
    } catch {
      throw rejection("normalization-failure", "settledBody could not be checked under the declared normalization profile");
    }
    if (!isDeepStrictEqual(normalized, envelope.settledBody)) {
      throw rejection("non-normal-content", "settledBody is not normal under the declared normalization profile");
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
  const validated = validateV2Envelope(envelope);
  return Object.freeze({ ...commitmentOf(jsonToTerm(validated)), envelope: validated });
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
    throw rejection("unsupported-normalization-profile", `unsupported normalization profile ${String(normalizationProfile)}`);
  }
  if (settlementProfile !== IDENTITY_SETTLEMENT_PROFILE) {
    throw rejection("unsupported-settlement-profile", `identifyNormalizedSemanticContent requires ${IDENTITY_SETTLEMENT_PROFILE}`);
  }
  let validated = false;
  try {
    validated = isClosed(term) && checkTy([], term, semanticType);
  } catch {
    validated = false;
  }
  if (!validated) throw rejection("non-relational-content", "term must be a closed RMN term inhabiting semanticType");
  let settledBody;
  try {
    settledBody = normalizeRmn001(term);
  } catch {
    throw rejection("normalization-failure", "term could not be normalized under the declared normalization profile");
  }
  try {
    if (!isClosed(settledBody) || !checkTy([], settledBody, semanticType)) throw new TypeError();
  } catch {
    throw rejection("normalization-type-mismatch", "normalized term no longer inhabits its admitted semanticType");
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
    throw rejection("non-relational-content", "value must cross the admitted JSON-to-RMN boundary");
  }
  const semanticType = inferTy([], term);
  if (semanticType === null) throw rejection("non-relational-content", "admitted JSON did not derive an RMN type");
  return identifyNormalizedSemanticContent({ objectKind, semanticType, term, witnessRoot });
}

/** Commit one exact generative proof-path witness as normalized semantic
 * content. This function commits the proof material; it does not promote the
 * selected proof profile's verifier into the semantic-identity law. A qualified
 * verifier must separately reconstruct structureRoot and re-check path. */
export function identifyProofPathWitness({
  structureRoot,
  sourceKey,
  targetKey,
  path,
  proofProfile = GENERATIVE_PROOF_PATH_PROFILE,
  witnessRoot = EMPTY_WITNESS_ROOT,
} = {}) {
  if (proofProfile !== GENERATIVE_PROOF_PATH_PROFILE) {
    throw rejection("unsupported-proof-path-profile", `unsupported proof-path profile ${String(proofProfile)}`);
  }
  const validatedStructureRoot = canonicalNi(structureRoot, "structureRoot");
  const validatedWitnessRoot = canonicalNi(witnessRoot, "witnessRoot");
  const validatedSourceKey = canonicalString(sourceKey, "sourceKey");
  const validatedTargetKey = canonicalString(targetKey, "targetKey");
  const validatedPath = canonicalString(path, "path");
  if (validatedSourceKey.length === 0 || validatedTargetKey.length === 0 || validatedPath.length === 0) {
    throw rejection("malformed-proof-path-witness", "sourceKey, targetKey, and path must be nonempty");
  }
  return identifyJsonSemanticContent({
    objectKind: PROOF_PATH_WITNESS_KIND,
    value: {
      version: 1,
      proofProfile,
      structureRoot: validatedStructureRoot,
      sourceKey: validatedSourceKey,
      targetKey: validatedTargetKey,
      path: validatedPath,
    },
    witnessRoot: validatedWitnessRoot,
  });
}

/** Identify JSON semantic content whose identity settlement is explicitly bound
 * to one content-addressed generative proof-path witness. */
export function identifyProofPathedJsonSemanticContent({
  objectKind,
  value,
  proofPathWitnessRoot,
} = {}) {
  return identifyJsonSemanticContent({
    objectKind,
    value,
    witnessRoot: canonicalNi(proofPathWitnessRoot, "proofPathWitnessRoot"),
  });
}

/** Identify raw bytes through the admitted JSON/RMN bridge while binding the
 * resulting identity to one content-addressed generative proof-path witness. */
export function identifyProofPathedBytesSemanticContent({
  objectKind,
  bytes,
  mediaType = "application/octet-stream",
  proofPathWitnessRoot,
} = {}) {
  return identifyBytesSemanticContent({
    objectKind,
    bytes,
    mediaType,
    witnessRoot: canonicalNi(proofPathWitnessRoot, "proofPathWitnessRoot"),
  });
}

export function identifyBytesSemanticContent({ objectKind, bytes, mediaType = "application/octet-stream", witnessRoot } = {}) {
  if (!(bytes instanceof Uint8Array)) throw rejection("non-relational-content", "bytes must be a Uint8Array");
  if (typeof mediaType !== "string" || mediaType.length === 0) throw rejection("malformed-normalized-content", "mediaType must be nonempty text");
  return identifyJsonSemanticContent({ objectKind, value: { mediaType, contentBase64: Buffer.from(bytes).toString("base64") }, witnessRoot });
}

/** Admit v2 transport only when its normal body is exactly one injectively
 * encoded JSON value of the receiver's demanded object kind. */
export function admitJsonSemanticContent({ bytes, token, objectKind } = {}) {
  const identified = validateNormalizedSemanticContent(bytes, token);
  if (identified.envelope.objectKind !== objectKind) {
    throw rejection("semantic-object-kind-mismatch", `expected semantic object kind ${String(objectKind)}`);
  }
  let value;
  try {
    value = termToJson(identified.envelope.settledBody);
  } catch {
    throw rejection("non-json-semantic-content", "settled body is not an admitted JSON term");
  }
  if (!isDeepStrictEqual(jsonToTerm(value), identified.envelope.settledBody)) {
    throw rejection("non-json-semantic-content", "settled body is not the injective JSON-to-RMN representation");
  }
  return Object.freeze({ ...identified, value: immutableCopy(value) });
}

/** Admit canonical v2 bytes and reproduce their typed normalized commitment. */
export function validateNormalizedSemanticContent(bytes, token = undefined) {
  if (!(bytes instanceof Uint8Array)) throw rejection("malformed-normalized-content", "normalized content bytes must be a Uint8Array");
  let decoded;
  try {
    decoded = termToJson(decodeNormalizedCarrier(bytes));
  } catch {
    throw rejection("malformed-normalized-content", "bytes must carry one canonical RMN normalized-content envelope");
  }
  const identified = identifyV2Envelope(decoded);
  if (!Buffer.from(identified.bytes).equals(Buffer.from(bytes))) {
    throw rejection("normalized-content-commitment-mismatch", "bytes do not reproduce their canonical normalized-content commitment");
  }
  if (token !== undefined && token !== identified.token) {
    throw rejection("normalized-content-commitment-mismatch", "token does not commit to the supplied normalized-content bytes");
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
