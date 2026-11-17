import * as THREE from '/vendor/three/three.module.js';
import {makeInstrument} from './instruments.js';
const sphere=new THREE.SphereGeometry(1,16,12),bone=new THREE.CylinderGeometry(1,1,1,8);
const white=new THREE.MeshStandardMaterial({color:'#fff4de',roughness:.4});
const black=new THREE.MeshStandardMaterial({color:'#14121e',roughness:.3});
const shoeMaterial=new THREE.MeshStandardMaterial({color:'#eee4d0',roughness:.65});
const palette=['#ce7043','#8fa762','#8868bc','#d3a249','#578a9e','#bb6588','#976d53','#c8bba5'];
export function characterSeed(id){let seed=2166136261;for(const c of String(id))seed=Math.imul(seed^c.charCodeAt(0),16777619);return seed>>>0;}
export function makeRoach(person){
 const seed=characterSeed(person.id),variant=seed%6,root=new THREE.Group(),dancer=new THREE.Group();root.add(dancer);
 const ownedGeometry=[],ownedMaterial=[],parts=[];
 const material=(color,metalness=0)=>{const m=new THREE.MeshStandardMaterial({color,metalness,roughness:metalness?.32:.65});ownedMaterial.push(m);return m;};
 const shell=material(palette[seed%palette.length],.45),dark=material('#3e2b2a'),shirt=material(new THREE.Color().setHSL((seed%360)/360,.5,.43));
 const denim=material(variant%2?'#303b61':'#443044'),accent=material(new THREE.Color().setHSL(((seed+90)%360)/360,.7,.67)),gold=material('#dfb45c',.75);
 const shirtColor=shirt.color.clone();
 function ball(parent,mat,pos,scale){const o=new THREE.Mesh(sphere,mat);o.position.set(...pos);o.scale.set(...scale);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function line(parent,a,b,r,mat){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),v=q.clone().sub(p);const o=new THREE.Mesh(bone,mat);o.position.copy(p).add(q).multiplyScalar(.5);o.scale.set(r,v.length(),r);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());o.castShadow=true;parent.add(o);return o;}
 function shape(parent,geometry,mat,x,y,z){ownedGeometry.push(geometry);const o=new THREE.Mesh(geometry,mat);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o;}
 // Narrow waist, shoulders, trousers and shoes; the shell and four extra arms retain the insect silhouette.
 ball(dancer,dark,[0,.9,0],[.39,.58,.3]);
 for(const side of [-1,1]){const wing=ball(dancer,shell,[side*.23,1.1,-.22],[.26,.68,.15]);wing.rotation.z=side*.08;}
 for(let i=0;i<4;i++)line(dancer,[-.27,.57+i*.11,.29],[.27,.57+i*.11,.29],.016,shell);
 const torso=shape(dancer,new THREE.CylinderGeometry(.4,.31,.78,16),shirt,0,1.4,.025);torso.scale.z=.8;
 ball(dancer,white,[0,1.79,.04],[.18,.045,.17]);
 for(let i=0;i<3;i++)ball(dancer,gold,[0,1.45-i*.14,.36],[.025,.025,.02]);
 if(variant%3===0)for(const side of [-1,1])line(dancer,[side*.29,1.72,.28],[side*.22,1.06,.28],.025,white);
 if(variant%3===1)for(let i=0;i<3;i++)line(dancer,[-.32,1.2+i*.15,.31],[.32,1.2+i*.15,.31],.024,accent);
 ball(dancer,shell,[0,2.11,.07],[.34,.32,.29]);
 const eyes=[];
 for(const side of [-1,1]){
  eyes.push(ball(dancer,white,[side*.18,2.18,.31],[.145,.17,.11]));
  ball(dancer,black,[side*.18,2.18,.405],[.063,.083,.037]);
  ball(dancer,white,[side*.18-.016,2.21,.44],[.02,.025,.012]);
 }
 line(dancer,[-.09,1.99,.35],[0,1.95,.385],.018,black);line(dancer,[0,1.95,.385],[.09,1.99,.35],.018,black);
 const antennae=[];
 for(const side of [-1,1]){
  const p=new THREE.Group();p.position.set(side*.18,2.35,0);dancer.add(p);
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(),new THREE.Vector3(side*.23,.36,0),new THREE.Vector3(side*.62,.56,.1)]);
  shape(p,new THREE.TubeGeometry(curve,12,.022,6,false),dark,0,0,0);ball(p,accent,[side*.62,.56,.1],[.045,.045,.045]);antennae.push(p);
 }
 const limbs=[];
 for(const side of [-1,1])for(let row=0;row<3;row++){
  const pivot=new THREE.Group();pivot.position.set(side*(row===2?.21:.36),row===0?1.65:row===1?1.13:.6,0);dancer.add(pivot);
  let hand;
  if(row<2){
   line(pivot,[0,0,0],[side*.35,-.13,.05],row===0?.075:.045,row===0?shirt:dark);
   line(pivot,[side*.35,-.13,.05],[side*.59,.02,.16],.044,shell);
   hand=ball(pivot,accent,[side*.6,.02,.16],[.095,.09,.085]);
   for(let i=-1;i<=1;i++)ball(hand,accent,[i*.45,.65,0],[.18,.43,.24]);
  }else{
   line(pivot,[0,0,0],[side*.06,-.26,.03],.115,denim);line(pivot,[side*.06,-.26,.03],[side*.04,-.51,.14],.09,denim);
   ball(pivot,shoeMaterial,[side*.04,-.51,.23],[.17,.095,.28]);line(pivot,[side*.04-.08,-.46,.37],[side*.04+.08,-.46,.37],.012,accent);
  }
  limbs.push({pivot,side,row,hand});
 }
 const hat=new THREE.Group();hat.position.set(0,2.35,.02);dancer.add(hat);
 if(variant===0||variant===5){for(const side of [-1,1])ball(dancer,black,[side*.18,2.19,.435],[.18,.115,.035]);line(dancer,[-.1,2.2,.45],[.1,2.2,.45],.022,gold);}
 if(variant===1){ball(hat,accent,[0,.07,0],[.3,.16,.27]);ball(hat,accent,[0,-.02,.27],[.32,.035,.19]);}
 if(variant===2){const band=shape(hat,new THREE.TorusGeometry(.34,.045,6,18,Math.PI),black,0,-.15,0);for(const side of [-1,1])ball(hat,accent,[side*.34,-.2,0],[.1,.15,.12]);}
 if(variant===3){shape(hat,new THREE.ConeGeometry(.22,.42,14),accent,0,.2,0);ball(hat,white,[0,.43,0],[.055,.055,.055]);}
 if(variant===4)for(const side of [-1,1])ball(dancer,gold,[side*.12,1.98,.4],[.13,.045,.04]);
 let role=null,instrumentId=null,prop=null,costume=null,greetingActive=false;
 const costumes=new Map();
 function setRole(next,instrument=null){
  if(role===next&&instrumentId===instrument)return;
  if(costume)costume.visible=false;shirt.color.copy(shirtColor);hat.visible=!next||next==='band';
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
 return {root,dancer,seed,variant,material:shell,setRole,
  setWeddingRole(next){setRole(next,null);},
  get weddingRole(){return ['groom','bride'].includes(role)?role:null;},get stageRole(){return role;},get instrument(){return instrumentId;},
  get isGreeting(){return greetingActive;},get greetingArm(){return limbs.find(l=>l.row===0&&l.side===1).pivot;},
  animate(t,person,now,beat=0,greeting=false){
   greetingActive=greeting;const phase=t*(4.1+variant*.19)+seed%100,effect=person.effectUntil>now?person.effect:'';
   dancer.position.y=Math.abs(Math.sin(phase))*(.045+beat*.1)+(effect==='jump'?Math.abs(Math.sin(t*8))*.7:0);
   dancer.rotation.z=Math.sin(phase*.5)*(prop?.035:.09);dancer.rotation.x=Math.cos(phase)*.035;root.rotation.y=Math.sin(phase*.3)*.15;
   for(const {pivot,side,row,hand} of limbs){
    pivot.rotation.z=side*Math.sin(phase+row*1.5)* (row===2?.19:.48);pivot.rotation.x=Math.sin(phase+row)*.2;
    if(hand){hand.rotation.set(0,0,0);hand.scale.set(.095,.09,.085);}
    if(prop&&row===0){pivot.rotation.z=side*-.45;pivot.rotation.x=-.6;
     if(instrumentId==='drums'){pivot.rotation.x=-.5+Math.sin(t*9+side)*.3;}
     if(instrumentId==='harmonica'){pivot.rotation.z=side*.85;pivot.rotation.x=-.45;}
     if(instrumentId==='accordion'){pivot.rotation.z=side*(-.25+Math.sin(t*4)*.07);}
    }
    if(greeting&&row===0&&side===1){pivot.rotation.z=1.0+Math.sin(now*.011)*.28;pivot.rotation.x=-.22;hand.rotation.z=-pivot.rotation.z;hand.scale.set(.13,.14,.11);}
   }
   if(greeting)root.rotation.y=.08;
   antennae.forEach((a,i)=>a.rotation.z=Math.sin(phase*.6+i)*.13);
   eyes.forEach(e=>e.scale.y=Math.sin(t*1.5+seed)>.998?.04:.17);
   aura.visible=!!effect||!!role;aura.material.color.set(role?'#efb5d6':effect==='galaxy'?'#b3a2ff':'#d6fb79');
   prop?.animate(t,beat);
  },
  dispose(){prop?.dispose();ownedGeometry.forEach(g=>g.dispose());ownedMaterial.forEach(m=>m.dispose());}
 };
}