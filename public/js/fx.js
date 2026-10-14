// Particules canvas (étincelles, éclats, pluie dorée) + sons synthétisés (WebAudio, désactivables).
import { reducedMotion } from './ui.js';

export class Particles {
  constructor(canvas) {
    this.c = canvas; this.ctx = canvas.getContext('2d'); this.p = []; this.running = false;
    this.resize = () => { const d = devicePixelRatio || 1; this.c.width = innerWidth * d; this.c.height = innerHeight * d; this.ctx.setTransform(d, 0, 0, d, 0, 0); };
    this.resize(); addEventListener('resize', this.resize);
  }
  destroy() { removeEventListener('resize', this.resize); this.p = []; }
  burst(x, y, color, count = 40, { speed = 7, gravity = 0.12, life = 70, size = 3, shape = 'spark' } = {}) {
    if (reducedMotion()) return;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, v = speed * (0.3 + Math.random());
      this.p.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - speed * 0.25, g: gravity, life: life * (0.6 + Math.random() * 0.6), t: 0,
        s: size * (0.5 + Math.random()), color: Array.isArray(color) ? color[i % color.length] : color, shape, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3 });
    }
    this.run();
  }
  rain(color, count = 80) {
    if (reducedMotion()) return;
    for (let i = 0; i < count; i++) {
      this.p.push({ x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.6, vx: (Math.random() - 0.5) * 1.5, vy: 1.5 + Math.random() * 2.5, g: 0.02,
        life: 260, t: 0, s: 4 + Math.random() * 5, color: Array.isArray(color) ? color[i % color.length] : color, shape: 'flake', rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.15 });
    }
    this.run();
  }
  run() {
    if (this.running) return;
    this.running = true;
    const tick = () => {
      const { ctx } = this;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ctx.globalCompositeOperation = 'lighter';
      this.p = this.p.filter((q) => q.t < q.life);
      for (const q of this.p) {
        q.t++; q.vy += q.g; q.vx *= 0.985; q.x += q.vx; q.y += q.vy; q.rot += q.vr;
        const k = 1 - q.t / q.life;
        ctx.globalAlpha = Math.max(0, k);
        ctx.fillStyle = q.color;
        if (q.shape === 'flake') {
          ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot); ctx.fillRect(-q.s / 2, -q.s / 4, q.s, q.s / 2); ctx.restore();
        } else {
          ctx.beginPath(); ctx.arc(q.x, q.y, q.s * (0.4 + k * 0.6), 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = Math.max(0, k * 0.25);
          ctx.beginPath(); ctx.arc(q.x, q.y, q.s * 3, 0, Math.PI * 2); ctx.fill();
        }
      }
      if (this.p.length) requestAnimationFrame(tick); else { ctx.clearRect(0, 0, innerWidth, innerHeight); this.running = false; }
    };
    requestAnimationFrame(tick);
  }
}

// ───────── Sons courts synthétisés (aucun fichier audio)
let actx = null;
export const sound = {
  get on() { try { return localStorage.getItem('armaris.sound') !== '0'; } catch { return true; } },
  set on(v) { try { localStorage.setItem('armaris.sound', v ? '1' : '0'); } catch { /* stockage indisponible */ } },
  play(kind, rarity = 0) {
    if (!this.on) return;
    try {
      actx ||= new AudioContext();
      const t = actx.currentTime;
      const tone = (freq, dur, type = 'sine', vol = 0.12, delay = 0, slide = 0) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = type; o.frequency.setValueAtTime(freq, t + delay);
        if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + delay + dur);
        g.gain.setValueAtTime(0.0001, t + delay); g.gain.exponentialRampToValueAtTime(vol, t + delay + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + delay + dur);
        o.connect(g).connect(actx.destination); o.start(t + delay); o.stop(t + delay + dur + 0.05);
      };
      const noise = (dur, vol = 0.15) => {
        const b = actx.createBuffer(1, actx.sampleRate * dur, actx.sampleRate), d = b.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
        const s = actx.createBufferSource(), g = actx.createGain(), f = actx.createBiquadFilter();
        f.type = 'highpass'; f.frequency.value = 1200; g.gain.value = vol;
        s.buffer = b; s.connect(f).connect(g).connect(actx.destination); s.start();
      };
      if (kind === 'tear') noise(0.35, 0.18);
      else if (kind === 'flip') { noise(0.06, 0.08); tone(420 + rarity * 90, 0.12, 'triangle', 0.05); }
      else if (kind === 'charge') tone(110, 1.1, 'sawtooth', 0.04, 0, 3.2);
      else if (kind === 'rare') { [0, 4, 7, 12].forEach((s, i) => tone(440 * 2 ** ((s + rarity * 2) / 12), 0.5, 'triangle', 0.07, i * 0.07)); if (rarity >= 5) tone(55, 1.4, 'sine', 0.3, 0, 0.5); }
      else if (kind === 'coin') { tone(1320, 0.08, 'square', 0.03); tone(1760, 0.12, 'square', 0.03, 0.06); }
      else if (kind === 'click') tone(660, 0.05, 'triangle', 0.04);
    } catch { /* audio indisponible */ }
  },
};

export const haptic = (ms) => { try { if (!reducedMotion()) navigator.vibrate?.(ms); } catch { /* ignore */ } };
