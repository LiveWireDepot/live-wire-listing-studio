import {EBAY_SCOPES,ebayConfig,viewerEmail} from "../../../../../lib/ebay";

export const runtime="edge";
export async function GET(request:Request){
  if(!viewerEmail(request))return Response.json({error:"Sign in to Live Wire Listing Studio first."},{status:401});
  try{
    const config=ebayConfig(),state=crypto.randomUUID(),target=new URL(config.authorizeBase);
    target.searchParams.set("client_id",config.clientId);
    target.searchParams.set("redirect_uri",config.runame);
    target.searchParams.set("response_type","code");
    target.searchParams.set("scope",EBAY_SCOPES.join(" "));
    target.searchParams.set("state",state);
    target.searchParams.set("prompt","login");
    return new Response(null,{status:302,headers:{location:target.toString(),"set-cookie":`ebay_oauth_state=${encodeURIComponent(state)}; Path=/api/ebay/oauth; HttpOnly; Secure; SameSite=Lax; Max-Age=600`}});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"eBay connection could not start."},{status:503})}
}
