"use client";
type Props={groups:any[];drafts:Record<number,string>;specifics:Record<number,any[]>;offers:Record<number,any>;errors:Record<number,string>};
export default function BatchCommandCenter({groups,drafts,specifics,offers,errors}:Props){
  const counts={waiting:0,review:0,ready:0,offered:0,live:0,failed:0};
  for(const group of groups){const id=group.id;if(errors[id])counts.failed++;else if(offers[id]?.listingId)counts.live++;else if(offers[id])counts.offered++;else if(!drafts[id])counts.waiting++;else if((specifics[id]??[]).some(item=>item.requiresConfirmation&&!item.confirmed))counts.review++;else counts.ready++}
  return <section className="batchcommand"><div><p>Batch command center</p><h2>{groups.length} items moving through one queue</h2></div><dl><span><dt>{counts.waiting}</dt><dd>Generating</dd></span><span className={counts.review?"attention":""}><dt>{counts.review}</dt><dd>Needs you</dd></span><span><dt>{counts.ready}</dt><dd>Ready</dd></span><span><dt>{counts.offered}</dt><dd>Unpublished</dd></span><span><dt>{counts.live}</dt><dd>Live</dd></span><span className={counts.failed?"danger":""}><dt>{counts.failed}</dt><dd>Retry</dd></span></dl></section>
}