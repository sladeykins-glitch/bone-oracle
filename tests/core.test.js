import test from 'node:test';
import assert from 'node:assert/strict';
import {BONES,FIELD,realmAt,positionBand,dieRoll,createCast,makeBody,stepPhysics,isSettled,collision,vertices,analyseCast,detectFormation,serializeBones,restoreBones,castPayload,offlineReading,validateEndpoint} from '../core.js';
function random(seed){return ()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);}
function body(id,x,y,intensity=1,angle=0,uid=id){const b=makeBody(BONES.find(b=>b.id===id),0,()=>.5);Object.assign(b,{x,y,intensity,angle,uid});return b;}
test('original six specimen names, dice and all six realm meanings are preserved',()=>{
 assert.deepEqual(BONES.map(b=>[b.id,b.die]),[['raven',4],['wolf',6],['serpent',8],['deer',10],['owl',12],['ancestor',20]]);
 for(const b of BONES)assert.deepEqual(Object.keys(b.zones).sort(),['Flesh','Future','Hidden','Past','Present','Spirits']);
 const placements=[[380,380,'Present'],[160,380,'Past'],[380,160,'Spirits'],[600,380,'Future'],[380,600,'Flesh'],[60,380,'Hidden']];
 for(const[x,y,realm]of placements)assert.equal(realmAt(x,y),realm);
 assert.equal(realmAt(380+107,380),'Future');assert.equal(realmAt(380+310,380),'Future');assert.equal(realmAt(380+310.01,380),'Hidden');
});
test('d6 random selection permits repeated bones and die intensity stays in range',()=>{
 assert.equal(dieRoll(20,()=>0),1);assert.equal(dieRoll(20,()=>.999999),20);
 const repeated=createCast(6,null,()=>.1);assert.equal(new Set(repeated.map(b=>b.id)).size,1);assert.equal(new Set(repeated.map(b=>b.uid)).size,6);
 for(let seed=0;seed<100;seed++)for(const b of createCast(6,null,random(seed)))assert.ok(b.intensity>=1&&b.intensity<=b.die);
 assert.throws(()=>createCast(1));assert.throws(()=>createCast(7));
});
test('manual selection casts every selected specimen once, including the full six',()=>{
 const cast=createCast(4,BONES.map(b=>b.id),random(42));assert.equal(cast.length,6);assert.deepEqual(cast.map(b=>b.id),BONES.map(b=>b.id));
 assert.deepEqual(createCast(6,['wolf','deer'],random(3)).map(b=>b.id),['wolf','deer']);assert.throws(()=>createCast(4,['owl']));
});
test('200 seeded casts settle, retain their rolls, stay within the rim, and never overlap',()=>{
 let hidden=0,present=0;
 for(let seed=1;seed<=200;seed++){
  const bones=createCast(2+(seed%5),null,random(seed)),before=bones.map(b=>[b.uid,b.id,b.intensity]);let tick=0;
  for(;tick<1440;tick++){stepPhysics(bones,1/120);if(tick>168&&isSettled(bones))break;}
  assert.ok(tick<1440,'Cast '+seed+' did not settle');assert.deepEqual(bones.map(b=>[b.uid,b.id,b.intensity]),before);
  for(const b of bones){assert.ok([b.x,b.y,b.vx,b.vy,b.angle,b.av,b.z,b.vz].every(Number.isFinite));assert.equal(b.z,0);for(const p of vertices(b))assert.ok(Math.hypot(p.x-380,p.y-380)<=FIELD.rim+.2);if(realmAt(b.x,b.y)==='Hidden')hidden++;if(realmAt(b.x,b.y)==='Present')present++;}
  for(let i=0;i<bones.length;i++)for(let j=i+1;j<bones.length;j++)assert.ok((collision(bones[i],bones[j])?.depth||0)<.1,'overlap at seed '+seed);
 }
 assert.ok(hidden>5,'The Hidden realm should remain physically reachable');assert.ok(present>5,'The Present realm should remain physically reachable');
});
test('off-centre impact changes angular momentum and touching uses specimen geometry',()=>{
 const a=body('deer',325,380,5),b=body('ancestor',396,386,10);a.vx=120;b.vx=-30;const before=a.av+b.av;stepPhysics([a,b],1/120);assert.notEqual(a.av+b.av,before);
 const one=body('deer',380,380),two=body('deer',380,420);assert.equal(collision(one,two,5),null,'thin ribs should not have circular contact hulls');
 const overlap=body('deer',380,380);stepPhysics([one,overlap],0);assert.ok([one.x,one.y,overlap.x,overlap.y].every(Number.isFinite),'coincident bones cannot produce NaN');
});
test('nearest-to-centre and strongest intensity remain distinct; Raven pointing is directional',()=>{
 const bones=[body('wolf',385,380,1),body('ancestor',600,380,20),body('raven',450,380,3,0),body('deer',530,380,6)];
 const p=analyseCast(bones);assert.equal(p.closest.id,'wolf');assert.equal(p.sorted[0].id,'ancestor');assert.ok(p.pointed.some(([,b])=>b.id==='deer'));
 bones[2].angle=Math.PI;assert.equal(analyseCast(bones).pointed.some(([,b])=>b.id==='deer'),false);
 assert.equal(positionBand(bones[0]),'immediate');
});
test('path, circle and cross heuristics require visible geometric evidence',()=>{
 const layout=points=>points.map(([x,y],i)=>body('wolf',x,y,3,0,'bone-'+i));
 assert.equal(detectFormation(layout([[200,380],[380,380],[560,380]])),'Path');
 assert.equal(detectFormation(layout([[280,280],[480,280],[480,480],[280,480]])),'Circle');
 assert.equal(detectFormation(layout([[260,380],[500,380],[380,260],[380,500]])),'Cross');
 assert.equal(detectFormation(layout([[380,380],[410,385]])),null);
});
test('save/restore preserves exact coordinates, rolls and occurrence identities',()=>{
 const bones=createCast(4,null,random(99));for(let i=0;i<1000;i++)stepPhysics(bones,1/120);
 assert.deepEqual(serializeBones(restoreBones(serializeBones(bones))),serializeBones(bones));
 const invalid=serializeBones(bones);invalid[0].intensity=99;assert.throws(()=>restoreBones(invalid));
 const duplicated=serializeBones(bones);duplicated[1].uid=duplicated[0].uid;assert.throws(()=>restoreBones(duplicated));
});
test('contextual offline reading names the actual question and facts; AI payload stays bounded',()=>{
 const bones=[body('wolf',600,380,6),body('deer',385,380,4)];const question='Will Iris return home?',context='Iris has promised to protect Sanri.';
 const reading=offlineReading(bones,question,context);assert.ok(reading.paragraphs.join(' ').includes(question));assert.ok(reading.paragraphs.join(' ').includes(context));assert.ok(reading.ending.includes('return safely'));
 const payload=castPayload(bones,question,context);assert.equal(payload.apiVersion,3);assert.equal(payload.context,context);assert.equal(payload.bones[0].realm,'Future');assert.equal(payload.bones[0].intensity,6);assert.equal(payload.bones[0].uid,'wolf');
});
test('endpoint settings reject secrets, unsafe protocols, and local hosts',()=>{
 assert.equal(validateEndpoint('https://example.workers.dev/'),'https://example.workers.dev');
 for(const value of ['http://example.com','javascript:alert(1)','https://user:password@example.com','https://example.com/?key=secret','https://localhost','https://127.0.0.1'])assert.throws(()=>validateEndpoint(value));
});

test('manual casts rotate the starting spread so bone identity does not predetermine realm',()=>{
 const withAngle=value=>{let initial=true;return ()=>{if(initial){initial=false;return value;}return .5;};};
 const a=createCast(6,BONES.map(b=>b.id),withAngle(0)),b=createCast(6,BONES.map(b=>b.id),withAngle(.35));
 for(let i=0;i<1000;i++){stepPhysics(a,1/120);stepPhysics(b,1/120);}
 assert.notDeepEqual(a.map(x=>realmAt(x.x,x.y)),b.map(x=>realmAt(x.x,x.y)));
 assert.deepEqual(a.map(x=>x.intensity),b.map(x=>x.intensity));
});
