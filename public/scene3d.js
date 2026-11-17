import * as THREE from '/vendor/three/three.module.js';
import {makeRoach} from './roach.js';
import {overlaps, placeProjectedBubble} from './layout.js';
import {CameraDirector, roseNotice} from './camera-director.js';
import {sceneCast} from './party-layout.js';
import {addBackstage} from './backstage.js';
import {captureProfile} from './capture-profile.js';
import {renderGiftCatalog} from './gift-catalog.js';
import {waltzPose,floorWaltzPosition} from './waltz.js';

const $ = id => document.getElementById(id);
const preview = new URLSearchParams(location.search).has('preview');
document.body.classList.toggle('preview', preview);
let state = {settings: {speed: 1, comments: true}, people: [], music: {}, log: []};
let offset = 0, elapsed = 0, frame = 0, lastTick = performance.now(), lastRender = 0;
let high = new URLSearchParams(location.search).get('quality') !== 'low', toastUntil = 0, toastProtectedUntil = 0,resetUntil=0;
$('quality').textContent = high ? 'Qualidade: Full HD' : 'Qualidade: leve';
const audio = $('audio'), channel = new BroadcastChannel('roda-live-audio');
const ownerId = crypto.randomUUID(); let audioOwner = false, audioKey = '', metadataKey = '';
let audioContext, analyser, frequency;
const send = (endpoint, data) => fetch('/api/' + endpoint, {method: 'POST',
  headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});

function claimAudio() { audioOwner = true; channel.postMessage({claim: ownerId}); }
channel.onmessage = e => {
  if (e.data.claim && e.data.claim !== ownerId && audioOwner) {
    audioOwner = false; audio.pause(); $('enable').hidden = false;
  }
};
if (preview) { audio.muted = true; $('enable').hidden = true; } else claimAudio();
function initializeAnalyser() {
  if (audioContext || preview) return;
  try {
    audioContext = new AudioContext(); analyser = audioContext.createAnalyser(); analyser.fftSize = 128;
    const source = audioContext.createMediaElementSource(audio); source.connect(analyser); analyser.connect(audioContext.destination);
    frequency = new Uint8Array(analyser.frequencyBinCount);
  } catch { /* Playback remains available without beat analysis. */ }
}
async function synchronizeAudio() {
  if (preview || !audioOwner) return;
  const m = state.music;
  if (!m.file) { audio.pause(); return; }
  const key = m.file + ':' + m.revision;
  if (key !== audioKey) { audioKey = key; audio.src = '/music/' + encodeURIComponent(m.file); audio.load(); }
  audio.volume = m.volume ?? .65;
  const position = Math.max(0, m.position + (m.playing ? (Date.now() + offset - m.changed) / 1000 : 0));
  if (audio.readyState && Number.isFinite(audio.duration) && Math.abs(audio.currentTime - position) > 1.5) {
    audio.currentTime = Math.min(position, Math.max(0, audio.duration - .08));
  }
  if (m.playing) {
    try { await audio.play(); $('enable').hidden = true; }
    catch { $('enable').hidden = false; }
  } else audio.pause();
}
audio.onloadedmetadata = () => {
  const m = state.music, key = m.file + ':' + m.revision;
  if (audioOwner && Number.isFinite(audio.duration) && metadataKey !== key) {
    metadataKey = key; void send('music', {action: 'metadata', file: m.file, revision: m.revision, value: audio.duration});
  }
  void synchronizeAudio();
};
audio.onended = () => { if (audioOwner) void send('music', {action: 'ended', file: state.music.file, revision: state.music.revision}); };
$('enable').onclick = async () => { claimAudio(); initializeAnalyser(); await audioContext?.resume(); await synchronizeAudio(); };
$('fullscreen').onclick = () => { if (document.fullscreenElement) void document.exitFullscreen(); else void document.documentElement.requestFullscreen(); };
let toolsTimer;
window.addEventListener('pointermove', () => {
  document.body.classList.add('tools-visible'); clearTimeout(toolsTimer);
  toolsTimer = setTimeout(() => document.body.classList.remove('tools-visible'), 2200);
});
window.addEventListener('keydown', e => { if (e.key.toLowerCase() === 'f') $('fullscreen').click(); });

