/* HTML table generator for a Text column. */
(function(){
  let cols=[
    {h:'Name',c:'Name',s:'Juan Dela Cruz'},
    {h:'Vehicle No',c:'Vehicle No',s:'ABC 1234'},
    {h:'Status',c:'Status',s:'Active'}
  ];
  const radio=name=>document.querySelector(`input[name="${name}"]:checked`).value;
  const q=s=>s.replace(/"/g,'""');
  const caseIt=(t,mode)=>mode==='upper'?t.toUpperCase():mode==='lower'?t.toLowerCase():t;

  function drawList(){
    const list=$('tb-list'); list.innerHTML='';
    cols.forEach((col,i)=>{
      const row=document.createElement('div'); row.className='col-row';
      row.innerHTML=`<input type="text" aria-label="Header text ${i+1}" placeholder="Header" value="${esc(col.h).replace(/"/g,'&quot;')}">`+
        `<input type="text" aria-label="AppSheet column ${i+1}" placeholder="Column" value="${esc(col.c).replace(/"/g,'&quot;')}">`+
        `<input type="text" class="sample" aria-label="Preview sample ${i+1}" placeholder="Sample value" value="${esc(col.s).replace(/"/g,'&quot;')}">`+
        `<button type="button" class="x" aria-label="Remove column ${i+1}">×</button>`;
      const [h,c,s]=row.querySelectorAll('input');
      h.addEventListener('input',()=>{ col.h=h.value; render(); });
      c.addEventListener('input',()=>{ col.c=c.value; render(); });
      s.addEventListener('input',()=>{ col.s=s.value; render(); });
      row.querySelector('.x').addEventListener('click',()=>{ cols.splice(i,1); drawList(); render(); });
      list.appendChild(row);
    });
  }
  function styles(){
    const align=radio('tb-align'), border=$('tb-border').checked, bold=$('tb-bold').checked;
    const base=`padding:6px 8px;text-align:${align}`+(border?';border:1px solid #ccc':'');
    return { th: base+(bold?';font-weight:bold':';font-weight:normal'), td: base };
  }
  function render(){
    const hc=radio('tb-hcase'), rf=radio('tb-rfn'), st=styles();
    const width=($('tb-width').value.trim()||'100%').replace(/['"<>;]/g,'');
    const tableStyle=`width:${width};border-collapse:collapse`;
    const active=cols.filter(c=>c.h.trim()||c.c.trim());

    const L=[];
    L.push(`"<table style='${tableStyle}'><tr>"`);
    active.forEach(c=>L.push(`"<th style='${st.th}'>${q(esc(caseIt(c.h,hc)))}</th>"`));
    L.push(`"</tr><tr>"`);
    active.forEach(c=>{
      const name=(c.c.trim()||c.h.trim()).replace(/^\[|\]$/g,'');
      const ref=`[${name}]`;
      const val=rf==='upper'?`UPPER(${ref})`:rf==='lower'?`LOWER(${ref})`:ref;
      L.push(`"<td style='${st.td}'>"`, val, `"</td>"`);
    });
    L.push(`"</tr></table>"`);
    showFormula('tb-code', active.length ? 'CONCATENATE(\n  '+L.join(',\n  ')+'\n)' : 'Add at least one column.');

    const tv=v=>rf==='upper'?v.toUpperCase():rf==='lower'?v.toLowerCase():v;
    $('tb-preview').innerHTML = active.length
      ? `<table style="${tableStyle}"><tr>${active.map(c=>`<th style="${st.th}">${esc(caseIt(c.h,hc))}</th>`).join('')}</tr>`+
        `<tr>${active.map(c=>`<td style="${st.td}">${esc(tv(c.s))}</td>`).join('')}</tr></table>`
      : '<p class="hint">Add a column to see the table.</p>';
  }
  $('tb-add').addEventListener('click',()=>{ cols.push({h:'',c:'',s:''}); drawList(); render(); const inputs=$('tb-list').querySelectorAll('.col-row:last-child input'); if(inputs[0]) inputs[0].focus(); });
  ['tb-width','tb-border','tb-bold'].forEach(id=>{ $(id).addEventListener('input',render); $(id).addEventListener('change',render); });
  document.querySelectorAll('input[name="tb-hcase"],input[name="tb-rfn"],input[name="tb-align"]').forEach(el=>el.addEventListener('change',render));
  drawList(); render();
})();
