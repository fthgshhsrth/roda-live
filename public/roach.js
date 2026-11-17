import * as THREE from '/vendor/three/three.module.js';

const sphere = new THREE.SphereGeometry(1, 18, 12);
const capsule = new THREE.CylinderGeometry(1, 1, 1, 8);
const white = new THREE.MeshStandardMaterial({color: '#fff3d2', roughness: .38});
const black = new THREE.MeshStandardMaterial({color: '#100b17', roughness: .22});
const shoe = new THREE.MeshStandardMaterial({color: '#e9e2ff', roughness: .5});
const palettes = ['#bd6932', '#72a47a', '#9666bd', '#e2ae46', '#456b93', '#a54867', '#58362b', '#c2b7a2'];
const heartCanvas = document.createElement('canvas'); heartCanvas.width = heartCanvas.height = 64;
const heartContext = heartCanvas.getContext('2d'); heartContext.fillStyle = '#ff82c7';
heartContext.beginPath(); heartContext.moveTo(32, 56); heartContext.bezierCurveTo(1, 35, 1, 7, 20, 8);
heartContext.bezierCurveTo(28, 8, 32, 14, 32, 17); heartContext.bezierCurveTo(35, 6, 61, 2, 62, 22);
heartContext.bezierCurveTo(62, 36, 44, 48, 32, 56); heartContext.fill();
const heartMaterial = new THREE.SpriteMaterial({map: new THREE.CanvasTexture(heartCanvas), transparent: true, depthWrite: false});

export function characterSeed(id) {
  let n = 2166136261;
  for (const c of String(id)) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
  return n >>> 0;
}

