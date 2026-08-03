import test from "node:test";
import assert from "node:assert/strict";
import {parseGeneratedListing} from "../lib/generated-listing.ts";
import {findInaccessibleImages} from "../lib/image-validation.ts";

test("malformed model output fails with a controlled retry message",()=>{
  assert.throws(()=>parseGeneratedListing("not json"),/malformed listing data/i);
  assert.throws(()=>parseGeneratedListing(JSON.stringify({title:"Valid",description:"Body",specifics:"nope"})),/valid item specifics/i);
});

test("inaccessible image URLs are identified before publish",async()=>{
  const fetcher=async url=>new Response(null,{status:String(url).includes("missing")?404:206});
  assert.deepEqual(await findInaccessibleImages(["https://images/ok.jpg","https://images/missing.jpg"],fetcher),["https://images/missing.jpg"]);
});
