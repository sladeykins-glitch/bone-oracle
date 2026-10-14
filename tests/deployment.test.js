import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {credentials,deploy,uploadForm,validateWidget} from '../scripts/deploy-cloudflare.mjs';

const config=JSON.parse(await readFile(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
const env={GITHUB_ACTIONS:'true',GITHUB_REPOSITORY:'sladeykins-glitch/bone-oracle',GITHUB_REF:'refs/heads/main',CLOUDFLARE_ACCOUNT_ID:'a'.repeat(32),CLOUDFLARE_API_TOKEN:'synthetic-token-for-tests-only'};
const settings={compatibility_flags:['nodejs_compat'],bindings:[{name:'GEMINI_API_KEY',type:'secret_text'},{name:'GEMINI_MODEL',type:'plain_text',text:'gemini-3.5-flash-lite'},{name:'ALLOWED_ORIGIN',type:'plain_text',text:'https://sladeykins-glitch.github.io'},{name:'OTHER_SECRET',type:'secret_text'}]};
const widget={name:'Bone Oracle - GitHub Pages',sitekey:'0x-test-production-widget',secret:'synthetic-turnstile-secret-for-tests',domains:['sladeykins-glitch.github.io'],mode:'managed'};
const success=result=>Response.json({success:true,result});
const options={env,load:async()=>({config:structuredClone(config),source:'export default {fetch(){}};'}),log:()=>{}};

function server({worker=settings,widgets=[],detail=widget,errorAt,publicOK=true}={}){
 const calls=[];
 const fetchImpl=async(url,init={})=>{
  calls.push({url,init});
  if(url.endsWith('/config'))return Response.json({apiVersion:publicOK?3:2,protectionReady:true,turnstileRequired:true,turnstileSiteKey:widget.sitekey});
  if(errorAt&&(url.includes(errorAt)||(errorAt==='worker-upload'&&init.method==='PUT')))return Response.json({success:false,errors:[{message:env.CLOUDFLARE_API_TOKEN+' '+widget.secret}]},{status:403});
  if(url.endsWith('/settings'))return success(structuredClone(worker));
  if(url.includes('/challenges/widgets?'))return success(structuredClone(widgets));
  if(url.endsWith('/challenges/widgets')&&init.method==='POST')return success(structuredClone(widget));
  if(url.includes('/challenges/widgets/'))return success(structuredClone(detail));
  if(url.endsWith('/workers/scripts/bone-oracle-ai')&&init.method==='PUT')return success({id:'bone-oracle-ai'});
  throw Error('Unexpected request');
 };
 return {calls,fetchImpl};
}

test('deployment requires private credentials and the original GitHub main workflow',async()=>{
 for(const patch of [{GITHUB_ACTIONS:'false'},{GITHUB_REPOSITORY:'someone/fork'},{GITHUB_REF:'refs/heads/preview'},{CLOUDFLARE_API_TOKEN:''},{CLOUDFLARE_ACCOUNT_ID:'../wrong'}]){
  const mock=server();await assert.rejects(deploy({...options,env:{...env,...patch},fetchImpl:mock.fetchImpl}));assert.equal(mock.calls.length,0);
 }
 assert.equal(credentials(env).account,env.CLOUDFLARE_ACCOUNT_ID);
});

test('one multipart upload applies protections while preserving the existing model and secret references',async()=>{
 const original=structuredClone(settings),form=uploadForm(config,settings,widget,'tested-source');
 const metadata=JSON.parse(await form.get('metadata').text());
 assert.deepEqual(settings,original);assert.equal(metadata.main_module,'cloudflare-worker.js');
 assert.deepEqual(metadata.keep_bindings,['secret_text']);assert.deepEqual(metadata.compatibility_flags,['nodejs_compat']);
 assert.ok(!metadata.bindings.some(b=>b.name==='GEMINI_API_KEY'||b.name==='OTHER_SECRET'));
 assert.equal(metadata.bindings.find(b=>b.name==='GEMINI_MODEL').text,'gemini-3.5-flash-lite');
 assert.deepEqual(metadata.bindings.filter(b=>b.type==='ratelimit').map(b=>[b.name,b.simple.limit,b.simple.period]),[['RATE_LIMITER',6,60],['AGGREGATE_LIMITER',30,60]]);
 assert.equal(metadata.bindings.find(b=>b.name==='TURNSTILE_SECRET_KEY').text,widget.secret);
 assert.equal(form.get('cloudflare-worker.js').type,'application/javascript+module');assert.equal(await form.get('cloudflare-worker.js').text(),'tested-source');
});

test('first deployment provisions Turnstile once, then uploads the Worker and verifies public readiness',async()=>{
 const mock=server(),logs=[];const result=await deploy({...options,fetchImpl:mock.fetchImpl,log:message=>logs.push(message)});
 const writes=mock.calls.filter(c=>['POST','PUT'].includes(c.init.method));assert.equal(writes.length,2);
 assert.ok(writes[0].url.endsWith('/challenges/widgets'));assert.deepEqual(JSON.parse(writes[0].init.body),{name:widget.name,domains:widget.domains,mode:'managed'});
 assert.ok(writes[1].url.endsWith('/workers/scripts/bone-oracle-ai'));assert.ok(writes[1].init.body instanceof FormData);
 assert.equal(mock.calls.at(-1).init.headers.Origin,'https://sladeykins-glitch.github.io');assert.equal(result.endpoint,'https://bone-oracle-ai.sladeykins.workers.dev');
 for(const call of mock.calls.filter(c=>!c.url.endsWith('/config'))){assert.equal(call.init.redirect,'error');assert.equal(call.init.headers.Authorization,'Bearer '+env.CLOUDFLARE_API_TOKEN);assert.ok(!call.url.includes(env.CLOUDFLARE_API_TOKEN));}
 assert.ok(!logs.join('\n').includes(env.CLOUDFLARE_API_TOKEN));assert.ok(!logs.join('\n').includes(widget.secret));
});

test('repeated deployments reuse the exact existing widget without rotating, updating, or duplicating it',async()=>{
 for(const savedSitekey of [false,true]){
  const worker=structuredClone(settings);if(savedSitekey)worker.bindings.push({name:'TURNSTILE_SITE_KEY',type:'plain_text',text:widget.sitekey});
  const mock=server({worker,widgets:[widget]});await deploy({...options,fetchImpl:mock.fetchImpl});
  assert.equal(mock.calls.filter(c=>c.url.includes('/challenges/')&&c.init.method!=='GET').length,0);
  assert.equal(mock.calls.filter(c=>c.init.method==='PUT').length,1);
 }
});

test('missing Gemini, extra resources, origin changes and unsafe limits abort before any mutation',async()=>{
 for(const patch of [
  {worker:{bindings:[]}},
  {worker:{bindings:[...settings.bindings,{name:'DB',type:'d1'}]}},
  {worker:{bindings:settings.bindings.map(b=>b.name==='ALLOWED_ORIGIN'?{...b,text:'https://example.com'}:b)}},
  {badConfig:{...config,name:'another-worker'}},
  {badConfig:{...config,ratelimits:[]}},
  {badConfig:{...config,ratelimits:config.ratelimits.map(b=>({...b,namespace_id:'3001'}))}}
 ]){
  const mock=server(patch);await assert.rejects(deploy({...options,fetchImpl:mock.fetchImpl,load:async()=>({config:patch.badConfig||config,source:'tested-source'})}));
  assert.equal(mock.calls.filter(c=>c.init.method!=='GET').length,0);
 }
});

test('ambiguous widgets, wrong hosts and test keys cannot authorize a Worker upload',async()=>{
 for(const patch of [{widgets:[widget,widget]},{widgets:[widget],detail:{...widget,domains:['another.example']}},{widgets:[widget],detail:{...widget,domains:[...widget.domains,'another.example']}},{widgets:[widget],detail:{...widget,sitekey:'1x00000000000000000000AA'}}]){
  const mock=server(patch);await assert.rejects(deploy({...options,fetchImpl:mock.fetchImpl}));assert.equal(mock.calls.filter(c=>c.init.method==='PUT').length,0);
 }
 assert.throws(()=>validateWidget({...widget,secret:widget.secret+'\n'+widget.secret}));
});

test('API failures never log upstream bodies or secrets, and partial success is reported accurately',async()=>{
 for(const errorAt of ['/settings','/challenges/widgets','worker-upload']){
  const mock=server({errorAt}),logs=[];let message='';
  try{await deploy({...options,fetchImpl:mock.fetchImpl,log:line=>logs.push(line)});}catch(error){message=error.message;}
  assert.ok(message.includes('Cloudflare rejected'));assert.ok(![message,...logs].join('\n').includes(widget.secret));assert.ok(![message,...logs].join('\n').includes(env.CLOUDFLARE_API_TOKEN));
 }
 const mock=server({publicOK:false});await assert.rejects(deploy({...options,fetchImpl:mock.fetchImpl}),/upload succeeded, but public verification/);
 assert.equal(mock.calls.filter(c=>c.init.method==='PUT').length,1);
});

test('widget pagination is exhausted before deciding to create a new widget',async()=>{
 const mock=server(),base=mock.fetchImpl;
 const fetchImpl=async(url,init)=>url.includes('/challenges/widgets?page=1')?Response.json({success:true,result:[],result_info:{total_pages:2}}):url.includes('/challenges/widgets?page=2')?Response.json({success:true,result:[widget],result_info:{total_pages:2}}):base(url,init);
 await deploy({...options,fetchImpl});assert.equal(mock.calls.filter(c=>c.init.method==='POST').length,0);
});
