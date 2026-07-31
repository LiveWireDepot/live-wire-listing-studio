export const EBAY_SCOPES=[
  "https://api.ebay.com/oauth/api_scope",
  "https://api.ebay.com/oauth/api_scope/sell.account",
  "https://api.ebay.com/oauth/api_scope/sell.inventory",
];

export function ebayConfig(){
  const e=(globalThis as any).process?.env??{};
  const environment=e.EBAY_ENVIRONMENT||"sandbox",clientId=e.EBAY_CLIENT_ID,clientSecret=e.EBAY_CLIENT_SECRET,runame=e.EBAY_RUNAME;
  if(!clientId||!clientSecret||!runame)throw new Error("eBay Sandbox settings are incomplete.");
  return{environment,clientId,clientSecret,runame,authorizeBase:environment==="production"?"https://auth.ebay.com/oauth2/authorize":"https://auth.sandbox.ebay.com/oauth2/authorize",tokenUrl:environment==="production"?"https://api.ebay.com/identity/v1/oauth2/token":"https://api.sandbox.ebay.com/identity/v1/oauth2/token"};
}

export function viewerEmail(request:Request){return request.headers.get("oai-authenticated-user-email")?.trim().toLowerCase()||null}
export function cookie(request:Request,name:string){for(const part of (request.headers.get("cookie")||"").split(";")){const [key,...rest]=part.trim().split("=");if(key===name)return decodeURIComponent(rest.join("="))}return null}
export const clearStateCookie="ebay_oauth_state=; Path=/api/ebay/oauth; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
