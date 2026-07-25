# Semantic Content Identity Cell

One capability: derive canonical RMN CBOR bytes and an RFC 6920 SHA-256
`ni` URI from one semantic value.

```sh
printf '["star"]' | semantic-content-identity
```

Action identity:
`https://semantic-content-identity.actions.561.group/invoke`

Current cloud carrier:
`https://semantic-identity-cell.emsenn.deno.net/invoke`

The action hostname is the stable customer-facing identity. The carrier may
change without changing the action being contracted.
