import {ebayJson,readOffersBySku} from "./rescue-production.mjs";
import {stableJson} from "./rescue-core.mjs";

export function inventoryPayload(manifest,imageUrls){
  if(!Array.isArray(imageUrls)||imageUrls.length!==manifest.photos.length)throw new Error("Every ordered manifest photo requires one hosted eBay URL.");
  return{availability:{shipToLocationAvailability:{quantity:manifest.quantity}},condition:manifest.condition,packageWeightAndSize:manifest.packageDetails,product:{title:manifest.title,description:manifest.description,imageUrls,...(Object.keys(manifest.aspects||{}).length?{aspects:manifest.aspects}:{})}};
}

export function offerPayload(manifest){
  return{sku:manifest.sku,marketplaceId:manifest.marketplaceId,format:"FIXED_PRICE",availableQuantity:manifest.quantity,categoryId:manifest.categoryId,merchantLocationKey:manifest.merchantLocationKey,listingDescription:manifest.description,listingDuration:"GTC",listingPolicies:{...manifest.policies,bestOfferTerms:{bestOfferEnabled:manifest.bestOfferEnabled}},pricingSummary:{price:manifest.price}};
}

function oneOffer(offers){
  if(offers.length>1)throw new Error("DUPLICATE_RISK: more than one fixed-price offer matches this SKU.");
  return offers[0]||null;
}

export async function createOrRecoverUnpublishedOffer({token,manifest,imageUrls,fetchImpl=fetch}){
  const existing=oneOffer(await readOffersBySku(token,manifest.sku,fetchImpl));
  if(existing){if(existing.listing?.listingId)throw new Error("ALREADY_LIVE: this SKU already has a live listing and is immutable during rescue.");return{state:"RECOVERED",offer:existing}}
  await ebayJson(token,`/sell/inventory/v1/inventory_item/${encodeURIComponent(manifest.sku)}`,{method:"PUT",body:JSON.stringify(inventoryPayload(manifest,imageUrls))},fetchImpl);
  try{
    const created=await ebayJson(token,"/sell/inventory/v1/offer",{method:"POST",body:JSON.stringify(offerPayload(manifest))},fetchImpl);
    const readBack=oneOffer(await readOffersBySku(token,manifest.sku,fetchImpl));
    if(!readBack)throw new Error("PUBLISHING_UNKNOWN: eBay accepted offer creation but read-back found no offer.");
    return{state:"CREATED",offer:{...readBack,offerId:readBack.offerId||created.offerId}};
  }catch(error){
    const reconciled=oneOffer(await readOffersBySku(token,manifest.sku,fetchImpl));
    if(reconciled){if(reconciled.listing?.listingId)throw new Error("ALREADY_LIVE: reconciliation found an unexpected live listing.");return{state:"RECOVERED_AFTER_AMBIGUOUS_RESPONSE",offer:reconciled}}
    throw Object.assign(new Error("PUBLISHING_UNKNOWN: offer creation had no definitive response and absence is not yet proven. Do not retry."),{cause:error});
  }
}

export function compareOfferSnapshot(expected,actual,imageUrls){const diffs=[];for(const key of ["title","description","categoryId","condition","aspects","quantity","bestOfferEnabled","policies","merchantLocationKey"]){if(stableJson(expected[key])!==stableJson(actual[key]))diffs.push(key)}if(Number(expected.price?.value)!==Number(actual.price)||String(expected.price?.currency)!==String(actual.currency))diffs.push("price");const actualPackage={weight:actual.packageDetails?.weight,dimensions:actual.packageDetails?.dimensions};if(stableJson(expected.packageDetails)!==stableJson(actualPackage))diffs.push("packageDetails");if(stableJson(imageUrls)!==stableJson(actual.photos.map(x=>x.epsUrl)))diffs.push("photos");return diffs}

export async function readOfferSnapshot(token,offerId,fetchImpl=fetch){
  const offer=await ebayJson(token,`/sell/inventory/v1/offer/${encodeURIComponent(offerId)}`,{},fetchImpl);
  const inventory=await ebayJson(token,`/sell/inventory/v1/inventory_item/${encodeURIComponent(offer.sku)}`,{},fetchImpl);
  return{itemId:"",sku:String(offer.sku),marketplaceId:String(offer.marketplaceId),photos:(inventory.product?.imageUrls??[]).map((epsUrl,ordinal)=>({id:`remote-${ordinal+1}`,sha256:"",ordinal,epsUrl})),title:String(inventory.product?.title||""),description:String(offer.listingDescription||inventory.product?.description||""),categoryId:String(offer.categoryId||""),leafCategory:true,condition:String(inventory.condition||""),aspects:inventory.product?.aspects??{},currency:String(offer.pricingSummary?.price?.currency||"USD"),price:Number(offer.pricingSummary?.price?.value||0),priceApproved:true,quantity:Number(offer.availableQuantity??inventory.availability?.shipToLocationAvailability?.quantity??0),bestOfferEnabled:offer.listingPolicies?.bestOfferTerms?.bestOfferEnabled!==false,packageDetails:inventory.packageWeightAndSize??{},policies:{paymentPolicyId:String(offer.listingPolicies?.paymentPolicyId||""),fulfillmentPolicyId:String(offer.listingPolicies?.fulfillmentPolicyId||""),returnPolicyId:String(offer.listingPolicies?.returnPolicyId||"")},merchantLocationKey:String(offer.merchantLocationKey||""),unresolvedClaims:[]};
}
