import {accessToken,ebayConfig,ebayJson} from "../../../../lib/ebay";
export const runtime="edge";
export async function GET(request:Request){
  try{
    await accessToken(request);
    const {marketplaceId}=ebayConfig(),q=encodeURIComponent(marketplaceId);
    const results=await Promise.allSettled([
      ebayJson(request,`/sell/account/v1/payment_policy?marketplace_id=${q}`),
      ebayJson(request,`/sell/account/v1/fulfillment_policy?marketplace_id=${q}`),
      ebayJson(request,`/sell/account/v1/return_policy?marketplace_id=${q}`),
      ebayJson(request,"/sell/inventory/v1/location?limit=100")
    ]);
    const value=(index:number,key:string)=>results[index].status==="fulfilled"?(results[index] as PromiseFulfilledResult<any>).value[key]??[]:[];
    const failures=results.filter(result=>result.status==="rejected").map(result=>result.status==="rejected"&&result.reason instanceof Error?result.reason.message:"eBay rejected a setup check.");
    const result={connected:true,paymentPolicies:value(0,"paymentPolicies"),fulfillmentPolicies:value(1,"fulfillmentPolicies"),returnPolicies:value(2,"returnPolicies"),locations:value(3,"locations")};
    return Response.json({...result,ready:Boolean(result.paymentPolicies.length&&result.fulfillmentPolicies.length&&result.returnPolicies.length&&result.locations.length),error:failures.length?`Your Sandbox account is connected, but ${failures.length} setup check${failures.length===1?"":"s"} failed. Next, create Sandbox payment, shipping, and return policies plus one inventory location.`:undefined});
  }catch(error){
    return Response.json({connected:false,ready:false,error:error instanceof Error?error.message:"Unable to inspect eBay Sandbox.",paymentPolicies:[],fulfillmentPolicies:[],returnPolicies:[],locations:[]});
  }
}