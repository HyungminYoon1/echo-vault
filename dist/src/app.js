import {levels,getLevel} from "./levels.js";
import {createRun,advance,sealEcho,removeEcho,restartRun,evaluate,describe,doorStates,plateStates,hazardActive,UNDO_LIMIT,TICK_SECONDS} from "./model.js";
import {paint} from "./render.js";
const $=id=>document.getElementById(id),board=$("board"),ctx=board.getContext("2d");
let state=createRun(7),running=false,frame=0,last=0,held=null,history=[],hintUsed=false,loop=1,focusReturn=null;
const records=new Map(),commandMap={ArrowUp:"up",KeyW:"up",ArrowRight:"right",KeyD:"right",ArrowDown:"down",KeyS:"down",ArrowLeft:"left",KeyA:"left",Space:"wait"};
const text=(id,value)=>{$(id).textContent=value;};
const node=(tag,content,cls)=>{const e=document.createElement(tag);if(content!==undefined)e.textContent=content;if(cls)e.className=cls;return e;};
const setStatus=message=>text("status",message);
const draw=()=>{
 paint(ctx,state,0,0);const wrap=board.parentElement;
 if(wrap.scrollWidth>wrap.clientWidth){const level=getLevel(state.levelId),x=((1000-level.width*46)/2+(state.player.x+.5)*46)*board.clientWidth/1000;
  if(x<wrap.scrollLeft+28||x>wrap.scrollLeft+wrap.clientWidth-28)wrap.scrollLeft=Math.max(0,x-wrap.clientWidth/2);}
};
function pause(reason){
 running=false;held=null;cancelAnimationFrame(frame);frame=0;text("play","▶ 실시간 시작");if(reason)setStatus(reason);update();draw();
}
function tick(command="wait"){
 if(state.status!=="playing")return;
 history.push(structuredClone(state));if(history.length>UNDO_LIMIT)history.shift();
 const result=advance(state,command);state=result.state;
 if(!result.accepted&&command!=="wait")setStatus("문이 아직 잠겨 있거나 벽입니다. 잔상의 위치와 충전 박자를 확인하세요.");
 else if(state.collected.length>history.at(-1).collected.length)setStatus("코어 "+state.collected.at(-1)+"의 서명을 확보했습니다.");
 if(state.status!=="playing"){
  running=false;held=null;cancelAnimationFrame(frame);frame=0;
  if(state.status==="won"){const score=evaluate(state).score;records.set(state.levelId,Math.max(records.get(state.levelId)??0,score));}
 }
 update();draw();
}
function animate(time){
 if(!running)return;
 if(!last)last=time;
 let count=0;while(time-last>=TICK_SECONDS*1000&&count<4&&running){last+=TICK_SECONDS*1000;tick(held??"wait");count++;}
 if(time-last>1000)last=time;
 draw();if(running)frame=requestAnimationFrame(animate);
}
function play(){
 if(state.status!=="playing")return;
 if(running){pause("시간을 멈췄습니다. 한 박자씩 설계할 수 있습니다.");return;}
 running=true;held=null;last=0;setStatus("실시간 기록 중. 이동하지 않으면 대기 박자가 기록됩니다.");update();frame=requestAnimationFrame(animate);board.focus({preventScroll:true});
}
function replace(next,message,{newLoop=false,newLevel=false}={}){
 if(!newLevel)next.hints=state.hints;
 running=false;held=null;cancelAnimationFrame(frame);frame=0;last=0;state=next;history=[];hintUsed=state.hints>0;$("hint-copy").hidden=!hintUsed;if(hintUsed)text("hint-copy",getLevel(state.levelId).hint);if(newLoop)loop++;update();draw();setStatus(message);
}
function rewind(){
 try{replace(sealEcho(state),"잔상이 저장되었습니다. 같은 출발점에서 다음 기록을 설계하세요.",{newLoop:true});}catch(error){setStatus(error.message.includes("Three")?"세 잔상이 가득 찼습니다. 마지막 잔상을 삭제하거나 지금 탈출하세요.":"한 박자 이상 기록하고, 레이저/서명 실패가 아닌 경로를 보관하세요.");}
}
function retry(){replace(restartRun(state),"같은 잔상과 같은 박자로 다시 시작합니다.");}
function undo(){if(!history.length)return;pause();const hints=state.hints;state=history.pop();state.hints=Math.max(hints,state.hints);update();draw();setStatus("한 박자를 취소했습니다. 되돌린 시간은 실시간 모드를 다시 시작하기 전까지 멈춰 있습니다.");}
function choose(id){loop=1;replace(createRun(id),"새 금고입니다. 압력판과 문, 코어의 순서와 레이저 박자를 먼저 읽어보세요.",{newLevel:true});}
function renderDialog(){
 const list=$("level-list");list.replaceChildren();
 for(const level of levels){
  const button=node("button",undefined,"level-choice"+(state.levelId===level.id?" current":"")+(records.has(level.id)?" won":""));button.type="button";button.dataset.level=String(level.id);
  button.append(node("span","CHAPTER "+level.chapter+" / VAULT "+String(level.id).padStart(2,"0")),node("b",level.name),node("small",level.grade+" · "+level.plates.length+" 잠금 · "+level.goals.length+" 코어"+(records.has(level.id)?" · "+records.get(level.id)+" PT":"")));
  button.addEventListener("click",()=>{choose(level.id);focusReturn=board;$("campaign-dialog").close();board.focus({preventScroll:true});});list.append(button);
 }
}
function showDialog(id){pause();focusReturn=document.activeElement;if(id==="campaign-dialog")renderDialog();$(id).showModal();}
function update(){
 const level=getLevel(state.levelId),summary=evaluate(state),view=describe(state);
 text("level-title",level.name);text("chapter-label","CHAPTER "+String(level.chapter).padStart(2,"0")+" / "+["","THE FIRST ECHO","SIGNATURE AND SIGNAL","THREE TIMELINES","THE FINAL NIGHT"][level.chapter]);text("difficulty",level.grade);text("sector",String(level.id).padStart(2,"0"));text("campaign-count",String(level.id).padStart(2,"0")+" / "+levels.length);text("best-score",records.has(level.id)?records.get(level.id)+" PT":"—");text("loop-count",String(loop).padStart(2,"0"));
 text("objective",level.plates.length+"개의 잠금장치를 동시에 열고"+(level.goals.length?" 코어 "+level.goals.join(" → ")+"를 회수한 뒤":"")+" 출구로 이동하세요.");
 text("world-state",state.status==="won"?"VAULT OPEN / 성공":state.status==="failed"?"TIMELINE CLOSED / "+(state.failure==="timeout"?"시간 종료":"감지됨"):running?"RECORDING / 실시간":"PLANNING / 시간 정지");text("play",running?"Ⅱ 일시정지":"▶ 실시간 시작");text("time-left",Math.max(0,15-state.tick*TICK_SECONDS).toFixed(2));text("player-location","CURRENT / "+(state.player.x+1)+", "+(state.player.y+1));board.setAttribute("aria-label","금고 "+level.name+". 현재 "+(state.player.x+1)+"열 "+(state.player.y+1)+"행, "+state.tick+"박자, 잔상 "+state.echoes.length+"개. 방향키/WASD 이동, Space 대기.");
 text("lock-count",summary.doors.filter(d=>d.open).length+"/"+level.doors.length);const locks=$("lock-list");locks.replaceChildren();
 for(const door of summary.doors){const row=node("div",undefined,"lock-row"+(door.open?" open":""));const track=node("div",undefined,"lock-charge"),bar=node("span");bar.style.width=door.charge/level.charge*100+"%";track.append(bar);row.append(node("span",door.id,"lock-id"),track,node("small",door.open?"OPEN":door.charge+"/"+level.charge));locks.append(row);}
 const cores=$("core-list");cores.replaceChildren();if(!level.goals.length)cores.append(node("span","코어 없음 · 잠금 동기화만 필요"));else for(const id of level.goals)cores.append(node("span","◇ "+id,"core"+(state.collected.includes(id)?" done":id===level.goals[state.collected.length]?" next":"")));
 text("echo-count",state.echoes.length+"/3");const echoes=$("echo-list");echoes.replaceChildren();for(let i=0;i<3;i++){const e=state.echoes[i],slot=node("div",undefined,"echo-slot"+(e?" used":""));slot.append(node("span","0"+(i+1)),node("span",e?"ECHO "+(i+1):"EMPTY SLOT"),node("span",e?((e.path.length-1)*.25).toFixed(2)+"s":"—"));echoes.append(slot);}
 $("laser-section").hidden=!level.hazards.length;const lasers=$("laser-list");lasers.replaceChildren();level.hazards.forEach((h,i)=>{const row=node("div",undefined,"laser-row");row.append(node("span","0"+(i+1)));for(let k=0;k<h.period;k++)row.append(node("span",undefined,"laser-pip"+(hazardActive(h,k)?" on":"")+(k===(state.tick+1)%h.period?" next":"")));lasers.append(row);});
 const timeline=$("timeline");timeline.replaceChildren();for(let i=0;i<60;i++){const command=state.actions[i],cell=node("span",command?{up:"↑",down:"↓",left:"←",right:"→",wait:"·"}[command]:"","timeline-cell"+(command?" used":"")+(command==="wait"?" wait":"")+(i===state.tick?" current":""));cell.setAttribute("title",(i+1)+"박자"+(command?" · "+command:""));timeline.append(cell);}
 $("record").disabled=state.echoes.length>=3||state.path.length<2||state.status==="won"||(state.status==="failed"&&state.failure!=="timeout");$("play").disabled=state.status!=="playing";$("undo").disabled=!history.length;$("remove-echo").disabled=!state.echoes.length;document.querySelectorAll("[data-move]").forEach(button=>{button.disabled=state.status!=="playing";});
 $("hint").disabled=hintUsed;$("result-overlay").hidden=state.status==="playing";
 if(state.status!=="playing"){
  text("result-kicker",state.status==="won"?"TEMPORAL HEIST COMPLETE":"TIMELINE CLOSED");text("result-title",state.status==="won"?"금고가 열렸습니다":state.failure==="timeout"?"15초가 끝났습니다":"기록이 끊겼습니다");text("result-copy",state.reason);const numbers=$("result-numbers");numbers.replaceChildren();
  for(const[v,label]of [[summary.score,"POINTS"],[summary.seconds.toFixed(2),"SECONDS"],[summary.echoes,"ECHOES"]]){const div=node("div",v);div.append(node("small",label));numbers.append(div);}
  $("result-next").hidden=state.status!=="won"||state.levelId===levels.length;
  $("result-retry").textContent=state.failure==="timeout"&&state.echoes.length<3?"이번 경로를 잔상으로 보관":"같은 잔상으로 재시도";
 }
}
$("play").addEventListener("click",play);$("record").addEventListener("click",rewind);$("retry").addEventListener("click",retry);$("undo").addEventListener("click",undo);
$("remove-echo").addEventListener("click",()=>replace(removeEcho(state),"마지막 잔상을 제거하고 같은 금고를 다시 시작했습니다."));
$("result-retry").addEventListener("click",()=>state.failure==="timeout"&&state.echoes.length<3?rewind():retry());$("result-next").addEventListener("click",()=>choose(Math.min(levels.length,state.levelId+1)));
$("campaign").addEventListener("click",()=>showDialog("campaign-dialog"));$("help").addEventListener("click",()=>showDialog("help-dialog"));
for(const button of document.querySelectorAll("[data-close]"))button.addEventListener("click",()=>$(button.dataset.close).close());
for(const dialog of document.querySelectorAll("dialog"))dialog.addEventListener("close",()=>{(focusReturn??board).focus({preventScroll:true});});
$("hint").addEventListener("click",()=>{if(hintUsed)return;hintUsed=true;state.hints++;text("hint-copy",getLevel(state.levelId).hint);$("hint-copy").hidden=false;update();setStatus("개념 힌트를 열었습니다. 성공 점수에서 300점이 차감됩니다.");});
for(const button of document.querySelectorAll("[data-move]"))button.addEventListener("click",()=>{pause();tick(button.dataset.move);board.focus({preventScroll:true});});
document.addEventListener("keydown",event=>{
 if(document.querySelector("dialog[open]")||["INPUT","SELECT","TEXTAREA"].includes(event.target.tagName))return;
 const boardActive=event.target===board||event.target===document.body;
 if(!boardActive)return;
 const command=commandMap[event.code];
 if(command){event.preventDefault();if(running)held=command;else if(!event.repeat)tick(command);return;}
 if(event.repeat)return;
 if(event.code==="KeyP"){event.preventDefault();play();}
 if(event.code==="KeyR"){event.preventDefault();rewind();}
 if(event.code==="KeyZ"){event.preventDefault();undo();}
 if(event.code==="Escape"){pause("기록을 일시정지했습니다.");}
 if(event.code==="Slash"&&event.shiftKey)showDialog("help-dialog");
});
document.addEventListener("keyup",event=>{if(commandMap[event.code]===held)held=null;});
board.addEventListener("click",()=>board.focus({preventScroll:true}));
$("fullscreen").addEventListener("click",async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector(".world-frame").requestFullscreen();}catch{setStatus("이 브라우저에서는 전체화면을 사용할 수 없습니다.");}});
document.addEventListener("visibilitychange",()=>{if(document.hidden)pause("화면을 벗어나 기록을 정지했습니다. 자동 재개하지 않습니다.");});
globalThis.addEventListener("blur",()=>pause("입력 초점이 바뀌어 시간을 멈췄습니다."));
globalThis.addEventListener("pagehide",()=>{running=false;held=null;cancelAnimationFrame(frame);frame=0;});
update();draw();
