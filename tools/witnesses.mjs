import {getLevel} from "../dist/src/levels.js";
import {createRun,advance,sealEcho,evaluate} from "../dist/src/model.js";
// Bounded time-expanded search supplies explicit movement witnesses for tests/QA,
// never imported by the app and never used to award a fictitious result.
export function route(state,goal,maxNodes=45000){
 const queue=[{state,commands:[]}],seen=new Set();let index=0;
 while(index<queue.length&&index<maxNodes){
  const current=queue[index++],s=current.state;
  if(goal(s))return current;
  if(s.status!=="playing")continue;
  for(const command of ["right","down","up","left","wait"]){
   const next=advance(s,command).state;
   if(next.status==="failed")continue;
   const key=[next.player.x,next.player.y,next.tick,next.collected.join(""),Object.values(next.charges).join(",")].join("|");
   if(seen.has(key))continue;seen.add(key);queue.push({state:next,commands:[...current.commands,command]});
  }
 }
 throw new Error("No bounded witness for level "+state.levelId+" after "+index+" states");
}
export function solve(id){
 const level=getLevel(id),legs=[];let state=createRun(id);
 for(const plate of level.plates){
  const found=route(state,s=>s.player.x===plate.x&&s.player.y===plate.y&&s.status==="playing");
  legs.push(found.commands);state=sealEcho(found.state);
 }
 const exit=route(state,s=>s.status==="won");legs.push(exit.commands);
 const result=evaluate(exit.state);
 return {level:id,legs,result,state:exit.state};
}
