import test from 'node:test';import assert from 'node:assert/strict';
import {CastingJournal,JOURNAL_KEY} from '../journal.js';import {createCast,serializeBones} from '../core.js';
const storage=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),data};};
const record=(id='cast-one')=>({id,created:'2026-10-14T21:00:00.000Z',question:'Will we return?',context:'The forest is awakening.',bones:serializeBones(createCast(2,null,()=>.5)),reading:'An omen.\n\nReturn if the path remains open.',source:'offline',notes:'',starred:false,amended:false});
test('journal persists across reloads and AI upgrades preserve notes and favourites',()=>{
 const s=storage(),j=new CastingJournal(s);assert.equal(j.upsert(record()),true);j.update('cast-one',{notes:'We returned.',starred:true});j.upsert({...record(),reading:'The Gemini prophecy.',source:'gemini'});
 const reloaded=new CastingJournal(s);assert.equal(reloaded.entries.length,1);assert.equal(reloaded.entries[0].notes,'We returned.');assert.equal(reloaded.entries[0].starred,true);assert.equal(reloaded.entries[0].source,'gemini');
});
test('export/import roundtrip is lossless and merging does not overwrite existing entries',()=>{
 const a=new CastingJournal(storage());a.upsert(record());a.update('cast-one',{notes:'Outcome known.'});const b=new CastingJournal(storage());assert.equal(b.import(a.export()),1);assert.deepEqual(b.entries,a.entries);
 const old=new CastingJournal(storage());old.upsert({...record(),notes:'Old backup.'});b.import(old.export());assert.equal(b.entries[0].notes,'Outcome known.');
});
test('malformed and hostile imports cannot mutate a saved journal',()=>{
 const j=new CastingJournal(storage());j.upsert(record());const before=j.export();
 for(const text of ['<script>alert(1)</script>','{}',JSON.stringify({app:'Bone Oracle',version:3,entries:[{...record(),bones:[{id:'unknown'}]}]}),JSON.stringify({app:'Bone Oracle',version:3,entries:[record(),record()]})]){assert.throws(()=>j.import(text));assert.equal(j.export(),before);}
 const markup={...record('cast-two'),question:'<img src=x onerror=alert(1)>'};j.import(JSON.stringify({app:'Bone Oracle',version:3,entries:[markup]}));assert.equal(j.entries.find(e=>e.id==='cast-two').question,markup.question);
});
test('a removed entry can be restored and the journal stays bounded',()=>{
 const j=new CastingJournal(storage());j.upsert(record());const deleted=j.remove('cast-one');assert.equal(j.entries.length,0);j.restore(deleted);assert.equal(j.entries.length,1);
 for(let i=0;i<110;i++)j.upsert({...record('entry-'+i),created:new Date(Date.UTC(2026,9,14,0,i)).toISOString()});assert.equal(j.entries.length,100);
});
test('restricted or corrupt storage leaves the Oracle functional',()=>{
 const inaccessible={getItem:()=>{throw Error('Denied');},setItem:()=>{throw Error('Denied');}};const j=new CastingJournal(inaccessible);assert.equal(j.upsert(record()),false);assert.equal(j.entries.length,1);assert.ok(j.export().includes('Will we return?'));
 const s=storage();s.setItem(JOURNAL_KEY,'not json');const corrupt=new CastingJournal(s);assert.ok(corrupt.error);assert.equal(corrupt.entries.length,0);
});
