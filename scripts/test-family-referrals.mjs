import test from 'node:test';
import assert from 'node:assert/strict';
import {recordFamilyReferral} from '../shared/family-referrals.mjs';
const hosts={miaoti:'miaoti-dmv.pages.dev','miao-beat':'miao-beat.pages.dev',miaotarot:'tarot-31o.pages.dev'};
test('server infers source/target from its own fixed project for all six directions and both stages',async()=>{
 const rows=[],db={prepare(sql){assert.match(sql,/date\('now','\+8 hours'\)/);return {bind(...values){return {run:async()=>{rows.push(values);}};}};}};
 for(const from of Object.keys(hosts))for(const to of Object.keys(hosts))if(from!==to)for(const kind of ['click','arrival']){
  const project=kind==='click'?from:to,peer=kind==='click'?to:from;
  const request=new Request(`https://${hosts[project]}/api/family-referral?kind=${kind}&peer=${peer}&placement=family&traffic=internal`,{method:'POST'});
  const r=await recordFamilyReferral(request,db,project);assert.equal(r.status,202);assert.equal((await r.json()).counted,true);assert.deepEqual(rows.at(-1),[from,to,'family',kind,'internal']);
 }
 assert.equal(rows.length,12);
});
test('server rejects arbitrary labels, bodies, duplicates, cross-site requests and methods; previews/bots do not write',async()=>{
 let writes=0;const db={prepare(){return {bind(){return {run:async()=>{writes++;}};}};}};
 const base='https://miao-beat.pages.dev/api/family-referral?kind=click&peer=miaoti&placement=family';
 for(const [url,options,status]of [[base,{},405],[base,{method:'POST',body:'{}'},400],[base,{method:'POST',headers:{origin:'https://evil.example'}},403],[base+'&from=private',{method:'POST'},400],[base+'&peer=miaotarot',{method:'POST'},400],[base.replace('peer=miaoti','peer=private'),{method:'POST'},400]])assert.equal((await recordFamilyReferral(new Request(url,options),db,'miao-beat')).status,status);
 for(const req of [new Request(base.replace('miao-beat.pages.dev','preview.miao-beat.pages.dev'),{method:'POST'}),new Request(base,{method:'POST',headers:{'user-agent':'TestBot'}})])assert.equal((await (await recordFamilyReferral(req,db,'miao-beat')).json()).counted,false);
 assert.equal(writes,0);assert.equal((await recordFamilyReferral(new Request(base,{method:'POST'}),null,'miao-beat')).status,503);
 const broken={prepare(){throw Error('db');}};assert.equal((await recordFamilyReferral(new Request(base,{method:'POST'}),broken,'miao-beat')).status,503);
});
