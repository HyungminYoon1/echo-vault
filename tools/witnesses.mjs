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
   const key=[next.player.x,next.player.y,next.tick,next.phase,next.phaseHold,next.collected.join(""),Object.values(next.charges).join(",")].join("|");
   if(seen.has(key))continue;seen.add(key);queue.push({state:next,commands:[...current.commands,command]});
  }
 }
 throw new Error("No bounded witness for level "+state.levelId+" after "+index+" states");
}
export function solve(id){
 const level=getLevel(id),legs=[];let state=createRun(id);
 if(level.phases){
  for(const commands of relayWitnesses(id)){
   for(const command of commands){state=advance(state,command).state;if(state.status!=="playing")throw new Error("Illegal relay witness");}
   legs.push(commands);state=sealEcho(state);
  }
 }else for(const plate of level.plates){
  const found=route(state,s=>s.player.x===plate.x&&s.player.y===plate.y&&s.status==="playing");
  legs.push(found.commands);state=sealEcho(found.state);
 }
 const commands=relayExitWitness(id);
 const exit=commands?{commands,state:commands.reduce((s,a)=>advance(s,a).state,state)}:route(state,s=>s.status==="won");legs.push(exit.commands);
 if(exit.state.status!=="won")throw new Error("Witness did not win: "+id);
 const result=evaluate(exit.state);
 return {level:id,legs,result,state:exit.state};
}
const wait=n=>Array(n).fill("wait");
export function relayWitnesses(id){
 const a=["up","up","right","right","wait","down",...wait(id===15?11:6),"up"];
 const b=[...wait(4),"down","down","right","right"];
 if(id===14)b.push(...wait(9),"up",...wait(5),"down");
 if(id===15)b.push("wait","wait","up",...wait(14),"down");
 return id===15?[a,b,[...wait(6),...Array(6).fill("right")]]:[a,b];
}
export function relayExitWitness(id){
 if(id===13)return [...Array(8).fill("right"),...wait(10),...Array(4).fill("right")];
 if(id===14||id===15)return [...Array(6).fill("right"),"up","up",...Array(4).fill("down"),"up","up",...Array(id===14?2:1).fill("right"),...wait(id===14?14:19),...Array(id===14?4:5).fill("right")];
 return null;
}
