import {accessToken,ebayConfig,ebayJson} from "../../../../lib/ebay";
export const runtime="edge";

type DraftImage={name?:string;data?:string};

function imageBlob(image:DraftImage){
  const match=String(image.data||"").match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if(!match)throw new Error("One of the selected photos could not be prepared for eBay.");
  const bytes=Uint8Array.from(atob(match[2]),character=>character.charCodeAt(0));
  return new Blob([bytes],{type:match[1]});
}

async function uploadImages(request:Request,images:DraftImage[]){
  if(!images.length)throw new Error("Add at least one photo before creating the Sandbox draft.");
  const token=await accessToken(request),{mediaBase}=ebayConfig(),urls:string[]=[];
  for(const [index,image] of images.slice(0,12).entries()){
    const form=new FormData();
    form.append("image",imageBlob(image),String(image.name||`live-wire-photo-${index+1}.jpg`));
    const response=await fetch(`${mediaBase}/commerce/media/v1_beta/image/create_image_from_file`,{method:"POST",headers:{authorization:`Bearer ${token}`},body:form});
    const text=await response.text();let data:any={};try{data=text?JSON.parse(text):{}}catch{data={message:text}}
    if(!response.ok||!data.imageUrl)throw new Error(data?.errors?.map((error:any)=>error.longMessage||error.message).join(" ")||data?.message||`Photo ${index+1} could not be uploaded to eBay Sandbox.`);
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
    if(!Number.isFinite(price)||price<=0)return Response.json({error:"Enter a test price greater than zero."},{status:400});
    const images=Array.isArray(body.images)?body.images:[];
    if(!images.length)return Response.json({error:"Select at least one item photo before creating the Sandbox draft."},{status:400});
    const config=ebayConfig(),sku=String(body.sku).replace(/[^A-Za-z0-9._-]/g,"-").slice(0,50),quantity=Math.max(1,Number(body.quantity)||1);
    const imageUrls=await uploadImages(request,images);
    await ebayJson(request,`/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`,{method:"PUT",body:JSON.stringify({availability:{shipToLocationAvailability:{quantity}},condition:body.condition||"USED_GOOD",product:{title:String(body.title).slice(0,80),description:String(body.description),imageUrls}})});
    const offer=await ebayJson(request,"/sell/inventory/v1/offer",{method:"POST",body:JSON.stringify({sku,marketplaceId:config.marketplaceId,format:"FIXED_PRICE",availableQuantity:quantity,categoryId:String(body.categoryId),merchantLocationKey:String(body.merchantLocationKey),listingDescription:String(body.description),listingDuration:"GTC",listingPolicies:{paymentPolicyId:String(body.paymentPolicyId),fulfillmentPolicyId:String(body.fulfillmentPolicyId),returnPolicyId:String(body.returnPolicyId)},pricingSummary:{price:{currency:"USD",value:price.toFixed(2)}}})});
    return Response.json({created:true,sku,offerId:offer.offerId,published:false,imageCount:imageUrls.length,imageUrls,categoryId:String(body.categoryId),price:price.toFixed(2),createdAt:new Date().toISOString()});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Unable to create the Sandbox draft offer."},{status:400})}
}