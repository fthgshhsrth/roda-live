import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {fresh,defaults,gift,comment,prune,settings} from './wheel.js';
const ROOT=path.dirname(fileURLToPath(import.meta.url)),PUB=path.join(ROOT,'public'),MUSIC=path.join(ROOT,'music'),DATA=path.join(ROOT,'data');
fs.mkdirSync(MUSIC,{recursive:true});fs.mkdirSync(DATA,{recursive:true});
const stateFile=path.join(DATA,'state.json');let state=fresh();try{const saved=JSON.parse(fs.readFileSync(stateFile));state={...state,...saved,settings:{...defaults,...saved.settings}};state.music.playing=false;}catch{}
let audioReady=false;
const clients=new Set();let live=null,epoch=0,status={phase:'offline',message:'Modo local · simulador disponível'},jobs=[];
function save(){fs.writeFileSync(stateFile,JSON.stringify(state,null,2));}
function tracks(){return fs.readdirSync(MUSIC).filter(f=>f.endsWith('.mp3')).sort().map(file=>({file,title:file.replace(/\s*\[[^\]]+\]\.mp3$/,'').replace(/\.mp3$/,''),url:'/music/'+encodeURIComponent(file)}));}
function snapshot(){prune(state);return {...state,status,jobs,tracks:tracks(),serverTime:Date.now(),audioReady:!!audioReady};}
function send(){const data='data: '+JSON.stringify(snapshot())+'\n\n';for(const res of clients)res.write(data);}
function musicPosition(){return state.music.position+(state.music.playing?(Date.now()-state.music.changed)/1000:0);}
function setStatus(phase,message){status={phase,message};send();}
function disconnect(){epoch++;const old=live;live=null;try{old?.disconnect();}catch{}setStatus('offline','Desconectado · simulador disponível');}
async function connect(username){
 disconnect();const ticket=epoch;setStatus('connecting','Conectando a @'+username);
 try{
 const mod=await import('tiktok-live-connector');if(ticket!==epoch)return;
 const Connection=mod.TikTokLiveConnection||mod.WebcastPushConnection;
 const conn=new Connection(username,{enableExtendedGiftInfo:true,processInitialData:false,...(process.env.EULER_API_KEY?{signApiKey:process.env.EULER_API_KEY}:{})});live=conn;
 conn.on('gift',e=>{if(ticket!==epoch)return;const ev=gift(state,{...e,giftName:e.giftName||e.giftDetails?.giftName||e.gift?.name});if(ev){save();send();}});
 conn.on('chat',e=>{if(ticket===epoch&&comment(state,e))send();});
 conn.on('error',()=>{if(ticket===epoch)setStatus('error','Erro de conexão. Verifique a live e o provedor de assinatura.');});
 conn.on('disconnected',()=>{if(ticket===epoch)setStatus('offline','Conexão encerrada. Clique em Conectar para tentar novamente.');});
 conn.on('streamEnd',()=>{if(ticket===epoch)disconnect();});
 await conn.connect();if(ticket!==epoch){conn.disconnect();return;}setStatus('online','Ao vivo com @'+username);
 }catch(e){if(ticket===epoch)setStatus('error','Não foi possível conectar: '+String(e.message).slice(0,180));}
}
function tool(name){const local=path.join(ROOT,'tools',process.platform==='win32'?name+'.exe':name);return fs.existsSync(local)?local:name;}
function download(raw){
 let url;try{url=new URL(raw);}catch{throw Error('Cole uma URL válida do YouTube.');}
 if(url.protocol!=='https:'||!['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtu.be'].includes(url.hostname)||url.username||url.password||url.port)throw Error('Use um link HTTPS do YouTube.');
 if(jobs.some(j=>j.phase==='running'))throw Error('Aguarde o download atual.');
 const job={id:Date.now(),phase:'running',message:'Iniciando yt-dlp…'};jobs.unshift(job);jobs=jobs.slice(0,10);send();
 const args=['--ignore-config','--no-playlist','--no-overwrites','--windows-filenames','--newline','--no-quiet','--progress','--max-filesize','150M','--socket-timeout','20','--retries','2','--js-runtimes','node:'+process.execPath,'-x','--audio-format','mp3','--audio-quality','0','-P',MUSIC,'-o','%(title).150B [%(id)s].%(ext)s','--print','after_move:filepath'];
 if(tool('ffmpeg')!=='ffmpeg')args.push('--ffmpeg-location',path.dirname(tool('ffmpeg')));
 args.push('--',url.href);
 const child=spawn(tool('yt-dlp'),args,{cwd:ROOT,windowsHide:true,shell:false});let tail='',lastFile='';
 const timer=setTimeout(()=>{job.message='Tempo limite excedido';child.kill();},900000);
 const collect=data=>{tail=(tail+data.toString()).slice(-5000);const lines=tail.trim().split(/\r?\n/);job.message=lines.at(-1)?.slice(0,240)||'Convertendo…';for(const line of lines)if(line.endsWith('.mp3')&&path.dirname(line)===MUSIC)lastFile=path.basename(line);send();};
 child.stdout.on('data',collect);child.stderr.on('data',collect);
 child.on('error',e=>{clearTimeout(timer);job.phase='error';job.message=e.code==='ENOENT'?'yt-dlp não encontrado. Coloque yt-dlp.exe em tools/ ou no PATH.':e.message;send();});
 child.on('close',code=>{clearTimeout(timer);if(job.phase==='error')return;job.phase=code===0?'done':'error';if(code===0&&lastFile&&fs.existsSync(path.join(MUSIC,lastFile))){job.message='MP3 salvo em music/ e adicionado à fila';if(lastFile&&fs.existsSync(path.join(MUSIC,lastFile)))state.music.queue.push(lastFile);save();}else {job.phase='error';job.message='Falha: verifique yt-dlp, FFmpeg e o link. '+tail.slice(-700);}send();});return job;
}
async function body(req){let text='';for await(const chunk of req){text+=chunk;if(text.length>65536)throw Error('Requisição muito grande');}return text?JSON.parse(text):{};}
function json(res,code,data){res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 try{
 const host=req.headers.host;if(!host||!/^((localhost|127\.0\.0\.1)(:\d+)?)$/.test(host)){json(res,403,{error:'Host não permitido'});return;}
 const url=new URL(req.url,'http://'+host);
 if(req.method==='POST'){
 if(req.headers.origin&&req.headers.origin!=='http://'+host){json(res,403,{error:'Origem inválida'});return;}
 if(!req.headers['content-type']?.startsWith('application/json')){json(res,415,{error:'Use JSON'});return;}
 const b=await body(req);
 switch(url.pathname){
 case '/api/connect':{const u=String(b.username||'').replace(/^@/,'');if(!/^[\w.]{2,40}$/.test(u))throw Error('Informe o @ da live');void connect(u);break;}
 case '/api/disconnect':disconnect();break;
 case '/api/simulate':if(b.kind==='comment')comment(state,{uniqueId:b.user,nickname:b.user,comment:b.comment});else gift(state,{uniqueId:b.user,nickname:b.user,giftName:b.giftName,giftId:b.giftId,repeatCount:b.count,repeatEnd:true});break;
 case '/api/settings':state.settings=settings(b,state.settings);break;
 case '/api/remove':state.people=state.people.filter(p=>p.id!==b.id);break;
 case '/api/clear':state.people=[];state.log=[];state.roses=0;break;
 case '/api/download':download(String(b.url||''));break;
 case '/api/music':{
 const m=state.music;m.position=musicPosition();m.changed=Date.now();
 if(b.action==='play'){if(b.file){if(!tracks().some(t=>t.file===b.file))throw Error('MP3 não encontrado');m.file=b.file;m.position=0;}if(!m.file&&m.queue.length){m.file=m.queue.shift();m.position=0;}if(!m.file)throw Error('Escolha uma música');m.playing=true;}
 else if(b.action==='pause')m.playing=false;
 else if(b.action==='volume'){const n=Number(b.value);if(!Number.isFinite(n))throw Error('Volume inválido');m.volume=Math.max(0,Math.min(1,n));}
 else if(b.action==='seek'){const n=Number(b.value);if(!Number.isFinite(n))throw Error('Posição inválida');m.position=Math.max(0,Math.min(86400,n));}
 else if(b.action==='enqueue'){if(!tracks().some(t=>t.file===b.file))throw Error('MP3 não encontrado');m.queue.push(b.file);}
 else if(b.action==='next'){if(b.expectedFile&&b.expectedFile!==m.file)break;let next;while(m.queue.length&&!next){const c=m.queue.shift();if(tracks().some(t=>t.file===c))next=c;}m.file=next||null;m.position=0;m.playing=!!next;}
 else if(b.action==='clearQueue')m.queue=[];
 else throw Error('Comando inválido');break;}
 default:json(res,404,{error:'Endpoint desconhecido'});return;
 }save();send();json(res,200,{ok:true});return;}
 if(req.method!=='GET'&&req.method!=='HEAD'){json(res,405,{error:'Método inválido'});return;}
 if(url.pathname==='/api/state'){json(res,200,snapshot());return;}
 if(url.pathname==='/events'){res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});res.write('data: '+JSON.stringify(snapshot())+'\n\n');clients.add(res);req.on('close',()=>clients.delete(res));return;}
 const isMusic=url.pathname.startsWith('/music/'),base=isMusic?MUSIC:PUB,relative=decodeURIComponent(isMusic?url.pathname.slice(7):url.pathname==='/'?'index.html':url.pathname.slice(1)),file=path.resolve(base,relative);
 if(!file.startsWith(base+path.sep)||!(isMusic?file.endsWith('.mp3'):['.html','.js','.css'].includes(path.extname(file)))){json(res,403,{error:'Arquivo não permitido'});return;}
 let stat;try{stat=fs.statSync(file);}catch{json(res,404,{error:'Arquivo não encontrado'});return;}if(!stat.isFile()){json(res,404,{error:'Arquivo não encontrado'});return;}
 const headers={'Content-Type':mime[path.extname(file)]||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'no-cache'};let start=0,end=stat.size-1,code=200;
 if(req.headers.range){const m=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);if(!m){res.writeHead(416,{'Content-Range':'bytes */'+stat.size});res.end();return;}if(!m[1])start=Math.max(0,stat.size-Number(m[2]));else{start=Number(m[1]);if(m[2])end=Math.min(end,Number(m[2]));}if(start>end||start>=stat.size){res.writeHead(416,{'Content-Range':'bytes */'+stat.size});res.end();return;}code=206;headers['Content-Range']='bytes '+start+'-'+end+'/'+stat.size;}
 headers['Content-Length']=end-start+1;res.writeHead(code,headers);if(req.method==='HEAD')res.end();else{const stream=fs.createReadStream(file,{start,end});stream.on('error',()=>res.destroy());stream.pipe(res);}
 }catch(e){if(!res.headersSent)json(res,400,{error:e.message});else res.end();}
});
setInterval(()=>{const before=state.people.length;prune(state);if(before!==state.people.length)save();send();},3000).unref();
async function probe(name){return new Promise(resolve=>{const child=spawn(tool(name),[name==='yt-dlp'?'--version':'-version'],{windowsHide:true,shell:false});const timer=setTimeout(()=>{child.kill();resolve(false);},30000);child.on('error',()=>{clearTimeout(timer);resolve(false);});child.on('close',code=>{clearTimeout(timer);resolve(code===0);});});}
Promise.all([probe('yt-dlp'),probe('ffmpeg'),probe('ffprobe')]).then(found=>{audioReady=found.every(Boolean);send();});
const port=Number(process.env.PORT)||3000;server.listen(port,'127.0.0.1',()=>console.log('RODA LIVE · http://localhost:'+port+' · Cena: /overlay.html'));