const renderer = new THREE.WebGLRenderer({canvas: $('scene'), alpha: true, antialias: true, powerPreference: 'high-performance'});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.35;
renderer.shadowMap.enabled = !preview; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, .1, 180);
let director = new CameraDirector(performance.now());
const overviewPosition = new THREE.Vector3(), overviewAim = new THREE.Vector3(0, 1, -2.5);
const cameraAim = overviewAim.clone(), desiredCamera = new THREE.Vector3(), desiredAim = new THREE.Vector3();
let cameraInitialized = false, shot = director.update(performance.now(), []), shownShot = -1;
scene.add(new THREE.HemisphereLight('#e4c3ff', '#24132b', 2.3));
const keyLight = new THREE.DirectionalLight('#ffe3bb', 4.5); keyLight.position.set(-6, 12, 10);
keyLight.castShadow = true; keyLight.shadow.mapSize.set(1024, 1024);
Object.assign(keyLight.shadow.camera, {left: -10, right: 10, top: 10, bottom: -10, near: .5, far: 40});
keyLight.shadow.normalBias = .04; scene.add(keyLight);
const pinkLight = new THREE.PointLight('#e163c4', 60, 25); pinkLight.position.set(-7, 5, -3); scene.add(pinkLight);
const blueLight = new THREE.PointLight('#7a9bff', 65, 25); blueLight.position.set(7, 5, -2); scene.add(blueLight);
const stage = new THREE.Group(); scene.add(stage);
function mesh(geometry, material, y = 0) {
  const object = new THREE.Mesh(geometry, material); object.position.y = y; stage.add(object); return object;
}
const platform = mesh(new THREE.CylinderGeometry(7.8, 8.05, .5, 96),
  new THREE.MeshStandardMaterial({color: '#241c37', metalness: .65, roughness: .32}), -.3);
platform.receiveShadow = true;
const floor = mesh(new THREE.CircleGeometry(7.75, 96), new THREE.MeshStandardMaterial({color: '#302a40', metalness: .5, roughness: .38}), -.035);
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
const neonMaterials = [];
for (const [radius, color, y] of [[7.78, '#ffaf88', -.04], [7.95, '#c576d5', -.36], [5.9, '#a276b6', -.01], [3.5, '#7661ad', -.01]]) {
  const mat = new THREE.MeshBasicMaterial({color}); neonMaterials.push(mat);
  const ring = mesh(new THREE.TorusGeometry(radius, radius > 7 ? .045 : .018, 8, 100), mat, y); ring.rotation.x = -Math.PI / 2;
}
for (let i = 0; i < 48; i++) {
  const tile = mesh(new THREE.BoxGeometry(.16, .018, .45), new THREE.MeshBasicMaterial({color: i % 2 ? '#c786ac' : '#ffb180'}), .003);
  const a = i / 48 * Math.PI * 2; tile.position.set(Math.sin(a) * 7.48, .003, Math.cos(a) * 7.48); tile.rotation.y = a;
}
const consoleBase = mesh(new THREE.CylinderGeometry(1.15, 1.35, .48, 32), new THREE.MeshStandardMaterial({color: '#171124', metalness: .6, roughness: .25}), .22);
const consoleTop = mesh(new THREE.CylinderGeometry(1.13, 1.13, .08, 32), new THREE.MeshStandardMaterial({color: '#d3a8b4', metalness: .8, roughness: .22}), .5);
for (const x of [-.5, .5]) {
  const disc = mesh(new THREE.CylinderGeometry(.35, .35, .04, 24), new THREE.MeshStandardMaterial({color: '#20192d', metalness: .9, roughness: .17}), .56); disc.position.x = x;
}
const disco = mesh(new THREE.IcosahedronGeometry(.56, 2), new THREE.MeshStandardMaterial({color: '#d8c5e4', metalness: .95, roughness: .19}), 5.6);
const wire = mesh(new THREE.CylinderGeometry(.012, .012, 2.2, 6), new THREE.MeshBasicMaterial({color: '#807087'}), 7.25);
disco.position.set(-7.8,6,-5);wire.position.set(-7.8,7.65,-5);
const positions = new Float32Array(96 * 3);
for (let i = 0; i < 96; i++) { positions[i * 3] = Math.sin(i * 137.5) * (8 + i % 4); positions[i * 3 + 1] = (i % 13) * .65 + .2; positions[i * 3 + 2] = Math.cos(i * 137.5) * 8; }
const particlesGeometry = new THREE.BufferGeometry(); particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const particles = new THREE.Points(particlesGeometry, new THREE.PointsMaterial({color: '#eac2df', size: .045, transparent: true, opacity: .6})); scene.add(particles);
addBackstage(scene);

