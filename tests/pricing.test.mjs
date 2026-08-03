import test from "node:test";import assert from "node:assert/strict";import {readFile} from "node:fs/promises";
const source=await readFile(new URL("../app/api/ebay/price-research/route.ts",import.meta.url),"utf8");
test("pricing never represents active asks as sold value",()=>{assert.match(source,/asking prices, not sold/i);assert.match(source,/requiresApproval:true/)});
test("pricing uses similarity, delivered price, median, and outlier rejection",()=>{for(const term of [/similarity/,/delivered/,/median\(/,/1\.5\*iqr/,/blocked/])assert.match(source,term)});