export function makeRoach(person) {
  const seed = characterSeed(person.id), variant = seed % 6;
  const root = new THREE.Group(), dancer = new THREE.Group(); root.add(dancer);
  const material = new THREE.MeshPhysicalMaterial({color: palettes[seed % palettes.length],
    metalness: .42, roughness: .29, clearcoat: .8, clearcoatRoughness: .22});
  const dark = new THREE.MeshStandardMaterial({color: new THREE.Color(palettes[seed % palettes.length]).multiplyScalar(.48), roughness: .45});
  const accent = new THREE.MeshStandardMaterial({color: new THREE.Color().setHSL((seed % 360) / 360, .8, .65), metalness: .3, roughness: .3});
  const ownGeometry = [], ownMaterials = [material, dark, accent];
  function ball(parent, mat, pos, scale) {
    const mesh = new THREE.Mesh(sphere, mat); mesh.position.set(...pos); mesh.scale.set(...scale);
    mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function limb(parent, start, end, radius, mat) {
    const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end), delta = b.clone().sub(a);
    const mesh = new THREE.Mesh(capsule, mat); mesh.position.copy(a).add(b).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.clone().normalize());
    mesh.scale.set(radius, delta.length(), radius); mesh.castShadow = true; parent.add(mesh); return mesh;
  }
  const width = .9 + (seed % 5) * .05;
  ball(dancer, dark, [0, 1.05, 0], [.54 * width, .82, .36]);
  for (const side of [-1, 1]) {
    const wing = ball(dancer, material, [side * .235 * width, 1.13, .16], [.285 * width, .72, .29]);
    wing.rotation.z = side * -.08;
  }
  for (let i = 0; i < 5; i++) {
    limb(dancer, [-.28 + i * .012, .58 + i * .19, .401], [.28 - i * .012, .58 + i * .19, .401], .016, dark);
  }
  ball(dancer, material, [0, 1.89, .1], [.38 * width, .35, .32]);
  const eyes = [];
  for (const side of [-1, 1]) {
    eyes.push(ball(dancer, white, [side * .205, 1.98, .36], [.17, .19, .12]));
    ball(dancer, black, [side * .205, 1.98, .466], [.075, .095, .042]);
    ball(dancer, white, [side * .19 - .02, 2.02, .5], [.025, .03, .015]);
  }
  limb(dancer, [-.1, 1.75, .407], [0, 1.71, .43], .018, black);
  limb(dancer, [0, 1.71, .43], [.1, 1.75, .407], .018, black);
  const antennae = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(side * .19, 2.15, .02); dancer.add(pivot);
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(side * .25, .42, 0), new THREE.Vector3(side * .65, .6, .13)]);
    const geometry = new THREE.TubeGeometry(curve, 14, .024, 6, false); ownGeometry.push(geometry);
    pivot.add(new THREE.Mesh(geometry, dark)); ball(pivot, accent, [side * .65, .6, .13], [.055, .055, .055]); antennae.push(pivot);
  }
  // Three articulated pairs: two arm pairs and the bottom dancing legs.
  const limbs = []; let greetingActive = false;
  for (const side of [-1, 1]) for (let row = 0; row < 3; row++) {
    const pivot = new THREE.Group(); pivot.position.set(side * (.37 + row * .025), 1.5 - row * .48, 0); dancer.add(pivot);
    let hand, fingers;
    if (row < 2) {
      limb(pivot, [0, 0, 0], [side * .43, -.15, .06], .045, dark);
      limb(pivot, [side * .43, -.15, .06], [side * .62, .08, .16], .04, material);
      hand = ball(pivot, accent, [side * .63, .08, .16], [.1, .095, .09]);
      if (row === 0 && side === 1) {
        fingers = new THREE.Group(); fingers.visible = false; hand.add(fingers);
        for (let i = -1; i <= 1; i++) ball(fingers, accent, [i * .48, .8, 0], [.2, .65, .28]);
        ball(fingers, accent, [-1, .1, .05], [.6, .23, .28]);
      }
    } else {
      limb(pivot, [0, 0, 0], [side * .2, -.28, .02], .055, dark);
      limb(pivot, [side * .2, -.28, .02], [side * .12, -.48, .18], .05, material);
      ball(pivot, variant === 5 ? accent : shoe, [side * .13, -.48, .22], [.19, .1, .28]);
    }
    limbs.push({pivot, side, row, hand, fingers});
  }
  const hat = new THREE.Group(); hat.position.set(0, 2.14, .04); dancer.add(hat);
  if (variant === 0) { // Sunglasses.
    for (const side of [-1, 1]) ball(dancer, black, [side * .21, 2, .49], [.21, .13, .05]);
    limb(dancer, [-.15, 2.01, .5], [.15, 2.01, .5], .03, accent);
  } else if (variant === 1) { // Party cone.
    const geometry = new THREE.ConeGeometry(.27, .6, 14); ownGeometry.push(geometry);
    const cone = new THREE.Mesh(geometry, accent); cone.position.y = .28; hat.add(cone);
    ball(hat, white, [0, .6, 0], [.08, .08, .08]);
  } else if (variant === 2) { // Headphones.
    const geometry = new THREE.TorusGeometry(.4, .055, 8, 20, Math.PI); ownGeometry.push(geometry);
    const band = new THREE.Mesh(geometry, accent); band.position.y = -.13; hat.add(band);
    for (const side of [-1, 1]) ball(dancer, accent, [side * .4, 1.96, .03], [.12, .2, .17]);
  } else if (variant === 3) {
    ball(hat, accent, [0, .09, .01], [.34, .18, .29]); ball(hat, accent, [0, -.02, .32], [.36, .045, .24]);
  } else if (variant === 4) {
    for (const side of [-1, 1]) ball(dancer, white, [side * .15, 1.73, .45], [.14, .07, .055]);
  }
  const crown = new THREE.Group(); crown.position.set(0, 2.2, .1); crown.visible = false; dancer.add(crown);
  for (let i = -1; i <= 1; i++) {
    const geometry = new THREE.ConeGeometry(.095, .3 + (i === 0 ? .1 : 0), 4); ownGeometry.push(geometry);
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({color: '#ffe17b', metalness: .75, roughness: .2}));
    ownMaterials.push(mesh.material); mesh.position.set(i * .19, .18, 0); crown.add(mesh);
  }
  const auraGeometry = new THREE.TorusGeometry(.8, .025, 6, 36); ownGeometry.push(auraGeometry);
  const auraMaterial = new THREE.MeshBasicMaterial({color: '#ffb5eb'}); ownMaterials.push(auraMaterial);
  const aura = new THREE.Mesh(auraGeometry, auraMaterial); aura.rotation.x = -Math.PI / 2; aura.position.y = .04; root.add(aura); aura.visible = false;
  const hearts = Array.from({length: 3}, () => {const sprite = new THREE.Sprite(heartMaterial);sprite.visible = false;sprite.scale.setScalar(.33);dancer.add(sprite);return sprite;});
  const scale = .83 + (seed % 4) * .065; root.scale.setScalar(scale);
  const originalColor=material.color.clone(),weddingCostumes=new Map();let weddingRole=null,weddingOutfit=null;
  function setWeddingRole(role){
    if(role===weddingRole)return;
    weddingRole=role;hat.visible=!role;material.color.copy(originalColor);
    if(weddingOutfit){weddingOutfit.visible=false;weddingOutfit=null;}
    if(!role)return;
    material.color.set(role==='bride'?'#f9e7c5':'#211a2e');
    if(weddingCostumes.has(role)){weddingOutfit=weddingCostumes.get(role);weddingOutfit.visible=true;return;}
    weddingOutfit=new THREE.Group();dancer.add(weddingOutfit);
    weddingCostumes.set(role,weddingOutfit);
    const fabric=new THREE.MeshStandardMaterial({color:role==='bride'?'#fff3df':'#191629',roughness:.7});ownMaterials.push(fabric);
    material.color.set(role==='bride'?'#f9e7c5':'#211a2e');
    if(role==='bride'){
      const skirtGeometry=new THREE.ConeGeometry(.69,1.2,24);ownGeometry.push(skirtGeometry);
      const skirt=new THREE.Mesh(skirtGeometry,fabric);skirt.position.y=.65;skirt.castShadow=true;weddingOutfit.add(skirt);
      const veilMaterial=new THREE.MeshStandardMaterial({color:'#fff9f3',transparent:true,opacity:.55,side:THREE.DoubleSide,roughness:1});ownMaterials.push(veilMaterial);
      const veilGeometry=new THREE.PlaneGeometry(1,1.4);ownGeometry.push(veilGeometry);
      const veil=new THREE.Mesh(veilGeometry,veilMaterial);veil.position.set(0,1.65,-.3);weddingOutfit.add(veil);
      for(let i=-1;i<=1;i++)ball(weddingOutfit,white,[i*.16,2.21,.08],[.12,.08,.1]);
    }else{
      ball(weddingOutfit,white,[0,1.22,.43],[.21,.48,.045]);
      for(const side of [-1,1])ball(weddingOutfit,accent,[side*.12,1.61,.49],[.14,.085,.05]);
      for(let i=0;i<3;i++)ball(weddingOutfit,black,[0,1.35-i*.16,.49],[.025,.025,.02]);
    }
  }
  return {root, dancer, seed, variant, material,
    setWeddingRole,get weddingRole(){return weddingRole;},
    get isGreeting() { return greetingActive; },
    get greetingArm() { return limbs.find(limb => limb.row === 0 && limb.side === 1).pivot; },
    animate(t, person, now, beat = 0, greeting = false) {
      greetingActive = greeting;
      const phase = t * (4.2 + variant * .23) + seed % 100;
      const effect = person.effectUntil > now ? person.effect : '';
      dancer.position.y = Math.abs(Math.sin(phase)) * (.07 + beat * .13) + (effect === 'jump' ? Math.abs(Math.sin(t * 8)) * .95 : 0);
      dancer.rotation.z = Math.sin(phase / 2) * (.12 + variant * .015);
      dancer.rotation.x = Math.cos(phase) * .07;
      root.rotation.y = Math.sin(phase / 3) * .25;
      if (greeting) { root.rotation.y = .1; dancer.rotation.z *= .2; dancer.rotation.x = 0; }
      for (const {pivot, side, row, hand, fingers} of limbs) {
        pivot.rotation.z = side * Math.sin(phase + row * 1.4 + (side < 0 ? Math.PI : 0)) * (row === 2 ? .3 : .65);
        pivot.rotation.x = Math.sin(phase + row) * .3;
        if (fingers) fingers.visible = greeting;
        if (hand) hand.scale.set(.1, .095, .09);
        if (greeting && row === 0 && side === 1) {
          // Keep the palm next to the face and wave independently of dance speed.
          pivot.rotation.z = 1.25 + Math.sin(now * .011) * .32;
          pivot.rotation.x = -.2 + Math.cos(now * .011) * .1;
          hand.scale.set(.145, .15, .11);
        }
      }
      antennae.forEach((a, i) => { a.rotation.z = Math.sin(phase * .7 + i) * .16; });
      crown.visible = effect === 'king';
      hearts.forEach((heart, i) => {heart.visible = effect === 'heart'||!!weddingRole;heart.position.set(Math.sin(t * 2 + i * 2) * .7, 2.5 + (t * .5 + i * .3) % .9, .35);});
      aura.visible = effect !== '';
      aura.material.color.set(effect === 'heart' ? '#ff75c5' : effect === 'galaxy' ? '#a799ff' : '#c5ff8c');
      aura.scale.setScalar(1 + Math.sin(t * 5) * .09);
      material.emissive.set(effect === 'glow' ? '#855c20' : effect === 'galaxy' ? '#39165b' : '#000000');
      eyes.forEach(eye => eye.scale.y = Math.sin(t * 1.7 + seed) > .998 ? .045 : .19);
    },
    dispose() { ownGeometry.forEach(g => g.dispose()); ownMaterials.forEach(m => m.dispose()); }
  };
}
