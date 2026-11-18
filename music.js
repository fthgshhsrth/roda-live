import fs from 'node:fs';
import path from 'node:path';

// Playlist = todos os MP3 da pasta, na ordem em que foram baixados (o yt-dlp grava com --no-mtime).
export function library(dir) {
  try {
    return fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.mp3'))
      .map(f => ({f, t: fs.statSync(path.join(dir, f)).mtimeMs}))
      .sort((a, b) => a.t - b.t || a.f.localeCompare(b.f)).map(x => x.f);
  } catch { return []; }
}

export function activate(music, file, now = Date.now()) {
  Object.assign(music, {file, playing: true, position: 0, duration: 0, changed: now,
    revision: (music.revision || 0) + 1, queue: []});
}

// tracks: playlist atual. Sem ela, o fim da faixa só para (comportamento antigo).
export function control(music, command, now = Date.now(), tracks = []) {
  if (['ended', 'metadata'].includes(command.action) &&
      (command.file !== music.file || command.revision !== music.revision)) return;
  const at = tracks.indexOf(music.file), step = d => tracks[at < 0 ? 0 : (at + d + tracks.length) % tracks.length];
  if (tracks.length && ['ended', 'next'].includes(command.action)) return activate(music, step(1), now);
  if (tracks.length && command.action === 'prev') return activate(music, step(-1), now);
  if (command.action === 'select') {
    if (!tracks.includes(command.file)) throw Error('Música não encontrada na playlist.');
    return activate(music, command.file, now);
  }
  // Faixa salva que não existe mais no disco: começa pela primeira da playlist.
  if (command.action === 'play' && tracks.length && !tracks.includes(music.file)) return activate(music, tracks[0], now);
  const position = music.position + (music.playing ? (now - music.changed) / 1000 : 0);
  const numeric = (min, max) => {
    const value = Number(command.value);
    if (!Number.isFinite(value)) throw Error('Valor inválido.');
    return Math.min(max, Math.max(min, value));
  };
  let next = {...music, position, changed: now};
  switch (command.action) {
    case 'play': if (!music.file) throw Error('Baixe um vídeo para começar.'); next.playing = true; break;
    case 'pause': next.playing = false; break;
    case 'stop': case 'ended': next.playing = false; next.position = 0; break;
    case 'next': case 'prev': throw Error('A playlist está vazia.');
    case 'volume': next.volume = numeric(0, 1); break;
    case 'seek': next.position = numeric(0, music.duration || 86400); break;
    case 'metadata': next.duration = numeric(0, 86400 * 7); break;
    default: throw Error('Comando de áudio inválido.');
  }
  Object.assign(music, next);
}
