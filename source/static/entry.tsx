import React,{useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import Home from '../app/page';
import '../app/globals.css';
import './style.css';
import {createService,type SiteConfig} from './api';
import {Admin} from './admin';
class PreviewBoundary extends React.Component<{children:React.ReactNode},{failed:boolean}>{
 state={failed:false};static getDerivedStateFromError(){return {failed:true}}
 render(){return this.state.failed?<div className="startup-message"><h1>Wonder Lab</h1><p>页面未能启动，请刷新重试。 / The page could not start. Please refresh and try again.</p></div>:this.props.children}
}
function Site({config}:{config:SiteConfig}){
 const[revision,setRevision]=useState(0),[manage,setManage]=useState(location.hash==='#admin');
 const service=useMemo(()=>createService(config),[config,revision]);
 useEffect(()=>{const hash=()=>{if(location.hash==='#admin')setManage(true)};window.addEventListener('hashchange',hash);return()=>window.removeEventListener('hashchange',hash)},[]);
 function close(){setManage(false);if(location.hash==='#admin')history.replaceState(null,'',location.pathname+location.search);setRevision(n=>n+1)}
 return <><Home service={service} onManage={()=>setManage(true)}/><Admin open={manage} onClose={close} onChanged={()=>setRevision(n=>n+1)} connected={service.mode==='connected'}/>{service.mode==='preview'&&<aside className="offline-note">离线预览 · Offline preview</aside>}{service.mode==='unconfigured'&&<aside className="offline-note">前端预览 · 留言暂未开放 / Guestbook not connected</aside>}</>;
}
async function start(){
 let config:SiteConfig=JSON.parse(document.getElementById('wonder-config')?.textContent||'{"apiBase":"","mode":"preview"}');
 if(config.mode!=='preview'&&location.protocol!=='file:'){
  try{const r=await fetch('./site-config.json',{cache:'no-store',signal:AbortSignal.timeout(5000)});if(r.ok){const data=await r.json() as {apiBase?:unknown};if(typeof data.apiBase==='string')config={mode:'connected',apiBase:data.apiBase}}}catch{}
 }
 createRoot(document.getElementById('root')!).render(<PreviewBoundary><Site config={config}/></PreviewBoundary>);
}
void start().catch(()=>{const status=document.getElementById('startup-status');if(status)status.textContent='站点配置无法读取，请检查配置文件。 / Site configuration could not be read.'});
