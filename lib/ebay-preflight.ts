import {ebayConfig,ebayJson,requireAllowedCondition,requireLeafCategory} from "./ebay";
import {findInaccessibleImages} from "./image-validation";

export type PreflightCheck={id:string;label:string;status:"pass"|"fail"|"warning";message:string};
const pass=(id:string,label:string,message:string):PreflightCheck=>({id,label,status:"pass",message});
const fail=(id:string,label:string,message:string):PreflightCheck=>({id,label,status:"fail",message});

export async function runEbayPreflight(request:Request,offerId:string){
  const checks:PreflightCheck[]=[];
  const config=ebayConfig();
  let offer:any,inventoryItem:any;
  try{offer=await ebayJson(request,`/sell/inventory/v1/offer/${encodeURIComponent(offerId)}`);checks.push(pass("offer","Unpublished offer","The eBay offer is available for review."))}catch(error){checks.push(fail("offer","Unpublished offer",error instanceof Error?error.message:"The offer could not be loaded."));return finish(checks,offerId)}
  const sku=String(offer.sku||"");
  try{inventoryItem=await ebayJson(request,`/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`);checks.push(pass("inventory","Inventory item",`SKU ${sku} is available.`))}catch(error){checks.push(fail("inventory","Inventory item",error instanceof Error?error.message:"The inventory item could not be loaded."));return finish(checks,offerId)}

  const title=String(inventoryItem.product?.title||"").trim(),description=String(inventoryItem.product?.description||"").trim(),images=inventoryItem.product?.imageUrls??[];
  checks.push(title&&title.length<=80?pass("title","Title",`${title.length}/80 characters.`):fail("title","Title",title?"Shorten the title to 80 characters or fewer.":"Add a title."));
  checks.push(description?pass("description","Description","Listing description is present."):fail("description","Description","Add a listing description."));
  if(!images.length)checks.push(fail("photos","Photos","Attach at least one photo."));
  else{const inaccessible=await findInaccessibleImages(images);checks.push(inaccessible.length?fail("photos","Photos",`${inaccessible.length} photo${inaccessible.length===1?" is":"s are"} not publicly retrievable.`):pass("photos","Photos",`${images.length} photo${images.length===1?"":"s"} attached and retrievable.`))}
  const quantity=Number(inventoryItem.availability?.shipToLocationAvailability?.quantity);
  checks.push(quantity>0?pass("quantity","Quantity",`${quantity} available.`):fail("quantity","Quantity","Set available quantity to at least 1."));
  const price=Number(offer.pricingSummary?.price?.value),currency=String(offer.pricingSummary?.price?.currency||"");
  checks.push(price>0&&currency==="USD"?pass("price","Price",`$${price.toFixed(2)} USD.`):fail("price","Price","Set a positive USD price."));

  const categoryId=String(offer.categoryId||"");
  try{await requireLeafCategory(request,categoryId);checks.push(pass("category","Leaf category",`Category ${categoryId} can contain listings.`))}catch(error){checks.push(fail("category","Leaf category",error instanceof Error?error.message:"Choose a valid leaf category."))}
  try{await requireAllowedCondition(request,categoryId,String(inventoryItem.condition||""));checks.push(pass("condition","Condition","Condition is allowed in this category."))}catch(error){checks.push(fail("condition","Condition",error instanceof Error?error.message:"Choose an allowed condition."))}
  const pkg=inventoryItem.packageWeightAndSize,d=pkg?.dimensions;
  checks.push(Number(pkg?.weight?.value)>0&&Number(d?.length)>0&&Number(d?.width)>0&&Number(d?.height)>0?pass("package","Shipping package",`${pkg.weight.value} ${pkg.weight.unit||"POUND"}; ${d.length} x ${d.width} x ${d.height} ${d.unit||"INCH"}.`):fail("package","Shipping package","Add packed weight and all three dimensions."));

  for(const [field,label,path] of [["paymentPolicyId","Payment policy","payment_policy"],["fulfillmentPolicyId","Shipping policy","fulfillment_policy"],["returnPolicyId","Return policy","return_policy"]] as const){
    const id=String(offer.listingPolicies?.[field]||"");
    if(!id){checks.push(fail(field,label,`Select a ${label.toLowerCase()}.`));continue}
    try{const policy=await ebayJson(request,`/sell/account/v1/${path}/${encodeURIComponent(id)}`);checks.push(pass(field,label,`${policy.name||id} is available for ${policy.marketplaceId||config.marketplaceId}.`))}catch(error){checks.push(fail(field,label,error instanceof Error?error.message:`The selected ${label.toLowerCase()} is unavailable.`))}
  }
  checks.push(offer.listingPolicies?.bestOfferTerms?.bestOfferEnabled===true?pass("bestOffer","Best Offer","Buyers can submit offers."):fail("bestOffer","Best Offer","Enable Best Offer for this listing."));
  const locationKey=String(offer.merchantLocationKey||"");
  if(!locationKey)checks.push(fail("location","Inventory location","Select an inventory location."));
  else try{const location=await ebayJson(request,`/sell/inventory/v1/location/${encodeURIComponent(locationKey)}`);checks.push(location.merchantLocationStatus==="DISABLED"?fail("location","Inventory location",`${locationKey} is disabled.`):pass("location","Inventory location",`${location.name||locationKey} is enabled.`))}catch(error){checks.push(fail("location","Inventory location",error instanceof Error?error.message:"The inventory location is unavailable."))}

  if(categoryId){
    try{
      const tree=await ebayJson(request,`/commerce/taxonomy/v1/get_default_category_tree_id?marketplace_id=${encodeURIComponent(config.marketplaceId)}`);
      const data=await ebayJson(request,`/commerce/taxonomy/v1/category_tree/${encodeURIComponent(tree.categoryTreeId)}/get_item_aspects_for_category?category_id=${encodeURIComponent(categoryId)}`);
      const actual=new Set(Object.keys(inventoryItem.product?.aspects??{}).map(name=>name.toLowerCase()));
      const required=(data.aspects??[]).filter((aspect:any)=>aspect.aspectConstraint?.aspectRequired===true).map((aspect:any)=>String(aspect.localizedAspectName));
      const missing=required.filter((name:string)=>!actual.has(name.toLowerCase()));
      checks.push(missing.length?fail("aspects","Required item specifics",`Add: ${missing.join(", ")}.`):pass("aspects","Required item specifics",required.length?`All ${required.length} required item specifics are present.`:"This category has no required item specifics."));
    }catch(error){checks.push(fail("aspects","Required item specifics",error instanceof Error?error.message:"eBay category requirements could not be checked."))}
  }
  checks.push(String(offer.marketplaceId||"")===config.marketplaceId?pass("marketplace","Marketplace",config.marketplaceId):fail("marketplace","Marketplace",`Offer marketplace does not match ${config.marketplaceId}.`));
  return finish(checks,offerId,{offer,inventoryItem});
}

function finish(checks:PreflightCheck[],offerId:string,extra:any={}){const blockers=checks.filter(check=>check.status==="fail");return{offerId,ready:blockers.length===0,blockerCount:blockers.length,checkedAt:new Date().toISOString(),checks,...extra}}
