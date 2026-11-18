import {partyRole} from './public/party-layout.js';
export {partyRole};
export const rules=[
 {label:'Entrar · Rosa',icon:'🌹',names:'Rose,Rosa',ids:'5655',coins:1,effect:'join'},
 {label:'Noivo · Mãos Fazendo Coração',icon:'🫰',names:'Mãos Fazendo Coração,Finger Heart,Coração de Dedo',ids:'',coins:5,effect:'marry'},
 {label:'Noiva · Rosa 10',icon:'👰',names:'Rosa,Rose,Rosa de 10,Rosa 10',ids:'',coins:10,effect:'bride'},
 {label:'Banda · Rosquinha',icon:'🍩',names:'Rosquinha,Doughnut,Donut,Doughnuts',ids:'',coins:30,effect:'band'},
 {label:'DJ · Boné',icon:'🧢',names:'Boné,Cap,Baseball Cap',ids:'',coins:99,effect:'dj'},
 {label:'Reiniciar · Serenata',icon:'🎆',names:'Serenata da Arraia,Ray Serenade,Serenata de arraia,Serenata de arraiá,Serenata de arraial,Arraia Serenade,Arraiá Serenade',ids:'',coins:2999,effect:'reset'}
];
export const defaults={title:'A RODA É SUA',subtitle:'Mande uma rosa e entre na roda!',duration:15,speed:1,capacity:0,comments:true,transparent:false,rules};
const emptyCouple=()=>({groomId:null,brideId:null,since:null});
const emptyStage=()=>({djId:null,bandIds:[null,null,null,null,null],bandNext:0});
export function fresh(){return {schemaVersion:7,partyEpoch:0,couple:emptyCouple(),stage:emptyStage(),
 settings:structuredClone(defaults),people:[],log:[],roses:0,seenGiftIds:[],
 music:{file:null,playing:false,position:0,volume:.65,changed:Date.now(),revision:0,duration:0,queue:[]}};}
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function identity(e){const u=e.user||e;return {id:String(u.uniqueId||u.userId||'visitante').slice(0,100),name:String(u.nickname||u.uniqueId||'Visitante').slice(0,40)};}
export function giftPrice(e){const value=e.diamondCount??e.diamond_count??e.giftDetails?.diamondCount??e.giftDetails?.diamond_count??e.extendedGiftInfo?.diamond_count??e.extendedGiftInfo?.diamondCount??e.gift?.diamond_count??e.gift?.diamondCount;return value==null?null:Number(value);}
export function giftId(e){return e.giftId??e.giftDetails?.giftId??e.giftDetails?.gift_id??e.gift?.giftId??e.gift?.gift_id??null;}
export function giftName(e){return e.giftName||e.giftDetails?.giftName||e.giftDetails?.name||e.extendedGiftInfo?.name||e.gift?.name||e.gift?.giftName||'';}
export function matchGift(s,e,ruleSet=s.settings.rules){
 const name=norm(giftName(e)),price=giftPrice(e),id=giftId(e);
 const byId=ruleSet.filter(r=>String(r.ids||'').split(',').some(ruleId=>ruleId.trim()&&ruleId.trim()===String(id)));
 const byName=ruleSet.filter(r=>!r.catalogBound&&r.names.split(',').some(alias=>norm(alias)===name));
 const candidates=byId.length?byId:byName;
 const matching=candidates.filter(r=>r.coins==null||price===Number(r.coins));
 if(matching.length===1)return matching[0];
 // A configured ID can identify ordinary roles without price metadata. Reset always requires 2999.
 if(price==null&&byId.length===1&&byId[0].effect!=='reset'&&!byId[0].catalogBound)return byId[0];
 if(price==null&&candidates.length===1&&candidates[0].coins==null)return candidates[0];
 // Same names can represent different roses; filter by unit cost before ID fallback.
 if(price!=null&&byId.length&&!matching.length){const fallback=byName.filter(r=>r.coins==null||price===Number(r.coins));if(fallback.length===1)return fallback[0];}
 return null;
}
export function prune(s,now=Date.now()){s.people=s.people.filter(p=>partyRole(s,p.id)||p.expires>now);}
function release(s,id){if(s.couple.groomId===id)s.couple.groomId=null;if(s.couple.brideId===id)s.couple.brideId=null;if(s.stage.djId===id)s.stage.djId=null;s.stage.bandIds=s.stage.bandIds.map(value=>value===id?null:value);}
export function removePerson(s,id){release(s,id);s.people=s.people.filter(p=>p.id!==id);}
export function clearParty(s,now=Date.now()){
 s.people=[];s.log=[];s.roses=0;s.couple=emptyCouple();s.stage=emptyStage();s.partyEpoch=(s.partyEpoch||0)+1;
 s.music={...fresh().music,volume:s.music.volume,revision:(s.music.revision||0)+1,changed:now};
}
function returnToFloor(s,id,now){
 if(!id)return;const p=s.people.find(p=>p.id===id);if(!p)return;
 p.expires=now+s.settings.duration*60000;
}
const streaks=new WeakMap();
export function gift(s,e,now=Date.now(),ruleSet=s.settings.rules){
 const rule=matchGift(s,e,ruleSet);if(!rule)return null;
 const who=identity(e),total=Math.max(1,Math.min(10000,Math.trunc(Number(e.repeatCount??e.giftDetails?.repeatCount??e.gift?.repeatCount??e.gift?.repeat_count)||1)));
 const streak=Number(e.giftType??e.giftDetails?.giftType??e.gift?.giftType??e.gift?.gift_type)===1,end=!!(e.repeatEnd??e.giftDetails?.repeatEnd??e.gift?.repeatEnd??e.gift?.repeat_end);
 const rawId=e.common?.msgId??e.msgId??e.eventId;
 const messageId=rawId?(streak?rawId+':'+total+':'+end:String(rawId)):null;
 s.seenGiftIds??=[];if(messageId&&s.seenGiftIds.includes(String(messageId)))return null;
 if(messageId){s.seenGiftIds.push(String(messageId));s.seenGiftIds=s.seenGiftIds.slice(-512);}
 let count=total,record;
 if(streak){
  let cache=streaks.get(s);if(!cache){cache=new Map();streaks.set(s,cache);}
  for(const [key,value] of cache)if(now-value.at>120000)cache.delete(key);
  const group=e.groupId||e.giftDetails?.groupId||null,key=JSON.stringify([who.id,e.giftId||rule.effect,group??'']);
  record=cache.get(key);
  // A group identifies a whole combo; without it, a new partial starts the next one.
  if(!record||group==null&&(record.ended&&(!end||rawId&&rawId!==record.lastId||!rawId&&now-record.at>2000)||!end&&total<record.count&&now-record.at>2000)){
   record={count:0,ended:false,at:now,event:null};cache.set(key,record);
  }
  count=Math.max(0,total-record.count);record.count=Math.max(total,record.count);record.ended||=end;record.at=now;record.lastId=rawId;
  if(!count)return null;
  if(record.event){
   const person=s.people.find(p=>p.id===who.id);
   if(person){person.expires=now+s.settings.duration*60000;person.lastGiftAt=now;if(rule.effect==='join'){person.roses+=count;s.roses+=count;}}
   return {...record.event,progress:true};
  }
 }
 prune(s,now);
 let p=s.people.find(p=>p.id===who.id),entered=!p&&rule.effect==='join',slot=null;
 if(rule.effect==='reset')clearParty(s,now);
 else if(['join','marry','bride','band','dj'].includes(rule.effect)){
  if(!p){
   p={...who,joinedAt:now,color:Math.floor(Math.random()*360),roses:0};s.people.push(p);
  }
  p.name=who.name;p.expires=now+s.settings.duration*60000;
  if(rule.effect==='join'){s.roses+=count;p.roses+=count;}
  else {
   const current=partyRole(s,p.id);
   if(rule.effect==='band')slot=current?.kind==='band'?current.slot:s.stage.bandIds.indexOf(null);
   if(rule.effect==='band'&&slot<0)slot=s.stage.bandNext;
   const previous=rule.effect==='marry'?s.couple.groomId:rule.effect==='bride'?s.couple.brideId:rule.effect==='dj'?s.stage.djId:s.stage.bandIds[slot];
   release(s,p.id);
   if(rule.effect==='marry'){s.couple.groomId=p.id;s.couple.since=now;}
   if(rule.effect==='bride')s.couple.brideId=p.id;
   if(rule.effect==='dj')s.stage.djId=p.id;
   if(rule.effect==='band'){s.stage.bandIds[slot]=p.id;s.stage.bandNext=(slot+1)%5;}
   if(previous!==p.id)returnToFloor(s,previous,now);
  }
 }
 if(p&&rule.effect!=='reset'){p.effect=rule.effect;p.effectUntil=now+6500;p.lastGiftAt=now;}
 const messages={marry:' é o novo noivo!',bride:' é a nova noiva!',band:' entrou para a banda!',dj:' assumiu as picapes!',reset:' encerrou e reiniciou a festa!'};
 const event={id:now+'-'+Math.random(),at:now,person:who.id,name:who.name,effect:rule.effect,icon:rule.icon,entered,slot,
  message:messages[rule.effect]?who.name+messages[rule.effect]:entered?who.name+' entrou na roda!':who.name+' enviou '+count+' × '+rule.label};
 if(record)record.event=event;
 s.log.unshift(event);s.log=s.log.slice(0,40);return event;
}
export function comment(s,e,now=Date.now()){
 const who=identity(e),p=s.people.find(p=>p.id===who.id&&(partyRole(s,p.id)||p.expires>now));
 if(!p||!s.settings.comments)return false;p.comment=String(e.comment||'').replace(/[\x00-\x1f]/g,' ').slice(0,120);p.commentUntil=now+7000;return true;
}
export function settings(input,current){
 const s={...current};for(const k of ['title','subtitle'])if(typeof input[k]==='string')s[k]=input[k].slice(0,100);
 for(const [k,min,max] of [['duration',1,120],['speed',0,3]])if(input[k]!==undefined){const n=Number(input[k]);if(!Number.isFinite(n))throw Error('Valor inválido: '+k);s[k]=Math.min(max,Math.max(min,n));}
 s.capacity=0;
 for(const k of ['comments','transparent'])if(typeof input[k]==='boolean')s[k]=input[k];
 if(input.rules){if(!Array.isArray(input.rules)||input.rules.length>30)throw Error('Regras inválidas');s.rules=input.rules.map(r=>{
  if(!['join','marry','bride','band','dj','reset','heart','jump','glow','galaxy','king'].includes(r.effect))throw Error('Efeito inválido');
  const coins=r.coins==null||r.coins===''?null:Number(r.coins);if(coins!=null&&(!Number.isFinite(coins)||coins<1))throw Error('Valor de moedas inválido');
  if(r.effect==='reset'&&coins!==2999)throw Error('O reinício requer o presente de 2999 moedas.');
  return {label:String(r.label).slice(0,40),icon:String(r.icon).slice(0,8),names:String(r.names).slice(0,400),ids:String(r.ids||'').slice(0,150),coins,effect:r.effect};});}
 return s;
}
export function upgradeState(s){
 s.couple={...emptyCouple(),...s.couple};s.stage={...emptyStage(),...s.stage};s.partyEpoch??=0;s.seenGiftIds??=[];
 if((s.schemaVersion||0)<4)s.settings.rules=structuredClone(rules);
 if((s.schemaVersion||0)<5)s.settings.rules=s.settings.rules.map(r=>{
  const stock=rules.find(d=>d.effect===r.effect);
  if(r.effect==='marry'&&r.names.includes('Heart Hands')&&r.names.includes('Heart Me'))return {...r,names:stock.names};
  if(r.effect==='reset'&&r.names.includes('Serenata de arraia')&&!r.names.includes('Serenata da Arraia'))return {...r,names:'Serenata da Arraia,'+r.names};
  return r;
 });
 s.settings.rules=s.settings.rules.map(r=>r.effect==='reset'&&r.names.includes('Serenata da Arraia')&&!r.names.includes('Ray Serenade')?{...r,names:r.names+',Ray Serenade'}:r);
 if((s.schemaVersion||0)<6)s.settings.rules=s.settings.rules.map(r=>r.effect==='marry'?structuredClone(rules.find(d=>d.effect==='marry')):r);
 for(const p of s.people)p.joinedAt??=p.lastGiftAt||0;
 s.settings.capacity=0;s.schemaVersion=7;return s;
}

// Opções do conector TikTok: nada que use rota paga da Euler. A lista gift/list é assinada pelo plano Business;
// com enableExtendedGiftInfo o connect() inteiro falhava sem esse plano. Presentes chegam com nome e preço pelo WebSocket gratuito.
export function liveOptions(apiKey){return {enableExtendedGiftInfo:false,processInitialData:false,...(apiKey?{signApiKey:apiKey}:{})};}
