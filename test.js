import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,gift,comment,prune,settings,upgradeState,partyRole,clearParty,removePerson} from './wheel.js';
import {sceneCast,BAND,AMBIENT_GUEST_COUNT} from './public/party-layout.js';
import {CameraDirector} from './public/camera-director.js';
import {placeProjectedBubble,overlaps} from './public/layout.js';
import {videoURL,downloadArgs} from './media.js';
import {activate,control} from './music.js';
import {sanitizeGifts,resolveGiftCatalog,catalogRules} from './public/gift-catalog.js';
import {captureProfile} from './public/capture-profile.js';
import {DANCE_BPM,waltzPose,soloWeddingPose} from './public/waltz.js';
import {SpiralLayout,SPIRAL_SPACING} from './public/spiral-layout.js';
import http from 'node:http';
import {createOverlayGateway} from './source-link.js';
const send=(s,id,name,coins,now=100,extra={})=>gift(s,{uniqueId:id,nickname:id,giftName:name,diamondCount:coins,...extra},now);
test('rosa unitária entra; combo de dez rosas não vira noiva',()=>{
 const s=fresh();send(s,'Ana','Rose',1);send(s,'Ana','Rose',1,200,{repeatCount:10});
 assert.equal(s.people.length,1);assert.equal(s.roses,11);assert.equal(s.couple.brideId,null);assert.equal(s.people[0].expires,900200);
});
test('rosa de dez moedas escolhe noiva sem colidir com rosa comum',()=>{
 const s=fresh();send(s,'Ana','Rosa',10);assert.equal(s.couple.brideId,'Ana');assert.equal(s.roses,0);
 assert.equal(send(s,'Bia','Rosa',99),null);assert.equal(send(s,'Bia','Rosa',undefined),null);
});
test('noivo usa mãos coração; o Anel antigo não concede papel',()=>{
 const s=fresh();send(s,'A','Mãos Fazendo Coração',5);assert.equal(s.couple.groomId,'A');
 assert.equal(send(s,'B','Anel',30),null);assert.equal(send(s,'B','Heart Me',1,200),null);
 assert.equal(send(s,'B','Hand Heart',100),null);assert.equal(send(s,'B','Mãos em Coração',100),null);assert.equal(send(s,'B','Heart Hands',5),null);
 send(s,'B','Finger Heart',5,300);assert.equal(s.couple.groomId,'B');assert.equal(partyRole(s,'A'),null);
});
test('cada doador tem um papel; noiva e noivo são disputados separadamente',()=>{
 const s=fresh();send(s,'A','Finger Heart',5);send(s,'B','Rosa',10);
 send(s,'C','Rosa',10,200);assert.equal(s.couple.groomId,'A');assert.equal(s.couple.brideId,'C');
 send(s,'A','Boné',99,300);assert.equal(s.couple.groomId,null);assert.equal(s.stage.djId,'A');
 send(s,'C','Rosquinha',30,400);assert.equal(s.couple.brideId,null);assert.equal(partyRole(s,'C').kind,'band');
});
test('banda tem cinco vagas e o sexto doador substitui a vaga mais antiga',()=>{
 const s=fresh();for(let i=0;i<5;i++)send(s,'B'+i,'Rosquinha',30,100+i);
 assert.deepEqual(s.stage.bandIds,['B0','B1','B2','B3','B4']);send(s,'B5','Donut',30,200);
 assert.deepEqual(s.stage.bandIds,['B5','B1','B2','B3','B4']);assert.equal(partyRole(s,'B0'),null);
 send(s,'B5','Donut',30,300);assert.equal(s.people.filter(p=>p.id==='B5').length,1);assert.equal(s.stage.bandIds.filter(x=>x==='B5').length,1);
});
test('papéis continuam após vencer o tempo normal; substituídos retornam à roda',()=>{
 const s=fresh();send(s,'N','Finger Heart',5);send(s,'V','Rose',10);send(s,'DJ','Cap',99);send(s,'M','Donut',30);send(s,'P','Rose',1);
 prune(s,10000000);assert.equal(s.people.length,4);assert.equal(comment(s,{uniqueId:'DJ',comment:'oi'},10000000),true);
 send(s,'DJ2','Cap',99,10000001);assert.equal(partyRole(s,'DJ'),null);prune(s,20000000);assert.ok(!s.people.find(p=>p.id==='DJ'));
});
test('entrada não tem limite fixo e substituir papéis não remove convidados',()=>{
 const s=fresh();s.settings.capacity=4;for(let i=0;i<1000;i++)send(s,'P'+i,'Rose',1);
 for(let i=0;i<15;i++)send(s,'D'+i,'Cap',99,200+i);
 assert.equal(s.people.length,1015);assert.equal(s.stage.djId,'D14');assert.equal(send(s,'extra','Rose',1)?.entered,true);
 assert.equal(settings({capacity:4},s.settings).capacity,0);upgradeState(s);assert.equal(s.settings.capacity,0);
});
test('combos incompletos e mensagens repetidas não reaplicam papéis',()=>{
 const s=fresh();assert.equal(send(s,'A','Donut',30,100,{giftType:1,repeatEnd:false,msgId:'x'})?.effect,'band');
 assert.equal(send(s,'A','Donut',30,200,{giftType:1,repeatEnd:true,msgId:'x'}),null);assert.equal(s.stage.bandIds[0],'A');
 assert.equal(send(s,'A','Donut',30,300,{giftType:1,repeatEnd:true,msgId:'x'}),null);
});

