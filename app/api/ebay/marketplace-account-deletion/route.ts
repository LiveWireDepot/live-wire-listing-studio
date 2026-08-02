import {getD1} from "../../../../db";
export const runtime="edge";

function verificationToken(){
  const token=String((globalThis as any).process?.env?.EBAY_DELETION_VERIFICATION_TOKEN||"");
  if(!/^[A-Za-z0-9_-]{32,80}$/.test(token))throw new Error("The eBay deletion verification token is not configured.");
  return token;
}
function hex(bytes:ArrayBuffer){return Array.from(new Uint8Array(bytes),byte=>byte.toString(16).padStart(2,"0")).join("")}

export async function GET(request:Request){
  try{
    const url=new URL(request.url),challengeCode=String(url.searchParams.get("challenge_code")||"");
    if(!challengeCode)return Response.json({status:"ready"},{headers:{"cache-control":"no-store"}});
    const endpoint=`${url.origin}${url.pathname}`;
    const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(challengeCode+verificationToken()+endpoint));
    return Response.json({challengeResponse:hex(digest)},{headers:{"cache-control":"no-store"}});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Endpoint validation failed."},{status:503,headers:{"cache-control":"no-store"}})}
}

export async function POST(request:Request){
  try{
    verificationToken();
    if(!request.headers.get("x-ebay-signature"))return Response.json({error:"Missing eBay notification signature."},{status:412});
    const payload=await request.json() as any;
    if(payload?.metadata?.topic!=="MARKETPLACE_ACCOUNT_DELETION"||!payload?.notification?.notificationId||!payload?.notification?.data)return Response.json({error:"Invalid marketplace account deletion notification."},{status:400});
    await getD1().prepare("DELETE FROM ebay_connections").run();
    return new Response(null,{status:204,headers:{"cache-control":"no-store"}});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Notification processing failed."},{status:500,headers:{"cache-control":"no-store"}})}
}