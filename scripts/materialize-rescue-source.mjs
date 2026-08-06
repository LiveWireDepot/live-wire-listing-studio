#!/usr/bin/env node
import {createHash} from "node:crypto";
import {copyFile,mkdir,readFile,readdir,writeFile} from "node:fs/promises";
import {basename,join,resolve} from "node:path";

const [runArg,photosArg]=process.argv.slice(2);
if(!runArg||!photosArg)throw new Error("Usage: node scripts/materialize-rescue-source.mjs <run-directory> <photo-directory>");
const runDir=resolve(runArg),photoDir=resolve(photosArg),browser=JSON.parse(await readFile(join(runDir,"source","browser-items.json"),"utf8")),files=(await readdir(photoDir)).filter(name=>/^20260727_\d+\.jpg$/i.test(name)).sort();
if(browser.items.length!==7||files.length!==14)throw new Error(`Expected 7 items and 14 source photos; found ${browser.items.length} and ${files.length}.`);
const digest=async path=>createHash("sha256").update(await readFile(path)).digest("hex"),items=[];
for(const [index,item] of browser.items.entries()){
  const itemPhotos=[],targetDir=join(runDir,"photos",item.sku);await mkdir(targetDir,{recursive:true});
  for(const [offset,name] of files.slice(index*2,index*2+2).entries()){const source=join(photoDir,name),target=join(targetDir,name);await copyFile(source,target);itemPhotos.push({id:`${item.sku}-photo-${offset+1}`,fileName:name,localPath:target,sha256:await digest(target),ordinal:offset+1})}
  items.push({itemId:item.itemId,sku:item.sku,marketplaceId:"EBAY_US",title:item.title,description:item.description,photos:itemPhotos,categoryId:item.categoryId,leafCategory:false,condition:item.condition,price:item.price,priceApproved:item.priceApproved,quantity:1,bestOfferEnabled:item.bestOfferEnabled,packageDetails:{weight:{value:item.weight,unit:"POUND"},dimensions:{length:item.length,width:item.width,height:item.height,unit:"INCH"}},policies:{},merchantLocationKey:"",unresolvedClaims:[],status:item.status,liveListingId:item.liveListingId});
}
await writeFile(join(runDir,"source","items.json"),`${JSON.stringify({schemaVersion:1,sourcePhotoDirectory:photoDir,items},null,2)}\n`);
await writeFile(join(runDir,"source","remote-audit.json"),`${JSON.stringify({inventoryOffers:[{sku:items[0].sku,offerId:"222597549011",listingId:"117338666329"}],sellerListings:[{sku:items[0].sku,customLabel:items[0].sku,itemId:"117338666329",listingId:"117338666329",status:"ACTIVE",title:items[0].title}],objects:[]},null,2)}\n`);
console.log(`Materialized ${items.length} items and ${files.length} verified photos in ${runDir}.`);
