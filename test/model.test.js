import test from "node:test";
import assert from "node:assert/strict";
import {levels,getLevel} from "../dist/src/levels.js";
import {createRun,advance,sealEcho,restartRun,removeEcho,plateStates,doorStates,hazardActive,evaluate,describe,echoPosition} from "../dist/src/model.js";
import {solve,route} from "../tools/witnesses.mjs";
const answers=new Map();
for(const level of levels)test("campaign "+level.id+" has actual legal multi-loop solution",()=>{
 const witness=solve(level.id);answers.set(level.id,witness);
 let state=createRun(level.id);
 for(let i=0;i<witness.legs.length;i++){
  for(const action of witness.legs[i]){state=advance(state,action).state;assert.notEqual(state.status,"failed");}
  if(i<witness.legs.length-1)state=sealEcho(state);
 }
 assert.equal(state.status,"won");assert(state.tick<=60);
 assert.equal(state.player.x,level.exit.x);assert.equal(state.player.y,level.exit.y);
 assert.deepEqual(state.collected,level.goals);
 // Winning predicates checked independently of evaluate().
 for(const door of level.doors){
  const plate=level.plates.find(p=>p.id===door.plate);
  const positions=[state.player,...state.echoes.map(e=>e.path[Math.min(state.tick,e.path.length-1)])];
  assert(positions.some(p=>p.x===plate.x&&p.y===plate.y));
  assert(state.charges[door.id]>=level.charge);
 }
 for(const hazard of level.hazards)if(hazardActive(hazard,state.tick))assert(!hazard.cells.some(([x,y])=>state.player.x===x&&state.player.y===y));
});
test("campaign structure and finite bounds",()=>{
 assert.equal(levels.length,12);assert.equal(levels.filter(l=>l.grade==="MASTER").length,6);
 for(const l of levels){assert(l.width<=20&&l.height<=12&&l.limit===60&&l.plates.length<=3);assert.equal(l.rows.length,l.height);assert(l.rows.every(r=>r.length===l.width));}
 assert.throws(()=>getLevel(0),RangeError);assert.throws(()=>createRun(999),RangeError);
});
test("wall and closed door cannot be walked through but consume a real beat",()=>{
 const state=createRun(1);const blocked=advance(state,"left");assert.equal(blocked.accepted,false);assert.equal(blocked.state.tick,1);assert.deepEqual(blocked.state.player,state.player);assert.equal(state.tick,0);
 let s=state;for(let i=0;i<4;i++)s=advance(s,"right").state;assert.equal(s.player.x,4);assert.equal(s.charges.A,0);assert.notEqual(s.status,"won");
});
test("pressure charge needs consecutive occupied beats and drops immediately on leaving",()=>{
 let s=createRun(2);const plate=getLevel(2).plates[0];const found=route(s,n=>n.player.x===plate.x&&n.player.y===plate.y);s=found.state;assert.equal(s.charges.A,1);
 s=advance(s,"wait").state;assert.equal(s.charges.A,2);s=advance(s,"down").state;assert.equal(s.charges.A,0);
});
test("echo replay is exact, holds last position and restart does not advance clock",()=>{
 let s=createRun(1);for(const action of ["right","right","up","up"])s=advance(s,action).state;
 const old=structuredClone(s);const replay=sealEcho(s);
 for(let tick=0;tick<10;tick++)assert.deepEqual(echoPosition(replay.echoes[0],tick),old.path[Math.min(tick,old.path.length-1)]);
 assert.equal(replay.tick,0);assert.deepEqual(restartRun(replay),replay);assert.equal(removeEcho(replay).echoes.length,0);
 assert.deepEqual(s,old);
});
test("invalid commands, echo count, trace and stopped-state boundaries",()=>{
 assert.throws(()=>advance(createRun(1),"__proto__"),TypeError);assert.throws(()=>createRun(1,[{path:[]}]),TypeError);
 let s=createRun(1);s=advance(s,"wait").state;s=sealEcho(s);
 s=advance(s,"wait").state;s=sealEcho(s);s=advance(s,"wait").state;s=sealEcho(s);s=advance(s,"wait").state;
 assert.throws(()=>sealEcho(s),RangeError);assert.throws(()=>createRun(1,[...s.echoes,s.echoes[0]]),RangeError);
});
test("no-record attempt cannot exit and exact 60-beat timeout is sealable",()=>{
 let s=createRun(1);for(let i=0;i<59;i++)s=advance(s,"wait").state;assert.equal(s.status,"playing");s=advance(s,"wait").state;
 assert.equal(s.status,"failed");assert.equal(s.failure,"timeout");assert.equal(sealEcho(s).echoes[0].path.length,61);
 const ended=advance(s,"right");assert.deepEqual(ended.state,s);assert.equal(ended.accepted,false);assert.equal(evaluate(s).score,0);
});
test("a live laser and wrong core order fail for real and cannot become an echo",()=>{
 const laserLevel=getLevel(5);let s=createRun(5);s.player={x:laserLevel.hazards[0].cells[0][0],y:laserLevel.hazards[0].cells[0][1]};
 s.tick=7;s=advance(s,"wait").state;assert.equal(s.failure,"laser");assert.throws(()=>sealEcho(s),RangeError);
 let wrong=createRun(4);wrong.player={...getLevel(4).cores[1]};wrong=advance(wrong,"wait").state;assert.equal(wrong.failure,"order");assert.equal(wrong.collected.length,0);
});
test("win score is finite, assisted is differentiated and describe contains real current state",()=>{
 const solved=solve(1).state,normal=evaluate(solved);assert.equal(normal.won,true);assert(normal.score>0);
 const assisted={...solved,hints:1};assert.equal(evaluate(assisted).score,normal.score-300);assert.equal(evaluate(assisted).grade,"ASSISTED");
 const view=describe(solved);assert.deepEqual(view.player,solved.player);assert.equal(view.tick,solved.tick);assert.equal(view.echoes.length,solved.echoes.length);assert(doorStates(solved).every(d=>d.open));assert(plateStates(solved).every(p=>p.occupied));
});
