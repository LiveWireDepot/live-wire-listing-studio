import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

test("a missing eBay offer is treated as a clean creation path",async()=>{
  const source=await readFile(new URL("../app/api/ebay/draft-offer/route.ts",import.meta.url),"utf8");
  assert.match(source,/function meansNoMatchingOffer/);
  assert.match(source,/if\(meansNoMatchingOffer\(error\)\)return\[\]/);
  assert.match(source,/This Offer is not available/);
});
