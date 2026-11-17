import * as THREE from '/vendor/three/three.module.js';

export function addWeddingDecor(scene){
 const group=new THREE.Group();group.name='Decoração do casamento';scene.add(group);
 const ivory=new THREE.MeshStandardMaterial({color:'#f0e5ce',roughness:.67});
 const icing=new THREE.MeshStandardMaterial({color:'#fff6e5',roughness:.83});
 const gold=new THREE.MeshStandardMaterial({color:'#b99850',metalness:.74,roughness:.25});
 const rose=new THREE.MeshStandardMaterial({color:'#944e5a',roughness:.8});
 const leaf=new THREE.MeshStandardMaterial({color:'#455d43',roughness:.9});
 const cake=new THREE.Group();cake.name='Bolo de casamento';cake.position.set(2.3,0,-1.3);group.add(cake);
 const add=(parent,geometry,material,x,y,z)=>{
  const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
 };
 const cylinder=(radius,height,material,y)=>add(cake,new THREE.CylinderGeometry(radius,radius,height,48),material,0,y,0);
 cylinder(.73,.12,gold,.07);cylinder(.28,.4,gold,.3);cylinder(1.08,.08,ivory,.54);cylinder(1.1,.035,gold,.59);
 const pearlGeometry=new THREE.SphereGeometry(.025,8,6);
 for(const [index,radius,height,y] of [[0,.96,.9,1.06],[1,.71,.78,1.9],[2,.48,.68,2.63]]){
  const tier=cylinder(radius,height,ivory,y);tier.name='Andar do bolo '+(index+1);
  for(const edge of [-1,1]){
   const rim=add(cake,new THREE.TorusGeometry(radius,.025,6,48),icing,0,y+edge*height*.46,0);rim.rotation.x=Math.PI/2;
  }
  const ribbon=cylinder(radius+.004,.07,gold,y-height*.35);
  for(let i=0;i<24;i++){
   const angle=i/24*Math.PI*2;
   add(cake,pearlGeometry,icing,Math.sin(angle)*(radius+.01),y+height*.38,Math.cos(angle)*(radius+.01));
  }
  for(const side of [-1,1]){
   const flower=new THREE.Group();flower.position.set(side*radius*.45,y+.08,radius*.89);cake.add(flower);
   for(let petal=0;petal<5;petal++){
    const angle=petal/5*Math.PI*2;
    const part=add(flower,new THREE.SphereGeometry(.06,8,6),rose,Math.cos(angle)*.055,Math.sin(angle)*.055,0);part.scale.set(1,.6,.45);part.rotation.z=angle;
   }
   add(flower,new THREE.SphereGeometry(.035,8,6),gold,0,0,.025);
   const foliage=add(flower,new THREE.SphereGeometry(.07,8,6),leaf,side*.1,-.055,-.02);foliage.scale.set(.45,1.5,.2);foliage.rotation.z=-side*.6;
  }
 }
 cylinder(.23,.04,icing,3.02);
 for(const side of [-1,1]){
  const ring=add(cake,new THREE.TorusGeometry(.16,.022,8,32),gold,side*.11,3.2,.02);ring.rotation.y=side*.35;
 }
 const glowCanvas=document.createElement('canvas');glowCanvas.width=64;glowCanvas.height=64;
 const ctx=glowCanvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,1,32,32,32);
 gradient.addColorStop(0,'#fff8dc99');gradient.addColorStop(.25,'#ffd7a33d');gradient.addColorStop(1,'#ffd7a300');
 ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
 const glowTexture=new THREE.CanvasTexture(glowCanvas),globes=[];
 const mirror=new THREE.MeshStandardMaterial({color:'#b4b8c0',metalness:.9,roughness:.2,flatShading:true});
 const tileGeometry=new THREE.BoxGeometry(.065,.06,.015),sphereGeometry=new THREE.IcosahedronGeometry(.42,2);
 for(const [i,position] of [[-5.5,5.7,-5],[5.6,5.8,-5],[-6,4.9,3.5],[6,5.1,3.5],[0,6.4,-10]].entries()){
  const globe=new THREE.Group();globe.name='Globo de luz '+(i+1);globe.position.set(...position);group.add(globe);
  add(globe,sphereGeometry,mirror,0,0,0);
  const tiles=new THREE.InstancedMesh(tileGeometry,mirror,128),dummy=new THREE.Object3D();
  for(let row=0;row<8;row++)for(let col=0;col<16;col++){
   const phi=(row+.5)/8*Math.PI,theta=col/16*Math.PI*2;
   const normal=new THREE.Vector3(Math.sin(phi)*Math.cos(theta),Math.cos(phi),Math.sin(phi)*Math.sin(theta));
   dummy.position.copy(normal).multiplyScalar(.425);dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal);dummy.updateMatrix();tiles.setMatrixAt(row*16+col,dummy.matrix);
  }
  globe.add(tiles);
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color:i%2?'#e8b5d2':'#ffe1ac',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
  glow.scale.set(2.2,2.2,1);globe.add(glow);
  add(group,new THREE.CylinderGeometry(.009,.009,1.7,5),gold,position[0],position[1]+1.25,position[2]);
  globes.push({globe,glow});
 }
 const lights=[new THREE.PointLight('#ffd5a0',24,17),new THREE.PointLight('#d7b4e8',20,17)];
 lights[0].position.set(-4,5,1);lights[1].position.set(5,5,-3);lights.forEach(light=>group.add(light));
 return {cake,globes,animate(time,beat){
  globes.forEach(({globe,glow},i)=>{globe.rotation.y=time*(.12+i*.012);glow.material.opacity=.65+Math.sin(time*.7+i)*.08+beat*.06;});
 }};
}
