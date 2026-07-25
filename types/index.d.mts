export interface SemanticContentIdentity<T = unknown> {
  id: `ni:///sha-256;${string}`;
  algorithm: "sha-256";
  mediaType: "application/rmn+cbor";
  value: T;
  bytes: Uint8Array;
}

export declare function identifySemanticContent<T>(
  value: T,
): SemanticContentIdentity<T>;
