export async function findInaccessibleImages(urls:string[],fetcher:typeof fetch=fetch){
  const inaccessible:string[]=[];
  for(const url of urls){
    try{
      const response=await fetcher(url,{method:"GET",headers:{Range:"bytes=0-0"}});
      if(!response.ok)inaccessible.push(url);
      await response.body?.cancel();
    }catch{inaccessible.push(url)}
  }
  return inaccessible;
}
