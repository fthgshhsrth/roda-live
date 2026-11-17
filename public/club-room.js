import * as THREE from '/vendor/three/three.module.js';
export function addClubRoom(scene){
 const room=new THREE.Group();room.name='Salão da festa';scene.add(room);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(90,90),new THREE.MeshStandardMaterial({color:'#302230',roughness:.8}));
 floor.rotation.x=-Math.PI/2;floor.position.y=-.6;floor.receiveShadow=true;room.add(floor);
 const wall=new THREE.MeshStandardMaterial({color:'#302338',roughness:.95});
 const back=new THREE.Mesh(new THREE.BoxGeometry(34,18,.4),wall);back.position.set(0,7,-18);room.add(back);
 for(const side of [-1,1]){
  const panel=new THREE.Mesh(new THREE.BoxGeometry(.4,18,70),wall);panel.position.set(side*17,7,9);room.add(panel);
 }
 const strip=new THREE.MeshBasicMaterial({color:'#b08866'});
 for(let i=-16;i<=16;i+=2){const plank=new THREE.Mesh(new THREE.BoxGeometry(.025,.01,70),strip);plank.position.set(i,-.59,9);room.add(plank);}
 const bannerGeometry=new THREE.BufferGeometry();bannerGeometry.setAttribute('position',new THREE.Float32BufferAttribute([-.28,0,0,.28,0,0,0,-.65,0],3));bannerGeometry.computeVertexNormals();
 const flags=new THREE.InstancedMesh(bannerGeometry,new THREE.MeshStandardMaterial({side:THREE.DoubleSide,roughness:.85}),33);
 const dummy=new THREE.Object3D(),colors=['#8d5262','#b68c43','#426c74','#776193'];let index=0;
 for(const z of [-15,-4,7]){
  const points=[];
  for(let i=0;i<=10;i++){
   const x=-13+i*2.6,y=11-Math.sin(i/10*Math.PI)*1.3;points.push(new THREE.Vector3(x,y,z));
   dummy.position.set(x,y,z);dummy.rotation.set(0,.1*Math.sin(i),Math.sin(i)*.08);dummy.updateMatrix();flags.setMatrixAt(index,dummy.matrix);flags.setColorAt(index,new THREE.Color(colors[index%colors.length]));index++;
  }
  room.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),32,.014,4,false),strip));
 }
 room.add(flags);return room;
}
