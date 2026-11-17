export const SPIRAL_SPACING=3.2,SPIRAL_PITCH=3.8,SPIRAL_INNER_RADIUS=6.6;

// Stable slots prevent existing dancers from crossing each other when someone joins.
export class SpiralLayout{
 constructor(){this.slots=new Map();this.points=[];this.free=[];this.radius=8.3;}
 sync(ids){
  const active=new Set(ids);
  for(const [id,slot] of this.slots)if(!active.has(id)){this.slots.delete(id);this.free.push(slot);}
  this.free.sort((a,b)=>b-a);
  for(const id of ids)if(!this.slots.has(id)){
   const slot=this.free.length?this.free.pop():this.points.length;
   if(slot===this.points.length){
    const previous=this.points.at(-1),theta=previous?previous.theta+2*Math.asin(SPIRAL_SPACING/(2*previous.radius)):0;
    const radius=SPIRAL_INNER_RADIUS+SPIRAL_PITCH*theta/(Math.PI*2);
    this.points.push({theta,radius,x:Math.sin(theta)*radius,z:Math.cos(theta)*radius});
   }
   this.slots.set(id,slot);
  }
  this.radius=8.3;for(const slot of this.slots.values())this.radius=Math.max(this.radius,this.points[slot].radius+1.7);
 }
 position(id,time=0){
  const point=this.points[this.slots.get(id)];if(!point)return null;
  const angle=time*.075,c=Math.cos(angle),s=Math.sin(angle);
  return {x:point.x*c+point.z*s,z:point.z*c-point.x*s,rotation:Math.sin(time*.7+(this.slots.get(id)%7))*.3};
 }
}
