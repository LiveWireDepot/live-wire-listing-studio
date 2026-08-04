#!/usr/bin/env node
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {extname,join,resolve} from "node:path";
import {loadAccessToken,defaultCredentialPath} from "../lib/rescue-auth.mjs";
import {hash,stableJson} from "../lib/rescue-core.mjs";
import {atomicJson,event,readJson} from "../lib/rescue-files.mjs";
import {uploadImage,readOffersBySku} from "../lib/rescue-production.mjs";
import {compareOfferSnapshot,createOrRecoverUnpublishedOffer,readOfferSnapshot} from "../lib/rescue-offers.mjs";

const args=Object.fromEntries(process.argv.slice(2).map(x=>x.split("=")).filter(x=>x.length===2).map(([k,...v])=>[k.replace(/^--/,""),v.join("=")]));
const runDir=resolve(args.run||"rescue-data/current"),credentialPath=resolve(args.credentials||defaultCredentialPath());
const token=await loadAccessToken(credentialPath),source=await readJson(join(runDir,"source","items.json"));
const exceptions=[],results=[];
for(const item of source.items||[]){
  if(item.status==="LIVE"){results.push({sku:item.sku,state:"SKIPPED_ALREADY_LIVE"});continue}
  const manifestFile=join(runDir,"manifests",`${item.sku}.json`),built=await readJson(manifestFile),manifest=built.manifest;
  if(hash(manifest)!==built.manifestHash){exceptions.push(`${item.sku}: manifest hash mismatch; blocked.`);continue}
  const statePath=join(runDir,"state",`${item.sku}.json`),current=await safeJson(statePath);
  if(["PUBLISHING_UNKNOWN","MEDIA_UNKNOWN"].includes(current?.state)){exceptions.push(`${item.sku}: ${current.state}; automatic retry refused.`);continue}
  try{
    let media=await safeJson(join(runDir,"media",`${item.sku}.json`));
    if(!media)media={sku:item.sku,manifestHash:built.manifestHash,photos:[]};
    if(media.manifestHash!==built.manifestHash)throw new Error("Hosted-media record belongs to a different manifest.");
    for(const photo of [...item.photos].sort((a,b)=>a.ordinal-b.ordinal)){
      const prior=media.photos.find(x=>x.id===photo.id&&x.sha256===photo.sha256);
      if(prior?.imageUrl)continue;
      await atomicJson(statePath,{sku:item.sku,state:"UPLOADING_MEDIA",manifestHash:built.manifestHash,photoId:photo.id});
      const bytes=await readFile(photo.localPath),type=mime(photo.fileName);
      try{
        const uploaded=await uploadImage(token,{name:photo.fileName,bytes,type});
        media.photos.push({id:photo.id,sha256:photo.sha256,ordinal:photo.ordinal,imageUrl:uploaded.imageUrl,imageId:uploaded.imageId});
        media.photos.sort((a,b)=>a.ordinal-b.ordinal);
        await atomicJson(join(runDir,"media",`${item.sku}.json`),media);
        await event(runDir,{command:"upload-media",sku:item.sku,state:"MEDIA_RECONCILED",photoId:photo.id});
      }catch(error){
        await atomicJson(statePath,{sku:item.sku,state:"MEDIA_UNKNOWN",manifestHash:built.manifestHash,photoId:photo.id,error:error.message});
        throw new Error(`media upload uncertain for ${photo.id}; no retry performed: ${error.message}`);
      }
    }
    const imageUrls=manifest.photos.map(p=>media.photos.find(x=>x.id===p.id&&x.sha256===p.sha256)?.imageUrl);
    if(imageUrls.some(x=>!x))throw new Error("One or more manifest photos lack a reconciled EPS URL.");
    await atomicJson(statePath,{sku:item.sku,state:"CREATING_OFFER",manifestHash:built.manifestHash});
    const outcome=await createOrRecoverUnpublishedOffer({token,manifest,imageUrls});
    await atomicJson(join(runDir,"offers",`${item.sku}.json`),{sku:item.sku,manifestHash:built.manifestHash,state:outcome.state,offerId:outcome.offer.offerId});
    const snapshot=await readOfferSnapshot(token,outcome.offer.offerId),diffs=compareOfferSnapshot(manifest,snapshot,imageUrls);
    const finalState=diffs.length?"BLOCKED":"VERIFIED";
    await atomicJson(statePath,{sku:item.sku,state:finalState,manifestHash:built.manifestHash,offerId:outcome.offer.offerId,diffs});
    await event(runDir,{command:"stage-offer",sku:item.sku,state:finalState,offerId:outcome.offer.offerId,diffs});
    results.push({sku:item.sku,state:finalState,offerId:outcome.offer.offerId,diffs});
    if(diffs.length)exceptions.push(`${item.sku}: read-back differs in ${diffs.join(", ")}.`);
  }catch(error){
    const after=await safeJson(statePath);
    if(after?.state==="CREATING_OFFER")await atomicJson(statePath,{...after,state:"PUBLISHING_UNKNOWN",error:error.message});
    exceptions.push(`${item.sku}: ${error.message}`);results.push({sku:item.sku,state:(await safeJson(statePath))?.state||"BLOCKED"});
  }
}
await mkdir(join(runDir,"reports"),{recursive:true});
await writeFile(join(runDir,"reports","staging-results.tsv"),`SKU\tSTATE\tOFFER_ID\tDIFFS\n${results.map(x=>`${x.sku}\t${x.state}\t${x.offerId||""}\t${(x.diffs||[]).join(",")}`).join("\n")}\n`);
await writeFile(join(runDir,"reports","staging-exceptions.md"),`# Staging exceptions\n\n${exceptions.length?exceptions.map(x=>`- ${x}`).join("\n"):"None."}\n`);
console.log(`Staged ${results.filter(x=>x.state==="VERIFIED").length} verified unpublished offers; ${exceptions.length} exception${exceptions.length===1?"":"s"}. Nothing published.`);

async function safeJson(path){try{return await readJson(path)}catch(error){if(error?.code==="ENOENT")return null;throw error}}
function mime(name){const ext=extname(name).toLowerCase();return ext===".png"?"image/png":ext===".webp"?"image/webp":"image/jpeg"}
