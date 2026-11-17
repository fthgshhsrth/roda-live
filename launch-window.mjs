import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT) || 3000;
const base = 'http://localhost:' + port;
const ready = async () => { try { const r = await fetch(base + '/api/state', {signal: AbortSignal.timeout(1500)}); return r.ok; } catch { return false; } };
if (!await ready()) {
  const server = spawn(process.execPath, [path.join(root, 'server.js')], {cwd: root, detached: true, windowsHide: true, stdio: 'ignore'});
  server.unref();
  for (let i = 0; i < 40 && !await ready(); i++) await new Promise(r => setTimeout(r, 500));
  if (!await ready()) throw Error('Não foi possível iniciar o servidor. Execute INICIAR.bat para ver o diagnóstico.');
}
const browsers = [
  path.join(process.env['PROGRAMFILES(X86)'] || 'C:/Program Files (x86)', 'Microsoft/Edge/Application/msedge.exe'),
  path.join(process.env.PROGRAMFILES || 'C:/Program Files', 'Microsoft/Edge/Application/msedge.exe'),
  path.join(process.env.PROGRAMFILES || 'C:/Program Files', 'Google/Chrome/Application/chrome.exe'),
  path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe')
];
const browser = browsers.find(p => fs.existsSync(p));
if (!browser) throw Error('Edge ou Chrome não encontrado. Abra ' + base + '/overlay.html e pressione F.');
const window = spawn(browser, ['--app=' + base + '/overlay.html?window=1', '--window-size=720,1080',
  '--autoplay-policy=no-user-gesture-required', '--no-first-run', '--no-default-browser-check',
  '--user-data-dir=' + path.join(root, 'tools', 'live-window')], {detached: true, stdio: 'ignore', windowsHide: false});
window.on('error', e => console.error(e.message)); window.unref();
console.log('Janela BARATAS NA PISTA aberta. Painel: ' + base);
