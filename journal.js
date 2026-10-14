import {serializeBones,restoreBones} from './core.js?v=3.0.0';
export const JOURNAL_KEY='boneOracleJournalV3';
export const JOURNAL_LIMIT=100;
export function safeGet(storage,key,fallback=''){try{return storage.getItem(key)??fallback;}catch{return fallback;}}
export function safeSet(storage,key,value){try{storage.setItem(key,value);return true;}catch{return false;}}
function bounded(value,max,label){if(typeof value!=='string'||value.length>max)throw Error('Invalid '+label+'.');return value;}
export function validateEntry(entry){
 if(!entry||typeof entry!=='object'||Array.isArray(entry))throw Error('Invalid journal entry.');
 if(typeof entry.id!=='string'||!/^[a-zA-Z0-9-]{1,70}$/.test(entry.id))throw Error('Invalid journal ID.');
 if(typeof entry.created!=='string'||!Number.isFinite(Date.parse(entry.created)))throw Error('Invalid journal date.');
 const bones=serializeBones(restoreBones(entry.bones));
 return {id:entry.id,created:new Date(entry.created).toISOString(),question:bounded(entry.question,1000,'question'),context:bounded(entry.context??'',2000,'context'),
 bones,reading:bounded(entry.reading,16000,'reading'),source:entry.source==='gemini'?'gemini':'offline',notes:bounded(entry.notes??'',4000,'notes'),starred:entry.starred===true,amended:entry.amended===true};
}
export class CastingJournal{
 constructor(storage){this.storage=storage;this.entries=[];this.error='';
  try{const value=safeGet(storage,JOURNAL_KEY,'[]'),entries=JSON.parse(value);if(!Array.isArray(entries)||entries.length>JOURNAL_LIMIT)throw Error('Invalid saved journal.');this.entries=entries.map(validateEntry);}
  catch{this.error='The saved journal could not be read. New casts can still be kept in this session.';}
 }
 persist(){return safeSet(this.storage,JOURNAL_KEY,JSON.stringify(this.entries));}
 upsert(entry){const valid=validateEntry(entry),previous=this.entries.find(e=>e.id===valid.id);
  if(previous){valid.notes=previous.notes;valid.starred=previous.starred;}
  this.entries=[valid,...this.entries.filter(e=>e.id!==valid.id)].sort((a,b)=>b.created.localeCompare(a.created)).slice(0,JOURNAL_LIMIT);
  return this.persist();
 }
 update(id,patch){const entry=this.entries.find(e=>e.id===id);if(!entry)return false;Object.assign(entry,validateEntry({...entry,...patch}));return this.persist();}
 remove(id){const entry=this.entries.find(e=>e.id===id);this.entries=this.entries.filter(e=>e.id!==id);this.persist();return entry;}
 restore(entry){return this.upsert(entry);}
 export(){return JSON.stringify({app:'Bone Oracle',version:3,entries:this.entries},null,2);}
 import(text){if(typeof text!=='string'||text.length>3000000)throw Error('Choose a journal backup smaller than 3 MB.');
  let parsed;try{parsed=JSON.parse(text);}catch{throw Error('This file is not valid JSON.');}
  if(parsed?.app!=='Bone Oracle'||parsed.version!==3||!Array.isArray(parsed.entries)||parsed.entries.length>JOURNAL_LIMIT)throw Error('Choose a Version 3 Bone Oracle journal backup.');
  const imported=parsed.entries.map(validateEntry),seen=new Set();for(const e of imported){if(seen.has(e.id))throw Error('The backup contains duplicate journal IDs.');seen.add(e.id);}
  const merged=[...this.entries,...imported.filter(e=>!this.entries.some(p=>p.id===e.id))].sort((a,b)=>b.created.localeCompare(a.created));
  if(merged.length>JOURNAL_LIMIT)throw Error('This import would exceed 100 entries. Export a backup and remove some entries first.');
  this.entries=merged;if(!this.persist())throw Error('The imported journal is available in this session, but browser storage is full or unavailable.');
  return imported.length;
 }
}
