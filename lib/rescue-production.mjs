import {collectSellerListings,tradingRequest} from "./rescue-ebay.mjs";

const api="https://api.ebay.com";
const media="https://apim.ebay.com";
export async function ebayJson(token,path,init={},fetchImpl=fetch){
  const response=await fetchImpl(api+path,{...init,headers:{authorization:`Bearer ${token}`,"content-type":"application/json","content-language":"en-US",...(init.headers||{})}});
  const text=await response.text();let data={};try{data=text?JSON.parse(text):{}}catch{data={message:text}}
  if(!response.ok){const error=new Error(data?.errors?.map(item=>item.longMessage||item.message).join(" ")||data?.message||`eBay request failed (${response.status}).`);error.status=response.status;throw error}
  return data;
}

export async function verifySeller(token,fetchImpl=fetch){
  const user=await ebayJson(token,"/commerce/identity/v1/user/",{},fetchImpl);
  if(!user?.userId)throw new Error("eBay did not return an authenticated Production seller identity.");
  return{userId:String(user.userId),username:String(user.username||""),accountType:String(user.accountType||"")};
}

async function allPages(token,path,key,fetchImpl=fetch){
  const output=[];for(let offset=0;offset<10000;){const separator=path.includes("?")?"&":"?",data=await ebayJson(token,`${path}${separator}limit=200&offset=${offset}`,{},fetchImpl),page=data[key]??[];output.push(...page);const total=Number(data.total??output.length);if(!page.length||output.length>=total)break;offset+=page.length}return output;
}
export const listInventoryOffers=(token,fetchImpl=fetch)=>allPages(token,"/sell/inventory/v1/offer","offers",fetchImpl);
export const listPaymentPolicies=(token,marketplaceId="EBAY_US",fetchImpl=fetch)=>allPages(token,`/sell/account/v1/payment_policy?marketplace_id=${encodeURIComponent(marketplaceId)}`,"paymentPolicies",fetchImpl);
export const listFulfillmentPolicies=(token,marketplaceId="EBAY_US",fetchImpl=fetch)=>allPages(token,`/sell/account/v1/fulfillment_policy?marketplace_id=${encodeURIComponent(marketplaceId)}`,"fulfillmentPolicies",fetchImpl);
export const listReturnPolicies=(token,marketplaceId="EBAY_US",fetchImpl=fetch)=>allPages(token,`/sell/account/v1/return_policy?marketplace_id=${encodeURIComponent(marketplaceId)}`,"returnPolicies",fetchImpl);
export const listLocations=(token,fetchImpl=fetch)=>allPages(token,"/sell/inventory/v1/location","locations",fetchImpl);

export async function listSellerListings(token,fetchImpl=fetch){
  return collectSellerListings({requestPage:async page=>{const request=tradingRequest({token,page});const response=await fetchImpl(request.url,{method:"POST",headers:request.headers,body:request.body});const xml=await response.text();if(!response.ok)throw new Error(`Trading API audit failed (${response.status}).`);return xml}});
}

export async function productionAudit(token,{marketplaceId="EBAY_US",fetchImpl=fetch}={}){
  const [seller,inventoryOffers,sellerListings,paymentPolicies,fulfillmentPolicies,returnPolicies,locations]=await Promise.all([verifySeller(token,fetchImpl),listInventoryOffers(token,fetchImpl),listSellerListings(token,fetchImpl),listPaymentPolicies(token,marketplaceId,fetchImpl),listFulfillmentPolicies(token,marketplaceId,fetchImpl),listReturnPolicies(token,marketplaceId,fetchImpl),listLocations(token,fetchImpl)]);
  return{environment:"production",marketplaceId,seller,inventoryOffers,sellerListings,paymentPolicies,fulfillmentPolicies,returnPolicies,locations,auditedAt:new Date().toISOString()};
}

export async function uploadImage(token,{name,bytes,type="image/jpeg"},fetchImpl=fetch){
  const form=new FormData();form.append("image",new Blob([bytes],{type}),name);const response=await fetchImpl(`${media}/commerce/media/v1_beta/image/create_image_from_file`,{method:"POST",headers:{authorization:`Bearer ${token}`},body:form});const text=await response.text();let data={};try{data=text?JSON.parse(text):{}}catch{data={message:text}}if(!response.ok||!data.imageUrl)throw new Error(data?.errors?.map(item=>item.longMessage||item.message).join(" ")||data?.message||"eBay image upload failed.");return{imageUrl:String(data.imageUrl),imageId:String(data.imageId||"")};
}

export async function readOffersBySku(token,sku,fetchImpl=fetch){
  try{const data=await ebayJson(token,`/sell/inventory/v1/offer?sku=${encodeURIComponent(sku)}&limit=25`,{},fetchImpl);return(data.offers??[]).filter(item=>String(item.marketplaceId)==="EBAY_US"&&String(item.format)==="FIXED_PRICE")}catch(error){if(error.status===404||/This Offer is not available|Offer not found/i.test(error.message))return[];throw error}
}
