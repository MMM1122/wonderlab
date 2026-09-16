import type {LabService,LabData} from '../app/lab-service';
export type SiteConfig={apiBase:string;mode:'connected'|'preview'};
let token='';
let apiBase='';
export function configureApi(value:string){
 if(!value){apiBase='';return}
 const u=new URL(value,location.href);
 if(u.protocol!=='https:'&&!(u.hostname==='localhost'||u.hostname==='127.0.0.1'))throw Error('API must use HTTPS');
 if(u.username||u.password||u.search||u.hash)throw Error('Invalid API URL');apiBase=u.href.replace(/\/$/,'');
}
export function clearSession(){token=''}
export function hasSession(){return !!token}
export async function api<T=Record<string,unknown>>(path:string,data?:unknown,secure=false){
 if(!apiBase)throw Error('后台还未连接。 / The backend is not connected yet.');
 const headers:Record<string,string>={};if(data!==undefined)headers['Content-Type']='application/json';if(secure&&token)headers.Authorization='Bearer '+token;
 let r:Response;try{r=await fetch(apiBase+path,{method:data===undefined?'GET':'POST',headers,body:data===undefined?undefined:JSON.stringify(data),credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(15000)})}catch{throw Error('连接暂时失败，文字已保留，请重试。 / Connection failed. Your text is kept; please retry.')}
 let result:T&{error?:string};try{result=await r.json() as T&{error?:string}}catch{throw Error('后台返回了无法识别的内容，请检查连接。 / Unexpected server response.')}
 if(!r.ok){if(secure&&r.status===401)token='';throw Error(result.error||'Request failed')}return result;
}
export async function login(key:string){const result=await api<{token:string;expiresAt:number}>('/api/login',{key});token=result.token;return result}
export async function logout(){try{await api('/api/logout',{},true)}finally{token=''}}
const empty:LabData={posts:[],comments:[],signedIn:false,isOwner:false,canClaim:false};
export function createService(config:SiteConfig):LabService{
 const mode=config.mode==='preview'?'preview':config.apiBase?'connected':'unconfigured';configureApi(config.apiBase);
 return {mode,load:()=>mode==='connected'?api<LabData>('/api/lab'):Promise.resolve(empty),mutate:data=>mode==='connected'?api<{pending?:boolean}>('/api/lab',data):Promise.reject(Error('留言尚未开放。 / The guestbook is not connected yet.'))};
}
