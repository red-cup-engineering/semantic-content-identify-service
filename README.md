# Semantic Content Identify Service

A public Capability Cell that binds the distinctions required before semantic
identity in one normalized RMN v2 envelope:

- `identifyNormalizedSemanticContent(...)` admits an explicitly typed term,
  normalizes it under `urn:rce:rmn:normalize:0.0.1`, rechecks its type, binds
  identity settlement and a canonical witness root, then addresses the v2 RMN
  envelope's deterministic CBOR bytes;
- `admitNormalizedSemanticContent(bytes, token)` and
  `verifyNormalizedSemanticContent(token, envelope)` reconstruct and verify
  that commitment without treating the token as a meaning surface.

This boundary does not derive predication, evidence polarity, FOUR, or
settlement from a convenient carrier shape. Those must arrive as already
admitted typed material from the systems that implement their laws.

The HTTP `POST /invoke` boundary accepts exactly `{ "content": ... }` for
normalized typed material. Unframed material is not admitted.

```sh
printf '%s' '{"objectKind":"example.unit","semanticType":["unit"],"term":["star"],"witnessRoot":"ni:///sha-256;jVlIFCTzrK6X_jbpZDTLiahcaPh5t7BNeW9nP2nVDNY"}' | semantic-content-identity
```

Current HTTPS action and cloud carrier:
`https://semantic-identity-cell.emsenn.deno.net/invoke`

Federated actor:
`https://bare-cedar-fog.561.group/actors/semantic-content-identify-service`

Settlement account:
`eip155:5615610:0x2d7ae44907ebf6f8b8842692415e8fcb9f61e5cc`

The former `urn:ame:semantic-content-identity-cell` binding remains archived
at `eip155:5615610:0xfd4e359353e59db2b33582fffa20f99291048384`.

The source, immutable package carrier, HTTPS deployment, ActivityPub actor, and
renamed enterprise account are live. The optional npm registry face is
explicitly absent; the public GitHub release tarball is the package carrier.
