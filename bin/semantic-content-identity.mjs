#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { identifySemanticContent } from "../src/semantic-content-identity.mjs";

const value = JSON.parse(readFileSync(0, "utf8"));
const identity = identifySemanticContent(value);
process.stdout.write(`${JSON.stringify({
  ...identity,
  bytes: Buffer.from(identity.bytes).toString("base64"),
})}\n`);
