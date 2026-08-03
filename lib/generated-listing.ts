export type GeneratedListing={title:string;description:string;category:string;maker:string;model:string;specifics:unknown[]};

export function parseGeneratedListing(output:string):GeneratedListing{
  let value:unknown;
  try{value=JSON.parse(output)}catch{throw new Error("The model returned malformed listing data. Please try again.")}
  if(!value||typeof value!=="object")throw new Error("The model returned malformed listing data. Please try again.");
  const listing=value as Record<string,unknown>;
  const title=String(listing.title??"").trim(),description=String(listing.description??"").trim();
  if(!title||title.length>80||!description)throw new Error("The generated listing did not pass title and description validation. Please try again.");
  if(!Array.isArray(listing.specifics))throw new Error("The generated listing did not include valid item specifics. Please try again.");
  return{title,description,category:String(listing.category??""),maker:String(listing.maker??""),model:String(listing.model??""),specifics:listing.specifics};
}
