'use strict';
// Ритъм Зоо — детско ритъм пиано.
// Нотките падат към четири животинчета. Докосваш животинчето, когато нотката стигне
// до кръгчето над главата му, и то изпява точно тази нота от песента.
// 🐢 „Спокойно“: песента чака детето. 🐇 „В ритъм“: песента върви и събираш звездички.
// Целият звук (мелодия, бас, акорди, барабан) се синтезира в браузъра.

// Нотите: име+октава, „:дължина“ в удари (по подразбиране 1). Всички песни са народни/обществено достояние.
const SONGS = [
  { id: 'twinkle', title: 'Блещукай, звездице', emoji: '⭐', color: '#ffd35c', bpm: 92, bar: 4, key: 'C',
    notes: `C4 C4 G4 G4 A4 A4 G4:2 F4 F4 E4 E4 D4 D4 C4:2 G4 G4 F4 F4 E4 E4 D4:2 G4 G4 F4 F4 E4 E4 D4:2
            C4 C4 G4 G4 A4 A4 G4:2 F4 F4 E4 E4 D4 D4 C4:2` },
  { id: 'mary', title: 'Мери и агънцето', emoji: '🐑', color: '#ffb3c7', bpm: 104, bar: 4, key: 'C',
    notes: `E4 D4 C4 D4 E4 E4 E4:2 D4 D4 D4:2 E4 G4 G4:2 E4 D4 C4 D4 E4 E4 E4 E4 D4 D4 E4 D4 C4:4` },
  { id: 'farm', title: 'Старият Макдоналд', emoji: '🐄', color: '#9be37c', bpm: 116, bar: 4, key: 'G',
    notes: `G4 G4 G4 D4 E4 E4 D4:2 B4 B4 A4 A4 G4:3 D4 G4 G4 G4 D4 E4 E4 D4:2 B4 B4 A4 A4 G4:4` },
  { id: 'jacques', title: 'Братче Жак', emoji: '🔔', color: '#9fd8ff', bpm: 96, bar: 4, key: 'C',
    notes: `C4 D4 E4 C4 C4 D4 E4 C4 E4 F4 G4:2 E4 F4 G4:2 G4:.5 A4:.5 G4:.5 F4:.5 E4 C4
            G4:.5 A4:.5 G4:.5 F4:.5 E4 C4 C4 G3 C4:2 C4 G3 C4:2` },
  { id: 'ode', title: 'Ода на радостта', emoji: '🎻', color: '#c9b6ff', bpm: 100, bar: 4, key: 'C',
    notes: `E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4:1.5 D4:.5 D4:2
            E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4:1.5 C4:.5 C4:2` },
  { id: 'birthday', title: 'Честит рожден ден', emoji: '🎂', color: '#ffc98a', bpm: 100, bar: 3, pickup: 1, key: 'C',
    notes: `G4:.5 G4:.5 A4 G4 C5 B4:2 G4:.5 G4:.5 A4 G4 D5 C5:2 G4:.5 G4:.5 G5 E5 C5 B4 A4:2
            F5:.5 F5:.5 E5 C5 D5 C5:3` },
  { id: 'jingle', title: 'Звънчета', emoji: '❄️', color: '#a8f0e6', bpm: 116, bar: 4, key: 'C',
    notes: `E4 E4 E4:2 E4 E4 E4:2 E4 G4 C4:1.5 D4:.5 E4:4 F4 F4 F4:1.5 F4:.5 F4 E4 E4 E4:.5 E4:.5
            E4 D4 D4 E4 D4:2 G4:2 E4 E4 E4:2 E4 E4 E4:2 E4 G4 C4:1.5 D4:.5 E4:4
            F4 F4 F4:1.5 F4:.5 F4 E4 E4 E4:.5 E4:.5 G4 G4 F4 D4 C4:4` },
];
const FREE_SONG = { id: 'free', free: true, title: 'Свири свободно', color: '#ffe3f1', bpm: 100, bar: 4 };

// Отляво надясно: от най-ниския към най-високия глас.
const PALS = [
  { kind: 'bear',  lane: '#ff7b6b', body: '#b77b4f', belly: '#ecc9a2' },
  { kind: 'cat',   lane: '#ffb52e', body: '#ff9f43', belly: '#ffe2bd' },
  { kind: 'frog',  lane: '#35c985', body: '#6fd05a', belly: '#d8f7ad' },
  { kind: 'bunny', lane: '#8b7cff', body: '#f6eef9', belly: '#ffffff' },
];
// В свободен режим всяко животно редува две ноти от пентатониката — каквото и да натиснеш, звучи хубаво.
const FREE_NOTES = [[48, 55], [60, 62], [64, 67], [69, 72]];
const PRAISE = ['Браво!', 'Супер!', 'Ура!', 'Юхуу!', 'Страхотно!', 'Точно така!'];

const params = new URLSearchParams(location.search);

// ---------- памет (само удобство: звездички и режим) ----------
const store = {
  get(k, d) { try { const v = localStorage.getItem('ritamzoo.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('ritamzoo.' + k, JSON.stringify(v)); } catch { /* частен режим */ } },
};

// ---------- звук ----------
let ac = null, master = null, noiseBuf = null;
function ensureAudio() {
  if (!ac) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* по-стар Safari */ }
    ac = new AC();
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 4;
    comp.connect(ac.destination);
    master = ac.createGain(); master.gain.value = 0.9; master.connect(comp);
    noiseBuf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.2), ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ac.state !== 'running') ac.resume();
}
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
const audioNow = () => (ac ? ac.currentTime : 0);

