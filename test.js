import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,gift,comment,prune,settings,upgradeState} from './wheel.js';
import {placeProjectedBubble,overlaps} from './public/layout.js';
import {videoURL,downloadArgs} from './media.js';
import {activate,control} from './music.js';
import {CameraDirector, CAMERA_TIMING, roseNotice} from './public/camera-director.js';
test('rosa entra e renova sem duplicar personagem',()=>{const s=fresh();gift(s,{uniqueId:'ana',nickname:'Ana',giftName:'Rose'},1000);gift(s,{uniqueId:'ana',nickname:'Ana',giftName:'Rosa',repeatCount:3},2000);assert.equal(s.people.length,1);assert.equal(s.people[0].roses,4);assert.equal(s.people[0].expires,902000);assert.equal(s.roses,4);});
test('combo conta somente no encerramento',()=>{const s=fresh();assert.equal(gift(s,{uniqueId:'a',giftName:'Rose',giftType:1,repeatCount:2,repeatEnd:false}),null);gift(s,{user:{uniqueId:'a',nickname:'A'},giftName:'Rose',giftType:1,repeatCount:3,repeatEnd:true});assert.equal(s.roses,3);});
test('comentário exige participante ativo',()=>{const s=fresh();assert.equal(comment(s,{uniqueId:'a',comment:'oi'},100),false);gift(s,{uniqueId:'a',giftName:'Rose'},100);assert.equal(comment(s,{uniqueId:'a',comment:'oi'},200),true);assert.equal(s.people[0].commentUntil,7200);prune(s,1000000);assert.equal(s.people.length,0);});
test('efeitos não criam vagas e GG faz pular',()=>{const s=fresh();gift(s,{uniqueId:'a',giftName:'Galaxy'},100);assert.equal(s.people.length,0);gift(s,{uniqueId:'a',giftName:'Rose'},200);gift(s,{uniqueId:'a',giftName:'GG'},300);assert.equal(s.people[0].effect,'jump');});
test('capacidade e valores inválidos',()=>{const s=fresh();s.settings.capacity=4;for(let i=0;i<6;i++)gift(s,{uniqueId:String(i),giftName:'Rose'});assert.equal(s.people.length,4);assert.equal(settings({capacity:900},s.settings).capacity,48);assert.throws(()=>settings({speed:'abc'},s.settings));});
test('bolhas projetadas respeitam corpos, outras bolhas e os limites da janela',()=>{
 for(const width of [360,540,1080,1920]){
  const obstacles=[{x:width*.3,y:400,w:80,h:160},{x:width*.55,y:300,w:80,h:160}];
  const placed=[], bounds={width,minY:100,maxY:700};
  for(const anchor of [{x:width*.4,y:400},{x:width*.6,y:300}]){
   const box=placeProjectedBubble(anchor,Math.min(180,width*.4),65,obstacles,placed,bounds);
   assert.ok(box);assert.ok(box.y>=100);assert.ok(box.x>=10);assert.ok(box.x+box.w<=width-10);
   assert.ok(obstacles.every(o=>!overlaps(box,o)));assert.ok(placed.every(o=>!overlaps(box,o)));placed.push(box);
  }
 }
 assert.equal(placeProjectedBubble({x:200,y:300},180,100,[{x:0,y:0,w:500,h:500}],[],{width:500,minY:100,maxY:500}),null);
});
test('combo no formato nativo do conector 2.5 não duplica rosas',()=>{const s=fresh();const e={user:{uniqueId:'bia',nickname:'Bia'},giftId:5655,giftDetails:{giftName:'Rose',giftType:1},repeatCount:2,repeatEnd:false};assert.equal(gift(s,e),null);gift(s,{...e,repeatEnd:true});assert.equal(s.roses,2);assert.equal(s.people.length,1);});

