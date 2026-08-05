import assert from "node:assert/strict";
import test from "node:test";

import { tm, ty } from "@red-cup-engineering/relation-model-notation";
import { EMPTY_WITNESS_ROOT } from "../src/semantic-content-identity.mjs";
import { createSemanticContentIdentityHandler } from "../src/http-handler.mjs";

const manifest = "ni:///sha-256;sJ25jrJSd7X1PHrS4ca6gIhKDb-ZkwUT14S5f1Ap-cA";
const handler = createSemanticContentIdentityHandler({ manifest });

function invoke(body) {
  return handler(new Request("https://identity.example/invoke", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }));
}

test("HTTP health names the deployed capability manifest", async () => {
  const response = await handler(new Request("https://identity.example/health"));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-capability-manifest"), manifest);
  assert.deepEqual(await response.json(), { ok: true, manifest });
});

test("HTTP content boundary mints only a normalized v2 envelope", async () => {
  const response = await invoke({ content: {
    objectKind: "example.http-mark",
    semanticType: ty.base(),
    term: tm.fst(tm.pair(tm.mark("left"), tm.mark("right"))),
    witnessRoot: EMPTY_WITNESS_ROOT,
  } });
  const identity = await response.json();
  assert.equal(response.status, 200);
  assert.equal(identity.envelope.version, 2);
  assert.deepEqual(identity.envelope.settledBody, tm.mark("left"));
  assert.equal(identity.token, identity.id);
  assert.match(identity.bytes, /^[A-Za-z0-9+/]+=*$/u);
});

test("HTTP boundary refuses a predication-shaped shortcut without a typed settlement", async () => {
  const response = await invoke({ predication: {
    subject: "mud",
    predicate: "carries",
    object: "foam",
    positiveWitnesses: [EMPTY_WITNESS_ROOT],
    negativeWitnesses: [],
  } });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "exactly-one-content-carrier-is-required");
});

test("HTTP boundary refuses unframed and ambiguous carrier shapes", async () => {
  const unframed = await invoke({ material: tm.star() });
  assert.equal(unframed.status, 400);
  assert.equal((await unframed.json()).error, "exactly-one-content-carrier-is-required");
  const ambiguous = await invoke({ content: {}, predication: {} });
  assert.equal(ambiguous.status, 400);
  assert.equal((await ambiguous.json()).error, "exactly-one-content-carrier-is-required");
});
