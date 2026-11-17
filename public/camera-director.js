export const CAMERA_TIMING = Object.freeze({overview: 8000, random: 4500, rose: 5000, marry: 6000, groom: 5000, return: 2500, maxRose: 8000});

// Scheduling is independent of animation speed and contains no Three.js objects.
export class CameraDirector {
  constructor(now = 0, random = Math.random) {
    this.random = random;
    this.mode = 'overview'; this.reason = null; this.targetId = null; this.event = null;
    this.startedAt = now; this.until = Infinity; this.nextRandomAt = now + CAMERA_TIMING.overview;
    this.overviewUntil = now; this.token = 0; this.queue = []; this.lastRandomId = null;
    this.sequence = 0; this.groomId = null; this.groomDueAt = Infinity; this.lastFeaturedWasGroom = false;
  }

  rose(event, now) {
    if (!event.person) return;
    if (event.priority !== 'marry' && this.mode === 'focus' && this.reason === 'rose' && this.targetId === event.person) {
      this.until = Math.min(this.startedAt + CAMERA_TIMING.maxRose, now + CAMERA_TIMING.rose);
      return;
    }
    const queued = this.queue.find(item => item.person === event.person);
    if (queued) Object.assign(queued, event, {entered: queued.entered || event.entered, order: ++this.sequence});
    else { this.queue.push({...event,order:++this.sequence}); if (this.queue.length > 48) this.queue.shift(); }
  }

  marry(event, now) {this.queue=this.queue.filter(item=>item.priority!=='marry');this.rose({...event,priority:'marry'},now);}

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

  update(now, ids, context = {}) {
    const available = new Set(ids);
    const groom=context.groomId||null;
    if(this.groomId!==groom){this.groomId=groom;this.groomDueAt=now+16000;}
    this.queue = this.queue.filter(event => available.has(event.person) && (event.priority!=='marry'||event.person===this.groomId));
    this.queue.sort((a,b)=>(b.priority==='marry')-(a.priority==='marry')||b.order-a.order);
    if(this.queue[0]?.priority==='marry'){
      const event=this.queue.shift();this.focus(event.person,'marry',event,now);this.groomDueAt=now+20000;this.lastFeaturedWasGroom=true;
    }
    if (this.mode === 'focus' && (!available.has(this.targetId) || now >= this.until ||
        (['marry','groom'].includes(this.reason)&&this.targetId!==this.groomId))) {
      const roseInterruptsRandom = this.reason === 'random' && this.queue.length > 0;
      this.overview(now);
      if (roseInterruptsRandom) this.overviewUntil = now;
    }
    // Weddings preempt other close-ups; rose highlights favor the latest senders.
    if(this.mode==='overview'&&now>=this.overviewUntil&&this.groomId&&available.has(this.groomId)&&now>=this.groomDueAt){
      this.focus(this.groomId,'groom',null,now);this.groomDueAt=now+20000;this.lastFeaturedWasGroom=true;
    } else if (this.queue.length && (this.mode === 'focus' && this.reason === 'random' ||
        this.mode === 'overview' && now >= this.overviewUntil)) {
      const event = this.queue.shift(); this.focus(event.person, 'rose', event, now);
      this.lastFeaturedWasGroom=event.person===this.groomId;
    } else if (this.mode === 'overview' && now >= this.nextRandomAt && ids.length) {
      if(this.groomId&&available.has(this.groomId)&&!this.lastFeaturedWasGroom){this.focus(this.groomId,'groom',null,now);this.groomDueAt=now+20000;this.lastFeaturedWasGroom=true;}
      else {
      const ordered=context.recentIds?.filter(id=>available.has(id)&&id!==this.groomId)||ids;
      const pool=ordered.length?ordered:ids;
      const candidates = pool.length > 1 ? pool.filter(id => id !== this.lastRandomId).slice(0,6) : pool;
      const index = Math.min(candidates.length - 1, Math.floor(this.random() * candidates.length));
      this.focus(candidates[index], 'random', null, now);
      this.lastFeaturedWasGroom=false;
      }
    }
    return {mode: this.mode, reason: this.reason, targetId: this.targetId, event: this.event,
      token: this.token, startedAt: this.startedAt, until: this.until};
  }
}

export function roseNotice(event) {
  return event.entered ? '🌹 ' + event.name + ' entrou na roda!' : '🌹 ' + event.name + ' mandou rosas! Mais tempo na pista.';
}