test('downloader aceita diferentes sites e rejeita comandos ou protocolos locais',()=>{
 for(const link of ['https://www.youtube.com/watch?v=abc','https://vimeo.com/123','https://www.tiktok.com/@teste/video/123','https://media.w3.org/video.mp4'])assert.equal(videoURL(link),link);
 for(const link of ['--exec calc','file:///C:/Windows/win.ini','javascript:alert(1)','https://user:password@example.com/video','http://127.0.0.1/a'])assert.throws(()=>videoURL(link));
 const url='https://example.com/watch?v=123&x=456';const args=downloadArgs(url,process.cwd(),process.cwd());
 assert.equal(args.at(-2),'--');assert.equal(args.at(-1),url);assert.ok(args.includes('bestaudio/best'));assert.ok(args.includes('mp3'));
});

test('download pronto substitui a faixa e inicia automaticamente, mantendo volume',()=>{
 const m=fresh().music;m.volume=.3;activate(m,'nova.mp3',1000);
 assert.equal(m.playing,true);assert.equal(m.file,'nova.mp3');assert.equal(m.position,0);assert.equal(m.volume,.3);
 const revision=m.revision;activate(m,'nova.mp3',2000);
 control(m,{action:'ended',file:'nova.mp3',revision},2100);assert.equal(m.playing,true);
 control(m,{action:'ended',file:'nova.mp3',revision:m.revision},2200);assert.equal(m.playing,false);
});

test('controles respeitam duração e comandos inválidos não alteram a faixa',()=>{
 const m=fresh().music;activate(m,'musica.mp3',1000);
 control(m,{action:'metadata',file:m.file,revision:m.revision,value:20},2000);
 control(m,{action:'seek',value:999},2000);assert.equal(m.position,20);
 control(m,{action:'pause'},2000);const snapshot=structuredClone(m);
 assert.throws(()=>control(m,{action:'volume',value:'abc'},3000));assert.deepEqual(m,snapshot);
});

test('câmera alterna visão geral e personagens aleatórios sem repetir imediatamente',()=>{
 const camera=new CameraDirector(0,()=>0),ids=['ana','bia'];
 assert.equal(camera.update(7999,ids).mode,'overview');
 assert.equal(camera.update(8000,ids).targetId,'ana');
 assert.equal(camera.update(8000+CAMERA_TIMING.random,ids).mode,'overview');
 assert.equal(camera.update(12500+CAMERA_TIMING.overview,ids).targetId,'bia');
});

test('rosa interrompe destaque aleatório e cede lugar à visão geral ao terminar',()=>{
 const camera=new CameraDirector(0,()=>0),ids=['ana','bia'];camera.update(8000,ids);
 camera.rose({person:'bia',name:'Bia',entered:true},8100);
 const close=camera.update(8100,ids);assert.equal(close.reason,'rose');assert.equal(close.targetId,'bia');
 assert.equal(roseNotice(close.event),'🌹 Bia entrou na roda!');
 assert.equal(camera.update(13100,ids).mode,'overview');
 assert.equal(camera.update(14000,ids).mode,'overview');
});

test('rosas de pessoas diferentes ganham destaque em ordem, com zoomout entre elas',()=>{
 const camera=new CameraDirector(0),ids=['ana','bia'];
 camera.rose({person:'ana',name:'Ana',entered:true},100);camera.update(100,ids);
 camera.rose({person:'bia',name:'Bia',entered:true},200);
 camera.rose({person:'bia',name:'Bia',entered:false},300);
 assert.equal(camera.queue.length,1);assert.equal(camera.update(300,ids).targetId,'ana');
 assert.equal(camera.update(5100,ids).mode,'overview');
 assert.equal(camera.update(7599,ids).mode,'overview');
 const next=camera.update(7600,ids);assert.equal(next.targetId,'bia');assert.equal(next.event.entered,true);
});

