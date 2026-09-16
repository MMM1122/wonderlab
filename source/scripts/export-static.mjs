import {build} from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const destination=path.resolve(root,process.argv[2]||'work/static-export');
const names=['intro-forest.png','intro-walk-longhair.png','cosmic-garden.png'];
const assets=new Map(names.map(name=>['/'+name,'data:image/png;base64,'+fs.readFileSync(path.join(root,'public',name)).toString('base64')]));
const live=process.env.WONDER_SITE_URL||'https://wonderlab.observer/';
const basePath=process.env.WONDER_BASE_PATH||'/';
if(!/^\/[a-zA-Z0-9_\/-]*$/.test(basePath)||!basePath.endsWith('/'))throw Error('Invalid site base path');
const apiBase=process.env.WONDER_API_URL||'';
if(apiBase){const u=new URL(apiBase);if(u.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(u.hostname))throw Error('API URL must use HTTPS');}
const configTag=(mode)=>'<script type="application/json" id="wonder-config">'+JSON.stringify({mode,apiBase:mode==='preview'?'':apiBase,basePath}).replaceAll('<','\\u003c')+'</script>';
const result=await build({
 configFile:false,root,
 define:{'process.env.NODE_ENV':JSON.stringify('production')},
 resolve:{alias:{'@':root}},
 plugins:[{name:'standalone-assets',enforce:'pre',transform(source,id){
  if(!id.startsWith(root+'/app/'))return;
  let code=source;
  for(const [url,data] of assets)code=code.split(url).join(data);
  
  return{code,map:null};
 }},react()],
 build:{write:false,target:'es2020',lib:{entry:path.join(root,'static/entry.tsx'),name:'WonderLabStatic',formats:['iife']},cssCodeSplit:false,minify:true,emptyOutDir:false}
});
const chunks=(Array.isArray(result)?result:[result]).flatMap(r=>r.output);
const js=chunks.filter(c=>c.type==='chunk').map(c=>c.code).join('\n');
const css=chunks.filter(c=>c.type==='asset'&&c.fileName.endsWith('.css')).map(c=>c.source).join('\n');
if(js.includes('process.env'))throw Error('Browser bundle must not depend on process.env');
const extraCSS='.offline-note{position:fixed;bottom:10px;left:12px;z-index:22;background:#161c1bee;border:1px solid #626958;padding:8px 12px;border-radius:20px;font:12px sans-serif;color:#ccc}.offline-note a{margin-left:10px;color:#d6fc77;text-decoration:underline}.startup-message{padding:8vh 8vw;font:16px/1.8 Arial,sans-serif;color:#f5f3ed;background:#121419;min-height:100vh}.startup-message h1{font-size:40px}.startup-message a{color:#d6fc77;text-decoration:underline}@media(max-width:600px){.offline-note{bottom:70px;font-size:11px}}';
const fallback='<div id="startup-message" class="startup-message"><h1>Wonder Lab</h1><p id="startup-status">正在打开奇思妙想的世界…</p><p>如果未能显示，请用最新版 Chrome、Edge 或 Safari 打开。</p><a href="'+live+'">打开在线版</a></div>';
const guard="window.addEventListener('error',function(){var s=document.getElementById('startup-status');if(s)s.textContent='页面未能启动。请重新下载最新文件，或打开在线版。';});";
const favicon='data:image/svg+xml,'+encodeURIComponent(fs.readFileSync(path.join(root,'public/favicon.svg'),'utf8'));
const head='<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Wonder Lab · 奇思妙想实验室"><title>Wonder Lab</title><link rel="icon" href="'+favicon+'">';
const body='<body><div id="root">'+fallback+'</div><noscript><p>请启用 JavaScript，或访问 <a href="'+live+'">Wonder Lab 在线版</a>。</p></noscript><script>'+guard+'</script>';
fs.mkdirSync(path.join(destination,'site/assets'),{recursive:true});
const inlineScript=js.replace(/<\/script/gi,'<\\/script');
fs.writeFileSync(path.join(destination,'Wonder-Lab-离线预览.html'),head+'<style>'+css+extraCSS+'</style></head>'+body+configTag('preview')+'<script>'+inlineScript+'</script></body></html>');
let staticJS=js,staticCSS=css;
for(const [url,data] of assets){
 const relative='./assets'+url;
 staticJS=staticJS.split(data).join(relative);
 staticCSS=staticCSS.split(data).join(relative);
 fs.copyFileSync(path.join(root,'public',url.slice(1)),path.join(destination,'site',relative));
}
fs.writeFileSync(path.join(destination,'site/assets/app.js'),staticJS);
fs.writeFileSync(path.join(destination,'site/styles.css'),staticCSS+extraCSS);
fs.writeFileSync(path.join(destination,'site/index.html'),head+'<base href="'+basePath+'"><link rel="stylesheet" href="./styles.css"></head>'+body+configTag('connected')+'<script defer src="./assets/app.js"></script></body></html>');
fs.writeFileSync(path.join(destination,'site/.nojekyll'),'');
fs.writeFileSync(path.join(destination,'site/site-config.json'),JSON.stringify({apiBase},null,2));
fs.writeFileSync(path.join(destination,'index-connected.html'),head+'<style>'+css+extraCSS+'</style></head>'+body+configTag('connected')+'<script>'+inlineScript+'</script></body></html>');
console.log('Created standalone HTML and GitHub Pages files in '+destination);

for(const route of ['admin','blog']){fs.mkdirSync(path.join(destination,'site',route),{recursive:true});fs.copyFileSync(path.join(destination,'site/index.html'),path.join(destination,'site',route,'index.html'));}
fs.copyFileSync(path.join(destination,'site/index.html'),path.join(destination,'site/404.html'));
