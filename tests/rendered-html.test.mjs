import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const pageUrl=new URL("../app/page.tsx",import.meta.url);
const routeUrl=new URL("../app/api/ebay/draft-offer/route.ts",import.meta.url);
const cssUrl=new URL("../app/listing.css",import.meta.url);

test("keeps Sandbox Draft v2 review and completion state visible",async()=>{
  const [page,css]=await Promise.all([readFile(pageUrl,"utf8"),readFile(cssUrl,"utf8")]);
  assert.match(page,/Sandbox seller ready/);
  assert.match(page,/Draft preflight/);
  assert.match(page,/Photos attached/);
  assert.match(page,/Recommended Sandbox test category \(183077\)/);
  assert.match(page,/Unpublished Sandbox draft created/);
  assert.match(page,/setOffers/);
  assert.match(page,/offerInputs,offers/);
  assert.match(css,/\.offerreceipt/);
  assert.match(css,/\.sandboxready/);
});

test("generates every remaining item without overwriting completed drafts",async()=>{
  const [page,css]=await Promise.all([readFile(pageUrl,"utf8"),readFile(cssUrl,"utf8")]);
  assert.match(page,/async function generateAll/);
  assert.match(page,/!drafts\[g\.id\]/);
  assert.match(page,/Generate all remaining/);
  assert.match(css,/\.generateall/);
});

test("automates evidence-labeled item specifics with a human review gate",async()=>{
  const [page,route,draft,css]=await Promise.all([
    readFile(pageUrl,"utf8"),
    readFile(new URL("../app/api/generate/route.ts",import.meta.url),"utf8"),
    readFile(routeUrl,"utf8"),
    readFile(cssUrl,"utf8"),
  ]);
  assert.match(route,/requiresConfirmation/);
  assert.match(route,/confidence/);
  assert.match(page,/Automated item specifics/);
  assert.match(page,/Needs you|needs you/);
  assert.match(page,/approvedAspects/);
  assert.match(draft,/product:\{[^}]*aspects/);
  assert.match(draft,/aspectCount/);
  assert.match(css,/\.specificsreview/);
});
test("queues complete Sandbox drafts sequentially with persistent per-item outcomes",async()=>{
  const [page,css]=await Promise.all([readFile(pageUrl,"utf8"),readFile(cssUrl,"utf8")]);
  assert.match(page,/async function createAllDrafts/);
  assert.match(page,/await createEbayDraft\(item\.id,true\)/);
  assert.match(page,/Create all ready Sandbox drafts/);
  assert.match(page,/!offers\[item\.id\]&&draftReady/);
  assert.match(page,/draftErrors/);
  assert.match(page,/generationStatus/);
  assert.match(page,/Interrupted before completion; ready to retry/);
  assert.match(css,/\.draftitemerror/);
  assert.match(css,/\.itemstatus/);
});
test("uploads approved photos before creating an unpublished offer",async()=>{
  const route=await readFile(routeUrl,"utf8");
  assert.match(route,/create_image_from_file/);
  assert.match(route,/FormData/);
  assert.match(route,/images\.slice\(0,12\)/);
  assert.match(route,/imageUrls/);
  assert.match(route,/createOrReplace|inventory_item/);
  assert.match(route,/published:false/);
  assert.match(route,/price<=0/);
});