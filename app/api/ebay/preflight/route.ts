import {runEbayPreflight} from "../../../../lib/ebay-preflight";
export const runtime="edge";
export async function POST(request:Request){
  try{const body=await request.json() as {offerId?:string};const offerId=String(body.offerId||"").trim();if(!offerId)return Response.json({error:"Missing offerId."},{status:400});return Response.json(await runEbayPreflight(request,offerId),{headers:{"cache-control":"no-store"}})}
  catch(error){return Response.json({error:error instanceof Error?error.message:"Unable to run eBay preflight."},{status:400,headers:{"cache-control":"no-store"}})}
}