import {getD1} from "../../../../../db";
import {clearStateCookie,cookie,ebayConfig,viewerEmail} from "../../../../../lib/ebay";

export const runtime="edge";
function page(title:string,message:string){return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | Live Wire Listing Studio</title><style>body{margin:0;background:#111814;color:#f4f0e8;font-family:Arial,sans-serif;min-height:100vh;display:grid;place-items:center}.card{width:min(560px,calc(100% - 48px));border:1px solid #657068;background:#18221d;padding:42px}.eyebrow{color:#c99158;font-size:12px;letter-spacing:.16em;text-transform:uppercase}h1{font-family:Georgia,serif;font-size:38px;margin:12px 0 18px}p{color:#cfd6d1;line-height:1.65}a{display:inline-block;margin-top:18px;background:#f4f0e8;color:#111814;padding:12px 17px;text-decoration:none;font-weight:700}</style></head><body><main class="card"><div class="eyebrow">Live Wire Listing Studio</div><h1>${title}</h1><p>${message}</p><a href="/">Return to the studio</a></main></body></html>`}

export async function GET(request:Request){
  const url=new URL(request.url),code=url.searchParams.get("code"),returnedState=url.searchParams.get("state"),expectedState=cookie(request,"ebay_oauth_state"),email=viewerEmail(request);
  if(!code)return new Response(page("eBay callback ready","This callback is ready for eBay OAuth. Start the connection from Live Wire Listing Studio rather than opening this address directly."),{status:200,headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store"}});
  if(!email||!returnedState||returnedState!==expectedState)return new Response(page("Connection could not be verified","Return to the studio and start Connect eBay again. No account access was saved."),{status:400,headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store","set-cookie":clearStateCookie}});
  try{
    const config=ebayConfig(),basic=btoa(`${config.clientId}:${config.clientSecret}`);
    const tokenResponse=await fetch(config.tokenUrl,{method:"POST",headers:{authorization:`Basic ${basic}`,"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"authorization_code",code,redirect_uri:config.runame})});
    const token:any=await tokenResponse.json();
    if(!tokenResponse.ok||!token.access_token||!token.refresh_token)throw new Error(token.error_description||"eBay did not return a usable authorization.");
    const now=Math.floor(Date.now()/1000),db=getD1();
    await db.prepare("INSERT INTO ebay_connections (user_email, environment, access_token, access_token_expires_at, refresh_token, refresh_token_expires_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_email) DO UPDATE SET environment=excluded.environment, access_token=excluded.access_token, access_token_expires_at=excluded.access_token_expires_at, refresh_token=excluded.refresh_token, refresh_token_expires_at=excluded.refresh_token_expires_at, updated_at=excluded.updated_at").bind(email,config.environment,token.access_token,now+Number(token.expires_in||7200),token.refresh_token,now+Number(token.refresh_token_expires_in||0),now).run();
    return new Response(page("eBay Sandbox connected","Your Sandbox seller account is securely connected. Return to the studio to continue building and testing listings."),{status:200,headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store","set-cookie":clearStateCookie}});
  }catch(error){return new Response(page("eBay connection failed",error instanceof Error?error.message:"The authorization could not be saved."),{status:502,headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store","set-cookie":clearStateCookie}})}
}
