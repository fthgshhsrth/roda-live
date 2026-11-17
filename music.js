export function activate(music, file, now = Date.now()) {
  Object.assign(music, {file, playing: true, position: 0, duration: 0, changed: now,
    revision: (music.revision || 0) + 1, queue: []});
}

export function control(music, command, now = Date.now()) {
  if (['ended', 'metadata'].includes(command.action) &&
      (command.file !== music.file || command.revision !== music.revision)) return;
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
    case 'volume': next.volume = numeric(0, 1); break;
    case 'seek': next.position = numeric(0, music.duration || 86400); break;
    case 'metadata': next.duration = numeric(0, 86400 * 7); break;
    default: throw Error('Comando de áudio inválido.');
  }
  Object.assign(music, next);
}
