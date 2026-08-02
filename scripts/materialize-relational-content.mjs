#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import {
  semanticBytes,
  semanticId,
} from "@red-cup-engineering/relation-model-notation-runtime";
import {
  encodeRelationalValue,
} from "@red-cup-engineering/relation-model-notation-runtime/relational-value";

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
if (output !== undefined) writeFileSync(output, bytes, {
  flag: process.argv.includes("--replace") ? "w" : "wx",
  mode: 0o644,
});
process.stdout.write(`${JSON.stringify({
  id: semanticId(term),
  mediaType: "application/rmn+cbor",
  byteLength: bytes.length,
  ...(output === undefined ? { bytes: bytes.toString("base64") } : { output })
})}\n`);
