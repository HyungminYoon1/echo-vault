import { readdir,readFile } from "node:fs/promises";
import { dirname,resolve,sep,extname } from "node:path";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
const root=resolve("dist"),decoder=new TextDecoder("utf-8",{fatal:true});
let files=0;
async function walk(dir){
 for(const entry of await readdir(dir,{withFileTypes:true})){
  const file=resolve(dir,entry.name);assert(!entry.isSymbolicLink(),"No public symlinks");
  if(entry.isDirectory()){await walk(file);continue;}files++;
  assert(!/^(?:\.env|credentials|secrets)(?:\.|$)/i.test(entry.name),"Private file in dist");
  if(![".js",".mjs",".html",".css",".svg",".json"].includes(extname(file)))continue;
  const bytes=await readFile(file),source=decoder.decode(bytes);
  assert(!(bytes[0]===239&&bytes[1]===187&&bytes[2]===191),"UTF8 BOM");
  assert(!/(?<!\r)\n|\r(?!\n)/.test(source),"Use CRLF");
  assert(!/(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,}|AKIA[A-Z0-9]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/.test(source),"Credential pattern detected; suppressed");
  if(extname(file)===".js"||extname(file)===".mjs"){
   execFileSync(process.execPath,["--check",file],{stdio:"inherit"});
   assert(!/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bEventSource\b|\bsendBeacon\b|\bindexedDB\b|\bsessionStorage\b|document\.cookie|\beval\s*\(|new\s+Function\b/.test(source),"No runtime network/other persistence/eval");
   if(file!==resolve(root,"src/storage.js"))assert(!/\blocalStorage\b/.test(source),"Storage only in approved adapter (D05)");
   if(!["storage.js","progress.js"].some(name=>file===resolve(root,"src",name)))assert(!/\.(?:getItem|setItem|removeItem|clear)\s*\(/.test(source),"Storage access only in approved boundaries (D05/D06)");
   if(/(?:model|levels|rules|save)\.(?:m?js)$/.test(file))assert(!/\b(document|window|globalThis|AudioContext|requestAnimationFrame|performance|Date)\b/.test(source),"Pure model/codec boundary");
   for(const [,ref] of source.matchAll(/(?:from\s*|import\s*)["'](\.[^"']+)["']/g)){const target=resolve(dirname(file),ref);assert(target.startsWith(root+sep));await readFile(target);}
  }
  if(extname(file)!==".html")continue;
  assert(source.includes('lang="ko"')&&source.includes('name="viewport"'),"Metadata");
  assert(source.includes("connect-src 'none'")&&source.includes("frame-src 'none'"),"CSP");
  assert(!/\son\w+\s*=|<iframe\b/i.test(source),"No inline handlers/embeds");
  for(const [,ref] of source.matchAll(/(?:src|href)="([^"#]+)"/g)){
   if(/^(?:https?:|data:)/.test(ref))continue;
   const target=resolve(dirname(file),ref.endsWith("/")?ref+"index.html":ref);assert(target.startsWith(root+sep));await readFile(target);
  }
 }
}
await walk(root);
const adapter=await readFile(resolve(root,"src/storage.js"),"utf8"),progress=await readFile(resolve(root,"src/progress.js"),"utf8");
assert(adapter.includes('SAVE_KEY="echo-vault-save-v1"')&&progress.includes('PROGRESS_KEY="web-lab-progress-v1"'),"Only documented storage keys");
assert(!/\.clear\s*\(/.test(adapter+progress),"Never clear another app's storage");
const html=await readFile(resolve(root,"index.html"),"utf8"),app=await readFile(resolve(root,"src/app.js"),"utf8");
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,"Unique DOM ids");
for(const [,id] of app.matchAll(/(?:\$|\btext)\("([^"]+)"/g))assert(ids.includes(id),"DOM binding exists: "+id);
console.log("PASS: "+files+" public files; syntax, module/assets, privacy, pure model, CSP, UTF8/no-BOM/CRLF");
