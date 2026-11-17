export const CAMERA_TIMING = Object.freeze({overview: 8000, random: 4500, rose: 5000, return: 2500, maxRose: 8000});

// Scheduling is independent of animation speed and contains no Three.js objects.
export class CameraDirector {
  constructor(now = 0, random = Math.random) {
    this.random = random;
    this.mode = 'overview'; this.reason = null; this.targetId = null; this.event = null;
    this.startedAt = now; this.until = Infinity; this.nextRandomAt = now + CAMERA_TIMING.overview;
    this.overviewUntil = now; this.token = 0; this.queue = []; this.lastRandomId = null;
  }

  rose(event, now) {
    if (!event.person) return;
    if (this.mode === 'focus' && this.reason === 'rose' && this.targetId === event.person) {
      this.until = Math.min(this.startedAt + CAMERA_TIMING.maxRose, now + CAMERA_TIMING.rose);
      return;
    }
    const queued = this.queue.find(item => item.person === event.person);
    if (queued) Object.assign(queued, event, {entered: queued.entered || event.entered});
    else { this.queue.push({...event}); if (this.queue.length > 48) this.queue.shift(); }
  }

  overview(now) {
    this.mode = 'overview'; this.reason = null; this.targetId = null; this.event = null;
    this.startedAt = now; this.until = Infinity; this.overviewUntil = now + CAMERA_TIMING.return;
    this.nextRandomAt = now + CAMERA_TIMING.overview; this.token++;
  }

  focus(id, reason, event, now) {
    this.mode = 'focus'; this.reason = reason; this.targetId = id; this.event = event;
    this.startedAt = now; this.until = now + CAMERA_TIMING[reason]; this.token++;
    if (reason === 'random') this.lastRandomId = id;
  }

  update(now, ids) {
    const available = new Set(ids);
    this.queue = this.queue.filter(event => available.has(event.person));
    if (this.mode === 'focus' && (!available.has(this.targetId) || now >= this.until)) {
      const roseInterruptsRandom = this.reason === 'random' && this.queue.length > 0;
      this.overview(now);
      if (roseInterruptsRandom) this.overviewUntil = now;
    }
    // A rose interrupts a random close-up. Rose close-ups finish in arrival order.
    if (this.queue.length && (this.mode === 'focus' && this.reason === 'random' ||
        this.mode === 'overview' && now >= this.overviewUntil)) {
      const event = this.queue.shift(); this.focus(event.person, 'rose', event, now);
    } else if (this.mode === 'overview' && now >= this.nextRandomAt && ids.length) {
      const candidates = ids.length > 1 ? ids.filter(id => id !== this.lastRandomId) : ids;
      const index = Math.min(candidates.length - 1, Math.floor(this.random() * candidates.length));
      this.focus(candidates[index], 'random', null, now);
    }
    return {mode: this.mode, reason: this.reason, targetId: this.targetId, event: this.event,
      token: this.token, startedAt: this.startedAt, until: this.until};
  }
}

export function roseNotice(event) {
  return event.entered ? '🌹 ' + event.name + ' entrou na roda!' : '🌹 ' + event.name + ' mandou rosas! Mais tempo na pista.';
}
