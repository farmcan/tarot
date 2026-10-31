// Shared v1: anonymous project-to-project clicks and arrivals. No cross-site IDs.
export const FAMILY_HOSTS={'miaoti-dmv.pages.dev':'miaoti','miaoti.pages.dev':'miaoti','miao-beat.pages.dev':'miao-beat','tarot-31o.pages.dev':'miaotarot'};
const PROJECTS=new Set(['miaoti','miao-beat','miaotarot']);
const PLACEMENTS=new Set(['intro','result','family','unknown']);
const mounted=new WeakMap();
export function familyLanding(href,referrer=''){
  const url=new URL(href),tag=url.searchParams.get('utm_source');let peer;
  if(tag)peer=PROJECTS.has(tag)?tag:null;
  else{try{peer=FAMILY_HOSTS[new URL(referrer).hostname];}catch{}}
  const raw=url.searchParams.get('utm_content');
  return peer?{peer,placement:PLACEMENTS.has(raw)?raw:'unknown'}:null;
}
export function mountFamilyReferrals(doc=document,{project,fetchImpl=globalThis.fetch}={}){
  if(!PROJECTS.has(project)||mounted.has(doc))return mounted.get(doc)||null;
  const current=new URL(doc.location.href),traffic=current.searchParams.get('analytics')==='internal'?'internal':'external';
  function send(kind,peer,placement){
    const query=new URLSearchParams({kind,peer,placement,traffic});const endpoint='/api/family-referral?'+query;
    try{Promise.resolve(fetchImpl?.(endpoint,{method:'POST',credentials:'same-origin',keepalive:true,cache:'no-store',referrerPolicy:'no-referrer'})).catch(()=>{});}catch{}
  }
  function decorate(link){
    let url;try{url=new URL(link.getAttribute('href'),doc.location.href);}catch{return null;}
    const peer=FAMILY_HOSTS[url.hostname];if(!peer||peer===project||url.protocol!=='https:')return null;
    const raw=link.getAttribute('data-tarot-entry')||link.getAttribute('data-beat-entry')||link.getAttribute('data-family-placement')||url.searchParams.get('utm_content')||'family';
    const placement=PLACEMENTS.has(raw)?raw:'unknown';
    url.searchParams.set('utm_source',project);url.searchParams.set('utm_medium','referral');if(!url.searchParams.has('utm_campaign'))url.searchParams.set('utm_campaign','miao-family');url.searchParams.set('utm_content',placement);
    if(traffic==='internal')url.searchParams.set('analytics','internal');
    link.href=url.href;return {peer,placement};
  }
  // Decorate visible links before interaction, including keyboard/context-menu navigation.
  function scan(root=doc){for(const link of root.querySelectorAll('a[href]'))decorate(link);}
  scan();
  const observer=doc.defaultView?.MutationObserver?new doc.defaultView.MutationObserver(records=>{for(const r of records)for(const node of r.addedNodes)if(node.nodeType===1){if(node.matches('a[href]'))decorate(node);scan(node);}}):null;
  observer?.observe(doc.documentElement,{childList:true,subtree:true});
  function click(event){
    if(event.defaultPrevented||event.type==='auxclick'&&event.button!==1)return;
    const link=event.target?.closest?.('a[href]');if(!link)return;const target=decorate(link);if(target)send('click',target.peer,target.placement);
  }
  doc.addEventListener('click',click);doc.addEventListener('auxclick',click);
  const navigation=doc.defaultView?.performance?.getEntriesByType?.('navigation')?.[0]?.type;
  const landing=familyLanding(current.href,doc.referrer);
  if(landing&&landing.peer!==project&&navigation!=='reload'&&navigation!=='back_forward')send('arrival',landing.peer,landing.placement);
  const controller={destroy(){doc.removeEventListener('click',click);doc.removeEventListener('auxclick',click);observer?.disconnect();mounted.delete(doc);}};mounted.set(doc,controller);return controller;
}
if(typeof document!=='undefined'){
  const project=document.querySelector('meta[name="miao-project"]')?.content;
  if(PROJECTS.has(project))mountFamilyReferrals(document,{project});
}
