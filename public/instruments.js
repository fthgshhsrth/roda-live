import * as THREE from '/vendor/three/three.module.js';
export function makeInstrument(kind){
 const root=new THREE.Group(),geometries=[],materials=[];
 const mat=(color,metalness=.1)=>{const m=new THREE.MeshStandardMaterial({color,metalness,roughness:metalness>.5?.27:.55});materials.push(m);return m;};
 const gold=mat('#e8b454',.8),black=mat('#201d30'),white=mat('#fff2d5'),red=mat('#944449'),wood=mat('#774833'),cyan=mat('#69dfd6',.5);
 const mesh=(geometry,material,x,y,z)=>{geometries.push(geometry);const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;root.add(m);return m;};
 const box=(w,h,d,m,x,y,z)=>mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z);
 const cylinder=(r,h,m,x,y,z)=>mesh(new THREE.CylinderGeometry(r,r,h,20),m,x,y,z);
 const rod=(a,b,r,m)=>{const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),delta=q.clone().sub(p);const o=cylinder(r,delta.length(),m,...p.clone().add(q).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return o;};
 const moving=[];
 if(kind==='accordion'){
  const bellows=box(.65,.62,.3,red,0,1.35,.67);moving.push(t=>bellows.scale.x=1+Math.sin(t*4)*.14);
  for(let i=0;i<9;i++)box(.025,.63,.32,gold,-.3+i*.075,1.35,.67);
  box(.22,.78,.39,black,-.48,1.35,.67);box(.22,.78,.39,black,.48,1.35,.67);
  for(let i=0;i<9;i++){box(.17,.066,.04,white,-.48,1.08+i*.067,.89);if(i%3!==0)box(.09,.026,.05,black,-.52,1.11+i*.067,.92);}
  for(let i=0;i<6;i++)cylinder(.022,.03,white,.48,1.1+i*.09,.88).rotation.x=Math.PI/2;
 }else if(kind==='gramophone'){
  box(1.25,.38,.85,wood,0,.78,.85);for(const x of [-.48,.48])rod([x,.1,.7],[x,.65,.7],.035,gold);
  const disc=cylinder(.38,.035,black,-.13,.995,.82);moving.push(t=>disc.rotation.y=t*2);
  cylinder(.09,.04,red,-.13,1.02,.82);rod([.4,1.04,.6],[.2,1.07,1.03],.025,gold);
  const horn=mesh(new THREE.ConeGeometry(.37,.65,24,1,true),gold,.48,1.52,.78);horn.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0),new THREE.Vector3(.25,.5,.8).normalize());
  rod([.43,1.0,.65],[.62,1.36,.7],.065,gold);
 }else if(kind==='drums'){
  const bass=cylinder(.51,.42,red,0,.56,1.0);bass.rotation.x=Math.PI/2;
  const front=cylinder(.47,.025,white,0,.56,1.23);front.rotation.x=Math.PI/2;
  const logo=cylinder(.15,.03,black,0,.56,1.25);logo.rotation.x=Math.PI/2;
  for(const x of [-.68,.68]){cylinder(.29,.24,red,x,1.04,.8);cylinder(.3,.035,white,x,1.18,.8);rod([x,.05,.8],[x,1,.8],.025,gold);}
  for(const x of [-1,1]){rod([x,.05,.45],[x,1.65,.45],.023,gold);const cymbal=cylinder(.4,.025,gold,x,1.67,.45);moving.push(t=>cymbal.rotation.z=Math.sin(t*8+x)*.04);}
  for(const x of [-.4,.4]){const stick=rod([x,1.5,.5],[x,1.38,1.05],.018,wood);moving.push(t=>stick.rotation.x=Math.sin(t*9+x*5)*.35);}
 }else if(kind==='harmonica'){
  box(.68,.17,.19,gold,0,2.03,.63);box(.67,.035,.2,white,0,2.12,.63);
  for(let i=0;i<8;i++)box(.045,.06,.015,black,-.27+i*.077,2.03,.735);
 }else if(kind==='saxophone'){
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(.05,2.0,.54),new THREE.Vector3(.3,1.85,.67),new THREE.Vector3(.22,1.15,.75),new THREE.Vector3(.56,1.0,.81),new THREE.Vector3(.68,1.35,.81)]);
  mesh(new THREE.TubeGeometry(curve,28,.065,8,false),gold,0,0,0);
  const bell=mesh(new THREE.ConeGeometry(.25,.42,24,1,true),gold,.68,1.4,.81);bell.rotation.z=Math.PI+.15;
  const rim=mesh(new THREE.TorusGeometry(.25,.025,8,24),gold,.65,1.61,.81);rim.rotation.x=Math.PI/2;
  for(let i=0;i<7;i++)box(.13,.025,.045,white,.26,1.2+i*.09,.825);
  box(.14,.045,.06,black,.03,2.01,.56);
 }else if(kind==='dj'){
  box(1.8,.17,.85,black,0,1.05,.83);box(1.7,.7,.1,red,0,.61,1.17);
  for(const x of [-.5,.5]){const disc=cylinder(.29,.035,black,x,1.16,.85);moving.push(t=>disc.rotation.y=t*(x<0?2:-2));cylinder(.09,.045,x<0?cyan:gold,x,1.19,.85);}
  for(let i=0;i<5;i++)box(.035,.04,.25,white,-.17+i*.08,1.17,.83);
  for(const x of [-.7,.7])rod([x,.05,.82],[x,1,.82],.05,black);
 }
 return {root,animate(t){moving.forEach(fn=>fn(t));},dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
