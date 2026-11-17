import * as THREE from '/vendor/three/three.module.js';
import {makeRoach} from './roach.js';
import {overlaps, placeProjectedBubble} from './layout.js';

const $ = id => document.getElementById(id);
const preview = new URLSearchParams(location.search).has('preview');
document.body.classList.toggle('preview', preview);
let state = {settings: {speed: 1, comments: true}, people: [], music: {}, log: []};
let offset = 0, elapsed = 0, frame = 0, lastTick = performance.now(), lastRender = 0;
let high = new URLSearchParams(location.search).get('quality') !== 'low', lastEvent = '', toastUntil = 0;
$('quality').textContent = high ? 'Qualidade: alta' : 'Qualidade: leve';
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
scene.add(new THREE.HemisphereLight('#e4c3ff', '#24132b', 2.3));
const keyLight = new THREE.DirectionalLight('#ffe3bb', 4); keyLight.position.set(-6, 12, 10);
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
const positions = new Float32Array(96 * 3);
for (let i = 0; i < 96; i++) { positions[i * 3] = Math.sin(i * 137.5) * (8 + i % 4); positions[i * 3 + 1] = (i % 13) * .65 + .2; positions[i * 3 + 2] = Math.cos(i * 137.5) * 8; }
const particlesGeometry = new THREE.BufferGeometry(); particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const particles = new THREE.Points(particlesGeometry, new THREE.PointsMaterial({color: '#eac2df', size: .045, transparent: true, opacity: .6})); scene.add(particles);