test('primeira rosa aparece imediatamente e progresso conta somente o incremento',()=>{
 const s=fresh(),event={uniqueId:'R',giftName:'Rose',diamondCount:1,giftType:1,groupId:'combo1',common:{msgId:'same'}};
 const first=gift(s,{...event,repeatCount:1,repeatEnd:false},100);assert.equal(first.entered,true);assert.equal(s.roses,1);
 const progress=gift(s,{...event,repeatCount:5,repeatEnd:false},110);assert.equal(progress.id,first.id);assert.equal(progress.progress,true);
 assert.equal(gift(s,{...event,repeatCount:5,repeatEnd:true},120),null);assert.equal(s.roses,5);assert.equal(s.log.length,1);
 gift(s,{...event,groupId:'combo2',common:{msgId:'next'},repeatCount:2,repeatEnd:true},130);assert.equal(s.roses,7);
 assert.equal(gift(s,{...event,repeatCount:1,repeatEnd:false},140),null);assert.equal(s.roses,7);
 const fallback={...event,groupId:undefined};gift(s,{...fallback,common:{msgId:'final1'},repeatCount:1,repeatEnd:true},150);
 gift(s,{...fallback,common:{msgId:'final2'},repeatCount:1,repeatEnd:true},160);assert.equal(s.roses,9);
});

