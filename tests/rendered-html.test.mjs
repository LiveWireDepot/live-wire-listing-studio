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