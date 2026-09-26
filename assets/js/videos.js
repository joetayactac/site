/* YouTube videos: full gallery on #videos and the latest three on the home page.
   With an API key every upload is listed; without one the channel RSS feed
   (latest ~15) is used and a link to the full list on YouTube is shown. */
(function(){
  const API_KEY='';
  const CHANNEL_ID='UCRC82n8iFWNSpPFIvF8ZsJg';
  const UPLOADS='UU'+CHANNEL_ID.slice(2);
  const EMBED='https://www.youtube-nocookie.com/embed/';
  const RSS='https://www.youtube.com/feeds/videos.xml?channel_id='+CHANNEL_ID;
  const PAGE=24;
  let feedPromise=null, items=[], complete=false, shown=PAGE, currentId=null, pendingId=null, playerReady=false;

  const fmtDate=d=>new Date(d).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});

  async function fromApi(){
    const all=[]; let token='';
    do{
      const url='https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId='+UPLOADS+'&key='+API_KEY+(token?'&pageToken='+token:'');
      const d=await (await fetch(url)).json();
      if(d.error) throw new Error(d.error.message);
      (d.items||[]).forEach(it=>{
        const sn=it.snippet, id=sn.resourceId&&sn.resourceId.videoId;
        if(id && sn.title!=='Private video' && sn.title!=='Deleted video') all.push({id, title:sn.title, date:fmtDate(sn.publishedAt)});
      });
      token=d.nextPageToken||'';
    }while(token);
    return all;
  }
  async function fromRss(){
    const d=await (await fetch('https://api.rss2json.com/v1/api.json?rss_url='+encodeURIComponent(RSS))).json();
    if(d.status!=='ok') return [];
    return (d.items||[]).map(it=>{
      const m=(it.link||'').match(/v=([\w-]{11})/) || (it.guid||'').match(/([\w-]{11})$/);
      return m ? {id:m[1], title:it.title, date:fmtDate((it.pubDate||'').replace(' ','T'))} : null;
    }).filter(Boolean);
  }
  function feed(){
    if(!feedPromise) feedPromise=(async()=>{
      if(API_KEY){ try{ const all=await fromApi(); if(all.length){ complete=true; return all; } }catch(e){} }
      try{ return await fromRss(); }catch(e){ return []; }
    })();
    return feedPromise;
  }

  function card(v, onClick){
    const b=document.createElement('button'); b.className='vid'; b.type='button'; b.dataset.id=v.id;
    b.innerHTML=`<span class="thumb"><img loading="lazy" alt="" src="https://i.ytimg.com/vi/${v.id}/mqdefault.jpg">`+
      `<span class="play"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></span></span>`+
      `<span class="t">${esc(v.title)}</span><span class="d">${esc(v.date)}</span>`;
    b.addEventListener('click',()=>onClick(v.id,b));
    return b;
  }
  function skeletons(el,n){
    el.innerHTML=Array.from({length:n},()=>'<div class="vid skeleton" aria-hidden="true"><span class="thumb"></span><span class="t"></span><span class="d"></span></div>').join('');
  }

  /* ---- Gallery (#videos) ---- */
  function play(id){
    currentId=id;
    $('yt-player').src=EMBED+id+'?autoplay=1&rel=0&list='+UPLOADS;
    document.querySelectorAll('#yt-grid .vid').forEach(v=>v.classList.toggle('playing',v.dataset.id===id));
    $('yt-player').scrollIntoView({behavior:'smooth',block:'center'});
  }
  function draw(){
    const term=$('yt-search').value.trim().toLowerCase();
    const list=items.filter(v=>v.title.toLowerCase().includes(term));
    const visible=term?list:list.slice(0,shown);
    const grid=$('yt-grid'); grid.innerHTML='';
    visible.forEach(v=>{ const b=card(v,play); if(v.id===currentId) b.classList.add('playing'); grid.appendChild(b); });
    $('yt-empty').hidden=list.length>0;
    $('yt-more').hidden=!!term || shown>=list.length;
    $('yt-more').textContent='Show more videos ('+(list.length-shown)+' left)';
  }
  async function openGallery(){
    if(pendingId){ const id=pendingId; pendingId=null; playerReady=true; play(id); }
    else if(!playerReady){ playerReady=true; $('yt-player').src=EMBED+'videoseries?rel=0&list='+UPLOADS; }
    if(items.length) return;
    $('yt-latest').hidden=false; skeletons($('yt-grid'),6);
    items=await feed();
    if(!items.length){ $('yt-latest').hidden=true; return; }
    $('yt-count').textContent=complete ? items.length+' videos' : 'Latest '+items.length;
    $('yt-title').textContent=complete ? 'All videos' : 'Latest videos';
    $('yt-older').hidden=complete;
    draw();
  }
  $('yt-search').addEventListener('input',draw);
  $('yt-more').addEventListener('click',()=>{ shown+=PAGE; draw(); });
  App.on('videos',openGallery);

  /* ---- Home: latest three ---- */
  let homeDone=false;
  async function openHome(){
    if(homeDone) return; homeDone=true;
    const sec=$('home-videos-section'), grid=$('home-videos');
    sec.hidden=false; skeletons(grid,3);
    const list=await feed();
    if(!list.length){ sec.hidden=true; return; }
    grid.innerHTML='';
    list.slice(0,3).forEach(v=>grid.appendChild(card(v,id=>{ pendingId=id; location.hash='videos'; })));
  }
  App.on('home',openHome);
})();
