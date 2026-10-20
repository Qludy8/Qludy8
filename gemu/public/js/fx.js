// Effets de l'ouverture : particules sur canvas et sons synthétisés (Web Audio, aucun fichier).
import { prefs } from './util.js';

export class Particles {
  constructor(canvas) {
    this.c = canvas;
    this.x = canvas.getContext('2d');
    this.list = [];
    this.running = false;
    this.resize();
    this.onResize = () => this.resize();
    addEventListener('resize', this.onResize);
  }
  resize() {
    const d = Math.min(2, devicePixelRatio || 1);
    this.w = this.c.clientWidth; this.h = this.c.clientHeight;
    this.c.width = this.w * d; this.c.height = this.h * d;
    this.x.setTransform(d, 0, 0, d, 0, 0);
  }
  burst(color, n = 60, { x = this.w / 2, y = this.h / 2, speed = 9, rainbow = false } = {}) {
    if (!prefs.get('anim', true)) return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = (0.3 + Math.random()) * speed;
      this.list.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, life: 1, decay: 0.008 + Math.random() * 0.018,
        size: 1.5 + Math.random() * 3.5, color: rainbow ? `hsl(${Math.random() * 360} 100% 65%)` : color, star: Math.random() < 0.3 });
    }
    this.loop();
  }
  rain(color, n = 40) {
    for (let i = 0; i < n; i++) {
      this.list.push({ x: Math.random() * this.w, y: -10 - Math.random() * this.h * 0.4, vx: (Math.random() - 0.5) * 1.5, vy: 2 + Math.random() * 3,
        life: 1, decay: 0.004 + Math.random() * 0.006, size: 1.5 + Math.random() * 2.5, color, star: true });
    }
    this.loop();
  }
  loop() {
    if (this.running) return;
    this.running = true;
    const step = () => {
      const { x } = this;
      x.clearRect(0, 0, this.w, this.h);
      x.globalCompositeOperation = 'lighter';
      this.list = this.list.filter((p) => p.life > 0);
      for (const p of this.list) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.vx *= 0.985; p.life -= p.decay;
        x.globalAlpha = Math.max(0, p.life);
        x.fillStyle = p.color;
        if (p.star) {
          const s = p.size * 2.2;
          x.beginPath(); x.moveTo(p.x - s, p.y); x.lineTo(p.x, p.y - s * 0.25); x.lineTo(p.x + s, p.y); x.lineTo(p.x, p.y + s * 0.25); x.closePath(); x.fill();
          x.beginPath(); x.moveTo(p.x, p.y - s); x.lineTo(p.x + s * 0.25, p.y); x.lineTo(p.x, p.y + s); x.lineTo(p.x - s * 0.25, p.y); x.closePath(); x.fill();
        } else {
          x.beginPath(); x.arc(p.x, p.y, p.size, 0, Math.PI * 2); x.fill();
        }
      }
      if (this.list.length) requestAnimationFrame(step);
      else { this.running = false; x.clearRect(0, 0, this.w, this.h); }
    };
    requestAnimationFrame(step);
  }
  destroy() { removeEventListener('resize', this.onResize); this.list = []; }
}

// --- sons ---
let ctx;
const ac = () => {
  if (!prefs.get('sound', true)) return null;
  ctx ||= new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
};
function tone(freq, t0, dur, { type = 'sine', vol = 0.15, slide = 0 } = {}) {
  const c = ac(); if (!c) return;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, c.currentTime + t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, c.currentTime + t0 + dur);
  g.gain.setValueAtTime(0.0001, c.currentTime + t0);
  g.gain.exponentialRampToValueAtTime(vol, c.currentTime + t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + t0); o.stop(c.currentTime + t0 + dur + 0.05);
}
function noise(t0, dur, { vol = 0.2, freq = 2000, q = 0.8 } = {}) {
  const c = ac(); if (!c) return;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = c.createBufferSource(); s.buffer = buf;
  const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  const g = c.createGain(); g.gain.value = vol;
  s.connect(f).connect(g).connect(c.destination);
  s.start(c.currentTime + t0);
}
const NOTES = { C: [523], U: [523, 659], R: [523, 659, 784], E: [523, 659, 784, 1047], L: [392, 523, 659, 784, 1047], M: [392, 523, 659, 784, 1047, 1319, 1568] };
export const sfx = {
  tick: () => tone(1400, 0, 0.03, { type: 'square', vol: 0.03 }),
  tear: () => { noise(0, 0.35, { vol: 0.35, freq: 3200, q: 0.6 }); noise(0.05, 0.3, { vol: 0.2, freq: 1200 }); },
  whoosh: () => noise(0, 0.25, { vol: 0.12, freq: 800, q: 0.4 }),
  flip: () => { noise(0, 0.08, { vol: 0.25, freq: 2500 }); tone(240, 0, 0.08, { type: 'triangle', vol: 0.08 }); },
  charge: (d) => tone(140, 0, d, { type: 'sawtooth', vol: 0.05, slide: 4 }),
  reveal(r) {
    const ns = NOTES[r] || NOTES.C;
    ns.forEach((f, i) => tone(f, i * 0.07, 0.5 + i * 0.05, { type: r === 'M' || r === 'L' ? 'triangle' : 'sine', vol: 0.09 }));
    if (r === 'M') { ns.forEach((f, i) => tone(f * 2, 0.5 + i * 0.05, 0.9, { vol: 0.04 })); noise(0, 0.6, { vol: 0.15, freq: 6000 }); }
    if (r === 'L') noise(0, 0.4, { vol: 0.1, freq: 5000 });
  },
  coin: () => { tone(988, 0, 0.08, { type: 'square', vol: 0.05 }); tone(1319, 0.08, 0.25, { type: 'square', vol: 0.05 }); },
  fanfare: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.4, { type: 'triangle', vol: 0.08 })),
};
export const vibrate = (p) => { try { if (prefs.get('anim', true)) navigator.vibrate?.(p); } catch { /* non pris en charge */ } };
