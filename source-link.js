import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,createHash,timingSafeEqual} from 'node:crypto';
import {spawn} from 'node:child_process';

const here=fileURLToPath(import.meta.url);
const publicAssets=new Set(['overlay.html','overlay.css','overlay.js','scene3d.js','roach.js','instruments.js','layout.js',
 'camera-director.js','party-layout.js','backstage.js','capture-profile.js','gift-catalog.js','gift-artwork.js','waltz.js','wedding-decor.js','club-room.js'].map(p=>'/'+p));
export function overlaySnapshot(s){
 const {schemaVersion,partyEpoch,couple,stage,people,log,roses,music,track,giftCatalog,catalogStatus,serverTime}=s;
 const {title,subtitle,speed,comments,transparent}=s.settings;
 return {schemaVersion,partyEpoch,couple,stage,people,log,roses,track,giftCatalog,catalogStatus,serverTime,
  settings:{title,subtitle,speed,comments,transparent},music:{...music,queue:[]}};
}
const reply=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
const equal=(a,b)=>Buffer.byteLength(a)===Buffer.byteLength(b)&&timingSafeEqual(Buffer.from(a),Buffer.from(b));

// Only this gateway is published. The controller and downloader stay on loopback.
export function createOverlayGateway({token,assetPort,getSnapshot,onMusic}){
 let publicOrigin='';
 const server=http.createServer(async(req,res)=>{
  try{
   const url=new URL(req.url,'http://127.0.0.1'),p=url.pathname;
   if(p==='/health/'+token){reply(res,200,{ok:true});return;}
   const cookie=String(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('roda_view='))?.slice(10)||'';
   const entry=p==='/overlay/'+token;
   if(!entry&&!equal(cookie,token)){reply(res,403,{error:'Abra o link completo do overlay.'});return;}
   if(entry&&req.method==='GET')res.setHeader('Set-Cookie','roda_view='+token+'; HttpOnly; Secure; SameSite=None; Path=/');
   res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff');
   if(p==='/api/state'&&req.method==='GET'){reply(res,200,overlaySnapshot(getSnapshot()));return;}
   if(p==='/api/music'&&req.method==='POST'){
    if(req.headers.origin&&req.headers.origin!==publicOrigin){reply(res,403,{error:'Origem inválida'});return;}
    if(!req.headers['content-type']?.startsWith('application/json')){reply(res,415,{error:'Use JSON'});return;}
    let text='';for await(const chunk of req){text+=chunk;if(text.length>2048)throw Error('Requisição muito grande');}
    const data=JSON.parse(text||'{}');if(!['metadata','ended'].includes(data.action)){reply(res,403,{error:'Controle disponível apenas no painel local.'});return;}
    await onMusic(data);reply(res,200,{ok:true});return;
   }
   const currentMusic='/music/'+encodeURIComponent(getSnapshot().music.file||'');
   const allowed=entry||publicAssets.has(p)||/^\/gifts\/[a-z0-9-]+\.webp$/.test(p)||
    ['/vendor/three/three.module.js','/vendor/three/three.core.js'].includes(p)||p===currentMusic&&!!getSnapshot().music.file;
   if(!allowed||!['GET','HEAD'].includes(req.method)){reply(res,403,{error:'Rota indisponível no overlay.'});return;}
   const upstream=http.request({hostname:'127.0.0.1',port:assetPort,path:entry?'/overlay.html':p+url.search,method:req.method,
    headers:{host:'127.0.0.1:'+assetPort,...(req.headers.range?{range:req.headers.range}:{})}},response=>{
    res.writeHead(response.statusCode,response.headers);response.pipe(res);
   });
   upstream.on('error',()=>{if(!res.headersSent)reply(res,502,{error:'Servidor local indisponível'});else res.destroy();});
   req.on('aborted',()=>upstream.destroy());res.on('close',()=>upstream.destroy());upstream.end();
  }catch(e){if(!res.headersSent)reply(res,400,{error:e.message});else res.destroy();}
 });
 return {server,setOrigin(origin){publicOrigin=origin;}};
}

async function cloudflared(root){
 const exe=process.env.CLOUDFLARED_PATH||path.join(root,'tools',process.platform==='win32'?'cloudflared.exe':'cloudflared');
 if(fs.existsSync(exe))return exe;
 if(process.platform!=='win32')throw Error('Instale cloudflared e defina CLOUDFLARED_PATH.');
 const r=await fetch('https://github.com/cloudflare/cloudflared/releases/download/2026.11.1/cloudflared-windows-amd64.exe',{signal:AbortSignal.timeout(120000)});
 if(!r.ok)throw Error('Não foi possível baixar cloudflared.');
 const bytes=Buffer.from(await r.arrayBuffer());
 if(createHash('sha256').update(bytes).digest('hex')!=='341deda3db5ec498a0482254d6c38c0b7cf01a30c37bb5dd95d2216d08955e35')throw Error('Checksum do cloudflared inválido.');
 fs.mkdirSync(path.dirname(exe),{recursive:true});fs.writeFileSync(exe,bytes);return exe;
}

