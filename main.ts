import { createSemanticContentIdentityHandler } from "./src/http-handler.mjs";

const manifest = "ni:///sha-256;sJ25jrJSd7X1PHrS4ca6gIhKDb-ZkwUT14S5f1Ap-cA";
Deno.serve(createSemanticContentIdentityHandler({ manifest }));