test('combo de rosas não prende a câmera para sempre e alvos removidos são descartados',()=>{
 const camera=new CameraDirector(0),ids=['ana','bia'];camera.rose({person:'ana'},100);camera.update(100,ids);
 for(let now=1000;now<8000;now+=1000)camera.rose({person:'ana'},now);
 assert.equal(camera.update(8100,ids).mode,'overview');
 camera.rose({person:'bia'},8200);assert.equal(camera.update(11000,['ana']).targetId,null);
 const focus=new CameraDirector(0);focus.rose({person:'ana'},0);focus.update(0,ids);
 assert.equal(focus.update(100,['bia']).mode,'overview');
 assert.equal(new CameraDirector(0).update(9000,[]).mode,'overview');
});

test('evento de rosa distingue entrada e renovação para o aviso e para a câmera',()=>{
 const s=fresh(),first=gift(s,{uniqueId:'ana',nickname:'Ana',giftName:'Rose'},100);
 const renewal=gift(s,{uniqueId:'ana',nickname:'Ana',giftName:'Rose'},200);
 assert.equal(first.entered,true);assert.match(first.message,/entrou na roda/);
 assert.equal(renewal.entered,false);assert.match(roseNotice(renewal),/mandou rosas/);
});

test('primeira rosa interrompe o close de demonstração sem esperar outro ciclo',()=>{
 const camera=new CameraDirector(0,()=>0);camera.update(8000,['demo']);
 camera.rose({person:'ana',name:'Ana',entered:true},8100);
 const shot=camera.update(8100,['ana']);assert.equal(shot.targetId,'ana');assert.equal(shot.reason,'rose');
});

test('Anel cria noivo direto, protege permanência e substitui o anterior',()=>{
 const s=fresh();gift(s,{uniqueId:'ana',giftName:'Anel'},100);
 assert.equal(s.couple.groomId,'ana');assert.equal(s.people.length,1);
 prune(s,10000000);assert.equal(s.people.length,1);
 assert.equal(comment(s,{uniqueId:'ana',comment:'casei'},10000000),true);
 gift(s,{uniqueId:'bia',giftName:'Ring'},10000001);
 assert.equal(s.couple.groomId,'bia');assert.equal(s.people.length,2);
 gift(s,{uniqueId:'bia',giftName:'Ring'},10000002);assert.equal(s.people.length,2);
 prune(s,20000000);assert.deepEqual(s.people.map(p=>p.id),['bia']);
});

test('casamento funciona com a roda cheia sem crescimento ilimitado',()=>{
 const s=fresh();s.settings.capacity=4;
 for(let i=0;i<4;i++)gift(s,{uniqueId:String(i),giftName:'Rose'},100);
 for(let i=0;i<20;i++){gift(s,{uniqueId:'noivo'+i,giftName:'Ring'},200+i);assert.equal(s.people.length,5);}
 assert.equal(s.couple.groomId,'noivo19');
});

test('migração adiciona casamento sem apagar o mapa de presentes existente',()=>{
 const s=fresh();delete s.schemaVersion;delete s.couple;s.settings.rules=s.settings.rules.filter(r=>r.effect!=='marry');s.settings.rules[0].ids='42';
 upgradeState(s);upgradeState(s);assert.equal(s.settings.rules.filter(r=>r.effect==='marry').length,1);assert.equal(s.settings.rules[0].ids,'42');
});

test('noivo novo tem prioridade imediata e os presentes recentes passam na frente',()=>{
 const d=new CameraDirector(0,()=>0),ids=['antigo','novo','noivo'];
 d.rose({person:'antigo'},1);d.rose({person:'novo'},2);
 assert.equal(d.update(2,ids).targetId,'novo');
 d.marry({person:'noivo',name:'Noivo'},3);
 const shot=d.update(3,ids,{groomId:'noivo',recentIds:['novo','antigo']});assert.equal(shot.reason,'marry');assert.equal(shot.targetId,'noivo');
 const background=new CameraDirector(0,()=>0);const context={groomId:'noivo',recentIds:['novo','antigo']};
 assert.equal(background.update(8000,ids,context).targetId,'noivo');
 background.update(13000,ids,context);assert.equal(background.update(21000,ids,context).targetId,'novo');
});