let viewport = {width: 1, height: 1, top: 0, left: 0};
function resize() {
  const bounds = $('viewport').getBoundingClientRect(); viewport = bounds;
  const profile = captureProfile(bounds.width,bounds.height,{high,preview,dpr:devicePixelRatio||1});
  renderer.setPixelRatio(profile.ratio); renderer.setSize(bounds.width, bounds.height, false);
  keyLight.shadow.mapSize.set(profile.shadowSize,profile.shadowSize);
  if(keyLight.shadow.map){keyLight.shadow.map.dispose();keyLight.shadow.map=null;}
  camera.aspect = bounds.width / bounds.height;
  const distance = Math.max(31, 28 / camera.aspect);
  overviewPosition.set(1, distance * .64, distance * .83-2.5);
  if (!cameraInitialized) {camera.position.copy(overviewPosition); cameraAim.copy(overviewAim); cameraInitialized = true;}
  camera.lookAt(cameraAim); camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe($('viewport'));
$('quality').onclick = () => { high = !high; renderer.shadowMap.enabled = high && !preview && characters.size <= 18;
  $('quality').textContent = high ? 'Qualidade: Full HD' : 'Qualidade: leve'; resize(); };
const characters = new Map();
function reconcile(people) {
  const ids = new Set(people.map(p => p.id));
  for (const [id, entry] of characters) if (!ids.has(id)) {
    scene.remove(entry.model.root); entry.model.dispose(); entry.name.remove(); entry.bubble.remove(); entry.line.remove(); characters.delete(id);
  }
  for (const person of people) {
    let entry = characters.get(person.id);
    if (!entry) {
      const model = makeRoach(person); scene.add(model.root);
      const name = document.createElement('div'); name.className = 'name-tag'; name.hidden=true;name.textContent = person.name; $('labels').append(name);
      const bubble = document.createElement('div'); bubble.className = 'comment-bubble'; bubble.hidden = true; $('labels').append(bubble);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('stroke', '#ffdbbe99'); line.setAttribute('stroke-width', '1'); line.style.display = 'none'; $('connectors').append(line);
      entry = {model, name, bubble, line, person}; characters.set(person.id, entry);
    }
    entry.person = person; entry.name.textContent = (person.donor?(person.icon||'🌹')+' ':'')+person.name;
    entry.name.classList.toggle('donor-name',!!person.donor);entry.name.classList.toggle('role-placeholder',!!person.stageResident&&!person.donor);
    entry.model.setRole(person.stageRole||null,person.instrument||null);
  }
  renderer.shadowMap.enabled = high && !preview && characters.size <= 18;
}
const demo = Array.from({length: 8}, (_, i) => ({id: 'roach-demo-' + i, name: ['DJ Casquinha', 'Dona Antena', 'MC Crocante', 'Brilhosa', 'Seu Bigode', 'Patinhas', 'Zé do Passinho', 'Rainha da Pista'][i], demo: true}));
const seenEvents = new Set(); let receivedSnapshot = false,catalogKey='';
function showEventToast(message, entry = false) {
  $('eventToast').textContent = message;
  $('eventToast').classList.toggle('entry-notice', entry);
  toastUntil = Date.now() + 3500;
  if (entry) toastProtectedUntil = Date.now() + 3000;
}
function updateState(next) {
  if(receivedSnapshot&&(next.partyEpoch||0)!==(state.partyEpoch||0)){
    director=new CameraDirector(performance.now());shownShot=-1;shot=director.update(performance.now(),[]);toastProtectedUntil=0;
  }
  state = next; offset = next.serverTime - Date.now(); $('offline').hidden = true;
  document.body.classList.toggle('transparent', !!next.settings.transparent);
  const defaultTitle = !next.settings.title || next.settings.title === 'A RODA É SUA';
  $('sceneTitle').textContent = defaultTitle ? 'ARRAIÁ DAS BARATAS' : next.settings.title;
  $('sceneSubtitle').textContent = next.settings.subtitle === 'Mande uma rosa e entre na roda!' ? 'Uma rosa. Uma barata. Um show à parte.' : next.settings.subtitle;
  $('count').textContent = next.people.length;
  const key=JSON.stringify(next.giftCatalog||[]);
  if(key!==catalogKey){catalogKey=key;renderGiftCatalog($('giftCatalog'),next.giftCatalog||[]);}
  const verified=(next.giftCatalog||[]).filter(g=>g.status==='verified').length;
  $('catalogStatus').textContent=next.catalogStatus==='ready'?(verified===6?'Presentes confirmados na live':verified+'/6 confirmados · veja o painel'):
    next.catalogStatus==='loading'?'Consultando presentes…':next.catalogStatus==='error'?'Catálogo indisponível · veja o painel':'Prévia · confirme ao conectar';
  $('nowTrack').hidden = !next.music.playing || !next.track;
  $('trackLabel').textContent = next.track?.title || '';
  reconcile(sceneCast(next,preview?demo:[]));
  void synchronizeAudio();
  // The first snapshot is a baseline; opening/reconnecting the scene never replays old entries.
  for (const event of [...next.log].reverse()) {
    if (seenEvents.has(event.id)) continue;
    seenEvents.add(event.id);
    if (!receivedSnapshot || next.serverTime - event.at > 15000) continue;
    if(event.effect==='reset'){
      resetUntil=Date.now()+6500;$('finaleName').textContent=event.name+' reiniciou a festa!';showEventToast('🎆 '+event.message,true);
    }
    else if (['marry','bride','band','dj'].includes(event.effect)) director.feature(event, performance.now());
    else if (event.effect === 'join') director.rose(event, performance.now());
    else if (Date.now() >= toastProtectedUntil) showEventToast(event.icon + ' ' + event.message);
  }
  receivedSnapshot = true;
  if (seenEvents.size > 200) {seenEvents.clear(); next.log.forEach(event => seenEvents.add(event.id));}
}
const events = new EventSource('/events'); events.onmessage = e => updateState(JSON.parse(e.data)); events.onerror = () => $('offline').hidden = false;
function project(x, y, z) {
  const v = new THREE.Vector3(x, y, z).project(camera);
  return {x: viewport.left + (v.x + 1) * viewport.width / 2, y: viewport.top + (1 - v.y) * viewport.height / 2, visible: v.z >= -1 && v.z <= 1};
}
function moveCamera(time, dt, entries) {
  const selectable=entries.filter(entry=>entry.person.donor||entry.person.demo);
  const recentIds=[...selectable].sort((a,b)=>Math.max(b.person.joinedAt||0,b.person.lastGiftAt||0)-Math.max(a.person.joinedAt||0,a.person.lastGiftAt||0)).map(entry=>entry.person.id);
  const roles=Object.fromEntries(selectable.map(entry=>[entry.person.id,entry.person.stageRole]));
  shot = director.update(time, selectable.map(entry => entry.person.id),{groomId:state.couple?.groomId,recentIds,roles});
  desiredCamera.copy(overviewPosition); desiredAim.copy(overviewAim);
  const featured = characters.get(shot.targetId);
  if (shot.mode === 'focus' && featured) {
    const root = featured.model.root, scale = root.scale.x;
    desiredAim.set(root.position.x,root.position.y+1.5 * scale + featured.model.dancer.position.y * .3, root.position.z);
    const distance = Math.max(5.6, 4.2 / camera.aspect) * Math.max(.85, scale);
    desiredCamera.copy(desiredAim).add(new THREE.Vector3(.65, 2.1 * scale, distance));
    if(['bride','groom'].includes(featured.person.stageRole)){
      desiredAim.set(0,1.8,.1);desiredCamera.set(.2,4.4,Math.max(7.8,5.3/camera.aspect));
    }else if(featured.person.stageRole==='band'||featured.person.stageRole==='dj'){
      desiredCamera.copy(desiredAim).add(new THREE.Vector3(.35,2.1,Math.max(7,4.5/camera.aspect)));
    }
  }
  const blend = 1 - Math.exp(-dt * 3.2);
  camera.position.lerp(desiredCamera, blend); cameraAim.lerp(desiredAim, blend); camera.lookAt(cameraAim);
  if (shownShot !== shot.token) {
    shownShot = shot.token;
    for (const entry of entries) entry.name.classList.toggle('camera-focus', entry.person.id === shot.targetId);
    if (shot.mode === 'focus' && shot.reason === 'rose') showEventToast(roseNotice(shot.event), true);
    if (shot.mode === 'focus' && shot.reason === 'marry') showEventToast('💍 '+shot.event.name+' se casou! É o novo noivo!',true);
    if(shot.mode==='focus'&&shot.reason==='role')showEventToast(shot.event.icon+' '+shot.event.message,true);
  }
}
let projected = [], bubbleBoxes = [];
function labelLayout(entries, now) {
  const w = innerWidth, h = innerHeight, obstacles = [], active = [],visibleEntries=[];
  const header=$('sceneTitle').getBoundingClientRect();
  const bounds={width:w,minX:viewport.left+10,maxX:viewport.right-10,minY:header.bottom+16,maxY:viewport.bottom-15};
  if(Date.now()<toastUntil){const r=$('eventToast').getBoundingClientRect();obstacles.push({x:r.x-4,y:r.y-4,w:r.width+8,h:r.height+8});}
  for (const entry of entries) {
    const root = entry.model.root, scale = root.scale.x;
    const head = project(root.position.x,root.position.y+3.5 * scale + entry.model.dancer.position.y, root.position.z);
    const feet = project(root.position.x,root.position.y,root.position.z);
    entry.bubble.hidden = true; entry.line.style.display = 'none';
    const visible = head.visible && feet.visible && feet.x > viewport.left && feet.x < viewport.right && feet.y > viewport.top && head.y < viewport.bottom;
    entry.name.hidden = true;
    if (!visible) continue;
    const left = project(root.position.x - 1.1 * scale,root.position.y+1.3, root.position.z);
    const right = project(root.position.x + 1.1 * scale,root.position.y+1.3, root.position.z);
    const body = {x: left.x - 5, y: head.y - 5, w: right.x - left.x + 10, h: feet.y - head.y + 32};
    obstacles.push(body); entry.anchor = {x: head.x, y: head.y};
    visibleEntries.push(entry);
    if (state.settings.comments && entry.person.commentUntil > now && entry.person.comment) active.push(entry);
  }
  const placed = [],featured=visibleEntries.find(e=>shot.mode==='focus'&&e.person.id===shot.targetId&&e.person.donor);
  if(featured&&!active.includes(featured)){
    const name=featured.name;name.hidden=false;
    const box=placeProjectedBubble(featured.anchor,name.offsetWidth,name.offsetHeight,obstacles,[],bounds);
    if(box){name.style.left=box.x+'px';name.style.top=box.y+'px';name.style.zIndex='1900';obstacles.push(box);}else name.hidden=true;
  }
  for (const entry of active.sort((a, b) => b.person.commentUntil - a.person.commentUntil).slice(0,2)) {
    const bubble = entry.bubble,author=document.createElement('strong');author.textContent=entry.person.name;
    bubble.replaceChildren(author,document.createTextNode(entry.person.comment));
    const width = Math.min(preview ? 125 : Math.max(150, w * .24), w * .65, 320);
    bubble.style.width = width + 'px'; bubble.hidden = false;
    const height = bubble.offsetHeight;
    const box = placeProjectedBubble(entry.anchor, width, height, obstacles, placed, bounds);
    if (!box) { bubble.hidden = true; continue; }
    bubble.style.left = box.x + 'px'; bubble.style.top = box.y + 'px'; bubble.style.zIndex = '2000';
    placed.push({...box, x: box.x - 4, y: box.y - 4, w: box.w + 8, h: box.h + 8});
    entry.line.setAttribute('x1', entry.anchor.x); entry.line.setAttribute('y1', entry.anchor.y);
    entry.line.setAttribute('x2', box.x + box.w / 2); entry.line.setAttribute('y2', box.y + box.h);
    entry.line.style.display = '';
  }
  projected = obstacles; bubbleBoxes = placed;
}
function draw(time) {
  requestAnimationFrame(draw);
  if (time - lastRender < 1000 / (preview ? 24 : high ? 60 : 30)-.5) return;
  const dt = Math.min(.08, (time - lastTick) / 1000); lastTick = time; lastRender = time;
  elapsed += dt * (state.settings.speed ?? 1); frame++;
  let beat = state.music.playing ? Math.max(0, Math.sin(elapsed * 7)) * .25 : .05;
  if (analyser && !audio.paused) { analyser.getByteFrequencyData(frequency); beat = frequency.slice(0, 10).reduce((a, b) => a + b, 0) / 2550; }
  const entries = [...characters.values()], dancers=entries.filter(entry=>!entry.person.stageResident),n=dancers.length;
  const counts = n <= 12 ? [n] : n <= 30 ? [Math.ceil(n * .6), Math.floor(n * .4)] : [18, Math.min(18, n - 18), Math.max(0, n - 36)];
  let index = 0;
  counts.forEach((count, ring) => {
    const radius = counts.length === 1 ? 4.7 : counts.length === 2 ? [5.9, 3.2][ring] : [6.2, 4.15, 2.1][ring];
    for (let i = 0; i < count; i++) {
      const entry = dancers[index++]; if (!entry) continue;
      const pose=floorWaltzPosition(i,count,radius,elapsed);
      entry.model.root.position.set(pose.x,.03,pose.z);
      const baseScale = .83 + (entry.model.seed % 4) * .065;
      entry.model.root.scale.setScalar(baseScale * (n > 30 ? .68 : n > 12 ? .85 : 1));
      const greeting = shot.reason === 'rose' && shot.targetId === entry.person.id && !!shot.event?.entered;
      entry.model.animate(elapsed, entry.person, Date.now() + offset, beat, greeting);
      if(!greeting)entry.model.root.rotation.y=pose.rotation;
    }
  });
  for(const entry of entries.filter(entry=>entry.person.stageResident)){
    entry.model.root.position.set(...entry.person.position);
    entry.model.root.scale.setScalar(entry.person.stageRole==='band'?1:.95);entry.model.animate(elapsed,entry.person,Date.now()+offset,beat);
    if(['bride','groom'].includes(entry.person.stageRole)){
      const turn=waltzPose(elapsed).turn,side=entry.person.stageRole==='bride'?-1:1;
      entry.model.root.position.set(side*.72*Math.cos(turn),.55,-side*.72*Math.sin(turn));
      entry.model.root.rotation.y=turn-side*Math.PI/2;
    }
  }
  moveCamera(time, dt, entries);
  disco.rotation.y = elapsed * .3; disco.rotation.z = Math.sin(elapsed) * .12; particles.rotation.y = elapsed * .01;
  particles.material.color.set(state.log[0]?.effect === 'galaxy' && Date.now() + offset - state.log[0].at < 6500 ? '#bf95ff' : '#efb5d6');
  renderer.render(scene, camera);
  if (frame % 2 === 0) labelLayout(entries, Date.now() + offset);
  $('eventToast').classList.toggle('visible', Date.now() < toastUntil);
  $('finale').hidden=Date.now()>=resetUntil;document.body.classList.toggle('party-reset',Date.now()<resetUntil);
}
window.roda3D = {renderer, scene, camera, characters, diagnostics: () => ({frames: frame, calls: renderer.info.render.calls,
  renderWidth:renderer.domElement.width,renderHeight:renderer.domElement.height,
  visibleNames:[...characters.values()].filter(e=>!e.name.hidden).length,
  characters: characters.size, obstacles: projected, bubbles: bubbleBoxes, bubbleOverlap: bubbleBoxes.some(b => projected.some(p => overlaps(b, p))),
  camera: {mode: shot.mode, reason: shot.reason, targetId: shot.targetId, token: shot.token,
    position: camera.position.toArray(), aim: cameraAim.toArray(), distance: camera.position.distanceTo(cameraAim),
    greeting: characters.get(shot.targetId)?.model.isGreeting || false}})};
$('scene').addEventListener('webglcontextlost', e => { e.preventDefault(); $('boot').hidden = false; $('boot').textContent = 'A GPU interrompeu a cena. Reabra a janela ou use o modo leve.'; });
reconcile(preview?demo:[]); resize(); $('boot').hidden = true; requestAnimationFrame(draw);
