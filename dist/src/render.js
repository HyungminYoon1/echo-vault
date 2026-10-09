import {getLevel} from "./levels.js";
import {doorStates,plateStates,echoPosition,hazardActive} from "./model.js";
const colors=["#64dccf","#c3a0f1","#f0a487"];
const same=(a,b)=>a.x===b.x&&a.y===b.y;
export function paint(ctx,state,time=0,motion=0){
 const level=getLevel(state.levelId),size=46,w=level.width*size+40,h=level.height*size+88,ox=20,oy=44;
 if(ctx.canvas.width!==w||ctx.canvas.height!==h){ctx.canvas.width=w;ctx.canvas.height=h;}
 ctx.clearRect(0,0,w,h);ctx.fillStyle="#0b1421";ctx.fillRect(0,0,w,h);
 const backdrop=ctx.createRadialGradient(520,260,50,500,320,650);backdrop.addColorStop(0,"#23384a");backdrop.addColorStop(1,"#080f1a");ctx.fillStyle=backdrop;ctx.fillRect(0,0,w,h);
 ctx.strokeStyle="#43617518";ctx.lineWidth=1;for(let i=-500;i<1500;i+=45){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+280,h);ctx.stroke();}
 const point=p=>({x:ox+(p.x+.5)*size,y:oy+(p.y+.5)*size});
 for(let y=0;y<level.height;y++)for(let x=0;x<level.width;x++){
  const px=ox+x*size,py=oy+y*size,wall=level.rows[y][x]==="#";
  ctx.fillStyle=wall?"#0a121c":(x+y)%2===0?"#263b4c":"#233647";ctx.fillRect(px,py,size,size);
  if(!wall){
   ctx.strokeStyle="#455c6e55";ctx.strokeRect(px+1,py+1,size-2,size-2);
   ctx.fillStyle="#59758c33";for(const[a,b]of [[7,7],[39,7],[7,39],[39,39]])ctx.fillRect(px+a,py+b,2,2);
   if(x%5===2&&y%3===0){ctx.strokeStyle="#435d7177";ctx.beginPath();ctx.moveTo(px+8,py+22);ctx.lineTo(px+38,py+22);ctx.stroke();}
  }
 }
 // Occupied geometry casts actual wall depth onto neighboring walkable floors.
 for(let y=0;y<level.height;y++)for(let x=0;x<level.width;x++){
  if(level.rows[y][x]!=="#")continue;const px=ox+x*size,py=oy+y*size;
  ctx.fillStyle="#020b1470";ctx.fillRect(px+6,py+5,size,size+8);
  ctx.fillStyle="#101e2c";ctx.fillRect(px,py,size,size);
  ctx.fillStyle="#2d4354";ctx.fillRect(px,py-9,size,size-9);
  ctx.fillStyle="#384f60";ctx.fillRect(px,py-9,size,3);ctx.fillStyle="#1b2c3b";ctx.fillRect(px,py+size-18,size,18);
  ctx.strokeStyle="#7790a52c";ctx.strokeRect(px+3,py-5,size-6,size-17);
  if(x%2===0){ctx.fillStyle="#7b837d70";ctx.fillRect(px+8,py+27,8,2);ctx.fillRect(px+29,py+27,8,2);}
 }
 // Cable paths connect each real plate and door.
 for(const door of level.doors){const plate=level.plates.find(p=>p.id===door.plate),a=point(plate),b=point(door);ctx.strokeStyle="#ac946b32";ctx.lineWidth=2;ctx.setLineDash([3,6]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(a.x,b.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);}
 const plateData=plateStates(state);
 for(const plate of plateData){
  const p=point(plate);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.PI/4);
  ctx.fillStyle=plate.occupied?"#64dccf30":"#c3a47416";ctx.strokeStyle=plate.occupied?"#76f3d9":"#bc9e66";ctx.lineWidth=2;ctx.fillRect(-13,-13,26,26);ctx.strokeRect(-13,-13,26,26);ctx.strokeRect(-8,-8,16,16);ctx.restore();
  ctx.fillStyle=plate.occupied?"#9cebe1":"#e2bf75";ctx.font="bold 12px monospace";ctx.textAlign="center";ctx.fillText(plate.id.toUpperCase(),p.x,p.y+4);
  if(plate.occupied){ctx.shadowBlur=14;ctx.shadowColor="#64dccf";ctx.strokeStyle="#64dccf";ctx.beginPath();ctx.arc(p.x,p.y,20,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;}
 }
 for(const door of doorStates(state)){
  const p=point(door);ctx.fillStyle="#121d2a";ctx.fillRect(p.x-20,p.y-28,40,48);ctx.strokeStyle="#93774d";ctx.lineWidth=2;ctx.strokeRect(p.x-21,p.y-29,42,49);
  const slide=door.open?13:0;ctx.fillStyle=door.open?"#698a85":"#bc9d64";ctx.fillRect(p.x-17-slide,p.y-25,16,40);ctx.fillRect(p.x+1+slide,p.y-25,16,40);
  ctx.fillStyle=door.open?"#87f1d0":"#242a2a";ctx.fillRect(p.x-13-slide,p.y-17,8,2);ctx.fillRect(p.x+5+slide,p.y-17,8,2);
  ctx.fillStyle=door.open?"#8fdfd2":"#e2bf75";ctx.font="10px monospace";ctx.textAlign="center";ctx.fillText(door.id,p.x,p.y-32);
  ctx.fillStyle="#0c1823";ctx.fillRect(p.x-18,p.y+23,36,3);ctx.fillStyle=door.open?"#64dccf":"#d1b479";ctx.fillRect(p.x-18,p.y+23,36*door.charge/level.charge,3);
 }
 for(const core of level.cores){
  if(state.collected.includes(core.id))continue;const p=point(core),next=level.goals[state.collected.length]===core.id;
  ctx.save();ctx.translate(p.x,p.y-4);ctx.rotate(Math.PI/4);ctx.shadowBlur=next?16:0;ctx.shadowColor="#edcb7f";ctx.fillStyle=next?"#e8c77d":"#8d7e62";ctx.fillRect(-7,-7,14,14);ctx.shadowBlur=0;ctx.strokeStyle="#fff1b7";ctx.strokeRect(-11,-11,22,22);ctx.restore();ctx.fillStyle="#d8caa6";ctx.font="10px monospace";ctx.textAlign="center";ctx.fillText(core.id,p.x,p.y+23);
 }
 for(const hazard of level.hazards)for(const[x,y]of hazard.cells){
  const p=point({x,y}),active=hazardActive(hazard,state.tick),next=hazardActive(hazard,state.tick+1);
  ctx.fillStyle=active?"#fc586829":"#f2747b10";ctx.fillRect(p.x-size/2+2,p.y-size/2+2,size-4,size-4);
  ctx.strokeStyle=active?"#ff7585":next?"#fcba74":"#ab495b";ctx.lineWidth=active?3:1;ctx.setLineDash(active?[]:[3,4]);ctx.beginPath();ctx.moveTo(p.x-18,p.y-18);ctx.lineTo(p.x+18,p.y+18);ctx.moveTo(p.x+18,p.y-18);ctx.lineTo(p.x-18,p.y+18);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle="#d58387";ctx.fillRect(p.x-23,p.y-5,5,10);ctx.fillRect(p.x+18,p.y-5,5,10);
 }
 const exit=point(level.exit);ctx.fillStyle="#e2bf7524";ctx.fillRect(exit.x-20,exit.y-21,40,42);ctx.strokeStyle="#e2bf75";ctx.lineWidth=2;ctx.strokeRect(exit.x-20,exit.y-21,40,42);ctx.fillStyle="#edd394";ctx.font="22px monospace";ctx.textAlign="center";ctx.fillText("↗",exit.x,exit.y+7);
 const drawActor=(actor,color,ghost=false)=>{
  const p=point(actor);ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=ghost?.7:1;
  ctx.fillStyle="#030b127a";ctx.beginPath();ctx.ellipse(2,12,13,6,0,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=ghost?18:9;ctx.shadowColor=color;ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,16,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;
  ctx.fillStyle=ghost?color:"#cfdae2";ctx.beginPath();ctx.moveTo(-8,6);ctx.lineTo(-11,-3);ctx.lineTo(-6,-12);ctx.lineTo(6,-12);ctx.lineTo(11,-3);ctx.lineTo(8,6);ctx.closePath();ctx.fill();
  ctx.fillStyle="#101c2b";ctx.fillRect(-6,-7,12,4);ctx.fillStyle=ghost?"#fff":"#e2bf75";ctx.fillRect(-4,-7,8,2);ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(-6,7);ctx.lineTo(-6,12);ctx.moveTo(6,7);ctx.lineTo(6,12);ctx.stroke();ctx.restore();
 };
 for(let index=0;index<state.echoes.length;index++){
  const echo=state.echoes[index],color=colors[index],end=Math.min(state.tick,echo.path.length-1);ctx.strokeStyle=color+"44";ctx.lineWidth=2;ctx.beginPath();
  for(let k=Math.max(0,end-18);k<=end;k++){const p=point(echo.path[k]);if(k===Math.max(0,end-18))ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);}ctx.stroke();drawActor(echoPosition(echo,state.tick),color,true);
 }
 ctx.strokeStyle="#e2bf7544";ctx.lineWidth=2;ctx.beginPath();state.path.slice(-14).forEach((a,i)=>{const p=point(a);if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);});ctx.stroke();drawActor(state.player,"#f2d696");
 ctx.textAlign="left";ctx.fillStyle="#728eaa";ctx.font="10px monospace";ctx.fillText("VAULT // "+String(level.id).padStart(2,"0")+"   /   "+level.grade+"   /   T+"+(state.tick*.25).toFixed(2),ox,34);
 ctx.textAlign="right";ctx.fillStyle="#67869c";ctx.fillText("CURRENT TIMELINE / "+(state.echoes.length+1),w-ox,34);
 ctx.fillStyle="#67869c55";ctx.font="9px monospace";for(let x=0;x<level.width;x++){ctx.textAlign="center";ctx.fillText(String(x+1).padStart(2,"0"),ox+(x+.5)*size,oy+level.height*size+18);}
}
