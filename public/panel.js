const $=id=>document.getElementById(id);
let state,settingsLoaded=false,rules=[],timer;
function toast(message){$('toast').textContent=message;$('toast').style.display='block';clearTimeout(timer);timer=setTimeout(()=>$('toast').style.display='none',4500);}
async function api(endpoint,data={}){const r=await fetch('/api/'+endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const j=await r.json();if(!r.ok)throw Error(j.error||'Falha no servidor');return j;}
function action(fn){return async e=>{e?.preventDefault();try{await fn(e);}catch(err){toast(err.message);}};}
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function button(text,fn,cls='quiet'){const b=el('button',text,cls);b.type='button';b.onclick=action(fn);return b;}
function loadSettings(s){for(const k of ['title','subtitle','duration','speed','capacity'])$(k).value=s[k];for(const k of ['comments','transparent'])$(k).checked=s[k];rules=structuredClone(s.rules);renderRules();settingsLoaded=true;}
function renderRules(){
 $('ruleRows').replaceChildren();const effects={join:'Entrar / renovar',heart:'Corações',jump:'Pulo',glow:'Brilho',galaxy:'Galáxia',king:'Coroa'};
 rules.forEach((r,i)=>{const tr=el('tr');tr.append(el('td',r.icon+' '+r.label));for(const key of ['names','ids']){const td=el('td'),input=el('input');input.value=r[key];input.dataset.field=key;input.setAttribute('aria-label',key+' '+r.label);input.oninput=()=>rules[i][key]=input.value;td.append(input);tr.append(td);}const td=el('td'),select=el('select');select.setAttribute('aria-label','Efeito '+r.label);Object.entries(effects).forEach(([value,label])=>{const o=el('option',label);o.value=value;select.append(o);});select.value=r.effect;select.onchange=()=>rules[i].effect=select.value;td.append(select);tr.append(td);$('ruleRows').append(tr);});
}
let libraryKey='',peopleKey='',logKey='',jobKey='',giftKey='';
function render(s){
 state=s;const ready=document.getElementById('audioStatus');if(ready){ready.textContent=s.audioReady?'● Downloader pronto · yt-dlp + FFmpeg':'○ Downloader precisa de yt-dlp + FFmpeg · veja INSTALAR-AUDIO.ps1';ready.style.color=s.audioReady?'#d6fb79':'#dab67a';}if(!settingsLoaded)loadSettings(s.settings);
 $('status').textContent=s.status.message;$('statusLed').style.background=s.status.phase==='online'?'#d6fb79':s.status.phase==='error'?'#ff8484':'#899578';
 $('peopleCount').replaceChildren(document.createTextNode(s.people.length+' '),el('small','participantes'));$('roseCount').replaceChildren(document.createTextNode(s.roses+' '),el('small','nesta sessão'));$('trackCount').replaceChildren(document.createTextNode(s.tracks.length+' '),el('small','músicas disponíveis'));
 const gk=JSON.stringify(s.settings.rules);if(gk!==giftKey){giftKey=gk;$('giftButtons').replaceChildren(...s.settings.rules.map(r=>button(r.icon+' '+r.label,()=>api('simulate',{user:$('testUser').value.trim()||'Visitante',giftName:r.names.split(',')[0],giftId:r.ids.split(',')[0],count:1}))));}
 const lk=JSON.stringify(s.tracks);if(lk!==libraryKey){libraryKey=lk;$('library').replaceChildren();s.tracks.forEach((t,i)=>{const row=el('div',undefined,'track');row.append(el('span',String(i+1).padStart(2,'0'),'number'),el('span',t.title),button('▶',()=>api('music',{action:'play',file:t.file}),'outline'),button('+ Fila',()=>api('music',{action:'enqueue',file:t.file})));$('library').append(row);});if(!s.tracks.length)$('library').append(el('p','Nenhum MP3 ainda. Baixe uma música ou coloque arquivos em music/.','empty'));}
 const pk=JSON.stringify(s.people.map(p=>[p.id,p.name,p.roses,p.expires]));if(pk!==peopleKey){peopleKey=pk;$('participants').replaceChildren();s.people.forEach(p=>{const row=el('div',undefined,'person-row'),avatar=el('span',p.name[0],'avatar');avatar.style.background='hsl('+p.color+' 65% 70%)';const info=el('span',p.name);info.append(el('small','🌹 '+p.roses+' · @'+p.id));row.append(avatar,info,button('Remover',()=>api('remove',{id:p.id})));$('participants').append(row);});if(!s.people.length)$('participants').append(el('p','A roda está esperando a primeira rosa.','empty'));}
 const ek=JSON.stringify(s.log);if(ek!==logKey){logKey=ek;$('log').replaceChildren(...s.log.slice(0,15).map(e=>{const row=el('div',undefined,'log-item');row.append(el('span',e.icon),el('span',e.message),el('time',new Date(e.at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})));return row;}));}
 const jk=JSON.stringify(s.jobs);if(jk!==jobKey){jobKey=jk;$('downloads').replaceChildren(...s.jobs.slice(0,3).map(j=>el('div',(j.phase==='error'?'⚠ ':j.phase==='done'?'✓ ':'↓ ')+j.message,'download-job')));$('downloadButton').disabled=s.jobs.some(j=>j.phase==='running');}
 const m=s.music;$('nowPlaying').textContent=s.tracks.find(t=>t.file===m.file)?.title||'Escolha a trilha da roda';$('playState').textContent=m.playing?'Reprodução ativa na cena':'Pausado';$('queue').textContent=m.queue.length?'A seguir: '+m.queue.map(f=>s.tracks.find(t=>t.file===f)?.title||f).join(' → '):'Fila vazia';
 if(document.activeElement!==$('volume'))$('volume').value=Math.round(m.volume*100);$('volumeValue').value=Math.round(m.volume*100)+'%';
 const pos=m.position+(m.playing?(s.serverTime-m.changed)/1000:0);if(document.activeElement!==$('seek')){$('seek').max=Math.max(600,pos+60);$('seek').value=pos;}$('timeValue').value=Math.floor(pos/60)+':'+String(Math.floor(pos%60)).padStart(2,'0');
}
const events=new EventSource('/events');events.onmessage=e=>{render(JSON.parse(e.data));$('transport').textContent='Eventos em tempo real · sincronizado';};events.onerror=()=>{$('transport').textContent='Servidor indisponível · reconectando…';};
$('connectForm').onsubmit=action(()=>api('connect',{username:$('username').value}));
$('disconnect').onclick=action(()=>api('disconnect'));
$('commentForm').onsubmit=action(()=>api('simulate',{kind:'comment',user:$('testUser').value.trim()||'Visitante',comment:$('testComment').value}));
$('settingsForm').onsubmit=action(async()=>{const b={};for(const k of ['title','subtitle','duration','speed','capacity'])b[k]=$(k).value;for(const k of ['comments','transparent'])b[k]=$(k).checked;await api('settings',b);toast('Configurações salvas');});
$('saveRules').onclick=action(async()=>{await api('settings',{rules});toast('Mapa de presentes salvo');});
$('clear').onclick=action(async()=>{if(confirm('Limpar participantes, rosas e histórico desta sessão?'))await api('clear');});
$('downloadForm').onsubmit=action(async()=>{await api('download',{url:$('youtube').value});toast('Download iniciado');});
$('refresh').onclick=action(async()=>{render(await(await fetch('/api/state')).json());toast('Biblioteca atualizada');});
for(const id of ['play','pause','next'])$(id).onclick=action(()=>api('music',{action:id}));
$('volume').oninput=()=>{$('volumeValue').value=$('volume').value+'%';};$('volume').onchange=action(()=>api('music',{action:'volume',value:Number($('volume').value)/100}));
$('seek').onchange=action(()=>api('music',{action:'seek',value:Number($('seek').value)}));
