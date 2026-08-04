import test from "node:test";
import assert from "node:assert/strict";
import {compareOfferSnapshot,createOrRecoverUnpublishedOffer,inventoryPayload,offerPayload} from "../lib/rescue-offers.mjs";

const manifest={sku:"SKU-1",marketplaceId:"EBAY_US",photos:[{ordinal:0}],quantity:1,condition:"USED_GOOD",packageDetails:{weight:{value:1,unit:"POUND"},dimensions:{length:1,width:1,height:1,unit:"INCH"}},title:"Title",description:"Description",aspects:{Brand:["RCA"]},categoryId:"934",merchantLocationKey:"loc",policies:{paymentPolicyId:"p",fulfillmentPolicyId:"f",returnPolicyId:"r"},bestOfferEnabled:true,price:{currency:"USD",value:"14.95"}};
const response=(body,status=200)=>({ok:status>=200&&status<300,status,text:async()=>JSON.stringify(body)});
test("offer payloads preserve immutable manifest values",()=>{
  assert.deepEqual(inventoryPayload(manifest,["https://i.ebayimg.com/1"] ).product.imageUrls,["https://i.ebayimg.com/1"]);
  assert.equal(offerPayload(manifest).listingPolicies.bestOfferTerms.bestOfferEnabled,true);
});
test("existing unpublished offer is recovered without mutation",async()=>{
  let writes=0;const fetchImpl=async(url,init={})=>{if(init.method)writes++;return response({offers:[{offerId:"o1",sku:"SKU-1",marketplaceId:"EBAY_US",format:"FIXED_PRICE"}]})};
  const result=await createOrRecoverUnpublishedOffer({token:"t",manifest,imageUrls:["url"],fetchImpl});
  assert.equal(result.state,"RECOVERED");assert.equal(writes,0);
});
test("ambiguous create response reconciles before any retry",async()=>{
  let queries=0,posts=0;const fetchImpl=async(url,init={})=>{
    if(url.includes("offer?sku")){queries++;return response({offers:queries===1?[]:[{offerId:"o1",sku:"SKU-1",marketplaceId:"EBAY_US",format:"FIXED_PRICE"}]})}
    if(url.endsWith("/offer")){posts++;return response({message:"timeout"},503)}
    return response({});
  };
  const result=await createOrRecoverUnpublishedOffer({token:"t",manifest,imageUrls:["url"],fetchImpl});
  assert.equal(result.state,"RECOVERED_AFTER_AMBIGUOUS_RESPONSE");assert.equal(posts,1);
});
test("already-live SKU is never modified",async()=>{
  let writes=0;const fetchImpl=async(url,init={})=>{if(init.method)writes++;return response({offers:[{offerId:"o1",sku:"SKU-1",marketplaceId:"EBAY_US",format:"FIXED_PRICE",listing:{listingId:"l1"}}]})};
  await assert.rejects(()=>createOrRecoverUnpublishedOffer({token:"t",manifest,imageUrls:["url"],fetchImpl}),/ALREADY_LIVE/);assert.equal(writes,0);
});
test("read-back comparison accepts eBay price and package normalization",()=>{
  const actual={...manifest,price:14.95,currency:"USD",packageDetails:{...manifest.packageDetails,shippingIrregular:false},photos:[{epsUrl:"url"}]};
  assert.deepEqual(compareOfferSnapshot(manifest,actual,["url"]),[]);
});