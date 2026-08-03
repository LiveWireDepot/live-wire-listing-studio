import test from "node:test";import assert from "node:assert/strict";
const mod=await import("../lib/workflow-state.ts");
const base={content:"approved",evidence:"confirmed",sync:"synchronized",offer:"publishable",publication:"unpublished",operation:"idle",environment:"production"};
test("live overrides stale publication error",()=>assert.equal(mod.workflowLabel({...base,publication:"live",operation:"failed"}),"Live"));
test("failed intended revision remains visible",()=>assert.equal(mod.workflowLabel({...base,publication:"live",operation:"failed",pendingRevision:true}),"Live - revision failed"));
test("production preparation validates every P0 input",()=>{const complete={environment:"production",hasDurableImages:true,titleValid:true,guideValid:true,leafCategory:true,conditionAllowed:true,identifiersValid:true,requiredAspectsValid:true,quantityValid:true,formatValid:true,packageValid:true,bestOfferConfigured:true,policiesValid:true,locationValid:true,priceApproved:true,evidenceResolved:true};assert.deepEqual(mod.publicationBlockers(complete),[]);assert.match(mod.publicationBlockers({...complete,priceApproved:false})[0],/Approve/)})