function envelope(g, when, vol, d) {
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(vol, when + 0.012);
  g.gain.exponentialRampToValueAtTime(vol * 0.45, when + Math.max(0.06, d * 0.7));
  g.gain.exponentialRampToValueAtTime(0.0001, when + d + 0.25);
}

// Всяко животно пее със собствен глас.
function sing(kind, m, when, dur, vol = 0.32) {
  if (!ac) return;
  const f = hz(m), d = Math.min(Math.max(dur, 0.2), 1.3), end = when + d + 0.3;
  const g = ac.createGain(); g.connect(master); envelope(g, when, vol, d);
  const osc = (type, freq, dest, gain = 1) => {
    const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, when);
    if (gain === 1) o.connect(dest);
    else { const gg = ac.createGain(); gg.gain.value = gain; o.connect(gg); gg.connect(dest); }
    o.start(when); o.stop(end); return o;
  };
  const lowpass = (freq, q = 1) => { const f2 = ac.createBiquadFilter(); f2.frequency.value = freq; f2.Q.value = q; f2.connect(g); return f2; };
  if (kind === 'bear') {                       // топло и кръгло
    const lp = lowpass(1600); osc('triangle', f, lp); osc('sine', f * 2, lp, 0.25);
  } else if (kind === 'cat') {                 // „мяу“ — филтърът се отваря и затваря
    const lp = lowpass(700, 4);
    lp.frequency.setValueAtTime(700, when);
    lp.frequency.exponentialRampToValueAtTime(2800, when + 0.09);
    lp.frequency.exponentialRampToValueAtTime(1100, when + d);
    const o = osc('sawtooth', f * 0.93, lp, 0.55); o.frequency.exponentialRampToValueAtTime(f, when + 0.08);
  } else if (kind === 'frog') {                // „блоп“ — височината скача нагоре
    const lp = lowpass(1500); const o = osc('square', f * 0.66, lp, 0.42);
    o.frequency.exponentialRampToValueAtTime(f, when + 0.05);
  } else {                                     // звънче
    osc('sine', f, g);
    const b = ac.createGain(); b.connect(master);
    b.gain.setValueAtTime(vol * 0.45, when); b.gain.exponentialRampToValueAtTime(0.0001, when + 0.35);
    const o = ac.createOscillator(); o.frequency.value = f * 3.01; o.connect(b); o.start(when); o.stop(when + 0.4);
  }
}
function kick(when, vol = 0.5) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.frequency.setValueAtTime(150, when); o.frequency.exponentialRampToValueAtTime(45, when + 0.13);
  g.gain.setValueAtTime(vol, when); g.gain.exponentialRampToValueAtTime(0.0001, when + 0.2);
  o.connect(g); g.connect(master); o.start(when); o.stop(when + 0.22);
}
function tick(when, vol = 0.06) {
  const s = ac.createBufferSource(); s.buffer = noiseBuf;
  const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000;
  const g = ac.createGain(); g.gain.setValueAtTime(vol, when); g.gain.exponentialRampToValueAtTime(0.0001, when + 0.05);
  s.connect(hp); hp.connect(g); g.connect(master); s.start(when); s.stop(when + 0.06);
}
function block(when, hi) {
  const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = hi ? 1250 : 880;
  g.gain.setValueAtTime(0.22, when); g.gain.exponentialRampToValueAtTime(0.0001, when + 0.08);
  o.connect(g); g.connect(master); o.start(when); o.stop(when + 0.1);
}
function bassNote(m, when, d) {
  const o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.value = hz(m);
  envelope(g, when, 0.24, d * 0.8); o.connect(g); g.connect(master); o.start(when); o.stop(when + d + 0.3);
}
function padChord(ms, when, d) {
  for (const m of ms) {
    const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = hz(m);
    g.gain.setValueAtTime(0.0001, when); g.gain.linearRampToValueAtTime(0.035, when + 0.12);
    g.gain.setValueAtTime(0.035, when + d * 0.8); g.gain.linearRampToValueAtTime(0.0001, when + d + 0.1);
    o.connect(g); g.connect(master); o.start(when); o.stop(when + d + 0.15);
  }
}

