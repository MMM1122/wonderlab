export interface Env {
 DB:D1Database; SITE_URL:string; ADMIN_KEY_SHA256:string; IP_HASH_SECRET:string;
 NOTIFY_TO?:string; NOTIFY_FROM?:string; TURNSTILE_SITE_KEY?:string; TURNSTILE_SECRET_KEY?:string;
 EMAIL?:{send(message:{from:string;to:string;subject:string;text:string}):Promise<unknown>};
}
type Context={waitUntil(promise:Promise<unknown>):void};
type Data=Record<string,unknown>;
class ApiError extends Error{constructor(public status:number,message:string){super(message)}}
const fail=(status:number,message:string):never=>{throw new ApiError(status,message)};
const json=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function sha256(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('')}
function equal(a:string,b:string){let n=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)n|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return n===0}
const randomToken=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
function site(env:Env){try{const u=new URL(env.SITE_URL);if(u.protocol!=='https:'&&u.hostname!=='localhost')throw Error();return u}catch{return fail(503,'网站配置尚未完成。 / Site configuration is incomplete.')}}
function configured(env:Env){if(!env.DB||!/^([a-f0-9]{64})$/.test(env.ADMIN_KEY_SHA256||'')||(env.IP_HASH_SECRET?.length||0)<32)fail(503,'后台尚未配置完成。 / Backend setup is incomplete.')}
async function payload(request:Request):Promise<Data>{
 if(!request.headers.get('content-type')?.startsWith('application/json'))fail(415,'Expected JSON');
 if(Number(request.headers.get('content-length')||0)>150000)fail(413,'内容太长。 / Content too long.');
 const reader=request.body?.getReader();if(!reader)fail(400,'Empty request');
 let bytes=0;const chunks:Uint8Array[]=[];
 while(true){const r=await reader!.read();if(r.done)break;bytes+=r.value.length;if(bytes>150000){await reader!.cancel();fail(413,'内容太长。 / Content too long.')}chunks.push(r.value)}
 const all=new Uint8Array(bytes);let offset=0;for(const c of chunks){all.set(c,offset);offset+=c.length}
 try{const data=JSON.parse(new TextDecoder().decode(all));if(!data||typeof data!=='object'||Array.isArray(data))throw Error();return data}catch{return fail(400,'Invalid JSON')}
}
function string(data:Data,key:string,max:number,required=true){const value=data[key];if(!required&&(value===undefined||value===''))return '';if(typeof value!=='string'||value.length>max||(required&&!value.trim()))fail(400,'请检查填写内容。 / Check the form fields.');return (value as string).trim()}
async function rate(request:Request,env:Env,bucket:string,limit:number,seconds:number){
 const ip=request.headers.get('CF-Connecting-IP')||'local';
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.IP_HASH_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const digest=Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(ip))),b=>b.toString(16).padStart(2,'0')).join('');
 const window=Math.floor(Date.now()/(seconds*1000));
 const r=await env.DB.prepare('INSERT INTO rate_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(`${bucket}:${digest}:${window}`,(window+1)*seconds*1000).first<{count:number}>();
 if(!r||r.count>limit)fail(429,'操作过于频繁，请稍后重试。 / Too many attempts. Please try again later.');
}
async function admin(request:Request,env:Env){
 const token=request.headers.get('Authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];if(!token)fail(401,'请登录管理后台。 / Please sign in to manage the site.');
 const hash=await sha256(token!);const session=await env.DB.prepare('SELECT admin_hash,expires_at FROM sessions WHERE token_hash=?').bind(hash).first<{admin_hash:string;expires_at:number}>();
 if(!session||session.expires_at<=Date.now()||!equal(session.admin_hash,env.ADMIN_KEY_SHA256))fail(401,'登录已失效，请重新登录。 / Session expired. Please sign in again.');return hash;
}
const postColumns='id,title,title_en AS titleEn,body,body_en AS bodyEn,category,status,created_at AS createdAt,updated_at AS updatedAt';
const commentColumns='id,name,body,status,created_at AS createdAt';
function page(value:string|null){const n=Number(value||'0');if(!Number.isInteger(n)||n<0||n>100000)fail(400,'Invalid page');return n}
function notificationReady(env:Env){return !!(env.EMAIL&&env.NOTIFY_FROM&&env.NOTIFY_TO)}
export async function flushNotifications(env:Env){
 if(!notificationReady(env))return;
 const now=Date.now();const rows=await env.DB.prepare("SELECT comment_id FROM notifications WHERE ((status='pending' AND next_attempt<=?) OR (status='sending' AND locked_until<?)) AND attempts<5 LIMIT 10").bind(now,now).all<{comment_id:string}>();
 for(const row of rows.results){
  const claimed=await env.DB.prepare("UPDATE notifications SET status='sending',attempts=attempts+1,locked_until=? WHERE comment_id=? AND ((status='pending' AND next_attempt<=?) OR (status='sending' AND locked_until<?)) RETURNING attempts").bind(now+120000,row.comment_id,now,now).first<{attempts:number}>();
  if(!claimed)continue;
  try{
   const comment=await env.DB.prepare('SELECT name,body FROM comments WHERE id=?').bind(row.comment_id).first<{name:string;body:string}>();
   if(!comment){await env.DB.prepare('DELETE FROM notifications WHERE comment_id=?').bind(row.comment_id).run();continue}
   await env.EMAIL!.send({from:env.NOTIFY_FROM!,to:env.NOTIFY_TO!,subject:'Wonder Lab · New guestbook message',text:`A new message is waiting in your Wonder Lab dashboard.\n\nFrom: ${comment.name}\n\n${comment.body}\n\nReview it at ${site(env).href}#admin\n\nMessage ID: ${row.comment_id}`});
   await env.DB.prepare("UPDATE notifications SET status='sent',last_error=NULL,locked_until=0 WHERE comment_id=?").bind(row.comment_id).run();
  }catch{
   await env.DB.prepare('UPDATE notifications SET status=?,last_error=?,next_attempt=?,locked_until=0 WHERE comment_id=?').bind(claimed.attempts>=5?'failed':'pending','Email provider did not confirm sending.',Date.now()+Math.min(3600000,60000*2**claimed.attempts),row.comment_id).run();
  }
 }
 // A Worker can stop after claiming the last attempt. Make expired final leases visible as failed.
 await env.DB.prepare("UPDATE notifications SET status='failed',last_error='Sending could not be confirmed; review before retrying.',locked_until=0 WHERE status='sending' AND locked_until<? AND attempts>=5").bind(Date.now()).run();
}
async function route(request:Request,env:Env,ctx:Context){
 const url=new URL(request.url);configured(env);
 if(url.pathname==='/api/health'&&request.method==='GET'){await env.DB.prepare('SELECT 1').first();return json({ok:true})}
 if(url.pathname==='/api/lab'&&request.method==='GET'){
  const [posts,comments]=await env.DB.batch([env.DB.prepare(`SELECT ${postColumns} FROM posts WHERE status='published' ORDER BY created_at DESC,id DESC LIMIT 200`),env.DB.prepare(`SELECT ${commentColumns} FROM comments WHERE status='approved' ORDER BY created_at DESC,id DESC LIMIT 100`)]);
  return json({posts:posts.results,comments:comments.results,signedIn:false,isOwner:false,canClaim:false,guestPosting:true,turnstileSiteKey:env.TURNSTILE_SITE_KEY||''});
 }
 if(url.pathname==='/api/login'&&request.method==='POST'){
  await rate(request,env,'login',5,900);const data=await payload(request);const key=string(data,'key',256);
  if(!equal(await sha256(key),env.ADMIN_KEY_SHA256))fail(401,'管理员密钥不正确。 / Incorrect administrator key.');
  const token=randomToken();const expiresAt=Date.now()+8*3600000;
  await env.DB.prepare('INSERT INTO sessions(token_hash,admin_hash,expires_at) VALUES (?,?,?)').bind(await sha256(token),env.ADMIN_KEY_SHA256,expiresAt).run();
  return json({token,expiresAt});
 }
 if(url.pathname==='/api/logout'&&request.method==='POST'){const hash=await admin(request,env);await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(hash).run();return json({ok:true})}
 if(url.pathname==='/api/lab'&&request.method==='POST'){
  await rate(request,env,'comment',3,300);const data=await payload(request);
  if(data.action!=='comment')fail(400,'Unknown action');if(data.website)fail(400,'Unable to accept this message.');
  const name=string(data,'name',40),body=string(data,'body',1000);
  if(!!env.TURNSTILE_SITE_KEY!==!!env.TURNSTILE_SECRET_KEY)fail(503,'留言验证尚未配置完成。 / Guestbook verification setup is incomplete.');
  if(env.TURNSTILE_SECRET_KEY){
   const token=string(data,'turnstileToken',2048);
   const result=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:env.TURNSTILE_SECRET_KEY,response:token,remoteip:request.headers.get('CF-Connecting-IP')||undefined}),signal:AbortSignal.timeout(10000)});
   const verify=await result.json() as {success?:boolean;hostname?:string;action?:string};
   if(!result.ok||!verify.success||verify.hostname!==site(env).hostname||verify.action!=='guestbook')fail(400,'验证未通过，请重试。 / Verification failed. Please try again.');
  }
  const id=crypto.randomUUID(),now=Date.now();
  await env.DB.batch([env.DB.prepare("INSERT INTO comments(id,name,body,status,created_at) VALUES (?,?,?,'pending',?)").bind(id,name,body,now),env.DB.prepare("INSERT INTO notifications(comment_id,status,next_attempt) VALUES (?,'pending',?)").bind(id,now)]);
  ctx.waitUntil(flushNotifications(env));return json({ok:true,pending:true,id},201);
 }
 if(url.pathname==='/api/admin'){
  await admin(request,env);
  if(request.method==='GET'){
   const pp=page(url.searchParams.get('postPage')),cp=page(url.searchParams.get('commentPage'));
   const [posts,comments,pc,cc,pending]=await env.DB.batch([
    env.DB.prepare(`SELECT ${postColumns} FROM posts ORDER BY updated_at DESC,id DESC LIMIT 20 OFFSET ?`).bind(pp*20),
    env.DB.prepare('SELECT c.id,c.name,c.body,c.status,c.created_at AS createdAt,n.status AS notificationStatus,n.last_error AS notificationError FROM comments c LEFT JOIN notifications n ON n.comment_id=c.id ORDER BY c.created_at DESC,c.id DESC LIMIT 20 OFFSET ?').bind(cp*20),
    env.DB.prepare('SELECT count(*) AS total FROM posts'),env.DB.prepare('SELECT count(*) AS total FROM comments'),env.DB.prepare("SELECT count(*) AS total FROM comments WHERE status='pending'")]);
   return json({posts:posts.results,comments:comments.results,postCount:(pc.results[0] as {total:number}).total,commentCount:(cc.results[0] as {total:number}).total,pendingCount:(pending.results[0] as {total:number}).total,notificationsConfigured:notificationReady(env),turnstileConfigured:!!(env.TURNSTILE_SITE_KEY&&env.TURNSTILE_SECRET_KEY)});
  }
  if(request.method==='POST'){
   const data=await payload(request);const id=string(data,'id',100,false);
   if(data.action==='post'){
    const title=string(data,'title',160),body=string(data,'body',20000),titleEn=string(data,'titleEn',160,false),bodyEn=string(data,'bodyEn',20000,false);
    if(!['thoughts','perspectives','finds'].includes(String(data.category))||!['draft','published'].includes(String(data.status)))fail(400,'Invalid category or status');
    if(id){const r=await env.DB.prepare('UPDATE posts SET title=?,title_en=?,body=?,body_en=?,category=?,status=?,updated_at=? WHERE id=?').bind(title,titleEn,body,bodyEn,data.category,data.status,Date.now(),id).run();if(!r.meta.changes)fail(404,'Article not found')}
    else await env.DB.prepare('INSERT INTO posts(id,title,title_en,body,body_en,category,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),title,titleEn,body,bodyEn,data.category,data.status,Date.now(),Date.now()).run();
    return json({ok:true});
   }
   if(!id)fail(400,'ID required');
   if(data.action==='deletePost'){await env.DB.prepare('DELETE FROM posts WHERE id=?').bind(id).run();return json({ok:true})}
   if(data.action==='moderate'){
    if(!['approved','hidden','pending'].includes(String(data.status)))fail(400,'Invalid status');
    const r=await env.DB.prepare('UPDATE comments SET status=? WHERE id=?').bind(data.status,id).run();if(!r.meta.changes)fail(404,'Message not found');return json({ok:true});
   }
   if(data.action==='deleteComment'){await env.DB.batch([env.DB.prepare('DELETE FROM notifications WHERE comment_id=?').bind(id),env.DB.prepare('DELETE FROM comments WHERE id=?').bind(id)]);return json({ok:true})}
   if(data.action==='retryNotification'){
    if(!notificationReady(env))fail(503,'请先配置发信服务。 / Configure email delivery first.');
    await env.DB.prepare("UPDATE notifications SET status='pending',attempts=0,next_attempt=?,last_error=NULL WHERE comment_id=? AND status='failed'").bind(Date.now(),id).run();ctx.waitUntil(flushNotifications(env));return json({ok:true});
   }
   fail(400,'Unknown action');
  }
 }
 return json({error:'Not found'},404);
}
export default {
 async fetch(request:Request,env:Env,ctx:Context){
  let allowed:string;try{allowed=site(env).origin}catch{return json({error:'Site configuration is incomplete.'},503)}
  const origin=request.headers.get('Origin');
  if(origin&&origin!==allowed)return json({error:'Origin not allowed'},403);
  if(request.method!=='GET'&&request.method!=='OPTIONS'&&origin!==allowed)return json({error:'Origin required'},403);
  let response:Response;
  try{response=request.method==='OPTIONS'?new Response(null,{status:204}):await route(request,env,ctx)}catch(e){response=json({error:e instanceof ApiError?e.message:'服务暂时不可用，请重试。 / Service unavailable. Please retry.'},e instanceof ApiError?e.status:503);if(!(e instanceof ApiError))console.error('Wonder Lab request failed')}
  response.headers.set('Vary','Origin');if(origin===allowed){response.headers.set('Access-Control-Allow-Origin',allowed);response.headers.set('Access-Control-Allow-Methods','GET, POST, OPTIONS');response.headers.set('Access-Control-Allow-Headers','Content-Type, Authorization');response.headers.set('Access-Control-Max-Age','600')}
  return response;
 },
 async scheduled(_event:unknown,env:Env,ctx:Context){ctx.waitUntil((async()=>{configured(env);await env.DB.batch([env.DB.prepare('DELETE FROM sessions WHERE expires_at<?').bind(Date.now()),env.DB.prepare('DELETE FROM rate_limits WHERE expires_at<?').bind(Date.now())]);await flushNotifications(env)})())}
};
