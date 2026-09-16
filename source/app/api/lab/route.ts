import {database} from '@/db/raw';
import {getChatGPTUser} from '@/app/chatgpt-auth';
export const dynamic='force-dynamic';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){try{const db=database(),user=await getChatGPTUser();const [p,c,o]=await Promise.all([db.prepare('SELECT id,title,title_en AS titleEn,body,body_en AS bodyEn,category,created_at AS createdAt FROM posts ORDER BY created_at DESC LIMIT 200').all(),db.prepare('SELECT id,name,body,created_at AS createdAt FROM comments ORDER BY created_at DESC LIMIT 100').all(),db.prepare("SELECT user_id FROM owners WHERE key='owner'").first<{user_id:string}>()]);return reply({posts:p.results,comments:c.results,signedIn:!!user,isOwner:!!user&&o?.user_id===user.userId,canClaim:!o&&!!user});}catch(e){console.error('Lab load failed',e);return reply({error:'暂时无法读取内容，请稍后重试。 / Unable to load. Please retry.'},503)}}
export async function POST(request:Request){try{
const origin=request.headers.get('origin');if(!origin||origin!==new URL(request.url).origin)return reply({error:'Request origin rejected'},403);
const user=await getChatGPTUser();if(!user)return reply({error:'请先登录。 / Please sign in.'},401);
const raw=await request.text();if(raw.length>60000)return reply({error:'内容太长。 / Content too long.'},413);
let data:any;try{data=JSON.parse(raw)}catch{return reply({error:'Invalid request'},400)}
const db=database();const owner=await db.prepare("SELECT user_id FROM owners WHERE key='owner'").first<{user_id:string}>();
// First owner is claimed while Sites access remains owner-private. Claim before sharing.
if(data.action==='claim'){if(owner&&owner.user_id!==user.userId)return reply({error:'写作台仅对主人开放。 / Owner access only.'},403);await db.prepare("INSERT OR IGNORE INTO owners (key,user_id) VALUES ('owner',?)").bind(user.userId).run();const saved=await db.prepare("SELECT user_id FROM owners WHERE key='owner'").first<{user_id:string}>();return saved?.user_id===user.userId?reply({ok:true}):reply({error:'Owner access only'},403);}
if(data.action==='comment'){
if(typeof data.name!=='string'||!data.name.trim()||data.name.trim().length>40||typeof data.body!=='string'||!data.body.trim()||data.body.trim().length>1000)return reply({error:'请填写昵称和留言（最多 1000 字）。 / Add a name and message (max 1,000 characters).'},400);
const recent=await db.prepare('SELECT id FROM comments WHERE user_id=? AND created_at>? LIMIT 1').bind(user.userId,Date.now()-15000).first();if(recent)return reply({error:'慢一点，15 秒后再留言。 / Please wait 15 seconds.'},429);
await db.prepare('INSERT INTO comments (id,user_id,name,body,created_at) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),user.userId,data.name.trim(),data.body.trim(),Date.now()).run();return reply({ok:true});}
if(!owner||owner.user_id!==user.userId)return reply({error:'写作台仅对主人开放。 / Owner access only.'},403);
if(data.action==='post'){
if(!['thoughts','perspectives','finds'].includes(data.category)||typeof data.title!=='string'||!data.title.trim()||data.title.length>160||typeof data.body!=='string'||!data.body.trim()||data.body.length>20000||typeof data.titleEn!=='string'||data.titleEn.length>160||typeof data.bodyEn!=='string'||data.bodyEn.length>20000)return reply({error:'请检查标题和正文长度。 / Check title and body lengths.'},400);
if(data.id){if(typeof data.id!=='string')return reply({error:'Invalid ID'},400);const r=await db.prepare('UPDATE posts SET title=?,title_en=?,body=?,body_en=?,category=? WHERE id=?').bind(data.title.trim(),data.titleEn.trim(),data.body.trim(),data.bodyEn.trim(),data.category,data.id).run();if(!r.meta.changes)return reply({error:'文章不存在。 / Post not found.'},404);}else await db.prepare('INSERT INTO posts (id,title,title_en,body,body_en,category,created_at) VALUES (?,?,?,?,?,?,?)').bind(crypto.randomUUID(),data.title.trim(),data.titleEn.trim(),data.body.trim(),data.bodyEn.trim(),data.category,Date.now()).run();return reply({ok:true});}
return reply({error:'Unknown action'},400);
}catch(e){console.error('Lab save failed',e);return reply({error:'保存失败，文字已保留，请重试。 / Save failed. Your text is kept; please retry.'},503)}}