// ---------- песни ----------
const NOTE_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function toMidi(s) {
  const m = /^([A-G])([#b]?)(\d)$/.exec(s);
  if (!m) throw new Error('Непозната нота: ' + s);
  return 12 * (+m[3] + 1) + NOTE_PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
function parseSong(song) {
  const notes = []; let t = 0;
  for (const tok of song.notes.trim().split(/\s+/)) {
    const [name, d] = tok.split(':'); const dur = d ? parseFloat(d) : 1;
    if (name !== '-') notes.push({ t, dur, midi: toMidi(name), lane: 0, hit: false, missed: false });
    t += dur;
  }
  // По-ниските ноти отиват вляво, по-високите вдясно.
  const uniq = [...new Set(notes.map(n => n.midi))].sort((a, b) => a - b);
  for (const n of notes) {
    const r = uniq.indexOf(n.midi);
    n.lane = uniq.length <= 4 ? Math.round(r * 3 / Math.max(1, uniq.length - 1)) : Math.floor(r * 4 / uniq.length);
  }
  return { notes, length: t };
}

// Съпровод: за всеки такт избира I, IV или V акорд според нотите в него + бас и барабан.
const KEY_PC = { C: 0, D: 2, F: 5, G: 7 };
const TRIADS = [[0, 4, 7], [5, 9, 0], [7, 11, 2]];
function buildEvents(song, notes, length) {
  const ev = [], k = KEY_PC[song.key] || 0, bar = song.bar, pu = song.pickup || 0;
  const bars = Math.ceil((length - pu) / bar);
  for (let b = 0; b < bars; b++) {
    const s = pu + b * bar, e = s + bar;
    let best = 0, bestScore = -1;
    for (const ci of [0, 2, 1]) {
      const pcs = TRIADS[ci].map(x => (x + k) % 12); let sc = 0;
      for (const n of notes) {
        const ov = Math.min(e, n.t + n.dur) - Math.max(s, n.t);
        if (ov > 0 && pcs.includes(n.midi % 12)) sc += ov;
      }
      if (sc > bestScore + 1e-9) { bestScore = sc; best = ci; }
    }
    if (b === bars - 1) best = 0;
    const pcs = TRIADS[best].map(x => (x + k) % 12);
    ev.push({ beat: s, type: 'bass', m: 48 + pcs[0], d: bar === 4 ? 2 : bar });
    if (bar === 4) ev.push({ beat: s + 2, type: 'bass', m: 48 + pcs[2], d: 2 });
    ev.push({ beat: s, type: 'pad', ms: pcs.map(pc => (60 + pc > 67 ? 48 + pc : 60 + pc)), d: bar });
  }
  for (let i = 0; i < Math.ceil(length); i++) {
    const pos = (((i - pu) % bar) + bar) % bar;
    if (pos === 0) ev.push({ beat: i, type: 'kick', v: 0.45 });
    else if (bar === 4 && pos === 2) ev.push({ beat: i, type: 'kick', v: 0.28 });
    ev.push({ beat: i, type: 'tick', v: 0.05 });
    ev.push({ beat: i + 0.5, type: 'tick', v: 0.025 });
  }
  return ev.sort((a, b) => a.beat - b.beat);
}

// ---------- платно и разположение ----------
const cv = document.getElementById('c'), c = cv.getContext('2d');
let W = 0, H = 0, DPR = 1, L = {};
function safeInset(side) {
  const d = document.createElement('div');
  d.style.cssText = `position:fixed;visibility:hidden;height:env(safe-area-inset-${side},0px)`;
  document.body.append(d); const v = d.offsetHeight; d.remove(); return v;
}
function layout() {
  DPR = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight;
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); c.setTransform(DPR, 0, 0, DPR, 0, 0);
  const colW = Math.min(W - 16, 560), laneW = colW / 4, x0 = (W - colW) / 2;
  const S = Math.min(laneW * 0.9, 150, H * 0.19);
  const ay = H - S * 0.76 - 12 - safeInset('bottom');
  const noteR = Math.min(laneW * 0.3, 40);
  const hitY = ay - S * 0.72 - noteR;
  const topY = 62 + safeInset('top');
  L = { x0, laneW, colW, S, ay, noteR, hitY, topY, gy: ay + S * 0.66 };
}
const laneCX = i => L.x0 + L.laneW * (i + 0.5);
function laneAt(x) { return Math.max(0, Math.min(3, Math.floor((x - L.x0) / L.laneW))); }

// ---------- рисуване: помощници ----------
function circ(g, x, y, r, col) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
function ell(g, x, y, rx, ry, col) { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); }
function tri(g, a, b, d, col) { g.fillStyle = col; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(d[0], d[1]); g.closePath(); g.fill(); }
function rr(g, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

function drawEye(g, x, y, r, s) {
  if (s.blink > 0) {
    g.strokeStyle = '#2b2350'; g.lineWidth = r * 0.7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x - r, y); g.lineTo(x + r, y); g.stroke(); return;
  }
  circ(g, x, y, r, '#2b2350'); circ(g, x + r * 0.35, y - r * 0.38, r * 0.36, '#fff');
}

function drawAnimal(g, p, x, y, S, s, t) {
  const k = 1 - s.bounce;
  const hop = s.bounce > 0 ? Math.sin(k * Math.PI) * S * 0.16 : 0;
  const sq = s.bounce > 0 ? 1 + Math.sin(k * Math.PI * 2) * 0.07 : 1;
  const bob = Math.sin(t * 2.2 + s.phase) * S * 0.012;
  const shx = s.shake > 0 ? Math.sin(t * 45) * S * 0.05 * s.shake : 0;
  const open = s.sing > 0 ? Math.min(1, s.sing * 6) * (0.55 + 0.45 * Math.abs(Math.sin(t * 13))) : 0;
  const ink = '#2b2350';

  ell(g, x, y + S * 0.64, S * 0.36 * (1 - hop / S), S * 0.07, 'rgba(43,35,80,.13)');
  g.save();
  g.translate(x + shx, y + bob - hop + S * 0.8); g.scale(1 / sq, sq); g.translate(0, -S * 0.8);

  // тяло
  ell(g, 0, S * 0.5, S * 0.38, S * 0.3, p.body);
  ell(g, 0, S * 0.56, S * 0.22, S * 0.17, p.belly);

  // уши и глава
  if (p.kind === 'bear') {
    for (const d of [-1, 1]) { circ(g, d * S * 0.29, -S * 0.31, S * 0.13, p.body); circ(g, d * S * 0.29, -S * 0.31, S * 0.07, p.belly); }
  } else if (p.kind === 'cat') {
    for (const d of [-1, 1]) {
      tri(g, [d * S * 0.08, -S * 0.38], [d * S * 0.37, -S * 0.54], [d * S * 0.38, -S * 0.12], p.body);
      tri(g, [d * S * 0.17, -S * 0.34], [d * S * 0.33, -S * 0.45], [d * S * 0.33, -S * 0.2], '#ffb3a1');
    }
  } else if (p.kind === 'bunny') {
    for (const d of [-1, 1]) {
      g.save(); g.translate(d * S * 0.15, -S * 0.5); g.rotate(d * (0.14 + Math.sin(t * 3 + s.phase) * 0.05 + open * 0.12));
      ell(g, 0, -S * 0.08, S * 0.09, S * 0.26, p.body); ell(g, 0, -S * 0.06, S * 0.045, S * 0.19, '#ffb8d2');
      g.restore();
    }
  }
  if (p.kind === 'frog') {
    for (const d of [-1, 1]) circ(g, d * S * 0.2, -S * 0.3, S * 0.14, p.body);
    ell(g, 0, 0, S * 0.45, S * 0.34, p.body);
  } else circ(g, 0, 0, S * 0.42, p.body);

  // лице
  if (p.kind === 'frog') {
    for (const d of [-1, 1]) { circ(g, d * S * 0.2, -S * 0.32, S * 0.1, '#fff'); drawEye(g, d * S * 0.2, -S * 0.31, S * 0.05, s); }
  } else {
    for (const d of [-1, 1]) drawEye(g, d * S * 0.15, -S * 0.06, S * 0.05, s);
  }
  if (s.sad > 0) {
    g.strokeStyle = ink; g.lineWidth = S * 0.018; g.lineCap = 'round';
    for (const d of [-1, 1]) { g.beginPath(); g.moveTo(d * S * 0.09, -S * 0.17); g.lineTo(d * S * 0.2, -S * 0.2); g.stroke(); }
  }
  const cheekX = p.kind === 'frog' ? 0.3 : 0.26;
  for (const d of [-1, 1]) ell(g, d * S * cheekX, S * 0.07, S * 0.07, S * 0.045, 'rgba(255,110,150,.42)');

  let my = S * 0.12;
  if (p.kind === 'bear') {
    ell(g, 0, S * 0.12, S * 0.16, S * 0.12, p.belly); ell(g, 0, S * 0.05, S * 0.05, S * 0.035, '#3a2530'); my = S * 0.15;
  } else if (p.kind === 'cat') {
    tri(g, [-S * 0.035, S * 0.03], [S * 0.035, S * 0.03], [0, S * 0.07], '#ff7f93');
    g.strokeStyle = 'rgba(43,35,80,.35)'; g.lineWidth = S * 0.012;
    for (const d of [-1, 1]) for (const dy of [-0.03, 0.03]) {
      g.beginPath(); g.moveTo(d * S * 0.19, S * (0.08 + dy * 0.3)); g.lineTo(d * S * 0.4, S * (0.06 + dy)); g.stroke();
    }
  } else if (p.kind === 'bunny') {
    ell(g, 0, S * 0.05, S * 0.035, S * 0.025, '#ff8fb5');
  } else my = S * 0.1;

  if (open > 0) {
    const mw = S * (p.kind === 'frog' ? 0.14 : 0.075) * (0.8 + 0.3 * open), mh = S * (0.02 + 0.085 * open);
    const cy = my + mh * 0.4;
    ell(g, 0, cy, mw, mh, '#6b2340');
    g.save(); g.beginPath(); g.ellipse(0, cy, mw, mh, 0, 0, Math.PI * 2); g.clip();
    ell(g, 0, cy + mh * 0.75, mw * 0.7, mh * 0.55, '#ff7a9a'); g.restore();
  } else {
    g.strokeStyle = ink; g.lineWidth = S * 0.022; g.lineCap = 'round'; g.beginPath();
    if (s.sad > 0) g.arc(0, my + S * 0.07, S * 0.055, 1.18 * Math.PI, 1.82 * Math.PI);
    else { const r = p.kind === 'frog' ? S * 0.15 : S * 0.06; g.arc(0, my - r + S * 0.03, r, 0.15 * Math.PI, 0.85 * Math.PI); }
    g.stroke();
  }
  g.restore();
}

function drawNote(x, y, r, col, alpha, tail) {
  c.globalAlpha = alpha * 0.35;
  if (tail > r) { c.fillStyle = col; rr(c, x - r * 0.32, y - tail, r * 0.64, tail, r * 0.32); c.fill(); }
  c.globalAlpha = alpha;
  circ(c, x, y + r * 0.13, r, 'rgba(43,35,80,.14)');
  circ(c, x, y, r, col);
  ell(c, x - r * 0.3, y - r * 0.38, r * 0.3, r * 0.17, 'rgba(255,255,255,.55)');
  c.fillStyle = '#fff'; c.font = `900 ${r * 1.15}px Nunito, system-ui, sans-serif`;
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('♪', x + r * 0.04, y + r * 0.06);
  c.globalAlpha = 1;
}

// ---------- състояние ----------
let mode = store.get('mode', 'wait') === 'flow' ? 'flow' : 'wait';
let G = null;
const pst = PALS.map((_, i) => ({ sing: 0, bounce: 0, shake: 0, sad: 0, flash: 0, blink: 0, nextBlink: 1 + Math.random() * 3, phase: i * 1.3, fi: 0 }));
const ps = [], texts = [];
const clouds = Array.from({ length: 5 }, () => ({ x: Math.random(), y: 0.1 + Math.random() * 0.35, s: 0.6 + Math.random() * 0.8, v: 0.006 + Math.random() * 0.01 }));

const $ = id => document.getElementById(id);
const homeEl = $('home'), hudEl = $('hud'), doneEl = $('done'), countEl = $('count'), songsEl = $('songs');

function startSong(song) {
  ensureAudio();
  const free = !!song.free, spb = 60 / song.bpm;
  let notes = [], length = 0, events = [];
  if (!free) { ({ notes, length } = parseSong(song)); events = buildEvents(song, notes, length); }
  const travelB = (mode === 'wait' ? 2.6 : 2.2) / spb;
  let beat = free ? 0 : -travelB - 0.3;
  if (!free && mode === 'flow') {
    const n = song.bar, labels = n === 4 ? ['3', '2', '1', 'Давай!'] : ['2', '1', 'Давай!'];
    for (let i = 0; i < n; i++) events.push({ beat: -n + i, type: 'count', label: labels[i], hi: i === 0 });
    events.sort((a, b) => a.beat - b.beat);
    beat = Math.min(beat, -n - 0.5);
  }
  G = {
    song, free, mode, notes, length, events, evIdx: 0, beat, spb, travelB,
    earlyB: (mode === 'wait' ? 0.32 : 0.24) / spb, lateB: 0.24 / spb,
    pi: 0, hits: 0, wrong: 0, combo: 0, waiting: false, waitStart: 0, finished: false, nextFreeBeat: 0,
  };
  // ?demo=1 — животинчетата сами изпяват песента; ?seek=N — започва от удар N (за проверки).
  G.demo = params.has('demo');
  if (params.has('seek')) {
    G.beat = parseFloat(params.get('seek')) || G.beat;
    while (G.evIdx < events.length && events[G.evIdx].beat < G.beat) G.evIdx++;
    for (const n of notes) if (n.t < G.beat) n.hit = true;
  }
  ps.length = 0; texts.length = 0;
  homeEl.hidden = true; doneEl.hidden = true; hudEl.hidden = false;
  $('songName').textContent = `${free ? '🎹' : song.emoji} ${song.title}`;
  $('prog').style.visibility = free ? 'hidden' : 'visible';
}

function goHome() {
  G = null; ps.length = 0; texts.length = 0;
  hudEl.hidden = true; doneEl.hidden = true; homeEl.hidden = false;
  renderSongs();
}

function fire(e, when) {
  switch (e.type) {
    case 'kick': kick(when, e.v); break;
    case 'tick': tick(when, e.v); break;
    case 'bass': bassNote(e.m, when, e.d * G.spb); break;
    case 'pad': padChord(e.ms, when, e.d * G.spb); break;
    case 'count': block(when, e.hi); setTimeout(() => showCount(e.label), Math.max(0, (when - audioNow()) * 1000)); break;
  }
}
function showCount(txt) {
  countEl.textContent = txt; countEl.classList.remove('pop'); void countEl.offsetWidth; countEl.classList.add('pop');
}

// Часовникът на играта върви по кадрите; звукът се планира спрямо часовника на аудиото.
function advance(now, dt) {
  const t = audioNow();
  let nb = G.beat + dt / G.spb;
  const look = 0.06 / G.spb;
  if (G.free) {
    G.beat = nb;
    while (ac && G.nextFreeBeat <= G.beat + look) {
      const b = G.nextFreeBeat, when = t + Math.max(0, (b - G.beat) * G.spb);
      if (b % 1 === 0) { kick(when, b % 2 === 0 ? 0.3 : 0.16); tick(when, 0.05); } else tick(when, 0.025);
      G.nextFreeBeat += 0.5;
    }
    return;
  }
  while (G.pi < G.notes.length && (G.notes[G.pi].hit || G.notes[G.pi].missed)) G.pi++;
  const pend = G.notes[G.pi];
  if (G.mode === 'wait' && pend && nb >= pend.t) {
    nb = pend.t;
    if (!G.waiting) { G.waiting = true; G.waitStart = now; }
  } else G.waiting = false;
  G.beat = nb;

  if (G.mode === 'flow') {
    for (let i = G.pi; i < G.notes.length; i++) {
      const n = G.notes[i];
      if (n.t > G.beat - G.lateB) break;
      if (!n.hit && !n.missed) { n.missed = true; G.combo = 0; pst[n.lane].sad = 0.7; }
    }
  }
  while (ac && G.evIdx < G.events.length) {
    const e = G.events[G.evIdx];
    if (e.beat > G.beat + look) break;
    if (G.mode === 'wait' && pend && e.beat >= pend.t - 1e-6) break;   // съпроводът чака детето
    fire(e, t + Math.max(0, (e.beat - G.beat) * G.spb));
    G.evIdx++;
  }
  if (G.demo) for (let i = G.pi; i < G.notes.length && G.notes[i].t <= G.beat; i++) if (!G.notes[i].hit) hitNote(G.notes[i], G.notes[i].lane);
  if (!pend && G.beat >= G.length + 0.5) { G.finished = true; setTimeout(showDone, 650); }
}

function tap(lane) {
  if (!G || G.finished) return;
  ensureAudio();
  const p = PALS[lane], s = pst[lane], now = audioNow();
  if (G.free) {
    sing(p.kind, FREE_NOTES[lane][s.fi++ % 2], now, 0.45);
    s.sing = 0.4; s.bounce = 1; s.flash = 1; G.hits++;
    burst(laneCX(lane), L.hitY, p.lane, 8); noteFloat(laneCX(lane), L.hitY - 10, p.lane);
    return;
  }
  for (let i = G.pi; i < G.notes.length; i++) {
    const n = G.notes[i];
    if (n.t - G.beat > G.earlyB) break;
    if (n.hit || n.missed || n.lane !== lane) continue;
    if (G.mode === 'flow' && G.beat - n.t > G.lateB) continue;
    return hitNote(n, lane);
  }
  // Няма нотка тук: животинчето само писука тихичко, без наказание.
  sing(p.kind, FREE_NOTES[lane][0], now, 0.12, 0.09);
  s.bounce = Math.max(s.bounce, 0.5);
  if (G.mode === 'wait' && G.waiting) {
    G.wrong++; s.shake = 1;
    pst[G.notes[G.pi].lane].bounce = 0.7;
    G.waitStart = performance.now() / 1000 - 5;          // веднага показва пръстчето
  }
}

function hitNote(n, lane) {
  n.hit = true;
  const p = PALS[lane], s = pst[lane], d = Math.max(0.25, n.dur * G.spb * 0.95);
  sing(p.kind, n.midi, audioNow(), d);
  s.sing = d; s.bounce = 1; s.flash = 1; s.sad = 0;
  G.hits++; G.combo++;
  const x = laneCX(lane);
  burst(x, L.hitY, p.lane, 10); noteFloat(x, L.hitY - 10, p.lane);
  const err = Math.abs(G.beat - n.t) * G.spb;
  if (G.combo % 10 === 0) sayText(`${G.combo} подред! ${['🎉', '🌟', '🔥', '🏆'][(G.combo / 10 - 1) % 4]}`, W / 2, L.topY + H * 0.16, '#ff6b8b', true);
  else if (G.mode === 'flow' && err < 0.08) sayText('Супер!', x, L.hitY - L.noteR - 18, p.lane);
  else if (G.combo % 6 === 0) sayText(PRAISE[(Math.random() * PRAISE.length) | 0], x, L.hitY - L.noteR - 18, p.lane);
}

// ---------- частици ----------
function burst(x, y, color, n) {
  for (let i = 0; i < n; i++) ps.push({ kind: 'dot', x, y, vx: (Math.random() - 0.5) * 380, vy: -120 - Math.random() * 320, g: 900, life: 0.8, max: 0.8, r: 3 + Math.random() * 4, color });
}
function noteFloat(x, y, color) {
  ps.push({ kind: 'note', x, y, vx: (Math.random() - 0.5) * 70, vy: -120, g: 0, life: 1.1, max: 1.1, r: 20, color, rot: (Math.random() - 0.5) * 0.6, spin: 0 });
}
function confetti() {
  const cols = ['#ff6b8b', '#ffc53d', '#35c985', '#8b7cff', '#5ec8ff', '#ff9f43'];
  for (let i = 0; i < 110; i++) ps.push({ kind: 'rect', x: Math.random() * W, y: -20 - Math.random() * H * 0.6, vx: (Math.random() - 0.5) * 60, vy: 90 + Math.random() * 120, g: 30, life: 5, max: 5, r: 5 + Math.random() * 5, color: cols[i % cols.length], rot: Math.random() * 6, spin: (Math.random() - 0.5) * 8 });
}
function sayText(txt, x, y, color, big) { texts.push({ txt, x, y, color, life: 1, size: big ? 40 : 26 }); }

// ---------- край ----------
function showDone() {
  if (!G) return;
  const total = G.notes.length;
  let stars;
  if (G.mode === 'flow') { const r = G.hits / total; stars = r >= 0.9 ? 3 : r >= 0.6 ? 2 : 1; }
  else { const r = G.wrong / total; stars = r <= 0.15 ? 3 : r <= 0.5 ? 2 : 1; }
  const best = store.get('stars', {}), key = G.song.id + ':' + G.mode;
  if ((best[key] || 0) < stars) { best[key] = stars; store.set('stars', best); }
  $('doneMsg').textContent = ['Хубаво!', 'Браво!', 'Супер!'][stars - 1];
  $('doneSub').textContent = G.mode === 'flow' ? `Хвана ${G.hits} от ${total} нотки 🎵` : 'Животинчетата изпяха цялата песничка! 🎵';
  const spans = [...$('stars').children];
  spans.forEach(s => s.classList.remove('on'));
  doneEl.hidden = false;
  confetti();
  spans.slice(0, stars).forEach((s, i) => setTimeout(() => {
    s.classList.add('on'); sing('bunny', [72, 76, 79][i], audioNow(), 0.35, 0.3);
    pst.forEach(p => { p.bounce = 1; }); pst[i + 1].sing = 0.4;
  }, 350 + i * 380));
}

// ---------- рисуване ----------
function draw(t) {
  const song = G ? G.song : null;
  const sky = c.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#bfe6ff'); sky.addColorStop(0.6, '#ffe8f3'); sky.addColorStop(1, song ? song.color : '#fff3d6');
  c.fillStyle = sky; c.fillRect(0, 0, W, H);

  for (const cl of clouds) {
    const x = cl.x * (W + 240) - 120, y = cl.y * H, s = cl.s * 34;
    c.globalAlpha = 0.85;
    circ(c, x, y, s, '#fff'); circ(c, x + s * 0.9, y + s * 0.2, s * 0.8, '#fff'); circ(c, x - s * 0.9, y + s * 0.25, s * 0.7, '#fff');
    c.globalAlpha = 1;
  }

  // пътечки
  for (let i = 0; i < 4; i++) {
    const x = L.x0 + L.laneW * i + 5, w = L.laneW - 10;
    rr(c, x, L.topY, w, L.gy - L.topY, 24);
    c.fillStyle = 'rgba(255,255,255,.26)'; c.fill();
    if (pst[i].flash > 0) { c.globalAlpha = 0.3 * pst[i].flash; c.fillStyle = PALS[i].lane; c.fill(); c.globalAlpha = 1; }
  }

  // кръгчета-цели
  const pend = G && !G.free ? G.notes[G.pi] : null;
  for (let i = 0; i < 4; i++) {
    const x = laneCX(i), R = L.noteR * 1.14;
    if (G && G.waiting && pend && pend.lane === i) {
      c.globalAlpha = 0.35 + 0.2 * Math.sin(t * 8); circ(c, x, L.hitY, R * 1.35, PALS[i].lane); c.globalAlpha = 1;
    }
    circ(c, x, L.hitY, R, 'rgba(255,255,255,.3)');
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 4;
    c.beginPath(); c.arc(x, L.hitY, R, 0, Math.PI * 2); c.stroke();
  }

  // трева, животни, трева отпред
  c.fillStyle = '#8fe06a'; c.beginPath(); c.moveTo(0, H);
  for (let x = 0; x <= W + 20; x += 20) c.lineTo(x, L.ay + L.S * 0.3 + Math.sin(x * 0.018) * 8);
  c.lineTo(W, H); c.fill();
  PALS.forEach((p, i) => drawAnimal(c, p, laneCX(i), L.ay, L.S, pst[i], t));
  c.fillStyle = '#66c94a'; c.beginPath(); c.moveTo(0, H);
  for (let x = 0; x <= W + 20; x += 20) c.lineTo(x, L.gy + Math.sin(x * 0.03 + 1) * 5);
  c.lineTo(W, H); c.fill();

  // нотки
  if (G && !G.free) {
    const ppb = (L.hitY - L.topY) / G.travelB;
    for (const n of G.notes) {
      const ahead = n.t - G.beat;
      if (ahead > G.travelB + 0.4) break;
      if (n.hit) continue;
      let alpha = 1;
      if (n.missed) { alpha = 1 - (G.beat - n.t - G.lateB) / 0.8; if (alpha <= 0) continue; }
      const y = L.hitY - ahead * ppb;
      alpha *= Math.max(0, Math.min(1, (y - L.topY + L.noteR) / (L.noteR * 2)));
      if (alpha <= 0) continue;
      drawNote(laneCX(n.lane), y, L.noteR, n.missed ? '#b9b3cc' : PALS[n.lane].lane, alpha, n.dur >= 1.5 ? (n.dur - 0.6) * ppb : 0);
    }
  }

  // частици и надписи
  for (const p of ps) {
    c.globalAlpha = Math.min(1, p.life / p.max * 2);
    if (p.kind === 'dot') circ(c, p.x, p.y, p.r, p.color);
    else {
      c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
      if (p.kind === 'note') {
        c.fillStyle = p.color; c.font = `900 ${p.r * 1.6}px Nunito, system-ui`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('♫', 0, 0);
      } else { c.fillStyle = p.color; c.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); }
      c.restore();
    }
  }
  c.globalAlpha = 1;
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  for (const tx of texts) {
    c.globalAlpha = Math.min(1, tx.life * 2);
    c.font = `900 ${tx.size}px Nunito, system-ui, sans-serif`;
    c.lineWidth = tx.size * 0.22; c.strokeStyle = '#fff'; c.strokeText(tx.txt, tx.x, tx.y);
    c.fillStyle = tx.color; c.fillText(tx.txt, tx.x, tx.y);
  }
  c.globalAlpha = 1;

  // пръстче-подсказка, ако детето се чуди
  if (G && G.waiting && pend && performance.now() / 1000 - G.waitStart > 2.2) {
    c.font = `${L.S * 0.42}px system-ui`;
    c.fillText('👆', laneCX(pend.lane) + L.S * 0.28, L.ay + L.S * 0.22 + Math.abs(Math.sin(t * 5)) * -12);
  }
}

