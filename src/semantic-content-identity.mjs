import {
  decodeSemantic,
  semanticBytes,
  semanticId,
} from "@red-cup-engineering/relation-model-notation-runtime";

export function identifySemanticContent(value) {
  const bytes = semanticBytes(value);
  return Object.freeze({
    id: semanticId(value),
    algorithm: "sha-256",
    mediaType: "application/rmn+cbor",
    value: decodeSemantic(bytes),
    bytes,
  });
}
