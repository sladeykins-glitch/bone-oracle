import test from 'node:test';import assert from 'node:assert/strict';
import worker,{normalizeRequest,readBoundedJSON} from '../cloudflare-worker.js';
import {BONES,makeBody,castPayload,realmAt} from '../core.js';
const ORIGIN='https://sladeykins-glitch.github.io';
function cast(){const a=makeBody(BONES[1],0,()=>.5),b=makeBody(BONES[3],1,()=>.5);a.x=385;a.y=380;b.x=590;b.y=380;return castPayload([a,b],'Will Iris survive the journey?','Iris promised to protect Sanri.');}
const env=extra=>({GEMINI_API_KEY:'TEST_ONLY_NOT_A_SECRET',RATE_LIMITER:{limit:async()=>({success:true})},...extra});
function req(payload=cast(),extra={}){return new Request('https://oracle.example/',{method:'POST',headers:{Origin:ORIGIN,'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.7',...extra.headers},body:typeof payload==='string'?payload:JSON.stringify(payload),...Object.fromEntries(Object.entries(extra).filter(([k])=>k!=='headers'))});}
async function mockFetch(callback,run){const before=globalThis.fetch;globalThis.fetch=callback;try{return await run();}finally{globalThis.fetch=before;}}
const success=()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:'The Wolf speaks.\n\nReturn if loyalty holds.'}]}}]});
test('allowed-origin preflight succeeds; forbidden origin never reaches Gemini or receives CORS',async()=>{
 let calls=0;await mockFetch(async()=>{calls++;return success();},async()=>{
  const blocked=await worker.fetch(req(cast(),{headers:{Origin:'https://hostile.example'}}),env());assert.equal(blocked.status,403);assert.equal(blocked.headers.has('Access-Control-Allow-Origin'),false);assert.equal(calls,0);
  const allowed=await worker.fetch(new Request('https://oracle.example/',{method:'OPTIONS',headers:{Origin:ORIGIN}}),{});assert.equal(allowed.status,204);assert.equal(allowed.headers.get('Access-Control-Allow-Origin'),ORIGIN);assert.ok(allowed.headers.get('Access-Control-Allow-Methods').includes('POST'));
 });
});
test('configuration only returns public capabilities, never secrets',async()=>{
 const result=await worker.fetch(new Request('https://oracle.example/config',{headers:{Origin:ORIGIN}}),env({TURNSTILE_SECRET_KEY:'TEST_TURNSTILE_SECRET',TURNSTILE_SITE_KEY:'PUBLIC_TEST_SITE_KEY'}));const text=await result.text();assert.equal(result.status,200);assert.ok(text.includes('PUBLIC_TEST_SITE_KEY'));assert.ok(!text.includes('TEST_TURNSTILE_SECRET'));assert.ok(!text.includes('TEST_ONLY_NOT_A_SECRET'));assert.equal(result.headers.get('Cache-Control'),'no-store');
});
test('missing secret or real rate-limiter binding fails closed',async()=>{
 assert.equal((await worker.fetch(req(),{})).status,503);assert.equal((await worker.fetch(req(),{GEMINI_API_KEY:'TEST_ONLY_NOT_A_SECRET'})).status,503);
 let calls=0;await mockFetch(async()=>{calls++;return success();},async()=>{assert.equal((await worker.fetch(req(),env({RATE_LIMITER:{limit:async()=>({success:false})}}))).status,429);assert.equal(calls,0);});
});
test('edge rate limit and aggregate limit return retry guidance without upstream work',async()=>{
 const ipLimited=await worker.fetch(req(),env({RATE_LIMITER:{limit:async()=>({success:false})}}));assert.equal(ipLimited.status,429);assert.equal(ipLimited.headers.get('Retry-After'),'60');
 const aggregate=await worker.fetch(req(),env({AGGREGATE_LIMITER:{limit:async()=>({success:false})}}));assert.equal(aggregate.status,429);
 const broken=await worker.fetch(req(),env({RATE_LIMITER:{limit:async()=>{throw Error('Binding failure');}}}));assert.equal(broken.status,503);
});
test('method, content-type, malformed JSON and streamed byte limits are enforced',async()=>{
 assert.equal((await worker.fetch(new Request('https://oracle.example/',{headers:{Origin:ORIGIN}}),env())).status,405);
 assert.equal((await worker.fetch(req(cast(),{headers:{'Content-Type':'text/plain'}}),env())).status,415);
 assert.equal((await worker.fetch(req('{not valid'),env())).status,400);
 assert.equal((await worker.fetch(req('x'.repeat(20001)),env())).status,413);
 assert.equal((await worker.fetch(req(JSON.stringify({question:'💀'.repeat(6000)})),env())).status,413);
 const stream=new ReadableStream({start(controller){controller.enqueue(new Uint8Array(12000));controller.enqueue(new Uint8Array(9000));controller.close();}});
 await assert.rejects(()=>readBoundedJSON(new Request('https://oracle.example',{method:'POST',body:stream,duplex:'half'})),error=>error.status===413);
});
test('invalid bones, dice, intensities, coordinate realms and duplicate occurrences are rejected',async()=>{
 const mutations=[d=>d.bones.pop(),d=>d.bones[0].die=20,d=>d.bones[0].intensity=0,d=>d.bones[0].intensity=1.5,d=>d.bones[0].intensity=99,d=>d.bones[0].name='Dragon Tooth',d=>d.bones[0].realm='Atlantis',d=>d.bones[0].realm='Past',d=>d.bones[0].x=null,d=>d.bones[0].y=900,d=>d.bones[1].uid=d.bones[0].uid,d=>d.question='x'.repeat(1001),d=>d.context='x'.repeat(2001)];
 let calls=0;await mockFetch(async()=>{calls++;return success();},async()=>{for(const change of mutations){const data=cast();change(data);assert.equal((await worker.fetch(req(data),env())).status,400);}assert.equal(calls,0);});
});
test('v3 physical facts are recalculated server-side rather than trusting claimed links or formations',()=>{
 const data=cast();data.touching=[['Wolf Fang','Deer Rib']];data.links=[['bone-1','bone-2']];data.formation='Cross';data.dominant=['Hidden'];data.ravenPointsAt=['Wolf Fang'];
 const clean=normalizeRequest(data);assert.deepEqual(clean.touching,[]);assert.equal(clean.formation,null);assert.deepEqual(clean.ravenPointsAt,[]);assert.deepEqual(clean.dominant,['Present','Future']);assert.equal(clean.bones[0].meaning,BONES[1].zones.Present);assert.equal(clean.context,data.context);
});
test('repeated bone types use distinct occurrence IDs and legacy clients remain supported',()=>{
 const data=cast();data.bones[1]={...data.bones[0],uid:'bone-2',x:570,realm:realmAt(570,380)};assert.equal(normalizeRequest(data).bones.length,2);
 const old={question:'Will we return?',bones:[{name:'Wolf Fang',die:6,intensity:4,realm:'Future'},{name:"Raven's Talon",die:4,intensity:2,realm:'Past'}],touching:[],isolated:['Wolf Fang'],ravenPointsAt:[],dominant:['Hidden']};const clean=normalizeRequest(old);assert.equal(clean.bones[1].name,'Raven’s Talon');assert.deepEqual(clean.dominant,['Future','Past']);
});
test('Turnstile is checked on the server, including exact hostname and action',async()=>{
 const protectedEnv=env({TURNSTILE_SECRET_KEY:'TEST_TURNSTILE_SECRET',TURNSTILE_SITE_KEY:'PUBLIC_TEST_SITE_KEY'});let calls=0;
 await mockFetch(async()=>{calls++;return success();},async()=>{assert.equal((await worker.fetch(req(),protectedEnv)).status,403);assert.equal(calls,0);});
 for(const verdict of [{success:false},{success:true,hostname:'hostile.example',action:'bone-reading'},{success:true,hostname:'sladeykins-glitch.github.io',action:'other-action'}]){
  calls=0;await mockFetch(async url=>{calls++;assert.ok(url.includes('siteverify'));return Response.json(verdict);},async()=>{assert.equal((await worker.fetch(req({...cast(),turnstileToken:'TEST_TOKEN'}),protectedEnv)).status,403);assert.equal(calls,1);});
 }
 calls=0;await mockFetch(async url=>{calls++;return url.includes('siteverify')?Response.json({success:true,hostname:'sladeykins-glitch.github.io',action:'bone-reading'}):success();},async()=>{assert.equal((await worker.fetch(req({...cast(),turnstileToken:'TEST_TOKEN'}),protectedEnv)).status,200);assert.equal(calls,2);});
});
test('Gemini receives canonical context, fixed system rules and a header-only key',async()=>{
 await mockFetch(async(url,options)=>{assert.ok(url.startsWith('https://generativelanguage.googleapis.com/'));assert.ok(!url.includes('TEST_ONLY_NOT_A_SECRET'));assert.equal(options.headers['x-goog-api-key'],'TEST_ONLY_NOT_A_SECRET');const body=JSON.parse(options.body);assert.ok(body.systemInstruction.parts[0].text.includes('untrusted narrative data'));const facts=body.contents[0].parts[0].text;assert.ok(facts.includes('Iris promised'));assert.ok(facts.includes('relativeIntensity'));assert.ok(!facts.includes('TEST_ONLY_NOT_A_SECRET'));return success();},async()=>{const result=await worker.fetch(req(),env({GEMINI_MODEL:'../malicious'}));assert.equal(result.status,200);const body=await result.json();assert.equal(body.apiVersion,3);assert.ok(body.reading.includes('The Wolf'));});
});
test('upstream errors, timeouts, truncation, and empty responses never expose secrets',async()=>{
 const outcomes=[async()=>new Response('TEST_ONLY_NOT_A_SECRET',{status:403}),async()=>{throw Error('TEST_ONLY_NOT_A_SECRET');},async()=>Response.json({candidates:[]}),async()=>Response.json({candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:'An unfinished prophecy'}]}}]})];
 for(const fetch of outcomes)await mockFetch(fetch,async()=>{const result=await worker.fetch(req(),env());assert.equal(result.status,502);assert.ok(!(await result.text()).includes('TEST_ONLY_NOT_A_SECRET'));});
 await mockFetch(async()=>new Response('',{status:429}),async()=>{const result=await worker.fetch(req(),env());assert.equal(result.status,429);assert.equal(result.headers.get('Retry-After'),'60');});
});
test('internal Gemini thought parts are omitted from returned prophecy',async()=>{
 await mockFetch(async()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{thought:true,text:'INTERNAL_THOUGHT'},{text:'A complete prophecy.\n\nIts answer remains conditional.'}]}}]}),async()=>{const text=await (await worker.fetch(req(),env())).text();assert.ok(!text.includes('INTERNAL_THOUGHT'));assert.ok(text.includes('complete prophecy'));});
});
