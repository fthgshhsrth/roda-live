import * as THREE from '/vendor/three/three.module.js';
export function addBackstage(scene){
 const group=new THREE.Group();group.name='Palco da banda e DJ';scene.add(group);
 const dark=new THREE.MeshStandardMaterial({color:'#29243a',metalness:.35,roughness:.5});
 const metal=new THREE.MeshStandardMaterial({color:'#7d7a92',metalness:.75,roughness:.3});
 const neon=new THREE.MeshBasicMaterial({color:'#efbd91'}),blue=new THREE.MeshBasicMaterial({color:'#80a7da'});
 function box(w,h,d,m,x,y,z){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.receiveShadow=true;group.add(o);return o;}
 box(15.7,.8,3.7,dark,0,.15,-10);box(15.7,.05,.05,neon,0,.58,-8.15);
 box(15.7,2.8,.2,dark,0,2,-11.7);
 for(const x of [-7.6,7.6]){box(.12,4.4,.12,metal,x,2.2,-11.5);box(.045,4.3,.045,blue,x,2.2,-11.4);}
 box(15.4,.12,.12,metal,0,4.3,-11.5);
 for(let i=0;i<9;i++)box(.16,.16,.17,i%2?blue:neon,-6.4+i*1.6,4.2,-11.2);
 for(const x of [-7,7]){
  box(.75,2,.65,dark,x,1.55,-9.6);
  for(const y of [1.1,1.9]){const speaker=new THREE.Mesh(new THREE.CircleGeometry(.26,20),metal);speaker.position.set(x,y,-9.255);group.add(speaker);}
 }
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=160;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#ffcfaa';ctx.font='bold 90px sans-serif';ctx.textAlign='center';ctx.fillText('BANDA DO ARRAIÁ',512,110);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const title=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));title.position.set(0,3.6,-11.45);title.scale.set(10,1.56,1);group.add(title);
 const platform=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.6,.6,40),dark);platform.position.set(8.6,.05,-5.8);platform.receiveShadow=true;group.add(platform);
 const rim=new THREE.Mesh(new THREE.TorusGeometry(1.5,.035,6,40),blue);rim.position.set(8.6,.36,-5.8);rim.rotation.x=-Math.PI/2;group.add(rim);
 return group;
}
