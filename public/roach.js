import * as THREE from '/vendor/three/three.module.js';
import {makeInstrument} from './instruments.js';
import {waltzPose} from './waltz.js';
const sphere=new THREE.SphereGeometry(1,20,14),bone=new THREE.CylinderGeometry(1,1,1,8);
const white=new THREE.MeshStandardMaterial({color:'#fff4de',roughness:.4});
const black=new THREE.MeshStandardMaterial({color:'#14121e',roughness:.3});
const shoeMaterial=new THREE.MeshStandardMaterial({color:'#211914',roughness:.48});
const palette=['#4b2c1e','#6f3e22','#312019','#87502c','#493329','#60351f','#251a15','#936136'];
export function characterSeed(id){let seed=2166136261;for(const c of String(id))seed=Math.imul(seed^c.charCodeAt(0),16777619);return seed>>>0;}
export function makeRoach(person){
 const seed=characterSeed(person.id),variant=seed%8,root=new THREE.Group(),dancer=new THREE.Group();root.add(dancer);
 const ownedGeometry=[],ownedMaterial=[];
 const material=(color,metalness=0)=>{const m=new THREE.MeshPhysicalMaterial({color,metalness,roughness:metalness?.3:.65,clearcoat:metalness?.65:0,clearcoatRoughness:.24});ownedMaterial.push(m);return m;};
 const shell=material(palette[seed%palette.length],.12),dark=material('#241b15'),shirt=material(new THREE.Color().setHSL((seed%360)/360,.28,.25));
 const denim=material(variant%2?'#232b37':'#30272a'),accent=material(new THREE.Color().setHSL(((seed+90)%360)/360,.38,.46)),gold=material('#ba944c',.65);
 shirt.roughness=.95;
 const shirtColor=shirt.color.clone();
 function ball(parent,mat,pos,scale){const o=new THREE.Mesh(sphere,mat);o.position.set(...pos);o.scale.set(...scale);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function line(parent,a,b,r,mat){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),v=q.clone().sub(p);const o=new THREE.Mesh(bone,mat);o.position.copy(p).add(q).multiplyScalar(.5);o.scale.set(r,v.length(),r);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());o.castShadow=true;parent.add(o);return o;}
 function shape(parent,geometry,mat,x,y,z){ownedGeometry.push(geometry);const o=new THREE.Mesh(geometry,mat);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o;}
 // Two arms and two legs; the segmented abdomen, elytra and antennae retain the cockroach anatomy.
 ball(dancer,dark,[0,.91,-.03],[.34,.64,.25]);
 for(const side of [-1,1]){const cover=ball(dancer,shell,[side*.18,1.05,-.28],[.2,.8,.11]);cover.rotation.z=side*.04;}
 for(let i=0;i<6;i++){
  const segment=shape(dancer,new THREE.TorusGeometry(.29-i*.012,.018,5,18,Math.PI),shell,0,.48+i*.105,.01);segment.rotation.x=Math.PI/2;
  line(dancer,[-.19,.52+i*.12,-.37],[.19,.52+i*.12,-.37],.008,dark);
 }
 const wings=[];
 for(const side of [-1,1]){
  const pivot=new THREE.Group();pivot.name=side<0?'Asa esquerda':'Asa direita';pivot.position.set(side*.14,1.7,-.34);dancer.add(pivot);
  const outline=new THREE.Shape();outline.moveTo(0,0);outline.bezierCurveTo(side*.3,.04,side*.72,-.28,side*.6,-.8);outline.bezierCurveTo(side*.48,-1.4,side*.16,-1.6,0,-1.25);outline.closePath();
  const membrane=material('#947149');membrane.transparent=true;membrane.opacity=.42;membrane.side=THREE.DoubleSide;membrane.depthWrite=false;
  shape(pivot,new THREE.ShapeGeometry(outline,18),membrane,0,0,0);
  for(let i=0;i<7;i++)line(pivot,[0,-.04,-.01],[side*(.2+i*.06),-1.35+i*.12,-.01],.005,dark);
  wings.push({pivot,side});
 }
 const torso=shape(dancer,new THREE.CylinderGeometry(.4,.31,.78,16),shirt,0,1.4,.025);torso.scale.z=.8;
 ball(dancer,white,[0,1.79,.04],[.18,.045,.17]);
 for(let i=0;i<3;i++)ball(dancer,gold,[0,1.45-i*.14,.36],[.025,.025,.02]);
 if(variant%3===0)for(const side of [-1,1])line(dancer,[side*.29,1.72,.28],[side*.22,1.06,.28],.025,white);
 if(variant%3===1)for(let i=0;i<3;i++)line(dancer,[-.32,1.2+i*.15,.31],[.32,1.2+i*.15,.31],.024,accent);
 const head=shape(dancer,new THREE.CylinderGeometry(.23,.12,.43,9),shell,0,2.1,.09);head.scale.z=.8;head.rotation.x=.15;head.name='Cabeça estreita';
 const pronotum=ball(dancer,shell,[0,1.84,-.12],[.34,.2,.24]);pronotum.rotation.x=-.22;
 line(dancer,[0,1.72,-.33],[0,.43,-.37],.012,dark);
 const eyes=[];
 for(const side of [-1,1]){
  const eye=ball(dancer,black,[side*.185,2.15,.205],[.06,.105,.045]);eye.rotation.z=side*-.23;eyes.push(eye);
  const mandible=shape(dancer,new THREE.ConeGeometry(.045,.18,5),dark,side*.065,1.91,.24);mandible.rotation.z=side*.5;
  line(dancer,[side*.1,1.95,.23],[side*.19,1.86,.3],.01,shell);
 }
 const antennae=[];
 for(const side of [-1,1]){
  const p=new THREE.Group();p.position.set(side*.15,2.3,.04);dancer.add(p);
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(),new THREE.Vector3(side*.19,.37,0),new THREE.Vector3(side*.48,.67,.07),new THREE.Vector3(side*.82,.72,.14)]);
  shape(p,new THREE.TubeGeometry(curve,20,.012,5,false),dark,0,0,0);
  for(let i=1;i<6;i++){const point=curve.getPoint(i/6);ball(p,shell,point.toArray(),[.018,.018,.018]);}antennae.push(p);
 }
 const limbs=[];
 for(const side of [-1,1])for(const row of [0,2]){
  const pivot=new THREE.Group();pivot.position.set(side*(row===2?.21:.36),row===0?1.65:row===1?1.13:.6,0);dancer.add(pivot);
  let hand;
  if(row<2){
   line(pivot,[0,0,0],[side*.35,-.13,.05],.06,shirt);
   ball(pivot,dark,[side*.35,-.13,.05],[.052,.052,.052]);
   line(pivot,[side*.35,-.13,.05],[side*.59,.02,.16],.029,shell);
   for(let i=0;i<3;i++)line(pivot,[side*(.4+i*.055),-.09+i*.025,.08],[side*(.44+i*.055),-.14+i*.025,.08],.006,dark);
   hand=ball(pivot,shell,[side*.6,.02,.16],[.066,.085,.045]);
   for(let i=-1;i<=1;i++)line(hand,[i*.5,.45,0],[i*.6,1.25,.15],.1,dark);
  }else{
   line(pivot,[0,0,0],[side*.06,-.26,.03],.085,denim);line(pivot,[side*.06,-.26,.03],[side*.04,-.51,.14],.065,denim);
   ball(pivot,dark,[side*.06,-.27,.04],[.07,.055,.06]);
   ball(pivot,shoeMaterial,[side*.04,-.51,.23],[.105,.065,.22]);line(pivot,[side*.04-.06,-.47,.35],[side*.04+.06,-.47,.35],.007,gold);
  }
  limbs.push({pivot,side,row,hand});
 }
 const casual=new THREE.Group();dancer.add(casual);
 if(variant===0||variant===6){
  for(const side of [-1,1])line(casual,[side*.29,1.72,.3],[side*.1,1.43,.38],.045,denim);
  for(const side of [-1,1])ball(casual,accent,[side*.1,1.73,.39],[.1,.055,.03]);
 }else if(variant===1||variant===4){
  for(let i=0;i<4;i++){line(casual,[-.32,1.14+i*.15,.335],[.32,1.14+i*.15,.335],.012,accent);line(casual,[-.24+i*.16,1.12,.34],[-.24+i*.16,1.73,.34],.01,white);}
 }else if(variant===5||variant===7){
  const skirt=shape(casual,new THREE.ConeGeometry(.49,.68,24,1,true),accent,0,.73,.02);skirt.scale.z=.8;
 }else{
  const tie=shape(casual,new THREE.ConeGeometry(.07,.32,4),accent,0,1.48,.36);tie.rotation.z=Math.PI;
  for(const side of [-1,1])ball(casual,denim,[side*.21,1.25,.345],[.1,.09,.03]);
 }
 const hat=new THREE.Group();hat.position.set(0,2.35,.02);dancer.add(hat);
 if(variant===0||variant===5){for(const side of [-1,1])ball(dancer,black,[side*.15,2.15,.27],[.105,.065,.018]);line(dancer,[-.06,2.16,.29],[.06,2.16,.29],.012,gold);}
 if(variant===1){ball(hat,accent,[0,.07,0],[.3,.16,.27]);ball(hat,accent,[0,-.02,.27],[.32,.035,.19]);}
 if(variant===2){const band=shape(hat,new THREE.TorusGeometry(.34,.045,6,18,Math.PI),black,0,-.15,0);for(const side of [-1,1])ball(hat,accent,[side*.34,-.2,0],[.1,.15,.12]);}
 if(variant===3){shape(hat,new THREE.CylinderGeometry(.32,.32,.035,24),denim,0,0,0);shape(hat,new THREE.CylinderGeometry(.19,.22,.23,16),denim,0,.13,0);shape(hat,new THREE.CylinderGeometry(.225,.225,.035,16),accent,0,.06,0);}
 if(variant===4)for(const side of [-1,1])ball(dancer,gold,[side*.12,1.98,.4],[.13,.045,.04]);
 let role=null,instrumentId=null,prop=null,costume=null,greetingActive=false;
 const costumes=new Map();
 function setRole(next,instrument=null){
  if(role===next&&instrumentId===instrument)return;
  if(costume)costume.visible=false;shirt.color.copy(shirtColor);hat.visible=!next||next==='band';casual.visible=!next;
  role=next;instrumentId=instrument;
  if(prop){dancer.remove(prop.root);prop.dispose();prop=null;}
  if(instrument){prop=makeInstrument(instrument);dancer.add(prop.root);}
  if(!next){costume=null;return;}
  shirt.color.set(next==='bride'?'#fff3df':next==='groom'?'#20202d':next==='dj'?'#29213d':'#5e4769');
  if(costumes.has(next)){costume=costumes.get(next);costume.visible=true;return;}
  costume=new THREE.Group();costumes.set(next,costume);dancer.add(costume);
  if(next==='bride'){
   shape(costume,new THREE.ConeGeometry(.62,1.1,24),white,0,.72,.02);
   const veil=material('#fff8ed');veil.transparent=true;veil.opacity=.48;veil.side=THREE.DoubleSide;
   shape(costume,new THREE.PlaneGeometry(.9,1.35),veil,0,1.9,-.31);
   for(let i=-1;i<=1;i++)ball(costume,white,[i*.15,2.39,.07],[.11,.06,.08]);
  }else if(next==='groom'){
   ball(costume,white,[0,1.43,.355],[.15,.34,.035]);
   for(const side of [-1,1])ball(costume,accent,[side*.1,1.72,.39],[.12,.065,.04]);
  }else if(next==='dj'){
   const band=shape(costume,new THREE.TorusGeometry(.37,.06,8,20,Math.PI),accent,0,2.18,0);
   for(const side of [-1,1])ball(costume,black,[side*.37,2.14,0],[.11,.17,.13]);
   shape(costume,new THREE.TorusGeometry(.13,.02,6,16),gold,0,1.3,.37);
  }else if(next==='band'){
   for(const side of [-1,1])line(costume,[side*.3,1.73,.31],[side*.2,1.05,.31],.028,gold);
  }
 }
 const aura=shape(root,new THREE.TorusGeometry(.66,.023,6,32),new THREE.MeshBasicMaterial({color:'#f8b6dd'}),0,.035,0);ownedMaterial.push(aura.material);aura.rotation.x=-Math.PI/2;aura.visible=false;
 return {root,dancer,seed,variant,material:shell,setRole,limbs,wings,antennae,
  setWeddingRole(next){setRole(next,null);},
  get weddingRole(){return ['groom','bride'].includes(role)?role:null;},get stageRole(){return role;},get instrument(){return instrumentId;},
  get isGreeting(){return greetingActive;},get greetingArm(){return limbs.find(l=>l.row===0&&l.side===1).pivot;},
  animate(t,person,now,beat=0,greeting=false){
   greetingActive=greeting;const playing=role==='band'||role==='dj',waltz=waltzPose(t,variant),phase=playing?t*3:waltz.phase,effect=person.effectUntil>now?person.effect:'';
   dancer.position.y=(playing?Math.abs(Math.sin(phase))*.025:waltz.rise)+(effect==='jump'?Math.abs(Math.sin(t*8))*.7:0);
   dancer.position.x=playing?0:waltz.side*.3;dancer.rotation.z=playing?Math.sin(phase)*.025:waltz.sway;
   dancer.rotation.x=playing?Math.cos(phase)*.018:waltz.shoulder;dancer.rotation.y=playing?0:waltz.hips;
   root.rotation.y=playing?Math.sin(phase*.3)*.08:waltz.turn;
   for(const {pivot,side,row,hand} of limbs){
    pivot.rotation.y=0;
    pivot.rotation.z=row===2?side*(playing?.02:waltz.step*.23):side*(-.35+waltz.sway*1.8);
    pivot.rotation.x=row===2?side*(playing?Math.sin(t*3)*.04:waltz.step):-.35+Math.cos(phase+variant)*.22;
    if(hand){hand.rotation.set(0,0,0);hand.scale.set(.066,.085,.045);}
    if(prop&&row===0){pivot.rotation.z=side*-.45;pivot.rotation.x=-.6;
     if(instrumentId==='drums'){pivot.rotation.x=-.5+Math.sin(t*9+side)*.3;}
     if(instrumentId==='harmonica'){pivot.rotation.z=side*.85;pivot.rotation.x=-.45;}
     if(instrumentId==='accordion'){pivot.rotation.z=side*(-.25+Math.sin(t*4)*.07);}
    }
    if(greeting&&row===0&&side===1){pivot.rotation.z=1.0+Math.sin(now*.011)*.28;pivot.rotation.x=-.22;hand.rotation.z=-pivot.rotation.z;hand.scale.set(.08,.1,.06);}
   }
   if(greeting)root.rotation.y=.08;
   antennae.forEach((a,i)=>a.rotation.z=Math.sin(phase*.6+i)*.13);
   wings.forEach(({pivot,side})=>{pivot.rotation.y=side*(.28+Math.sin(phase)*.04);pivot.rotation.z=side*.08;});
   aura.visible=!!effect||!!role;aura.material.color.set(role?'#efb5d6':effect==='galaxy'?'#b3a2ff':'#d6fb79');
   prop?.animate(t,beat);
  },
  dispose(){prop?.dispose();ownedGeometry.forEach(g=>g.dispose());ownedMaterial.forEach(m=>m.dispose());}
 };
}
