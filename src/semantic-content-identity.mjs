import {
  decodeSemantic,
  semanticBytes,
  semanticId,
} from "@lenticule-science/rmn-semantic-conformance-die";

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
