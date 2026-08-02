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
  assert.match(page,/Unpublished \{ebay\?\.environment/);
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
  assert.match(page,/Create all ready \$\{ebay\?\.environment/);
  assert.match(page,/!offers\[item\.id\]&&draftReady/);
  assert.match(page,/draftErrors/);
  assert.match(page,/generationStatus/);
  assert.match(page,/Interrupted before completion; ready to retry/);
  assert.match(css,/\.draftitemerror/);
  assert.match(css,/\.itemstatus/);
});
test("keeps completed workflow chrome compact and specifics collapsible",async()=>{
  const [page,css]=await Promise.all([readFile(pageUrl,"utf8"),readFile(cssUrl,"utf8")]);
  assert.match(page,/testbench \$\{complete===checks\.length\?"complete"/);
  assert.match(page,/<details className="specificsreview"/);
  assert.match(page,/open=\{unresolved\(g\.id\)>0\|\|undefined\}/);
  assert.match(css,/\.testbench\.complete \.testchecks\{display:none\}/);
  assert.match(css,/\.listingcard textarea\{min-height:360px\}/);
  assert.match(css,/\.specificsreview summary/);
  assert.match(page,/className="listinghead"/);
  assert.doesNotMatch(css,/\.listingcard>div\{/);
  assert.match(css,/\.listingcard>\.ebaydraftv2\{display:grid!important/);
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
test("locks live publishing to Production with a typed final gate",async()=>{
  const [page,publish,ebay,category,revise]=await Promise.all([
    readFile(pageUrl,"utf8"),
    readFile(new URL("../app/api/ebay/publish-offer/route.ts",import.meta.url),"utf8"),
    readFile(new URL("../lib/ebay.ts",import.meta.url),"utf8"),
    readFile(new URL("../app/api/ebay/categories/route.ts",import.meta.url),"utf8"),
    readFile(new URL("../app/api/ebay/revise-offer/route.ts",import.meta.url),"utf8"),
  ]);
  assert.match(ebay,/row\.environment!==config\.environment/);
  assert.match(page,/PRODUCTION · LIVE/);
  assert.match(page,/Review fees \+ publish live/);
  assert.match(page,/FINAL LIVE PUBLISH GATE/);
  assert.match(publish,/environment!=="production"/);
  assert.match(publish,/PUBLISH \$\{offerId\}/);
  assert.match(publish,/get_listing_fees/);
  assert.match(publish,/\/publish/);
  assert.match(category,/get_category_suggestions/);
  assert.match(ebay,/requireLeafCategory/);
  assert.match(publish,/requireLeafCategory/);
  assert.match(page,/repairOfferCategory/);
  assert.match(revise,/REVISE \$\{offerId\}/);
  assert.match(revise,/full-replacement/);
});
test("answers eBay deletion endpoint challenges and removes persisted authorization",async()=>{
  const route=await readFile(new URL("../app/api/ebay/marketplace-account-deletion/route.ts",import.meta.url),"utf8");
  assert.match(route,/challengeCode\+verificationToken\(\)\+endpoint/);
  assert.match(route,/SHA-256/);
  assert.match(route,/challengeResponse/);
  assert.match(route,/MARKETPLACE_ACCOUNT_DELETION/);
  assert.match(route,/x-ebay-signature/);
  assert.match(route,/DELETE FROM ebay_connections/);
  assert.match(route,/status:204/);
});
test("uses saved account defaults and bounded parallel generation",async()=>{
  const [page,settings,css]=await Promise.all([readFile(pageUrl,"utf8"),readFile(new URL("../app/components/SellingSettings.tsx",import.meta.url),"utf8"),readFile(cssUrl,"utf8")]);
  assert.match(page,/policyDefaults/);
  assert.match(page,/Math\.min\(3,pending\.length\)/);
  assert.match(page,/Promise\.all\(Array\.from/);
  assert.match(settings,/Selling settings/);
  assert.match(settings,/Payment/);
  assert.match(settings,/Shipping/);
  assert.match(settings,/Returns/);
  assert.match(settings,/Ship from/);
  assert.match(css,/\.sellingsettings/);
  assert.match(page,/BatchCommandCenter/);
  assert.match(css,/\.batchcommand/);
});