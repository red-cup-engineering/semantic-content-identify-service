#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import {
  semanticBytes,
  semanticId,
} from "@emsenn/rmn-semantic-conformance-die";
import {
  encodeRelationalValue,
} from "@emsenn/rmn-semantic-conformance-die/relational-value";

function option(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const output = option("--output");
if (process.argv.includes("--output") && (typeof output !== "string" || output.length === 0)) {
  throw new TypeError("--output requires one new file path");
}
const value = JSON.parse(readFileSync(0, "utf8"));
const encoded = encodeRelationalValue(value);
const term = ["ascribe", encoded.type, encoded.term];
const bytes = semanticBytes(term);
if (output !== undefined) writeFileSync(output, bytes, { flag: "wx", mode: 0o644 });
process.stdout.write(`${JSON.stringify({
  id: semanticId(term),
  mediaType: "application/rmn+cbor",
  byteLength: bytes.length,
  ...(output === undefined ? { bytes: bytes.toString("base64") } : { output })
})}\n`);
