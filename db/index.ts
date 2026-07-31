import {env} from "cloudflare:workers";

export function getD1(){
  if(!env.DB)throw new Error("eBay connection storage is unavailable.");
  return env.DB;
}
