export const runtime = "edge";
const GUIDE = `You are writing an eBay listing for Mark Beebe''s store, Live Wire Antiques. Treat every rule below as authoritative.
Inspect every supplied image and user fact. Never invent maker, model, date, material, function, completeness, test result, authenticity, rarity, restoration, or provenance. User facts outrank visible evidence; visible labels outrank careful inference. Label uncertainty as likely, appears to be, or possibly. If a missing fact materially changes identification, condition, or value, state what must be confirmed; otherwise disclose uncertainty and finish.
Voice: knowledgeable, collector-aware, warm, straightforward, historically literate, and specific. No inflated claims or generic AI filler.
Return ONE best finished listing in exactly two labeled copy blocks.
BLOCK 1 — TITLE ONLY: One SEO title, maximum 80 characters including spaces. Front-load supported maker/model, item type, era/date, and useful buyer search terms.
BLOCK 2 — TITLE + COMPLETE BODY: Repeat the identical title, then a 2–4 sentence opening; a blank line; exactly ----------; a blank line; Key Features with ☆ bullets; Condition with ▪︎ bullets; Perfect For with ~ bullets; and a genuine closing paragraph.
There is no blank line between a heading and its first bullet; use one blank line between bullets. State exact test status first when functionality matters: tested working, partially tested, powers on only, untested, or not working. Never turn powers on into works. Describe visible flaws specifically, separate appearance from operation, and include: Please review all photos closely, as they are part of the description.
For original radio or television service manuals, finish with exactly: Many additional original radio and television service manuals are available. Please see my other listings; combined shipping is available when practical.
For electronics, recommend qualified inspection before regular use when appropriate. For books, manuals, maps, and ephemera, transcribe visible title, author, publisher, date, edition, and ownership marks carefully; never claim first edition without proof. For lots or incomplete objects, state exact confirmed count and disclose uncertain completeness.
Do not include pricing, comps, citations, analysis, confidence notes, alternate titles, or drafting commentary inside either block. Before responding, verify the title limit, divider, section order, bullet characters, identical titles, test status, flaws, photo-reference sentence, closing, and special manual note.`;
export async function POST(request: Request) {
  try {
    const key = (globalThis as any).process?.env?.OPENAI_API_KEY;
    if (!key) return Response.json({error:"Listing generation is not configured."},{status:503});
    const body = await request.json() as {name?:string;facts?:Record<string,string>;images?:string[]};
    if (!body.images?.length) return Response.json({error:"This item has no assigned photos."},{status:400});
    const facts=Object.entries(body.facts??{}).filter(([,v])=>v?.trim()).map(([k,v])=>`${k}: ${v}`).join("\n")||"No additional user-supplied facts.";
    const content:any[]=[{type:"input_text",text:`${GUIDE}\n\nITEM GROUP: ${body.name||"Unnamed item"}\nUSER FACTS:\n${facts}\n\nAnalyze every image below as evidence for this single item and produce the finished listing.`}];
    for(const image_url of body.images.slice(0,12))content.push({type:"input_image",image_url,detail:"high"});
    const result=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({model:"gpt-5.6-luna",input:[{role:"user",content}],reasoning:{effort:"medium"},text:{verbosity:"medium"}})});
    const data:any=await result.json();
    if(!result.ok)return Response.json({error:data?.error?.message||"OpenAI could not generate this listing."},{status:result.status});
    const text=(data.output??[]).flatMap((item:any)=>item.content??[]).filter((item:any)=>item.type==="output_text").map((item:any)=>item.text).join("\n");
    if(!text)return Response.json({error:"The model returned no listing text."},{status:502});
    return Response.json({text});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Unexpected listing error."},{status:500})}
}
