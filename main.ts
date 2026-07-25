import { identifySemanticContent } from "./src/semantic-content-identity.mjs";

const manifest = "ni:///sha-256;HvMakWQbTFDJd74oYC29qmvd20Fd_SeIo_N_u2cpMRo";
const headers = {
  "content-type": "application/json",
  "x-capability-manifest": manifest,
};

function base64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

Deno.serve(async (request) => {
  const { pathname } = new URL(request.url);
  if (request.method === "GET" && pathname === "/health") {
    return Response.json({ ok: true, manifest }, { headers });
  }
  if (request.method === "POST" && pathname === "/invoke") {
    const { value } = await request.json();
    const identity = identifySemanticContent(value);
    return Response.json({ ...identity, bytes: base64(identity.bytes) }, { headers });
  }
  return Response.json({ error: "not-found", manifest }, { status: 404, headers });
});
