import * as THREE from '/vendor/three/three.module.js';
import {makeInstrument} from './instruments.js';
import {waltzPose} from './waltz.js';
const sphere=new THREE.SphereGeometry(1,32,22),bone=new THREE.CylinderGeometry(1,1,1,14);
const white=new THREE.MeshStandardMaterial({color:'#fff4de',roughness:.4});
const black=new THREE.MeshStandardMaterial({color:'#14121e',roughness:.3});
const eyeWhite=new THREE.MeshPhysicalMaterial({color:'#ffffff',roughness:.08,clearcoat:1});
const pupilMat=new THREE.MeshPhysicalMaterial({color:'#0b0a12',roughness:.05,clearcoat:1});
const glintMat=new THREE.MeshBasicMaterial({color:'#ffffff'});
const cheekMat=new THREE.MeshStandardMaterial({color:'#ff86b0',roughness:.9,transparent:true,opacity:.7});
const smileGeometry=new THREE.TorusGeometry(.06,.012,8,20,Math.PI);
// Peito arredondado: roupas e enfeites seguem esta superfície (antes era um cilindro "balde").
const CHEST={x:0,y:1.38,z:.03,rx:.36,ry:.44,rz:.29};
function chest(x,y,off=.012){
 let u=x/CHEST.rx,v=(y-CHEST.y)/CHEST.ry;const k=u*u+v*v;if(k>.94){const s=Math.sqrt(.94/k);u*=s;v*=s;}
 return [u*CHEST.rx,CHEST.y+v*CHEST.ry,CHEST.z+CHEST.rz*Math.sqrt(Math.max(0,1-u*u-v*v))+off];
}
const shoeMaterial=new THREE.MeshStandardMaterial({color:'#211914',roughness:.48});
const palette=['#4b2c1e','#6f3e22','#312019','#87502c','#493329','#60351f','#251a15','#936136'];
export function characterSeed(id){let seed=2166136261;for(const c of String(id))seed=Math.imul(seed^c.charCodeAt(0),16777619);return seed>>>0;}
export function makeRoach(person){
 const seed=characterSeed(person.id),variant=seed%8,root=new THREE.Group(),dancer=new THREE.Group();root.add(dancer);
 const ownedGeometry=[],ownedMaterial=[];
 const material=(color,metalness=0,glossy=false)=>{const m=new THREE.MeshPhysicalMaterial({color,metalness,roughness:glossy?.28:metalness?.3:.65,clearcoat:glossy||metalness?1:0,clearcoatRoughness:.14});ownedMaterial.push(m);return m;};
 const shell=material(palette[seed%palette.length],.04,true),dark=material('#241b15'),shirt=material(new THREE.Color().setHSL((seed%360)/360,.32,.3));
 const denim=material(variant%2?'#232b37':'#30272a'),accent=material(new THREE.Color().setHSL(((seed+90)%360)/360,.45,.5)),gold=material('#ba944c',.65);
 const muzzle=material(new THREE.Color(palette[seed%palette.length]).lerp(new THREE.Color('#d9a066'),.38),0,true);
 shirt.roughness=.9;shirt.sheen=.6;shirt.sheenRoughness=.55;shirt.sheenColor.set('#ffffff');
 const shirtColor=shirt.color.clone();
 function ball(parent,mat,pos,scale){const o=new THREE.Mesh(sphere,mat);o.position.set(...pos);o.scale.set(...scale);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function line(parent,a,b,r,mat){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),v=q.clone().sub(p);const o=new THREE.Mesh(bone,mat);o.position.copy(p).add(q).multiplyScalar(.5);o.scale.set(r,v.length(),r);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());o.castShadow=true;parent.add(o);return o;}
 function shape(parent,geometry,mat,x,y,z){ownedGeometry.push(geometry);const o=new THREE.Mesh(geometry,mat);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o;}
 // Faixa que acompanha a curva do peito (listras, suspensórios, faixas)
 function chestLine(parent,x1,y1,x2,y2,r,mat){
  const pts=Array.from({length:12},(_,i)=>new THREE.Vector3(...chest(x1+(x2-x1)*i/11,y1+(y2-y1)*i/11,r*.6)));
  return shape(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),24,r,8,false),mat,0,0,0);
 }
 // Two arms and two legs; the segmented abdomen, elytra and antennae retain the cockroach anatomy.
 ball(dancer,shell,[0,.86,-.04],[.33,.6,.27]);
 for(const y of [.45,.58,.71]){
  const k=Math.sqrt(1-((y-.86)/.6)**2),seg=shape(dancer,new THREE.TorusGeometry(1,.03,6,32),dark,0,y,-.04);
  seg.rotation.x=Math.PI/2;seg.scale.set(.33*k+.004,.27*k+.004,1);
 }
 const wings=[];
 for(const side of [-1,1]){
  // Élitros brilhantes dobrados nas costas (antes: disco marrom translúcido atrás do corpo)
  const pivot=new THREE.Group();pivot.name=side<0?'Asa esquerda':'Asa direita';pivot.position.set(side*.12,1.74,-.2);dancer.add(pivot);
  const elytron=ball(pivot,shell,[side*.1,-.62,-.07],[.2,.7,.085]);elytron.rotation.z=side*.06;
  wings.push({pivot,side});
 }
 ball(dancer,shirt,[CHEST.x,CHEST.y,CHEST.z],[CHEST.rx,CHEST.ry,CHEST.rz]);
 const collar=shape(dancer,new THREE.TorusGeometry(.17,.035,10,28),white,0,1.8,.03);collar.rotation.x=Math.PI/2;
 for(let i=0;i<3;i++)ball(dancer,gold,chest(0,1.45-i*.14,.004),[.026,.026,.02]);
 if(variant%3===0)for(const side of [-1,1])chestLine(dancer,side*.2,1.74,side*.17,1.04,.02,white);
 if(variant%3===1)for(let i=0;i<3;i++)chestLine(dancer,-.35,1.2+i*.15,.35,1.2+i*.15,.022,accent);
 const pronotum=ball(dancer,shell,[0,1.84,-.12],[.34,.2,.24]);pronotum.rotation.x=-.22;
 line(dancer,[0,1.72,-.3],[0,.43,-.33],.012,dark);
 // Cabeça redonda e brilhante, com rosto fofo (olhos grandes com brilho, bochechas e sorriso)
 const head=ball(dancer,shell,[0,2.12,.05],[.25,.235,.22]);head.name='Cabeça estreita';
 ball(dancer,muzzle,[0,2.04,.17],[.15,.1,.1]);
 const eyes=[];
 for(const side of [-1,1]){
  eyes.push(ball(dancer,eyeWhite,[side*.105,2.18,.2],[.085,.095,.07]));
  ball(dancer,pupilMat,[side*.1,2.17,.262],[.048,.052,.03]);
  ball(dancer,glintMat,[side*.085,2.2,.292],[.015,.015,.01]);
  ball(dancer,cheekMat,[side*.165,2.05,.2],[.045,.03,.02]);
  ball(dancer,dark,[side*.05,1.955,.235],[.032,.022,.026]);
 }
 const smile=new THREE.Mesh(smileGeometry,dark);smile.position.set(0,2.03,.268);smile.rotation.z=Math.PI;dancer.add(smile);
 const antennae=[];
 for(const side of [-1,1]){
  const p=new THREE.Group();p.position.set(side*.12,2.3,.06);dancer.add(p);
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(),new THREE.Vector3(side*.19,.37,0),new THREE.Vector3(side*.48,.67,.07),new THREE.Vector3(side*.82,.72,.14)]);
  shape(p,new THREE.TubeGeometry(curve,32,.015,8,false),dark,0,0,0);antennae.push(p);
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
  for(const side of [-1,1])chestLine(casual,side*.22,1.74,side*.11,1.0,.032,denim);
  for(const side of [-1,1])ball(casual,accent,chest(side*.07,1.74,.02),[.08,.05,.035]);
 }else if(variant===1||variant===4){
  for(let i=0;i<4;i++){chestLine(casual,-.36,1.14+i*.15,.36,1.14+i*.15,.013,accent);chestLine(casual,-.24+i*.16,1.06,-.24+i*.16,1.74,.011,white);}
 }else if(variant===5||variant===7){
  const skirt=shape(casual,new THREE.ConeGeometry(.49,.68,32,1,true),accent,0,.73,.02);skirt.scale.z=.8;
 }else{
  const tie=shape(casual,new THREE.ConeGeometry(.07,.32,12),accent,...chest(0,1.5,.03));tie.rotation.z=Math.PI;tie.scale.z=.4;
  for(const side of [-1,1])ball(casual,denim,chest(side*.19,1.25,.005),[.09,.08,.025]);
 }
 const hat=new THREE.Group();hat.position.set(0,2.35,.02);dancer.add(hat);
 if(variant===0||variant===5){for(const side of [-1,1])ball(dancer,black,[side*.105,2.18,.282],[.1,.068,.025]);line(dancer,[-.03,2.19,.3],[.03,2.19,.3],.012,gold);}
 if(variant===1){ball(hat,accent,[0,.07,0],[.3,.16,.27]);ball(hat,accent,[0,-.02,.27],[.32,.035,.19]);}
 if(variant===2){const band=shape(hat,new THREE.TorusGeometry(.34,.045,6,18,Math.PI),black,0,-.15,0);for(const side of [-1,1])ball(hat,accent,[side*.34,-.2,0],[.1,.15,.12]);}
 if(variant===3){shape(hat,new THREE.CylinderGeometry(.32,.32,.035,24),denim,0,0,0);shape(hat,new THREE.CylinderGeometry(.19,.22,.23,16),denim,0,.13,0);shape(hat,new THREE.CylinderGeometry(.225,.225,.035,16),accent,0,.06,0);}
 if(variant===4)for(const side of [-1,1]){const m=ball(dancer,dark,[side*.06,2.07,.262],[.07,.024,.03]);m.rotation.z=side*.35;}
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
   ball(costume,white,chest(0,1.43,-.012),[.15,.34,.035]);
   for(const side of [-1,1])ball(costume,black,chest(side*.075,1.73,.02),[.09,.055,.035]);
   ball(costume,black,chest(0,1.73,.035),[.03,.03,.03]);
  }else if(next==='dj'){
   const band=shape(costume,new THREE.TorusGeometry(.33,.05,10,28,Math.PI),accent,0,2.18,.04);
   for(const side of [-1,1])ball(costume,black,[side*.3,2.14,.04],[.1,.15,.12]);
   shape(costume,new THREE.TorusGeometry(.13,.02,8,24),gold,...chest(0,1.3,.01));
  }else if(next==='band'){
   for(const side of [-1,1])chestLine(costume,side*.26,1.72,side*.18,1.05,.026,gold);
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
