import assert from "node:assert/strict";
import test from "node:test";
import {estimatedCostUsd,generationRoute,usageFromResponse} from "../lib/cost-control.ts";
import {readFile} from "node:fs/promises";

test("routine listings select Luna while enhanced work selects Terra",()=>{
  assert.deepEqual(generationRoute("economy"),{model:"gpt-5.6-luna",effort:"low",imageDetail:"low",reason:"Routine item within the economy photo limit."});
  assert.equal(generationRoute("enhanced").model,"gpt-5.6-terra");
});

test("generation results are durably cached and Cost Control counts reuse separately",async()=>{
  const [route,summary,center]=await Promise.all([
    readFile(new URL("../app/api/generate/route.ts",import.meta.url),"utf8"),
    readFile(new URL("../app/api/studio/cost-summary/route.ts",import.meta.url),"utf8"),
    readFile(new URL("../app/components/BatchCommandCenter.tsx",import.meta.url),"utf8"),
  ]);
  assert.match(route,/generation_completed/);
  assert.match(route,/generation_reused/);
  assert.match(route,/cacheHit:true/);
  assert.match(summary,/estimatedCostUsd/);
  assert.match(center,/Cost control/);
});

test("cost estimates use response usage and do not invent missing tokens",()=>{
  assert.deepEqual(usageFromResponse({input_tokens:8000,output_tokens:1000,total_tokens:9000}),{inputTokens:8000,outputTokens:1000,totalTokens:9000});
  assert.equal(estimatedCostUsd("gpt-5.6-luna",usageFromResponse({input_tokens:8000,output_tokens:1000})),0.0028);
  assert.equal(estimatedCostUsd("gpt-5.6-terra",usageFromResponse({input_tokens:8000,output_tokens:1000})),0.028);
  assert.deepEqual(usageFromResponse({}),{inputTokens:0,outputTokens:0,totalTokens:0});
});
