export const rules=[
{label:'Rosa',icon:'🌹',names:'Rose,Rosa',ids:'5655',effect:'join'},
{label:'Coração',icon:'💖',names:'Finger Heart,Coração de Dedo,Heart,Coração',ids:'',effect:'heart'},
{label:'GG',icon:'🎮',names:'GG',ids:'',effect:'jump'},
{label:'Perfume',icon:'✨',names:'Perfume',ids:'',effect:'glow'},
{label:'Galáxia',icon:'🌌',names:'Galaxy,Galáxia',ids:'',effect:'galaxy'},
{label:'Leão',icon:'🦁',names:'Lion,Leão',ids:'',effect:'king'},
{label:'Anel',icon:'💍',names:'Ring,Anel,Wedding Ring,Aliança,Alianca',ids:'',effect:'marry'}];
export const defaults={title:'A RODA É SUA',subtitle:'Mande uma rosa e entre na roda!',duration:15,speed:1,capacity:24,comments:true,transparent:false,rules};
export function fresh(){return {schemaVersion:3,couple:{groomId:null,since:null},settings:structuredClone(defaults),people:[],log:[],roses:0,music:{file:null,playing:false,position:0,volume:.65,changed:Date.now(),queue:[]}};}
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
export function prune(s,now=Date.now()){s.people=s.people.filter(p=>p.id===s.couple?.groomId||p.expires>now);}
export function identity(e){const u=e.user||e;return {id:String(u.uniqueId||u.userId||'visitante').slice(0,100),name:String(u.nickname||u.uniqueId||'Visitante').slice(0,40)};}
export function gift(s,e,now=Date.now()){
 if(Number(e.giftType??e.giftDetails?.giftType)===1&&!e.repeatEnd)return null;
 e={...e,giftName:e.giftName||e.giftDetails?.giftName};
 const r=s.settings.rules.find(r=>r.ids.split(',').some(id=>id.trim()&&id.trim()===String(e.giftId))||r.names.split(',').some(n=>norm(n)&&norm(n)===norm(e.giftName)));
 if(!r)return null;prune(s,now);
 const who=identity(e),count=Math.min(10000,Math.max(1,Number(e.repeatCount)||1));let p=s.people.find(p=>p.id===who.id);
 const entered=r.effect==='join'&&!p;
 if(r.effect==='join'){s.roses+=count;if(!p){if(s.people.filter(p=>p.id!==s.couple?.groomId).length>=s.settings.capacity)return {message:'Roda cheia',effect:'full'};p={...who,roses:0,joinedAt:now,color:Math.floor(Math.random()*360)};s.people.push(p);}p.name=who.name;p.roses+=count;p.expires=now+s.settings.duration*60000;}
 if(r.effect==='marry'){
  s.couple??={groomId:null,since:null};const previous=s.people.find(person=>person.id===s.couple.groomId);
  if(!p){p={...who,roses:0,joinedAt:now,color:Math.floor(Math.random()*360)};s.people.push(p);}
  if(previous&&previous.id!==p.id){previous.expires=now+s.settings.duration*60000;if(s.people.filter(person=>person.id!==p.id).length>s.settings.capacity)s.people=s.people.filter(person=>person.id!==previous.id);}
  p.name=who.name;p.expires=now+s.settings.duration*60000;s.couple={groomId:p.id,since:now};
 }
 if(p){p.effect=r.effect;p.effectUntil=now+6500;p.lastGiftAt=now;}
 const event={id:now+'-'+Math.random(),at:now,person:who.id,name:who.name,effect:r.effect,icon:r.icon,entered,message:r.effect==='marry'?who.name+' se casou e é o novo noivo!':entered?who.name+' entrou na roda!':who.name+' enviou '+count+' × '+r.label};s.log.unshift(event);s.log=s.log.slice(0,40);return event;
}
export function comment(s,e,now=Date.now()){const who=identity(e),p=s.people.find(p=>p.id===who.id&&(p.id===s.couple?.groomId||p.expires>now));if(!p||!s.settings.comments)return false;p.comment=String(e.comment||'').replace(/[\x00-\x1f]/g,' ').slice(0,120);p.commentUntil=now+7000;return true;}
export function settings(input,current){
 const s={...current};for(const k of ['title','subtitle'])if(typeof input[k]==='string')s[k]=input[k].slice(0,100);
 for(const [k,min,max] of [['duration',1,120],['speed',0,3],['capacity',4,48]])if(input[k]!==undefined){const n=Number(input[k]);if(!Number.isFinite(n))throw Error('Valor inválido: '+k);s[k]=Math.min(max,Math.max(min,n));}
 for(const k of ['comments','transparent'])if(typeof input[k]==='boolean')s[k]=input[k];
 if(input.rules){if(!Array.isArray(input.rules)||input.rules.length>30)throw Error('Regras inválidas');s.rules=input.rules.map(r=>{if(!['join','heart','jump','glow','galaxy','king','marry'].includes(r.effect))throw Error('Efeito inválido');return {label:String(r.label).slice(0,40),icon:String(r.icon).slice(0,8),names:String(r.names).slice(0,300),ids:String(r.ids).slice(0,150),effect:r.effect};});}return s;
}

export function upgradeState(s){
 s.couple??={groomId:null,since:null};
 if((s.schemaVersion||0)<3&&!s.settings.rules.some(r=>r.effect==='marry'))s.settings.rules.push(structuredClone(rules.find(r=>r.effect==='marry')));
 for(const p of s.people)p.joinedAt??=p.lastGiftAt||0;
 s.schemaVersion=3;return s;
}
