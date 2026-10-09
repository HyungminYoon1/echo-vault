export const PROGRESS_KEY="web-lab-progress-v1";
export const APP_IDS=Object.freeze(["data-mirage","echo-vault","light-route","logic-foundry","neon-tactics","orbit-courier","packet-journey","parcel-panic","pixel-kitchen","pocket-city","route-race","sense-lab","swarm-garden","think-forge","traffic-lab"]);
const own="echo-vault",MAX_CHARS=8192;
const isObject=v=>v!==null&&typeof v==="object"&&!Array.isArray(v);
function validEntry(value){
 return isObject(value)&&Object.keys(value).length===3&&Number.isInteger(value.completed)&&Number.isInteger(value.total)&&value.completed>=0&&value.completed<=value.total&&value.total<=1000&&typeof value.updatedAt==="string"&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value.updatedAt)&&Number.isFinite(Date.parse(value.updatedAt))&&new Date(value.updatedAt).toISOString()===value.updatedAt;
}
export function readProgress(raw){
 if(raw===null)return {version:1,apps:{}};
 if(typeof raw!=="string"||raw.length>MAX_CHARS)throw new TypeError("Summary size");
 const data=JSON.parse(raw);
 if(!isObject(data)||Object.keys(data).length!==2||data.version!==1||!isObject(data.apps)||Object.keys(data.apps).length>15)throw new TypeError("Summary schema");
 for(const [id,value] of Object.entries(data.apps))if(!APP_IDS.includes(id)||!validEntry(value))throw new TypeError("Summary entry");
 return data;
}
export function reportProgress(storage,completed,total,now=()=>new Date().toISOString()){
 try{
  if(!storage)return false;
  const data=readProgress(storage.getItem(PROGRESS_KEY)),old=data.apps[own];
  if(old?.completed===completed&&old?.total===total)return true;
  const entry={completed,total,updatedAt:now()};if(!validEntry(entry))return false;
  data.apps[own]=entry;storage.setItem(PROGRESS_KEY,JSON.stringify(data));return true;
 }catch{return false;}
}
export function clearProgress(storage){
 try{if(!storage)return false;const data=readProgress(storage.getItem(PROGRESS_KEY));if(!Object.hasOwn(data.apps,own))return true;delete data.apps[own];storage.setItem(PROGRESS_KEY,JSON.stringify(data));return true;}catch{return false;}
}
