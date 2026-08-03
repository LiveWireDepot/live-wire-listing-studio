import test from "node:test";import assert from "node:assert/strict";import {readFile} from "node:fs/promises";
const recovery=await readFile(new URL("../app/api/studio/recovery/route.ts",import.meta.url),"utf8"),photos=await readFile(new URL("../app/api/studio/photos/route.ts",import.meta.url),"utf8");
test("recovery is owner scoped and includes latest remote state",()=>{assert.match(recovery,/owner_email=\?/);assert.match(recovery,/latestRemote/);assert.match(recovery,/schemaVersion:1/)});
test("durable photo reads enforce item ownership",()=>{assert.match(photos,/JOIN studio_items/);assert.match(photos,/owner_email=\?/);assert.match(photos,/IMAGES\.get/)});