test('progresso de combo não reinicia a festa nem substitui a banda novamente',()=>{
 const s=fresh();const e={uniqueId:'B',giftName:'Donut',diamondCount:30,giftType:1,groupId:100};
 gift(s,{...e,repeatCount:1},100);send(s,'C','Donut',30,110);
 gift(s,{...e,repeatCount:3,repeatEnd:true},120);assert.deepEqual(s.stage.bandIds.slice(0,2),['B','C']);assert.equal(s.log.length,2);
 const reset={uniqueId:'R',giftName:'Ray Serenade',diamondCount:2999,giftType:1,groupId:101};
 gift(s,{...reset,repeatCount:1},130);send(s,'new','Rose',1,140);
 gift(s,{...reset,repeatCount:3,repeatEnd:true},150);assert.equal(s.partyEpoch,1);assert.equal(s.people[0].id,'new');
});
test('serenata exige nome/ID correto e 2999 por unidade; reinicia toda a festa e áudio',()=>{
 const s=fresh();send(s,'N','Finger Heart',5);send(s,'V','Rose',10);send(s,'M','Donut',30);send(s,'D','Cap',99);
 activate(s.music,'teste.mp3',100);s.music.volume=.4;const epoch=s.partyEpoch;
 assert.equal(send(s,'X','Rose',2999),null);
 assert.equal(send(s,'X','Serenata de arraia',1,200,{repeatCount:2999}),null);
 assert.equal(send(s,'X','Serenata de arraia',undefined),null);
 send(s,'X','Serenata de arraiá',2999,300,{msgId:'reset'});
 assert.equal(s.people.length,0);assert.equal(s.couple.groomId,null);assert.equal(s.couple.brideId,null);assert.equal(s.stage.djId,null);assert.ok(s.stage.bandIds.every(x=>x===null));
 assert.equal(s.music.playing,false);assert.equal(s.music.file,null);assert.equal(s.music.volume,.4);assert.equal(s.partyEpoch,epoch+1);
 assert.equal(s.log[0].effect,'reset');assert.equal(send(s,'X','Serenata de arraiá',2999,400,{msgId:'reset'}),null);
});
test('migração instala mapa novo e mantém configurações; remover limpa o papel',()=>{
 const s=fresh();s.schemaVersion=3;s.settings.title='Meu palco';s.settings.rules=[{effect:'marry',names:'Ring',ids:'42'}];
 upgradeState(s);upgradeState(s);assert.equal(s.settings.rules.length,6);assert.equal(s.settings.title,'Meu palco');
 send(s,'D','Cap',99);removePerson(s,'D');assert.equal(s.stage.djId,null);
 assert.throws(()=>settings({rules:[{effect:'reset',coins:99}]},s.settings));
});
test('cena contém cinco instrumentos, DJ e casal; nomes de doadores sem duplicatas',()=>{
 const s=fresh();assert.equal(sceneCast(s).length,8+AMBIENT_GUEST_COUNT);assert.equal(BAND.length,5);
 send(s,'A','Rose',1);send(s,'B','Donut',30);send(s,'C','Rose',10);send(s,'D','Cap',99);
 const cast=sceneCast(s);assert.equal(new Set(cast.map(p=>p.id)).size,cast.length);assert.equal(cast.filter(p=>p.stageRole==='band').length,5);
 assert.equal(cast.find(p=>p.id==='B').instrument,'accordion');assert.equal(cast.find(p=>p.id==='C').weddingRole,'bride');assert.equal(cast.find(p=>p.id==='D').instrument,'dj');
});
test('câmera prioriza noivo e papéis recentes, depois volta à visão geral',()=>{
 const d=new CameraDirector(0,()=>0),ids=['A','B','C'],ctx={groomId:'A',recentIds:['C','B','A'],roles:{A:'groom',B:'band',C:'dj'}};
 d.rose({person:'B'},1);d.rose({person:'C'},2);assert.equal(d.update(2,ids,ctx).targetId,'C');
 d.marry({person:'A',effect:'marry'},3);assert.equal(d.update(3,ids,ctx).reason,'marry');
 d.feature({person:'B',effect:'band',slot:0},4);assert.equal(d.update(4,ids,ctx).targetId,'B');
 assert.equal(d.update(6000,ids,ctx).mode,'overview');
});

