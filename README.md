# Semantic Content Identify Service

A public service, fabricated and assayed as a Capability Cell, with one
capability: derive canonical RMN CBOR bytes and an RFC 6920 SHA-256 `ni` URI
from one semantic value.

```sh
printf '["star"]' | semantic-content-identity
```

Action identity:
`https://semantic-content-identity.actions.561.group/invoke`

Current cloud carrier:
`https://semantic-identity-cell.emsenn.deno.net/invoke`

Legacy settlement account (bound to the former
`urn:ame:semantic-content-identity-cell` actor):
`eip155:5615610:0xfd4e359353e59db2b33582fffa20f99291048384`

The action hostname is the stable customer-facing identity. The carrier may
change without changing the action being contracted.
