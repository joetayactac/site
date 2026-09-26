/* Hire me form: email verification code, then message delivery via Apps Script. */
(function(){
  const SCRIPT_URL="https://script.google.com/macros/s/AKfycbyBQOTQ-pi9ejWiaEZnrKwfVOm8zW6R9hyn5cydNdxJWVQTV-Ck8movTjeSXy-6osjbnQ/exec";
  const TIMEOUT=20000, COOLDOWN=60;
  let email='', timer=null;

  const msg=(t,type)=>{ const el=$('c-msg'); el.textContent=t; el.className='msg'+(type?' '+type:''); };
  const loading=(btn,on,label)=>{ btn.disabled=on; btn.classList.toggle('loading',on); if(label) btn.querySelector('.lbl').textContent=label; };
  const validEmail=e=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const post=body=>{ const c=new AbortController(); const t=setTimeout(()=>c.abort(),TIMEOUT); return fetch(SCRIPT_URL,{method:'POST',body:JSON.stringify(body),signal:c.signal}).finally(()=>clearTimeout(t)); };
  function step(n,label){ [1,2,3].forEach(i=>$('c-p'+i).classList.toggle('on',i<=n)); $('c-stepLabel').textContent=label; }
  function show(which){ $('c-form').style.display=which==='form'?'grid':'none'; $('c-otp').style.display=which==='otp'?'grid':'none'; $('c-done').style.display=which==='done'?'block':'none'; }

  function cooldown(){
    const btn=$('c-resend'); let left=COOLDOWN; btn.disabled=true;
    btn.innerHTML='Resend in <span id="c-cool">'+left+'</span>s';
    clearInterval(timer);
    timer=setInterval(()=>{ left--; if(left<=0){ clearInterval(timer); btn.disabled=false; btn.textContent='Resend code'; } else { $('c-cool').textContent=left; } },1000);
  }

  function sendOTP(isResend){
    const name=$('c-name').value.trim(), details=$('c-details').value.trim(), e=$('c-email').value.trim();
    if(!isResend){
      if(!name){ msg('Enter your name.','err'); $('c-name').focus(); return; }
      if(!validEmail(e)){ msg('Enter a valid email address, like you@email.com.','err'); $('c-email').focus(); return; }
      if(!details){ msg('Describe what you need built.','err'); $('c-details').focus(); return; }
      email=e;
    }
    msg(isResend?'Sending a new code…':'Sending your code…','info');
    if(!isResend) loading($('c-send'),true,'Sending code…'); else $('c-resend').disabled=true;
    post({action:'sendOTP',name,email,details})
      .then(r=>r.text())
      .then(()=>{ show('otp'); $('c-code').value=''; msg(isResend?'New code sent.':'Code sent. Check your inbox.','ok'); step(2,'Verify email'); cooldown(); $('c-code').focus(); })
      .catch(err=>msg(err&&err.name==='AbortError'?'The request timed out. Try again.':'The code could not be sent. Try again.','err'))
      .finally(()=>loading($('c-send'),false,'Send verification code'));
  }
  function verify(){
    const code=$('c-code').value.trim();
    if(!/^\d{4}$/.test(code)){ msg('Enter the 4-digit code from your email.','err'); return; }
    msg('Checking code…','info'); loading($('c-verify'),true,'Checking…');
    post({action:'verifyOTP',email,otp:code})
      .then(r=>r.text())
      .then(data=>{
        if(data==='Success'){ clearInterval(timer); show('done'); msg('',''); step(3,'Sent'); }
        else msg(data||'That code doesn\'t match. Check the email and try again.','err');
      })
      .catch(err=>msg(err&&err.name==='AbortError'?'The request timed out. Try again.':'The code could not be checked. Try again.','err'))
      .finally(()=>loading($('c-verify'),false,'Verify and send message'));
  }
  $('c-send').addEventListener('click',()=>sendOTP(false));
  $('c-resend').addEventListener('click',()=>sendOTP(true));
  $('c-verify').addEventListener('click',verify);
  $('c-code').addEventListener('keydown',e=>{ if(e.key==='Enter') verify(); });
  $('c-back').addEventListener('click',()=>{ clearInterval(timer); show('form'); msg('',''); step(1,'Your details'); });
})();
