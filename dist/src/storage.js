import {decodeSave,encodeSave} from "./save.js";
export const SAVE_KEY="echo-vault-save-v1";
// Only this adapter obtains browser storage. Other modules accept this boundary.
export function browserStorage(){try{return globalThis.localStorage;}catch{return null;}}
export function loadSave(storage){
 if(!storage)return {status:"unavailable"};
 try{const raw=storage.getItem(SAVE_KEY);return raw===null?{status:"empty"}:{status:"saved",...decodeSave(raw)};}
 catch{return {status:"invalid"};}
}
export function writeSave(storage,state,records){
 try{if(!storage)return false;const raw=encodeSave(state,records);storage.setItem(SAVE_KEY,raw);return storage.getItem(SAVE_KEY)===raw;}catch{return false;}
}
export function clearSave(storage){try{if(!storage)return false;storage.removeItem(SAVE_KEY);return true;}catch{return false;}}
