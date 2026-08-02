import {ebayConfig,ebayJson} from "../../../../lib/ebay";
export const runtime="edge";
export async function POST(request:Request){
  try{
    const config=ebayConfig();
    if(config.environment!=="production")return Response.json({error:"Live publishing is locked while Live Wire is in Sandbox mode."},{status:409});
    const body=await request.json() as {offerId?:string;confirmation?:string;preview?:boolean};
    const offerId=String(body.offerId||"").trim();
    if(!offerId)return Response.json({error:"Missing offerId."},{status:400});
    const offer=await ebayJson(request,`/sell/inventory/v1/offer/${encodeURIComponent(offerId)}`);
    if(body.preview){
      const fees=await ebayJson(request,"/sell/inventory/v1/offer/get_listing_fees",{method:"POST",body:JSON.stringify({offers:[{offerId}]})});
      return Response.json({readyToPublish:true,environment:config.environment,offerId,offer,fees,requiredConfirmation:`PUBLISH ${offerId}`},{headers:{"cache-control":"no-store"}});
    }
    if(body.confirmation!==`PUBLISH ${offerId}`)return Response.json({error:`Type PUBLISH ${offerId} to confirm this live listing.`},{status:400});
    const published=await ebayJson(request,`/sell/inventory/v1/offer/${encodeURIComponent(offerId)}/publish`,{method:"POST"});
    return Response.json({published:true,offerId,listingId:published.listingId,warnings:published.warnings??[],publishedAt:new Date().toISOString()},{headers:{"cache-control":"no-store"}});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Unable to publish this eBay offer."},{status:400,headers:{"cache-control":"no-store"}})}
}