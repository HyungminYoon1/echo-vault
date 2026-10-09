import test from "node:test";
import assert from "node:assert/strict";
import {createRun,advance,sealEcho,evaluate} from "../dist/src/model.js";
import {decodeSave,encodeSave,packRun,restoreRun,recordWin,completedCount,MAX_SAVE_CHARS} from "../dist/src/save.js";
import {SAVE_KEY,loadSave,writeSave,clearSave} from "../dist/src/storage.js";
import {APP_IDS,PROGRESS_KEY,readProgress,reportProgress,clearProgress} from "../dist/src/progress.js";
import {solve} from "../tools/witnesses.mjs";
const play=(s,actions)=>actions.reduce((s,a)=>advance(s,a).state,s);
function memory(){const values=new Map();return {values,getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};}
const won=solve(13).state;
test("run persistence reconstructs exact echoes, charges, timing, hints and current commands",()=>{
 let state=sealEcho(play(createRun(1),["right","right","up","up"]));state=play(state,["right","wait","up"]);state.hints=1;
 const records=recordWin(new Map(),won),text=encodeSave(state,records),restored=decodeSave(text);
 assert.deepEqual(restored.state,state);assert.deepEqual(restored.records,records);
 assert.deepEqual(advance(restored.state,"wait"),advance(state,"wait"));
 const raw=JSON.parse(text);assert(!("player" in raw.current));assert(!("score" in raw.records[0]));assert.deepEqual(raw.current.echoes,[state.echoes[0].actions]);
});
test("mid-relay and failed or won states resume exactly via legal replay",()=>{
 const packed=packRun(won);packed.actions=packed.actions.slice(0,9);const mid=restoreRun(packed);
 assert.equal(mid.phase,2);assert.deepEqual(decodeSave(encodeSave(mid,new Map())).state,mid);
 const failed=play(createRun(13),Array(60).fill("wait"));assert.deepEqual(restoreRun(packRun(failed)),failed);
 assert.deepEqual(restoreRun(packRun(won)),won);
});
test("only independent actual campaign wins create aggregate completion; tutorial, view and hints do not",()=>{
 assert.equal(recordWin(new Map(),createRun(13)).size,0);
 assert.equal(recordWin(new Map(),solve("intro").state).size,0);
 let records=recordWin(new Map(),{...won,hints:1});assert.equal(records.size,1);assert.equal(completedCount(records),0);
 records=recordWin(records,won);assert.equal(completedCount(records),1);assert.equal(evaluate(records.get(13).best).score,2260);
 records=recordWin(records,{...won,hints:1});assert.equal(completedCount(records),1);assert.equal(evaluate(records.get(13).best).score,2260);
 assert.equal(completedCount(decodeSave(encodeSave(won,records)).records),1);
});
test("malformed, oversize, unknown save or campaign versions fail closed",()=>{
 for(const input of [null,"",'{',"null","[]"," ".repeat(MAX_SAVE_CHARS+1)])assert.throws(()=>decodeSave(input));
 const data=JSON.parse(encodeSave(createRun(1),new Map()));
 for(const patch of [{version:999},{campaign:999},{secret:"extra"},{records:Array(16).fill({})}])assert.throws(()=>decodeSave(JSON.stringify({...data,...patch})));
});
test("save rejects forged results, illegal echoes, injected coordinates and commands past terminal state",()=>{
 const valid=packRun(won);
 for(const patch of [{status:"won"},{player:{x:13,y:4}},{score:99999},{hints:-1},{hints:2},{levelId:"constructor"},{echoes:[[],[],[],[]]},{actions:Array(61).fill("wait")},{actions:["__proto__"]},{echoes:[[]]},{actions:[...valid.actions,"wait"]}])assert.throws(()=>restoreRun({...valid,...patch}));
 // The B core is reached first by legal commands: this failed recording cannot become an echo.
 assert.throws(()=>restoreRun({levelId:14,echoes:[[...Array(6).fill("right"),"down","down"]],actions:[],hints:0}));
 const data=JSON.parse(encodeSave(won,recordWin(new Map(),won)));
 data.records[0].best.actions=[];assert.throws(()=>decodeSave(JSON.stringify(data)));
});
test("save rejects duplicate, mismatched and assisted independent achievement proofs",()=>{
 const data=JSON.parse(encodeSave(won,recordWin(new Map(),won)));
 const duplicate=structuredClone(data);duplicate.records.push(duplicate.records[0]);assert.throws(()=>decodeSave(JSON.stringify(duplicate)));
 const assisted=structuredClone(data);assisted.records[0].independent.hints=1;assert.throws(()=>decodeSave(JSON.stringify(assisted)));
 const mismatch=structuredClone(data);mismatch.records[0].independent=packRun(solve(14).state);assert.throws(()=>decodeSave(JSON.stringify(mismatch)));
});
test("private adapter handles missing, corrupt and denied storage without clearing other keys",()=>{
 const storage=memory();storage.setItem("other-app","preserve");
 assert.equal(loadSave(storage).status,"empty");assert(writeSave(storage,won,new Map()));assert.equal(loadSave(storage).status,"saved");
 storage.setItem(SAVE_KEY,"bad");assert.equal(loadSave(storage).status,"invalid");assert.equal(storage.getItem(SAVE_KEY),"bad");
 assert(clearSave(storage));assert.equal(storage.getItem("other-app"),"preserve");assert.equal(loadSave(storage).status,"empty");
 const denied={getItem(){throw Error();},setItem(){throw Error();},removeItem(){throw Error();}};
 assert.equal(loadSave(null).status,"unavailable");assert.equal(loadSave(denied).status,"invalid");assert.equal(writeSave(denied,won,new Map()),false);assert.equal(clearSave(denied),false);
});
const date="2026-10-09T06:00:00.000Z";
test("gallery summary stores exact minimal allowlisted shape, real counts and bounded timestamp",()=>{
 assert.equal(APP_IDS.length,15);assert.equal(new Set(APP_IDS).size,15);
 const storage=memory(),other={completed:2,total:4,updatedAt:date};storage.setItem(PROGRESS_KEY,JSON.stringify({version:1,apps:{"parcel-panic":other}}));
 assert(reportProgress(storage,completedCount(recordWin(new Map(),won)),15,()=>date));
 assert.deepEqual(readProgress(storage.getItem(PROGRESS_KEY)),{version:1,apps:{"parcel-panic":other,"echo-vault":{completed:1,total:15,updatedAt:date}}});
 const original=storage.getItem(PROGRESS_KEY);assert(reportProgress(storage,1,15,()=>{throw Error("No timestamp refresh for unchanged counts");}));assert.equal(storage.getItem(PROGRESS_KEY),original);
 assert(clearProgress(storage));assert.deepEqual(readProgress(storage.getItem(PROGRESS_KEY)),{version:1,apps:{"parcel-panic":other}});
});
test("summary rejects unknown apps, excess or private fields, invalid numbers/dates and oversized payloads",()=>{
 const storage=memory();
 for(const [completed,total] of [[-1,15],[16,15],[1.5,15],[1,1001],[NaN,15]])assert.equal(reportProgress(storage,completed,total,()=>date),false);
 assert.equal(reportProgress(storage,1,15,()=>"2026-02-30T00:00:00.000Z"),false);
 for(const data of [{version:2,apps:{}},{version:1,apps:{unknown:{completed:1,total:15,updatedAt:date}}},{version:1,apps:{"echo-vault":{completed:1,total:15,updatedAt:date,actions:[]}}},{version:1,apps:{},name:"private"}])assert.throws(()=>readProgress(JSON.stringify(data)));
 assert.throws(()=>readProgress(" ".repeat(8193)));
 storage.setItem(PROGRESS_KEY,"broken");assert.equal(reportProgress(storage,1,15,()=>date),false);assert.equal(clearProgress(storage),false);assert.equal(storage.getItem(PROGRESS_KEY),"broken");
 const denied={getItem(){throw Error();}};assert.equal(reportProgress(denied,1,15),false);assert.equal(clearProgress(denied),false);
});
test("aggregate is reconstructible only after durable independent proof saves successfully",()=>{
 const storage=memory(),records=recordWin(new Map(),won);
 assert(writeSave(storage,won,records));const restored=loadSave(storage);
 assert(reportProgress(storage,completedCount(restored.records),15,()=>date));assert.equal(readProgress(storage.getItem(PROGRESS_KEY)).apps["echo-vault"].completed,1);
 assert(clearSave(storage));assert(clearProgress(storage));assert.equal(storage.getItem(SAVE_KEY),null);assert.deepEqual(readProgress(storage.getItem(PROGRESS_KEY)).apps,{});
});
