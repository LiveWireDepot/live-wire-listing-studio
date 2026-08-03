import {accessToken,ebayConfig,ebayJson,requireLeafCategory,requireAllowedCondition} from "../../../../lib/ebay";
export const runtime="edge";

type DraftImage={name?:string;data?:string};

function imageBlob(image:DraftImage){
  const match=String(image.data||"").match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if(!match)throw new Error("One of the selected photos could not be prepared for eBay.");
  const bytes=Uint8Array.from(atob(match[2]),character=>character.charCodeAt(0));
  return new Blob([bytes],{type:match[1]});
}

function packageWeightAndSize(body:any){
  const weight=Number(body.package?.weight),length=Number(body.package?.length),width=Number(body.package?.width),height=Number(body.package?.height);
  if(![weight,length,width,height].every(value=>Number.isFinite(value)&&value>0))throw new Error("Enter a package weight, length, width, and height greater than zero.");
  return{weight:{value:weight,unit:"POUND"},dimensions:{length,width,height,unit:"INCH"}};
}
async function uploadImages(request:Request,images:DraftImage[]){
  if(!images.length)throw new Error("Add at least one photo before creating the eBay draft.");
  const token=await accessToken(request),{mediaBase}=ebayConfig(),urls:string[]=[];
  for(const [index,image] of images.slice(0,12).entries()){
    const form=new FormData();
    form.append("image",imageBlob(image),String(image.name||`live-wire-photo-${index+1}.jpg`));
    const response=await fetch(`${mediaBase}/commerce/media/v1_beta/image/create_image_from_file`,{method:"POST",headers:{authorization:`Bearer ${token}`},body:form});
    const text=await response.text();let data:any={};try{data=text?JSON.parse(text):{}}catch{data={message:text}}
    if(!response.ok||!data.imageUrl)throw new Error(data?.errors?.map((error:any)=>error.longMessage||error.message).join(" ")||data?.message||`Photo ${index+1} could not be uploaded to eBay.`);
    urls.push(data.imageUrl);
  }
  return urls;
}

export async function POST(request:Request){
  try{
    const body=await request.json() as any;
    for(const key of ["sku","title","description","categoryId","price","merchantLocationKey","paymentPolicyId","fulfillmentPolicyId","returnPolicyId"]){
      if(!String(body[key]??"").trim())return Response.json({error:`Missing ${key}.`},{status:400});
    }
    const price=Number(body.price);
    if(!Number.isFinite(price)||price<=0)return Response.json({error:"Enter a price greater than zero."},{status:400});
    const images=Array.isArray(body.images)?body.images:[];
    if(!images.length)return Response.json({error:"Select at least one item photo before creating the eBay draft."},{status:400});
    const packageDetails=packageWeightAndSize(body);
    const config=ebayConfig(),sku=String(body.sku).replace(/[^A-Za-z0-9._-]/g,"-").slice(0,50),quantity=Math.max(1,Number(body.quantity)||1);
    await requireLeafCategory(request,String(body.categoryId));
    await requireAllowedCondition(request,String(body.categoryId),String(body.condition||""));
    const imageUrls=await uploadImages(request,images);
    const aspects=Object.fromEntries(Object.entries(body.aspects??{}).map(([name,values])=>[String(name).trim().slice(0,40),(Array.isArray(values)?values:[values]).map(value=>String(value).trim().slice(0,50)).filter(Boolean)]).filter(([name,values])=>name&&(values as string[]).length));
    await ebayJson(request,`/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`,{method:"PUT",body:JSON.stringify({availability:{shipToLocationAvailability:{quantity}},condition:body.condition||"USED_GOOD",packageWeightAndSize:packageDetails,product:{title:String(body.title).slice(0,80),description:String(body.description),imageUrls,...(Object.keys(aspects).length?{aspects}:{})}})});
    const offer=await ebayJson(request,"/sell/inventory/v1/offer",{method:"POST",body:JSON.stringify({sku,marketplaceId:config.marketplaceId,format:"FIXED_PRICE",availableQuantity:quantity,categoryId:String(body.categoryId),merchantLocationKey:String(body.merchantLocationKey),listingDescription:String(body.description),listingDuration:"GTC",listingPolicies:{paymentPolicyId:String(body.paymentPolicyId),fulfillmentPolicyId:String(body.fulfillmentPolicyId),returnPolicyId:String(body.returnPolicyId)},pricingSummary:{price:{currency:"USD",value:price.toFixed(2)}}})});
    return Response.json({created:true,sku,offerId:offer.offerId,published:false,imageCount:imageUrls.length,imageUrls,aspectCount:Object.keys(aspects).length,categoryId:String(body.categoryId),condition:String(body.condition),packageReady:true,price:price.toFixed(2),createdAt:new Date().toISOString()});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Unable to create the eBay draft offer."},{status:400})}
}
export async function PATCH(request:Request){
  try{
    const body=await request.json() as any,offerId=String(body.offerId||"").trim(),categoryId=String(body.categoryId||"").trim();
    if(!offerId||!categoryId)return Response.json({error:"Missing offerId or categoryId."},{status:400});
    await requireLeafCategory(request,categoryId);
    const condition=String(body.condition||"").trim();
    const packageDetails=packageWeightAndSize(body);
    await requireAllowedCondition(request,categoryId,condition);
    const offer=await ebayJson(request,`/sell/inventory/v1/offer/${encodeURIComponent(offerId)}`);
    if(offer.listing?.listingId)return Response.json({error:"This offer is already live. Use the revision workflow instead."},{status:409});
    const updated={...offer,categoryId};
    const inventoryItem=await ebayJson(request,`/sell/inventory/v1/inventory_item/${encodeURIComponent(offer.sku)}`);
    const inventoryUpdate={...inventoryItem,condition,packageWeightAndSize:packageDetails}; delete inventoryUpdate.sku; delete inventoryUpdate.locale;
    await ebayJson(request,`/sell/inventory/v1/inventory_item/${encodeURIComponent(offer.sku)}`,{method:"PUT",body:JSON.stringify(inventoryUpdate)});
    for(const key of ["offerId","status","listing","warnings"] as const)delete updated[key];
    await ebayJson(request,`/sell/inventory/v1/offer/${encodeURIComponent(offerId)}`,{method:"PUT",body:JSON.stringify(updated)});
    return Response.json({updated:true,offerId,categoryId,condition,packageReady:true,published:false},{headers:{"cache-control":"no-store"}});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Unable to update the unpublished offer category."},{status:400})}
}