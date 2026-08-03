"use client";

type Props={
  stage:string;
  detail:string;
  actionLabel?:string;
  blockers?:string[];
  busy?:boolean;
  live?:boolean;
  onAction?:()=>void;
};

export default function NextEbayAction({stage,detail,actionLabel,blockers=[],busy=false,live=false,onAction}:Props){
  return <section className={`next-ebay-action ${live?"is-live":""}`} aria-label="Next eBay action">
    <div>
      <span>Next eBay action</span>
      <strong>{stage}</strong>
      <p>{detail}</p>
      {blockers.length>0&&<ul>{blockers.slice(0,4).map(item=><li key={item}>{item}</li>)}</ul>}
      <small>Accept Best Offers is a listing preference. It does not publish the item.</small>
    </div>
    {actionLabel&&onAction&&<button type="button" onClick={onAction} disabled={busy}>{busy?"Working...":actionLabel}</button>}
  </section>
}
