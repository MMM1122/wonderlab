// Local-only integration preview. All records are disposable and stay in memory.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import {DatabaseSync} from 'node:sqlite';
const compiled=ts.transpileModule(fs.readFileSync('backend/worker.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {default:worker,sha256}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const sqlite=new DatabaseSync(':memory:');sqlite.exec(fs.readFileSync('backend/migrations/0001_init.sql','utf8'));
const prepare=query=>{let args=[];return{bind(...values){args=values;return this},async first(){return sqlite.prepare(query).get(...args)||null},async all(){return{results:sqlite.prepare(query).all(...args),success:true}},async run(){const r=sqlite.prepare(query).run(...args);return{success:true,meta:{changes:Number(r.changes)}}}}};
const DB={prepare,async batch(statements){sqlite.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.all());sqlite.exec('COMMIT');return result}catch(e){sqlite.exec('ROLLBACK');throw e}}};
const origin='http://localhost:5174',root=path.resolve('work/connected-preview/site');
const env={DB,SITE_URL:origin,ADMIN_KEY_SHA256:await sha256('local-development-only'),IP_HASH_SECRET:'local-preview-only-secret-not-for-production'};
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.json':'application/json','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{try{const url=new URL(req.url,origin);if(url.pathname.startsWith('/api/')){const parts=[];for await(const chunk of req)parts.push(chunk);const headers=new Headers();for(const[k,v]of Object.entries(req.headers))if(v)headers.set(k,Array.isArray(v)?v.join(','):v);headers.set('CF-Connecting-IP','127.0.0.1');const response=await worker.fetch(new Request(url,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(parts)}),env,{waitUntil:p=>p.catch(()=>{})});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return}const file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res)}catch{res.writeHead(500);res.end('Preview error')}}).listen(5174,'127.0.0.1',()=>console.log('Connected local preview: http://localhost:5174 — test admin key: local-development-only'));
