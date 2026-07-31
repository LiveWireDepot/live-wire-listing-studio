function page(title:string,message:string){return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | Live Wire Listing Studio</title><style>body{margin:0;background:#111814;color:#f4f0e8;font-family:Arial,sans-serif;min-height:100vh;display:grid;place-items:center}.card{width:min(560px,calc(100% - 48px));border:1px solid #657068;background:#18221d;padding:42px}.eyebrow{color:#c99158;font-size:12px;letter-spacing:.16em;text-transform:uppercase}h1{font-family:Georgia,serif;font-size:38px;margin:12px 0 18px}p{color:#cfd6d1;line-height:1.65}a{display:inline-block;margin-top:18px;background:#f4f0e8;color:#111814;padding:12px 17px;text-decoration:none;font-weight:700}</style></head><body><main class="card"><div class="eyebrow">Live Wire Listing Studio</div><h1>${title}</h1><p>${message}</p><a href="/">Return to the studio</a></main></body></html>`}

export async function GET(request:Request){
  const url=new URL(request.url);
  const received=Boolean(url.searchParams.get("code"));
  const html=received
    ? page("eBay authorization received","eBay returned your authorization successfully. The secure account connection will be completed after the application credentials are installed. You can safely return to the studio.")
    : page("eBay callback ready","This callback is ready for eBay OAuth. Start the connection from Live Wire Listing Studio rather than opening this address directly.");
  return new Response(html,{status:200,headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store"}});
}
