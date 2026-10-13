import test from "node:test";
import assert from "node:assert/strict";
import {createRun,advance,sealEcho,evaluate} from "../dist/src/model.js";
import {packRun,restoreRun,encodeSave,decodeSave,recordWin,MAX_SAVE_CHARS} from "../dist/src/save.js";
import {writeSave,loadSave,SAVE_KEY} from "../dist/src/storage.js";
import {solve} from "../tools/witnesses.mjs";

test("edge: imported command primitives and nonfinite hints reject atomically",()=>{
 const state=createRun(1),raw=encodeSave(state,new Map());
 for(const action of [null,0,true,{},["up"],"", "constructor"])assert.throws(()=>restoreRun({...packRun(state),actions:[action]}));
 for(const hints of [NaN,Infinity,-Infinity,"0",null,1.5])assert.throws(()=>restoreRun({...packRun(state),hints}));
 assert.equal(encodeSave(state,new Map()),raw);
});
test("edge: save text exact ceiling accepts whitespace; one beyond rejects",()=>{
 const raw=encodeSave(createRun(1),new Map()),at=raw+" ".repeat(MAX_SAVE_CHARS-raw.length);
 assert.equal(at.length,MAX_SAVE_CHARS);assert.equal(decodeSave(at).state.tick,0);
 assert.throws(()=>decodeSave(at+" "));
});
test("edge: sealed echo and restored paths are detached across repeated loops",()=>{
 let s=advance(createRun(1),"up").state;
 const sealed=sealEcho(s),before=structuredClone(sealed);
 s.path[1].x=999;s.actions[0]="right";
 assert.deepEqual(sealed,before);
 const restored=restoreRun(packRun(sealed));restored.echoes[0].path[1].x=999;
 assert.deepEqual(sealed,before);
});
test("edge: late commands after win or timeout preserve all state and score",()=>{
 let timeout=createRun(1);for(let i=0;i<60;i++)timeout=advance(timeout,"wait").state;
 for(const initial of [timeout,solve(1).state]){
  const frozen=structuredClone(initial),score=evaluate(initial).score;
  for(const command of ["up","right","down","left","wait",...Array(20).fill("wait")]){
   const out=advance(initial,command);assert.equal(out.accepted,false);assert.deepEqual(out.state,frozen);assert.equal(evaluate(out.state).score,score);
  }
 }
});
test("edge: corrupt or oversized private load preserves raw bytes and other app",()=>{
 for(const raw of ["{", " ".repeat(MAX_SAVE_CHARS+1)]){
  const values=new Map([[SAVE_KEY,raw],["neon-tactics-save-v2","keep"]]);
  const storage={getItem:k=>values.get(k)??null};
  assert.equal(loadSave(storage).status,"invalid");assert.equal(values.get(SAVE_KEY),raw);assert.equal(values.get("neon-tactics-save-v2"),"keep");
 }
});
test("edge: private write must confirm readback before claiming durability",()=>{
 const state=solve(1).state,records=recordWin(new Map(),state),before=structuredClone(records);
 for(const getItem of [()=>null,()=>"older",()=>{throw Error("read denied");}]){
  const storage={setItem(){},getItem};
  assert.equal(writeSave(storage,state,records),false,"unconfirmed private write must fail");
 }
 assert.deepEqual(records,before);
 const values=new Map(),storage={setItem:(k,v)=>values.set(k,v),getItem:k=>values.get(k)??null};
 assert.equal(writeSave(storage,state,records),true);assert.deepEqual(loadSave(storage).records,records);
});
