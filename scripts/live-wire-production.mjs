#!/usr/bin/env node
import {mkdir,writeFile} from "node:fs/promises";
import {join,resolve} from "node:path";
import {loadAccessToken,defaultCredentialPath} from "../lib/rescue-auth.mjs";
import {productionAudit} from "../lib/rescue-production.mjs";
import {classifyRemote} from "../lib/rescue-core.mjs";
import {atomicJson,event,readJson} from "../lib/rescue-files.mjs";

const [command,...args]=process.argv.slice(2);
const options=Object.fromEntries(args.map(value=>value.split("=")).filter(parts=>parts.length>1).map(([key,...value])=>[key.replace(/^--/,""),value.join("=")]));
const runDir=resolve(options.run||"rescue-data/current");
const credentialPath=resolve(options.credentials||defaultCredentialPath());
if(command!=="audit"){
  console.error("Usage: node scripts/live-wire-production.mjs audit --run=<directory> [--credentials=<encrypted-json>]");
  process.exitCode=2;
}else await audit();

async function audit(){
  const source=await readJson(join(runDir,"source","items.json")),items=Array.isArray(source)?source:source.items||[];
  const token=await loadAccessToken(credentialPath);
  const remote=await productionAudit(token,{marketplaceId:"EBAY_US"});
  await atomicJson(join(runDir,"remote","production-audit.json"),remote);
  const rows=[],exceptions=[];
  for(const item of items){
    const result=classifyRemote({sku:item.sku,inventoryOffers:remote.inventoryOffers,sellerListings:remote.sellerListings});
    const state=result.classification==="DUPLICATE_RISK"?"BLOCKED":result.classification==="ALREADY_LIVE"?"LIVE_RECONCILED":result.classification==="RECOVERABLE"?"VERIFIED":"READY";
    await atomicJson(join(runDir,"state",`${item.sku}.json`),{sku:item.sku,state,audit:result.classification});
    await event(runDir,{command:"production-audit",sku:item.sku,state,audit:result.classification});
    rows.push(`${item.sku}\t${result.classification}`);
    if(result.classification==="DUPLICATE_RISK")exceptions.push(`${item.sku}: conflicting remote identities require review.`);
  }
  if(!remote.paymentPolicies.length)exceptions.push("Account: no Production payment policy is available.");
  if(!remote.fulfillmentPolicies.length)exceptions.push("Account: no Production fulfillment policy is available.");
  if(!remote.returnPolicies.length)exceptions.push("Account: no Production return policy is available.");
  if(!remote.locations.some(item=>String(item.merchantLocationStatus||"").toUpperCase()!=="DISABLED"))exceptions.push("Account: no enabled Production inventory location is available.");
  await mkdir(join(runDir,"reports"),{recursive:true});
  await writeFile(join(runDir,"reports","production-audit.tsv"),`SKU\tCLASSIFICATION\n${rows.join("\n")}\n`);
  await writeFile(join(runDir,"reports","production-exceptions.md"),`# Production exceptions\n\n${exceptions.length?exceptions.map(item=>`- ${item}`).join("\n"):"None."}\n`);
  console.log(`Read-only Production audit complete for ${items.length} items. ${exceptions.length} exception${exceptions.length===1?"":"s"}. No remote changes.`);
}
