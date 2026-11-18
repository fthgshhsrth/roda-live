import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {StringDecoder} from 'node:string_decoder';

export function videoURL(raw) {
  let url;
  try { url = new URL(raw); } catch { throw Error('Cole o link completo do vídeo.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw Error('Use uma URL HTTP ou HTTPS de vídeo.');
  }
  if (/^(localhost|127\.|0\.|\[::1\])/.test(url.hostname)) throw Error('Use um link de um site de vídeos.');
  return url.href;
}

export function executable(root, name) {
  const local = path.join(root, 'tools', process.platform === 'win32' ? name + '.exe' : name);
  return fs.existsSync(local) ? local : name;
}

// Playlist de verdade (/playlist ou ?list=). Os "Mix" automáticos do YouTube (list=RD…) não contam: são quase infinitos.
export function isPlaylist(raw) {
  const url = new URL(raw), list = url.searchParams.get('list');
  return url.pathname.startsWith('/playlist') || (!!list && !/^RD/i.test(list));
}
export const PLAYLIST_LIMIT = 50;

export function downloadArgs(url, root, musicDir) {
  const list = isPlaylist(url) ? ['--yes-playlist', '--playlist-end', String(PLAYLIST_LIMIT), '--ignore-errors'] : ['--no-playlist'];
  const args = ['--ignore-config', ...list, '--no-mtime', '--no-overwrites', '--windows-filenames',
    '--encoding', 'utf-8', '--newline', '--no-quiet', '--progress', '--socket-timeout', '25',
    '--retries', '2', '--max-filesize', '1G', '--match-filter', '!is_live',
    '--js-runtimes', 'node:' + process.execPath, '-f', 'bestaudio/best', '-x',
    '--audio-format', 'mp3', '--audio-quality', '0', '-P', musicDir,
    '-o', '%(title).150B [%(id)s].%(ext)s', '--print', 'after_move:RODA_FILE:%(filepath)s'];
  const ffmpeg = executable(root, 'ffmpeg');
  if (ffmpeg !== 'ffmpeg') args.push('--ffmpeg-location', path.dirname(ffmpeg));
  return [...args, '--', url];
}

export function startDownload(raw, {root, musicDir, onUpdate, onComplete}) {
  const url = videoURL(raw), playlist = isPlaylist(url);
  const job = {id: Date.now(), phase: 'running', message: playlist ? 'Abrindo playlist…' : 'Abrindo vídeo…', url};
  const child = spawn(executable(root, 'yt-dlp'), downloadArgs(url, root, musicDir),
    {cwd: root, windowsHide: true, shell: false});
  const files = []; let tail = '', cancelled = false;
  const notify = () => onUpdate(job);
  const consume = line => {
    tail = (tail + '\n' + line).slice(-4000);
    if (line.startsWith('RODA_FILE:')) {
      const resolved = path.resolve(line.slice(10).trim());
      if (path.dirname(resolved).toLowerCase() === musicDir.toLowerCase() && resolved.endsWith('.mp3')) {
        files.push(path.basename(resolved));
        // a primeira música da playlist já começa a tocar enquanto o resto baixa
        if (playlist && files.length === 1) onComplete(files.slice(), true);
        if (playlist) job.message = files.length + ' música(s) prontas · baixando o resto…';
      }
    } else if (line.trim()) {
      job.message = line.replace(/^\[[^\]]+\]\s*/, '').slice(0, 300);
    }
    notify();
  };
  for (const stream of [child.stdout, child.stderr]) {
    const decoder = new StringDecoder('utf8'); let pending = '';
    stream.on('data', chunk => {
      pending += decoder.write(chunk);
      const lines = pending.split(/\r?\n/); pending = lines.pop(); lines.forEach(consume);
    });
    stream.on('end', () => { pending += decoder.end(); if (pending) consume(pending); });
  }
  const cancel = () => {
    if (job.phase !== 'running' || cancelled) return;
    cancelled = true;
    if (child.pid && process.platform === 'win32') {
      const killer = spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], {windowsHide: true});
      killer.on('error', () => child.kill());
    } else child.kill();
  };
  const timer = setTimeout(cancel, (playlist ? 4 : 1) * 60 * 60 * 1000);
  child.on('error', error => {
    clearTimeout(timer); job.phase = 'error';
    job.message = error.code === 'ENOENT' ? 'yt-dlp não encontrado. Instale as ferramentas de áudio.' : error.message;
    notify();
  });
  child.on('close', code => {
    clearTimeout(timer);
    if (job.phase === 'error') return;
    if (cancelled) { job.phase = 'cancelled'; job.message = 'Download cancelado.'; }
    else {
      const ready = files.filter(f => fs.existsSync(path.join(musicDir, f)));
      // playlist com --ignore-errors sai com código 1 se algum vídeo falhar; o que baixou continua valendo
      if (ready.length && (code === 0 || playlist)) {
        job.phase = 'done'; job.file = ready[0]; job.files = ready;
        job.message = playlist ? ready.length + ' música(s) na playlist · tocando em sequência' : 'MP3 pronto · reprodução iniciada na live';
        if (!playlist) onComplete(ready, false);
      } else { job.phase = 'error'; job.message = tail.slice(-1000) || 'O site não disponibilizou áudio para este vídeo.'; }
    }
    notify();
  });
  return {job, cancel};
}
