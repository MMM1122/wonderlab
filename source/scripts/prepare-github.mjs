// Build first. Copy only public source and assets into the existing Pages checkout.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const checkout=path.resolve(process.argv[2]||'work/github-wonderlab');
const build=path.resolve(process.argv[3]||'outputs/wonder-lab-multiuser/site');
if(!fs.existsSync(path.join(checkout,'.git')))throw Error('Expected an existing Git checkout');
const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean).filter(f=>!f.startsWith('.openai/'));
const privateValues=[];
for(const file of ['backend/admin-key.txt','backend/admin-key-secrets.json'])if(fs.existsSync(file)){const value=fs.readFileSync(file,'utf8');privateValues.push(...(file.endsWith('.json')?Object.values(JSON.parse(value)):[value.trim()]));}
for(const f of files){
 if(/(^|\/)(admin-key|wrangler\.local|\.env|\.dev\.vars)/.test(f))throw Error('Private file: '+f);
 const bytes=fs.readFileSync(f);if(privateValues.some(v=>bytes.includes(v)))throw Error('Credential found: '+f);
 const dest=path.join(checkout,'source',f);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(f,dest);
}
// Keep legacy build type-checking possible without linking a published source copy to the original Site.
fs.mkdirSync(path.join(checkout,'source/.openai'),{recursive:true});
fs.writeFileSync(path.join(checkout,'source/.openai/hosting.json'),JSON.stringify({d1:'DB',r2:null},null,2));
fs.cpSync(build,checkout,{recursive:true});
let readme=fs.readFileSync('README.md','utf8').replace('## Application structure','The complete editable project is in [`source/`](source/). Commands and file paths below are relative to that folder. The repository root serves the compiled GitHub Pages website.\n\n## Application structure').replaceAll('(backend/', '(source/backend/');
fs.writeFileSync(path.join(checkout,'README.md'),readme);
console.log('Prepared public release:',files.length,'source files; private-key scan passed.');
