import {getD1} from "../db";

export const EBAY_SCOPES=[
  "https://api.ebay.com/oauth/api_scope",
  "https://api.ebay.com/oauth/api_scope/sell.account",
  "https://api.ebay.com/oauth/api_scope/sell.inventory",
];

export function ebayConfig(){
  const e=(globalThis as any).process?.env??{};
  const environment=e.EBAY_ENVIRONMENT||"sandbox",clientId=e.EBAY_CLIENT_ID,clientSecret=e.EBAY_CLIENT_SECRET,runame=e.EBAY_RUNAME,marketplaceId=e.EBAY_MARKETPLACE_ID||"EBAY_US";
  if(!clientId||!clientSecret||!runame)throw new Error("eBay Sandbox settings are incomplete.");
  const apiBase=environment==="production"?"https://api.ebay.com":"https://api.sandbox.ebay.com";
  return{environment,clientId,clientSecret,runame,marketplaceId,apiBase,authorizeBase:environment==="production"?"https://auth.ebay.com/oauth2/authorize":"https://auth.sandbox.ebay.com/oauth2/authorize",tokenUrl:`${apiBase}/identity/v1/oauth2/token`};
}

export function viewerEmail(request:Request){return request.headers.get("oai-authenticated-user-email")?.trim().toLowerCase()||null}
export function cookie(request:Request,name:string){for(const part of (request.headers.get("cookie")||"").split(";")){const [key,...rest]=part.trim().split("=");if(key===name)return decodeURIComponent(rest.join("="))}return null}
export const clearStateCookie="ebay_oauth_state=; Path=/api/ebay/oauth; HttpOnly; Secure; SameSite=Lax; Max-Age=0";

export async function accessToken(request:Request){
  const email=viewerEmail(request);if(!email)throw new Error("Sign in to Live Wire Listing Studio first.");
  const db=getD1(),row=await db.prepare("SELECT access_token, access_token_expires_at, refresh_token FROM ebay_connections WHERE user_email=?").bind(email).first<any>();
  if(!row)throw new Error("Connect the eBay Sandbox account first.");
  const now=Math.floor(Date.now()/1000);if(Number(row.access_token_expires_at)>now+90)return row.access_token as string;
  const config=ebayConfig(),basic=btoa(`${config.clientId}:${config.clientSecret}`);
  const response=await fetch(config.tokenUrl,{method:"POST",headers:{authorization:`Basic ${basic}`,"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"refresh_token",refresh_token:row.refresh_token,scope:EBAY_SCOPES.join(" ")})});
  const token:any=await response.json();if(!response.ok||!token.access_token)throw new Error(token.error_description||"Reconnect the eBay Sandbox account.");
  await db.prepare("UPDATE ebay_connections SET access_token=?, access_token_expires_at=?, updated_at=? WHERE user_email=?").bind(token.access_token,now+Number(token.expires_in||7200),now,email).run();
  return token.access_token as string;
}

export async function ebayJson(request:Request,path:string,init:RequestInit={}){
  const token=await accessToken(request),config=ebayConfig();
  const response=await fetch(config.apiBase+path,{...init,headers:{authorization:`Bearer ${token}`,"content-type":"application/json","content-language":"en-US",...(init.headers||{})}});
  const text=await response.text();let data:any={};try{data=text?JSON.parse(text):{}}catch{data={message:text}}
  if(!response.ok)throw new Error(data?.errors?.map((e:any)=>e.message).join(" ")||data?.message||`eBay request failed (${response.status}).`);
  return data;
}
