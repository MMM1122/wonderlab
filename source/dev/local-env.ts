// Development-only SQLite adapter for Macs that cannot run workerd.
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
mkdirSync('.sites-runtime',{recursive:true});
const database = new DatabaseSync('.sites-runtime/preview.sqlite');
class Statement {
  args: any[] = [];
  constructor(public sql: string) {}
  bind(...args:any[]){this.args=args;return this;}
  async all(){return {results:database.prepare(this.sql).all(...this.args),success:true};}
  async first(){return database.prepare(this.sql).get(...this.args) ?? null;}
  async run(){const r=database.prepare(this.sql).run(...this.args);return {success:true,meta:{changes:Number(r.changes)}};}
}
export const env = { DB: {prepare(sql:string){return new Statement(sql)}, async batch(statements:Statement[]){database.exec('BEGIN');try{const r=await Promise.all(statements.map(s=>s.run()));database.exec('COMMIT');return r}catch(e){database.exec('ROLLBACK');throw e}}}};
