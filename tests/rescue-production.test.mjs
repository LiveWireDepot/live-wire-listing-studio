import test from "node:test";
import assert from "node:assert/strict";
import {readOffersBySku,verifySeller,productionAudit} from "../lib/rescue-production.mjs";

const response=(body,status=200)=>({ok:status>=200&&status<300,status,text:async()=>typeof body==="string"?body:JSON.stringify(body)});
test("Production seller identity is required",async()=>{
  const seller=await verifySeller("token",async()=>response({userId:"seller-1",username:"mark"}));
  assert.equal(seller.userId,"seller-1");
  await assert.rejects(()=>verifySeller("token",async()=>response({})),/authenticated Production seller/);
});
test("missing SKU offer is a clean absence",async()=>{
  assert.deepEqual(await readOffersBySku("token","SKU-1",async()=>response({errors:[{message:"This Offer is not available."}]},404)),[]);
});
test("inventory offer audit enumerates inventory SKUs before reading offers",async()=>{
  const seen=[];
  const fetchImpl=async url=>{
    seen.push(url);
    if(url.includes("inventory_item"))return response({inventoryItems:[{sku:"SKU-1"}],total:1});
    if(url.includes("offer?sku=SKU-1"))return response({offers:[{sku:"SKU-1",offerId:"o1",marketplaceId:"EBAY_US",format:"FIXED_PRICE"}]});
    throw new Error(url);
  };
  const {listInventoryOffers}=await import("../lib/rescue-production.mjs");
  const offers=await listInventoryOffers("token",fetchImpl);
  assert.equal(offers[0].offerId,"o1");
  assert.ok(seen[0].includes("inventory_item"));
});

test("production audit groups seller policies locations and listings",async()=>{
  const fetchImpl=async(url)=>{
    if(url.includes("/identity/"))return response({userId:"seller-1"});
    if(url.includes("api.dll"))return response('<?xml version="1.0"?><GetMyeBaySellingResponse><Ack>Success</Ack><ActiveList><ItemArray></ItemArray><PaginationResult><TotalNumberOfPages>1</TotalNumberOfPages></PaginationResult></ActiveList><ScheduledList><ItemArray></ItemArray></ScheduledList></GetMyeBaySellingResponse>');
    if(url.includes("payment_policy"))return response({paymentPolicies:[{paymentPolicyId:"p1"}],total:1});
    if(url.includes("fulfillment_policy"))return response({fulfillmentPolicies:[{fulfillmentPolicyId:"f1"}],total:1});
    if(url.includes("return_policy"))return response({returnPolicies:[{returnPolicyId:"r1"}],total:1});
    if(url.includes("location"))return response({locations:[{merchantLocationKey:"l1"}],total:1});
    if(url.includes("inventory_item"))return response({inventoryItems:[],total:0});
    if(url.includes("offer"))return response({offers:[],total:0});
    throw new Error(url);
  };
  const audit=await productionAudit("token",{fetchImpl});
  assert.equal(audit.environment,"production");assert.equal(audit.paymentPolicies[0].paymentPolicyId,"p1");assert.equal(audit.locations[0].merchantLocationKey,"l1");
});
