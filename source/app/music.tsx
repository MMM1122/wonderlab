'use client';
import {useEffect,useRef,useState} from 'react';
import {Headphones,Pause,Play} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Slider} from '@/components/ui/slider';
export function Music({en}:{en:boolean}){
 const audio=useRef<AudioContext|null>(null),timer=useRef<ReturnType<typeof setInterval>|null>(null),master=useRef<GainNode|null>(null);const[playing,setPlaying]=useState(false),[volume,setVolume]=useState(.35),[error,setError]=useState(false);
 useEffect(()=>()=>{if(timer.current)clearInterval(timer.current);void audio.current?.close()},[]);
 useEffect(()=>{if(master.current&&audio.current)master.current.gain.setTargetAtTime(volume*.22,audio.current.currentTime,.15)},[volume]);
 async function toggle(){try{setError(false);if(audio.current&&playing){await audio.current.suspend();setPlaying(false);return}if(audio.current){await audio.current.resume();setPlaying(true);return}const ctx=new AudioContext();audio.current=ctx;const gain=ctx.createGain();gain.gain.value=volume*.22;gain.connect(ctx.destination);master.current=gain;
 const delay=ctx.createDelay(2),feedback=ctx.createGain();delay.delayTime.value=.72;feedback.gain.value=.34;delay.connect(feedback);feedback.connect(delay);delay.connect(gain);
 const notes=[130.81,164.81,196,246.94,261.63,329.63,392,493.88];let step=0;
 const play=()=>{if(ctx.state!=='running')return;const now=ctx.currentTime;const osc=ctx.createOscillator(),env=ctx.createGain();osc.type='sine';osc.frequency.value=notes[[0,4,2,5,1,6,3,5][step++%8]];env.gain.setValueAtTime(0,now);env.gain.linearRampToValueAtTime(.5,now+.3);env.gain.exponentialRampToValueAtTime(.001,now+4.5);osc.connect(env);env.connect(gain);env.connect(delay);osc.start(now);osc.stop(now+4.6);osc.onended=()=>{osc.disconnect();env.disconnect()}};
 await ctx.resume();play();timer.current=setInterval(play,1800);setPlaying(true);
 }catch{if(timer.current)clearInterval(timer.current);void audio.current?.close();audio.current=null;setPlaying(false);setError(true)}}
 return <div className="music-dock"><Button className="music" onClick={toggle} aria-pressed={playing} aria-label={en?'Toggle background music':'开关背景音乐'}><Headphones size={18}/><span className="music-text">{error?(en?'Retry audio':'重试播放'):playing?(en?'Mushroom reverie':'蘑菇白日梦'):(en?'Sound on':'开启氛围音')}</span>{playing?<Pause size={15}/>:<Play size={15}/>}</Button>{playing&&<label className="volume">{en?'Volume':'音量'}<Slider aria-label={en?'Volume':'音量'} min={0} max={1} step={.01} value={[volume]} onValueChange={v=>setVolume(v[0])}/></label>}</div>
}
