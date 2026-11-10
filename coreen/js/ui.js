// Petits outils d'interface : voix, sons, vibrations, confettis, animations.
import { get } from './store.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const shuffle = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Synthèse vocale coréenne ----------
let koVoice = null;
function findVoice() {
  if (!('speechSynthesis' in window)) return;
  const voices = speechSynthesis.getVoices();
  koVoice = voices.find((v) => v.lang === 'ko-KR' && /yuna|google|sora/i.test(v.name)) || voices.find((v) => v.lang?.toLowerCase().startsWith('ko')) || null;
}
if ('speechSynthesis' in window) {
  findVoice();
  speechSynthesis.addEventListener?.('voiceschanged', findVoice);
}
export const canSpeak = () => 'speechSynthesis' in window;
export const hasKoreanVoice = () => !!koVoice;

export function speak(text, rate) {
  if (!canSpeak()) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[.?]/g, ''));
  u.lang = 'ko-KR';
  if (koVoice) u.voice = koVoice;
  u.rate = rate ?? get().settings.rate;
  speechSynthesis.speak(u);
}

// ---------- Sons discrets (générés, aucun fichier) ----------
let ctx;
function tone(freqs, dur = 0.12, type = 'sine', gain = 0.06) {
  if (!get().settings.sound) return;
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    let t = ctx.currentTime;
    for (const f of freqs) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = f;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(gain, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
      t += dur * 0.8;
    }
  } catch { /* audio indisponible */ }
}
export const sfx = {
  ok: () => tone([660, 880], 0.1),
  ko: () => tone([220, 180], 0.14, 'triangle', 0.05),
  tap: () => tone([520], 0.04, 'sine', 0.025),
  win: () => tone([523, 659, 784, 1047], 0.12),
};

export function haptic(pattern = 10) {
  if (get().settings.haptics && navigator.vibrate) navigator.vibrate(pattern);
}

// ---------- Retour visuel ----------
export function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.append(el);
  setTimeout(() => el.classList.add('out'), 2000);
  setTimeout(() => el.remove(), 2400);
}

/** Petite bulle « +5 XP » qui s'envole depuis un élément. */
export function floatXp(n, from) {
  const el = document.createElement('div');
  el.className = 'float-xp';
  el.textContent = `+${n} XP`;
  const r = from?.getBoundingClientRect?.() ?? { left: innerWidth / 2, top: innerHeight / 2, width: 0 };
  el.style.left = r.left + r.width / 2 + 'px';
  el.style.top = r.top + 'px';
  document.body.append(el);
  setTimeout(() => el.remove(), 1100);
}

export function confetti() {
  if (reducedMotion()) return;
  const c = document.createElement('canvas');
  c.className = 'confetti';
  const dpr = devicePixelRatio || 1;
  c.width = innerWidth * dpr;
  c.height = innerHeight * dpr;
  document.body.append(c);
  const g = c.getContext('2d');
  g.scale(dpr, dpr);
  const css = getComputedStyle(document.documentElement);
  const colors = ['--accent', '--ok', '--gold', '--rose'].map((v) => css.getPropertyValue(v).trim() || '#888');
  const parts = Array.from({ length: 90 }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 80,
    y: innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 9,
    vy: -Math.random() * 9 - 4,
    s: Math.random() * 6 + 4,
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    c: colors[Math.floor(Math.random() * colors.length)],
  }));
  const t0 = performance.now();
  (function frame(t) {
    const life = (t - t0) / 1600;
    g.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += 0.25;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      g.save();
      g.globalAlpha = Math.max(0, 1 - life);
      g.translate(p.x, p.y);
      g.rotate(p.r);
      g.fillStyle = p.c;
      g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      g.restore();
    }
    if (life < 1) requestAnimationFrame(frame);
    else c.remove();
  })(t0);
}

/** Fait défiler un nombre de `from` à `to`. */
export function countUp(el, to, from = 0, ms = 700) {
  if (reducedMotion()) { el.textContent = to; return; }
  const t0 = performance.now();
  (function frame(t) {
    const k = Math.min(1, (t - t0) / ms);
    el.textContent = Math.round(from + (to - from) * (1 - (1 - k) ** 3));
    if (k < 1) requestAnimationFrame(frame);
  })(t0);
}

/** Rejoue une animation CSS sur un élément. */
export function pulse(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

export const ICONS = {
  home: '<svg viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
  learn: '<svg viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/></svg>',
  phrase: '<svg viewBox="0 0 24 24"><path d="M4 5h16v10H9l-5 4z"/><path d="M8 9h8M8 12h5"/></svg>',
  stats: '<svg viewBox="0 0 24 24"><path d="M5 20V11M12 20V4M19 20v-6"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  sound: '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>',
  flame: '<svg viewBox="0 0 24 24"><path d="M12 22c4 0 7-2.8 7-6.8 0-3.6-2.4-6-4-8.2-.4 2-1.4 3.2-2.6 3.8C12.6 7.6 11 4.6 8.6 2.5 8.8 6 5 9 5 15.2 5 19.2 8 22 12 22z"/></svg>',
  shuffle: '<svg viewBox="0 0 24 24"><path d="M3 7h4l10 10h4M3 17h4l3-3M14 10l3-3h4M18 4l3 3-3 3M18 14l3 3-3 3"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
};
