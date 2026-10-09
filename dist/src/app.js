import {levels,allLevels,getLevel} from "./levels.js";
import {createRun,advance,sealEcho,removeEcho,restartRun,evaluate,describe,doorStates,plateStates,hazardActive,UNDO_LIMIT,TICK_SECONDS} from "./model.js";
import {paint} from "./render.js";
import {recordWin,completedCount} from "./save.js";
import {browserStorage,loadSave,writeSave,clearSave} from "./storage.js";
import {reportProgress,clearProgress} from "./progress.js";
const $=id=>document.getElementById(id),board=$("board"),ctx=board.getContext("2d");
const storage=browserStorage();
let saved=loadSave(storage),records=saved.records??new Map();
let state=createRun("intro"),running=false,frame=0,last=0,held=null,history=[],hintUsed=false,loop=1,focusReturn=null;
const commandMap={ArrowUp:"up",KeyW:"up",ArrowRight:"right",KeyD:"right",ArrowDown:"down",KeyS:"down",ArrowLeft:"left",KeyA:"left",Space:"wait"};
const text=(id,value)=>{$(id).textContent=value;};
const node=(tag,content,cls)=>{const e=document.createElement(tag);if(content!==undefined)e.textContent=content;if(cls)e.className=cls;return e;};
const setStatus=message=>text("status",message);
function autosave({publish=false}={}){
 const ok=writeSave(storage,state,records);
 text("save-status",ok?"기기에 자동 저장됨":"저장 불가 · 현재 탭에서만 유지");
 if(ok){saved={status:"saved",state:structuredClone(state),records:new Map(records)};$("resume").hidden=true;
  if(publish&&completedCount(records)>0&&!reportProgress(storage,completedCount(records),levels.length))text("save-status","게임 저장됨 · 갤러리 요약 갱신 실패");}
}
const draw=()=>{
 paint(ctx,state,0,0);const wrap=board.parentElement;
 if(wrap.scrollWidth>wrap.clientWidth){const x=(20+(state.player.x+.5)*46)*board.clientWidth/board.width;
  if(x<wrap.scrollLeft+28||x>wrap.scrollLeft+wrap.clientWidth-28)wrap.scrollLeft=Math.max(0,x-wrap.clientWidth/2);}
 if(wrap.scrollHeight>wrap.clientHeight){const y=(44+(state.player.y+.5)*46)*board.clientHeight/board.height;
  if(y<wrap.scrollTop+28||y>wrap.scrollTop+wrap.clientHeight-28)wrap.scrollTop=Math.max(0,y-wrap.clientHeight/2);}
};
function pause(reason){
 running=false;held=null;cancelAnimationFrame(frame);frame=0;text("play","▶ 실시간 시작");if(reason)setStatus(reason);update();draw();
}
function tick(command="wait"){
 if(state.status!=="playing")return;
 history.push(structuredClone(state));if(history.length>UNDO_LIMIT)history.shift();
 const result=advance(state,command);state=result.state;
 if(!result.accepted&&command!=="wait")setStatus("벽 또는 닫힌 문입니다.");
 else if(state.collected.length>history.at(-1).collected.length)setStatus("코어 "+state.collected.at(-1)+" 회수");
 if(state.status!=="playing"){
  running=false;held=null;cancelAnimationFrame(frame);frame=0;
  if(state.status==="won")records=recordWin(records,state);
 }
 autosave({publish:state.status==="won"&&!state.hints&&state.levelId!=="intro"});update();draw();
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
 if(running){pause("일시정지");return;}
 running=true;held=null;last=0;setStatus("실시간 기록 중. 이동하지 않으면 대기 박자가 기록됩니다.");update();frame=requestAnimationFrame(animate);board.focus({preventScroll:true});
}
function replace(next,message,{newLoop=false,newLevel=false,persist=true}={}){
 if(!newLevel)next.hints=state.hints;
 running=false;held=null;cancelAnimationFrame(frame);frame=0;last=0;state=next;history=[];hintUsed=state.hints>0;$("hint-copy").hidden=!hintUsed;if(hintUsed)text("hint-copy",getLevel(state.levelId).hint);if(newLoop)loop++;update();draw();setStatus(message);
 if(persist)autosave();
}
function rewind(){
 try{replace(sealEcho(state),"잔상 기록됨 · 출발점으로 되감기",{newLoop:true});}catch(error){setStatus(error.message.includes("Three")?"잔상 3개가 찼습니다.":"실패하지 않은 경로를 한 박자 이상 기록하세요. 시간 종료 경로도 보관할 수 있습니다.");}
}
function retry(){replace(restartRun(state),"같은 잔상과 같은 박자로 다시 시작합니다.");}
function undo(){if(!history.length)return;pause();const hints=state.hints;state=history.pop();state.hints=Math.max(hints,state.hints);autosave();update();draw();setStatus("한 박자 취소 · 일시정지");}
function choose(id){loop=1;replace(createRun(id),"방향키로 한 박자씩 이동하세요.",{newLevel:true});}
function renderDialog(){
 const list=$("level-list");list.replaceChildren();
 for(const level of allLevels){
  const button=node("button",undefined,"level-choice"+(state.levelId===level.id?" current":"")+(records.has(level.id)?" won":""));button.type="button";button.dataset.level=String(level.id);
  button.append(node("span",level.id==="intro"?"입문":(level.id>12?"V2 시간 회로 · ":"V1 · ")+level.id),node("b",level.name),node("small",level.grade+" · "+level.plates.length+" 잠금"+(records.has(level.id)?" · "+evaluate(records.get(level.id).best).score+"점"+(records.get(level.id).independent?" · 독립 완주":" · 힌트 사용"):"")));
  button.addEventListener("click",()=>{choose(level.id);focusReturn=board;$("campaign-dialog").close();board.focus({preventScroll:true});});list.append(button);
 }
}
function showDialog(id){pause();focusReturn=document.activeElement;if(id==="campaign-dialog")renderDialog();$(id).showModal();}
function update(){
 const level=getLevel(state.levelId),summary=evaluate(state),view=describe(state);
 text("level-title",level.name);text("chapter-label",level.id==="intro"?"입문":level.id>12?"V2 · 시간 회로":"V1 · "+level.chapter+"장");text("difficulty",level.grade);text("sector",level.id==="intro"?"입문":String(level.id).padStart(2,"0"));text("campaign-count",completedCount(records)+" / "+levels.length);text("best-score",records.has(level.id)?evaluate(records.get(level.id).best).score+"점":"—");text("loop-count",String(state.echoes.length+1).padStart(2,"0"));
 text("objective",level.phases?"잔상 "+level.requiredEchoes+"개의 시간 회로 · 출구 "+level.exitWindow.join("–")+"박자"+(level.goals.length?" · 코어 "+level.goals.join(" → "):""):"잠금 "+level.plates.length+"개 동시 유지"+(level.goals.length?" · 코어 "+level.goals.join(" → "):"")+" · 출구로 이동");
 $("onboarding").hidden=level.id!=="intro";
 text("onboarding-step",state.echoes.length?"② 오른쪽 → 위 → 오른쪽 4번: 출구로 이동하세요.":"① 위로 두 칸 이동해 A를 누르고 ‘기록·되감기’를 누르세요.");
 $("relay-section").hidden=!level.phases;
 const relay=$("relay-list");relay.replaceChildren();
 for(const [i,p] of (level.phases??[]).entries())relay.append(node("li",`${p.start}–${p.end}박자 · ${p.on.join("+").toUpperCase()} 누름${p.off.length?" / "+p.off.join("+").toUpperCase()+" 해제":""} · ${p.hold}박자 유지${state.phase>i?" ✓":state.phase===i?" ("+state.phaseHold+"/"+p.hold+")":""}`,state.phase===i?"active-phase":""));
 text("relay-status",state.echoes.length<(level.requiredEchoes??0)?"잔상 "+level.requiredEchoes+"개를 기록하면 회로가 작동합니다.":"회로는 잔상만 감지합니다. 출구에서는 모든 압력판을 유지하세요.");
 text("world-state",state.status==="won"?"성공":state.status==="failed"?"실패":running?"실시간":"일시정지");text("play",running?"Ⅱ 정지":"▶ 실시간");text("time-left",Math.max(0,15-state.tick*TICK_SECONDS).toFixed(2));text("beat-count",state.tick+" / 60박자");text("player-location",(state.player.x+1)+"열 "+(state.player.y+1)+"행");board.setAttribute("aria-label","금고 "+level.name+". 현재 "+(state.player.x+1)+"열 "+(state.player.y+1)+"행, "+state.tick+"박자, 잔상 "+state.echoes.length+"개. 방향키/WASD 이동, Space 대기.");
 text("lock-count",summary.doors.filter(d=>d.open).length+"/"+level.doors.length);const locks=$("lock-list");locks.replaceChildren();
 for(const door of summary.doors){const row=node("div",undefined,"lock-row"+(door.open?" open":""));const track=node("div",undefined,"lock-charge"),bar=node("span");bar.style.width=door.charge/level.charge*100+"%";track.append(bar);row.append(node("span",door.id,"lock-id"),track,node("small",door.open?"OPEN":door.charge+"/"+level.charge));locks.append(row);}
 const cores=$("core-list");cores.replaceChildren();if(!level.goals.length)cores.append(node("span","없음"));else for(const id of level.goals)cores.append(node("span","◇ "+id,"core"+(state.collected.includes(id)?" done":id===level.goals[state.collected.length]?" next":"")));
 text("echo-count",state.echoes.length+"/3");const echoes=$("echo-list");echoes.replaceChildren();for(let i=0;i<3;i++){const e=state.echoes[i],slot=node("div",undefined,"echo-slot"+(e?" used":""));slot.append(node("span","0"+(i+1)),node("span",e?"ECHO "+(i+1):"EMPTY SLOT"),node("span",e?((e.path.length-1)*.25).toFixed(2)+"s":"—"));echoes.append(slot);}
 $("laser-section").hidden=!level.hazards.length;const lasers=$("laser-list");lasers.replaceChildren();level.hazards.forEach((h,i)=>{const row=node("div",undefined,"laser-row");row.append(node("span","0"+(i+1)));for(let k=0;k<h.period;k++)row.append(node("span",undefined,"laser-pip"+(hazardActive(h,k)?" on":"")+(k===(state.tick+1)%h.period?" next":"")));lasers.append(row);});
 const timeline=$("timeline");timeline.replaceChildren();for(let i=0;i<60;i++){const command=state.actions[i],cell=node("span",command?{up:"↑",down:"↓",left:"←",right:"→",wait:"·"}[command]:"","timeline-cell"+(command?" used":"")+(command==="wait"?" wait":"")+(i===state.tick?" current":""));cell.setAttribute("title",(i+1)+"박자"+(command?" · "+command:""));timeline.append(cell);}
 $("record").disabled=state.echoes.length>=3||state.path.length<2||state.status==="won"||(state.status==="failed"&&state.failure!=="timeout");$("play").disabled=state.status!=="playing";$("undo").disabled=!history.length;$("remove-echo").disabled=!state.echoes.length;document.querySelectorAll("[data-move]").forEach(button=>{button.disabled=state.status!=="playing";});
 $("hint").disabled=hintUsed;$("result-overlay").hidden=state.status==="playing";
 if(state.status!=="playing"){
  text("result-kicker",state.status==="won"?(state.hints?"힌트 사용":"완주"):"재시도");text("result-title",state.status==="won"?"탈출 성공":state.failure==="timeout"?"시간 종료":state.failure==="timing"?"동기화 실패":"기록 실패");text("result-copy",state.status==="won"?`3000 − ${state.tick}박자×20 − 잔상 ${state.echoes.length}×150 − 힌트 ${state.hints}×300`:state.reason);const numbers=$("result-numbers");numbers.replaceChildren();
  for(const[v,label]of [[summary.score,"POINTS"],[summary.seconds.toFixed(2),"SECONDS"],[summary.echoes,"ECHOES"]]){const div=node("div",v);div.append(node("small",label));numbers.append(div);}
  $("result-next").hidden=state.status!=="won"||state.levelId===levels.length;
  $("result-retry").textContent=state.failure==="timeout"&&state.echoes.length<3?"이번 경로를 잔상으로 보관":"같은 잔상으로 재시도";
 }
}
$("play").addEventListener("click",play);$("record").addEventListener("click",rewind);$("retry").addEventListener("click",retry);$("undo").addEventListener("click",undo);
$("remove-echo").addEventListener("click",()=>replace(removeEcho(state),"마지막 잔상을 제거하고 같은 금고를 다시 시작했습니다."));
$("result-retry").addEventListener("click",()=>state.failure==="timeout"&&state.echoes.length<3?rewind():retry());$("result-next").addEventListener("click",()=>choose(state.levelId==="intro"?1:Math.min(levels.length,state.levelId+1)));
$("campaign").addEventListener("click",()=>showDialog("campaign-dialog"));$("help").addEventListener("click",()=>showDialog("help-dialog"));
for(const button of document.querySelectorAll("[data-close]"))button.addEventListener("click",()=>$(button.dataset.close).close());
for(const dialog of document.querySelectorAll("dialog"))dialog.addEventListener("close",()=>{(focusReturn??board).focus({preventScroll:true});});
$("hint").addEventListener("click",()=>{if(hintUsed)return;hintUsed=true;state.hints++;text("hint-copy",getLevel(state.levelId).hint);$("hint-copy").hidden=false;autosave();update();setStatus("힌트 사용 · −300점");});
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
$("advanced").addEventListener("click",()=>choose(13));
$("intro").addEventListener("click",()=>choose("intro"));
$("resume").addEventListener("click",()=>{if(saved.status!=="saved")return;records=saved.records;replace(structuredClone(saved.state),"저장한 기록 · 일시정지",{newLevel:true});});
$("zoom").addEventListener("click",()=>{const zoomed=board.parentElement.classList.toggle("zoomed");$("zoom").setAttribute("aria-pressed",String(zoomed));text("zoom",zoomed?"전체 보기":"확대");draw();});
$("clear").addEventListener("click",()=>showDialog("clear-dialog"));
$("clear-confirm").addEventListener("click",()=>{
 if(!clearSave(storage)){text("clear-error","삭제하지 못했습니다. 브라우저 저장 권한을 확인하세요.");return;}
 const summaryCleared=clearProgress(storage);records=new Map();saved={status:"empty"};$("resume").hidden=true;
 replace(createRun("intro"),summaryCleared?"이 게임의 기록을 삭제했습니다.":"게임 기록 삭제됨 · 갤러리 요약 삭제 실패",{newLevel:true,persist:false});
 text("save-status",summaryCleared?"저장 기록 없음":"갤러리 요약 삭제 실패 · 다시 삭제할 수 있습니다.");$("clear-dialog").close();
});
$("resume").hidden=saved.status!=="saved";
 text("save-status",saved.status==="saved"?"저장된 금고: "+getLevel(saved.state.levelId).name:saved.status==="invalid"?"저장 기록을 읽지 못했습니다. 새로 시작하거나 삭제하세요.":saved.status==="unavailable"?"저장 불가 · 현재 탭에서만 유지":"진행은 이 기기에 자동 저장됩니다.");
update();draw();