test('câmera alterna zoom geral e aleatório e uma rosa interrompe qualquer foco',()=>{
 const d=new CameraDirector(0,()=>0),ids=['A','B','C'];
 assert.equal(d.update(2200,ids).targetId,'A');assert.equal(d.update(4700,ids).mode,'overview');
 assert.equal(d.update(7000,ids).targetId,'B');
 d.marry({person:'A'},7001);assert.equal(d.update(7001,ids).reason,'marry');
 d.rose({person:'C'},7002);assert.equal(d.update(7002,ids).targetId,'C');assert.equal(d.update(7002,ids).reason,'rose');
 d.rose({person:'B'},7003);assert.equal(d.update(7003,ids).targetId,'B');
 assert.equal(d.update(10000,ids).mode,'overview');assert.equal(d.update(12300,ids).mode,'focus');
});
test('bolhas respeitam corpos e limites em janelas diferentes',()=>{
 for(const width of [360,720,1920]){
  const bodies=[{x:width*.4,y:350,w:80,h:180}],bounds={width,minY:100,maxY:650};
  const box=placeProjectedBubble({x:width*.5,y:350},150,60,bodies,[],bounds);assert.ok(box);assert.ok(!overlaps({...box,x:box.x-4,y:box.y-4,w:box.w+8,h:box.h+8},bodies[0]));assert.ok(box.x>=10);
 }
});
test('downloader aceita vídeos HTTPS e não executa protocolos locais',()=>{
 for(const url of ['https://youtube.com/watch?v=a','https://media.w3.org/a.mp4'])assert.equal(videoURL(url),url);
 for(const url of ['file:///C:/a','javascript:alert(1)','--exec calc'])assert.throws(()=>videoURL(url));
 const args=downloadArgs('https://example.com/a',process.cwd(),process.cwd());assert.equal(args.at(-2),'--');
});
test('áudio protege contra eventos atrasados e controles inválidos',()=>{
 const m=fresh().music;activate(m,'a.mp3',100);const old=m.revision;activate(m,'b.mp3',200);
 control(m,{action:'ended',file:'a.mp3',revision:old},300);assert.equal(m.playing,true);
 control(m,{action:'pause'},400);const before=structuredClone(m);assert.throws(()=>control(m,{action:'volume',value:'x'},500));assert.deepEqual(m,before);
});
test('catálogo liga nome, imagem, ID e preço reais; não adivinha presentes pelo valor',()=>{
 const s=fresh(),gifts=sanitizeGifts([
  {id:5655,name:'Rose',diamond_count:1,image:{url_list:['https://example.com/rose.png']}},
  {id:400,name:'Heart Me',diamond_count:1},{id:401,name:'Finger Heart',diamond_count:5},
  {id:402,name:'Outro presente',diamond_count:10},{id:403,name:'Doughnut',diamond_count:30},
  {id:404,name:'Cap',diamond_count:99},{id:405,name:'Serenata da Arraia',diamond_count:2999},
  {id:406,name:'Inválido',diamond_count:30,image:'javascript:bad'}
 ]);
 const cards=resolveGiftCatalog(s.settings.rules,gifts,'ready'),bound=catalogRules(s.settings.rules,cards);
 assert.equal(cards.find(g=>g.effect==='marry').id,'401');assert.equal(cards.find(g=>g.effect==='bride').status,'unavailable');
 assert.equal(cards.find(g=>g.effect==='reset').name,'Serenata da Arraia');assert.equal(gifts.at(-1).image,'');
 assert.equal(gift(s,{uniqueId:'A',giftId:401,giftName:'nome localizado',diamondCount:5},100,bound)?.effect,'marry');
 assert.equal(gift(s,{uniqueId:'B',giftId:400,giftName:'Finger Heart',diamondCount:5},200,bound),null);
 assert.equal(gift(s,{uniqueId:'B',giftId:401,giftName:'Finger Heart',diamondCount:1},200,bound),null);
 assert.equal(cards[0].image,'https://example.com/rose.png');
});
test('catálogo ambíguo exige seleção por ID; offline não afirma confirmação',()=>{
 const s=fresh(),gifts=[{id:'1',name:'Rose',coins:1},{id:'2',name:'Rose',coins:1}];s.settings.rules[0].ids='';
 assert.equal(resolveGiftCatalog(s.settings.rules,gifts,'ready')[0].status,'ambiguous');
 s.settings.rules[0].ids='2';assert.equal(resolveGiftCatalog(s.settings.rules,gifts,'ready')[0].id,'2');
 assert.equal(resolveGiftCatalog(s.settings.rules,gifts,'offline')[0].status,'pending');
});
test('renderização prepara Full HD sem depender do DPI do monitor e limita buffers grandes',()=>{
 assert.equal(captureProfile(720,960).ratio,1.5);assert.equal(captureProfile(1080,1382).ratio,1);
 assert.equal(captureProfile(1280,720).ratio,1.5);assert.equal(captureProfile(720,960,{preview:true}).ratio,1);
 const huge=captureProfile(4000,6000,{dpr:3});assert.ok(huge.ratio*6000<=4096);
 assert.equal(captureProfile(720,960,{high:false}).fps,30);
});
test('passos individuais são rápidos e variam entre personagens',()=>{
 assert.equal(DANCE_BPM,144);assert.ok(Math.abs(waltzPose(0).rise-waltzPose(60/144).rise)<1e-10);
 assert.ok(waltzPose(.1).rise>waltzPose(0).rise);assert.notEqual(waltzPose(.1,1).step,waltzPose(.1,4).step);
});
test('noivos também dançam sozinhos e separados, sem segurar o parceiro',()=>{
 for(let t=0;t<30;t+=.125){
  const bride=soloWeddingPose(t,'bride'),groom=soloWeddingPose(t,'groom');
  assert.ok(Math.hypot(bride.x-groom.x,bride.z-groom.z)>2.5);
  assert.ok(Math.abs(bride.rotation)<.31&&Math.abs(groom.rotation)<.31);
  assert.ok(Math.abs(waltzPose(t+.001).rise-waltzPose(t).rise)<.001);
  assert.ok(Math.abs(waltzPose(t).step)<=.4);
 }
});
test('espiral cresce, preserva posições e mantém distância entre mil convidados',()=>{
 const layout=new SpiralLayout(),ids=Array.from({length:1000},(_,i)=>'P'+i);
 layout.sync(ids.slice(0,10));const radius=layout.radius,first=layout.position('P0',12);
 layout.sync(ids);assert.deepEqual(layout.position('P0',12),first);assert.ok(layout.radius>radius*5);
 for(const t of [0,12,80]){
  const points=ids.map(id=>layout.position(id,t));
  for(let i=0;i<points.length;i++){
   const p=points[i];assert.ok(Math.hypot(p.x-3.4,p.z+1.8)>2.4);
   for(let j=i+1;j<points.length;j++)assert.ok(Math.hypot(p.x-points[j].x,p.z-points[j].z)>=SPIRAL_SPACING-.001);
  }
 }
 layout.sync([...ids.slice(1),'new']);assert.deepEqual(layout.position('new',12),first);
 assert.equal(layout.slots.size,1000);
});
test('balões respeitam a lateral reservada ao catálogo',()=>{
 const bounds={width:1080,minX:10,maxX:800,minY:100,maxY:1800};
 const box=placeProjectedBubble({x:790,y:500},220,80,[],[],bounds);
 assert.ok(box&&box.x+box.w<=800);assert.equal(placeProjectedBubble({x:100,y:500},900,80,[],[],bounds),null);
});
test('ícones são os arquivos TikTok de cada presente, sem confundir as rosas ou arraias',()=>{
 const s=fresh(),cards=resolveGiftCatalog(s.settings.rules);
 assert.ok(cards.every(g=>g.image.startsWith('/gifts/')));
 assert.notEqual(cards.find(g=>g.effect==='join').image,cards.find(g=>g.effect==='bride').image);
 assert.equal(cards.find(g=>g.effect==='reset').image,'/gifts/ray-serenade.webp');
 assert.equal(cards.find(g=>g.effect==='marry').image,'/gifts/finger-heart.webp');
 assert.equal(cards.find(g=>g.effect==='marry').coins,5);
 assert.equal(send(s,'A','Ray Serenade',2999)?.effect,'reset');
 s.settings.rules[2].names='Item customizado';assert.equal(resolveGiftCatalog(s.settings.rules)[2].image,'');
});
test('eventos modernos leem extendedGiftInfo e reagem antes do fim do combo',()=>{
 const s=fresh(),event={user:{uniqueId:'actual-user',nickname:'Pessoa'},giftId:42,giftDetails:{giftType:1},extendedGiftInfo:{name:'Finger Heart',diamond_count:5},common:{msgId:'gift-1'},repeatCount:3};
 assert.equal(gift(s,{...event,repeatEnd:false},100)?.effect,'marry');
 assert.equal(gift(s,{...event,repeatEnd:true},200),null);
 assert.equal(s.couple.groomId,'actual-user');assert.equal(gift(s,{...event,repeatEnd:true},300),null);
 assert.equal(s.people[0].name,'Pessoa');
});
test('migração do noivo troca nome, preço e IDs antigos sem mudar os outros presentes',()=>{
 const s=fresh();s.schemaVersion=5;s.settings.rules[1]={...s.settings.rules[1],names:'Hand Heart,Mãos em coração',coins:100,ids:'401'};
 const others=s.settings.rules.filter(r=>r.effect!=='marry');upgradeState(s);upgradeState(s);
 const rule=s.settings.rules.find(r=>r.effect==='marry');assert.equal(rule.coins,5);assert.equal(rule.ids,'');assert.ok(!rule.names.includes('Hand Heart'));
 assert.deepEqual(s.settings.rules.filter(r=>r.effect!=='marry'),others);
 assert.equal(send(s,'wrong','Hand Heart',100),null);assert.equal(send(s,'right','Finger Heart',5)?.effect,'marry');
});
test('baratas de ambiente dão volume sem virar doadores, eventos ou participantes reais',()=>{
 const s=fresh(),empty=sceneCast(s),ambient=empty.filter(p=>p.ambient);
 assert.equal(ambient.length,AMBIENT_GUEST_COUNT);assert.ok(ambient.every(p=>!p.donor&&!p.name));assert.equal(s.people.length,0);
 send(s,'real','Rose',1);const full=sceneCast(s);assert.equal(full.filter(p=>p.ambient).length,AMBIENT_GUEST_COUNT-1);
 assert.equal(full.filter(p=>p.donor).length,1);assert.equal(s.people.length,1);
 for(let i=0;i<AMBIENT_GUEST_COUNT;i++)send(s,'p'+i,'Rose',1);
 assert.equal(sceneCast(s).filter(p=>p.ambient).length,0);
 clearParty(s);assert.equal(sceneCast(s).filter(p=>p.ambient).length,AMBIENT_GUEST_COUNT);
});
test('fonte HTTPS publica apenas a cena, protege os controles e filtra os dados privados',async()=>{
 const asset=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html'});res.end('overlay de teste');});
 await new Promise(r=>asset.listen(0,'127.0.0.1',r));
 const s={...fresh(),revision:0,serverTime:100,jobs:[{url:'privado'}],sourceLink:{url:'segredo'}},actions=[];
 const gateway=createOverlayGateway({token:'qa-token',assetPort:asset.address().port,getSnapshot:()=>s,onMusic:data=>actions.push(data.action)});
 gateway.setOrigin('https://source.example');await new Promise(r=>gateway.server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+gateway.server.address().port,headers={Cookie:'roda_view=qa-token'};
 try{
  assert.equal((await fetch(base+'/api/state')).status,403);
  const entry=await fetch(base+'/overlay/qa-token?jogo=festa');assert.equal(entry.status,200);assert.match(entry.headers.get('set-cookie'),/HttpOnly; Secure/);assert.equal(await entry.text(),'overlay de teste');
  const state=await(await fetch(base+'/api/state',{headers})).json();assert.equal(state.jobs,undefined);assert.equal(state.sourceLink,undefined);assert.equal(state.settings.rules,undefined);
  let received=false;const pending=fetch(base+'/api/state?after=0',{headers}).then(r=>r.json()).then(value=>{received=true;return value;});
  await new Promise(r=>setTimeout(r,30));assert.equal(received,false);
  s.revision=1;const start=performance.now();gateway.notify();assert.equal((await pending).revision,1);assert.ok(performance.now()-start<500);
  assert.equal((await fetch(base+'/spiral-layout.js',{headers})).status,200);
  for(const route of ['/','/index.html','/panel.js','/api/connect','/api/download','/events'])assert.equal((await fetch(base+route,{headers})).status,403,route);
  const post=(action,origin='https://source.example')=>fetch(base+'/api/music',{method:'POST',headers:{...headers,'Content-Type':'application/json',Origin:origin},body:JSON.stringify({action})});
  assert.equal((await post('stop')).status,403);assert.equal((await post('ended','https://other.example')).status,403);
  assert.equal((await post('ended')).status,200);assert.deepEqual(actions,['ended']);
 }finally{gateway.server.closeAllConnections();gateway.server.close();asset.closeAllConnections();asset.close();}
});
