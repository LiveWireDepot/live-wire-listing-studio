export const runtime = "edge";
const GUIDE = `You write finished eBay listings for Mark Beebe's store, Live Wire Antiques. Treat every rule below as authoritative.

Inspect every supplied image and user fact. Never invent maker, model, date, material, function, completeness, test result, authenticity, rarity, restoration, provenance, or an eBay category ID. User facts outrank visible evidence; visible labels outrank careful inference. Use an empty string for category, maker, or model when the evidence is insufficient. Label uncertainty naturally as likely, appears to be, or possibly.

Voice: knowledgeable, collector-aware, warm, straightforward, historically literate, and specific. Make the object feel special without inflated claims or generic AI filler. Include supported historical or cultural context when it enriches the listing; clearly distinguish broad context from facts proven about this exact item.

Return structured fields only. The title must be one SEO title of no more than 80 characters, front-loading supported maker/model, item type, era/date, and useful buyer search terms. The description must begin with that identical title as its first line. Do not include BLOCK labels, TITLE ONLY labels, COMPLETE BODY labels, markdown code fences, citations, analysis, confidence notes, alternate titles, pricing, or comps.

After the title and a blank line, write a substantial 4-6 sentence opening. Identify the item, explain its purpose or significance, and add supported historical context or collector appeal. Then add a blank line, exactly ----------, and a blank line. Follow with Key Features using ☆ bullets; Condition using ▪︎ bullets; Perfect For using ~ bullets; and a genuine 2-4 sentence closing paragraph that says why this particular item is useful, interesting, or worth preserving.

State exact test status first when functionality matters: tested working, partially tested, powers on only, untested, or not working. Never turn powers on into works. Describe visible flaws specifically and separate appearance from operation. Include this expectation-setting language in or immediately after Condition: We carefully describe each item as we see it and disclose the condition issues we observe. Even so, a very small scratch, scuff, or other minor detail may occasionally be overlooked. Please review all photos closely, as they are part of the description and may show details more clearly than words alone. Our reputation matters more to us than any single sale, and we would never knowingly misrepresent an item.

For original radio or television service manuals, finish with exactly: Many additional original radio and television service manuals are available. Please see my other listings; combined shipping is available when practical.

For electronics, recommend qualified inspection before regular use when appropriate. For books, manuals, maps, and ephemera, transcribe visible title, author, publisher, date, edition, and ownership marks carefully; never claim first edition without proof. For lots or incomplete objects, state the exact confirmed count and disclose uncertain completeness. Mention color variation, approximate measurements, or buyer questions only when relevant; do not add shipping, return, warranty, or legal boilerplate that could conflict with the listing's actual eBay policies.

Before responding, verify the title limit, identical opening title, divider, section order, bullet characters, exact test status, flaws, expectation-setting language, substantial opening and closing, and special manual note.`;
const schema={type:"object",additionalProperties:false,properties:{title:{type:"string"},description:{type:"string"},category:{type:"string"},maker:{type:"string"},model:{type:"string"}},required:["title","description","category","maker","model"]};
export async function POST(request: Request) {
  try {
    const key = (globalThis as any).process?.env?.OPENAI_API_KEY;
    if (!key) return Response.json({error:"Listing generation is not configured."},{status:503});
    const body = await request.json() as {name?:string;facts?:Record<string,string>;images?:string[]};
    if (!body.images?.length) return Response.json({error:"This item has no assigned photos."},{status:400});
    const facts=Object.entries(body.facts??{}).filter(([,v])=>v?.trim()).map(([k,v])=>`${k}: ${v}`).join("\n")||"No additional user-supplied facts.";
    const content:any[]=[{type:"input_text",text:`${GUIDE}\n\nITEM GROUP: ${body.name||"Unnamed item"}\nUSER FACTS:\n${facts}\n\nAnalyze every image below as evidence for this single item and produce the finished structured listing.`}];
    for(const image_url of body.images.slice(0,12))content.push({type:"input_image",image_url,detail:"high"});
    const result=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({model:"gpt-5.6-sol",input:[{role:"user",content}],reasoning:{effort:"medium"},text:{verbosity:"medium",format:{type:"json_schema",name:"ebay_listing",strict:true,schema}}})});
    const data:any=await result.json();
    if(!result.ok)return Response.json({error:data?.error?.message||"OpenAI could not generate this listing."},{status:result.status});
    const output=(data.output??[]).flatMap((item:any)=>item.content??[]).find((item:any)=>item.type==="output_text")?.text;
    if(!output)return Response.json({error:"The model returned no listing text."},{status:502});
    const listing=JSON.parse(output);
    if(!listing.title||listing.title.length>80||!listing.description)return Response.json({error:"The generated listing did not pass title and description validation. Please try again."},{status:502});
    const clean=(value:string)=>String(value||"").replace(/^```(?:text|json)?\s*|\s*```$/g,"").trim();
    const title=clean(listing.title);let description=clean(listing.description).replace(/^(?:BLOCK\s*\d+[^\n]*|TITLE(?:\s+ONLY)?[^\n]*)\n+/i,"");
    if(!description.startsWith(title))description=`${title}\n\n${description}`;
    return Response.json({title,description,facts:{category:clean(listing.category),maker:clean(listing.maker),model:clean(listing.model)}});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Unexpected listing error."},{status:500})}
}