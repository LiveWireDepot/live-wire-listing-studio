import {getD1} from "../../../../db";
import {requireOwner} from "../../../../lib/studio-persistence";

export const runtime="edge";

export async function GET(request:Request){try{
  const owner=requireOwner(request),rows=await getD1().prepare("SELECT event_type,details_json,created_at FROM studio_audit_events WHERE owner_email=? AND event_type IN ('generation_completed','generation_reused') ORDER BY created_at DESC LIMIT 500").bind(owner).all<any>();
  const summary={generated:0,reused:0,estimatedCostUsd:0,models:{} as Record<string,number>,recent:[] as any[]};
  for(const row of rows.results??[]){const details=JSON.parse(row.details_json),generation=details.generation??{};if(row.event_type==="generation_reused")summary.reused++;else{summary.generated++;summary.estimatedCostUsd+=Number(generation.estimatedCostUsd)||0;summary.models[String(generation.model||"unknown")]=(summary.models[String(generation.model||"unknown")]??0)+1}if(summary.recent.length<12)summary.recent.push({at:row.created_at,model:generation.model,mode:generation.mode,cacheHit:row.event_type==="generation_reused",estimatedCostUsd:Number(generation.estimatedCostUsd)||0,reason:generation.reason||generation.cacheReason||""})}
  return Response.json({...summary,estimatedCostUsd:Number(summary.estimatedCostUsd.toFixed(6))},{headers:{"cache-control":"no-store"}});
}catch(error){return Response.json({error:error instanceof Error?error.message:"Unable to read Cost Control history."},{status:400,headers:{"cache-control":"no-store"}})}}
