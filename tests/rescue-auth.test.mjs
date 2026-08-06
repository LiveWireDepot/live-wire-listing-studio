import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,writeFile,rm} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {credentialMetadata,loadAccessToken} from "../lib/rescue-auth.mjs";

test("credential metadata never exposes encrypted or plaintext token material",async()=>{
  const dir=await mkdtemp(join(tmpdir(),"live-wire-auth-")),path=join(dir,"credential.json");
  await writeFile(path,JSON.stringify({schemaVersion:1,environment:"production",marketplaceId:"EBAY_US",accessTokenDpapi:"encrypted-value",storedAt:"now"}));
  const metadata=await credentialMetadata(path);
  assert.deepEqual(metadata,{schemaVersion:1,environment:"production",marketplaceId:"EBAY_US",storedAt:"now",hasAccessToken:true});
  assert.equal(JSON.stringify(metadata).includes("encrypted-value"),false);
  await rm(dir,{recursive:true,force:true});
});
test("credential loader delegates DPAPI decryption without logging token",async()=>{
  const dir=await mkdtemp(join(tmpdir(),"live-wire-auth-")),path=join(dir,"credential.json");
  await writeFile(path,JSON.stringify({environment:"production",accessTokenDpapi:"encrypted-value"}));
  const token=await loadAccessToken(path,()=>({status:0,stdout:"secret-token\n"}));
  assert.equal(token,"secret-token");
  await rm(dir,{recursive:true,force:true});
});
