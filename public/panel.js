import {partyRole} from './party-layout.js';
import {giftActions} from './gift-catalog.js';
const $=id=>document.getElementById(id);
let state,settingsLoaded=false,rules=[],timer,catalog=[];
function toast(message){$('toast').textContent=message;$('toast').style.display='block';clearTimeout(timer);timer=setTimeout(()=>$('toast').style.display='none',4500);}
async function api(endpoint,data={}){const r=await fetch('/api/'+endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const j=await r.json();if(!r.ok)throw Error(j.error||'Falha no servidor');return j;}
function action(fn){return async e=>{e?.preventDefault();try{await fn(e);}catch(err){toast(err.message);}};}
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function button(text,fn,cls='quiet'){const b=el('button',text,cls);b.type='button';b.onclick=action(fn);return b;}
function loadSettings(s){for(const k of ['title','subtitle','duration','speed','capacity'])$(k).value=s[k];for(const k of ['comments','transparent'])$(k).checked=s[k];rules=structuredClone(s.rules);renderRules();settingsLoaded=true;}
function renderRules(){
 $('ruleRows').replaceChildren();const effects={join:'Entrar / renovar',marry:'Noivo',bride:'Noiva',band:'Banda',dj:'DJ',reset:'Reiniciar festa'};
 rules.forEach((r,i)=>{
  const tr=el('tr'),title=el('td',r.icon+' '+r.label);
  if(catalog.length){
   const picker=el('select');picker.append(el('option','Selecionar presente da live'));
   catalog.filter(g=>r.coins==null||g.coins===Number(r.coins)).forEach(g=>{const o=el('option',g.name+' · '+g.coins+' · ID '+g.id);o.value=g.id;picker.append(o);});
   picker.onchange=()=>{const g=catalog.find(g=>g.id===picker.value);if(g){r.ids=g.id;r.names=g.name;r.coins=g.coins;renderRules();}};title.append(picker);
  }tr.append(title);
  for(const key of ['names','ids']){const td=el('td'),input=el('input');input.value=r[key];input.setAttribute('aria-label',key+' '+r.label);input.oninput=()=>rules[i][key]=input.value;td.append(input);tr.append(td);}
  const coinsCell=el('td'),coins=el('input');coins.type='number';coins.min='1';coins.placeholder='Qualquer';coins.value=r.coins??'';coins.setAttribute('aria-label','Moedas por unidade '+r.label);coins.oninput=()=>r.coins=coins.value===''?null:Number(coins.value);coinsCell.append(coins);tr.append(coinsCell);
  const effectCell=el('td'),select=el('select');Object.entries(effects).forEach(([value,label])=>{const o=el('option',label);o.value=value;select.append(o);});select.value=r.effect;select.onchange=()=>r.effect=select.value;effectCell.append(select);tr.append(effectCell);$('ruleRows').append(tr);
 });
}
let peopleKey='',logKey='',jobKey='',giftKey='';
function render(s){
 state=s;const ready=document.getElementById('audioStatus');if(ready){ready.textContent=s.audioReady?'● Downloader pronto · yt-dlp + FFmpeg':'○ Downloader precisa de yt-dlp + FFmpeg · veja INSTALAR-AUDIO.ps1';ready.style.color=s.audioReady?'#d6fb79':'#dab67a';}if(!settingsLoaded)loadSettings(s.settings);
 const source=s.sourceLink||{phase:'offline',message:'Link HTTPS desligado'};
 $('sourceURL').value=source.url||'';$('sourceStatus').textContent=source.message;
 $('startSource').disabled=source.phase==='starting';$('stopSource').hidden=source.phase!=='online';
 const confirmed=(s.giftCatalog||[]).filter(g=>g.status==='verified').length;
 $('catalogSummary').textContent=s.catalogStatus==='ready'?confirmed+'/6 presentes confirmados. '+(s.giftCatalog||[]).filter(g=>g.status!=='verified').map(g=>giftActions[g.effect]+': '+(g.status==='ambiguous'?'selecione o item':'presente indisponível')).join(' · '):s.catalogStatus==='loading'?'Carregando catálogo automaticamente…':s.catalogStatus==='error'?'Falha no catálogo. Clique em Presentes da live para tentar novamente.':'Conecte a live para confirmar nomes, imagens, IDs e moedas automaticamente.';
 $('status').textContent=s.status.message;$('statusLed').style.background=s.status.phase==='online'?'#d6fb79':s.status.phase==='error'?'#ff8484':'#899578';
 $('peopleCount').replaceChildren(document.createTextNode(s.people.length+' '),el('small','participantes'));$('roseCount').replaceChildren(document.createTextNode(s.roses+' '),el('small','nesta sessão'));$('audioMetric').replaceChildren(document.createTextNode(s.music.playing?'Tocando ':'Pronto '),el('small',s.music.playing?'áudio ativo na cena':'baixar, converter e tocar'));
 const gk=JSON.stringify(s.settings.rules);if(gk!==giftKey){giftKey=gk;$('giftButtons').replaceChildren(...s.settings.rules.map(r=>button(r.icon+' '+r.label,()=>api('simulate',{user:$('testUser').value.trim()||'Visitante',giftName:r.names.split(',')[0],giftId:r.ids.split(',')[0],coins:r.coins,count:1}))));}
 const pk=JSON.stringify([s.couple,s.stage,s.people.map(p=>[p.id,p.name,p.roses,p.expires])]);if(pk!==peopleKey){peopleKey=pk;$('participants').replaceChildren();s.people.forEach(p=>{const row=el('div',undefined,'person-row'),avatar=el('span',p.name[0],'avatar');avatar.style.background='hsl('+p.color+' 65% 70%)';const info=el('span',p.name);info.append(el('small',(partyRole(s,p.id)?partyRole(s,p.id).label+' · ':'')+'🌹 '+p.roses+' · @'+p.id));row.append(avatar,info,button('Remover',()=>api('remove',{id:p.id})));$('participants').append(row);});if(!s.people.length)$('participants').append(el('p','A roda está esperando a primeira rosa.','empty'));}
 const ek=JSON.stringify(s.log);if(ek!==logKey){logKey=ek;$('log').replaceChildren(...s.log.slice(0,15).map(e=>{const row=el('div',undefined,'log-item');row.append(el('span',e.icon),el('span',e.message),el('time',new Date(e.at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})));return row;}));}
 const jk=JSON.stringify(s.jobs);if(jk!==jobKey){jobKey=jk;$('downloads').replaceChildren(...s.jobs.slice(0,3).map(j=>el('div',(j.phase==='error'?'⚠ ':j.phase==='done'?'✓ ':'↓ ')+j.message,'download-job')));const busy=s.jobs.some(j=>j.phase==='running');$('downloadButton').disabled=busy;$('cancelDownload').hidden=!busy;}
 const m=s.music;$('nowPlaying').textContent=s.track?.title||'Cole um link para começar';$('playState').textContent=m.playing?'Reproduzindo na live':m.file?'Pausado':'Aguardando áudio';
 if(document.activeElement!==$('volume'))$('volume').value=Math.round(m.volume*100);$('volumeValue').value=Math.round(m.volume*100)+'%';
 const pos=Math.max(0,Math.min(m.duration||86400,m.position+(m.playing?(s.serverTime-m.changed)/1000:0))),duration=m.duration||0;
 const format=n=>Math.floor(n/60)+':'+String(Math.floor(n%60)).padStart(2,'0');
 if(document.activeElement!==$('seek')){$('seek').max=duration||1;$('seek').value=pos;}$('seek').disabled=!duration;$('timeValue').value=format(pos)+' / '+format(duration);
}
const events=new EventSource('/events');events.onmessage=e=>{render(JSON.parse(e.data));$('transport').textContent='Eventos em tempo real · sincronizado';};events.onerror=()=>{$('transport').textContent='Servidor indisponível · reconectando…';};
$('connectForm').onsubmit=action(()=>api('connect',{username:$('username').value}));
$('disconnect').onclick=action(()=>api('disconnect'));
$('commentForm').onsubmit=action(()=>api('simulate',{kind:'comment',user:$('testUser').value.trim()||'Visitante',comment:$('testComment').value}));
$('settingsForm').onsubmit=action(async()=>{const b={};for(const k of ['title','subtitle','duration','speed','capacity'])b[k]=$(k).value;for(const k of ['comments','transparent'])b[k]=$(k).checked;await api('settings',b);toast('Configurações salvas');});
$('saveRules').onclick=action(async()=>{await api('settings',{rules});toast('Mapa de presentes salvo');});
$('clear').onclick=action(async()=>{if(confirm('Limpar participantes, rosas e histórico desta sessão?'))await api('clear');});
$('downloadForm').onsubmit=action(async()=>{await api('download',{url:$('videoURL').value});toast('Download iniciado. O MP3 tocará automaticamente na cena.');});
for(const id of ['play','pause','stop'])$(id).onclick=action(()=>api('music',{action:id}));
$('volume').oninput=()=>{$('volumeValue').value=$('volume').value+'%';};$('volume').onchange=action(()=>api('music',{action:'volume',value:Number($('volume').value)/100}));
$('seek').onchange=action(()=>api('music',{action:'seek',value:Number($('seek').value)}));

$('cancelDownload').onclick=action(()=>api('download/cancel'));

$('loadCatalog').onclick=action(async()=>{
 const r=await fetch('/api/gifts'),j=await r.json();if(!r.ok)throw Error(j.error);
 catalog=j.gifts;renderRules();toast('Catálogo carregado. Selecione os presentes e salve o mapa.');
});
for(const [id,orientation] of [['copyPortrait','portrait'],['copyLandscape','landscape']])$(id).onclick=action(async()=>{
 const link=new URL(state?.sourceLink?.url||location.origin+'/overlay/festa?jogo=festa&source=1');link.searchParams.set('format',orientation);const url=link.href;
 try{await navigator.clipboard.writeText(url);toast('Link copiado. Fonte Link: '+(orientation==='portrait'?'1080 × 1920':'1920 × 1080')+'.');}
 catch{window.prompt('Copie o link da fonte:',url);}
});
$('startSource').onclick=action(async()=>{await api('source-link');render(await(await fetch('/api/state')).json());toast('Link HTTPS pronto. Copie o link vertical para o LIVE Studio.');});
$('stopSource').onclick=action(()=>api('source-link/stop'));
$('sourceURL').onclick=()=>{$('sourceURL').select();};
