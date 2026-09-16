'use client';

import {useCallback,useEffect,useRef,useState} from 'react';
import {ArrowRight,Compass,SkipForward} from 'lucide-react';
import {Button} from '@/components/ui/button';
import './prologue.css';

type Chapter='forest'|'cave'|'fall'|'arrival';
const ASSETS=['/intro-forest.png','/intro-walk-longhair.png','/cosmic-garden.png'];
const CHAPTERS:Chapter[]=['forest','cave','fall','arrival'];
export function Prologue({en,onFinish}:{en:boolean;onFinish:()=>void}){
 const[running,setRunning]=useState(false),[chapter,setChapter]=useState<Chapter>('forest'),[ready,setReady]=useState(false),[failed,setFailed]=useState(false),[reduced,setReduced]=useState(false);
 const timers=useRef<ReturnType<typeof setTimeout>[]>([]),runId=useRef(0);
 const clear=useCallback(()=>{timers.current.forEach(clearTimeout);timers.current=[];runId.current++},[]);
 const finish=useCallback(()=>{clear();onFinish()},[clear,onFinish]);
 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(media.matches);update();media.addEventListener('change',update);

  return()=>{clear();media.removeEventListener('change',update)};
 },[clear]);
 useEffect(()=>{
  let active=true;setFailed(false);setReady(false);
  const images=ASSETS.map(src=>new Promise<void>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve();img.onerror=()=>reject(new Error('Image unavailable'));img.src=src;}));
  const timeout=setTimeout(()=>{if(active)setFailed(true)},15000);
  Promise.all(images).then(()=>{clearTimeout(timeout);if(active){setReady(true);setFailed(false)}}).catch(()=>{clearTimeout(timeout);if(active)setFailed(true)});
  return()=>{active=false;clearTimeout(timeout)};
 },[]);
 useEffect(()=>{if(reduced&&running)finish()},[reduced,running,finish]);
 const start=useCallback(()=>{if(!ready||running)return;if(reduced){finish();return}clear();const id=runId.current;setRunning(true);setChapter('forest');
  for(const [delay,next] of [[3900,'cave'],[5600,'fall'],[10400,'arrival']] as const)timers.current.push(setTimeout(()=>{if(runId.current===id)setChapter(next)},delay));
  timers.current.push(setTimeout(()=>{if(runId.current===id)finish()},13900));
 },[ready,running,reduced,clear,finish]);
 useEffect(()=>{if(!ready||reduced||running)return;const id=setTimeout(start,1100);return()=>clearTimeout(id)},[ready,reduced,running,start]);
 useEffect(()=>{const overflow=document.body.style.overflow;document.body.style.overflow='hidden';const escape=(e:KeyboardEvent)=>{if(e.key==='Escape')finish()};window.addEventListener('keydown',escape);return()=>{document.body.style.overflow=overflow;window.removeEventListener('keydown',escape)}},[finish]);
 const text=(zh:string,english:string)=>en?english:zh;
 const index=CHAPTERS.indexOf(chapter);
 const caption=[text('森林尽头，有一道微光。','At the edge of the forest, a little light.'),text('再往前一步……咦？','Just one more step… oh!'),text('往下，往下，掉进一个不可能的梦。','Down, down, into an impossible dream.'),text('原来，奇思妙想就在另一边。','So this is where the wild ideas live.')][index];
 return <section className={'prologue '+(running?'is-running ':'is-idle ')+(reduced?'is-reduced':'')} data-chapter={chapter} aria-labelledby="prologue-title" aria-describedby="prologue-description">
    <div className="prologue-scenes" aria-hidden="true">
     <div className="prologue-world"/>
     <div className="prologue-forest"/>
     <div className="prologue-shade"/>
     <div className="forest-fireflies">{Array.from({length:24},(_,i)=><i key={i} style={{left:`${9+(i*37)%83}%`,top:`${20+(i*29)%60}%`,animationDelay:`${-(i%7)*.73}s`,animationDuration:`${3+i%4}s`}}/>)}</div>
     <div className="explorer-walk"><div className="explorer-sprite"/></div>
     <div className="prologue-dark"/>
     <div className="prologue-tunnel"><div className="tunnel-rings">{Array.from({length:9},(_,i)=><i key={i} style={{animationDelay:`${-i*.34}s`,borderColor:['#a99aff','#d6fc77','#ffc1cb'][i%3]}}/>)}</div></div>
     <div className="explorer-fall"><div className="explorer-sprite"/></div>
     <div className="arrival-glow"/>
     <div className="prologue-grain"/>
    </div>
    <div className="prologue-top"><span className="prologue-wordmark">Wonder <i>Lab</i></span><Button variant="ghost" onClick={finish}>{text('跳过','Skip')}<SkipForward size={16}/></Button></div>
    <div className="prologue-intro-copy">
     <span className="prologue-kicker"><Compass size={16}/> THE WAY IN / 序章</span>
     <h1 id="prologue-title" className="prologue-title">{text('有些世界，','Some worlds')}<br/><em>{text('是误打误撞闯进去的。','are found by falling.')}</em></h1>
     <p id="prologue-description" className="prologue-description">{reduced?text('她走进森林的洞穴，不小心坠落，误入了 Wonder Lab。','She explores a forest cave, loses her footing, and falls into Wonder Lab.'):text('一个小小探险家，一条没有出现在地图上的路。','A little explorer. A path that never made it onto the map.')}</p>
     {failed?<Button onClick={finish}>{text('直接进入 Wonder Lab','Enter Wonder Lab')}<ArrowRight size={18}/></Button>:<Button className="prologue-begin" onClick={start} disabled={!ready||running}>{!ready?text('正在点亮森林…','Lighting up the forest…'):reduced?text('进入 Wonder Lab','Enter Wonder Lab'):text('跟着她，走进森林','Follow her into the forest')}<ArrowRight size={18}/></Button>}
     {failed&&<p className="prologue-asset-error" role="status">{text('森林画面暂时没能加载，你仍可以直接进入。','The forest could not load. You can still enter the journal.')}</p>}
    </div>
    <div className="prologue-caption" role="status" aria-live="polite"><span>{String(index+1).padStart(2,'0')} / 04</span><p>{running?caption:text('好奇心，是唯一的指南针。','Curiosity is the only compass.')}</p></div>
    <div className="prologue-arrival-copy" aria-hidden={chapter!=='arrival'}><span>YOU FOUND YOUR WAY TO</span><h2>Wonder <i>Lab</i></h2><p>{text('欢迎来到，脑洞的另一边。','Welcome to the other side of an idea.')}</p></div>
    <div className="prologue-progress" aria-hidden="true">{CHAPTERS.map((c,i)=><span className={index>=i?'is-current':''} key={c}/>)}</div>
 </section>
}
