import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

test("eBay configuration uses the hosted worker environment",async()=>{
  const source=await readFile(new URL("../lib/ebay.ts",import.meta.url),"utf8");
  assert.match(source,/import \{env\} from "cloudflare:workers"/);
  assert.match(source,/const e=env as Record/);
  assert.doesNotMatch(source,/process\?\.env/);
});

test("settings names the eBay environment and exposes a high-contrast action",async()=>{
  const page=await readFile(new URL("../app/settings/page.tsx",import.meta.url),"utf8");
  const css=await readFile(new URL("../app/settings/connect.css",import.meta.url),"utf8");
  assert.match(page,/eBay Production/);
  assert.match(page,/eBay Sandbox/);
  assert.match(page,/aria-label/);
  assert.match(css,/min-height:52px/);
  assert.match(css,/border:2px solid/);
  assert.match(css,/:focus-visible/);
});
