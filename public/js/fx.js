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

// ───────── Sons synthétisés (WebAudio, aucun fichier) : doux, réverbérés, de plus en plus épiques avec la rareté
let actx = null, bus = null, verb = null;
function audio() {
  if (actx) return actx;
  actx = new AudioContext();
  const comp = actx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4;
  const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7000;
  bus = actx.createGain(); bus.gain.value = 0.55;
  bus.connect(lp).connect(comp).connect(actx.destination);
  // réverbération : réponse impulsionnelle générée (bruit décroissant, 2,6 s)
  const len = actx.sampleRate * 2.6, ir = actx.createBuffer(2, len, actx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2.6; }
  verb = actx.createConvolver(); verb.buffer = ir;
  const wet = actx.createGain(); wet.gain.value = 0.32;
  verb.connect(wet).connect(lp);
  return actx;
}
function out(node, send = 0.5) { node.connect(bus); if (send) { const g = actx.createGain(); g.gain.value = send; node.connect(g).connect(verb); } }
function env(g, t, a, peak, dur) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
// cloche douce : fondamentale + partiels
function bell(f, t, dur = 1.6, vol = 0.08, send = 0.6) {
  [[1, 1], [2.01, 0.32], [3.98, 0.12], [5.2, 0.05]].forEach(([m, v]) => {
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = 'sine'; o.frequency.value = f * m; env(g, t, 0.006, vol * v, dur / m ** 0.4);
    o.connect(g); out(g, send); o.start(t); o.stop(t + dur + 0.1);
  });
}
// nappe : dents de scie désaccordées filtrées
function pad(freqs, t, dur, vol = 0.03, cutoff = 1400) {
  const f = actx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(cutoff * 0.4, t); f.frequency.linearRampToValueAtTime(cutoff, t + dur * 0.5);
  const g = actx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  f.connect(g); out(g, 0.8);
  for (const fr of freqs) for (const det of [-7, 0, 7]) { const o = actx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr; o.detune.value = det; o.connect(f); o.start(t); o.stop(t + dur + 0.1); }
}
function noise(t, dur, { type = 'bandpass', from = 800, to = 2500, q = 0.8, vol = 0.12, send = 0.2 } = {}) {
  const b = actx.createBuffer(1, actx.sampleRate * dur, actx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
  f.type = type; f.Q.value = q; f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
  env(g, t, dur * 0.25, vol, dur);
  s.buffer = b; s.connect(f).connect(g); out(g, send); s.start(t);
}
function boom(t, vol = 0.35, from = 140, to = 42, dur = 1.4) {
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(from, t); o.frequency.exponentialRampToValueAtTime(to, t + dur * 0.6);
  env(g, t, 0.01, vol, dur); o.connect(g); out(g, 0.4); o.start(t); o.stop(t + dur + 0.1);
}
const N = (semi) => 261.63 * 2 ** (semi / 12);   // do4 + demi-tons
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];

export const sound = {
  get on() { try { return localStorage.getItem('mugigo.sound') !== '0'; } catch { return true; } },
  set on(v) { try { localStorage.setItem('mugigo.sound', v ? '1' : '0'); } catch { /* stockage indisponible */ } },
  play(kind, rarity = 0) {
    if (!this.on) return;
    try {
      audio();
      const t = actx.currentTime + 0.01;
      if (kind === 'tear') { noise(t, 0.45, { from: 600, to: 3200, vol: 0.09 }); boom(t, 0.12, 110, 60, 0.4); }
      else if (kind === 'flip') { noise(t, 0.08, { from: 1800, to: 1200, vol: 0.05, send: 0.1 }); bell(N(SCALE[Math.min(rarity, 6)] + 12), t + 0.02, 0.6, 0.035, 0.3); }
      else if (kind === 'charge') {
        const dur = 0.9 + rarity * 0.25;
        noise(t, dur, { type: 'lowpass', from: 300, to: 4000, q: 4, vol: 0.05, send: 0.6 });
        pad([N(-12), N(-5)], t, dur + 0.4, 0.012 + rarity * 0.003, 900 + rarity * 300);
      } else if (kind === 'rare') {
        // de plus en plus riche : cloche → accord → arpège + nappe → choeur + timbale → gong scintillant
        const root = [0, 2, 4, 5, 7, 9, 12][Math.min(rarity, 6)];
        const arp = rarity <= 1 ? [0] : rarity === 2 ? [0, 7] : rarity === 3 ? [0, 4, 7] : rarity === 4 ? [0, 4, 7, 12, 16] : [0, 4, 7, 11, 12, 16, 19, 24];
        arp.forEach((s, i) => bell(N(root + s), t + i * (rarity >= 5 ? 0.09 : 0.11), 1.4 + rarity * 0.3, 0.05 + rarity * 0.006));
        if (rarity >= 3) pad([N(root - 12), N(root - 5), N(root)], t, 1.8 + rarity * 0.4, 0.012 + rarity * 0.004, 1100 + rarity * 250);
        if (rarity >= 4) boom(t, 0.22 + (rarity - 4) * 0.1, 120, 45, 1.6);
        if (rarity >= 5) { pad([N(root + 12), N(root + 16), N(root + 19)], t + 0.3, 3, 0.012, 2400); noise(t, 1.8, { from: 6000, to: 9000, vol: 0.03, send: 0.9 }); }
        if (rarity >= 6) { [1, 2.76, 5.4, 8.9].forEach((m, i) => bell(N(root - 24) * m, t + 0.05, 4, 0.06 / (i + 1), 0.9)); arp.forEach((s, i) => bell(N(root + s + 24), t + 0.9 + i * 0.07, 2, 0.02)); }
      } else if (kind === 'coin') { bell(N(19), t, 0.7, 0.04, 0.3); bell(N(24), t + 0.08, 0.9, 0.035, 0.3); }
      else if (kind === 'click') bell(N(12), t, 0.25, 0.02, 0.1);
    } catch { /* audio indisponible */ }
  },
};

export const haptic = (ms) => { try { if (!reducedMotion()) navigator.vibrate?.(ms); } catch { /* ignore */ } };
