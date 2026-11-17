import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd(), sleep=ms=>new Promise(r=>setTimeout(r,ms));
const snapshot=async()=>await(await fetch('http://localhost:3000/api/state')).json();
const initial=await snapshot();
assert.notEqual(initial.status.phase,'online');assert.equal(initial.people.length,0,'Execute antes de iniciar a sessão real.');
const api=async(endpoint,body)=>{const r=await fetch('http://localhost:3000/api/'+endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.ok(r.ok,await r.text());};
const browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',[
 '--headless=new','--mute-audio','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-first-run',
 '--remote-debugging-port=9335','--user-data-dir='+path.join(root,'tools/qa-camera'),'about:blank'
],{windowsHide:true,stdio:'ignore'});
let ws,cdp;const errors=[];
try{
 let targets;for(let i=0;i<70;i++){try{targets=await(await fetch('http://localhost:9335/json')).json();if(targets.length)break;}catch{}await sleep(300);}
 assert.ok(targets?.length,'Edge não iniciou');
 ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
 const pending=new Map();let id=0;
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(!p)return;pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);};
 cdp=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.has(n)){pending.delete(n);reject(Error('CDP timeout: '+method));}},30000).unref();});
 const evaluate=async expression=>{const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 async function until(expression,timeout=20000){const start=Date.now();while(Date.now()-start<timeout){if(await evaluate(expression))return;await sleep(100);}throw Error('Não confirmado: '+expression);}
 await cdp('Runtime.enable');await cdp('Page.enable');await cdp('Emulation.setDeviceMetricsOverride',{width:720,height:1280,deviceScaleFactor:1,mobile:false});
 await cdp('Page.navigate',{url:'http://localhost:3000/overlay.html?quality=low'});
 await until('window.roda3D?.diagnostics().frames>2',40000);
 await until("window.roda3D.diagnostics().camera.reason==='random'",18000);
 await until('window.roda3D.diagnostics().camera.distance<12',5000);
 console.log('PASS: close aleatório');
 await api('simulate',{user:'Luna',giftName:'Rose'});
 await until("window.roda3D.diagnostics().camera.reason==='rose'&&window.roda3D.diagnostics().camera.targetId==='Luna'",6000);
 assert.match(await evaluate("document.getElementById('eventToast').textContent"),/Luna entrou na roda/);
 await until('window.roda3D.diagnostics().camera.distance<10',4000);
 await until('window.roda3D.diagnostics().camera.greeting');
 const firstWave=await evaluate("window.roda3D.characters.get('Luna').model.greetingArm.rotation.z");
 assert.ok(firstWave>.8,'A mão deve estar levantada');
 await until("Math.abs(window.roda3D.characters.get('Luna').model.greetingArm.rotation.z-"+firstWave+")>.04",2000);
 await until("document.getElementById('eventToast').classList.contains('visible')");
 fs.mkdirSync(path.join(root,'verificacao'),{recursive:true});
 const shot=await cdp('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(root,'verificacao/camera-rosa.png'),Buffer.from(shot.data,'base64'));
 assert.equal((await snapshot()).people.length,1);
 console.log('PASS: rosa assume a câmera, anuncia a entrada e o personagem acena');
 await until("window.roda3D.diagnostics().camera.mode==='overview'",8000);
 await until('window.roda3D.diagnostics().camera.distance>20',5000);
 console.log('PASS: zoomout restaura visão geral');
 await api('simulate',{user:'Luna',giftName:'Rose'});
 await until("window.roda3D.diagnostics().camera.reason==='rose'",5000);
 assert.match(await evaluate("document.getElementById('eventToast').textContent"),/Luna mandou rosas/);
 await sleep(100);assert.equal(await evaluate('window.roda3D.diagnostics().camera.greeting'),false);
 assert.equal((await snapshot()).people.length,1);
 await cdp('Emulation.setDeviceMetricsOverride',{width:1920,height:1080,deviceScaleFactor:1,mobile:false});await sleep(500);
 assert.equal(await evaluate('window.roda3D.diagnostics().bubbleOverlap'),false);
 assert.equal(errors.length,0,errors.join('\n'));
 fs.writeFileSync(path.join(root,'verificacao/resultado-camera.json'),JSON.stringify({randomClose:'PASS',rosePriority:'PASS',entryNotice:'PASS',entryWave:'PASS',overviewReturn:'PASS',renewal:'PASS',javascriptErrors:errors.length},null,2));
 console.log('PASS: renovação, redimensionamento e zero erros JavaScript');
}catch(e){console.error(e);process.exitCode=1;}
finally{if(ws?.readyState===1)ws.send(JSON.stringify({id:999999,method:'Browser.close'}));await api('clear',{});await sleep(100);ws?.close();browser.kill();}
