import {readFile} from "node:fs/promises";
import {spawnSync} from "node:child_process";
import {join} from "node:path";

export function defaultCredentialPath(environment=process.env){
  const base=environment.LOCALAPPDATA;
  if(!base)throw new Error("LOCALAPPDATA is unavailable; provide --credentials=<path>.");
  return join(base,"LiveWire","rescue-credentials.json");
}

export async function credentialMetadata(path=defaultCredentialPath()){
  const data=JSON.parse(await readFile(path,"utf8"));
  return{schemaVersion:data.schemaVersion,environment:data.environment,marketplaceId:data.marketplaceId,storedAt:data.storedAt,hasAccessToken:Boolean(data.accessTokenDpapi)};
}

export async function loadAccessToken(path=defaultCredentialPath(),run=spawnSync){
  const data=JSON.parse(await readFile(path,"utf8"));
  if(data.environment!=="production"||!data.accessTokenDpapi)throw new Error("The local eBay Production credential is missing or invalid.");
  const script="$d=Get-Content -Raw -LiteralPath $env:LIVEWIRE_CREDENTIAL_PATH|ConvertFrom-Json;$s=ConvertTo-SecureString $d.accessTokenDpapi;$b=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($s);try{[Runtime.InteropServices.Marshal]::PtrToStringBSTR($b)}finally{[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b)}";
  const result=run("powershell.exe",["-NoProfile","-NonInteractive","-Command",script],{encoding:"utf8",windowsHide:true,maxBuffer:1024*1024,env:{...process.env,LIVEWIRE_CREDENTIAL_PATH:path}});
  if(result.status!==0||!String(result.stdout||"").trim())throw new Error("Windows could not decrypt the local eBay credential for this user.");
  return String(result.stdout).trim();
}
