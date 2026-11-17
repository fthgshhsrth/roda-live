import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd(),out=path.join(root,'verificacao');fs.mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const api=async(endpoint,data={})=>{const r=await fetch('http://localhost:3000/api/'+endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});assert.ok(r.ok,await r.text());};
const snapshot=async()=>await(await fetch('http://localhost:3000/api/state')).json();
let ws,cdp,evaluate;const errors=[],report={};
const initial=await snapshot();
assert.notEqual(initial.status.phase,'online','Execute QA antes de conectar a live real');
assert.equal(initial.people.length,0,'O teste requer uma sessão sem participantes');
const browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',[
 '--headless=new','--mute-audio','--use-angle=swiftshader','--enable-unsafe-swiftshader',
 '--autoplay-policy=no-user-gesture-required','--no-first-run','--no-default-browser-check',
 '--remote-debugging-port=9333','--user-data-dir='+path.join(root,'tools/qa-edge-3d'),'about:blank'
],{windowsHide:true,stdio:'ignore'});
try{
 let targets;for(let i=0;i<80;i++){try{targets=await(await fetch('http://localhost:9333/json')).json();if(targets.length)break;}catch{}await sleep(300);}
 assert.ok(targets?.length,'Edge não iniciou');
 ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
 let id=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);};
 cdp=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.has(n)){pending.delete(n);reject(Error('CDP timeout: '+method));}},45000).unref();});
 evaluate=async expression=>{const r=await cdp('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 async function until(expression,timeout=30000){const start=Date.now();while(Date.now()-start<timeout){if(await evaluate(expression))return;await sleep(200);}throw Error('Condição não satisfeita: '+expression+'\n'+errors.join('\n'));}
 async function screenshot(name){const s=await cdp('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,name),Buffer.from(s.data,'base64'));}
 await cdp('Runtime.enable');await cdp('Page.enable');await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
 await cdp('Page.navigate',{url:'http://localhost:3000'});
 await until("document.querySelectorAll('#giftButtons button').length===6");
 assert.equal(await evaluate("document.querySelector('#library')"),null);
 assert.equal(await evaluate('document.title'),'Roda Live · Estúdio 3D');
 await evaluate("document.getElementById('testUser').value='Marina';document.querySelector('#giftButtons button').click()");
 await until("document.querySelector('#peopleCount').textContent.includes('1')");
 await evaluate("document.getElementById('testComment').value='Essa pista é nossa!';document.getElementById('commentForm').requestSubmit()");
 await sleep(300);
 assert.equal((await snapshot()).people[0].comment,'Essa pista é nossa!');
 await evaluate("document.querySelectorAll('#giftButtons button')[2].click()");await sleep(200);
 assert.equal((await snapshot()).people[0].effect,'jump');report.panel='PASS';console.log('PASS: painel e presentes');
 await screenshot('painel-3d.png');
 await cdp('Emulation.setDeviceMetricsOverride',{width:720,height:1280,deviceScaleFactor:1,mobile:false});
 await cdp('Page.navigate',{url:'http://localhost:3000/overlay.html?window=1'});
 await until("window.roda3D?.diagnostics().frames>3",45000);
 assert.equal(await evaluate("window.roda3D.renderer.getContext() instanceof WebGL2RenderingContext"),true);
 const before=await evaluate("window.roda3D.diagnostics().frames");await sleep(500);
 assert.ok(await evaluate('window.roda3D.diagnostics().frames')>before);
 const rotation=await evaluate("[...window.roda3D.characters.values()][0].model.dancer.rotation.z");await sleep(250);
 assert.notEqual(await evaluate("[...window.roda3D.characters.values()][0].model.dancer.rotation.z"),rotation);
 report.webgl='PASS';report.animation='PASS';
 for(const name of ['DJ Casquinha','Dona Antena','MC Crocante','Brilhosa','Patinhas','Rainha','Zé do Passinho'])await api('simulate',{user:name,giftName:'Rose'});
 await until("window.roda3D.characters.size===8",30000);await sleep(1000);
 const variants=await evaluate("[...new Set([...window.roda3D.characters.values()].map(c=>c.model.variant))].length");
 assert.ok(variants>=3);report.characterVariants=variants;
 await api('simulate',{kind:'comment',user:'DJ Casquinha',comment:'Olha o passinho!'});
 await api('simulate',{kind:'comment',user:'Dona Antena',comment:'Cheguei na pista 🪳'});
 await sleep(500);
 await until('window.roda3D.diagnostics().bubbles.length>0',5000);const diag=await evaluate('window.roda3D.diagnostics()');assert.equal(diag.bubbleOverlap,false);
 await screenshot('baratas-vertical.png');console.log('PASS: WebGL2, dança, variações e comentários sem sobreposição');
 await cdp('Emulation.setDeviceMetricsOverride',{width:1920,height:1080,deviceScaleFactor:1,mobile:false});await sleep(800);
 assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
 assert.equal(await evaluate('window.roda3D.diagnostics().bubbleOverlap'),false);await screenshot('baratas-horizontal.png');report.windowLayouts='PASS';
 // Real download from a direct MP4 URL on a second site, with automatic playback.
 const testURL=process.env.QA_VIDEO_URL||'https://media.w3.org/2010/05/bunny/trailer.mp4';
 const oldFiles=fs.readdirSync(path.join(root,'music'));
 console.log('Testando download e autoplay: '+testURL);await api('download',{url:testURL});
 let job;const started=Date.now();
 do{await sleep(1000);job=(await snapshot()).jobs[0];}while(job?.phase==='running'&&Date.now()-started<Number(process.env.QA_DOWNLOAD_TIMEOUT||600000));
 assert.equal(job?.phase,'done',job?.message);
 const playing=await snapshot();assert.equal(playing.music.file,job.file);assert.equal(playing.music.playing,true);
 await until("document.getElementById('audio').readyState>=2 && !document.getElementById('audio').paused",20000);
 assert.ok(await evaluate("document.getElementById('audio').duration")>0);
 report.download='PASS';report.autoPlay='PASS';report.duration=await evaluate("document.getElementById('audio').duration");
 await api('music',{action:'pause'});await until("document.getElementById('audio').paused");
 await api('music',{action:'play'});await until("!document.getElementById('audio').paused");report.controls='PASS';
 await api('music',{action:'stop'});
 if(!oldFiles.includes(job.file))fs.unlinkSync(path.join(root,'music',job.file));
 let r=await fetch('http://localhost:3000/api/download',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"url":"file:///C:/Windows/win.ini"}'});assert.equal(r.status,400);
 r=await fetch('http://localhost:3000/api/clear',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://example.com'},body:'{}'});assert.equal(r.status,403);
 assert.equal(errors.length,0,errors.join('\n'));report.javascriptErrors=errors.length;
 fs.writeFileSync(path.join(out,'resultado-3d.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 void cdp('Browser.close').catch(()=>{});
}catch(e){
 if(evaluate)try{console.log(JSON.stringify(await evaluate('({diagnostics:window.roda3D?.diagnostics(),hud:document.getElementById("sceneTitle")?.getBoundingClientRect().toJSON(),comments:[...window.roda3D?.characters?.values()||[]].map(e=>({name:e.person.name,until:e.person.commentUntil,anchor:e.anchor})),now:Date.now()})')));const s=await cdp('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,'erro-3d.png'),Buffer.from(s.data,'base64'));}catch{}
 console.error(e);process.exitCode=1;if(cdp)void cdp('Browser.close').catch(()=>{});
}
finally{ws?.close();browser.kill();await api('clear');await api('settings',initial.settings);}
