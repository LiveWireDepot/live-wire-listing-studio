import {ebayConfig} from "../../../../lib/ebay";
export const runtime="edge";
export async function GET(request:Request){
  try{
    const config=ebayConfig(),url=new URL(request.url),q=String(url.searchParams.get("q")||"").trim(),categoryId=String(url.searchParams.get("categoryId")||"").trim();
    if(!q)return Response.json({error:"Add a title before researching price."},{status:400});
    const basic=btoa(`${config.clientId}:${config.clientSecret}`),tokenResponse=await fetch(config.tokenUrl,{method:"POST",headers:{authorization:`Basic ${basic}`,"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"client_credentials",scope:"https://api.ebay.com/oauth/api_scope"})}),token:any=await tokenResponse.json();
    if(!tokenResponse.ok||!token.access_token)throw new Error(token.error_description||"eBay price research authorization failed.");
    const params=new URLSearchParams({q:q.slice(0,180),limit:"20",filter:"buyingOptions:{FIXED_PRICE},deliveryCountry:US"});if(categoryId)params.set("category_ids",categoryId);
    const response=await fetch(`${config.apiBase}/buy/browse/v1/item_summary/search?${params}`,{headers:{authorization:`Bearer ${token.access_token}`,"X-EBAY-C-MARKETPLACE-ID":config.marketplaceId}}),data:any=await response.json();
    if(!response.ok)throw new Error(data?.errors?.map((item:any)=>item.longMessage||item.message).join(" ")||"eBay price research failed.");
    const matches=(data.itemSummaries??[]).filter((item:any)=>item.price?.currency==="USD"&&Number(item.price?.value)>0).map((item:any)=>({title:String(item.title||""),price:Number(item.price.value),url:String(item.itemWebUrl||"")}));
    if(!matches.length)return Response.json({query:q,count:0,message:"No comparable active fixed-price listings were returned. Set the price manually."});
    const values=matches.map((item:any)=>item.price),average=values.reduce((sum:number,value:number)=>sum+value,0)/values.length,min=Math.min(...values),max=Math.max(...values);
    return Response.json({query:q,count:matches.length,suggested:Number(average.toFixed(2)),range:{min:Number(min.toFixed(2)),max:Number(max.toFixed(2))},basis:"Current active fixed-price asking prices—not sold prices.",examples:matches.slice(0,5)},{headers:{"cache-control":"no-store"}});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Unable to research current eBay asking prices."},{status:400,headers:{"cache-control":"no-store"}})}
}
