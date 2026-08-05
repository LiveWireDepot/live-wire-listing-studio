#!/usr/bin/env node
import {join,resolve} from "node:path";
import {loadAccessToken,defaultCredentialPath} from "../lib/rescue-auth.mjs";
import {hash} from "../lib/rescue-core.mjs";
import {atomicJson,event,readJson} from "../lib/rescue-files.mjs";
import {compareOfferSnapshot,publishCanaryOffer,readOfferSnapshot} from "../lib/rescue-offers.mjs";

const args=Object.fromEntries(process.argv.slice(2).map(x=>x.split("=")).filter(x=>x.length===2).map(([k,...v])=>[k.replace(/^--/,""),v.join("=")]));
if(args.execute!=="true"||!args.approval||!args.sku)throw new Error("Canary remains locked. Provide --execute=true, --sku, and the exact --approval manifest hash.");
const runDir=resolve(args.run||"rescue-data/current"),credentialPath=resolve(args.credentials||defaultCredentialPath());
const built=await readJson(join(runDir,"manifests",`${args.sku}.json`)),state=await readJson(join(runDir,"state",`${args.sku}.json`)),offer=await readJson(join(runDir,"offers",`${args.sku}.json`)),media=await readJson(join(runDir,"media",`${args.sku}.json`));
if(hash(built.manifest)!==built.manifestHash)throw new Error("Sealed canary manifest hash is invalid.");
if(state.state!=="VERIFIED"||state.manifestHash!==built.manifestHash||offer.manifestHash!==built.manifestHash)throw new Error("Canary is not in the exact verified pre-publication state.");
const token=await loadAccessToken(credentialPath),snapshot=await readOfferSnapshot(token,offer.offerId),imageUrls=built.manifest.photos.map(p=>media.photos.find(x=>x.id===p.id&&x.sha256===p.sha256)?.imageUrl),diffs=compareOfferSnapshot(built.manifest,snapshot,imageUrls);
if(diffs.length)throw new Error(`Canary changed after verification: ${diffs.join(", ")}.`);
await atomicJson(join(runDir,"state",`${args.sku}.json`),{sku:args.sku,state:"PUBLISHING_UNKNOWN",manifestHash:built.manifestHash,offerId:offer.offerId,attemptedAt:new Date().toISOString()});
await event(runDir,{command:"publish-canary",sku:args.sku,state:"PUBLISHING_UNKNOWN",manifestHash:built.manifestHash,offerId:offer.offerId});
try{
  const result=await publishCanaryOffer({token,manifestHash:built.manifestHash,approvedHash:args.approval,sku:args.sku,offerId:offer.offerId});
  await atomicJson(join(runDir,"state",`${args.sku}.json`),{sku:args.sku,state:"LIVE_RECONCILED",manifestHash:built.manifestHash,offerId:offer.offerId,listingId:result.listingId,publishedAt:new Date().toISOString()});
  await event(runDir,{command:"publish-canary",sku:args.sku,state:"LIVE_RECONCILED",manifestHash:built.manifestHash,offerId:offer.offerId,listingId:result.listingId});
  console.log(`Canary LIVE_RECONCILED. Listing ${result.listingId}. https://www.ebay.com/itm/${result.listingId}`);
}catch(error){
  await event(runDir,{command:"publish-canary",sku:args.sku,state:"PUBLISHING_UNKNOWN",manifestHash:built.manifestHash,offerId:offer.offerId,error:error.message});
  throw error;
}