import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd(),out=path.join(root,'verificacao');fs.mkdirSync(out,{recursive:true});
const browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless=new','--disable-gpu','--autoplay-policy=no-user-gesture-required','--no-first-run','--no-default-browser-check','--remote-debugging-port=9333','--remote-allow-origins=http://localhost:9333','--user-data-dir='+path.join(root,'tools/qa-edge'),'about:blank'],{windowsHide:true,stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ws;
try{
 let targets;for(let i=0;i<60;i++){try{targets=await(await fetch('http://localhost:9333/json')).json();if(targets.length)break;}catch{}await sleep(300);}
 assert.ok(targets?.length,'Edge não iniciou');
 ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
 let id=0;const pending=new Map(),errors=[];ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(Error(m.error.message));else p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text+': '+m.params.exceptionDetails.exception?.description);};
 const cdp=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
 async function evaluate(expression){const r=await cdp('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
 await cdp('Runtime.enable');await cdp('Page.enable');await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
 await cdp('Page.navigate',{url:'http://localhost:3000'});await sleep(2000);
 assert.equal(await evaluate('document.title'),'Roda Live · Central de controle');
 assert.equal(await evaluate("document.querySelectorAll('#giftButtons button').length"),6);
 await evaluate("document.getElementById('testUser').value='Marina';document.querySelector('#giftButtons button').click()");await sleep(400);
 let state=await(await fetch('http://localhost:3000/api/state')).json();assert.equal(state.people.length,1);assert.equal(state.people[0].name,'Marina');
 await evaluate("document.getElementById('testComment').value='Essa roda está boa demais!';document.getElementById('commentForm').requestSubmit()");await sleep(400);
 state=await(await fetch('http://localhost:3000/api/state')).json();assert.ok(state.people[0].comment.includes('roda'));
 await evaluate("document.querySelectorAll('#giftButtons button')[2].click()");await sleep(350);state=await(await fetch('http://localhost:3000/api/state')).json();assert.equal(state.people[0].effect,'jump');
 const shot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(out,'painel.png'),Buffer.from(shot.data,'base64'));
 await cdp('Emulation.setDeviceMetricsOverride',{width:540,height:960,deviceScaleFactor:1,mobile:false});
 await cdp('Page.navigate',{url:'http://localhost:3000/overlay.html'});await sleep(1200);
 assert.equal(await evaluate("document.querySelector('canvas').width"),540);
 const scene=await cdp('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,'cena.png'),Buffer.from(scene.data,'base64'));
 if(state.music.file){await sleep(1300);assert.ok(await evaluate('document.getElementById("audio").duration > 0'), 'MP3 deve carregar');assert.equal(await evaluate('document.getElementById("audio").paused'),false,'MP3 deve tocar');console.log('PASS: reprodução MP3 real no navegador');}
 assert.equal(errors.length,0,errors.join('\n'));
 // Reject cross-origin writes and downloader URLs outside YouTube.
 let response=await fetch('http://localhost:3000/api/download',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:'https://example.com/a'})});assert.equal(response.status,400);
 response=await fetch('http://localhost:3000/api/clear',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://example.com'},body:'{}'});assert.equal(response.status,403);
 console.log('PASS: painel, botões, rosa, comentário, reação GG, Canvas, origem e URLs. Nenhum erro JavaScript.');
 fs.writeFileSync(path.join(out,'resultado.txt'),'PASS: painel, rosa, comentário, GG, Canvas, origem e validação de URL. Zero erros JavaScript.\n');
 await fetch('http://localhost:3000/api/clear',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
 await cdp('Browser.close');
}catch(e){console.error(e);process.exitCode=1;}finally{ws?.close();browser.kill();}