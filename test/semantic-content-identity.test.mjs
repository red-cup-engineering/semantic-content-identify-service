import assert from "node:assert/strict";
import test from "node:test";
import { identifySemanticContent } from "../src/semantic-content-identity.mjs";

test("derives the released RMN star identity", () => {
  const identity = identifySemanticContent(["star"]);
  assert.equal(identity.id, "ni:///sha-256;U3uKJJT0vR4Qw4-gzCLa9apzf5Y3QXY-dXiIFV5IPA4");
  assert.equal(Buffer.from(identity.bytes).toString("hex"), "816473746172");
});
