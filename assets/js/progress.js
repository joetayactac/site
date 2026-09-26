/* Progress bar generator: builds an SVG data-URI formula for an Image virtual column. */
(function(){
  const clean=(s,d)=>((s||'').trim().replace(/^\[|\]$/g,''))||d;
  const enc=c=>'%23'+c.slice(1);
  const n=x=>+(+x).toFixed(2);
  let steps=[{from:0,color:'#ff9800'},{from:50,color:'#2196f3'},{from:100,color:'#4caf50'}];
  const readSteps=()=>steps.map(x=>({from:Math.max(0,Math.min(100,+x.from||0)),color:x.color})).sort((a,b)=>a.from-b.from);

  function drawSteps(){
    const list=$('pb-steps'); list.innerHTML='';
    steps.forEach((st,i)=>{
      const row=document.createElement('div'); row.className='step'; const first=i===0;
      row.innerHTML='<span>From</span>'+
        (first?'<span class="fixed">0</span>':`<input type="number" min="1" max="100" value="${st.from}" aria-label="Start percent for step ${i+1}">`)+
        `<span>%</span><span class="picker"><input type="color" value="${st.color}" aria-label="Color for step ${i+1}"><code></code></span>`+
        (first?'<span style="width:36px"></span>':`<button type="button" class="x" aria-label="Remove step ${i+1}">×</button>`);
      const num=row.querySelector('input[type=number]');
      if(num){ num.addEventListener('input',()=>{ st.from=num.value; render(); }); num.addEventListener('change',()=>{ steps=readSteps(); drawSteps(); render(); }); }
      const col=row.querySelector('input[type=color]'); col.addEventListener('input',()=>{ st.color=col.value; render(); });
      const del=row.querySelector('.x'); if(del) del.addEventListener('click',()=>{ steps.splice(i,1); drawSteps(); render(); });
      list.appendChild(row);
    });
  }
  const stepColor=(sts,p)=>{ let c=sts[0].color; sts.forEach(x=>{ if(p>=x.from) c=x.color; }); return c; };

  function settings(){
    return { col:clean($('pb-col').value,'Progress'), mode:$('pb-mode').value, shape:$('pb-shape').value,
      c0:$('pb-c0').value, steps:readSteps(), track:$('pb-track').value, tc:$('pb-tc').value,
      k:+$('pb-size').value, label:$('pb-label').value==='yes' };
  }
  function colorToken(s,V){
    if(s.mode!=='auto') return {lit:s.c0};
    const rest=s.steps.slice(1).reverse();
    if(!rest.length) return {lit:s.steps[0].color};
    const lines=rest.map(x=>`    ${V} >= ${+(x.from/100).toFixed(4)}, "${enc(x.color)}",`);
    lines.push(`    TRUE, "${enc(s.steps[0].color)}"`);
    return {f:`IFS(\n${lines.join('\n')}\n  )`, js:p=>stepColor(s.steps,p)};
  }
  function parts(s){
    const V=`DECIMAL([${s.col}])`, k=s.k, P=[];
    const lit=x=>P.push({lit:x}), ex=(f,js)=>P.push({f,js}), col=colorToken(s,V);
    const pct=()=>ex(`ROUND(${V} * 100)`,p=>p);
    const label=(x,y,fs,a)=>{ if(!s.label) return; lit(`<text x="${n(x)}" y="${n(y)}" dominant-baseline="central" text-anchor="${a}" font-family="Arial" font-size="${n(fs)}" font-weight="bold" fill="${s.tc}">`); pct(); lit('%</text>'); };
    const sh=s.shape;
    if(sh==='round'||sh==='square'){
      const W=n(300*k),H=n(30*k),rx=sh==='round'?n(H/2):0;
      lit(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`);
      lit(`<rect width="${W}" height="${H}" rx="${rx}" fill="${s.track}"/>`);
      lit('<rect width="'); ex(`ROUND(${V} * ${W})`,p=>Math.round(p/100*W)); lit(`" height="${H}" rx="${rx}" fill="`); P.push(col); lit('"/>');
      label(W/2,H/2,H*0.47,'middle'); return {P,w:W};
    }
    if(sh==='thin'||sh==='blocks'){
      const W=n(300*k),H=n(30*k),extra=s.label?n(58*k):0,SW=n(W+extra);
      if(sh==='thin'){
        const t=n(H*0.3),y=n((H-t)/2),rx=n(t/2);
        lit(`<svg xmlns="http://www.w3.org/2000/svg" width="${SW}" height="${H}">`);
        lit(`<rect y="${y}" width="${W}" height="${t}" rx="${rx}" fill="${s.track}"/>`);
        lit(`<rect y="${y}" width="`); ex(`ROUND(${V} * ${W})`,p=>Math.round(p/100*W)); lit(`" height="${t}" rx="${rx}" fill="`); P.push(col); lit('"/>');
      } else {
        const N=10,gap=n(4*k),seg=n((W-gap*(N-1))/N),stepW=n(seg+gap); let m='';
        for(let i=0;i<N;i++) m+=`<rect x="${n(i*stepW)}" width="${seg}" height="${H}" rx="${n(3*k)}" fill="white"/>`;
        lit(`<svg xmlns="http://www.w3.org/2000/svg" width="${SW}" height="${H}">`);
        lit(`<defs><mask id="m">${m}</mask></defs>`);
        lit(`<g mask="url(#m)"><rect width="${W}" height="${H}" fill="${s.track}"/>`);
        lit('<rect width="'); ex(`FLOOR(${V} * ${N}) * ${stepW}`,p=>n(Math.floor(p/100*N+1e-9)*stepW)); lit(`" height="${H}" fill="`); P.push(col); lit('"/></g>');
      }
      label(W+8*k,H/2,H*0.47,'start'); return {P,w:SW};
    }
    if(sh==='ring'){
      const D=n(100*k),sw=n(D*0.12),r=n((D-sw)/2),c=n(D/2);
      lit(`<svg xmlns="http://www.w3.org/2000/svg" width="${D}" height="${D}">`);
      lit(`<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${s.track}" stroke-width="${sw}"/>`);
      lit(`<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke-width="${sw}" pathLength="100" transform="rotate(-90 ${c} ${c})" stroke-dasharray="`);
      ex(`ROUND(${V} * 100)`,p=>p); lit(' 100" stroke="'); P.push(col); lit('"/>');
      label(c,c,D*0.22,'middle'); return {P,w:D};
    }
    const D=n(160*k),sw=n(D*0.12),r=n((D-sw)/2),cy=n(D/2),H=n(D/2+sw/2);
    const d=`M ${n(sw/2)} ${cy} A ${r} ${r} 0 0 1 ${n(D-sw/2)} ${cy}`;
    lit(`<svg xmlns="http://www.w3.org/2000/svg" width="${D}" height="${H}">`);
    lit(`<path d="${d}" fill="none" stroke="${s.track}" stroke-width="${sw}"/>`);
    lit(`<path d="${d}" fill="none" stroke-width="${sw}" pathLength="100" stroke-dasharray="`);
    ex(`ROUND(${V} * 100)`,p=>p); lit(' 100" stroke="'); P.push(col); lit('"/>');
    label(D/2,cy-D*0.1,D*0.17,'middle'); return {P,w:D};
  }
  const litF=x=>'"'+x.replace(/%/g,'%25').replace(/#/g,'%23').replace(/"/g,'""')+'"';
  function formula(s){
    const {P}=parts(s);
    const args=P.map((t,i)=>t.lit!==undefined?(i===0?'"data:image/svg+xml;utf8,'+litF(t.lit).slice(1):litF(t.lit)):t.f);
    args.push('"</svg>"');
    return 'CONCATENATE(\n  '+args.join(',\n  ')+'\n)';
  }
  function svgFor(s,p){
    const {P}=parts(s);
    return 'data:image/svg+xml;utf8,'+encodeURIComponent(P.map(t=>t.lit!==undefined?t.lit:t.js(p)).join('')+'</svg>');
  }
  function render(){
    const s=settings(), w=parts(s).w;
    $('pb-singleBox').hidden=s.mode==='auto';
    $('pb-stepsBox').hidden=s.mode!=='auto';
    $('pb-textBox').hidden=!s.label;
    const t=+$('pb-test').value; $('pb-testOut').textContent=t+'%';
    $('pb-img').src=svgFor(s,t); $('pb-img').width=w;
    syncPickers($('tool-progress'));
    $('pb-stage').className='stage'+((s.shape==='ring'||s.shape==='gauge')?' row':'');
    $('pb-stage').innerHTML=[25,60,100].map(p=>`<img width="${w}" alt="Progress at ${p} percent" src="${svgFor(s,p)}">`).join('');
    showFormula('pb-code',formula(s));
  }
  $('tool-progress').querySelectorAll('input,select').forEach(el=>{ el.addEventListener('input',render); el.addEventListener('change',render); });
  $('pb-add').addEventListener('click',()=>{
    const sorted=readSteps(); let best=null,gap=0;
    sorted.forEach((x,i)=>{ const next=i+1<sorted.length?sorted[i+1].from:100; if(next-x.from>gap){ gap=next-x.from; best=Math.round(x.from+(next-x.from)/2); } });
    if(best===null||gap<2) return;
    steps=sorted; steps.push({from:best,color:'#9c27b0'}); steps.sort((a,b)=>a.from-b.from); drawSteps(); render();
  });
  drawSteps(); render();
})();
