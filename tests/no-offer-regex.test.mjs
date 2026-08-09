import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

test("missing-offer matcher accepts eBay wording with optional periods",async()=>{
  const source=await readFile(new URL("../app/api/ebay/draft-offer/route.ts",import.meta.url),"utf8");
  assert.match(source,/This Offer is not available\\\.\?/);
  assert.doesNotMatch(source,/This Offer is not available\\\\\\\.\?/);
  const matcher=/^(This Offer is not available\.?|Offer not found\.?)$/i;
  assert.equal(matcher.test("This Offer is not available."),true);
  assert.equal(matcher.test("This Offer is not available"),true);
  assert.equal(matcher.test("Authorization failed"),false);
});
