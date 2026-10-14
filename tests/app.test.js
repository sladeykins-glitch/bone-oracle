import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {JSDOM} from 'jsdom';import {createOracle} from '../app.js';import {serializeBones,realmAt,BONES} from '../core.js';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function setup(t,{coarse=false,reduce=true,fetch,stored={}}={}){
 const dom=new JSDOM(html,{url:'https://sladeykins-glitch.github.io/bone-oracle/'}),win=dom.window,doc=win.document;
 const gradient={addColorStop(){}},noop=()=>{};const ctx=new Proxy({createRadialGradient:()=>gradient,createLinearGradient:()=>gradient},{get:(obj,key)=>key in obj?obj[key]:noop,set:(obj,key,value)=>(obj[key]=value,true)});
 win.HTMLCanvasElement.prototype.getContext=()=>ctx;win.HTMLCanvasElement.prototype.getBoundingClientRect=()=>({left:0,top:0,width:760,height:760});win.HTMLElement.prototype.scrollIntoView=noop;
 win.matchMedia=query=>({matches:query.includes('reduced-motion')?reduce:query.includes('pointer: coarse')?coarse:query.includes('720px')?coarse:false});
 win.Image=class {complete=false;naturalWidth=0;set src(value){this.url=value;}};
 win.requestAnimationFrame=()=>1;win.cancelAnimationFrame=noop;
 win.fetch=fetch|| (async()=>new Response('',{status:503}));
 for(const [key,value]of Object.entries(stored))win.localStorage.setItem(key,value);
 win.localStorage.setItem('boneOracleUseAI','false');
 const app=createOracle(win);t.after(()=>win.close());return {app,win,doc,click:id=>doc.getElementById(id).click()};
}
test('first render is functional, manual selection is exact, and a full-set cast is journalled',t=>{
 const {app,doc,click}=setup(t);assert.equal(doc.querySelectorAll('#boneSelect button').length,6);assert.equal(doc.querySelectorAll('#counts button').length,5);assert.ok(doc.querySelector('#emptyReading').hidden===false);
 doc.getElementById('question').value='Will Iris return home?';doc.getElementById('context').value='Sanri travels with her.';click('allBones');click('cast');
 assert.equal(app.state.bones.length,6);assert.equal(new Set(app.state.bones.map(b=>b.id)).size,6);assert.equal(app.state.running,false);assert.equal(app.journal.entries.length,1);assert.ok(doc.getElementById('interpretation').textContent.includes('Iris'));assert.ok(app.state.reading.includes('Sanri'));assert.equal(doc.getElementById('cast').disabled,false);assert.equal(doc.getElementById('journalCount').textContent,'1');
});
test('Gemini upgrade animates safely and is saved into the same journal record',async t=>{
 const calls=[];const {app,doc,win,click}=setup(t,{reduce:false,fetch:async(url,options={})=>{calls.push({url,options});return url.endsWith('/config')?Response.json({apiVersion:3,turnstileRequired:false}):Response.json({reading:'The Wolf watches Iris.\n\n<script>alert(1)</script>\n\nReturn if loyalty survives.'});}});
 doc.getElementById('question').value='Will Iris return?';doc.getElementById('context').value='The wind is failing.';app.cast();app.finishCast();const id=app.state.current.id;
 await app.askGemini();assert.equal(app.state.source,'gemini');assert.equal(app.journal.entries.length,1);assert.equal(app.journal.entries[0].id,id);assert.equal(app.journal.entries[0].source,'gemini');assert.ok(doc.querySelector('.ink-reveal'));assert.equal(doc.querySelector('#interpretation script'),null);assert.ok(doc.getElementById('interpretation').textContent.includes('<script>'));
 const payload=JSON.parse(calls.find(c=>c.options.method==='POST').options.body);assert.equal(payload.context,'The wind is failing.');assert.equal(payload.apiVersion,3);assert.ok(payload.bones.every(b=>b.uid));
 click('skipReveal');assert.equal(doc.querySelector('.ink-reveal'),null);assert.equal(doc.getElementById('skipReveal').hidden,true);
});
test('legacy Worker config failure still permits a normal Gemini POST',async t=>{
 const {app}=setup(t,{fetch:async url=>url.endsWith('/config')?new Response('',{status:405}):Response.json({reading:'An old Worker still answers.\n\nThe verdict is conditional.'})});app.cast();await app.askGemini();assert.equal(app.state.source,'gemini');
});
test('Gemini errors, malformed responses and blocked networking leave the offline reading intact',async t=>{
 for(const response of [()=>new Response('',{status:429}),()=>Response.json({reading:''}),()=>{throw Error('Network unavailable');}]){
  const {app,doc}=setup(t,{fetch:async url=>url.endsWith('/config')?new Response('',{status:405}):response()});app.cast();const before=app.state.reading;await app.askGemini();assert.equal(app.state.source,'offline');assert.equal(app.state.reading,before);assert.ok(doc.getElementById('aiStatus').textContent.includes('offline reading'));
 }
});
test('new casts and reset invalidate late Gemini replies without overwriting the journal',async t=>{
 let resolvePost;const {app,doc,click}=setup(t,{fetch:async url=>url.endsWith('/config')?Response.json({apiVersion:3,turnstileRequired:false}):new Promise(resolve=>{resolvePost=resolve;})});
 app.cast();const firstId=app.state.current.id,pending=app.askGemini();await flush();assert.ok(resolvePost);click('clear');resolvePost(Response.json({reading:'STALE PROPHECY'}));await pending;assert.equal(app.state.bones.length,0);assert.equal(doc.getElementById('interpretation').textContent,'');assert.equal(app.journal.entries.find(e=>e.id===firstId).source,'offline');
});
test('the question and context are frozen for each cast while Gemini is in flight',async t=>{
 let resolvePost,payload;const {app,doc}=setup(t,{fetch:async(url,options)=>url.endsWith('/config')?Response.json({apiVersion:3,turnstileRequired:false}):new Promise(resolve=>{payload=JSON.parse(options.body);resolvePost=resolve;})});doc.getElementById('question').value='Original question';doc.getElementById('context').value='Original context';app.cast();const pending=app.askGemini();await flush();doc.getElementById('question').value='Changed question';doc.getElementById('context').value='Changed context';resolvePost(Response.json({reading:'A remembered omen.\n\nIts answer is conditional.'}));await pending;assert.equal(payload.question,'Original question');assert.equal(payload.context,'Original context');assert.equal(app.journal.entries[0].question,'Original question');assert.equal(doc.getElementById('readingIntro').textContent,'“Original question”');
});
test('each specimen can be physically placed in Hidden, with no additional API call',t=>{
 let calls=0;const {app,doc,win,click}=setup(t,{fetch:async()=>{calls++;return new Response('',{status:503});}});click('allBones');app.cast();
 for(const def of BONES){const row=[...doc.querySelectorAll('.bone-row')].find(row=>row.textContent.includes(def.name));row.click();const selected=app.state.selected;doc.getElementById('moveRealm').value='Hidden';doc.getElementById('moveRealm').dispatchEvent(new win.Event('change'));assert.equal(realmAt(selected.x,selected.y),'Hidden',def.name);}
 assert.equal(calls,0);assert.equal(app.journal.entries.length,1);assert.equal(app.journal.entries[0].amended,true);
});
test('mobile cloth permits scrolling until Move bones is enabled; keyboard movement updates the omen',t=>{
 const {app,doc,win}=setup(t,{coarse:true});assert.equal(doc.getElementById('arrange').checked,false);assert.equal(doc.getElementById('mat').classList.contains('arranging'),false);app.cast();doc.querySelector('.bone-row').click();const before=serializeBones(app.state.bones);doc.getElementById('mat').dispatchEvent(new win.KeyboardEvent('keydown',{key:'ArrowDown',shiftKey:true,bubbles:true,cancelable:true}));assert.notDeepEqual(serializeBones(app.state.bones),before);assert.equal(app.journal.entries[0].amended,true);
 doc.getElementById('arrange').checked=true;doc.getElementById('arrange').dispatchEvent(new win.Event('change'));assert.equal(doc.getElementById('mat').classList.contains('arranging'),true);
});
test('restoring the journal preserves exact placement and does not contact Gemini',t=>{
 let calls=0;const {app,doc,click}=setup(t,{fetch:async()=>{calls++;return Response.json({reading:'test'});}});app.cast();const entry=structuredClone(app.journal.entries[0]),positions=serializeBones(app.state.bones);click('clear');app.restoreEntry(entry);assert.deepEqual(serializeBones(app.state.bones),positions);assert.equal(app.state.reading,entry.reading);assert.equal(calls,0);click('openJournal');assert.equal(doc.querySelectorAll('.journal-entry').length,1);doc.querySelector('.journal-actions button:last-child').click();assert.equal(app.journal.entries.length,0);doc.querySelector('#journalNotice button').click();assert.equal(app.journal.entries.length,1);
});
test('hostile journal content is rendered as literal text, including questions and notes',t=>{
 const {app,doc,click}=setup(t);doc.getElementById('question').value='<img src=x onerror=alert(1)>';app.cast();click('openJournal');assert.equal(doc.querySelector('#journalEntries h3 img'),null);assert.ok(doc.querySelector('#journalEntries h3').textContent.includes('<img'));assert.equal(doc.querySelector('#interpretation img'),null);
});
test('unsafe endpoint changes are rejected without replacing the saved endpoint',t=>{
 const {doc,win,click}=setup(t);click('openSettings');doc.getElementById('apiUrl').value='https://user:secret@example.com/?key=secret';click('saveSettings');assert.ok(doc.getElementById('settingsStatus').textContent.includes('credentials'));assert.equal(win.localStorage.getItem('boneOracleAiEndpoint'),null);
});
