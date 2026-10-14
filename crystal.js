// A visual rendering of the existing final paragraph, never a new prediction.
// Only text nodes are created: prophecy and journal content cannot inject HTML.
export function crystalOutcome(reading){
 return String(reading||'').trim().split(/\n\s*\n/).at(-1)
  .replace(/^\*\*(.*?)\*\*$/s,'$1')
  .replace(/^(?:\*\*)?(?:conditional\s+)?(?:verdict|outcome|omen)(?:\*\*)?\s*[:—-]\s*(?:\*\*)?\s*/i,'').trim();
}

export function createCrystal(win,{animated=()=>true,reduced=()=>false,announce=()=>{}}={}){
 const doc=win.document,$=id=>doc.getElementById(id);
 const card=$('crystalCard'),dialog=$('crystalDialog');
 const displays=[
  {screen:$('crystalScreen'),text:$('crystalText')},
  {screen:$('crystalDialogScreen'),text:$('crystalDialogText')}
 ];
 let last=null,timer=0;

 function finish(speak=false){
  win.clearTimeout(timer);timer=0;
  for(const {screen}of displays){
   screen.querySelectorAll('.ink-reveal').forEach(word=>{
    word.classList.remove('ink-reveal');
    word.style.removeProperty('--delay');
   });
   if(screen.dataset.state==='revealing')screen.dataset.state='revealed';
   screen.setAttribute('aria-busy','false');
  }
  $('skipReveal').hidden=true;$('crystalDialogSkip').hidden=true;
  if(speak&&last)announce('The crystal’s omen has been revealed.');
 }

 function paint(display,text,motion){
  const {screen,text:verse}=display;
  verse.replaceChildren();screen.dataset.state='ready';
  const parts=text.split(/(\s+)/u),words=parts.filter(part=>part&&!/^\s+$/u.test(part));
  screen.dataset.length=words.length>55||text.length>400?'long':'normal';
  let delay=0,index=0;
  // Very long or unstructured provider replies still remain fully readable;
  // one passage emerges instead of creating hundreds of filter animations.
  if(words.length>180){
   const passage=doc.createElement('span');passage.className='crystal-passage'+(motion?' ink-reveal':'');
   passage.textContent=text;verse.append(passage);delay=180;
  }else{
   const step=Math.min(85,3600/Math.max(1,words.length-1));
   for(const part of parts){
    if(!part)continue;
    if(/^\s+$/u.test(part)){verse.append(doc.createTextNode(part));continue;}
    const word=doc.createElement('span');
    word.className='crystal-word'+(motion?' ink-reveal':'');word.textContent=part;
    const start=180+index*step+[0,24,9,38,16,30][index%6];
    word.style.setProperty('--delay',Math.round(start)+'ms');
    word.style.setProperty('--rise',20+(index*7%17)+'px');
    word.style.setProperty('--drift',(index%5-2)*2+'px');
    word.style.setProperty('--turn',(index%3-1)*7+'deg');
    delay=Math.max(delay,start);index++;verse.append(word);
   }
  }
  if(motion)void screen.offsetWidth; // Restart the mist when replaying the same omen.
  screen.dataset.state=motion?'revealing':'revealed';
  screen.setAttribute('aria-busy',String(motion));
  return motion?Math.ceil(delay)+2100:0;
 }

 function reveal(motionRequested){
  if(!last)return;
  finish();
  const motion=motionRequested&&animated()&&!reduced();
  let duration=paint(displays[0],last.text,motion);
  if(dialog.open)duration=Math.max(duration,paint(displays[1],last.text,motion));
  $('skipReveal').hidden=!motion;
  $('crystalDialogSkip').hidden=!motion||!dialog.open;
  if(duration)timer=win.setTimeout(()=>finish(true),duration);
 }

 function show(reading,source,motionRequested=false){
  finish();const text=crystalOutcome(reading);if(!text){clear();return;}
  last={text,source};card.hidden=false;
  $('crystalSource').textContent=source==='gemini'?'GEMINI OMEN':'OFFLINE OMEN';
  $('crystalDialogSource').textContent=$('crystalSource').textContent;
  $('replayCrystal').disabled=false;$('enlargeCrystal').disabled=false;
  reveal(motionRequested);
 }

 function close(){
  finish();
  if(dialog.open){if(dialog.close)dialog.close();else dialog.removeAttribute('open');}
 }

 function clear(){
  close();last=null;card.hidden=true;
  for(const {screen,text}of displays){text.replaceChildren();screen.dataset.state='empty';screen.removeAttribute('data-length');}
  $('replayCrystal').disabled=true;$('enlargeCrystal').disabled=true;
 }

 function prepare(){
  clear();card.hidden=false;
  $('crystalSource').textContent='THE MIST IS STIRRING';
  displays[0].screen.dataset.state='waiting';
  displays[0].text.textContent='The meaning gathers beneath the surface…';
 }

 $('skipReveal').onclick=() => finish(true);
 $('crystalDialogSkip').onclick=() => finish(true);
 $('replayCrystal').onclick=() => reveal(true);
 $('crystalDialogReplay').onclick=() => reveal(true);
 $('enlargeCrystal').onclick=()=>{
  if(!last)return;
  if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');
  reveal(true);
 };
 $('closeCrystal').onclick=close;
 dialog.addEventListener('close',()=>finish());
 clear();
 return {show,prepare,clear,finish};
}