// ---------- начален екран ----------
const palCanvases = PALS.map((p, i) => {
  const cvs = document.createElement('canvas'); cvs.width = 76 * 2; cvs.height = 86 * 2;
  cvs.setAttribute('aria-label', 'Животинче — докосни го');
  cvs.addEventListener('pointerdown', () => {
    ensureAudio(); sing(p.kind, FREE_NOTES[i][pst[i].fi++ % 2], audioNow(), 0.4);
    pst[i].sing = 0.35; pst[i].bounce = 1;
  });
  $('pals').append(cvs); return cvs;
});
function drawPals(t) {
  palCanvases.forEach((cvs, i) => {
    const g = cvs.getContext('2d'); g.setTransform(2, 0, 0, 2, 0, 0); g.clearRect(0, 0, 76, 86);
    drawAnimal(g, PALS[i], 38, 44, 50, pst[i], t);
  });
}

function renderSongs() {
  const best = store.get('stars', {});
  songsEl.innerHTML = '';
  for (const s of SONGS) {
    const b = document.createElement('button'); b.className = 'song'; b.style.setProperty('--c', s.color);
    const n = best[s.id + ':' + mode] || 0;
    b.innerHTML = `<span class="e">${s.emoji}</span><b>${s.title}</b><span class="st">${'<i>★</i>'.repeat(n)}${'★'.repeat(3 - n)}</span>`;
    b.onclick = () => startSong(s);
    songsEl.append(b);
  }
  const f = document.createElement('button'); f.className = 'song free';
  f.innerHTML = '<span class="e">🎹</span><b>Свири свободно — без нотки, само музика</b>';
  f.onclick = () => startSong(FREE_SONG);
  songsEl.append(f);
  document.querySelectorAll('#modes button').forEach(b => {
    const on = b.dataset.mode === mode; b.classList.toggle('on', on); b.setAttribute('aria-checked', on);
  });
}
document.querySelectorAll('#modes button').forEach(b => b.addEventListener('click', () => {
  mode = b.dataset.mode; store.set('mode', mode); renderSongs();
}));
$('back').addEventListener('click', goHome);
$('toHome').addEventListener('click', goHome);
$('again').addEventListener('click', () => G && startSong(G.song));

