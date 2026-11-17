import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,gift,comment,prune,settings,upgradeState,partyRole,clearParty,removePerson} from './wheel.js';
import {sceneCast,BAND} from './public/party-layout.js';
import {CameraDirector} from './public/camera-director.js';
import {placeProjectedBubble,overlaps} from './public/layout.js';
import {videoURL,downloadArgs} from './media.js';
import {activate,control} from './music.js';
import {sanitizeGifts,resolveGiftCatalog,catalogRules} from './public/gift-catalog.js';
import {captureProfile} from './public/capture-profile.js';
import {waltzPose,floorWaltzPosition} from './public/waltz.js';
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
 const s=fresh();send(s,'A','Mãos fazendo coração',null);assert.equal(s.couple.groomId,'A');
 assert.equal(send(s,'B','Anel',30),null);assert.equal(send(s,'B','Heart Me',1,200),null);
 send(s,'B','Hand Heart',100,300);assert.equal(s.couple.groomId,'B');assert.equal(partyRole(s,'A'),null);
});
test('cada doador tem um papel; noiva e noivo são disputados separadamente',()=>{
 const s=fresh();send(s,'A','Heart Hands',null);send(s,'B','Rosa',10);
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
 const s=fresh();send(s,'N','Heart Hands',null);send(s,'V','Rose',10);send(s,'DJ','Cap',99);send(s,'M','Donut',30);send(s,'P','Rose',1);
 prune(s,10000000);assert.equal(s.people.length,4);assert.equal(comment(s,{uniqueId:'DJ',comment:'oi'},10000000),true);
 send(s,'DJ2','Cap',99,10000001);assert.equal(partyRole(s,'DJ'),null);prune(s,20000000);assert.ok(!s.people.find(p=>p.id==='DJ'));
});
test('capacidade da roda não impede papéis e substituições permanecem limitadas',()=>{
 const s=fresh();s.settings.capacity=4;for(let i=0;i<4;i++)send(s,'P'+i,'Rose',1);
 for(let i=0;i<15;i++)send(s,'D'+i,'Cap',99,200+i);
 assert.equal(s.people.length,5);assert.equal(s.stage.djId,'D14');assert.equal(send(s,'extra','Rose',1),null);
});
test('combos incompletos e mensagens repetidas não reaplicam papéis',()=>{
 const s=fresh();assert.equal(send(s,'A','Donut',30,100,{giftType:1,repeatEnd:false,msgId:'x'}),null);
 send(s,'A','Donut',30,200,{giftType:1,repeatEnd:true,msgId:'x'});assert.equal(s.stage.bandIds[0],'A');
 assert.equal(send(s,'A','Donut',30,300,{giftType:1,repeatEnd:true,msgId:'x'}),null);
});
test('serenata exige nome/ID correto e 2999 por unidade; reinicia toda a festa e áudio',()=>{
 const s=fresh();send(s,'N','Heart Hands',null);send(s,'V','Rose',10);send(s,'M','Donut',30);send(s,'D','Cap',99);
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
 const s=fresh();assert.equal(sceneCast(s).length,8);assert.equal(BAND.length,5);
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
test('bolhas respeitam corpos e limites em janelas diferentes',()=>{
 for(const width of [360,720,1920]){
  const bodies=[{x:width*.4,y:350,w:80,h:180}],bounds={width,minY:100,maxY:650};
  const box=placeProjectedBubble({x:width*.5,y:350},150,60,bodies,[],bounds);assert.ok(box);assert.ok(!overlaps(box,bodies[0]));assert.ok(box.x>=10);
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
  {id:400,name:'Heart Me',diamond_count:1},{id:401,name:'Hand Heart',diamond_count:100},
  {id:402,name:'Outro presente',diamond_count:10},{id:403,name:'Doughnut',diamond_count:30},
  {id:404,name:'Cap',diamond_count:99},{id:405,name:'Serenata da Arraia',diamond_count:2999},
  {id:406,name:'Inválido',diamond_count:30,image:'javascript:bad'}
 ]);
 const cards=resolveGiftCatalog(s.settings.rules,gifts,'ready'),bound=catalogRules(s.settings.rules,cards);
 assert.equal(cards.find(g=>g.effect==='marry').id,'401');assert.equal(cards.find(g=>g.effect==='bride').status,'unavailable');
 assert.equal(cards.find(g=>g.effect==='reset').name,'Serenata da Arraia');assert.equal(gifts.at(-1).image,'');
 assert.equal(gift(s,{uniqueId:'A',giftId:401,giftName:'nome localizado',diamondCount:100},100,bound)?.effect,'marry');
 assert.equal(gift(s,{uniqueId:'B',giftId:400,giftName:'Hand Heart',diamondCount:100},200,bound),null);
 assert.equal(gift(s,{uniqueId:'B',giftId:401,giftName:'Hand Heart',diamondCount:1},200,bound),null);
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
test('valsa usa compasso comum de três tempos e mantém parceiros próximos',()=>{
 assert.ok(Math.abs(waltzPose(0).rise-waltzPose(2).rise)<1e-10);
 assert.ok(waltzPose(1).rise>waltzPose(0).rise);
 for(const t of [0,.5,1,2,10]){
  const a=floorWaltzPosition(0,8,4.7,t),b=floorWaltzPosition(1,8,4.7,t);
  assert.ok(Math.abs(Math.hypot(a.x-b.x,a.z-b.z)-1.16)<1e-10);
  assert.ok(Math.abs(Math.abs(a.rotation-b.rotation)-Math.PI)<1e-10);
 }
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
 assert.equal(send(s,'A','Ray Serenade',2999)?.effect,'reset');
 s.settings.rules[2].names='Item customizado';assert.equal(resolveGiftCatalog(s.settings.rules)[2].image,'');
});
