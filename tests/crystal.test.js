import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {createCrystal,crystalOutcome} from '../crystal.js';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');

function setup(t){
 const dom=new JSDOM(html),win=dom.window,doc=win.document,pending=new Map(),spoken=[];
 let id=0,animation=true,reduce=false;
 win.setTimeout=(fn,delay)=>{pending.set(++id,{fn,delay});return id;};
 win.clearTimeout=id=>pending.delete(id);
 const crystal=createCrystal(win,{animated:()=>animation,reduced:()=>reduce,announce:message=>spoken.push(message)});
 t.after(()=>{pending.clear();win.close();});
 return {crystal,doc,pending,spoken,click:id=>doc.getElementById(id).click(),animation:value=>animation=value,reduce:value=>reduce=value};
}

test('the crystal presents the existing final omen without changing its meaning',()=>{
 const text='The full interpretation remains below.\n\nConditional Verdict: Return only if the bridge holds.';
 assert.equal(crystalOutcome(text),'Return only if the bridge holds.');
 assert.equal(crystalOutcome('Detail.\n\n**Conditional Verdict:** Trust the quieter voice.'),'Trust the quieter voice.');
 assert.equal(crystalOutcome('Detail.\n\n**A choice remains.**'),'A choice remains.');
 assert.equal(crystalOutcome(''),'');
});

test('words emerge with bounded staggered timing, remain safe text, and can be revealed immediately',t=>{
 const h=setup(t),text='Return if <img src=x onerror=alert(1)> survives.';
 h.crystal.show('Full reading.\n\n'+text,'gemini',true);
 assert.equal(h.doc.getElementById('crystalText').textContent,text);
 assert.equal(h.doc.querySelector('#crystalText img'),null);
 const words=[...h.doc.querySelectorAll('#crystalText .ink-reveal')];assert.ok(words.length>3);
 assert.notEqual(words[0].style.getPropertyValue('--delay'),words[1].style.getPropertyValue('--delay'));
 assert.equal(h.doc.getElementById('crystalScreen').getAttribute('aria-busy'),'true');
 assert.ok([...h.pending.values()][0].delay<6500);
 h.click('skipReveal');assert.equal(h.doc.querySelector('.ink-reveal'),null);assert.equal(h.pending.size,0);
 assert.equal(h.doc.getElementById('crystalScreen').getAttribute('aria-busy'),'false');
 assert.equal(h.doc.getElementById('skipReveal').hidden,true);assert.equal(h.spoken.length,1);
});

test('enlarging, replaying, and closing use the same omen and leave no hidden animation running',t=>{
 const h=setup(t);h.crystal.show('A remembered interpretation.\n\nMercy opens the way.','offline',false);
 assert.equal(h.doc.querySelector('.ink-reveal'),null);
 h.click('enlargeCrystal');assert.equal(h.doc.getElementById('crystalDialog').open,true);
 assert.equal(h.doc.getElementById('crystalDialogText').textContent,'Mercy opens the way.');
 assert.ok(h.doc.querySelector('#crystalDialogText .ink-reveal'));
 h.click('crystalDialogSkip');assert.equal(h.doc.querySelector('.ink-reveal'),null);
 h.click('crystalDialogReplay');assert.ok(h.doc.querySelector('.ink-reveal'));
 h.click('closeCrystal');assert.equal(h.doc.getElementById('crystalDialog').open,false);assert.equal(h.pending.size,0);
 assert.equal(h.doc.querySelector('.ink-reveal'),null);assert.equal(h.doc.getElementById('crystalText').textContent,'Mercy opens the way.');
});

test('reduced motion and the animation preference take effect on casts and replays',t=>{
 const h=setup(t);
 for(const mode of ['reduce','animation']){
  h.reduce(mode==='reduce');h.animation(mode!=='animation');
  h.crystal.show('The same omen.','gemini',true);h.click('replayCrystal');h.click('enlargeCrystal');
  assert.equal(h.doc.querySelector('.ink-reveal'),null);assert.equal(h.pending.size,0);
  assert.equal(h.doc.getElementById('skipReveal').hidden,true);h.click('closeCrystal');
 }
});

test('long provider replies remain complete without creating excessive word animations',t=>{
 const h=setup(t),text=Array(240).fill('Remember').join(' ')+' <script>neverRun()</script>';
 h.crystal.show(text,'gemini',true);
 assert.equal(h.doc.getElementById('crystalText').textContent,text);
 assert.equal(h.doc.querySelectorAll('#crystalText .ink-reveal').length,1);
 assert.equal(h.doc.querySelector('#crystalText script'),null);
 assert.equal(h.doc.getElementById('crystalScreen').dataset.length,'long');
});

test('new casts and reset cancel the previous reveal, clear the enlarged view, and prevent stale inscriptions',t=>{
 const h=setup(t);h.crystal.show('The first omen.','gemini',true);h.click('enlargeCrystal');
 h.crystal.prepare();assert.equal(h.pending.size,0);assert.equal(h.doc.getElementById('crystalDialog').open,false);
 assert.equal(h.doc.getElementById('crystalScreen').dataset.state,'waiting');
 assert.equal(h.doc.getElementById('replayCrystal').disabled,true);
 h.crystal.show('The next omen.','offline',true);assert.equal(h.pending.size,1);
 const completion=[...h.pending.values()][0];completion.fn();
 assert.equal(h.doc.getElementById('crystalText').textContent,'The next omen.');
 assert.equal(h.doc.getElementById('crystalScreen').dataset.state,'revealed');
 h.crystal.clear();assert.equal(h.doc.getElementById('crystalCard').hidden,true);
 assert.equal(h.doc.getElementById('crystalText').textContent,'');assert.equal(h.pending.size,0);
});
