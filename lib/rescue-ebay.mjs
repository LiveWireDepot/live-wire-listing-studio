const decode=value=>String(value||"").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'");
const tag=(xml,name)=>decode(xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`,"i"))?.[1]?.trim()||"");

export function parseSellerListings(xml){
  const ack=tag(xml,"Ack"),errors=[...xml.matchAll(/<Errors>([\s\S]*?)<\/Errors>/gi)].map(match=>tag(match[1],"LongMessage")||tag(match[1],"ShortMessage")).filter(Boolean);
  if(ack&&!/[Ss]uccess|[Ww]arning/.test(ack))throw new Error(errors.join(" ")||`Trading API returned ${ack}.`);
  const sections=["ActiveList","ScheduledList"],items=[];
  for(const section of sections){const body=xml.match(new RegExp(`<${section}>[\\s\\S]*?<ItemArray>([\\s\\S]*?)<\\/ItemArray>[\\s\\S]*?<\\/${section}>`,"i"))?.[1]||"";for(const match of body.matchAll(/<Item>([\s\S]*?)<\/Item>/gi)){const item=match[1];items.push({itemId:tag(item,"ItemID"),sku:tag(item,"SKU"),customLabel:tag(item,"SKU"),title:tag(item,"Title"),status:section==="ActiveList"?"ACTIVE":"SCHEDULED"})}}
  const totalPages=Math.max(1,Number(tag(xml,"TotalNumberOfPages")||1));return{items,totalPages,ack,errors};
}

export async function collectSellerListings({requestPage,maxPages=100}){
  const all=[];for(let page=1;page<=maxPages;page++){const parsed=parseSellerListings(await requestPage(page));all.push(...parsed.items);if(page>=parsed.totalPages)return all}throw new Error(`Seller listing audit exceeded ${maxPages} pages.`);
}

export function planImageUploads(photos,cache={}){
  return [...photos].sort((a,b)=>a.ordinal-b.ordinal).map(photo=>cache[photo.sha256]?.epsUrl?{...photo,epsUrl:cache[photo.sha256].epsUrl,action:"REUSE"}:{...photo,action:"UPLOAD"});
}

export function tradingRequest({token,page=1,entriesPerPage=200}){
  if(!token)throw new Error("A production OAuth access token is required.");
  return{url:"https://api.ebay.com/ws/api.dll",headers:{"X-EBAY-API-CALL-NAME":"GetMyeBaySelling","X-EBAY-API-SITEID":"0","X-EBAY-API-COMPATIBILITY-LEVEL":"1423","X-EBAY-API-IAF-TOKEN":token,"Content-Type":"text/xml"},body:`<?xml version="1.0" encoding="utf-8"?><GetMyeBaySellingRequest xmlns="urn:ebay:apis:eBLBaseComponents"><ActiveList><Include>true</Include><Pagination><EntriesPerPage>${entriesPerPage}</EntriesPerPage><PageNumber>${page}</PageNumber></Pagination></ActiveList><ScheduledList><Include>true</Include><Pagination><EntriesPerPage>${entriesPerPage}</EntriesPerPage><PageNumber>${page}</PageNumber></Pagination></ScheduledList></GetMyeBaySellingRequest>`};
}
