"use client";
import {useEffect,useState} from "react";
type Props={groups:any[];drafts:Record<number,string>;specifics:Record<number,any[]>;offers:Record<number,any>;errors:Record<number,string>};
type CostSummary={generated:number;reused:number;estimatedCostUsd:number;models:Record<string,number>};
export default function BatchCommandCenter({groups,drafts,specifics,offers,errors}:Props){
  const[summary,setSummary]=useState<CostSummary|null>(null);useEffect(()=>{fetch("/api/studio/cost-summary",{cache:"no-store"}).then(response=>response.ok?response.json():null).then(result=>result&&setSummary(result)).catch(()=>{})},[]);
  const counts={waiting:0,review:0,ready:0,offered:0,live:0,failed:0};
  for(const group of groups){const id=group.id;if(offers[id]?.listingId)counts.live++;else if(errors[id])counts.failed++;else if(offers[id])counts.offered++;else if(!drafts[id])counts.waiting++;else if((specifics[id]??[]).some(item=>item.requiresConfirmation&&!item.confirmed))counts.review++;else counts.ready++}
  return <section className="batchcommand"><div><p>Batch command center</p><h2>{groups.length} items moving through one queue</h2></div><dl><span><dt>{counts.waiting}</dt><dd>Generating</dd></span><span className={counts.review?"attention":""}><dt>{counts.review}</dt><dd>Needs you</dd></span><span><dt>{counts.ready}</dt><dd>Content ready</dd></span><span><dt>{counts.offered}</dt><dd>Unpublished</dd></span><span><dt>{counts.live}</dt><dd>Live</dd></span><span className={counts.failed?"danger":""}><dt>{counts.failed}</dt><dd>Retry</dd></span></dl>{summary&&<aside className="costcontrol"><b>Cost control</b><span>{summary.generated} generated · {summary.reused} saved-result reuses · ${summary.estimatedCostUsd.toFixed(3)} estimated model cost</span><small>{Object.entries(summary.models).map(([model,count])=>`${count} ${model.replace("gpt-5.6-","")}`).join(" · ")||"No model calls yet"}</small></aside>}</section>
}
