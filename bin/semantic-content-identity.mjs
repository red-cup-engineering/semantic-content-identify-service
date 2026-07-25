#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { identifySemanticContent } from "../src/semantic-content-identity.mjs";

const value = JSON.parse(readFileSync(0, "utf8"));
const identity = identifySemanticContent(value);
const { bytes, ...receipt } = identity;
const outputIndex = process.argv.indexOf("--output");
const output = outputIndex === -1 ? undefined : process.argv[outputIndex + 1];
if (outputIndex !== -1 && (typeof output !== "string" || output.length === 0)) {
  throw new TypeError("--output requires one new file path");
}
if (output !== undefined) writeFileSync(output, bytes, {
  flag: process.argv.includes("--replace") ? "w" : "wx",
  mode: 0o644,
});
process.stdout.write(`${JSON.stringify({
  ...receipt,
  ...(output === undefined
    ? { bytes: Buffer.from(bytes).toString("base64") }
    : { output, byteLength: bytes.length }),
})}\n`);