export function createPublicSource({root,assetPort,getSnapshot,onMusic,onChange=()=>{}}){
 let state={phase:'offline',url:null,message:'Link HTTPS desligado'},gateway,worker,starting;
 const status=()=>({...state});
 const change=next=>{state={...state,...next};onChange();};
 function stop(){
  if(worker){worker.stdin.end('stop\n');worker=null;}
  gateway?.server.closeAllConnections();gateway?.server.close();gateway=null;
  change({phase:'offline',url:null,message:'Link HTTPS desligado'});
 }
 async function start(){
  if(state.phase==='online')return status();if(starting)return starting;
  starting=(async()=>{
   change({phase:'starting',url:null,message:'Gerando link HTTPS…'});
   try{
    const binary=await cloudflared(root),token=randomBytes(24).toString('hex');
    gateway=createOverlayGateway({token,assetPort,getSnapshot,onMusic});
    await new Promise((resolve,reject)=>{gateway.server.once('error',reject);gateway.server.listen(0,'127.0.0.1',resolve);});
    const gatewayPort=gateway.server.address().port;
    const origin=await new Promise((resolve,reject)=>{
     const child=spawn(process.execPath,[here,'--tunnel-worker',binary,String(gatewayPort),token],{windowsHide:true,stdio:['pipe','pipe','pipe']});worker=child;
     child.stdin.on('error',()=>{});
     let tail='',ready=false;const timeout=setTimeout(()=>reject(Error('O serviço HTTPS demorou a responder. Tente novamente.')),90000);
     const read=chunk=>{tail=(tail+chunk.toString()).slice(-10000);const match=tail.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);if(match&&!ready){ready=true;clearTimeout(timeout);resolve(match[0]);}};
     child.stdout.on('data',read);child.stderr.on('data',read);
     child.on('error',e=>{clearTimeout(timeout);reject(e);});
     child.on('close',()=>{clearTimeout(timeout);if(!ready)reject(Error('Não foi possível abrir o link HTTPS. Verifique a conexão com a internet.'));else if(worker===child){worker=null;gateway?.server.close();gateway=null;change({phase:'offline',url:null,message:'Link encerrado. Gere um novo link no painel.'});}});
    });
    gateway.setOrigin(origin);
    change({message:'Validando o endereço HTTPS…'});
    let reachable=false;
    for(let i=0;i<12;i++){
     try{const r=await fetch(origin+'/health/'+token,{signal:AbortSignal.timeout(5000)});if(r.ok&&(await r.json()).ok){reachable=true;break;}}catch{}
     await new Promise(resolve=>setTimeout(resolve,750));
    }
    if(!reachable)throw Error('O endereço HTTPS não respondeu. Verifique a internet e gere outro link.');
    change({phase:'online',url:origin+'/overlay/'+token+'?jogo=festa&source=1&format=portrait',message:'Link HTTPS ativo. Válido enquanto o servidor estiver ligado.'});return status();
   }catch(e){stop();change({phase:'error',message:e.message});throw e;}
   finally{starting=null;}
  })();return starting;
 }
 process.once('exit',()=>worker?.stdin.end('stop\n'));
 return {start,stop,status};
}

if(process.argv[2]==='--tunnel-worker'){
 const [, , ,binary,port,token]=process.argv;
 const child=spawn(binary,['tunnel','--url','http://127.0.0.1:'+port,'--no-autoupdate','--protocol','http2'],{windowsHide:true,stdio:['ignore','pipe','pipe']});
 child.stdout.pipe(process.stdout);child.stderr.pipe(process.stdout);
 const stop=()=>{child.kill();process.exit(0);};
 process.stdin.on('data',stop);process.stdin.on('end',stop);process.stdin.resume();
 child.on('error',e=>{process.stderr.write(e.message);process.exit(1);});child.on('close',code=>process.exit(code||0));
 let misses=0;setInterval(async()=>{try{const r=await fetch('http://127.0.0.1:'+port+'/health/'+token,{signal:AbortSignal.timeout(2000)});if(!r.ok)throw Error();misses=0;}catch{if(++misses>=3)stop();}},3000).unref();
}
