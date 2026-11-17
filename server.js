import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {startDownload, executable as toolPath} from './media.js';
import {activate, control} from './music.js';
import {fresh,defaults,gift,comment,prune,settings,upgradeState,clearParty,removePerson} from './wheel.js';
const ROOT=path.dirname(fileURLToPath(import.meta.url)),PUB=path.join(ROOT,'public'),MUSIC=path.join(ROOT,'music'),DATA=process.env.RODA_DATA_DIR?path.resolve(process.env.RODA_DATA_DIR):path.join(ROOT,'data');
fs.mkdirSync(MUSIC,{recursive:true});fs.mkdirSync(DATA,{recursive:true});
const stateFile=path.join(DATA,'state.json');let state=fresh();try{const saved=JSON.parse(fs.readFileSync(stateFile));state={...state,...saved,settings:{...defaults,...saved.settings}};state.schemaVersion=saved.schemaVersion||0;state.music.playing=false;}catch{}
upgradeState(state);
let audioReady=false, activeDownload=null;
state.music.queue=[];state.music.revision=state.music.revision||0;state.music.duration=state.music.duration||0;
const clients=new Set();let live=null,epoch=0,status={phase:'offline',message:'Modo local · simulador disponível'},jobs=[];
function save(){fs.writeFileSync(stateFile,JSON.stringify(state,null,2));}
function currentTrack(){const file=state.music.file;return file?{file,title:file.replace(/\s*\[[^\]]+\]\.mp3$/,'').replace(/\.mp3$/,''),url:'/music/'+encodeURIComponent(file)}:null;}
function snapshot(){prune(state);return {...state,status,jobs,track:currentTrack(),serverTime:Date.now(),audioReady:!!audioReady};}
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
 conn.on('gift',e=>{if(ticket!==epoch)return;const ev=gift(state,{...e,giftName:e.giftName||e.giftDetails?.giftName||e.gift?.name});if(ev){if(ev.effect==='reset')activeDownload?.cancel();save();send();}});
 conn.on('chat',e=>{if(ticket===epoch&&comment(state,e))send();});
 conn.on('error',()=>{if(ticket===epoch)setStatus('error','Erro de conexão. Verifique a live e o provedor de assinatura.');});
 conn.on('disconnected',()=>{if(ticket===epoch)setStatus('offline','Conexão encerrada. Clique em Conectar para tentar novamente.');});
 conn.on('streamEnd',()=>{if(ticket===epoch)disconnect();});
 await conn.connect();if(ticket!==epoch){conn.disconnect();return;}setStatus('online','Ao vivo com @'+username);
 }catch(e){if(ticket===epoch)setStatus('error','Não foi possível conectar: '+String(e.message).slice(0,180));}
}
function tool(name){return toolPath(ROOT,name);}
function download(raw){
 if(activeDownload?.job.phase==='running')throw Error('Aguarde ou cancele o download atual.');
 const epoch=state.partyEpoch;
 activeDownload=startDownload(raw,{root:ROOT,musicDir:MUSIC,
 onUpdate:()=>send(),
 onComplete:file=>{if(epoch!==state.partyEpoch)return;activate(state.music,file);save();}});
 jobs.unshift(activeDownload.job);jobs=jobs.slice(0,8);send();
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
 case '/api/simulate':if(b.kind==='comment')comment(state,{uniqueId:b.user,nickname:b.user,comment:b.comment});else {const ev=gift(state,{uniqueId:b.user,nickname:b.user,giftName:b.giftName,giftId:b.giftId,diamondCount:b.coins,repeatCount:b.count,repeatEnd:true});if(ev?.effect==='reset')activeDownload?.cancel();}break;
 case '/api/settings':state.settings=settings(b,state.settings);break;
 case '/api/remove':removePerson(state,b.id);break;
 case '/api/clear':clearParty(state);activeDownload?.cancel();break;
 case '/api/download':download(String(b.url||''));break;
 case '/api/download/cancel':activeDownload?.cancel();break;
 case '/api/music':control(state.music,b);break;
 default:json(res,404,{error:'Endpoint desconhecido'});return;
 }save();send();json(res,200,{ok:true});return;}
 if(req.method!=='GET'&&req.method!=='HEAD'){json(res,405,{error:'Método inválido'});return;}
 if(url.pathname==='/api/state'){json(res,200,snapshot());return;}
 if(url.pathname==='/api/gifts'){
  if(!live)throw Error('Conecte uma live para carregar os presentes disponíveis.');
  const catalog=await live.fetchAvailableGifts();
  json(res,200,{gifts:catalog.map(g=>({id:String(g.id),name:g.name,coins:Number(g.diamond_count??g.diamondCount)}))});return;
 }
 if(url.pathname==='/events'){res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});res.write('data: '+JSON.stringify(snapshot())+'\n\n');clients.add(res);req.on('close',()=>clients.delete(res));return;}
 if(['/vendor/three/three.module.js','/vendor/three/three.core.js'].includes(url.pathname)){
 const vendor=path.join(ROOT,'node_modules','three','build',path.basename(url.pathname));
 if(!fs.existsSync(vendor)){json(res,503,{error:'Instale as dependências com npm ci.'});return;}
 res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'public, max-age=3600'});
 if(req.method==='HEAD')res.end();else fs.createReadStream(vendor).pipe(res);return;
 }
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
