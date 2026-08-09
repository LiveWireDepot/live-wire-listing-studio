import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";

test("uses economy generation by default and requires approval for a fuller review",async()=>{
  const [route,page,costControl]=await Promise.all([
    readFile(new URL("../app/api/generate/route.ts",import.meta.url),"utf8"),
    readFile(new URL("../app/page.tsx",import.meta.url),"utf8"),
    readFile(new URL("../lib/cost-control.ts",import.meta.url),"utf8"),
  ]);
  assert.match(costControl,/gpt-5\.6-luna/);
  assert.match(costControl,/gpt-5\.6-terra/);
  assert.match(route,/generation_completed/);
  assert.match(route,/cacheHit:true/);
  assert.match(route,/fingerprint/);
  assert.match(route,/mode==="economy"&&body\.images\.length>4/);
  assert.match(route,/detail:route\.imageDetail/);
  assert.match(page,/Continue with enhanced review/);
  assert.match(page,/mode:"economy"\|"enhanced"="economy"/);
  assert.match(page,/Review it individually to approve that exception/);
});
