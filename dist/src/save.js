import {CAMPAIGN_VERSION,levels,getLevel} from "./levels.js";
import {createRun,advance,sealEcho,evaluate,directions} from "./model.js";
export const SAVE_VERSION=1,MAX_SAVE_CHARS=131072;
const object=value=>value!==null&&typeof value==="object"&&!Array.isArray(value);
function keys(value,allowed){if(!object(value)||Object.keys(value).length!==allowed.length||Object.keys(value).some(k=>!allowed.includes(k)))throw new TypeError("Save fields");}
function commands(value){
 if(!Array.isArray(value)||value.length>60||value.some(a=>typeof a!=="string"||!Object.hasOwn(directions,a)))throw new TypeError("Save commands");
 return value;
}
function replay(state,actions){
 for(const action of commands(actions)){
  if(state.status!=="playing")throw new TypeError("Actions after end");
  state=advance(state,action).state;
 }
 return state;
}
export function packRun(state){return {levelId:state.levelId,echoes:state.echoes.map(e=>[...e.actions]),actions:[...state.actions],hints:state.hints};}
export function restoreRun(data){
 keys(data,["levelId","echoes","actions","hints"]);getLevel(data.levelId);
 if(!Array.isArray(data.echoes)||data.echoes.length>3||!Number.isInteger(data.hints)||data.hints<0||data.hints>1)throw new TypeError("Save bounds");
 let state=createRun(data.levelId);
 for(const actions of data.echoes)state=sealEcho(replay(state,actions));
 state=replay(state,data.actions);state.hints=data.hints;return state;
}
export function recordWin(records,state){
 if(state.status!=="won"||!levels.some(l=>l.id===state.levelId))return records;
 const next=new Map(records),previous=next.get(state.levelId);
 next.set(state.levelId,{
  best:!previous||evaluate(state).score>evaluate(previous.best).score?structuredClone(state):previous.best,
  independent:!state.hints?structuredClone(state):previous?.independent??null
 });
 return next;
}
export const completedCount=records=>[...records.values()].filter(r=>r.independent).length;
export function encodeSave(state,records){
 const text=JSON.stringify({version:SAVE_VERSION,campaign:CAMPAIGN_VERSION,current:packRun(state),records:[...records.values()].map(r=>({best:packRun(r.best),independent:r.independent?packRun(r.independent):null}))});
 if(text.length>MAX_SAVE_CHARS)throw new RangeError("Save size");return text;
}
export function decodeSave(text){
 if(typeof text!=="string"||text.length>MAX_SAVE_CHARS)throw new TypeError("Save size");
 const data=JSON.parse(text);keys(data,["version","campaign","current","records"]);
 if(data.version!==SAVE_VERSION||data.campaign!==CAMPAIGN_VERSION||!Array.isArray(data.records)||data.records.length>levels.length)throw new TypeError("Save version/bounds");
 const state=restoreRun(data.current),records=new Map();
 for(const item of data.records){
  keys(item,["best","independent"]);
  const best=restoreRun(item.best),independent=item.independent===null?null:restoreRun(item.independent);
  if(best.status!=="won"||!levels.some(l=>l.id===best.levelId)||records.has(best.levelId)||independent&&(independent.status!=="won"||independent.hints||independent.levelId!==best.levelId||evaluate(independent).score>evaluate(best).score))throw new TypeError("Save achievement");
  records.set(best.levelId,{best,independent});
 }
 return {state,records};
}
