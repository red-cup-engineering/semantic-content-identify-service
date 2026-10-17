# Semantic Content Identify Service — historical RMN v2 external face

**Not an active source of the 561 Group's internal content-identity law.**
This repository preserves its previously released/public RMN v2 protocol and
hosted Deno HTTP entry while identified external consumers, deployed grants
and historical receipts are still attached. Its npm manifest is now private
to prevent publishing additional versions of the nonconformant standalone
source. That does not revoke a historical package or change a live endpoint.

For new engineering source, resolve the actual owners instead of renaming this
repository into another section:
- RFC 6920 NI codec: `uri-services-section/ni-uri`;
- exact carrier bytes and raw address records:
  `computer-data-engineering-services-section/lib/semiotic-content-address`;
- SEN v3 typed envelope: Computer Data's `semiotic-expression-notation/semantic-content-identity`;
- SEN reduction and normalized content identity: Computer Code's
  `semiotic-expression-notation/runtime/semantic-content-identity`;
- the public HTTP invocation boundary: Networking plus its separately
  installed and authorized host, not a new source of hashing or type law.

**Do not conflate historical RMN v2 envelopes with current SEN v3.**
The same RFC 6920 NI URI syntax says that canonical bytes were named; it
does not establish semantic-equivalence between different envelope profiles.
Retain the existing v2 API as an explicitly versioned foreign/public carrier
until its exact actual consumers and hosting are migrated. Do not introduce
new direct imports from this repository.

---

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


## Canonical proof-pathed NI addressing

For existing external RMN v2 consumers, this package **historically exported**
a duplicate NI primitive with the same public byte-address spelling.
The current internal executable source of NI syntax and verification is
URI Services, not this module. The legacy output form is:

```text
canonical bytes -> ni:///sha-256;<unpadded-base64url-digest>
```

Historical clients can read `sha256NiUri(bytes)` and the `./ni` subpath for their
existing versioned contract; **new internal consumers must import the
URI Services `./ni-uri` primitive**, not this historical package.
For compatibility adapters that already possess a verified raw SHA-256 digest,
use `sha256NiUriFromDigestBytes(digestBytes)` to render the same canonical NI
without re-hashing the digest as content. Declarative schemas that cannot call
the runtime validator should compose `CANONICAL_SHA256_NI_PATTERN_SOURCE`
instead of copying the NI grammar. Do not copy the NI regex/formatter into
downstream packages.

Generative provenance is deliberately a separate coordinate from byte identity.
`identifyProofPathWitness(...)` commits one exact proof-path witness containing
the proof profile, the content-addressed generator/structure root, source key,
target key, and rendered path. The returned NI may then be supplied through
`identifyProofPathedJsonSemanticContent(...)` or
`identifyProofPathedBytesSemanticContent(...)`.

The resulting relation is:

```text
addressed generator structure
        |
        v
content-addressed proof-path witness --NI--> witnessRoot
                                              |
                                              v
canonical payload -> normalized RMN envelope -> canonical NI identity
```

The proof-path witness function commits proof material; it does **not** declare
that a path is valid merely because it is well formed. A verifier qualified by
the named proof profile must reconstruct the addressed structure and re-check
the route. The current `emsenn/proof-pathing` implementation is a donor for that
verification behavior until the Obsmetrologia -> metrologic -> SignCraft custody
chain qualifies the executable projection.

Git OIDs, CIDs/IPFS references, EVM hashes, URLs, filesystem paths, package
versions, and other carrier-local identifiers remain legitimate typed external
coordinates. They are not alternate internal canonical content identities.
Compatibility belongs at ingress/egress adapters.
