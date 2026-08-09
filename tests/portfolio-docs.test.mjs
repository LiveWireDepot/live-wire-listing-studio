import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const docs=["README.md","docs/PRODUCT_CASE_STUDY.md","docs/PORTFOLIO_TALK_TRACK.md","docs/DECISION_EVIDENCE.md","docs/COST_CONTROL_V1.md","docs/PRODUCTION_VALIDATION.md","docs/ARCHITECTURE.md","docs/SECURITY_AND_HUMAN_REVIEW.md"];

test("public portfolio documents are readable, linked, and avoid private artifacts",async()=>{
  const files=await Promise.all(docs.map(file=>readFile(new URL(`../${file}`,import.meta.url),"utf8")));
  const joined=files.join("\n");
  assert.doesNotMatch(joined,/â€”|â€œ|â€|rÃ©sumÃ©/);
  assert.match(files[0],/Cost Control v1/);
  assert.match(files[0],/Production Validation/);
  assert.match(joined,/148 individual/);
  assert.match(joined,/OpenRouter.*not.*default Production route/is);
  assert.doesNotMatch(joined,/\b(?:offerId|listingId|accessToken|refreshToken|clientSecret)\b/);
});
