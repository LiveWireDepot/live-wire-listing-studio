import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

test("interface source contains no common mojibake markers",async()=>{
  const source=await readFile(new URL("../app/page.tsx",import.meta.url),"utf8");
  const markers=["Ã","Â","â","ƒ","Æ","�"];
  assert.deepEqual(markers.filter(marker=>source.includes(marker)),[]);
  assert.match(source,/Production seller ready/);
  assert.match(source,/Nothing is published/);
});
