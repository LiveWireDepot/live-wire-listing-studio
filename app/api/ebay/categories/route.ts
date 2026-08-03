import {ebayConfig,ebayJson,requireLeafCategory} from "../../../../lib/ebay";
export const runtime="edge";
export async function GET(request:Request){
  try{
    const config=ebayConfig();
    if(config.environment!=="production")return Response.json({environment:config.environment,suggestions:[{categoryId:"183077",categoryName:"Recommended Sandbox test category"}],simulated:true},{headers:{"cache-control":"no-store"}});
    const url=new URL(request.url),query=String(url.searchParams.get("q")||"").trim();
    if(query.length<3)return Response.json({error:"Enter at least three characters for a live category search."},{status:400});
    const tree=await ebayJson(request,`/commerce/taxonomy/v1/get_default_category_tree_id?marketplace_id=${encodeURIComponent(config.marketplaceId)}`);
    const data=await ebayJson(request,`/commerce/taxonomy/v1/category_tree/${encodeURIComponent(tree.categoryTreeId)}/get_category_suggestions?q=${encodeURIComponent(query)}`);
    const candidates=(data.categorySuggestions??[]).slice(0,12).map((item:any)=>({categoryId:String(item.category?.categoryId||""),categoryName:String(item.category?.categoryName||""),path:(item.categoryTreeNodeAncestors??[]).map((node:any)=>node.categoryName).filter(Boolean).reverse()})).filter((item:any)=>item.categoryId&&item.categoryName);
    const checked=await Promise.allSettled(candidates.map(async(item:any)=>{await requireLeafCategory(request,item.categoryId);return item}));
    const suggestions=checked.filter((item):item is PromiseFulfilledResult<any>=>item.status==="fulfilled").map(item=>item.value).slice(0,8);
    return Response.json({environment:config.environment,categoryTreeId:tree.categoryTreeId,suggestions},{headers:{"cache-control":"no-store"}});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Unable to retrieve live eBay categories."},{status:400,headers:{"cache-control":"no-store"}})}
}