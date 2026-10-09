const base = [
 {name:"잔상의 약속",chapter:1,grade:"HARD",charge:1,limit:60,
  goals:[],hazards:[],hint:"한 번의 기록은 되감기 후에도 마지막 위치에서 기다립니다. A를 누를 잔상을 먼저 만드세요."},
 {name:"닫히는 다리",chapter:1,grade:"HARD",charge:2,limit:60,
  goals:[],hazards:[],hint:"첫 잔상이 자리를 잡은 뒤에 문을 통과하세요. 두 번째 기록은 첫 잔상의 도착 시간에 의존합니다."},
 {name:"세 사람의 무게",chapter:1,grade:"EXPERT",charge:2,limit:60,
  goals:[],hazards:[],hint:"세 잠금장치는 서로 다른 잔상을 요구합니다. 뒤쪽 기록을 만들 때 앞쪽 잔상의 지연까지 계산하세요."},
 {name:"순서를 기억하는 방",chapter:2,grade:"EXPERT",charge:2,limit:60,
  goals:["1","2"],hazards:[],hint:"데이터 코어 1 → 2의 순서는 매 반복 초기화됩니다. 잔상은 문을 열지만 코어는 현재의 당신만 회수할 수 있습니다."},
 {name:"푸른 박동",chapter:2,grade:"EXPERT",charge:2,limit:60,
  goals:[],hazards:[{cells:[[8,5],[9,5]],period:8,on:3,offset:0}],hint:"레이저는 8박자마다 3박자 켜집니다. 빨간 칸에 들어가기 전 안전한 칸에서 기다릴 수 있습니다."},
 {name:"지연된 서명",chapter:2,grade:"EXPERT",charge:3,limit:60,
  goals:["1","2"],hazards:[{cells:[[10,5]],period:7,on:2,offset:3}],hint:"장치가 충전되는 데 세 박자가 필요합니다. 코어를 회수하는 이동과 기록 도착 순서를 함께 설계하세요."},
 {name:"유리 사이의 교차",chapter:3,grade:"MASTER",charge:2,limit:60,
  goals:["1","2"],hazards:[{cells:[[6,5]],period:9,on:3,offset:2}],hint:"전부 한꺼번에 움직일 필요는 없습니다. 기록은 더 짧게 끝내고 마지막 위치를 유지할 수 있습니다."},
 {name:"두 개의 박자",chapter:3,grade:"MASTER",charge:2,limit:60,
  goals:[],hazards:[{cells:[[6,5]],period:7,on:3,offset:0},{cells:[[10,5]],period:11,on:4,offset:4}],hint:"서로 다른 두 주기는 같은 순간에 안전하지 않을 수 있습니다. 첫 관문 통과 뒤 두 번째 관문의 시계를 다시 읽으세요."},
 {name:"검은 보관소",chapter:3,grade:"MASTER",charge:3,limit:60,
  goals:["1","2"],hazards:[{cells:[[6,5]],period:9,on:3,offset:1},{cells:[[10,5]],period:8,on:2,offset:3}],hint:"긴 기록의 마지막 위치보다 도착 박자가 중요합니다. 현재 반복의 코어 두 개를 회수할 시간도 남겨두세요."},
 {name:"역상 신호",chapter:4,grade:"MASTER",charge:2,limit:60,
  goals:["1","2","3"],hazards:[{cells:[[6,5]],period:10,on:3,offset:0},{cells:[[10,5]],period:13,on:4,offset:5}],hint:"세 코어는 각 구역의 아래쪽에 있습니다. 위쪽에 잔상을 남기는 기록과 아래쪽을 지나는 실제 탈출 경로를 분리하세요."},
 {name:"시간의 삼중 잠금",chapter:4,grade:"MASTER",charge:3,limit:60,
  goals:[],hazards:[{cells:[[6,5]],period:7,on:3,offset:1},{cells:[[10,5]],period:11,on:5,offset:0},{cells:[[13,5]],period:8,on:3,offset:5}],hint:"마지막 한 칸의 레이저도 탈출 조건의 일부입니다. 마지막 기록을 만든 뒤 처음부터 전체 안전 박자를 확인하세요."},
 {name:"금고의 마지막 밤",chapter:4,grade:"MASTER",charge:3,limit:60,
  goals:["1","2","3"],hazards:[{cells:[[6,5]],period:9,on:3,offset:2},{cells:[[10,5]],period:11,on:4,offset:4},{cells:[[13,5]],period:8,on:2,offset:3}],hint:"세 기록, 세 서명, 세 박자. 각 잔상의 도착을 빠르게 만들면 현재 탈출에 쓸 15초를 확보할 수 있습니다."}
];
function coordinate(rows,char){for(let y=0;y<rows.length;y++){const x=rows[y].indexOf(char);if(x>=0)return{x,y};}return null;}
export const legacyLevels=Object.freeze(base.map((level,index)=>{
 const count=index===0?1:(index===1||index===3||index===4||index===5)?2:3;
 const gateRows=[[5,5,5],[5,3,5],[3,7,5],[5,7,3],[5,3,5],[3,7,5],[3,7,3],[7,3,7],[3,7,5],[7,3,5],[3,7,7],[7,3,5]][index];
 const cells=Array.from({length:11},(_,y)=>Array.from({length:18},(_,x)=>x===0||x===17||y===0||y===10?"#":"."));
 for(let room=0;room<3;room++){
   const boundary=5+room*5;
   for(let y=1;y<10;y++)cells[y][boundary]="#";
   cells[gateRows[room]][boundary]=room<count?"ABC"[room]:".";
   if(room<count)cells[1][3+room*5]="abc"[room];
   if(index>0){for(const y of [3,7])if(y!==gateRows[room])cells[y][2+room*5]="#";}
   if(index>=6){cells[4][3+room*5]="#";cells[6][3+room*5]="#";}
 }
 for(let y=1;y<10;y++)cells[y][16]="#";
 cells[gateRows[2]][16]="X";cells[5][1]="S";
 level.goals.forEach((id,i)=>{cells[9][3+i*5]=id;});
 const width=18;
 const rows=cells.map(row=>row.join(""));
 const plates=["a","b","c"].map(id=>({id,...coordinate(rows,id)})).filter(p=>Number.isInteger(p.x));
 const doors=plates.map(p=>({id:p.id.toUpperCase(),plate:p.id,...coordinate(rows,p.id.toUpperCase())}));
 const hazards=level.hazards.map((h,i)=>({...h,cells:[[6+i*5,gateRows[Math.min(i,2)]]]}));
 return Object.freeze({...level,hazards,id:index+1,width,height:rows.length,rows:Object.freeze(rows),start:coordinate(rows,"S"),exit:coordinate(rows,"X"),plates:Object.freeze(plates),doors:Object.freeze(doors),cores:Object.freeze(level.goals.map(id=>({id,...coordinate(rows,id)})))});
}));
// Campaign v1 remains unchanged. v2 adds timed, echo-only relay programs.
export const CAMPAIGN_VERSION=2;
function authored(id,name,rows,extra={}){
 const plates=["a","b","c"].map(id=>({id,...coordinate(rows,id)})).filter(p=>Number.isInteger(p.x));
 const goals=["1","2","3"].filter(id=>coordinate(rows,id));
 return Object.freeze({id,name,chapter:5,grade:"MASTER",charge:2,limit:60,rows,width:rows[0].length,height:rows.length,
  start:coordinate(rows,"S"),exit:coordinate(rows,"X"),plates,goals,cores:goals.map(id=>({id,...coordinate(rows,id)})),
  doors:plates.filter(p=>coordinate(rows,p.id.toUpperCase())).map(p=>({id:p.id.toUpperCase(),plate:p.id,...coordinate(rows,p.id.toUpperCase())})),hazards:[],...extra});
}
export const onboarding=authored("intro","첫 잔상",[
 "#########","#a.#....#","#..A..X.#","#S.#....#","#########"
],{chapter:0,grade:"입문",charge:1,hint:"위로 두 칸 이동한 뒤 기록하세요. 잔상이 A를 누르면 문을 통과할 수 있습니다."});
const arena=["###############","#.........#.#.#","#..a...1..#.#.#","#....#....#.#.#","#S.....c..ACBX#","#....#....#.#.#","#..b...2..#.#.#","#.........#.#.#","###############"];
const phase=(start,end,on,off,hold=2)=>({start,end,on,off,hold});
export const advancedLevels=Object.freeze([
 authored(13,"해제와 재방문",arena.map(row=>row.replace("c",".").replace("C",".")),{
  goals:[],cores:[],requiredEchoes:2,exitWindow:[22,28],
  phases:[phase(4,7,["a"],["b"]),phase(8,11,["b"],["a"]),phase(14,18,["a","b"],[])],
  hint:"첫 잔상은 A를 두 박자 누른 뒤 떠났다가 돌아와야 합니다. B의 도착은 그 빈 구간에 맞추세요."}),
 authored(14,"교대 회로",arena.map(row=>row.replace("c",".").replace("C",".")),{
  requiredEchoes:2,exitWindow:[34,40],
  phases:[phase(4,7,["a"],["b"]),phase(8,11,["b"],["a"]),phase(14,18,["a","b"],[]),phase(19,22,["a"],["b"]),phase(25,28,["a","b"],[],3)],
  hint:"A와 B 모두 재방문이 필요합니다. 회로 대기 중 코어 1과 2를 회수하세요."}),
 authored(15,"세 갈래의 귀환",arena,{
  requiredEchoes:3,charge:3,exitWindow:[36,42],
  phases:[phase(4,7,["a"],["b","c"]),phase(8,11,["b"],["a","c"]),phase(12,15,["c"],["a","b"]),phase(18,21,["a","c"],["b"]),phase(26,29,["a","b","c"],[],3)],
  hazards:[{cells:[[9,4]],period:8,on:3,offset:0}],
  hint:"A → B → C로 교대하고 A가 먼저 돌아옵니다. 마지막 세 박자 동시 유지 뒤 출구 시간을 맞추세요."})
]);
export const levels=Object.freeze([...legacyLevels,...advancedLevels]);
export const allLevels=Object.freeze([onboarding,...levels]);
export function getLevel(id){const level=allLevels.find(l=>l.id===id);if(!level)throw new RangeError("Unknown level");return level;}
