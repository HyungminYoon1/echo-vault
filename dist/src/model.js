import {getLevel} from "./levels.js";
export const TICK_SECONDS=.25,MAX_ECHOES=3,UNDO_LIMIT=64;
export const directions=Object.freeze({up:[0,-1],right:[1,0],down:[0,1],left:[-1,0],wait:[0,0]});
const copy=value=>structuredClone(value);
const same=(a,b)=>a.x===b.x&&a.y===b.y;
export function hazardActive(hazard,tick){return ((tick+hazard.offset)%hazard.period)<hazard.on;}
export function activeHazards(level,tick){return level.hazards.filter(h=>hazardActive(h,tick)).flatMap(h=>h.cells.map(([x,y])=>({x,y})));}
export function echoPosition(echo,tick){return echo.path[Math.min(tick,echo.path.length-1)];}
export function createRun(id=1,echoes=[]){
 const level=getLevel(id);
 if(!Array.isArray(echoes)||echoes.length>MAX_ECHOES)throw new RangeError("Echo limit");
 for(const echo of echoes)if(!Array.isArray(echo.path)||echo.path.length<2||echo.path.length>level.limit+1||!same(echo.path[0],level.start)||echo.path.some(p=>!Number.isInteger(p.x)||!Number.isInteger(p.y)||p.x<0||p.x>=level.width||p.y<0||p.y>=level.height))throw new TypeError("Invalid echo");
 return {version:2,levelId:id,tick:0,player:{...level.start},echoes:copy(echoes),path:[{...level.start}],actions:[],charges:Object.fromEntries(level.doors.map(d=>[d.id,0])),collected:[],phase:0,phaseHold:0,status:"playing",reason:"",failure:null,hints:0};
}
export function actors(state){return [state.player,...state.echoes.map(e=>echoPosition(e,state.tick))];}
export function plateStates(state){return getLevel(state.levelId).plates.map(p=>({...p,occupied:actors(state).some(actor=>same(actor,p))}));}
export function doorStates(state){const level=getLevel(state.levelId);return level.doors.map(d=>({...d,charge:state.charges[d.id]??0,open:(state.charges[d.id]??0)>=level.charge&&(!level.phases||state.phase===level.phases.length)}));}
export function relayPlates(state){
 const level=getLevel(state.levelId);
 return level.plates.filter(p=>state.echoes.some(e=>same(echoPosition(e,state.tick),p))).map(p=>p.id);
}
// Inclusive occupied beats of each actual recording, including its final hold.
export function echoSchedule(state){
 const level=getLevel(state.levelId),result=[];
 for(const [i,echo] of state.echoes.entries())for(const plate of level.plates){
  const intervals=[];let start=null;
  for(let tick=0;tick<=level.limit;tick++){
   const held=same(echoPosition(echo,tick),plate);
   if(held&&start===null)start=tick;
   if(start!==null&&(!held||tick===level.limit)){intervals.push([start,held?tick:tick-1]);start=null;}
  }
  result.push({slot:i+1,plate:plate.id,intervals});
 }
 return result;
}
function advanceRelay(next,level){
 if(!level.phases||next.echoes.length<level.requiredEchoes)return;
 const phase=level.phases[next.phase],occupied=relayPlates(next);
 if(phase){
  const inWindow=next.tick>=phase.start&&next.tick<=phase.end;
  const matches=phase.on.every(id=>occupied.includes(id))&&phase.off.every(id=>!occupied.includes(id));
  next.phaseHold=inWindow&&matches?next.phaseHold+1:0;
  if(next.phaseHold>=phase.hold){next.phase++;next.phaseHold=0;}
  else if(next.tick>=phase.end){next.status="failed";next.failure="timing";next.reason="회로 "+(next.phase+1)+"의 동기화 시간을 놓쳤습니다.";}
 }
 if(next.status==="playing"&&next.tick>level.exitWindow[1]){next.status="failed";next.failure="timing";next.reason="출구 시간이 지났습니다.";}
}
export function canEnter(state,position){
 const level=getLevel(state.levelId);
 if(position.x<0||position.y<0||position.x>=level.width||position.y>=level.height||level.rows[position.y][position.x]==="#")return false;
 const door=doorStates(state).find(d=>same(d,position));return !door||door.open;
}
export function advance(state,command){
 if(!Object.hasOwn(directions,command))throw new TypeError("Invalid command");
 if(state.status!=="playing")return {state:copy(state),accepted:false,event:"ended"};
 const next=copy(state),level=getLevel(state.levelId),[dx,dy]=directions[command];
 const target={x:state.player.x+dx,y:state.player.y+dy},allowed=canEnter(state,target);
 next.tick++;
 if(allowed)next.player=target;
 next.path.push({...next.player});next.actions.push(command);
 const occupied=plateStates(next);
 for(const door of level.doors){const held=occupied.find(p=>p.id===door.plate)?.occupied;next.charges[door.id]=held?Math.min(level.charge,(state.charges[door.id]??0)+1):0;}
 advanceRelay(next,level);
 if(activeHazards(level,next.tick).some(p=>same(p,next.player))){next.status="failed";next.failure="laser";next.reason="레이저에 감지되었습니다. 안전한 칸에서 박자를 기다리세요.";}
 const core=level.cores.find(c=>same(c,next.player));
 if(next.status==="playing"&&core&&!next.collected.includes(core.id)){
  if(core.id!==level.goals[next.collected.length]){next.status="failed";next.failure="order";next.reason="서명 순서가 어긋났습니다. 코어 "+level.goals[next.collected.length]+"부터 회수하세요.";}
  else next.collected.push(core.id);
 }
 if(next.status==="playing"&&same(next.player,level.exit)){
  if(next.collected.length===level.goals.length&&doorStates(next).every(d=>d.open)&&(!level.exitWindow||(next.tick>=level.exitWindow[0]&&next.tick<=level.exitWindow[1]))){next.status="won";next.reason="탈출 성공";}
  else next.reason=level.exitWindow?"출구 시간과 코어·잠금 상태를 확인하세요.":"모든 문을 열고 코어를 순서대로 회수하세요.";
 }
 if(next.status==="playing"&&next.tick>=level.limit){next.status="failed";next.failure="timeout";next.reason="15초의 기록 시간이 끝났습니다. 이 경로를 잔상으로 보관하거나 다시 설계하세요.";}
 return {state:next,accepted:allowed,event:next.status==="playing"?(allowed?"move":"blocked"):next.status};
}
export function sealEcho(state){
 const level=getLevel(state.levelId);
 if((state.status==="failed"&&state.failure!=="timeout")||state.status==="won"||state.path.length<2)throw new RangeError("Cannot seal this run");
 if(state.echoes.length>=MAX_ECHOES)throw new RangeError("Three echo slots are full");
 if(state.path.length>level.limit+1)throw new RangeError("Path limit");
 return createRun(state.levelId,[...state.echoes,{path:copy(state.path),actions:[...state.actions]}]);
}
export function removeEcho(state){return createRun(state.levelId,state.echoes.slice(0,-1));}
export function restartRun(state){return createRun(state.levelId,state.echoes);}
export function evaluate(state){
 const level=getLevel(state.levelId),won=state.status==="won";
 return {won,score:won?Math.max(0,3000-state.tick*20-state.echoes.length*150-state.hints*300):0,seconds:state.tick*TICK_SECONDS,echoes:state.echoes.length,coreCount:state.collected.length,coreGoal:level.goals.length,grade:won?(state.hints?"ASSISTED":state.tick<=40?"S":state.tick<=52?"A":"B"):"",doors:doorStates(state),plates:plateStates(state)};
}
export function describe(state){
 const level=getLevel(state.levelId),result=evaluate(state);
 return {title:level.name,tick:state.tick,player:{...state.player},echoes:state.echoes.map((e,i)=>({slot:i+1,position:echoPosition(e,state.tick),duration:e.path.length-1})),doors:result.doors,plates:result.plates,cores:[...state.collected],hazards:activeHazards(level,state.tick),status:state.status,reason:state.reason};
}
