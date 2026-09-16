let basePath='/';
let guard:(()=>boolean)|null=null;
export function setNavigationGuard(value:(()=>boolean)|null){guard=value}
export function canNavigate(){return !guard||guard()}
export function setBasePath(path:string){basePath='/'+path.replace(/^\/+|\/+$/g,'');if(basePath!=='/')basePath+='/'}
export function routeHref(path:string){
 if(location.protocol==='file:')return '#'+path;
 if(path.startsWith('/blog/'))return basePath+'blog/?post='+encodeURIComponent(path.slice(6));
 return basePath+path.replace(/^\//,'').replace(/\/$/,'')+(path==='/'?'':'/');
}
export function readRoute(){
 if(location.protocol==='file:')return location.hash.slice(1)||'/';
 if(location.hash==='#admin')return '/admin';
 const relative=location.pathname.startsWith(basePath)?location.pathname.slice(basePath.length):'';
 if(relative.replace(/\/$/,'')==='blog'){const slug=new URLSearchParams(location.search).get('post');return slug?'/blog/'+slug:'/blog'}
 return relative.startsWith('admin')?'/admin':relative===''||relative==='index.html'?'/':'/not-found';
}
export function navigate(path:string){if(!canNavigate())return;history.pushState(null,'',routeHref(path));window.dispatchEvent(new Event('wonder:navigate'));window.scrollTo(0,0)}
