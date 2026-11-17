import {partyRole} from './public/party-layout.js';
export {partyRole};
export const rules=[
 {label:'Entrar · Rosa',icon:'🌹',names:'Rose,Rosa',ids:'5655',coins:1,effect:'join'},
 {label:'Noivo · Mãos coração',icon:'🫶',names:'Mãos fazendo coração,Mãos fazendo coração TikTok,Heart Hands,Heart Me',ids:'',coins:null,effect:'marry'},
 {label:'Noiva · Rosa 10',icon:'👰',names:'Rosa,Rose,Rosa de 10,Rosa 10',ids:'',coins:10,effect:'bride'},
 {label:'Banda · Rosquinha',icon:'🍩',names:'Rosquinha,Doughnut,Donut,Doughnuts',ids:'',coins:30,effect:'band'},
 {label:'DJ · Boné',icon:'🧢',names:'Boné,Cap,Baseball Cap',ids:'',coins:99,effect:'dj'},
 {label:'Reiniciar · Serenata',icon:'🎆',names:'Serenata de arraia,Serenata de arraiá,Serenata de arraial,Arraia Serenade,Arraiá Serenade',ids:'',coins:2999,effect:'reset'}
];
export const defaults={title:'A RODA É SUA',subtitle:'Mande uma rosa e entre na roda!',duration:15,speed:1,capacity:24,comments:true,transparent:false,rules};
const emptyCouple=()=>({groomId:null,brideId:null,since:null});
const emptyStage=()=>({djId:null,bandIds:[null,null,null,null,null],bandNext:0});
export function fresh(){return {schemaVersion:4,partyEpoch:0,couple:emptyCouple(),stage:emptyStage(),
 settings:structuredClone(defaults),people:[],log:[],roses:0,seenGiftIds:[],
 music:{file:null,playing:false,position:0,volume:.65,changed:Date.now(),revision:0,duration:0,queue:[]}};}
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function identity(e){const u=e.user||e;return {id:String(u.uniqueId||u.userId||'visitante').slice(0,100),name:String(u.nickname||u.uniqueId||'Visitante').slice(0,40)};}
export function giftPrice(e){const value=e.diamondCount??e.giftDetails?.diamondCount??e.gift?.diamond_count;return value==null?null:Number(value);}
export function matchGift(s,e){
 const name=norm(e.giftName||e.giftDetails?.giftName),price=giftPrice(e);
 const byId=s.settings.rules.filter(r=>String(r.ids||'').split(',').some(id=>id.trim()&&id.trim()===String(e.giftId)));
 const byName=s.settings.rules.filter(r=>r.names.split(',').some(alias=>norm(alias)===name));
 const candidates=byId.length?byId:byName;
 const matching=candidates.filter(r=>r.coins==null||price===Number(r.coins));
 if(matching.length===1)return matching[0];
 // A configured ID can identify ordinary roles without price metadata. Reset always requires 2999.
 if(price==null&&byId.length===1&&byId[0].effect!=='reset')return byId[0];
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
 if(s.people.filter(p=>!partyRole(s,p.id)).length>s.settings.capacity)s.people=s.people.filter(p=>p.id!==id);
}
export function gift(s,e,now=Date.now()){
 if(Number(e.giftType??e.giftDetails?.giftType)===1&&!e.repeatEnd)return null;
 const rule=matchGift(s,e);if(!rule)return null;
 const messageId=e.common?.msgId??e.msgId??e.eventId;
 s.seenGiftIds??=[];if(messageId&&s.seenGiftIds.includes(String(messageId)))return null;
 if(messageId){s.seenGiftIds.push(String(messageId));s.seenGiftIds=s.seenGiftIds.slice(-512);}
 prune(s,now);const who=identity(e),count=Math.max(1,Math.min(10000,Math.trunc(Number(e.repeatCount)||1)));
 let p=s.people.find(p=>p.id===who.id),entered=!p&&rule.effect==='join',slot=null;
 if(rule.effect==='reset')clearParty(s,now);
 else if(['join','marry','bride','band','dj'].includes(rule.effect)){
  if(!p){
   if(rule.effect==='join'&&s.people.filter(p=>!partyRole(s,p.id)).length>=s.settings.capacity)return null;
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
 s.log.unshift(event);s.log=s.log.slice(0,40);return event;
}
export function comment(s,e,now=Date.now()){
 const who=identity(e),p=s.people.find(p=>p.id===who.id&&(partyRole(s,p.id)||p.expires>now));
 if(!p||!s.settings.comments)return false;p.comment=String(e.comment||'').replace(/[\x00-\x1f]/g,' ').slice(0,120);p.commentUntil=now+7000;return true;
}
export function settings(input,current){
 const s={...current};for(const k of ['title','subtitle'])if(typeof input[k]==='string')s[k]=input[k].slice(0,100);
 for(const [k,min,max] of [['duration',1,120],['speed',0,3],['capacity',4,48]])if(input[k]!==undefined){const n=Number(input[k]);if(!Number.isFinite(n))throw Error('Valor inválido: '+k);s[k]=Math.min(max,Math.max(min,n));}
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
 for(const p of s.people)p.joinedAt??=p.lastGiftAt||0;
 s.schemaVersion=4;return s;
}
