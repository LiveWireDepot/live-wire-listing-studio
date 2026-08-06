#!/usr/bin/env node
import {join,resolve} from "node:path";
import {loadAccessToken,defaultCredentialPath} from "../lib/rescue-auth.mjs";
import {buildManifest} from "../lib/rescue-core.mjs";
import {atomicJson,event,readJson} from "../lib/rescue-files.mjs";
import {ebayJson,readOffersBySku} from "../lib/rescue-production.mjs";
import {compareOfferSnapshot,inventoryPayload,readOfferSnapshot} from "../lib/rescue-offers.mjs";
const args=Object.fromEntries(process.argv.slice(2).map(x=>x.split("=")).filter(x=>x.length===2).map(([k,...v])=>[k.replace(/^--/,""),v.join("=")])),runDir=resolve(args.run||"rescue-data/current"),token=await loadAccessToken(resolve(args.credentials||defaultCredentialPath())),source=await readJson(join(runDir,"source","items.json"));
let updated=0;const exceptions=[];
for(const item of source.items||[]){
  if(item.status==="LIVE"||item.condition!=="USED_GOOD")continue;
  const old=await readJson(join(runDir,"manifests",`${item.sku}.json`)),offers=await readOffersBySku(token,item.sku);
  if(offers.length!==1||offers[0].listing?.listingId){exceptions.push(`${item.sku}: expected exactly one unpublished offer; no change made.`);continue}
  const media=await readJson(join(runDir,"media",`${item.sku}.json`)),imageUrls=old.manifest.photos.map(p=>media.photos.find(x=>x.id===p.id&&x.sha256===p.sha256)?.imageUrl);
  if(imageUrls.some(x=>!x)){exceptions.push(`${item.sku}: hosted photo reconciliation failed; no change made.`);continue}
  await atomicJson(join(runDir,"manifests","history",item.sku,`${old.manifestHash}.json`),old);
  item.condition="USED_EXCELLENT";const next=buildManifest(item);
  await atomicJson(join(runDir,"state",`${item.sku}.json`),{sku:item.sku,state:"UPDATING_UNPUBLISHED_CONDITION",manifestHash:next.manifestHash,supersedes:old.manifestHash});
  try{
    await ebayJson(token,`/sell/inventory/v1/inventory_item/${encodeURIComponent(item.sku)}`,{method:"PUT",body:JSON.stringify(inventoryPayload(next.manifest,imageUrls))});
    const snapshot=await readOfferSnapshot(token,offers[0].offerId),diffs=compareOfferSnapshot(next.manifest,snapshot,imageUrls);
    if(diffs.length)throw new Error(`read-back differs in ${diffs.join(", ")}`);
    await atomicJson(join(runDir,"manifests",`${item.sku}.json`),next);
    await atomicJson(join(runDir,"media",`${item.sku}.json`),{...media,manifestHash:next.manifestHash});
    const offerRecord=await readJson(join(runDir,"offers",`${item.sku}.json`));await atomicJson(join(runDir,"offers",`${item.sku}.json`),{...offerRecord,manifestHash:next.manifestHash});
    await atomicJson(join(runDir,"state",`${item.sku}.json`),{sku:item.sku,state:"VERIFIED",manifestHash:next.manifestHash,offerId:offers[0].offerId,supersedes:old.manifestHash,diffs:[]});
    await event(runDir,{command:"normalize-condition",sku:item.sku,state:"VERIFIED",manifestHash:next.manifestHash,supersedes:old.manifestHash,offerId:offers[0].offerId});updated++;
  }catch(error){await atomicJson(join(runDir,"state",`${item.sku}.json`),{sku:item.sku,state:"PUBLISHING_UNKNOWN",manifestHash:next.manifestHash,supersedes:old.manifestHash,error:error.message});exceptions.push(`${item.sku}: ${error.message}; no retry performed.`)}
}
await atomicJson(join(runDir,"source","items.json"),source);
await atomicJson(join(runDir,"approvals","condition-normalization-2026-08-04.json"),{recordedAt:new Date().toISOString(),categoryId:"934",conditionId:"3000",conditionDisplayName:"Used",inventoryConditionEnum:"USED_EXCELLENT",publicationAuthorized:false});
console.log(`Normalized and verified ${updated} unpublished offers; ${exceptions.length} exception${exceptions.length===1?"":"s"}. Nothing published.`);if(exceptions.length)console.error(exceptions.join("\n"));