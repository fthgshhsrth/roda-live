// Cada plano precisa durar mais que a transição (~1,5 s), senão a câmera só "pula" entre geral e close.
export const CAMERA_TIMING=Object.freeze({overview:6000,random:3800,rose:4200,marry:4800,role:4200,groom:4200,return:1000,maxRose:6000});
export class CameraDirector {
 constructor(now=0,random=Math.random){this.random=random;this.mode='overview';this.reason=null;this.targetId=null;this.event=null;this.startedAt=now;this.until=Infinity;this.nextRandomAt=now+CAMERA_TIMING.overview;this.token=0;this.queue=[];this.lastRandomId=null;}
 // New donations interrupt immediately; no queue of stale close-ups.
 rose(event,now){if(event.person)this.queue=[event];}
 marry(event,now){this.rose({...event,priority:'marry'},now);}
 feature(event,now){this.rose({...event,priority:event.effect==='marry'?'marry':'role'},now);}
 overview(now){this.mode='overview';this.reason=null;this.targetId=null;this.event=null;this.startedAt=now;this.until=Infinity;this.nextRandomAt=now+CAMERA_TIMING.overview;this.token++;}
 focus(id,reason,event,now){this.mode='focus';this.reason=reason;this.targetId=id;this.event=event;this.startedAt=now;this.until=now+CAMERA_TIMING[reason];this.token++;if(reason==='random')this.lastRandomId=id;}
 update(now,ids,context={}){
  const available=new Set(ids),event=this.queue.pop();this.queue=[];
  if(event&&available.has(event.person)){
   const reason=event.priority==='marry'?'marry':event.priority==='role'?'role':'rose';
   if(this.mode==='focus'&&this.targetId===event.person&&this.reason===reason&&now<this.until){this.event=event;this.until=Math.min(this.startedAt+CAMERA_TIMING.maxRose,now+CAMERA_TIMING[reason]);}
   else this.focus(event.person,reason,event,now);
  }else if(this.mode==='focus'&&(!available.has(this.targetId)||now>=this.until))this.overview(now);
  else if(this.mode==='overview'&&now>=this.nextRandomAt&&ids.length){const pool=ids.length>1?ids.filter(id=>id!==this.lastRandomId):ids;this.focus(pool[Math.min(pool.length-1,Math.floor(this.random()*pool.length))],'random',null,now);}
  return {mode:this.mode,reason:this.reason,targetId:this.targetId,event:this.event,token:this.token,startedAt:this.startedAt,until:this.until};
 }
}
export function roseNotice(event){return event.entered?'🌹 '+event.name+' entrou na roda!':'🌹 '+event.name+' mandou rosas! Mais tempo na pista.';}
