import test from "node:test";import assert from "node:assert/strict";import {stableJson,sha256} from "../lib/stable.ts";
test("manifest serialization is deterministic",async()=>{const left=stableJson({b:2,a:{d:4,c:3}}),right=stableJson({a:{c:3,d:4},b:2});assert.equal(left,right);assert.equal(await sha256(left),await sha256(right))});
test("material manifest changes invalidate the hash",async()=>{const approved=await sha256(stableJson({sku:"LW-2",price:"19.99",photos:["a","b"]})),changed=await sha256(stableJson({sku:"LW-2",price:"24.99",photos:["a","b"]}));assert.notEqual(approved,changed)});
