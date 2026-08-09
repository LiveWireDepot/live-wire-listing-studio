import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";

test("uses economy generation by default and requires approval for a fuller review",async()=>{
  const [route,page]=await Promise.all([
    readFile(new URL("../app/api/generate/route.ts",import.meta.url),"utf8"),
    readFile(new URL("../app/page.tsx",import.meta.url),"utf8"),
  ]);
  assert.match(route,/gpt-5\.6-luna/);
  assert.match(route,/gpt-5\.6-terra/);
  assert.match(route,/mode==="economy"&&body\.images\.length>4/);
  assert.match(route,/detail:imageDetail/);
  assert.match(page,/Continue with enhanced review/);
  assert.match(page,/mode:"economy"\|"enhanced"="economy"/);
  assert.match(page,/Review it individually to approve that exception/);
});
