// Initializes only the local development database included in the source workflow.
import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,readdirSync,readFileSync} from 'node:fs';
mkdirSync('.sites-runtime',{recursive:true});
const db=new DatabaseSync('.sites-runtime/preview.sqlite');
db.exec('CREATE TABLE IF NOT EXISTS _preview_migrations (name TEXT PRIMARY KEY)');
for(const name of readdirSync('drizzle').filter(n=>n.endsWith('.sql')).sort()){
 if(db.prepare('SELECT name FROM _preview_migrations WHERE name=?').get(name))continue;
 db.exec('BEGIN');
 try{db.exec(readFileSync('drizzle/'+name,'utf8'));db.prepare('INSERT INTO _preview_migrations (name) VALUES (?)').run(name);db.exec('COMMIT');console.log('Applied',name)}catch(e){db.exec('ROLLBACK');throw e}
}
db.close();console.log('Local preview database is ready. Run npm run dev.');
