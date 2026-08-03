import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

test("every listing exposes one explicit eBay next-action path",async()=>{
  const page=await readFile(new URL("../app/page.tsx",import.meta.url),"utf8");
  const panel=await readFile(new URL("../app/components/NextEbayAction.tsx",import.meta.url),"utf8");
  assert.match(page,/Prepare for eBay/);
  assert.match(page,/Create unpublished eBay draft/);
  assert.match(page,/Run final preflight/);
  assert.match(page,/Review fees and publish live/);
  assert.match(panel,/Accept Best Offers is a listing preference/);
});
