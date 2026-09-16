import type {Post} from './samples';
export type LabComment={id:string;name:string;body:string;createdAt:number;status?:string};
export type LabData={posts:Post[];comments:LabComment[];signedIn:boolean;isOwner:boolean;canClaim:boolean;guestPosting?:boolean;turnstileSiteKey?:string};
export type LabService={mode:'sites'|'preview'|'connected'|'unconfigured';load:()=>Promise<LabData>;mutate:(data:unknown)=>Promise<{pending?:boolean}>};
async function request<T>(data?:unknown){const r=await fetch('/api/lab',data?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}:undefined);const result=await r.json() as T&{error?:string};if(!r.ok)throw Error(result.error||'Unable to load');return result}
export const sitesService:LabService={mode:'sites',load:()=>request<LabData>(),mutate:data=>request<{pending?:boolean}>(data)};
