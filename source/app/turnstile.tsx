'use client';
import {useEffect,useRef,useState} from 'react';
type TurnstileAPI={render:(el:HTMLElement,options:Record<string,unknown>)=>string;remove:(id:string)=>void};
let loading:Promise<TurnstileAPI>|null=null;
function load(){if((window as any).turnstile)return Promise.resolve((window as any).turnstile as TurnstileAPI);if(loading)return loading;loading=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;const timeout=setTimeout(()=>reject(Error('Verification unavailable')),15000);script.onload=()=>{clearTimeout(timeout);const api=(window as any).turnstile;api?resolve(api):reject(Error('Verification unavailable'))};script.onerror=()=>{clearTimeout(timeout);script.remove();reject(Error('Verification unavailable'))};document.head.appendChild(script)});loading.catch(()=>{loading=null});return loading}
export function Turnstile({siteKey,onToken,reset,en}:{siteKey:string;onToken:(token:string)=>void;reset:number;en:boolean}){
 const host=useRef<HTMLDivElement>(null);const[failed,setFailed]=useState(false),[retry,setRetry]=useState(0);
 useEffect(()=>{let active=true,id:string|undefined,api:TurnstileAPI;onToken('');setFailed(false);void load().then(t=>{if(!active||!host.current)return;api=t;id=t.render(host.current,{sitekey:siteKey,action:'guestbook',theme:'dark',callback:(token:string)=>{if(active)onToken(token)},'expired-callback':()=>onToken(''),'error-callback':()=>{onToken('');setFailed(true)}})}).catch(()=>{if(active)setFailed(true)});return()=>{active=false;if(id&&api)api.remove(id)}},[siteKey,onToken,reset,retry]);
 return <div><div ref={host}/>{failed&&<p role="alert">{en?'Verification could not load.':'验证暂时无法加载。'} <button type="button" className="sign-in" onClick={()=>setRetry(n=>n+1)}>{en?'Retry':'重试'}</button></p>}</div>;
}