let viewport = {width: 1, height: 1, top: 0, left: 0};
function resize() {
  const bounds = $('viewport').getBoundingClientRect(); viewport = bounds;
  const ratio = Math.min(devicePixelRatio || 1, high && !preview ? 2 : 1, 2400 / Math.max(bounds.width, bounds.height));
  renderer.setPixelRatio(ratio); renderer.setSize(bounds.width, bounds.height, false);
  camera.aspect = bounds.width / bounds.height;
  const distance = Math.max(26, 24 / camera.aspect);
  camera.position.set(0, distance * .64, distance * .83); camera.lookAt(0, .7, 0); camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe($('viewport'));
$('quality').onclick = () => { high = !high; renderer.shadowMap.enabled = high && !preview && characters.size <= 18;
  $('quality').textContent = high ? 'Qualidade: alta' : 'Qualidade: leve'; resize(); };
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
      const name = document.createElement('div'); name.className = 'name-tag'; name.textContent = person.name; $('labels').append(name);
      const bubble = document.createElement('div'); bubble.className = 'comment-bubble'; bubble.hidden = true; $('labels').append(bubble);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('stroke', '#ffdbbe99'); line.setAttribute('stroke-width', '1'); line.style.display = 'none'; $('connectors').append(line);
      entry = {model, name, bubble, line, person}; characters.set(person.id, entry);
    }
    entry.person = person; entry.name.textContent = person.name;
  }
  renderer.shadowMap.enabled = high && !preview && characters.size <= 18;
}
const demo = Array.from({length: 8}, (_, i) => ({id: 'roach-demo-' + i, name: ['DJ Casquinha', 'Dona Antena', 'MC Crocante', 'Brilhosa', 'Seu Bigode', 'Patinhas', 'Zé do Passinho', 'Rainha da Pista'][i], demo: true}));
function updateState(next) {
  state = next; offset = next.serverTime - Date.now(); $('offline').hidden = true;
  document.body.classList.toggle('transparent', !!next.settings.transparent);
  const defaultTitle = !next.settings.title || next.settings.title === 'A RODA É SUA';
  if (defaultTitle) $('sceneTitle').innerHTML = 'BARATAS <br>NA PISTA<span>!</span>'; else $('sceneTitle').textContent = next.settings.title;
  $('sceneSubtitle').textContent = next.settings.subtitle === 'Mande uma rosa e entre na roda!' ? 'Uma rosa. Uma barata. Um show à parte.' : next.settings.subtitle;
  $('count').textContent = next.people.length;
  $('demoHint').hidden = next.people.length > 0;
  $('nowTrack').hidden = !next.music.playing || !next.track;
  $('trackLabel').textContent = next.track?.title || '';
  const event = next.log[0];
  if (event && event.id !== lastEvent) {
    lastEvent = event.id;
    if (next.serverTime - event.at < 6500) { $('eventToast').textContent = event.icon + ' ' + event.message; toastUntil = Date.now() + 5000; }
  }
  reconcile(next.people.length ? next.people : demo); void synchronizeAudio();
}
const events = new EventSource('/events'); events.onmessage = e => updateState(JSON.parse(e.data)); events.onerror = () => $('offline').hidden = false;
function project(x, y, z) {
  const v = new THREE.Vector3(x, y, z).project(camera);
  return {x: viewport.left + (v.x + 1) * viewport.width / 2, y: viewport.top + (1 - v.y) * viewport.height / 2};
}
let projected = [], bubbleBoxes = [];
function labelLayout(entries, now) {
  const w = innerWidth, h = innerHeight, obstacles = [], active = [];
  for (const entry of entries) {
    const root = entry.model.root, scale = root.scale.x;
    const head = project(root.position.x, 3.5 * scale + entry.model.dancer.position.y, root.position.z);
    const feet = project(root.position.x, 0, root.position.z);
    const left = project(root.position.x - 1.1 * scale, 1.3, root.position.z);
    const right = project(root.position.x + 1.1 * scale, 1.3, root.position.z);
    const body = {x: left.x - 5, y: head.y - 5, w: right.x - left.x + 10, h: feet.y - head.y + 32};
    obstacles.push(body); entry.anchor = {x: head.x, y: head.y};
    entry.name.style.left = feet.x + 'px'; entry.name.style.top = feet.y + 5 + 'px';
    entry.name.style.zIndex = Math.round(feet.y);
    const nameRect = entry.name.getBoundingClientRect();
    obstacles.push({x: nameRect.x - 3, y: nameRect.y - 3, w: nameRect.width + 6, h: nameRect.height + 6});
    entry.bubble.hidden = true; entry.line.style.display = 'none';
    if (state.settings.comments && entry.person.commentUntil > now && entry.person.comment) active.push(entry);
  }
  const placed = [], hud = $('sceneTitle').getBoundingClientRect();
  const minY = Math.max(hud.bottom + 26, h * .24), maxY = h * .77;
  for (const entry of active.sort((a, b) => b.person.commentUntil - a.person.commentUntil)) {
    const bubble = entry.bubble; bubble.textContent = entry.person.comment;
    const width = Math.min(preview ? 125 : Math.max(150, w * .24), w * .65, 320);
    bubble.style.width = width + 'px'; bubble.hidden = false;
    const height = bubble.offsetHeight;
    const box = placeProjectedBubble(entry.anchor, width, height, obstacles, placed, {width: w, minY, maxY});
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
  if (time - lastRender < 1000 / (preview || !high ? 30 : 60)) return;
  const dt = Math.min(.08, (time - lastTick) / 1000); lastTick = time; lastRender = time;
  elapsed += dt * (state.settings.speed ?? 1); frame++;
  let beat = state.music.playing ? Math.max(0, Math.sin(elapsed * 7)) * .25 : .05;
  if (analyser && !audio.paused) { analyser.getByteFrequencyData(frequency); beat = frequency.slice(0, 10).reduce((a, b) => a + b, 0) / 2550; }
  const entries = [...characters.values()], n = entries.length;
  const counts = n <= 12 ? [n] : n <= 30 ? [Math.ceil(n * .6), Math.floor(n * .4)] : [18, Math.min(18, n - 18), Math.max(0, n - 36)];
  let index = 0;
  counts.forEach((count, ring) => {
    const radius = counts.length === 1 ? 4.7 : counts.length === 2 ? [5.9, 3.2][ring] : [6.2, 4.15, 2.1][ring];
    for (let i = 0; i < count; i++) {
      const entry = entries[index++]; if (!entry) continue;
      const angle = i / count * Math.PI * 2 + elapsed * .09 * (ring % 2 ? -1 : 1);
      entry.model.root.position.set(Math.sin(angle) * radius, .03, Math.cos(angle) * radius);
      const baseScale = .83 + (entry.model.seed % 4) * .065;
      entry.model.root.scale.setScalar(baseScale * (n > 30 ? .68 : n > 12 ? .85 : 1));
      entry.model.animate(elapsed, entry.person, Date.now() + offset, beat);
    }
  });
  disco.rotation.y = elapsed * .3; disco.rotation.z = Math.sin(elapsed) * .12; particles.rotation.y = elapsed * .01;
  particles.material.color.set(state.log[0]?.effect === 'galaxy' && Date.now() + offset - state.log[0].at < 6500 ? '#bf95ff' : '#efb5d6');
  renderer.render(scene, camera);
  if (frame % 2 === 0) labelLayout(entries, Date.now() + offset);
  $('eventToast').classList.toggle('visible', Date.now() < toastUntil);
}
window.roda3D = {renderer, scene, camera, characters, diagnostics: () => ({frames: frame, calls: renderer.info.render.calls,
  characters: characters.size, obstacles: projected, bubbles: bubbleBoxes, bubbleOverlap: bubbleBoxes.some(b => projected.some(p => overlaps(b, p)))})};
$('scene').addEventListener('webglcontextlost', e => { e.preventDefault(); $('boot').hidden = false; $('boot').textContent = 'A GPU interrompeu a cena. Reabra a janela ou use o modo leve.'; });
reconcile(demo); resize(); $('boot').hidden = true; requestAnimationFrame(draw);
