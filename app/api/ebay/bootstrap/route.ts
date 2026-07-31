import {ebayConfig,ebayJson} from "../../../../lib/ebay";
export const runtime="edge";
const categoryTypes=[{name:"ALL_EXCLUDING_MOTORS_VEHICLES"}];
export async function POST(request:Request){
  try{
    const body=await request.json() as {postalCode?:string};
    const postalCode=String(body.postalCode||"").trim();
    if(!/^\d{5}(?:-\d{4})?$/.test(postalCode))return Response.json({error:"Enter a valid U.S. ZIP code for the Sandbox warehouse."},{status:400});
    const {marketplaceId}=ebayConfig(),q=encodeURIComponent(marketplaceId);
    const checks=await Promise.allSettled([
      ebayJson(request,`/sell/account/v1/payment_policy?marketplace_id=${q}`),
      ebayJson(request,`/sell/account/v1/fulfillment_policy?marketplace_id=${q}`),
      ebayJson(request,`/sell/account/v1/return_policy?marketplace_id=${q}`),
      ebayJson(request,"/sell/inventory/v1/location?limit=100")
    ]);
    const existing=(index:number,key:string)=>checks[index].status==="fulfilled"?((checks[index] as PromiseFulfilledResult<any>).value[key]??[]):[];
    const created:string[]=[];
    if(!existing(0,"paymentPolicies").length){await ebayJson(request,"/sell/account/v1/payment_policy",{method:"POST",body:JSON.stringify({name:"Live Wire Sandbox Payment",description:"Test-only payment policy created by Live Wire Listing Studio.",marketplaceId,categoryTypes,immediatePay:false})});created.push("payment policy")}
    if(!existing(1,"fulfillmentPolicies").length){await ebayJson(request,"/sell/account/v1/fulfillment_policy",{method:"POST",body:JSON.stringify({name:"Live Wire Sandbox Shipping",description:"Test-only free shipping policy created by Live Wire Listing Studio.",marketplaceId,categoryTypes,handlingTime:{value:3,unit:"DAY"},shippingOptions:[{optionType:"DOMESTIC",costType:"FLAT_RATE",shippingServices:[{sortOrder:1,shippingCarrierCode:"USPS",shippingServiceCode:"USPSPriorityFlatRateBox",shippingCost:{value:"0.00",currency:"USD"},additionalShippingCost:{value:"0.00",currency:"USD"},freeShipping:true,buyerResponsibleForShipping:false,buyerResponsibleForPickup:false}]}],globalShipping:false,pickupDropOff:false,freightShipping:false})});created.push("shipping policy")}
    if(!existing(2,"returnPolicies").length){await ebayJson(request,"/sell/account/v1/return_policy",{method:"POST",body:JSON.stringify({name:"Live Wire Sandbox Returns",description:"Test-only 30-day buyer-paid return policy created by Live Wire Listing Studio.",marketplaceId,categoryTypes,returnsAccepted:true,returnPeriod:{value:30,unit:"DAY"},refundMethod:"MONEY_BACK",returnShippingCostPayer:"BUYER"})});created.push("return policy")}
    if(!existing(3,"locations").length){await ebayJson(request,"/sell/inventory/v1/location/live-wire-sandbox",{method:"POST",body:JSON.stringify({name:"Live Wire Sandbox Warehouse",merchantLocationStatus:"ENABLED",locationTypes:["WAREHOUSE"],location:{address:{postalCode,country:"US"}}})});created.push("inventory location")}
    return Response.json({ok:true,created,message:created.length?`Created ${created.join(", ")} in eBay Sandbox.`:"Your Sandbox seller setup was already complete."},{headers:{"cache-control":"no-store"}});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Sandbox seller setup failed."},{status:400,headers:{"cache-control":"no-store"}})}
}