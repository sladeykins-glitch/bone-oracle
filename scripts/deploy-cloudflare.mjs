// Runs only in the explicitly dispatched GitHub workflow. Credentials and the
// Turnstile secret stay in runner memory and HTTPS request bodies, never files,
// command arguments, artifacts, or log messages. The Gemini secret is retained
// by Cloudflare's keep_bindings mechanism; its value is never requested.
import {readFile, appendFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const REPOSITORY='sladeykins-glitch/bone-oracle';
const ORIGIN='https://sladeykins-glitch.github.io';
const WORKER='bone-oracle-ai';
const ENDPOINT='https://bone-oracle-ai.sladeykins.workers.dev';
const WIDGET_NAME='Bone Oracle - GitHub Pages';
const root=new URL('../',import.meta.url);
const replaced=new Set(['RATE_LIMITER','AGGREGATE_LIMITER','ALLOWED_ORIGIN','TURNSTILE_SITE_KEY','TURNSTILE_SECRET_KEY']);

export function credentials(env){
 if(env.GITHUB_ACTIONS!=='true'||env.GITHUB_REPOSITORY!==REPOSITORY||env.GITHUB_REF!=='refs/heads/main')throw Error('Run this deployment using the manual workflow on the original repository main branch.');
 const account=(env.CLOUDFLARE_ACCOUNT_ID||'').trim(),token=(env.CLOUDFLARE_API_TOKEN||'').trim();
 if(!/^[a-f0-9]{32}$/i.test(account))throw Error('Add CLOUDFLARE_ACCOUNT_ID in GitHub Actions repository secrets.');
 if(token.length<20||token.length>512||/\s/.test(token))throw Error('Add CLOUDFLARE_API_TOKEN in GitHub Actions repository secrets.');
 return {account,token};
}

export function validateSettings(config,settings){
 if(config.name!==WORKER||config.main!=='cloudflare-worker.js'||config.keep_vars!==true)throw Error('The deployment must target the existing bone-oracle-ai Worker and preserve its variables.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(config.compatibility_date))throw Error('Invalid Worker compatibility date.');
 if(!Array.isArray(settings.bindings)||!settings.bindings.some(b=>b.name==='GEMINI_API_KEY'&&b.type==='secret_text'))throw Error('The existing Worker must already have its GEMINI_API_KEY secret. Nothing was deployed.');
 if(settings.bindings.some(b=>!['plain_text','secret_text','ratelimit'].includes(b.type)))throw Error('The existing Worker has additional resources. Review its bindings before deploying with this workflow.');
 const origin=settings.bindings.find(b=>b.name==='ALLOWED_ORIGIN');
 if(origin&&(origin.type!=='plain_text'||origin.text!==ORIGIN))throw Error('The existing allowed origin differs from this website. Review it before deployment.');
 const expected={RATE_LIMITER:6,AGGREGATE_LIMITER:30};
 if(!Array.isArray(config.ratelimits)||config.ratelimits.length!==2||new Set(config.ratelimits.map(b=>b.namespace_id)).size!==2)throw Error('Both distinct rate-limit namespaces are required.');
 for(const [name,limit]of Object.entries(expected)){
  const rate=config.ratelimits.find(b=>b.name===name);
  if(!rate||!/^[1-9]\d*$/.test(rate.namespace_id)||rate.simple?.period!==60||rate.simple.limit!==limit)throw Error('The tested rate-limit settings are required.');
 }
}

export function validateWidget(widget){
 if(!widget||!/^[a-z0-9_-]{1,64}$/i.test(widget.sitekey||'')||/^[123]x000/.test(widget.sitekey)||typeof widget.secret!=='string'||widget.secret.length<20||widget.secret.length>512||/\s/.test(widget.secret))throw Error('Cloudflare did not return a valid production Turnstile widget.');
 if(!Array.isArray(widget.domains)||widget.domains.length!==1||widget.domains[0]!==new URL(ORIGIN).hostname)throw Error('The Turnstile widget must be restricted to this website hostname. No existing widget was changed.');
 if(!['managed','non-interactive','invisible'].includes(widget.mode))throw Error('Unsupported Turnstile widget mode.');
 return widget;
}

export function uploadForm(config,settings,widget,source){
 validateSettings(config,settings);validateWidget(widget);
 const metadata={main_module:'cloudflare-worker.js',compatibility_date:config.compatibility_date,
  // Existing secret values are neither fetched nor copied. A binding supplied
  // explicitly below replaces that name while other secret bindings are kept.
  keep_bindings:['secret_text'],bindings:[
   ...settings.bindings.filter(b=>b.type!=='secret_text'&&!replaced.has(b.name)),
   ...config.ratelimits.map(b=>({...b,type:'ratelimit'})),
   {name:'ALLOWED_ORIGIN',type:'plain_text',text:ORIGIN},
   {name:'TURNSTILE_SITE_KEY',type:'plain_text',text:widget.sitekey},
   {name:'TURNSTILE_SECRET_KEY',type:'secret_text',text:widget.secret}
  ]};
 for(const key of ['compatibility_flags','usage_model','limits','logpush','tail_consumers','observability'])if(settings[key]!==undefined)metadata[key]=settings[key];
 const form=new FormData();form.set('metadata',new Blob([JSON.stringify(metadata)],{type:'application/json'}));
 form.set('cloudflare-worker.js',new Blob([source],{type:'application/javascript+module'}),'cloudflare-worker.js');
 return form;
}

export async function deploy({env=process.env,fetchImpl=fetch,log=console.log,load=async()=>({config:JSON.parse(await readFile(new URL('wrangler.jsonc',root),'utf8')),source:await readFile(new URL('cloudflare-worker.js',root),'utf8')})}={}){
 const {account,token}=credentials(env),{config,source}=await load();
 const base='https://api.cloudflare.com/client/v4/accounts/'+account;
 async function api(path,method='GET',body){
  let response;
  try{response=await fetchImpl(base+path,{method,redirect:'error',headers:{Authorization:'Bearer '+token,...(body&&!(body instanceof FormData)?{'Content-Type':'application/json'}:{})},body:body instanceof FormData?body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});}catch{throw Error('Cloudflare could not be reached. No API response details or credentials are logged.');}
  let data;try{data=await response.json();}catch{throw Error('Cloudflare returned an invalid API response.');}
  if(!response.ok||data.success!==true)throw Error('Cloudflare rejected a '+method+' request (HTTP '+response.status+'). Check the account ID and token permissions.');
  return data;
 }
 const settings=(await api('/workers/scripts/'+WORKER+'/settings')).result;
 validateSettings(config,settings);log('Existing Worker and Gemini secret binding verified.');
 const currentKey=settings.bindings.find(b=>b.name==='TURNSTILE_SITE_KEY'&&b.type==='plain_text')?.text;
 let widget;
 if(currentKey){if(!/^[a-z0-9_-]{1,64}$/i.test(currentKey))throw Error('Invalid existing Turnstile site key.');widget=(await api('/challenges/widgets/'+encodeURIComponent(currentKey))).result;}
 else{
  const matches=[];
  for(let page=1;page<=20;page++){
   const listed=await api('/challenges/widgets?page='+page+'&per_page=100');
   if(!Array.isArray(listed.result))throw Error('Cloudflare returned an invalid widget list.');
   matches.push(...listed.result.filter(w=>w.name===WIDGET_NAME));
   if(page>=(listed.result_info?.total_pages||1))break;
   if(page===20)throw Error('Too many widget pages. Review the account before deploying.');
  }
  if(matches.length>1)throw Error('Multiple Bone Oracle widgets exist. Review them before deploying.');
  if(matches.length)widget=(await api('/challenges/widgets/'+encodeURIComponent(matches[0].sitekey))).result;
  else widget=(await api('/challenges/widgets','POST',{name:WIDGET_NAME,domains:[new URL(ORIGIN).hostname],mode:'managed'})).result;
 }
 validateWidget(widget);log('Turnstile widget ready for the website hostname.');
 // One upload applies code, rate limits, public variables, and the Turnstile
 // secret together. There is no intermediate unprotected Worker deployment.
 await api('/workers/scripts/'+WORKER,'PUT',uploadForm(config,settings,widget,source));
 log('V3 Worker, rate-limit bindings, and Turnstile uploaded together.');
 let verified=false;
 try{const response=await fetchImpl(ENDPOINT+'/config',{headers:{Origin:ORIGIN},redirect:'error',signal:AbortSignal.timeout(20000)});
  const data=await response.json();verified=response.ok&&data.apiVersion===3&&data.protectionReady===true&&data.turnstileRequired===true&&data.turnstileSiteKey===widget.sitekey;
 }catch{}
 if(!verified)throw Error('The Worker upload succeeded, but public verification did not pass. Check the live site before running deployment again.');
 log('Public V3 configuration verified. Complete one normal cast on the website to check Gemini and the challenge.');
 return {endpoint:ENDPOINT};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const result=await deploy();if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,'V3 Worker, both rate limits, and Turnstile are deployed. Existing Gemini secret retained.\n\nWebsite: https://sladeykins-glitch.github.io/bone-oracle/\n\nWorker: '+result.endpoint+'\n\nRun a normal cast on the website to verify the live Gemini response.\n');}
 catch(error){console.error(error.message);process.exitCode=1;}
}
