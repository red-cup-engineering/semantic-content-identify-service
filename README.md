# Semantic Content Identify Service

A public one-operation Capability Cell: derive canonical RMN CBOR bytes and an
RFC 6920 SHA-256 `ni` URI from one semantic value.

```sh
printf '["star"]' | semantic-content-identity
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
