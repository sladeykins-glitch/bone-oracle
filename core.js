// Bone Oracle v3. Astragalomancy definitions retained from the inspected site.
export const BONES=[
 {id:'raven',name:"Raven’s Talon",die:4,short:'Raven',essence:'death, endings and fate',zones:{Past:'a death or severed bond shapes this hour',Present:'a necessary ending approaches',Future:'fate reaches for what is owed',Spirits:'the dead call out a warning',Flesh:'something precious is slipping away',Hidden:'an unforeseen ending waits unseen'}},
 {id:'wolf',name:'Wolf Fang',die:6,short:'Wolf',essence:'passion, loyalty and instinct',zones:{Past:'an old loyalty has been tested',Present:'desire and rivalry burn in the present',Future:'boldness may bring triumph',Spirits:'a primal or divine pursuit stirs',Flesh:'strength, devotion and bodily longing speak',Hidden:'a quiet hunger has yet to show itself'}},
 {id:'serpent',name:'Serpent Vertebra',die:8,short:'Serpent',essence:'transformation, cunning and rebirth',zones:{Past:'deceit or a former transformation echoes',Present:'the truth shifts beneath your feet',Future:'renewal may follow loss',Spirits:'hidden wisdom or a cunning power intervenes',Flesh:'a poison, physical or emotional, must be reckoned with',Hidden:'secrets and an untrodden path divide the way'}},
 {id:'deer',name:'Deer Rib',die:10,short:'Deer',essence:'compassion, sacrifice and empathy',zones:{Past:'mercy shown or suffering endured has led here',Present:'vulnerability and empathy guide this hour',Future:'healing asks for something to be surrendered',Spirits:'a merciful unseen hand offers compassion',Flesh:'frailty and the instinct to nurture are revealed',Hidden:'a loss or emotion remains unspoken'}},
 {id:'owl',name:'Owl Skull Shard',die:12,short:'Owl',essence:'knowledge, secrets and foresight',zones:{Past:'forgotten insight casts its shadow',Present:'an unseen truth may at last be recognised',Future:'a revelation nears',Spirits:'prophecy or foresight stirs',Flesh:'understanding may become a form of healing',Hidden:'knowledge remains veiled or burdensome'}},
 {id:'ancestor',name:'Ancestor’s Jawbone',die:20,short:'Ancestor',essence:'legacy, destiny and ancestral truth',zones:{Past:'an inheritance or broken oath persists',Present:'destiny demands attention',Future:'judgment, fulfilment or blessing lies ahead',Spirits:'the ancestral voices are near',Flesh:'the body carries a legacy',Hidden:'misaligned spirits or an unknown path call'}}
];
export const FIELD = Object.freeze({ size:760, center:380, realmRadius:310, presentRadius:107, rim:354 });
export const REALMS = Object.freeze(['Past','Present','Future','Spirits','Flesh','Hidden']);
// Collision hulls sampled from each generated sprite’s opaque silhouette.
export const SHAPES = Object.freeze({"raven":{"points":[[-34.76,-1.85],[-33.28,-7.77],[-31.06,-12.94],[-30.32,-13.68],[-29.58,-14.42],[-3.7,-18.12],[0,-18.12],[7.4,-17.38],[10.35,-16.64],[12.57,-15.9],[14.79,-15.16],[18.49,-13.68],[19.97,-12.94],[22.19,-11.46],[24.41,-9.98],[25.89,-8.51],[26.63,-7.77],[30.32,-4.07],[31.8,-1.85],[33.28,1.11],[34.02,3.33],[34.02,12.94],[33.28,15.16],[31.8,16.64],[-30.32,10.72],[-32.54,9.98],[-34.02,8.51],[-34.76,1.11]],"width":71,"height":36.24,"mass":0.72},"wolf":{"points":[[-39,-6.09],[-38.19,-10.16],[-37.38,-11.78],[-36.56,-12.59],[-34.94,-13.41],[-33.31,-14.22],[-32.5,-14.22],[-13,-11.78],[37.38,-4.47],[37.38,-3.66],[35.75,-1.22],[34.13,0.41],[33.31,1.22],[30.06,3.66],[25.19,6.91],[21.94,8.53],[20.31,9.34],[16.25,10.97],[13,11.78],[8.94,12.59],[2.44,13.41],[-4.06,13.41],[-9.75,12.59],[-13.81,11.78],[-26,6.09],[-27.62,5.28],[-30.06,3.66],[-32.5,2.03],[-34.13,0.41],[-35.75,-1.22],[-38.19,-4.47]],"width":78,"height":28.44,"mass":1},"serpent":{"points":[[-35.5,1.11],[-34.76,-0.37],[-34.02,-1.11],[-1.48,-20.34],[0.74,-20.34],[33.28,-1.11],[34.02,-0.37],[34.76,1.11],[34.02,2.59],[32.54,4.07],[20.71,9.99],[19.23,10.72],[0.74,19.6],[-1.48,19.6],[-20.71,10.72],[-33.28,4.07],[-34.02,3.33],[-34.76,2.59]],"width":71,"height":42.16,"mass":1.15},"deer":{"points":[[-53.5,-1.11],[-52.39,-7.8],[-51.27,-10.03],[-50.16,-11.15],[-47.93,-12.26],[52.39,-4.46],[51.27,-3.34],[47.93,0],[40.13,3.34],[36.78,4.46],[30.09,6.69],[25.64,7.8],[20.06,8.92],[14.49,10.03],[2.23,11.15],[-3.34,11.15],[-14.49,10.03],[-20.06,8.92],[-50.16,2.23],[-52.39,1.11]],"width":107,"height":24.52,"mass":0.85},"owl":{"points":[[-43.08,-1.38],[-34.83,-24.29],[-33.92,-25.21],[-32.08,-25.21],[-22,-23.38],[-17.42,-22.46],[-10.08,-20.63],[-1.83,-17.88],[3.67,-15.13],[5.5,-14.21],[10.08,-11.46],[12.83,-9.63],[15.58,-7.79],[34.83,5.96],[36.67,7.79],[39.42,10.54],[40.33,11.46],[41.25,13.29],[42.17,15.13],[42.17,20.63],[-31.17,23.38],[-33.92,23.38],[-42.17,4.13],[-43.08,1.38]],"width":88,"height":50.42,"mass":1.1},"ancestor":{"points":[[-55,-21.2],[-52.71,-23.49],[-50.42,-24.64],[-48.13,-24.64],[46.98,-22.34],[50.42,-21.2],[52.71,-20.05],[52.71,-15.47],[46.98,8.59],[44.69,10.89],[25.21,20.05],[20.63,21.2],[16.04,22.34],[10.31,23.49],[6.88,23.49],[-16.04,22.34],[-19.48,21.2],[-22.92,20.05],[-28.65,17.76],[-45.83,8.59],[-46.98,7.45],[-48.13,6.3]],"width":110,"height":49.27,"mass":1.65}});
export function realmAt(x,y){
 const dx=x-FIELD.center,dy=y-FIELD.center,r=Math.hypot(dx,dy);
 if(r>FIELD.realmRadius)return 'Hidden';
 if(r<FIELD.presentRadius)return 'Present';
 if(Math.abs(dy)>Math.abs(dx))return dy<0?'Spirits':'Flesh';
 return dx<0?'Past':'Future';
}
export function positionBand(b){const r=Math.hypot(b.x-380,b.y-380);return r>310?'unbound':r<107?'immediate':r<210?'growing':'distant';}
export function dieRoll(n,random=Math.random){return Math.min(n,Math.floor(random()*n)+1);}
export function makeBody(def,index=0,random=Math.random){
 const shape=SHAPES[def.id],mass=shape.mass;
 return {...def,uid:'bone-'+(index+1),intensity:dieRoll(def.die,random),x:380,y:380,angle:random()*Math.PI*2,
 vx:0,vy:0,av:0,z:0,vz:0,tumble:random()*Math.PI*2,mass,invMass:1/mass,
 invInertia:12/(mass*(shape.width**2+shape.height**2)),shape};
}
export function createCast(count,selected=null,random=Math.random){
 const picked=selected?BONES.filter(b=>selected.includes(b.id)):null;
 if(picked&&(picked.length<2||picked.length>6))throw Error('Choose two to six bones.');
 if(!Number.isInteger(count)||count<2||count>6)throw Error('Cast two to six bones.');
 const n=picked?picked.length:count;
 const castAngle=random()*Math.PI*2;
 return Array.from({length:n},(_,i)=>{
  const b=makeBody(picked?picked[i]:BONES[dieRoll(6,random)-1],i,random);
  const heading=castAngle+i/n*Math.PI*2+(random()-.5)*.65,spread=45+random()*35,speed=65+random()*270;
  b.x+=Math.cos(heading)*spread;b.y+=Math.sin(heading)*spread;
  b.vx=Math.cos(heading)*speed+(random()-.5)*130;b.vy=Math.sin(heading)*speed+(random()-.5)*130;
  b.av=(random()-.5)*15;b.z=18+random()*25;b.vz=110+random()*120;
  return b;
 });
}
export function vertices(b){const c=Math.cos(b.angle),s=Math.sin(b.angle);return b.shape.points.map(([x,y])=>({x:b.x+x*c-y*s,y:b.y+x*s+y*c}));}
const dot=(a,b)=>a.x*b.x+a.y*b.y;
const cross=(a,b)=>a.x*b.y-a.y*b.x;
function support(v,n,maximum){let extreme=maximum?-Infinity:Infinity,p=[];
 for(const q of v){const d=dot(q,n);if(maximum?d>extreme+.5:d<extreme-.5){extreme=d;p=[q];}else if(Math.abs(d-extreme)<.5)p.push(q);}
 return {x:p.reduce((a,q)=>a+q.x,0)/p.length,y:p.reduce((a,q)=>a+q.y,0)/p.length};
}
// Convex specimen hulls, separating axes, and an off-centre contact impulse.
export function collision(a,b,margin=0){
 const va=vertices(a),vb=vertices(b);let depth=Infinity,normal=null;
 for(const poly of [va,vb])for(let i=0;i<poly.length;i++){
  const p=poly[i],q=poly[(i+1)%poly.length],len=Math.hypot(q.x-p.x,q.y-p.y);
  if(len<.001)continue;
  const n={x:-(q.y-p.y)/len,y:(q.x-p.x)/len};
  let minA=Infinity,maxA=-Infinity,minB=Infinity,maxB=-Infinity;
  for(const v of va){const d=dot(v,n);minA=Math.min(minA,d);maxA=Math.max(maxA,d);}
  for(const v of vb){const d=dot(v,n);minB=Math.min(minB,d);maxB=Math.max(maxB,d);}
  const overlap=Math.min(maxA,maxB)-Math.max(minA,minB);
  if(overlap < -margin)return null;
  if(overlap<depth){depth=overlap;normal=n;}
 }
 if(!normal)return null;
 if(dot({x:b.x-a.x,y:b.y-a.y},normal)<0){normal.x*=-1;normal.y*=-1;}
 const sa=support(va,normal,true),sb=support(vb,normal,false);
 return {depth,normal,point:{x:(sa.x+sb.x)/2,y:(sa.y+sb.y)/2}};
}
function resolvePair(a,b,p,held){
 const ma=a===held?0:a.invMass,mb=b===held?0:b.invMass,ia=a===held?0:a.invInertia,ib=b===held?0:b.invInertia;
 const sum=ma+mb;if(!sum)return;
 const n=p.normal,correction=Math.max(0,p.depth+.02)*.8/sum;
 a.x-=n.x*correction*ma;a.y-=n.y*correction*ma;b.x+=n.x*correction*mb;b.y+=n.y*correction*mb;
 const ra={x:p.point.x-a.x,y:p.point.y-a.y},rb={x:p.point.x-b.x,y:p.point.y-b.y};
 const rel={x:b.vx-b.av*rb.y-a.vx+a.av*ra.y,y:b.vy+b.av*rb.x-a.vy-a.av*ra.x},speed=dot(rel,n);
 if(speed>=0)return;
 const impulse=-(1+(Math.abs(speed)>18?.30:0))*speed/(sum+cross(ra,n)**2*ia+cross(rb,n)**2*ib);
 const tangent={x:-n.y,y:n.x},jt=-dot(rel,tangent)/(sum+cross(ra,tangent)**2*ia+cross(rb,tangent)**2*ib);
 const friction=Math.max(-impulse*.28,Math.min(impulse*.28,jt));
 const push={x:n.x*impulse+tangent.x*friction,y:n.y*impulse+tangent.y*friction};
 a.vx-=push.x*ma;a.vy-=push.y*ma;b.vx+=push.x*mb;b.vy+=push.y*mb;
 a.av-=cross(ra,push)*ia;b.av+=cross(rb,push)*ib;
 a.av=Math.max(-12,Math.min(12,a.av));b.av=Math.max(-12,Math.min(12,b.av));
}
export function constrainBody(b){
 let far=0,v=null;
 for(const q of vertices(b)){const d=Math.hypot(q.x-380,q.y-380);if(d>far){far=d;v=q;}}
 if(far<=FIELD.rim)return;
 const nx=(v.x-380)/far,ny=(v.y-380)/far;
 b.x-=nx*(far-FIELD.rim+.05);b.y-=ny*(far-FIELD.rim+.05);
 const speed=b.vx*nx+b.vy*ny;
 if(speed>0){b.vx-=1.42*speed*nx;b.vy-=1.42*speed*ny;
  const lever={x:v.x-b.x,y:v.y-b.y};b.av-=cross(lever,{x:nx*speed,y:ny*speed})*b.invInertia*.7;
 }
}
export function stepPhysics(bones,dt,held=null){
 for(const b of bones){
  if(b===held)continue;
  const airborne=b.z>0||b.vz>0;
  b.x+=b.vx*dt;b.y+=b.vy*dt;b.angle+=b.av*dt;
  if(airborne){b.vz-=920*dt;b.z+=b.vz*dt;b.tumble+=dt*(7+Math.abs(b.av)*.6);
   if(b.z<=0){b.z=0;b.vz=Math.abs(b.vz)*.23;if(b.vz<35)b.vz=0;b.vx*=.88;b.vy*=.88;b.av*=.74;}
  }
  const friction=Math.exp(-(airborne?.25:2.5)*dt),spin=Math.exp(-(airborne?.25:3.15)*dt);
  b.vx*=friction;b.vy*=friction;b.av*=spin;
  if(!airborne&&Math.hypot(b.vx,b.vy)<1.5){b.vx=0;b.vy=0;}if(!airborne&&Math.abs(b.av)<.025)b.av=0;
 }
 for(let k=0;k<3;k++){
  for(let i=0;i<bones.length;i++)for(let j=i+1;j<bones.length;j++){
   const a=bones[i],b=bones[j];if(Math.abs(a.z-b.z)>17)continue;
   if(Math.hypot(a.x-b.x,a.y-b.y)>120)continue;
   const p=collision(a,b);if(p)resolvePair(a,b,p,held);
  }
  for(const b of bones)constrainBody(b);
 }
}
export function isSettled(bones){return bones.every(b=>b.z===0&&b.vz===0&&Math.hypot(b.vx,b.vy)<2&&Math.abs(b.av)<.05);}
export function touching(a,b){return Math.hypot(a.x-b.x,a.y-b.y)<125&&!!collision(a,b,5);}
export function hitBone(b,x,y,padding=10){
 const dx=x-b.x,dy=y-b.y,c=Math.cos(b.angle),s=Math.sin(b.angle);
 return Math.abs(dx*c+dy*s)<b.shape.width/2+padding&&Math.abs(-dx*s+dy*c)<b.shape.height/2+padding;
}
export function detectFormation(bones){
 if(bones.length<3)return null;
 const mx=bones.reduce((v,b)=>v+b.x,0)/bones.length,my=bones.reduce((v,b)=>v+b.y,0)/bones.length;
 const points=bones.map(b=>({x:b.x-mx,y:b.y-my}));
 const xx=points.reduce((v,p)=>v+p.x*p.x,0),yy=points.reduce((v,p)=>v+p.y*p.y,0),xy=points.reduce((v,p)=>v+p.x*p.y,0);
 const d=Math.sqrt((xx-yy)**2+4*xy*xy),major=(xx+yy+d)/2,minor=(xx+yy-d)/2;
 if(major>5000&&minor/major<.06)return 'Path';
 if(bones.length<4)return null;
 const radii=points.map(p=>Math.hypot(p.x,p.y)),mean=radii.reduce((v,r)=>v+r,0)/radii.length;
 const cv=Math.sqrt(radii.reduce((v,r)=>v+(r-mean)**2,0)/radii.length)/mean;
 const angles=points.map(p=>Math.atan2(p.y,p.x)).sort((a,b)=>a-b);
 const gaps=angles.map((a,i)=>((angles[(i+1)%angles.length]-a+Math.PI*2)%(Math.PI*2)));
 // A cross requires four distinct arms around the centroid, not a square's diagonals.
 if(points.some(p=>p.x>50&&Math.abs(p.y)<22)&&points.some(p=>p.x< -50&&Math.abs(p.y)<22)
 &&points.some(p=>p.y>50&&Math.abs(p.x)<22)&&points.some(p=>p.y< -50&&Math.abs(p.x)<22))return 'Cross';
 if(mean>55&&cv<.16&&Math.max(...gaps)<2.8)return 'Circle';
 return null;
}
export function analyseCast(bones){
 const sorted=[...bones].sort((a,b)=>(b.intensity/b.die)-(a.intensity/a.die));
 const contacts=[],connected=new Set(),pointed=[],counts={};
 for(let i=0;i<bones.length;i++)for(let j=i+1;j<bones.length;j++)if(touching(bones[i],bones[j])){
  contacts.push([bones[i],bones[j]]);connected.add(bones[i].uid);connected.add(bones[j].uid);
 }
 for(const b of bones){const realm=realmAt(b.x,b.y);counts[realm]=(counts[realm]||0)+1;}
 for(const a of bones.filter(b=>b.id==='raven'))for(const b of bones.filter(b=>b!==a)){
  const angle=Math.atan2(b.y-a.y,b.x-a.x)-a.angle,delta=Math.atan2(Math.sin(angle),Math.cos(angle));
  if(Math.hypot(b.x-a.x,b.y-a.y)<170&&Math.abs(delta)<.38)pointed.push([a,b]);
 }
 const max=Math.max(...Object.values(counts));
 return {sorted,contacts,isolated:bones.filter(b=>!connected.has(b.uid)),dominant:Object.keys(counts).filter(z=>counts[z]===max),pointed,
 closest:[...bones].sort((a,b)=>Math.hypot(a.x-380,a.y-380)-Math.hypot(b.x-380,b.y-380))[0],
 ancestorLinks:contacts.filter(pair=>pair.some(b=>b.id==='ancestor')),formation:detectFormation(bones)};
}
export function questionTheme(question){
 const q=question.toLowerCase();
 if(/surviv|return|escape|journey|reach|travel|home|expedition/.test(q))return {subject:'the road and those travelling it',action:'return safely',hope:'a way through danger remains',cost:'the road asks a price',choice:'the route, the companion, or the burden you carry'};
 if(/love|heart|relationship|friend|trust|together|marry|betray/.test(q))return {subject:'the bond you ask about',action:'restore the bond',hope:'trust can take root again',cost:'an unspoken wound still shapes the bond',choice:'what must be spoken, forgiven, or allowed to end'};
 if(/find|where|missing|lost|search|locat/.test(q))return {subject:'the thing or person you seek',action:'uncover what is hidden',hope:'the search still has an opening',cost:'a withheld truth distorts the trail',choice:'the clue you have dismissed or the witness you have not heard'};
 if(/battle|fight|war|enemy|victory|defeat|siege/.test(q))return {subject:'the approaching conflict',action:'prevail',hope:'boldness may turn the struggle',cost:'force carries a growing cost',choice:'when to strike, whom to protect, and what victory must preserve'};
 if(/king|queen|throne|summit|ruler|conspir|kingdom/.test(q))return {subject:'the balance of power',action:'keep power from becoming ruin',hope:'a fragile alliance still offers a way forward',cost:'an old debt weighs on the seat of power',choice:'whose loyalty survives the promise of advantage'};
 if(/choose|decision|should|path|option/.test(q))return {subject:'the choice before you',action:'choose wisely',hope:'a possible path is opening',cost:'an overlooked consequence follows the choice',choice:'what each path asks you to surrender'};
 return {subject:'the matter you bring before the bones',action:'move forward',hope:'the balance can still shift',cost:'an unseen cost presses upon the outcome',choice:'which influence you heed and which truth you overlook'};
}
const intensityTone=b=>b.intensity/b.die>=.7?'powerful':b.intensity/b.die<=.34?'faint':'measured';
export function offlineReading(bones,question='',context=''){
 const p=analyseCast(bones),theme=questionTheme(question),lead=p.sorted[0],weak=p.sorted.at(-1),paragraphs=[];
 if(!lead)return {paragraphs:[],ending:''};
 const leadRealm=realmAt(lead.x,lead.y),ratio=lead.intensity/lead.die;
 paragraphs.push((question?'For “'+question+'”, ':'The cloth answers an open question. ')+lead.name+' speaks with the strongest relative intensity: '+lead.intensity+' of '+lead.die+'. In '+leadRealm+', '+lead.zones[leadRealm]+'. Its '+intensityTone(lead)+' voice places '+lead.essence+' at the heart of '+theme.subject+'.'+(ratio<.35?' Even the strongest voice here is faint; this cast offers uncertainty rather than a clear promise.':''));
 if(context.trim())paragraphs.push('You place this omen against the following circumstances: “'+context.trim()+'”. The field offers no new facts about them. Read '+lead.name+' as a lens for '+theme.choice+', and consider how its '+leadRealm.toLowerCase()+' influence bears on the situation you described.');
 if(p.closest){const b=p.closest,z=realmAt(b.x,b.y),band=positionBand(b);
  paragraphs.push('Nearest the centre lies '+b.name+'. Its position gives '+b.essence+' immediate prominence in the pattern, even when another die speaks more loudly. From '+z+', '+b.zones[z]+'.'+(band==='unbound'?' Yet even this nearest bone is beyond the realm ring; the whole cast is unbound.':band==='distant'?' Even the nearest influence remains distant; what matters may be slow to take hold.':''));
 }
 if(p.contacts.length){const [a,b]=[...p.contacts].sort((x,y)=>y.reduce((s,b)=>s+b.intensity/b.die,0)-x.reduce((s,b)=>s+b.intensity/b.die,0))[0];
  paragraphs.push(a.name+' and '+b.name+' lie touching: '+a.essence+' is interwoven with '+b.essence+'. '+a.zones[realmAt(a.x,a.y)]+' while '+b.zones[realmAt(b.x,b.y)]+'. Treat them as one knot in the matter, rather than two separate predictions.');
 }else if(p.sorted.length>1){const b=p.sorted[1];paragraphs.push('No bones touch. The influences remain separate, and the second voice is '+b.name+' in '+realmAt(b.x,b.y)+': '+b.zones[realmAt(b.x,b.y)]+'. Consider this beside the first omen, without assuming the two are bound.');}
 if(p.ancestorLinks.length){const linked=p.ancestorLinks.map(pair=>pair.find(b=>b.id!=='ancestor')||pair[1]);paragraphs.push('Touching the Ancestor’s Jawbone, '+linked.map(b=>b.name).join(' and ')+' '+(linked.length===1?'is':'are')+' marked by the ancestral voices. An inherited duty, old promise, or family truth may colour these influences; this is a symbolic possibility, not a newly revealed fact.');}
 if(p.pointed.length){const [,b]=p.pointed[0];paragraphs.push('The Raven’s Talon points toward '+b.name+'. Its omen of ending falls across '+b.essence+': ask what must be relinquished before this influence can change.');}
 if(p.dominant.length===1)paragraphs.push('The largest gathering is in '+p.dominant[0]+'. This realm is where the story of '+theme.subject+' chiefly unfolds. '+(p.dominant[0]==='Hidden'?'The outcome is especially exposed to unknown forces.':p.dominant[0]==='Past'?'Return to the cause before judging the consequence.':p.dominant[0]==='Future'?'The emphasis falls on what may follow your next act.':p.dominant[0]==='Spirits'?'Listen for the unseen loyalties and beliefs behind events.':p.dominant[0]==='Flesh'?'Ground the question in bodies, resources, shelter, and survival.':'The living question asks for attention now.'));
 if(p.isolated.length){const b=[...p.isolated].sort((a,b)=>a.intensity/a.die-b.intensity/b.die)[0];paragraphs.push('Apart from the others, '+b.name+' reveals a neglected thread: '+b.zones[realmAt(b.x,b.y)]+'. Its '+intensityTone(b)+' intensity should be weighed alongside its isolation; a quiet truth is not automatically the largest one.');}
 if(p.formation)paragraphs.push('The field approximately forms a '+p.formation.toLowerCase()+'. '+({Path:'This suggests a journey or an event unfolding in stages.',Circle:'This suggests a returning cycle; ask what makes the same choice recur.',Cross:'This suggests conflict or a fated choice between competing claims.'}[p.formation])+' This is a reading of the visible arrangement.');
 const threat=bones.some(b=>b.id==='raven'&&['Future','Flesh','Hidden'].includes(realmAt(b.x,b.y)))||bones.some(b=>b.id==='serpent'&&['Flesh','Hidden'].includes(realmAt(b.x,b.y)));
 const hope=bones.some(b=>['wolf','deer','serpent','owl'].includes(b.id)&&realmAt(b.x,b.y)==='Future'&&b.intensity/b.die>=.5);
 const ending=(hope?theme.hope:threat?theme.cost:'The answer remains conditional')+'. To '+theme.action+', attend to '+theme.choice+'. Let '+lead.name+' guide the first step; do not overlook '+weak.name+' in '+realmAt(weak.x,weak.y)+'.';
 return {paragraphs,ending};
}
export function serializeBones(bones){return bones.map(b=>({id:b.id,uid:b.uid,intensity:b.intensity,x:b.x,y:b.y,angle:b.angle}));}
export function restoreBones(rows){
 if(!Array.isArray(rows)||rows.length<2||rows.length>6)throw Error('Invalid saved cast.');
 const ids=new Set();
 return rows.map((row,i)=>{
  const def=BONES.find(b=>b.id===row.id);if(!def||!Number.isInteger(row.intensity)||row.intensity<1||row.intensity>def.die)throw Error('Invalid saved bone.');
  if(![row.x,row.y,row.angle].every(Number.isFinite)||row.x<10||row.x>750||row.y<10||row.y>750||Math.abs(row.angle)>10000)throw Error('Invalid saved position.');
  const b=makeBody(def,i,()=>.5);Object.assign(b,{intensity:row.intensity,x:row.x,y:row.y,angle:row.angle});
  const uid=typeof row.uid==='string'&&/^[a-zA-Z0-9-]{1,40}$/.test(row.uid)?row.uid:b.uid;
  if(ids.has(uid))throw Error('Duplicate saved bone.');ids.add(uid);b.uid=uid;
  return b;
 });
}
export function castPayload(bones,question,context=''){
 const p=analyseCast(bones);
 return {apiVersion:3,question,context,bones:bones.map(b=>({uid:b.uid,name:b.name,die:b.die,intensity:b.intensity,realm:realmAt(b.x,b.y),x:b.x,y:b.y,angle:b.angle})),
 touching:p.contacts.map(pair=>pair.map(b=>b.name)),isolated:p.isolated.map(b=>b.name),dominant:p.dominant,ravenPointsAt:p.pointed.map(([,b])=>b.name),
 links:p.contacts.map(pair=>pair.map(b=>b.uid)),pointing:p.pointed.map(pair=>pair.map(b=>b.uid)),formation:p.formation};
}
export function validateEndpoint(value){
 const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||!url.hostname.includes('.')||/^(localhost|127\.|0\.|\[)/.test(url.hostname))throw Error('Use an HTTPS endpoint without credentials or query parameters.');
 return url.href.replace(/\/$/,'');
}
