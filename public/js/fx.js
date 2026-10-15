// Particules canvas (étincelles, éclats, pluie dorée) + sons synthétisés (WebAudio, désactivables).
import { reducedMotion } from './ui.js';

export class Particles {
  constructor(canvas) {
    this.c = canvas; this.ctx = canvas.getContext('2d'); this.p = []; this.running = false;
    this.resize = () => { const d = devicePixelRatio || 1; this.c.width = innerWidth * d; this.c.height = innerHeight * d; this.ctx.setTransform(d, 0, 0, d, 0, 0); };
    this.resize(); addEventListener('resize', this.resize);
  }
  destroy() { removeEventListener('resize', this.resize); this.p = []; this.amb = null; }
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
  // particules qui remontent doucement depuis le bas de l'écran pendant toute l'ouverture
  // (getColor() donne la couleur du moment : celle du booster puis de la dernière carte révélée)
  ambient(getColor, rate = 0.35) {
    if (reducedMotion()) return;
    this.amb = { getColor, rate };
    this.run();
  }
  // tourbillon : des traînées lumineuses s'enroulent vers le centre (remplace les rayons des grandes raretés)
  swirl(x, y, color, count = 70, { radius = 260, life = 80 } = {}) {
    if (reducedMotion()) return;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, r = radius * (0.6 + Math.random() * 0.6);
      this.p.push({ shape: 'orbit', cx: x, cy: y, a, r, r0: r, va: 0.05 + Math.random() * 0.05, life: life * (0.7 + Math.random() * 0.5), t: 0,
        s: 1.5 + Math.random() * 2.5, color: Array.isArray(color) ? color[i % color.length] : color, x, y, vx: 0, vy: 0, g: 0, rot: 0, vr: 0 });
    }
    this.run();
  }
  // éclats en étoile à 4 branches, projetés puis scintillants
  stars(x, y, color, count = 30, { speed = 9, life = 90 } = {}) {
    if (reducedMotion()) return;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, v = speed * (0.35 + Math.random() * 0.8);
      this.p.push({ shape: 'star', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 0.03, life: life * (0.6 + Math.random() * 0.6), t: 0,
        s: 6 + Math.random() * 10, color: Array.isArray(color) ? color[i % color.length] : color, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.08, tw: Math.random() * 6 });
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
      if (this.amb && Math.random() < this.amb.rate * 2) {
        const c = this.amb.getColor();
        this.p.push({ shape: 'mote', x: Math.random() * innerWidth, y: innerHeight + 10, vx: (Math.random() - 0.5) * 0.3, vy: -(0.5 + Math.random() * 1.1), g: -0.002,
          life: 260 + Math.random() * 220, t: 0, s: 1 + Math.random() * 2.4, color: Math.random() < 0.3 ? '#ffffff' : c, rot: Math.random() * 6, vr: 0.02 + Math.random() * 0.03 });
      }
      this.p = this.p.filter((q) => q.t < q.life);
      for (const q of this.p) {
        q.t++;
        if (q.shape === 'orbit') {
          // spirale qui se resserre ; on trace un petit arc (traînée)
          const k0 = q.t / q.life, a0 = q.a;
          q.a += q.va * (1 + k0 * 2); q.r = q.r0 * (1 - k0) ** 1.4;
          const x0 = q.cx + Math.cos(a0) * (q.r + 6), y0 = q.cy + Math.sin(a0) * (q.r + 6) * 0.8;
          q.x = q.cx + Math.cos(q.a) * q.r; q.y = q.cy + Math.sin(q.a) * q.r * 0.8;
          ctx.globalAlpha = Math.min(1, k0 * 3) * (1 - k0 * 0.5);
          ctx.strokeStyle = q.color; ctx.lineWidth = q.s; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(q.x, q.y); ctx.stroke();
          continue;
        }
        q.vy += q.g; q.vx *= 0.985; q.x += q.vx; q.y += q.vy; q.rot += q.vr;
        const k = 1 - q.t / q.life;
        ctx.globalAlpha = Math.max(0, k);
        ctx.fillStyle = q.color;
        if (q.shape === 'mote') {
          // particule montante : légère ondulation, apparition puis extinction en douceur
          q.x += Math.sin(q.t * q.vr + q.rot) * 0.35;
          ctx.globalAlpha = Math.min(1, q.t / 40) * Math.max(0, k) * 0.8;
          ctx.beginPath(); ctx.arc(q.x, q.y, q.s, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha *= 0.2; ctx.beginPath(); ctx.arc(q.x, q.y, q.s * 3, 0, Math.PI * 2); ctx.fill();
          continue;
        }
        if (q.shape === 'star') {
          const tw = 0.6 + 0.4 * Math.sin(q.t * 0.4 + q.tw), r = q.s * tw * (0.5 + k * 0.5);
          ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot);
          ctx.beginPath();
          for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * 0.22 : r, aa = (i * Math.PI) / 4; ctx.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr); }
          ctx.closePath(); ctx.fill(); ctx.restore();
          continue;
        }
        if (q.shape === 'flake') {
          ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot); ctx.fillRect(-q.s / 2, -q.s / 4, q.s, q.s / 2); ctx.restore();
        } else {
          ctx.beginPath(); ctx.arc(q.x, q.y, q.s * (0.4 + k * 0.6), 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = Math.max(0, k * 0.25);
          ctx.beginPath(); ctx.arc(q.x, q.y, q.s * 3, 0, Math.PI * 2); ctx.fill();
        }
      }
      if (this.p.length || this.amb) requestAnimationFrame(tick); else { ctx.clearRect(0, 0, innerWidth, innerHeight); this.running = false; }
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
// pluck court (corde pincée / marimba) : sinus + harmonique, attaque sèche
function pluck(f, t, vol = 0.06, dur = 0.5, send = 0.25) {
  [[1, 1], [3, 0.18], [4.1, 0.06]].forEach(([m, v]) => {
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = m === 1 ? 'triangle' : 'sine'; o.frequency.value = f * m; env(g, t, 0.003, vol * v, dur / m ** 0.6);
    o.connect(g); out(g, send); o.start(t); o.stop(t + dur + 0.05);
  });
}
// stab « cuivres » : dents de scie filtrées, attaque rapide
function brass(freqs, t, dur = 0.7, vol = 0.03) {
  const f = actx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(600, t); f.frequency.exponentialRampToValueAtTime(3200, t + 0.06); f.frequency.exponentialRampToValueAtTime(900, t + dur);
  const g = actx.createGain(); env(g, t, 0.02, vol, dur); f.connect(g); out(g, 0.5);
  for (const fr of freqs) for (const det of [-6, 6]) { const o = actx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr; o.detune.value = det; o.connect(f); o.start(t); o.stop(t + dur + 0.05); }
}
// le retournement lui-même : frottement de carte bref
function thwip(t) { noise(t, 0.09, { type: 'bandpass', from: 2600, to: 900, q: 1.2, vol: 0.06, send: 0.05 }); }
// signature de rareté, jouée au retournement : chaque rang a son timbre
//  0 commun : petit clic boisé · 1 peu commun : deux notes pincées · 2 rare : triade de cloches
//  3 épique : arpège cristallin · 4 légendaire : accord cuivré + timbale + paillettes
//  5 mythique : grave + chœur + arpège ascendant · 6 transcendant : gong + nappe céleste + cascade
function signature(r, t) {
  if (r <= 0) { pluck(N(-5), t, 0.05, 0.25, 0.1); return; }
  if (r === 1) { pluck(N(0), t, 0.055, 0.4); pluck(N(7), t + 0.08, 0.05, 0.5); return; }
  if (r === 2) { [0, 4, 7].forEach((s, i) => bell(N(12 + s), t + i * 0.05, 0.9, 0.045, 0.45)); return; }
  if (r === 3) {
    [0, 7, 12, 16, 19].forEach((s, i) => bell(N(14 + s), t + i * 0.06, 1.1, 0.04, 0.6));
    pad([N(2 - 12), N(9 - 12)], t, 1.4, 0.014, 1600);
    return;
  }
  if (r === 4) {
    brass([N(-12), N(-5), N(0), N(4)], t, 0.9, 0.026);
    boom(t, 0.24, 120, 45, 1.2);
    [0, 4, 7, 12].forEach((s, i) => bell(N(24 + s), t + 0.12 + i * 0.05, 0.9, 0.025, 0.7));
    noise(t + 0.05, 1.1, { from: 6000, to: 9500, vol: 0.025, send: 0.9 });
    return;
  }
  if (r === 5) {
    boom(t, 0.32, 95, 34, 1.8);
    pad([N(-15), N(-8), N(-3), N(4)], t, 2.6, 0.03, 2200);
    [0, 3, 7, 10, 12, 15, 19].forEach((s, i) => bell(N(9 + s), t + 0.1 + i * 0.07, 1.4, 0.035, 0.7));
    noise(t, 1.6, { from: 5000, to: 9000, vol: 0.03, send: 0.9 });
    return;
  }
  // transcendant
  [1, 2.76, 5.4, 8.9].forEach((m, i) => bell(N(-24) * m, t, 4, 0.07 / (i + 1), 0.9));
  boom(t, 0.3, 80, 30, 2.2);
  pad([N(0), N(7), N(14), N(16), N(23)], t + 0.1, 3.4, 0.03, 3200);
  [0, 4, 7, 11, 14, 16, 19, 23, 24].forEach((s, i) => bell(N(12 + s), t + 0.25 + i * 0.06, 1.8, 0.03, 0.8));
  noise(t, 2.4, { from: 7000, to: 10000, vol: 0.03, send: 1 });
}
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
      else if (kind === 'flip') { thwip(t); signature(rarity, t + 0.04); }
      else if (kind === 'rare') {
        signature(rarity, t);      } else if (kind === 'coin') { bell(N(19), t, 0.7, 0.04, 0.3); bell(N(24), t + 0.08, 0.9, 0.035, 0.3); }
      else if (kind === 'click') bell(N(12), t, 0.25, 0.02, 0.1);
    } catch { /* audio indisponible */ }
  },
};

export const haptic = (ms) => { try { if (!reducedMotion()) navigator.vibrate?.(ms); } catch { /* ignore */ } };
