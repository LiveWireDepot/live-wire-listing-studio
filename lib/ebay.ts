import {env} from "cloudflare:workers";
import {getD1} from "../db";

export const EBAY_SCOPES=[
  "https://api.ebay.com/oauth/api_scope",
  "https://api.ebay.com/oauth/api_scope/sell.account",
  "https://api.ebay.com/oauth/api_scope/sell.inventory",
];

export function ebayConfig(){
  const e=env as Record<string,string|undefined>;
  const environment=e.EBAY_ENVIRONMENT||"sandbox",clientId=e.EBAY_CLIENT_ID,clientSecret=e.EBAY_CLIENT_SECRET,runame=e.EBAY_RUNAME,marketplaceId=e.EBAY_MARKETPLACE_ID||"EBAY_US";
  if(!clientId||!clientSecret||!runame)throw new Error(`eBay ${environment==="production"?"Production":"Sandbox"} settings are incomplete.`);
  const apiBase=environment==="production"?"https://api.ebay.com":"https://api.sandbox.ebay.com";
  return{environment,clientId,clientSecret,runame,marketplaceId,apiBase,mediaBase:environment==="production"?"https://apim.ebay.com":"https://apim.sandbox.ebay.com",authorizeBase:environment==="production"?"https://auth.ebay.com/oauth2/authorize":"https://auth.sandbox.ebay.com/oauth2/authorize",tokenUrl:`${apiBase}/identity/v1/oauth2/token`};
}

export function viewerEmail(request:Request){return request.headers.get("oai-authenticated-user-email")?.trim().toLowerCase()||null}
export function cookie(request:Request,name:string){for(const part of (request.headers.get("cookie")||"").split(";")){const [key,...rest]=part.trim().split("=");if(key===name)return decodeURIComponent(rest.join("="))}return null}
export const clearStateCookie="ebay_oauth_state=; Path=/api/ebay/oauth; HttpOnly; Secure; SameSite=Lax; Max-Age=0";

export async function accessToken(request:Request){
  const email=viewerEmail(request);if(!email)throw new Error("Sign in to Live Wire Listing Studio first.");
  const config=ebayConfig(),db=getD1(),row=await db.prepare("SELECT environment, access_token, access_token_expires_at, refresh_token FROM ebay_connections WHERE user_email=?").bind(email).first<any>();
  if(!row||row.environment!==config.environment)throw new Error(`Connect the eBay ${config.environment==="production"?"Production":"Sandbox"} account first.`);
  const now=Math.floor(Date.now()/1000);if(Number(row.access_token_expires_at)>now+90)return row.access_token as string;
  const basic=btoa(`${config.clientId}:${config.clientSecret}`);
  const response=await fetch(config.tokenUrl,{method:"POST",headers:{authorization:`Basic ${basic}`,"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"refresh_token",refresh_token:row.refresh_token,scope:EBAY_SCOPES.join(" ")})});
  const token:any=await response.json();if(!response.ok||!token.access_token)throw new Error(token.error_description||`Reconnect the eBay ${config.environment==="production"?"Production":"Sandbox"} account.`);
  await db.prepare("UPDATE ebay_connections SET access_token=?, access_token_expires_at=?, updated_at=? WHERE user_email=?").bind(token.access_token,now+Number(token.expires_in||7200),now,email).run();
  return token.access_token as string;
}

export async function ebayJson(request:Request,path:string,init:RequestInit={}){
  const token=await accessToken(request),config=ebayConfig();
  const response=await fetch(config.apiBase+path,{...init,headers:{authorization:`Bearer ${token}`,"content-type":"application/json","content-language":"en-US",...(init.headers||{})}});
  const text=await response.text();let data:any={};try{data=text?JSON.parse(text):{}}catch{data={message:text}}
  if(!response.ok)throw new Error(data?.errors?.map((e:any)=>e.longMessage||e.message).join(" ")||data?.message||`eBay request failed (${response.status}).`);
  return data;
}

export async function requireLeafCategory(request:Request,categoryId:string){
  const config=ebayConfig();
  if(config.environment!=="production")return{categoryId,leaf:true};
  const tree=await ebayJson(request,`/commerce/taxonomy/v1/get_default_category_tree_id?marketplace_id=${encodeURIComponent(config.marketplaceId)}`);
  const subtree=await ebayJson(request,`/commerce/taxonomy/v1/category_tree/${encodeURIComponent(tree.categoryTreeId)}/get_category_subtree?category_id=${encodeURIComponent(categoryId)}`);
  if(subtree.categorySubtreeNode?.leafCategoryTreeNode!==true)throw new Error("Choose a more specific eBay category. The selected category is a parent category and cannot contain listings.");
  return{categoryId,leaf:true,categoryName:subtree.categorySubtreeNode?.category?.categoryName||""};
}
export const CONDITION_ENUM_BY_ID:Record<string,string>={"1000":"NEW","1500":"NEW_OTHER","1750":"NEW_WITH_DEFECTS","2000":"CERTIFIED_REFURBISHED","2010":"EXCELLENT_REFURBISHED","2020":"VERY_GOOD_REFURBISHED","2030":"GOOD_REFURBISHED","2500":"SELLER_REFURBISHED","2750":"LIKE_NEW","2990":"PRE_OWNED_EXCELLENT","3000":"USED_EXCELLENT","3010":"PRE_OWNED_FAIR","4000":"USED_VERY_GOOD","5000":"USED_GOOD","6000":"USED_ACCEPTABLE","7000":"FOR_PARTS_OR_NOT_WORKING"};
export async function categoryConditions(request:Request,categoryId:string){
  const config=ebayConfig();
  if(config.environment!=="production")return[{conditionId:"5000",condition:"USED_GOOD",description:"Used"}];
  const data=await ebayJson(request,`/sell/metadata/v1/marketplace/${encodeURIComponent(config.marketplaceId)}/get_item_condition_policies?filter=${encodeURIComponent(`categoryIds:{${categoryId}}`)}`);
  const policy=(data.itemConditionPolicies??[]).find((item:any)=>String(item.categoryId)===categoryId)||data.itemConditionPolicies?.[0];
  return(policy?.itemConditions??[]).map((item:any)=>({conditionId:String(item.conditionId),condition:CONDITION_ENUM_BY_ID[String(item.conditionId)]||"",description:String(item.conditionDescription||item.conditionDisplayName||item.conditionId)})).filter((item:any)=>item.condition);
}
export async function requireAllowedCondition(request:Request,categoryId:string,condition:string){
  const allowed=await categoryConditions(request,categoryId);
  if(!allowed.some((item:any)=>item.condition===condition))throw new Error("Choose an item condition allowed by the selected eBay category.");
  return allowed;
}
