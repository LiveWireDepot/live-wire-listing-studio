import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

test("Production CLI exposes read-only audit only until credentialed verification passes",async()=>{
  const source=await readFile(new URL("../scripts/live-wire-production.mjs",import.meta.url),"utf8");
  assert.match(source,/command!=="audit"/);
  assert.match(source,/Read-only Production audit complete/);
  assert.doesNotMatch(source,/publish_offer|createOffer|uploadImage/);
});
