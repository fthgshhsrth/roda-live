import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd(), sleep=ms=>new Promise(r=>setTimeout(r,ms));
const snapshot=async()=>await(await fetch('http://localhost:3011/api/state')).json();
const dataDir=path.join(root,'tools','qa-party-data-'+Date.now());
const server=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,PORT:'3011',RODA_DATA_DIR:dataDir},windowsHide:true,stdio:'ignore'});
let initial;for(let i=0;i<240;i++){try{initial=await snapshot();break;}catch{}await sleep(250);}
assert.ok(initial,'Servidor de teste não iniciou');
assert.notEqual(initial.status.phase,'online');assert.equal(initial.people.length,0,'Execute antes de iniciar a sessão real.');
const api=async(endpoint,body)=>{const r=await fetch('http://localhost:3011/api/'+endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.ok(r.ok,await r.text());};
const browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',[
 '--headless=new','--mute-audio','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-first-run',
 '--remote-debugging-port=9337','--user-data-dir='+path.join(root,'tools/qa-party'),'about:blank'
],{windowsHide:true,stdio:'ignore'});
let ws,cdp;const errors=[];
try{
 let targets;for(let i=0;i<70;i++){try{targets=await(await fetch('http://localhost:9337/json')).json();if(targets.length)break;}catch{}await sleep(300);}
 assert.ok(targets?.length,'Edge não iniciou');
 ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
 const pending=new Map();let id=0;
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(!p)return;pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);};
 cdp=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.has(n)){pending.delete(n);reject(Error('CDP timeout: '+method));}},30000).unref();});
 const evaluate=async expression=>{const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 async function until(expression,timeout=20000){const start=Date.now();while(Date.now()-start<timeout){if(await evaluate(expression))return;await sleep(100);}throw Error('Não confirmado: '+expression);}
 await cdp('Runtime.enable');await cdp('Page.enable');await cdp('Emulation.setDeviceMetricsOverride',{width:1080,height:1920,deviceScaleFactor:1,mobile:false});
 await cdp('Page.navigate',{url:'http://localhost:3011/overlay.html?quality=low'});
 await until('window.roda3D?.diagnostics().frames>2',40000);
 assert.equal(await evaluate("document.querySelectorAll('.gift-item').length"),6);
 assert.equal(await evaluate("[...window.roda3D.characters.values()].filter(e=>e.person.stageRole==='band').length"),5);
 assert.equal(await evaluate("[...window.roda3D.characters.values()].filter(e=>e.person.stageRole==='dj').length"),1);
 const give=(user,giftName,coins)=>api('simulate',{user,giftName,coins});
 await give('Visitante','Rose',1);await give('Noivo','Heart Hands',null);await give('Noiva','Rosa',10);
 const names=['Sanfoneiro','Vitrola','Baterista','Gaiteiro','Saxofonista'];
 for(const name of names)await give(name,'Rosquinha',30);
 await give('DJ da Festa','Boné',99);
 await until("window.roda3D.characters.get('DJ da Festa')?.model.instrument==='dj'",10000);
 const instruments=await evaluate("[...window.roda3D.characters.values()].filter(e=>e.person.stageRole==='band').map(e=>e.model.instrument).sort()");
 assert.deepEqual(instruments,['accordion','drums','gramophone','harmonica','saxophone']);
 assert.equal(await evaluate("window.roda3D.characters.get('Noiva').model.weddingRole"),'bride');
 assert.equal(await evaluate("window.roda3D.characters.get('Noivo').model.weddingRole"),'groom');
 assert.equal(await evaluate("document.querySelectorAll('.donor-name').length"),9);
 assert.ok(await evaluate('window.roda3D.diagnostics().visibleNames<=1'));
 await until("window.roda3D.diagnostics().camera.mode==='overview'&&window.roda3D.diagnostics().camera.distance>30",18000);
 await cdp('Page.reload');await until('window.roda3D?.diagnostics().frames>1',40000);
 fs.mkdirSync(path.join(root,'verificacao'),{recursive:true});
 const image=await cdp('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(root,'verificacao/festa-banda.png'),Buffer.from(image.data,'base64'));
 await api('simulate',{kind:'comment',user:'Visitante',comment:'Agora a festa está muito mais limpa!'});
 await until("window.roda3D.diagnostics().bubbles.length>0");
 assert.equal(await evaluate('window.roda3D.diagnostics().bubbleOverlap'),false);
 await cdp('Emulation.setDeviceMetricsOverride',{width:1920,height:1080,deviceScaleFactor:1,mobile:false});
 await sleep(500);
 assert.equal(await evaluate("document.querySelectorAll('.gift-item').length"),6);
 const horizontal=await cdp('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(root,'verificacao/overlay-horizontal.png'),Buffer.from(horizontal.data,'base64'));
 await give('Novo músico','Donut',30);await until("window.roda3D.characters.get('Novo músico')?.model.instrument==='accordion'");
 assert.equal(await evaluate("window.roda3D.characters.get('Sanfoneiro').person.stageResident||false"),false);
 await give('Novo DJ','Cap',99);await until("window.roda3D.characters.get('Novo DJ')?.model.instrument==='dj'");
 await give('Recomeço','Serenata de arraia',2999);
 await until("!document.getElementById('finale').hidden");
 const clean=await snapshot();assert.equal(clean.people.length,0);assert.ok(clean.stage.bandIds.every(id=>id===null));assert.equal(clean.stage.djId,null);assert.equal(clean.couple.brideId,null);assert.equal(clean.couple.groomId,null);assert.equal(clean.music.playing,false);
 await until("document.querySelectorAll('.donor-name').length===0");
 assert.equal(errors.length,0,errors.join('\n'));
 const report={band5:'PASS',instruments:'PASS',dj:'PASS',couple:'PASS',cleanNames:'PASS',catalog6:'PASS',portrait1080:'PASS',landscape1920:'PASS',commentsNoOverlap:'PASS',roleReplacement:'PASS',reset2999:'PASS',javascriptErrors:errors.length};
 fs.writeFileSync(path.join(root,'verificacao/resultado-festa.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}catch(e){console.error(e);process.exitCode=1;}
finally{if(ws?.readyState===1)ws.send(JSON.stringify({id:999999,method:'Browser.close'}));await api('clear',{});await sleep(100);ws?.close();browser.kill();server.kill();}
