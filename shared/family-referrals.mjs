// Shared v1 server contract. Store only fixed aggregate dimensions, never people or URLs.
const HOSTS={miaoti:'miaoti-dmv.pages.dev','miao-beat':'miao-beat.pages.dev',miaotarot:'tarot-31o.pages.dev'};
const PLACEMENTS=new Set(['intro','result','family','unknown']);
const json=(body,status)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
export async function recordFamilyReferral(request,db,project){
  if(request.method!=='POST')return json({error:'method_not_allowed'},405);
  const url=new URL(request.url),origin=request.headers.get('origin');
  if(request.headers.get('sec-fetch-site')==='cross-site'||origin&&origin!==url.origin)return json({error:'cross_site_request'},403);
  if(!Object.hasOwn(HOSTS,project))return json({error:'invalid_project'},400);
  for(const key of url.searchParams.keys())if(!['kind','peer','placement','traffic'].includes(key)||url.searchParams.getAll(key).length!==1)return json({error:'invalid_fields'},400);
  const kind=url.searchParams.get('kind'),peer=url.searchParams.get('peer'),placement=url.searchParams.get('placement')||'unknown',traffic=url.searchParams.get('traffic')||'external';
  if(!['click','arrival'].includes(kind)||!Object.hasOwn(HOSTS,peer)||peer===project||!PLACEMENTS.has(placement)||!['internal','external'].includes(traffic))return json({error:'invalid_event'},400);
  const length=request.headers.get('content-length');if(length&&length!=='0')return json({error:'body_not_allowed'},400);
  if(request.body){const reader=request.body.getReader();try{const {done}=await reader.read();if(!done){await reader.cancel();return json({error:'body_not_allowed'},400);}}finally{reader.releaseLock();}}
  const local=['localhost','127.0.0.1','[::1]'].includes(url.hostname),bot=/bot|crawler|spider|slurp|preview|facebookexternalhit|whatsapp/i.test(request.headers.get('user-agent')||'');
  if((url.hostname!==HOSTS[project]&&!local)||bot)return json({accepted:true,counted:false},202);
  if(!db)return json({error:'referrals_unavailable'},503);
  const source=kind==='click'?project:peer,target=kind==='click'?peer:project;
  try{
    await db.prepare(`INSERT INTO miao_family_referrals (event_day,source_project,target_project,placement,event_kind,traffic_type,count,updated_at)
      VALUES (date('now','+8 hours'),?,?,?,?,?,1,CURRENT_TIMESTAMP)
      ON CONFLICT(event_day,source_project,target_project,placement,event_kind,traffic_type)
      DO UPDATE SET count=count+1,updated_at=CURRENT_TIMESTAMP`).bind(source,target,placement,kind,traffic).run();
    return json({accepted:true,counted:true},202);
  }catch{return json({error:'referrals_unavailable'},503);}
}
