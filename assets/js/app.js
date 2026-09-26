/* Shared helpers, hash router, theme toggle and visit counter.
   Loaded first; the feature scripts register route hooks with App.on(). */

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

/* ---------- Formula highlighting & copy ---------- */
function highlight(code){
  let out='', i=0;
  while(i<code.length){
    const ch=code[i];
    if(ch==='"'){
      let j=i+1;
      while(j<code.length){ if(code[j]==='"'){ if(code[j+1]==='"'){ j+=2; continue; } break; } j++; }
      out+='<span class="s">'+esc(code.slice(i,j+1))+'</span>'; i=j+1; continue;
    }
    if(ch==='['){ const j=code.indexOf(']',i); if(j>-1){ out+='<span class="c">'+esc(code.slice(i,j+1))+'</span>'; i=j+1; continue; } }
    const m=code.slice(i).match(/^[A-Z_]+(?=\()/);
    if(m){ out+='<span class="f">'+m[0]+'</span>'; i+=m[0].length; continue; }
    out+=esc(ch); i++;
  }
  return out;
}
function showFormula(id, f){ const el=$(id); el.dataset.raw=f; el.innerHTML=highlight(f); }
function syncPickers(scope){ scope.querySelectorAll('.picker').forEach(p=>{ p.querySelector('code').textContent=p.querySelector('input').value.toUpperCase(); }); }

document.querySelectorAll('.js-highlight').forEach(el=>{ el.innerHTML=highlight(el.textContent); });

document.querySelectorAll('.copy').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const pre=$(btn.dataset.target), text=pre.dataset.raw||'';
    const ok=()=>{ btn.textContent='Copied ✓'; btn.classList.add('done'); setTimeout(()=>{ btn.textContent='Copy'; btn.classList.remove('done'); },1500); };
    const fallback=()=>{ const r=document.createRange(); r.selectNodeContents(pre); const s=getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent='Press Ctrl+C'; setTimeout(()=>{ btn.textContent='Copy'; },2500); };
    try{ navigator.clipboard.writeText(text).then(ok,fallback); }catch(e){ fallback(); }
  });
});

/* ---------- Router ----------
   #home, #progress, #qr, #table, #videos, #hire (old links keep working). */
const App = (function(){
  const ROUTES={
    home:    {view:'home',   title:''},
    progress:{view:'tools',  tool:'progress', title:'Progress bar generator'},
    qr:      {view:'tools',  tool:'qr',       title:'QR & barcode generator'},
    table:   {view:'tools',  tool:'table',    title:'HTML table generator'},
    videos:  {view:'videos', title:'AppSheet tutorials'},
    hire:    {view:'hire',   title:'Hire me'}
  };
  const ALIASES={'':'home',tools:'progress'};
  const BASE_TITLE=document.title;
  const hooks={};
  let current=null;

  function resolve(hash){
    const k=hash.replace(/^#\/?/,'');
    const key=k in ALIASES?ALIASES[k]:k;
    return ROUTES[key]?key:'home';
  }
  function go(){
    const key=resolve(location.hash), r=ROUTES[key];
    const viewChanged=!current||ROUTES[current].view!==r.view;
    document.querySelectorAll('.view').forEach(v=>v.hidden=v.dataset.view!==r.view);
    document.querySelectorAll('.tool-panel').forEach(p=>p.hidden=p.dataset.tool!==r.tool);
    document.querySelectorAll('[data-nav]').forEach(a=>{ if(a.dataset.nav===r.view) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
    document.querySelectorAll('.switcher a').forEach(a=>{ if(a.dataset.tool===r.tool) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
    document.title=r.title?r.title+' · Joe Tayactac':BASE_TITLE;
    if(current!==null && (viewChanged || r.view!=='tools')) window.scrollTo({top:0});
    else if(current!==null && r.view==='tools'){
      const head=document.querySelector('.tools-head');
      if(head && head.getBoundingClientRect().top<0) window.scrollTo({top:0});
    }
    current=key;
    (hooks[key]||[]).concat(key!==r.view&&hooks[r.view]||[]).forEach(fn=>{ try{ fn(); }catch(e){ console.error(e); } });
  }
  function on(name, fn){ (hooks[name]=hooks[name]||[]).push(fn); if(current && (current===name || ROUTES[current].view===name)) fn(); }
  window.addEventListener('hashchange',go);
  document.addEventListener('DOMContentLoaded',go);
  return {on, go};
})();

/* ---------- Header shadow on scroll ---------- */
(function(){
  const h=document.querySelector('.site-header');
  const f=()=>h.classList.toggle('scrolled',window.scrollY>4);
  window.addEventListener('scroll',f,{passive:true}); f();
})();

/* ---------- Theme toggle ---------- */
(function(){
  const root=document.documentElement, btn=$('theme-toggle');
  const isDark=()=>root.dataset.theme ? root.dataset.theme==='dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  const label=()=>btn.setAttribute('aria-label',isDark()?'Switch to light theme':'Switch to dark theme');
  btn.addEventListener('click',()=>{
    const next=isDark()?'light':'dark';
    root.dataset.theme=next;
    try{ localStorage.setItem('theme',next); }catch(e){}
    label();
  });
  label();
})();

/* ---------- Decorative QR on the home tool card ---------- */
(function(){
  const svg=$('qr-art'); if(!svg) return;
  const N=25, on=new Set();
  const finder=(x,y)=>{ for(let i=0;i<7;i++) for(let j=0;j<7;j++){ const edge=i===0||i===6||j===0||j===6, core=i>=2&&i<=4&&j>=2&&j<=4; if(edge||core) on.add((x+i)+','+(y+j)); } };
  const reserved=(x,y)=>(x<8&&y<8)||(x>=N-8&&y<8)||(x<8&&y>=N-8);
  finder(0,0); finder(N-7,0); finder(0,N-7);
  let seed=7; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
  for(let y=0;y<N;y++) for(let x=0;x<N;x++) if(!reserved(x,y) && rnd()<0.47) on.add(x+','+y);
  svg.innerHTML=[...on].map(k=>{ const [x,y]=k.split(','); return `<rect x="${x}" y="${y}" width="1" height="1"/>`; }).join('');
})();

/* ---------- Footer year & visit counter ---------- */
$('year').textContent=new Date().getFullYear();
(function(){
  const BASE='https://countapi.mileshilliard.com/api/v1/';
  const KEY='joetayactac_qrcode_visits';
  let counted=false;
  try{ counted=sessionStorage.getItem('counted')==='1'; }catch(e){}
  fetch(BASE+(counted?'get/':'hit/')+KEY)
    .then(r=>r.json())
    .then(d=>{
      const n=Number(d && (d.value ?? d.count));
      if(!Number.isFinite(n)) return;
      try{ sessionStorage.setItem('counted','1'); }catch(e){}
      $('visits-n').textContent=n.toLocaleString();
      $('visits').hidden=false;
    })
    .catch(()=>{});
})();
