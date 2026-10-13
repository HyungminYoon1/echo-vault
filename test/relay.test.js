import test from "node:test";
import assert from "node:assert/strict";
import {createRun,advance,sealEcho,doorStates,relayPlates,evaluate,echoSchedule} from "../dist/src/model.js";
import {getLevel} from "../dist/src/levels.js";
import {relayWitnesses,relayExitWitness,solve} from "../tools/witnesses.mjs";
const play=(state,actions)=>actions.reduce((s,a)=>advance(s,a).state,state);
const wait=n=>Array(n).fill("wait");
function team(id,legs=relayWitnesses(id)){
 let state=createRun(id);
 for(const leg of legs){state=play(state,leg);assert.equal(state.status,"playing");state=sealEcho(state);}
 return state;
}
test("recorded plate schedule exposes inclusive release/revisit and final hold without advancing",()=>{
 const state=team(13),before=structuredClone(state);
 assert.deepEqual(echoSchedule(state),[
  {slot:1,plate:"a",intervals:[[4,5],[13,60]]},
  {slot:1,plate:"b",intervals:[]},
  {slot:2,plate:"a",intervals:[]},
  {slot:2,plate:"b",intervals:[[8,60]]}
 ]);
 assert.deepEqual(state,before);
 assert.deepEqual(echoSchedule(play(state,["wait"])),echoSchedule(state));
 const latch=team(13,[relayWitnesses(13)[0].slice(0,5),relayWitnesses(13)[1]]);
 assert.deepEqual(echoSchedule(latch)[0].intervals,[[4,60]]);
});
test("playable onboarding needs an echo and finishes through ordinary commands",()=>{
 const witness=solve("intro");assert.equal(witness.state.status,"won");assert.equal(witness.state.tick,6);assert.equal(witness.result.score,2730);
 let alone=play(createRun("intro"),["up","up","down","right","right",...wait(55)]);
 assert.equal(alone.status,"failed");assert.equal(alone.failure,"timeout");assert.equal(doorStates(alone)[0].open,false);
});
for(const id of [13,14,15]){
 test("relay "+id+" witness independently meets each timed occupancy and exit predicate",()=>{
  let state=team(id);const level=getLevel(id),runs=level.phases.map(()=>0),completed=[];
  for(const command of relayExitWitness(id)){
   state=advance(state,command).state;assert.notEqual(state.status,"failed");
   const held=state.echoes.map(e=>e.path[Math.min(state.tick,e.path.length-1)]);
   const occupied=level.plates.filter(p=>held.some(e=>e.x===p.x&&e.y===p.y)).map(p=>p.id);
   const i=completed.length,p=level.phases[i];
   if(p){runs[i]=state.tick>=p.start&&state.tick<=p.end&&p.on.every(x=>occupied.includes(x))&&p.off.every(x=>!occupied.includes(x))?runs[i]+1:0;if(runs[i]>=p.hold)completed.push(state.tick);}
   assert.equal(state.phase,completed.length);
  }
  assert.equal(state.status,"won");assert.equal(completed.length,level.phases.length);
  assert(state.tick>=level.exitWindow[0]&&state.tick<=level.exitWindow[1]);assert.deepEqual(state.collected,level.goals);
  assert(doorStates(state).every(d=>d.open));assert.equal(evaluate(state).score,3000-state.tick*20-state.echoes.length*150);
 });
 test("relay "+id+" rejects permanent A latch, missing return, and late first signal",()=>{
  const original=relayWitnesses(id);
  for(const a of [original[0].slice(0,5),original[0].slice(0,-1),[...wait(4),...original[0]]]){
   const legs=[a,...original.slice(1)],state=play(team(id,legs),wait(35));
   assert.equal(state.status,"failed");assert.equal(state.failure,"timing");assert.throws(()=>sealEcho(state),RangeError);assert.equal(evaluate(state).score,0);
  }
 });
 test("relay "+id+" cannot be opened without the required echo team",()=>{
  const state=play(team(id,relayWitnesses(id).slice(0,-1)),wait(60));
  assert.equal(state.failure,"timeout");assert.equal(state.phase,0);assert(doorStates(state).every(d=>!d.open));
 });
}
test("current player cannot substitute for a relay echo",()=>{
 let s=team(13,[["wait"],relayWitnesses(13)[1]]);
 s=play(s,["up","up","right","right","wait"]);assert.equal(s.phase,0);assert(!relayPlates(s).includes("a"));
 s=play(s,wait(2));assert.equal(s.failure,"timing");
});
test("nonconsecutive holds and mistimed B release fail even with both plates visited",()=>{
 const legs=relayWitnesses(13);legs[0]=["up","up","right","right","down","up","down","up"];
 assert.equal(play(team(13,legs),wait(10)).failure,"timing");
 const permanentB=relayWitnesses(14);permanentB[1]=permanentB[1].slice(0,8);
 const s=play(team(14,permanentB),wait(30));assert.equal(s.failure,"timing");assert.equal(s.phase,3);
});
test("synchronized relay completion does not bypass core order, lasers or exit deadline",()=>{
 const late=play(team(13),wait(29));assert.equal(late.failure,"timing");assert.equal(late.phase,3);
 const wrong=play(team(14),[...Array(6).fill("right"),"down","down"]);assert.equal(wrong.failure,"order");
 const laser=play(team(15),Array(8).fill("right"));assert.equal(laser.failure,"laser");assert.equal(evaluate(laser).score,0);
 const noCore=play(team(14),[...Array(8).fill("right"),...wait(22),...Array(4).fill("right")]);assert.equal(noCore.status,"playing");assert.equal(noCore.collected.length,0);
 assert.equal(play(noCore,wait(7)).failure,"timing");
});
test("all relay phases can finish early but exit still requires the exact window",()=>{
 const early=play(team(13),[...Array(8).fill("right"),...wait(7),...Array(4).fill("right")]);
 assert.equal(early.tick,19);assert.equal(early.player.x,13);assert.equal(early.status,"playing");
 assert.equal(play(early,wait(3)).status,"won");
});
