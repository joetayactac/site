/* QR code & Code 128 barcode generator. Preview images load only while the tool is open. */
let qrRefresh=()=>{};
(function(){
  const ECC='L', QZONE='1';
  const fmt=()=>document.querySelector('input[name="qr-format"]:checked').value;
  const hex=h=>h.replace('#','');
  let timer;
  function imageUrl(){
    const v=$('qr-data').value;
    if(fmt()==='qr'){
      const s=$('qr-size').value;
      const p=new URLSearchParams({size:`${s}x${s}`,color:hex($('qr-fg').value),bgcolor:hex($('qr-bg').value),ecc:ECC,qzone:QZONE,data:v||' '});
      return 'https://api.qrserver.com/v1/create-qr-code/?'+p.toString();
    }
    return 'https://barcodeapi.org/api/128/'+encodeURIComponent(v||'SAMPLE123');
  }
  function formula(){
    const col=($('qr-data').value||'ReferenceColumn').trim().replace(/^\[|\]$/g,'');
    if(fmt()==='qr'){
      const s=$('qr-size').value;
      return `CONCATENATE(\n  "https://api.qrserver.com/v1/create-qr-code/?size=${s}x${s}&color=${hex($('qr-fg').value)}&bgcolor=${hex($('qr-bg').value)}&ecc=${ECC}&qzone=${QZONE}&data=",\n  ENCODEURL([${col}])\n)`;
    }
    return `CONCATENATE(\n  "https://barcodeapi.org/api/128/",\n  ENCODEURL([${col}])\n)`;
  }
  function refresh(){
    const isQr=fmt()==='qr';
    document.querySelectorAll('.qr-only').forEach(el=>el.hidden=!isQr);
    document.querySelectorAll('.barcode-only').forEach(el=>el.hidden=isQr);
    $('qr-img').classList.toggle('bar',!isQr);
    $('qr-sizeOut').textContent=$('qr-size').value+' px';
    syncPickers($('tool-qr'));
    showFormula('qr-code',formula());
    $('qr-status').textContent='Loading preview…';
    clearTimeout(timer);
    timer=setTimeout(()=>{ $('qr-img').src=imageUrl(); },250);
  }
  $('qr-img').addEventListener('load',()=>{ $('qr-status').textContent='Preview uses the column name as sample data.'; });
  $('qr-img').addEventListener('error',()=>{ $('qr-status').textContent='Preview could not load. Check your internet connection.'; });
  $('tool-qr').querySelectorAll('input').forEach(el=>el.addEventListener('input',refresh));
  document.querySelectorAll('input[name="qr-format"]').forEach(el=>el.addEventListener('change',refresh));
  qrRefresh=refresh;
})();
App.on('qr',()=>qrRefresh());