cv.addEventListener('pointerdown', e => { if (G) { e.preventDefault(); tap(laneAt(e.clientX)); } });
const KEYS = { d: 0, f: 1, j: 2, k: 3, 1: 0, 2: 1, 3: 2, 4: 3, ArrowLeft: 0, ArrowDown: 1, ArrowUp: 2, ArrowRight: 3 };
addEventListener('keydown', e => {
  if (e.repeat || !G) return;
  if (e.key === 'Escape') return goHome();
  const lane = KEYS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
  if (lane !== undefined) { e.preventDefault(); tap(lane); }
});
addEventListener('resize', layout);

// ---------- главен цикъл ----------
let lastT = performance.now() / 1000, T = 0;
function loop() {
  const now = performance.now() / 1000, dt = Math.min(0.05, now - lastT); lastT = now; T += dt;
  if (G && !G.finished) advance(now, dt);
  for (const s of pst) {
    s.sing = Math.max(0, s.sing - dt); s.bounce = Math.max(0, s.bounce - dt * 2.8); s.shake = Math.max(0, s.shake - dt * 2.5);
    s.sad = Math.max(0, s.sad - dt); s.flash = Math.max(0, s.flash - dt * 3);
    s.nextBlink -= dt; if (s.nextBlink < 0) { s.blink = 0.14; s.nextBlink = 2 + Math.random() * 3; }
    s.blink = Math.max(0, s.blink - dt);
  }
  for (let i = ps.length - 1; i >= 0; i--) {
    const p = ps[i]; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; if (p.spin) p.rot += p.spin * dt;
    if (p.life <= 0 || p.y > H + 40) ps.splice(i, 1);
  }
  for (let i = texts.length - 1; i >= 0; i--) { const tx = texts[i]; tx.y -= 40 * dt; tx.life -= dt * 0.9; if (tx.life <= 0) texts.splice(i, 1); }
  for (const cl of clouds) { cl.x += cl.v * dt; if (cl.x > 1.1) cl.x = -0.1; }

  draw(T);
  if (!homeEl.hidden) drawPals(T);
  if (G) {
    $('prog').firstElementChild.style.width = G.free ? '0' : Math.max(0, Math.min(100, G.beat / G.length * 100)) + '%';
    $('score').textContent = `⭐ ${G.hits}`;
  }
  requestAnimationFrame(loop);
}

layout();
renderSongs();
// ?play=twinkle&mode=flow отваря направо песен (удобно за линк към любимата песничка).
const direct = params.get('play');
if (direct) {
  if (params.get('mode') === 'flow' || params.get('mode') === 'wait') mode = params.get('mode');
  const s = direct === 'free' ? FREE_SONG : SONGS.find(x => x.id === direct);
  if (s) startSong(s);
}
requestAnimationFrame(loop);
