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
 '--remote-debugging-port=9336','--user-data-dir='+path.join(root,'tools/qa-wedding'),'about:blank'
],{windowsHide:true,stdio:'ignore'});
let ws,cdp;const errors=[];
try{
 let targets;for(let i=0;i<70;i++){try{targets=await(await fetch('http://localhost:9336/json')).json();if(targets.length)break;}catch{}await sleep(300);}
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
 assert.equal(await evaluate("[...window.roda3D.characters.values()].filter(e=>e.person.stageResident).length"),2);
 assert.equal(await evaluate("window.roda3D.characters.get('@couple:bride').model.weddingRole"),'bride');
 await api('simulate',{user:'Luna',giftName:'Anel'});
 await until("window.roda3D.diagnostics().camera.reason==='marry'&&window.roda3D.diagnostics().camera.targetId==='Luna'",6000);
 assert.equal((await snapshot()).couple.groomId,'Luna');
 assert.equal(await evaluate("window.roda3D.characters.get('Luna').person.stageResident"),true);
 assert.equal(await evaluate("window.roda3D.characters.get('Luna').model.weddingRole"),'groom');
 await until("Math.abs(window.roda3D.characters.get('Luna').model.root.position.x-.72)<.01");
 await api('simulate',{user:'Bia',giftName:'Ring'});
 await until("window.roda3D.diagnostics().camera.targetId==='Bia'",6000);
 assert.equal((await snapshot()).couple.groomId,'Bia');
 assert.equal(await evaluate("window.roda3D.characters.get('Luna').model.weddingRole"),null);
 assert.equal(await evaluate("window.roda3D.characters.get('Luna').person.stageResident||false"),false);
 assert.equal(await evaluate("window.roda3D.characters.get('Bia').model.weddingRole"),'groom');
 assert.match(await evaluate("document.getElementById('eventToast').textContent"),/Bia se casou/);
 await until("window.roda3D.diagnostics().camera.distance<9",5000);
 fs.mkdirSync(path.join(root,'verificacao'),{recursive:true});
 const picture=await cdp('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(root,'verificacao/casamento.png'),Buffer.from(picture.data,'base64'));
 await cdp('Page.reload',{ignoreCache:true});await until("window.roda3D?.characters.get('Bia')?.model.weddingRole==='groom'",30000);
 assert.equal(errors.length,0,errors.join('\n'));
 const report={couple3D:'PASS',ringGift:'PASS',groomReplacement:'PASS',cameraPriority:'PASS',reloadPersistence:'PASS',javascriptErrors:errors.length};
 fs.writeFileSync(path.join(root,'verificacao/resultado-casamento.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
}catch(e){console.error(e);process.exitCode=1;}
finally{if(ws?.readyState===1)ws.send(JSON.stringify({id:999999,method:'Browser.close'}));await api('clear',{});await sleep(100);ws?.close();browser.kill();}
