import React,{useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import Home from '../app/page';
import '../app/globals.css';
import './style.css';
import {createService,type SiteConfig} from './api';
import {Blog,LabHeader,RouteLink} from './blog';
import {Studio} from './studio';
import {canNavigate,navigate,readRoute,routeHref,setBasePath} from './routes';
class PreviewBoundary extends React.Component<{children:React.ReactNode},{failed:boolean}>{
 state={failed:false};static getDerivedStateFromError(){return {failed:true}}
 render(){return this.state.failed?<div className="startup-message"><h1>Wonder Lab</h1><p>页面未能启动，请刷新重试。 / The page could not start. Please refresh and try again.</p></div>:this.props.children}
}
function Site({config}:{config:SiteConfig}){
 const[route,setRoute]=useState(readRoute),visited=useRef(false);
 const service=useMemo(()=>createService(config),[config]);
 useEffect(()=>{
  const change=()=>{visited.current=true;setRoute(readRoute())};
  const back=()=>{if(!canNavigate()){history.pushState(null,'',routeHref(route));return}change()};
  window.addEventListener('wonder:navigate',change);window.addEventListener('popstate',back);window.addEventListener('hashchange',change);
  return()=>{window.removeEventListener('wonder:navigate',change);window.removeEventListener('popstate',back);window.removeEventListener('hashchange',change)};
 },[route]);
 return <>{route==='/admin'?<Studio connected={service.mode==='connected'}/>:route==='/blog'||route.startsWith('/blog/')?<Blog slug={route.startsWith('/blog/')?route.slice(6):undefined}/>:route==='/'?<Home service={service} onManage={()=>navigate('/admin')} onBlog={()=>navigate('/blog')} onRead={post=>navigate('/blog/'+(post.slug||'post-'+post.id))} skipIntro={visited.current}/>:<div className="lab-shell"><LabHeader/><main className="lab-main"><h1>这个小径还没有地图。 / Page not found.</h1><RouteLink to="/">回到首页 / Back home</RouteLink></main></div>}{service.mode==='preview'&&<aside className="offline-note">离线预览 · Offline preview</aside>}{service.mode==='unconfigured'&&<aside className="offline-note">前端预览 · 后台暂未连接 / Backend not connected</aside>}</>;
}
async function start(){
 let config:SiteConfig=JSON.parse(document.getElementById('wonder-config')?.textContent||'{"apiBase":"","mode":"preview"}');
 if(config.mode!=='preview'&&location.protocol!=='file:'){
  try{const r=await fetch(new URL('site-config.json',document.baseURI),{cache:'no-store',signal:AbortSignal.timeout(5000)});if(r.ok){const data=await r.json() as {apiBase?:unknown};if(typeof data.apiBase==='string')config={...config,apiBase:data.apiBase}}}catch{}
 }
 setBasePath(config.basePath||'/wonderlab/');
 createRoot(document.getElementById('root')!).render(<PreviewBoundary><Site config={config}/></PreviewBoundary>);
}
void start().catch(()=>{const status=document.getElementById('startup-status');if(status)status.textContent='站点配置无法读取，请检查配置文件。 / Site configuration could not be read.'});
