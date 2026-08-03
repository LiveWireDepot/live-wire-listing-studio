import test from "node:test";import assert from "node:assert/strict";import {readFile} from "node:fs/promises";
const source=await readFile(new URL("../app/api/ebay/prepare-item/route.ts",import.meta.url),"utf8");
test("Prepare Batch separates objective checks from proposals",()=>{assert.match(source,/checks:Check\[\]/);assert.match(source,/proposals:/);assert.match(source,/confidence/);assert.match(source,/copiedAcrossBatch/)});
test("Prepare Batch validates category aspects identifiers policies images and approval",()=>{for(const term of [/aspectRequired/,/requiredIdentifiers/,/paymentPolicyId/,/durableImageCount/,/priceApproved/,/evidenceResolved/])assert.match(source,term)});
