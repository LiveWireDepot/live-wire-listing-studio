import {appendFile,mkdir,readFile,rename,writeFile} from "node:fs/promises";
import {dirname,join} from "node:path";
import {redact} from "./rescue-redaction.mjs";
export async function atomicJson(path,value){await mkdir(dirname(path),{recursive:true});const temp=`${path}.${process.pid}.tmp`;await writeFile(temp,`${JSON.stringify(redact(value),null,2)}\n`);await rename(temp,path)}
export async function readJson(path){return JSON.parse(await readFile(path,"utf8"))}
export async function event(runDir,eventValue){await mkdir(runDir,{recursive:true});await appendFile(join(runDir,"events.jsonl"),`${JSON.stringify(redact({...eventValue,at:new Date().toISOString()}))}\n`)}
