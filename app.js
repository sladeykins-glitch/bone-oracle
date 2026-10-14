import {BONES,FIELD,REALMS,SHAPES,realmAt,positionBand,createCast,stepPhysics,isSettled,analyseCast,offlineReading,hitBone,serializeBones,restoreBones,castPayload,validateEndpoint} from './core.js?v=3.1.0';
import {CastingJournal,safeGet,safeSet} from './journal.js?v=3.1.0';
import {createCrystal} from './crystal.js?v=3.1.0';
const DEFAULT_ENDPOINT='https://bone-oracle-ai.sladeykins.workers.dev';
export function createOracle(win){
 const doc=win.document,$=id=>doc.getElementById(id),canvas=$('mat'),ctx=canvas.getContext('2d');
 let storage;try{storage=win.localStorage;}catch{storage={getItem:()=>null,setItem:()=>{throw Error('Storage unavailable');}};}
 const journal=new CastingJournal(storage),manual=new Set(),images=new Map();
 const state={bones:[],count:4,running:false,selected:null,held:null,version:0,current:null,reading:'',source:'offline',request:null,frame:0,last:0,elapsed:0,accumulator:0,config:null,configEndpoint:'',widget:null,lastAI:0};
 let cooldownTimer=0,dragStart=null,notesTimer=0;
 const media=query=>win.matchMedia?.(query)?.matches??false;
 const reduced=()=>media('(prefers-reduced-motion: reduce)');
 const uuid=()=>win.crypto?.randomUUID?.()||'cast-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
 const el=(tag,className,text)=>{const node=doc.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
 const announce=text=>{$('announcement').textContent=text;};
 const crystal=createCrystal(win,{animated:()=>$('animatedReveal').checked,reduced,announce});
 function endpoint(){return validateEndpoint(safeGet(storage,'boneOracleAiEndpoint',DEFAULT_ENDPOINT)||DEFAULT_ENDPOINT);}
 function updateJournalCount(){$('journalCount').textContent=journal.entries.length;}
 function cancelRequest(){state.version++;state.request?.abort();state.request=null;crystal.finish();$('aiStatus').classList.remove('loading');}
 function setRunning(running){state.running=running;$('cast').disabled=running;$('askAI').disabled=running;$('question').disabled=running;$('context').disabled=running;$('phase').classList.toggle('moving',running);$('fieldGlow').classList.toggle('active',running);}
 $('aiMode').checked=safeGet(storage,'boneOracleUseAI','true')==='true';
 $('animatedReveal').checked=safeGet(storage,'boneOracleAnimated','true')==='true';
 $('arrange').checked=!media('(pointer: coarse)');canvas.classList.toggle('arranging',$('arrange').checked);
 for(const definition of BONES){const image=new win.Image();image.onload=draw;image.src='./assets/'+definition.id+'.webp';images.set(definition.id,image);}
 // The parchment, grain and realm markings are painted once; idle frames are not scheduled.
 const cloth=doc.createElement('canvas');cloth.width=cloth.height=760;const pc=cloth.getContext('2d');
 function ring(c,r){c.beginPath();c.arc(380,380,r,0,Math.PI*2);c.stroke();}
 if(pc){
  const gradient=pc.createRadialGradient(340,305,30,380,380,395);gradient.addColorStop(0,'#cfb88b');gradient.addColorStop(.7,'#b19669');gradient.addColorStop(1,'#5b422b');pc.fillStyle=gradient;pc.fillRect(0,0,760,760);
  for(let i=0;i<8500;i++){pc.globalAlpha=.055+(i%5)*.012;pc.fillStyle=i%3?'#ecd5a4':'#3e2d1c';pc.fillRect((i*137.51)%760,(i*271.37)%760,(i%4)*.6+.5,(i%5)*.6+.3);}pc.globalAlpha=1;
  pc.strokeStyle='#493826';pc.lineWidth=4;ring(pc,351);pc.lineWidth=1;pc.strokeStyle='#e2c98b70';ring(pc,345);pc.strokeStyle='#5c4229';ring(pc,338);pc.setLineDash([2,8]);ring(pc,327);pc.setLineDash([]);pc.lineWidth=2;ring(pc,310);
  pc.strokeStyle='#68503490';pc.lineWidth=1.5;
  for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2;pc.beginPath();pc.moveTo(380+Math.cos(a)*107,380+Math.sin(a)*107);pc.lineTo(380+Math.cos(a)*310,380+Math.sin(a)*310);pc.stroke();}
  pc.fillStyle='#d6be8c44';pc.beginPath();pc.arc(380,380,107,0,Math.PI*2);pc.fill();pc.strokeStyle='#795931';ring(pc,107);pc.lineWidth=.7;ring(pc,101);
  pc.fillStyle='#4f3a23';pc.textAlign='center';pc.font='23px Georgia';pc.fillText('SPIRITS',380,116);pc.fillText('FLESH',380,655);pc.fillText('PAST',115,388);pc.fillText('FUTURE',641,388);pc.font='22px Georgia';pc.fillText('PRESENT',380,375);pc.font='13px Georgia';pc.fillText('THE LIVING QUESTION',380,401);pc.font='12px Georgia';pc.fillText('HIDDEN · BEYOND THE RING',380,735);
  pc.font='26px Georgia';pc.fillText('☾',380,67);pc.fillText('✧',380,705);
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2;pc.save();pc.translate(380+Math.cos(a)*333,380+Math.sin(a)*333);pc.rotate(a+Math.PI/2);pc.strokeStyle='#4b3726a0';pc.beginPath();pc.moveTo(-3,-3);pc.lineTo(0,4);pc.lineTo(3,-3);pc.stroke();pc.restore();}
 }
 function resize(){const width=canvas.getBoundingClientRect().width||760,px=Math.max(320,Math.round(width*Math.min(win.devicePixelRatio||1,2)));if(canvas.width!==px){canvas.width=canvas.height=px;}draw();}
 function draw(){if(!ctx)return;ctx.setTransform(canvas.width/760,0,0,canvas.height/760,0,0);ctx.clearRect(0,0,760,760);if(pc)ctx.drawImage(cloth,0,0,760,760);
  const sorted=[...state.bones].sort((a,b)=>a.z-b.z);
  for(const b of sorted){const selected=b===state.selected,image=images.get(b.id),shape=SHAPES[b.id],height=shape.height;
   // Ground shadow stays on the cloth while the specimen rises, spins and rolls.
   ctx.save();ctx.translate(b.x+b.z*.13,b.y+5);ctx.rotate(b.angle);ctx.scale(1+b.z*.003,1);ctx.fillStyle='rgba(31,23,13,'+(b.z>0?.12:.25)+')';ctx.shadowColor='#21150866';ctx.shadowBlur=8+b.z*.12;ctx.beginPath();ctx.ellipse(0,0,shape.width*.42,height*.22,0,0,Math.PI*2);ctx.fill();ctx.restore();
   if(selected){ctx.save();ctx.strokeStyle='#fff0b1';ctx.lineWidth=1.6;ctx.setLineDash([4,6]);ctx.beginPath();ctx.arc(b.x,b.y,Math.max(shape.width,height)*.59,0,Math.PI*2);ctx.stroke();ctx.restore();}
   ctx.save();ctx.translate(b.x,b.y-b.z*.47);ctx.rotate(b.angle);if(b.z>0)ctx.scale(.65+.35*Math.abs(Math.cos(b.tumble)),.75+.25*Math.abs(Math.sin(b.tumble+.8)));
   ctx.shadowColor='#3b281455';ctx.shadowBlur=b.z>0?4:3;ctx.shadowOffsetY=2;
   if(image?.complete&&image.naturalWidth){ctx.drawImage(image,-shape.width/2,-height/2,shape.width,height);}else{
    const g=ctx.createLinearGradient(0,-height/2,0,height/2);g.addColorStop(0,'#f4e5bb');g.addColorStop(.6,'#c9af7e');g.addColorStop(1,'#947449');ctx.fillStyle=g;ctx.beginPath();shape.points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();
   }ctx.restore();
   if(!state.running&&!state.held){ctx.save();ctx.font='12px Georgia';ctx.textAlign='center';const x=b.x,y=b.y+Math.min(height*.65+10,42);ctx.fillStyle='#31291fd9';ctx.beginPath();ctx.roundRect(x-17,y-12,34,19,7);ctx.fill();ctx.fillStyle='#f2e0b6';ctx.fillText(b.intensity+'/'+b.die,x,y+1);ctx.restore();}
  }
 }
 function requestFrame(){if(state.frame||doc.hidden)return;state.frame=win.requestAnimationFrame(frame);}
 function frame(time){state.frame=0;const dt=state.last?Math.min(.05,(time-state.last)/1000):1/60;state.last=time;
  if(state.running){state.elapsed+=dt;state.accumulator+=dt;while(state.accumulator>=1/120){stepPhysics(state.bones,1/120);state.accumulator-=1/120;}
   if((state.elapsed>1.4&&isSettled(state.bones))||state.elapsed>12)finishCast();
  }draw();if(state.running)requestFrame();
 }
 function finishCast(){for(const b of state.bones){b.vx=b.vy=b.av=b.vz=b.z=0;}for(let i=0;i<12;i++)stepPhysics(state.bones,0);setRunning(false);$('phase').textContent='CASTING COMPLETE';$('matCaption').textContent='Select a bone to study its omen. Enable Move bones to arrange the field.';renderReading(true);announce('The bones have settled. Your reading is ready.');draw();}
 function cast(){if(state.running)return;
  try{state.bones=createCast(state.count,$('manual').checked?[...manual]:null);}catch(err){$('castNotice').textContent=err.message;return;}
  cancelRequest();crystal.prepare();state.selected=null;state.held=null;state.last=0;state.elapsed=0;state.accumulator=0;
  state.current={id:uuid(),created:new Date().toISOString(),question:$('question').value.trim(),context:$('context').value.trim(),notes:'',starred:false,amended:false};
  state.reading='';state.source='offline';$('castNotice').textContent='';$('interpretation').replaceChildren();$('bonesList').replaceChildren();$('boneInspector').hidden=true;$('emptyReading').hidden=false;$('readingActions').hidden=true;$('saveStatus').textContent='';$('readingIntro').textContent='The omens are taking shape…';$('aiStatus').textContent='The bones are falling. The field will decide their realms.';$('sourceLabel').textContent='THE ORACLE IS LISTENING';$('sourceLabel').classList.remove('gemini');$('phase').textContent='BONES IN MOTION';$('counter').textContent=state.bones.length+' bones';$('touches').textContent='Reading the field';$('formation').textContent='Unsettled';$('matCaption').textContent='The bones rise, tumble and settle into their realms.';setRunning(true);
  if(media('(max-width: 720px)'))$('field').scrollIntoView({behavior:reduced()?'auto':'smooth',block:'start'});
  if(reduced()){for(let i=0;i<1440;i++){stepPhysics(state.bones,1/120);if(i>168&&isSettled(state.bones))break;}finishCast();}else requestFrame();
 }
 function boneLabel(b){const same=state.bones.filter(x=>x.id===b.id);return b.name+(same.length>1?' · '+(same.indexOf(b)+1):'');}
 function inspect(b){state.selected=b;doc.querySelectorAll('.bone-row').forEach(row=>{const active=row.dataset.uid===b.uid;row.classList.toggle('active',active);row.setAttribute('aria-pressed',String(active));});$('boneInspector').hidden=false;$('inspectName').textContent=boneLabel(b)+' · d'+b.die;$('inspectMeaning').textContent=b.zones[realmAt(b.x,b.y)]+'. '+positionBand(b)+' influence.';$('moveRealm').value=realmAt(b.x,b.y);$('matCaption').textContent=boneLabel(b)+' in '+realmAt(b.x,b.y)+' — '+b.intensity+'/'+b.die+'.';draw();}
 function renderBoneRows(pattern){$('bonesList').replaceChildren();
  for(const b of pattern.sorted){const button=el('button','bone-row');button.type='button';button.dataset.uid=b.uid;button.setAttribute('aria-pressed',String(b===state.selected));button.classList.toggle('active',b===state.selected);const image=el('img');image.src='./assets/'+b.id+'.webp';image.alt='';const text=el('span'),ratio=b.intensity/b.die;text.append(el('strong','',boneLabel(b)),el('small','',realmAt(b.x,b.y)+' · '+b.intensity+'/'+b.die+' · '+(ratio>=.7?'powerful':ratio<=.34?'faint':'measured')));button.append(image,text);button.onclick=()=>inspect(b);$('bonesList').append(button);}
 }
 function showProphecy(text,source,animate=false){$('interpretation').replaceChildren();
  const chunks=text.trim().split(/\n\s*\n/);
  chunks.forEach((chunk,i)=>$('interpretation').append(el('p',i===chunks.length-1?'omen':'',chunk.replace(/^\*\*(.*?)\*\*$/,'$1'))));
  $('sourceLabel').textContent=source==='gemini'?'GEMINI · THE PROPHECY':'THE OFFLINE ORACLE';$('sourceLabel').classList.toggle('gemini',source==='gemini');
  crystal.show(text,source,animate);
 }
 function keepCast(){if(!state.current)return;const ok=journal.upsert({...state.current,bones:serializeBones(state.bones),reading:state.reading,source:state.source});updateJournalCount();$('saveStatus').textContent=ok?'Saved to your casting journal'+(state.current.amended?' · arrangement revised':'')+'.':'Kept for this session. Browser storage is unavailable or full; export your journal.';}
 function renderReading(ask=false){if(!state.bones.length)return;cancelRequest();const pattern=analyseCast(state.bones),reading=offlineReading(state.bones,state.current.question,state.current.context);
  state.reading=[...reading.paragraphs,reading.ending].join('\n\n');state.source='offline';$('emptyReading').hidden=true;$('readingActions').hidden=false;$('readingIntro').textContent=state.current.question?'“'+state.current.question+'”':'An open reading';$('counter').textContent=state.bones.length+' bones';$('touches').textContent=pattern.contacts.length?pattern.contacts.length+' linked '+(pattern.contacts.length===1?'pair':'pairs'):'No touching bones';$('formation').textContent=pattern.formation?pattern.formation+' formation':'No clear formation';renderBoneRows(pattern);showProphecy(state.reading,'offline',ask);$('aiStatus').textContent='Read from the cast · every omen follows its bones and placement.';keepCast();if(state.selected)inspect(state.selected);if(ask&&$('aiMode').checked)void askGemini();}
 function applyMovement(){if(!state.current||state.running)return;cancelRequest();state.current.amended=true;for(let i=0;i<8;i++)stepPhysics(state.bones,0,state.selected);renderReading(false);draw();}
 function reset(){cancelRequest();crystal.clear();if(state.frame)win.cancelAnimationFrame(state.frame);state.frame=0;state.bones=[];state.selected=state.held=state.current=null;state.reading='';setRunning(false);$('phase').textContent='AWAITING THE CAST';$('counter').textContent='0 bones';$('touches').textContent='No connections';$('formation').textContent='An empty field';$('bonesList').replaceChildren();$('interpretation').replaceChildren();$('emptyReading').hidden=false;$('readingActions').hidden=true;$('boneInspector').hidden=true;$('readingIntro').textContent='When the bones come to rest, their omens will be written here.';$('aiStatus').textContent='The offline Oracle is always available.';$('sourceLabel').textContent='THE ORACLE IS QUIET';$('sourceLabel').classList.remove('gemini');$('matCaption').textContent='The cloth lies empty. Ask, and cast.';$('saveStatus').textContent='';canvas.classList.remove('dragging');draw();}
 // /config is optional: the previous Worker only supports POST at its root.
 async function getConfig(url,signal){if(state.configEndpoint===url&&state.config)return state.config;
  const controller=new win.AbortController(),forwardAbort=()=>controller.abort();signal.addEventListener('abort',forwardAbort,{once:true});const timer=win.setTimeout(()=>controller.abort(),8000);
  let config={apiVersion:2,turnstileRequired:false};try{const result=await win.fetch(url+'/config',{signal:controller.signal,headers:{Accept:'application/json'}});if(result.ok){const data=await result.json();if(data.apiVersion===3&&typeof data.turnstileRequired==='boolean')config=data;}}
  catch(err){if(signal.aborted)throw err;}finally{win.clearTimeout(timer);signal.removeEventListener('abort',forwardAbort);}state.configEndpoint=url;state.config=config;return config;
 }
 function loadTurnstile(){if(win.turnstile)return Promise.resolve(win.turnstile);
  return new Promise((resolve,reject)=>{let script=doc.getElementById('turnstileScript');if(!script){script=el('script');script.id='turnstileScript';script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;doc.head.append(script);}const timer=win.setTimeout(()=>reject(Error('Verification could not load. Your offline reading is ready.')),12000);script.addEventListener('load',()=>{win.clearTimeout(timer);win.turnstile?resolve(win.turnstile):reject(Error('Verification unavailable.'));},{once:true});script.addEventListener('error',()=>{win.clearTimeout(timer);script.remove();reject(Error('Verification could not load.'));},{once:true});});
 }
 async function verificationToken(config,signal){if(!config.turnstileRequired)return '';
  if(typeof config.turnstileSiteKey!=='string'||!config.turnstileSiteKey)throw Error('The Worker’s verification is not configured.');
  const api=await loadTurnstile();if(signal.aborted)throw new win.DOMException('Cancelled','AbortError');$('turnstileMount').hidden=false;if(state.widget!==null){api.remove(state.widget);state.widget=null;}
  return new Promise((resolve,reject)=>{const timer=win.setTimeout(()=>done(Error('Verification timed out. Try again when ready.')),45000);let finished=false;
   function done(error,token){if(finished)return;finished=true;win.clearTimeout(timer);signal.removeEventListener('abort',aborted);error?reject(error):resolve(token);}
   function aborted(){done(new win.DOMException('Cancelled','AbortError'));}signal.addEventListener('abort',aborted,{once:true});
   state.widget=api.render($('turnstileMount'),{sitekey:config.turnstileSiteKey,action:'bone-reading',size:'flexible',callback:token=>done(null,token),'error-callback':()=>{done(Error('Verification failed. Please try again.'));return true;},'expired-callback':()=>done(Error('Verification expired. Please try again.'))});
  });
 }
 async function askGemini(){if(!state.current||state.running||state.request)return;
  const remaining=10000-(Date.now()-state.lastAI);if(remaining>0){$('aiStatus').textContent='Please wait '+Math.ceil(remaining/1000)+' seconds before requesting another prophecy. The offline reading is ready.';return;}
  const request=new win.AbortController(),version=state.version,currentId=state.current.id;state.request=request;$('askAI').disabled=true;$('aiStatus').classList.add('loading');$('aiStatus').textContent='Gemini is listening to the bones…';
  // Freeze question and arrangement before any asynchronous work.
  const payload=castPayload(state.bones,state.current.question,state.current.context);let timeout=0;
  try{const url=endpoint(),config=await getConfig(url,request.signal);if(version!==state.version)return;payload.turnstileToken=await verificationToken(config,request.signal);if(version!==state.version)return;
   state.lastAI=Date.now();timeout=win.setTimeout(()=>request.abort('timeout'),30000);
   const response=await win.fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:request.signal});
   if(!response.ok){let problem={};try{problem=await response.json();}catch{}throw Error(typeof problem.error==='string'?problem.error.slice(0,220):'The AI service is unavailable ('+response.status+').');}
   const data=await response.json();if(typeof data.reading!=='string'||!data.reading.trim()||data.reading.length>16000)throw Error('The Oracle received an incomplete prophecy.');
   if(version!==state.version||state.current?.id!==currentId)return;state.reading=data.reading.trim();state.source='gemini';showProphecy(state.reading,'gemini',true);$('aiStatus').textContent=config.apiVersion===3?'Gemini prophecy · grounded in this cast and your story context.':'Gemini prophecy · connected to your current Worker. Deploy the v3 Worker for deeper context and stronger protection.';keepCast();announce('Gemini’s prophecy is ready.');
  }catch(err){if(version!==state.version)return;$('aiStatus').textContent=(request.signal.aborted?'Gemini took too long to answer.':err.message)+' Your offline reading remains available.';}
  finally{win.clearTimeout(timeout);if(state.request===request){state.request=null;$('aiStatus').classList.remove('loading');$('askAI').disabled=false;$('turnstileMount').hidden=true;win.clearTimeout(cooldownTimer);const remaining=10000-(Date.now()-state.lastAI);if(remaining>0){$('askAI').disabled=true;cooldownTimer=win.setTimeout(()=>{if(!state.running&&!state.request)$('askAI').disabled=false;},remaining);}}}
 }
 function countsUI(){for(const button of $('counts').children){button.classList.toggle('active',Number(button.textContent)===($('manual').checked?manual.size:state.count));button.setAttribute('aria-pressed',String(button.classList.contains('active')));button.disabled=$('manual').checked;}
  for(const button of $('boneSelect').children){button.disabled=!$('manual').checked;button.classList.toggle('active',manual.has(button.dataset.id)&&$('manual').checked);button.setAttribute('aria-pressed',String(button.classList.contains('active')));}
  $('selectionNote').textContent=$('manual').checked?manual.size+' selected · each selected bone is cast once. Choose at least two.':'Roll a d6 for each of '+state.count+' bones. Repeated influences are possible.';
 }
 for(let n=2;n<=6;n++){const button=el('button','',String(n));button.type='button';button.setAttribute('aria-label','Cast '+n+' bones');button.onclick=()=>{state.count=n;countsUI();};$('counts').append(button);}
 for(const b of BONES){const button=el('button','bone-check');button.type='button';button.dataset.id=b.id;const img=el('img');img.src='./assets/'+b.id+'.webp';img.alt='';button.append(img,el('span','',b.name),el('small','','d'+b.die));button.onclick=()=>{manual.has(b.id)?manual.delete(b.id):manual.add(b.id);countsUI();};$('boneSelect').append(button);}
 for(const realm of REALMS){const option=el('option','',realm);option.value=realm;$('moveRealm').append(option);}
 $('manual').onchange=countsUI;$('allBones').onclick=()=>{$('manual').checked=true;BONES.forEach(b=>manual.add(b.id));countsUI();};$('cast').onclick=cast;$('clear').onclick=reset;$('askAI').onclick=()=>void askGemini();
 $('arrange').onchange=()=>canvas.classList.toggle('arranging',$('arrange').checked);
 $('viewReading').onclick=()=>$('readingPanel').scrollIntoView({behavior:reduced()?'auto':'smooth',block:'start'});
 $('moveRealm').onchange=()=>{if(!state.selected||state.running)return;const points={Present:[380,380],Past:[170,380],Future:[590,380],Spirits:[380,170],Flesh:[380,590],Hidden:[60,380]};if($('moveRealm').value==='Hidden')state.selected.angle=Math.PI/2;[state.selected.x,state.selected.y]=points[$('moveRealm').value];applyMovement();};
 for(const [id,angle]of [['rotateLeft',-Math.PI/12],['rotateRight',Math.PI/12]])$(id).onclick=()=>{if(!state.selected||state.running)return;state.selected.angle+=angle;applyMovement();};
 function pointer(event){const rect=canvas.getBoundingClientRect();return {x:(event.clientX-rect.left)*760/rect.width,y:(event.clientY-rect.top)*760/rect.height};}
 canvas.addEventListener('pointerdown',event=>{if(state.running||event.button>0)return;const p=pointer(event),bone=[...state.bones].reverse().find(b=>hitBone(b,p.x,p.y,media('(pointer: coarse)')?16:8));if(!bone)return;inspect(bone);
  if(!$('arrange').checked)return;state.held=bone;dragStart={x:p.x,y:p.y,bx:bone.x,by:bone.y,moved:false};bone.vx=bone.vy=bone.av=0;canvas.setPointerCapture?.(event.pointerId);canvas.classList.add('dragging');event.preventDefault();
 });
 canvas.addEventListener('pointermove',event=>{if(!state.held||!dragStart)return;const p=pointer(event);if(!dragStart.moved){if(Math.hypot(p.x-dragStart.x,p.y-dragStart.y)<=3)return;cancelRequest();dragStart.moved=true;}state.held.x=dragStart.bx+p.x-dragStart.x;state.held.y=dragStart.by+p.y-dragStart.y;for(let i=0;i<5;i++)stepPhysics(state.bones,0,state.held);draw();event.preventDefault();});
 function endDrag(event){if(!state.held)return;const moved=dragStart?.moved;state.held=null;dragStart=null;canvas.classList.remove('dragging');if(event&&canvas.hasPointerCapture?.(event.pointerId))canvas.releasePointerCapture(event.pointerId);if(moved){applyMovement();$('matCaption').textContent='The field has shifted. The revised omen is saved.';}else{inspect(state.selected);$('askAI').disabled=false;}}
 canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);canvas.addEventListener('lostpointercapture',endDrag);
 canvas.addEventListener('keydown',event=>{if(state.running||!state.selected)return;const d=event.shiftKey?24:6,offset={ArrowLeft:[-d,0],ArrowRight:[d,0],ArrowUp:[0,-d],ArrowDown:[0,d]}[event.key];if(!offset)return;event.preventDefault();state.selected.x+=offset[0];state.selected.y+=offset[1];applyMovement();});
 $('copy').onclick=async()=>{if(!state.reading)return;const text=(state.current.question||'Open reading')+'\n\n'+state.bones.map(b=>boneLabel(b)+' in '+realmAt(b.x,b.y)+' ('+b.intensity+'/'+b.die+')').join('\n')+'\n\n'+state.reading;
  try{await win.navigator.clipboard.writeText(text);$('copy').textContent='Copied';win.setTimeout(()=>$('copy').textContent='Copy',1500);}catch{$('aiStatus').textContent='Clipboard unavailable. You can select the reading text or export the journal.';}
 };
 function openDialog(id){const dialog=$(id);if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');}
 function closeDialog(id){const dialog=$(id);if(dialog.close)dialog.close();else dialog.removeAttribute('open');}
 doc.querySelectorAll('[data-close]').forEach(button=>button.onclick=()=>closeDialog(button.dataset.close));
 $('openSettings').onclick=()=>{$('apiUrl').value=safeGet(storage,'boneOracleAiEndpoint',DEFAULT_ENDPOINT)||DEFAULT_ENDPOINT;$('settingsStatus').textContent='';openDialog('settingsDialog');};
 $('saveSettings').onclick=()=>{try{const url=validateEndpoint($('apiUrl').value.trim()||DEFAULT_ENDPOINT);cancelRequest();state.config=null;const ok=[safeSet(storage,'boneOracleAiEndpoint',url),safeSet(storage,'boneOracleUseAI',String($('aiMode').checked)),safeSet(storage,'boneOracleAnimated',String($('animatedReveal').checked))].every(Boolean);$('settingsStatus').textContent=ok?'Settings saved.':'Browser storage is unavailable. Settings may not persist.';if(ok)closeDialog('settingsDialog');}catch(err){$('settingsStatus').textContent=err.message;}};
 function restoreEntry(entry){cancelRequest();if(state.frame)win.cancelAnimationFrame(state.frame);state.frame=0;state.bones=restoreBones(entry.bones);state.current={...entry};state.selected=null;state.held=null;state.reading=entry.reading;state.source=entry.source;setRunning(false);$('question').value=entry.question;$('context').value=entry.context;$('boneInspector').hidden=true;const pattern=analyseCast(state.bones);renderBoneRows(pattern);$('emptyReading').hidden=true;$('readingActions').hidden=false;$('readingIntro').textContent=entry.question?'“'+entry.question+'”':'An open reading';$('phase').textContent='JOURNAL CAST RESTORED';$('counter').textContent=state.bones.length+' bones';$('touches').textContent=pattern.contacts.length+' linked pairs';$('formation').textContent=pattern.formation||'No clear formation';showProphecy(entry.reading,entry.source,false);$('aiStatus').textContent='Restored from the journal. No new AI request was made.';$('saveStatus').textContent='Original placement and reading restored.';$('matCaption').textContent='A remembered cast returns to the cloth.';closeDialog('journalDialog');draw();$('field').scrollIntoView({behavior:reduced()?'auto':'smooth'});}
 function renderJournal(){const root=$('journalEntries');root.replaceChildren();const query=$('journalSearch').value.toLowerCase().trim(),entries=journal.entries.filter(e=>[e.question,e.context,e.notes,e.reading].join(' ').toLowerCase().includes(query)).sort((a,b)=>Number(b.starred)-Number(a.starred)||b.created.localeCompare(a.created));
  if(!entries.length){root.append(el('p','journal-empty',query?'No matching omens.':'Your first cast will begin the journal.'));return;}
  for(const entry of entries){const details=el('details','journal-entry'),summary=el('summary'),heading=el('div');heading.append(el('h3','',entry.question||'An open reading'),el('div','journal-meta',new Date(entry.created).toLocaleString()+' · '+entry.bones.length+' bones · '+(entry.source==='gemini'?'Gemini':'Offline')+(entry.amended?' · revised':'')));summary.append(heading,el('span','journal-star',entry.starred?'★':'✧'));details.append(summary);const body=el('div','journal-body');if(entry.context)body.append(el('p','',entry.context));body.append(el('p','',entry.reading));const label=el('label','label','NOTES & OUTCOME');label.htmlFor='note-'+entry.id;const notes=el('textarea');notes.id=label.htmlFor;notes.maxLength=4000;notes.value=entry.notes;notes.placeholder='What came to pass? What did you learn?';notes.oninput=()=>{win.clearTimeout(notesTimer);notesTimer=win.setTimeout(()=>{const saved=journal.update(entry.id,{notes:notes.value});$('journalNotice').textContent=saved?'Notes saved.':'Notes kept in this session. Export a backup.';},350);};notes.onchange=()=>{win.clearTimeout(notesTimer);journal.update(entry.id,{notes:notes.value});};body.append(label,notes);const actions=el('div','journal-actions');
   const restore=el('button','secondary','Restore field');restore.onclick=()=>restoreEntry(entry);const star=el('button','secondary',entry.starred?'Unstar':'Star');star.onclick=()=>{journal.update(entry.id,{starred:!entry.starred});renderJournal();};
   const remove=el('button','secondary','Delete entry');remove.onclick=()=>{if(state.current?.id===entry.id)cancelRequest();const deleted=journal.remove(entry.id);renderJournal();updateJournalCount();$('journalNotice').replaceChildren(el('span','','Entry removed. '));const undo=el('button','text-button','Undo');undo.onclick=()=>{journal.restore(deleted);renderJournal();updateJournalCount();$('journalNotice').textContent='Entry restored.';};$('journalNotice').append(undo);};actions.append(restore,star,remove);body.append(actions);details.append(body);root.append(details);
  }
 }
 $('openJournal').onclick=()=>{$('journalNotice').textContent=journal.error;renderJournal();openDialog('journalDialog');};$('journalSearch').oninput=renderJournal;
 $('exportJournal').onclick=()=>{const blob=new win.Blob([journal.export()],{type:'application/json'}),url=win.URL.createObjectURL(blob),a=el('a');a.href=url;a.download='bone-oracle-journal-'+new Date().toISOString().slice(0,10)+'.json';doc.body.append(a);a.click();a.remove();win.setTimeout(()=>win.URL.revokeObjectURL(url),1000);$('journalNotice').textContent='Your journal backup has been exported.';};
 $('importJournal').onchange=async event=>{const file=event.target.files?.[0];if(!file)return;try{if(file.size>3000000)throw Error('Choose a journal backup smaller than 3 MB.');const imported=journal.import(await file.text());$('journalNotice').textContent=imported+' entries checked. Existing entries were kept.';renderJournal();updateJournalCount();}catch(err){$('journalNotice').textContent=err.message;}finally{event.target.value='';}};
 win.addEventListener('resize',resize);if(win.ResizeObserver)new win.ResizeObserver(resize).observe(canvas);
 doc.addEventListener('visibilitychange',()=>{if(doc.hidden){if(state.frame)win.cancelAnimationFrame(state.frame);state.frame=0;state.last=0;}else if(state.running)requestFrame();});
 // Same-origin shell only: never cache Gemini requests, questions, or API responses.
 if('serviceWorker' in win.navigator)win.addEventListener('load',()=>void win.navigator.serviceWorker.register('./sw.js').catch(()=>{}),{once:true});
 countsUI();updateJournalCount();resize();
 return {state,journal,cast,reset,finishCast,askGemini,restoreEntry,renderReading,draw,crystal};
}
if(typeof window!=='undefined')createOracle(window);
