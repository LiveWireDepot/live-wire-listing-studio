import test from "node:test";
import assert from "node:assert/strict";
import {cp,mkdir,readFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {spawnSync} from "node:child_process";

const root=new URL("..",import.meta.url).pathname.replace(/^\/(.:)/,"$1"),script=join(root,"scripts","live-wire-rescue.mjs"),fixture=join(root,"tests","fixtures");
async function setup(t){const run=await t.testRunDirectory?.()||join(tmpdir(),`live-wire-rescue-${Date.now()}-${Math.random().toString(16).slice(2)}`);await mkdir(join(run,"source"),{recursive:true});await cp(join(fixture,"rescue-items.json"),join(run,"source","items.json"));return run}
function command(name,run,...args){return spawnSync(process.execPath,[script,name,`--run=${run}`,...args],{encoding:"utf8"})}

test("CLI audit prepare and verify are resumable and non-publishing",async t=>{const run=await setup(t),remote=join(fixture,"rescue-remote.json");for(const [name,args] of [["audit",[`--remote=${remote}`]],["prepare",[]],["verify",[`--remote=${remote}`]]]){const result=command(name,run,...args);assert.equal(result.status,0,result.stderr)}assert.match(await readFile(join(run,"reports","audit.tsv"),"utf8"),/RECOVERABLE/);assert.match(await readFile(join(run,"reports","needs-input.md"),"utf8"),/LW-FIXTURE-2/);assert.match(await readFile(join(run,"reports","verification.tsv"),"utf8"),/DRY_RUN/)});
test("publication commands fail closed without approval and adapter",async t=>{const run=await setup(t);const noApproval=command("publish-canary",run,"--execute=true");assert.notEqual(noApproval.status,0);assert.match(noApproval.stderr,/approved canary manifest hash/);const noAdapter=command("publish-canary",run,"--execute=true","--approval=abc");assert.notEqual(noAdapter.status,0);assert.match(noAdapter.stderr,/intentionally unavailable/);const resume=command("resume",run);assert.notEqual(resume.status,0);assert.match(resume.stderr,/locked/)});
