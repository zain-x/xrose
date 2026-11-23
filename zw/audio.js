// 🔊 every sound of Rombie World is made right here - still no files - but
// "baked": each sound is rendered once (in a few variations) into an audio
// buffer with real sound-design layers, then played back slightly pitched and
// placed in 3D.
//   guns:   a sharp crack + a gritty mid punch + a deep boom + the air's tail +
//           the street's echoes (a slap off the near wall, the far end of the block)
//   the dead: a throaty voice (a buzzing source through moving vowel formants)
//           with breath and rasp - groans, screams, roars, grunts, death rattles
//   hits, gore, explosions with crackling debris, footfalls, mechanical clicks
// Under it all: wind down empty streets and the city's low rumble.
import * as THREE from "three";

// ---- the guns' recipes --------------------------------------------------------------
// crack: the snap (amp, high-pass Hz, decay s) · body: the punch (amp, band lo/hi Hz,
// decay s, drive) · boom: the chest thump (amp, from/to Hz, drop s, decay s) ·
// tail: the air (amp, low-pass Hz, decay s) · mech: the bolt's clack · echo:
// [delay s, gain, low-pass Hz] · level: the peak it's mastered to
const GUN = {
  pistol: { crack: [0.9, 2200, 0.004], body: [0.8, 350, 4000, 0.03, 3], boom: [0.7, 170, 70, 0.015, 0.07], tail: [0.2, 1400, 0.18], echo: [[0.085, 0.32, 2500], [0.19, 0.18, 1500], [0.34, 0.09, 900]], len: 0.9, level: 0.7, gain: 0.8 },
  magnum: { crack: [1, 1900, 0.005], body: [1, 250, 3500, 0.045, 4], boom: [1, 140, 55, 0.02, 0.12], tail: [0.3, 1200, 0.3], echo: [[0.1, 0.38, 2200], [0.23, 0.22, 1300], [0.42, 0.12, 800]], len: 1.4, level: 0.95, gain: 1 },
  shotgun: { crack: [0.8, 1500, 0.006], body: [1.1, 200, 3000, 0.06, 4.5], boom: [1.1, 120, 45, 0.025, 0.16], tail: [0.4, 1000, 0.35], echo: [[0.1, 0.4, 2000], [0.25, 0.24, 1200], [0.46, 0.12, 700]], len: 1.5, level: 1, gain: 1 },
  uzi: { crack: [0.8, 2600, 0.003], body: [0.7, 400, 4500, 0.018, 2.5], boom: [0.45, 200, 95, 0.01, 0.045], tail: [0.15, 1600, 0.1], mech: 0.15, echo: [[0.07, 0.22, 2500], [0.16, 0.1, 1400]], len: 0.5, level: 0.55, gain: 0.7 },
  ak: { crack: [0.95, 2000, 0.0045], body: [0.9, 300, 3800, 0.03, 3.5], boom: [0.85, 150, 60, 0.016, 0.085], tail: [0.25, 1300, 0.2], mech: 0.12, echo: [[0.09, 0.3, 2300], [0.2, 0.17, 1400], [0.37, 0.08, 800]], len: 0.9, level: 0.72, gain: 0.85 },
  sniper: { crack: [1, 2600, 0.006], body: [1, 250, 4500, 0.05, 4], boom: [1.1, 130, 42, 0.03, 0.18], tail: [0.38, 1100, 0.5], echo: [[0.14, 0.42, 2000], [0.33, 0.28, 1200], [0.62, 0.16, 700], [0.95, 0.08, 500]], len: 2.2, level: 1, gain: 1 },
  // 🔫 the machine gun: heavy, chesty, every round its own "dut"
  minigun: { crack: [0.85, 1800, 0.005], body: [1, 260, 3200, 0.035, 4.2], boom: [1.1, 135, 52, 0.018, 0.1], tail: [0.28, 1100, 0.22], mech: 0.18, echo: [[0.09, 0.28, 2000], [0.21, 0.15, 1200]], len: 0.8, level: 0.8, gain: 0.72 },
  gl: { crack: [0.25, 1200, 0.004], body: [0.7, 150, 1200, 0.05, 2.5], boom: [1, 110, 55, 0.02, 0.1], tail: [0.2, 800, 0.2], echo: [[0.1, 0.25, 1500]], len: 0.7, level: 0.7, gain: 0.8 },
  rpg: { crack: [0.6, 1300, 0.006], body: [0.9, 180, 2200, 0.09, 3], boom: [1, 95, 40, 0.03, 0.2], tail: [0.45, 900, 0.5], echo: [[0.12, 0.35, 1500], [0.3, 0.2, 900]], len: 1.6, level: 0.9, gain: 0.9 },
  heli: { crack: [0.8, 1800, 0.005], body: [0.9, 300, 3000, 0.03, 3.5], boom: [0.9, 140, 55, 0.016, 0.09], tail: [0.3, 1100, 0.25], echo: [[0.12, 0.3, 1800], [0.28, 0.16, 1000]], len: 0.9, level: 0.7, gain: 0.7 },
};

// ---- the dead's voices: pitch, its shape over time, vowels (formants), rasp ----------------
const VOW = { uh: [600, 1100, 2400], ah: [760, 1250, 2600], oh: [480, 850, 2400], eh: [560, 1750, 2500], aa: [850, 1500, 2700] };
const VOICE = {
  groan: { n: 5, f0: 85, dur: [1.1, 1.8], shape: (u) => 1 - 0.22 * u + 0.07 * Math.sin(6 * u), vow: ["uh", "oh"], growl: 0.6, breath: 0.45, dist: 2.2, att: 0.14, level: 0.55, v: 0.55 },
  scream: { n: 3, f0: 300, dur: [0.8, 1.1], shape: (u) => 0.8 + 0.5 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.3)), 0.7), vow: ["aa", "eh"], growl: 0.35, breath: 0.6, dist: 4, att: 0.04, level: 0.7, v: 0.6 },
  roar: { n: 2, f0: 90, dur: [1.3, 1.8], shape: (u) => 1.05 - 0.25 * u, vow: ["ah", "oh"], growl: 0.9, breath: 0.7, dist: 5, att: 0.08, level: 0.85, v: 0.9 },
  attack: { n: 4, f0: 160, dur: [0.32, 0.45], shape: (u) => 1.1 - 0.4 * u, vow: ["ah", "uh"], growl: 0.5, breath: 0.5, dist: 3, att: 0.02, level: 0.6, v: 0.55 },
  die: { n: 3, f0: 120, dur: [0.6, 0.9], shape: (u) => 1 - 0.45 * u, vow: ["oh", "uh"], growl: 0.7, breath: 0.55, dist: 2.5, att: 0.03, level: 0.5, v: 0.5, gurgle: 9 },
};

export function setupAudio(Z) {
  const { api } = Z;
  const R = Z.rnd;
  let ctx = null,
    bus = null,
    revIn = null,
    noiseBuf = null,
    voices = 0,
    started = false,
    SR = 44100;
  const sfx = (Z.sfx = {});
  const A = (Z.audio = { intensity: 0 });

  function makeImpulse(secs, decay) {
    const n = Math.floor(ctx.sampleRate * secs);
    const b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
    }
    return b;
  }
  A.start = () => {
    if (started) return;
    ctx = api.audio();
    if (!ctx) return;
    started = true;
    SR = ctx.sampleRate;
    if (ctx.state !== "running") ctx.resume();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 6;
    comp.ratio.value = 4;
    comp.attack.value = 0.002;
    comp.release.value = 0.18;
    comp.connect(ctx.destination);
    bus = ctx.createGain();
    bus.gain.value = 0.85;
    bus.connect(comp);
    const conv = ctx.createConvolver();
    conv.buffer = makeImpulse(2.2, 3.4);
    revIn = ctx.createGain();
    const wet = ctx.createGain();
    wet.gain.value = 0.3;
    revIn.connect(conv).connect(wet).connect(comp);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    startAmbience();
    // the guns she holds first, baked now; the rest a little at a time
    variants("gun:minigun");
    variants("flesh");
  };
  const ok = () => started && ctx && ctx.state === "running";

  // ==== the little offline DSP kit (Float32Arrays at the context's rate) =================
  const N = (sec) => Math.max(1, Math.ceil(sec * SR));
  const coef = (fc) => 1 - Math.exp((-2 * Math.PI * Math.min(fc, SR * 0.45)) / SR);
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  }
  const strSeed = (s) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  };
  function noiseArr(n, r) {
    const a = new Float32Array(n);
    for (let i = 0; i < n; i++) a[i] = r() * 2 - 1;
    return a;
  }
  // one-pole low-pass (the cut-off may move with time: a function of t)
  function lp1(x, fc) {
    const fn = typeof fc === "function";
    let a = fn ? coef(fc(0)) : coef(fc),
      y = 0;
    for (let i = 0; i < x.length; i++) {
      if (fn && (i & 31) === 0) a = coef(fc(i / SR));
      y += a * (x[i] - y);
      x[i] = y;
    }
    return x;
  }
  function hp1(x, fc) {
    const a = coef(fc);
    let y = 0;
    for (let i = 0; i < x.length; i++) {
      y += a * (x[i] - y);
      x[i] -= y;
    }
    return x;
  }
  // a resonant band-pass (0 dB at its centre, which may glide)
  function bp(x, fc, q) {
    let b0 = 0, b2 = 0, a1 = 0, a2 = 0, x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    const fn = typeof fc === "function";
    const set = (f) => {
      const w = (2 * Math.PI * Math.min(Math.max(f, 20), SR * 0.45)) / SR,
        al = Math.sin(w) / (2 * q),
        a0 = 1 + al;
      b0 = al / a0;
      b2 = -al / a0;
      a1 = (-2 * Math.cos(w)) / a0;
      a2 = (1 - al) / a0;
    };
    set(fn ? fc(0) : fc);
    for (let i = 0; i < x.length; i++) {
      if (fn && (i & 63) === 0) set(fc(i / SR));
      const xi = x[i],
        yi = b0 * xi + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1;
      x1 = xi;
      y2 = y1;
      y1 = yi;
      x[i] = yi;
    }
    return x;
  }
  // a fast rise, then an exponential fall (after an optional delay)
  function env(x, tau, att = 0.0005, delay = 0) {
    for (let i = 0; i < x.length; i++) {
      const t = i / SR - delay;
      x[i] *= t < 0 ? 0 : t < att ? t / att : Math.exp(-(t - att) / tau);
    }
    return x;
  }
  function addTo(out, x, g = 1, off = 0) {
    const o = Math.round(off * SR);
    for (let i = 0; i < x.length && i + o < out.length; i++) out[i + o] += x[i] * g;
    return out;
  }
  function drive(x, k) {
    const n = Math.tanh(k);
    for (let i = 0; i < x.length; i++) x[i] = Math.tanh(x[i] * k) / n;
    return x;
  }
  function sweep(n, f, r) {
    const a = new Float32Array(n);
    let ph = r() * 6.283;
    for (let i = 0; i < n; i++) {
      ph += (2 * Math.PI * f(i / SR)) / SR;
      a[i] = Math.sin(ph);
    }
    return a;
  }
  // the street answers: darker, later copies of the sound
  function echo(x, taps) {
    const src = Float32Array.from(x);
    for (const [d, g, fc] of taps) {
      const o = Math.round(d * SR),
        a = coef(fc);
      let y = 0;
      for (let i = 0; i + o < x.length; i++) {
        y += a * (src[i] - y);
        x[i + o] += y * g;
      }
    }
    return x;
  }
  function master(x, peak, tail = 0.03) {
    let m = 0;
    for (let i = 0; i < x.length; i++) if (Math.abs(x[i]) > m) m = Math.abs(x[i]);
    const k = m > 0 ? peak / m : 0;
    const f = Math.min(x.length, N(tail));
    for (let i = 0; i < x.length; i++) x[i] *= k * (i > x.length - f ? (x.length - i) / f : 1);
    return x;
  }

  // ==== the recipes ===================================================================
  function bakeGun(p, r) {
    const j = (v, s = 0.12) => v * (1 + (r() * 2 - 1) * s);
    const out = new Float32Array(N(p.len));
    const [ca, chp, ct] = p.crack;
    addTo(out, env(hp1(noiseArr(N(0.05), r), j(chp)), j(ct, 0.2), 0.0002), ca);
    const [ba, lo, hi, bt, dr] = p.body;
    const b = noiseArr(N(0.35), r);
    lp1(b, (t) => hi * Math.exp(-t / 0.08) + lo * 2);
    hp1(b, lo);
    addTo(out, drive(env(b, j(bt), 0.0008), dr), ba);
    const [oa, f0, f1, fd, ot] = p.boom;
    const F0 = j(f0),
      F1 = j(f1, 0.08);
    addTo(out, env(sweep(N(Math.min(p.len, ot * 6)), (t) => F1 + (F0 - F1) * Math.exp(-t / fd), r), j(ot), 0.001), oa);
    const [ta, tlp, tt] = p.tail;
    const tl = noiseArr(out.length, r);
    lp1(tl, (t) => tlp * Math.exp(-t / (tt * 1.5)) + 120);
    addTo(out, env(tl, j(tt), 0.004), ta);
    if (p.mech) addTo(out, env(bp(noiseArr(N(0.04), r), j(2800, 0.15), 9), 0.006, 0.0002), p.mech, 0.0015);
    drive(out, 1.4);
    echo(out, p.echo.map(([d, g, fc]) => [j(d, 0.15), g, fc]));
    return master(out, p.level);
  }
  function bakeVoice(K, r) {
    const dur = K.dur[0] + r() * (K.dur[1] - K.dur[0]);
    const n = N(dur + 0.06);
    const src = new Float32Array(n);
    const f0 = K.f0 * (0.9 + r() * 0.2),
      wob = 2 + r() * 4,
      rasp = 22 + r() * 18;
    let ph = 0,
      ph2 = 0,
      jit = 1;
    for (let i = 0; i < n; i++) {
      const t = i / SR,
        u = Math.min(1, t / dur);
      if ((i & 127) === 0) jit = 1 + (r() - 0.5) * 0.05;
      const f = f0 * K.shape(u) * (1 + 0.03 * Math.sin(2 * Math.PI * wob * t)) * jit;
      ph += f / SR;
      if (ph >= 1) ph -= 1;
      ph2 += (f * 0.5) / SR;
      if (ph2 >= 1) ph2 -= 1;
      // a soft-cornered buzz (glottal-ish) with a sub-harmonic rasp under it
      let s = 1 - 2 * ph;
      s = 1.5 * s - 0.5 * s * s * s;
      s += K.growl * 0.45 * (1 - 2 * ph2) * (0.6 + 0.4 * Math.sin(2 * Math.PI * rasp * t));
      if (K.gurgle) s *= 0.55 + 0.45 * Math.sin(2 * Math.PI * K.gurgle * t + Math.sin(13 * t));
      src[i] = s;
    }
    const [va, vb] = K.vow.map((k) => VOW[k]);
    const fm = (k) => (t) => {
      const u = Math.min(1, t / dur),
        e = u * u * (3 - 2 * u);
      return va[k] + (vb[k] - va[k]) * e;
    };
    const out = new Float32Array(n);
    addTo(out, bp(Float32Array.from(src), fm(0), 5), 1);
    addTo(out, bp(Float32Array.from(src), fm(1), 7), 0.6);
    addTo(out, bp(Float32Array.from(src), fm(2), 9), 0.3);
    const br = bp(noiseArr(n, r), fm(1), 1.8);
    addTo(out, br, K.breath);
    drive(out, K.dist);
    // the shape of the breath: in, held, out
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const a = Math.min(1, t / K.att),
        rel = Math.min(1, Math.max(0, (dur - t) / (dur * 0.3)));
      out[i] *= a * rel * rel;
    }
    return master(out, K.level, 0.05);
  }
  function bakeFlesh(r, head) {
    const out = new Float32Array(N(0.4));
    const t1 = noiseArr(N(0.2), r);
    lp1(t1, (t) => 1800 * Math.exp(-t / 0.03) + 250);
    addTo(out, drive(env(t1, 0.035, 0.0006), 2.5), 1);
    addTo(out, env(sweep(N(0.2), (t) => 70 + 90 * Math.exp(-t / 0.02), r), 0.05, 0.001), 0.8);
    addTo(out, env(bp(noiseArr(N(0.3), r), (t) => 700 - 900 * t, 3), 0.07, 0.004, 0.01), 0.55); // the wet bit
    if (head) {
      addTo(out, env(hp1(noiseArr(N(0.03), r), 3000), 0.004, 0.0002), 0.7);
      addTo(out, env(sweep(N(0.06), (t) => 380 + 700 * Math.exp(-t / 0.006), r), 0.014, 0.0003), 0.5);
    }
    return master(out, head ? 0.85 : 0.7);
  }
  function bakeGore(r) {
    const n = N(0.75),
      out = new Float32Array(n);
    const sp = bp(noiseArr(n, r), (t) => 900 - 1000 * Math.min(0.5, t), 1.5);
    // lumpy: the wet crackle comes in bursts
    for (let i = 0, g = 1, k = 0; i < n; i++) {
      if (k-- <= 0) {
        k = N(0.004 + r() * 0.012);
        g = r() < 0.55 ? r() : 0.15;
      }
      sp[i] *= g;
    }
    addTo(out, drive(env(sp, 0.18, 0.004), 2), 1);
    addTo(out, env(sweep(N(0.4), (t) => 45 + 60 * Math.exp(-t / 0.03), r), 0.12, 0.002), 0.9);
    return master(out, 0.8);
  }
  function bakeBoom(r, big) {
    const n = N(3.4),
      out = new Float32Array(n);
    addTo(out, env(hp1(noiseArr(N(0.06), r), 1500), 0.008, 0.0003), 0.8);
    const b = noiseArr(n, r);
    lp1(b, (t) => 3500 * Math.exp(-t / 0.25) + 150);
    addTo(out, drive(env(b, 0.45 * big, 0.002), 3), 1);
    addTo(out, env(sweep(n, (t) => 32 + 50 * Math.exp(-t / 0.08), r), 0.55 * big, 0.002), 1.2);
    // debris: sparse crackles falling off
    for (let k = 0; k < 60; k++) {
      const t0 = 0.15 + Math.pow(r(), 1.7) * 1.8;
      const cl = env(bp(noiseArr(N(0.03), r), 1500 + r() * 3500, 4), 0.004 + r() * 0.006, 0.0002);
      addTo(out, cl, 0.25 * (1 - t0 / 2.2) * r(), t0);
    }
    const rb = noiseArr(n, r);
    lp1(lp1(rb, 220), 220);
    addTo(out, env(rb, 1.1 * big, 0.05), 1.6);
    drive(out, 1.6);
    echo(out, [[0.14, 0.3, 900], [0.35, 0.2, 600]]);
    return master(out, 1, 0.3);
  }
  function bakeStomp(r) {
    const n = N(0.9),
      out = new Float32Array(n);
    addTo(out, env(sweep(n, (t) => 30 + 40 * Math.exp(-t / 0.04), r), 0.22, 0.002), 1.2);
    const b = noiseArr(N(0.4), r);
    lp1(lp1(b, 350), 350);
    addTo(out, env(b, 0.08, 0.002), 2);
    for (let k = 0; k < 14; k++) addTo(out, env(bp(noiseArr(N(0.02), r), 800 + r() * 2000, 4), 0.005, 0.0002), 0.12 * r(), 0.03 + r() * 0.3);
    return master(drive(out, 1.5), 0.9);
  }
  function bakeHurt(r) {
    const out = new Float32Array(N(0.4));
    const p = noiseArr(N(0.15), r);
    lp1(p, 700);
    addTo(out, drive(env(p, 0.035, 0.001), 2), 1);
    addTo(out, env(sweep(N(0.2), (t) => 60 + 70 * Math.exp(-t / 0.02), r), 0.06, 0.001), 0.9);
    addTo(out, env(bp(noiseArr(N(0.3), r), 1300, 1.2), 0.09, 0.02, 0.03), 0.25);
    return master(out, 0.6);
  }
  // a little metal click (its ring comes from the resonance)
  function bakeClick(r, f, q, lvl) {
    const x = env(noiseArr(N(0.09), r), 0.0012, 0.0001);
    return master(bp(x, f * (0.95 + r() * 0.1), q), lvl);
  }
  function bakeThunk(r) {
    const out = new Float32Array(N(0.2));
    const p = noiseArr(N(0.1), r);
    lp1(p, 500);
    addTo(out, env(p, 0.02, 0.0005), 1);
    addTo(out, env(sweep(N(0.12), () => 190, r), 0.03, 0.001), 0.6);
    addTo(out, env(bp(noiseArr(N(0.05), r), 2400, 8), 0.004, 0.0002), 0.4, 0.004);
    return master(out, 0.55);
  }
  // a deep cinematic hit (a new wave)
  function bakeHit(r) {
    const n = N(2.6),
      out = new Float32Array(n);
    addTo(out, env(sweep(n, (t) => 32 + 26 * Math.exp(-t / 0.15), r), 0.9, 0.003), 1);
    const b = noiseArr(n, r);
    lp1(lp1(b, 180), 180);
    addTo(out, env(b, 0.5, 0.004), 2.4);
    echo(out, [[0.2, 0.25, 500]]);
    return master(drive(out, 1.3), 0.7, 0.4);
  }
  const RECIPES = {
    flesh: [4, (r) => bakeFlesh(r, false)],
    fleshHead: [3, (r) => bakeFlesh(r, true)],
    gore: [3, bakeGore],
    boom: [2, (r) => bakeBoom(r, 1)],
    boomBig: [1, (r) => bakeBoom(r, 1.4)],
    stomp: [2, bakeStomp],
    hurt: [3, bakeHurt],
    clickHi: [3, (r) => bakeClick(r, 3300, 10, 0.5)],
    clickLo: [3, (r) => bakeClick(r, 1500, 6, 0.55)],
    thunk: [2, bakeThunk],
    hit: [1, bakeHit],
  };
  for (const id in GUN) RECIPES["gun:" + id] = [4, (r) => bakeGun(GUN[id], r)];
  for (const k in VOICE) RECIPES["v:" + k] = [VOICE[k].n, (r) => bakeVoice(VOICE[k], r)];
  const bank = {};
  function variants(name) {
    let v = bank[name];
    if (!v) {
      const [count, make] = RECIPES[name];
      v = bank[name] = [];
      for (let i = 0; i < count; i++) {
        const x = make(rng(strSeed(name) + i * 7919));
        const b = ctx.createBuffer(1, x.length, SR);
        b.getChannelData(0).set(x);
        v.push(b);
      }
    }
    return v;
  }
  // warm the rest up one at a time while she plays (no stutter on the first shot)
  const warm = Object.keys(RECIPES);
  function play(name, pos, gain = 1, rate = 1, rev = 0.15, ref = 8, when = 0) {
    const v = variants(name);
    const s = ctx.createBufferSource();
    s.buffer = v[(Math.random() * v.length) | 0];
    s.playbackRate.value = rate;
    const g = ctx.createGain();
    g.gain.value = gain;
    s.connect(g);
    route([g], pos, rev, ref);
    s.start(ctx.currentTime + when);
    return s;
  }

  // ---- plumbing for the few sounds still made live --------------------------------------
  function panner(pos, ref = 6) {
    const p = ctx.createPanner();
    p.panningModel = api.isTouch ? "equalpower" : "HRTF";
    p.distanceModel = "inverse";
    p.refDistance = ref;
    p.rolloffFactor = 1.1;
    p.maxDistance = 400;
    setPos(p, pos);
    return p;
  }
  function setPos(p, pos) {
    if (p.positionX) {
      const t = ctx.currentTime;
      p.positionX.setTargetAtTime(pos.x, t, 0.02);
      p.positionY.setTargetAtTime(pos.y, t, 0.02);
      p.positionZ.setTargetAtTime(pos.z, t, 0.02);
    } else p.setPosition(pos.x, pos.y, pos.z);
  }
  function route(nodes, pos, rev = 0.2, ref = 6) {
    const dest = pos ? panner(pos, ref) : ctx.createGain();
    for (const n of nodes) n.connect(dest);
    dest.connect(bus);
    if (rev > 0) {
      const s = ctx.createGain();
      s.gain.value = rev;
      dest.connect(s).connect(revIn);
    }
    return dest;
  }
  function noise(t, dur) {
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    s.loop = true;
    s.start(t, Math.random() * 1.5);
    s.stop(t + dur);
    return s;
  }
  function osc(type, f, t, dur) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    o.start(t);
    o.stop(t + dur);
    return o;
  }
  function gainEnv(t, a, peak, d) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    return g;
  }
  function filt(type, f, q = 1) {
    const b = ctx.createBiquadFilter();
    b.type = type;
    b.frequency.value = f;
    b.Q.value = q;
    return b;
  }
  const curves = {};
  function shaper(amt) {
    if (!curves[amt]) {
      const n = 1024,
        c = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const x = (i / n) * 2 - 1;
        c[i] = ((1 + amt) * x) / (1 + amt * Math.abs(x));
      }
      curves[amt] = c;
    }
    const w = ctx.createWaveShaper();
    w.curve = curves[amt];
    return w;
  }

  // ---- guns ---------------------------------------------------------------------------------
  sfx.shot = (id, pos = null) => {
    if (!ok()) return;
    const key = GUN[id] ? id : "pistol";
    play("gun:" + key, pos, GUN[key].gain, R(0.95, 1.05), 0.12, 10);
    if (id === "rpg" || id === "gl") {
      // the round's whoosh away
      const t = ctx.currentTime;
      const w = noise(t, 0.7);
      const bpf = filt("bandpass", 500, 2);
      bpf.frequency.exponentialRampToValueAtTime(2200, t + 0.6);
      const wg = gainEnv(t, 0.05, 0.22, 0.6);
      w.connect(bpf).connect(wg);
      route([wg], pos, 0.2);
    }
  };
  sfx.empty = () => ok() && play("clickHi", null, 0.5, R(0.95, 1.05), 0.02);
  sfx.reload = (secs) => {
    if (!ok()) return;
    play("clickLo", null, 0.8, 1, 0.05, 6, 0.05); // the mag drops
    play("thunk", null, 0.9, 1, 0.05, 6, secs * 0.45); // the new one goes in
    play("clickHi", null, 0.8, 1, 0.05, 6, secs * 0.88); // the bolt
    play("clickLo", null, 0.7, 0.8, 0.05, 6, secs * 0.93);
  };
  sfx.cock = () => {
    if (!ok()) return;
    play("clickLo", null, 0.8, 1, 0.05);
    play("clickHi", null, 0.9, 1.05, 0.05, 6, 0.11);
  };
  sfx.swing = () => {
    if (!ok()) return;
    const t = ctx.currentTime;
    const n = noise(t, 0.25);
    const bpf = filt("bandpass", 700, 1.5);
    bpf.frequency.exponentialRampToValueAtTime(2800, t + 0.16);
    const g = gainEnv(t, 0.04, 0.28, 0.16);
    n.connect(bpf).connect(g);
    route([g], null, 0.05);
  };
  sfx.slash = () => {
    if (!ok()) return;
    sfx.flesh(null, true);
    play("gore", null, 0.5, R(1.1, 1.3), 0.05);
  };
  // a bullet into a body (a head: bone cracks too)
  sfx.flesh = (pos, head = false) => ok() && play(head ? "fleshHead" : "flesh", pos, head ? 0.75 : 0.6, R(0.9, 1.1), 0.05, 8);
  // the wet one: a head coming off, a body bursting
  sfx.gore = (pos) => ok() && play("gore", pos, 0.85, R(0.9, 1.1), 0.1, 10);
  sfx.ricochet = (pos) => {
    if (!ok() || Math.random() < 0.6) return;
    const t = ctx.currentTime;
    const o = osc("sine", R(2500, 4200), t, 0.3);
    o.frequency.exponentialRampToValueAtTime(R(900, 1500), t + 0.25);
    const g = gainEnv(t, 0.002, 0.05, 0.25);
    o.connect(g);
    route([g], pos, 0.2, 6);
  };

  // ---- explosions -----------------------------------------------------------------------------
  sfx.explosion = (pos, big = 1) => {
    if (!ok()) return;
    play(big > 1.2 ? "boomBig" : "boom", pos, Math.min(1.3, 0.75 + 0.3 * big), R(0.92, 1.05) / Math.max(0.8, Math.sqrt(big)), 0.4, 18);
  };
  sfx.whistle = (pos) => {
    if (!ok()) return;
    const t = ctx.currentTime;
    const o = osc("sine", 1900, t, 1.3);
    o.frequency.exponentialRampToValueAtTime(420, t + 1.25);
    const g = gainEnv(t, 0.3, 0.1, 0.95);
    o.connect(g);
    route([g], pos, 0.2, 20);
  };

  // ---- the dead: groans, screams, roars ---------------------------------------------------------
  sfx.voice = (pos, kind = "groan", pitch = 1) => {
    if (!ok()) return;
    const V = VOICE[kind] || VOICE.groan;
    if (kind === "groan" && voices >= (api.isTouch ? 3 : 5)) return;
    const s = play("v:" + (VOICE[kind] ? kind : "groan"), pos, V.v, pitch * R(0.92, 1.08), 0.15, kind === "roar" ? 12 : 5);
    voices++;
    s.onended = () => voices--;
  };

  // ---- her ------------------------------------------------------------------------------------------
  sfx.hurt = (amt) => ok() && play("hurt", null, Math.min(0.8, 0.35 + amt * 0.03), R(0.9, 1.1), 0.05);
  sfx.death = () => {
    if (!ok()) return;
    const t = ctx.currentTime;
    const o = osc("sine", 3300, t, 3);
    const g = gainEnv(t, 0.05, 0.03, 2.8);
    o.connect(g);
    route([g], null, 0.4);
    play("hit", null, 0.9, 0.9, 0.4);
  };
  function heartbeat(t, v) {
    for (const dt of [0, 0.22]) {
      const o = osc("sine", 58, t + dt, 0.2);
      o.frequency.exponentialRampToValueAtTime(36, t + dt + 0.12);
      const g = gainEnv(t + dt, 0.005, v * (dt ? 0.7 : 1), 0.14);
      o.connect(g);
      route([g], null, 0);
    }
  }
  // pickups: soft bells (a sine and its octave, ringing out)
  sfx.pickup = (kind) => {
    if (!ok()) return;
    if (kind === "weapon") return sfx.cock();
    const t = ctx.currentTime;
    const notes = kind === "health" ? [523, 784, 1047] : kind === "armor" ? [392, 523, 659] : kind === "power" ? [440, 660, 880, 1320] : [660, 990];
    notes.forEach((f, i) => {
      for (const [m, v] of [[1, 0.1], [2, 0.03]]) {
        const o = osc("sine", f * m, t + i * 0.07, 0.6);
        const g = gainEnv(t + i * 0.07, 0.004, v, 0.5);
        o.connect(g);
        route([g], null, 0.2);
      }
    });
  };
  sfx.beep = (pos, v = 0.1) => {
    if (!ok()) return;
    const t = ctx.currentTime;
    const o = osc("sine", 1750, t, 0.08);
    const g = gainEnv(t, 0.002, v, 0.06);
    o.connect(g);
    route([g], pos, 0, 6);
  };
  // 🦶 a giant's footfall
  sfx.stomp = (pos, v = 1) => ok() && play("stomp", pos, Math.min(1.2, 0.7 * v), R(0.9, 1.1), 0.25, 16);
  // 🚦 the start: a high clean tone
  sfx.raceBeep = (go = false) => {
    if (!ok()) return;
    const t = ctx.currentTime;
    const o = osc("square", go ? 1320 : 660, t, go ? 0.7 : 0.25);
    const g = gainEnv(t, 0.004, 0.12, go ? 0.65 : 0.2);
    o.connect(filt("lowpass", 3000, 0.7)).connect(g);
    route([g], null, 0.15);
  };
  // 🏁 through a gate: a bright chime (three notes for a lap)
  sfx.gate = (lap = false) => {
    if (!ok()) return;
    const t = ctx.currentTime;
    const notes = lap ? [784, 988, 1319] : [880, 1319];
    notes.forEach((f, i) => {
      for (const [m, v] of [[1, 0.14], [2, 0.04]]) {
        const o = osc("sine", f * m, t + i * 0.09, 0.6);
        const g = gainEnv(t + i * 0.09, 0.004, v, 0.5);
        o.connect(g);
        route([g], null, 0.3);
      }
    });
  };
  // the bombers' warning: a clean air-raid wail
  sfx.siren = () => {
    if (!ok()) return;
    const t = ctx.currentTime;
    const o = osc("triangle", 520, t, 3.2);
    for (let i = 0; i < 3; i++) {
      o.frequency.linearRampToValueAtTime(820, t + i * 1.05 + 0.5);
      o.frequency.linearRampToValueAtTime(520, t + i * 1.05 + 1.05);
    }
    const g = gainEnv(t, 0.2, 0.07, 2.9);
    o.connect(filt("lowpass", 1600)).connect(g);
    route([g], null, 0.5);
  };
  // a new wave: one deep cinematic hit
  sfx.waveHorn = () => ok() && play("hit", null, 0.7, 1, 0.4);

  // ---- loops that follow a moving thing (rotor, jet, drone, chainsaw, flames…) ----------
  // returns { set(pos, vol, rate), stop() }
  function loop(kind, pos) {
    if (!ok()) return { set() {}, stop() {} };
    const t = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.value = 0;
    const nodes = [];
    let rateParam = null;
    if (kind === "rotor") {
      const n = noise(t, 9999);
      const bpf = filt("bandpass", 140, 1.2);
      const am = ctx.createGain();
      am.gain.value = 0.5;
      const lfo = osc("square", 16, t, 9999);
      const lg = ctx.createGain();
      lg.gain.value = 0.5;
      lfo.connect(lg).connect(am.gain);
      n.connect(bpf).connect(am).connect(out);
      const hum = osc("sawtooth", 62, t, 9999);
      const hg = ctx.createGain();
      hg.gain.value = 0.12;
      hum.connect(filt("lowpass", 300)).connect(hg).connect(out);
      nodes.push(n, lfo, hum);
      rateParam = lfo.frequency;
    } else if (kind === "jet") {
      const n = noise(t, 9999);
      const bpf = filt("bandpass", 900, 0.6);
      n.connect(bpf).connect(out);
      const r = noise(t, 9999);
      const rg = ctx.createGain();
      rg.gain.value = 1.4;
      r.connect(filt("lowpass", 180)).connect(rg).connect(out);
      nodes.push(n, r);
      rateParam = bpf.frequency;
    } else if (kind === "drone") {
      const o = osc("sawtooth", 210, t, 9999);
      o.connect(filt("bandpass", 900, 1)).connect(out);
      nodes.push(o);
      rateParam = o.frequency;
    } else if (kind === "chainsaw") {
      const o = osc("sawtooth", 95, t, 9999);
      const lfo = osc("sine", 22, t, 9999);
      const lg = ctx.createGain();
      lg.gain.value = 9;
      lfo.connect(lg).connect(o.frequency);
      const sh = shaper(30);
      o.connect(sh).connect(filt("lowpass", 2400)).connect(out);
      nodes.push(o, lfo);
      rateParam = o.frequency;
    } else if (kind === "flame") {
      const n = noise(t, 9999);
      n.connect(filt("lowpass", 700, 0.8)).connect(out);
      const n2 = noise(t, 9999);
      const g2 = ctx.createGain();
      g2.gain.value = 0.3;
      n2.connect(filt("bandpass", 2500, 2)).connect(g2).connect(out);
      nodes.push(n, n2);
    } else if (kind === "spin") {
      // (a soft mechanical whirr)
      const n = noise(t, 9999);
      const bpf = filt("bandpass", 900, 4);
      n.connect(bpf).connect(out);
      nodes.push(n);
      rateParam = bpf.frequency;
    } else if (kind === "fire") {
      const n = noise(t, 9999);
      n.connect(filt("lowpass", 500, 0.5)).connect(out);
      const c = noise(t, 9999);
      const cg = ctx.createGain();
      cg.gain.value = 0.15;
      c.connect(filt("highpass", 4000)).connect(cg).connect(out);
      nodes.push(n, c);
    }
    let pan = null;
    if (pos) {
      pan = panner(pos, kind === "jet" ? 30 : kind === "rotor" ? 18 : 4);
      out.connect(pan).connect(bus);
    } else out.connect(bus);
    let dead = false;
    return {
      set(p, vol, rate) {
        if (dead) return;
        const tt = ctx.currentTime;
        out.gain.setTargetAtTime(vol, tt, 0.06);
        if (pan && p) setPos(pan, p);
        if (rateParam && rate != null) rateParam.setTargetAtTime(rate, tt, 0.08);
      },
      stop() {
        if (dead) return;
        dead = true;
        const tt = ctx.currentTime;
        out.gain.setTargetAtTime(0, tt, 0.08);
        for (const n of nodes)
          try {
            n.stop(tt + 0.5);
          } catch (e) {}
      },
    };
  }
  sfx.loop = loop;

  // ---- underneath it all: wind down the empty streets, the city's low rumble ----------
  let amb = null;
  function startAmbience() {
    const t = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.value = 0;
    out.gain.setTargetAtTime(1, t, 3);
    out.connect(bus);
    const w = noise(t, 99999);
    const wf = filt("bandpass", 420, 0.6);
    const wl = osc("sine", 0.06, t, 99999);
    const wlg = ctx.createGain();
    wlg.gain.value = 180;
    wl.connect(wlg).connect(wf.frequency);
    const wg = ctx.createGain();
    wg.gain.value = 0.045;
    w.connect(wf).connect(wg).connect(out);
    const rb = noise(t, 99999);
    const rg = ctx.createGain();
    rg.gain.value = 0.06;
    rb.connect(filt("lowpass", 90, 0.7)).connect(rg).connect(out);
    amb = { out, nextEvent: t + 22 };
  }
  // far off: someone else's gunfight, or a scream
  function distantEvent() {
    const cp = api.camera.position;
    const a = Math.random() * 6.28;
    const far = new THREE.Vector3(cp.x + Math.cos(a) * 170, 10, cp.z + Math.sin(a) * 170);
    if (Math.random() < 0.6) {
      const id = Math.random() < 0.5 ? "ak" : "minigun",
        n = 3 + ((Math.random() * 6) | 0),
        gap = R(0.08, 0.14);
      for (let i = 0; i < n; i++) play("gun:" + id, far, 0.45, R(0.9, 1), 0.5, 10, i * gap);
    } else sfx.voice(far, "scream", R(0.85, 1.1));
  }

  // ---- per frame: the ears follow the camera ----------------------------------------------
  const _f = new THREE.Vector3();
  let hbT = 0;
  A.update = (dt) => {
    if (!ok()) return;
    const L = ctx.listener,
      cam = api.camera,
      t = ctx.currentTime;
    cam.getWorldDirection(_f);
    if (L.positionX) {
      L.positionX.setTargetAtTime(cam.position.x, t, 0.02);
      L.positionY.setTargetAtTime(cam.position.y, t, 0.02);
      L.positionZ.setTargetAtTime(cam.position.z, t, 0.02);
      L.forwardX.setTargetAtTime(_f.x, t, 0.02);
      L.forwardY.setTargetAtTime(_f.y, t, 0.02);
      L.forwardZ.setTargetAtTime(_f.z, t, 0.02);
      L.upX.value = 0;
      L.upY.value = 1;
      L.upZ.value = 0;
    } else {
      L.setPosition(cam.position.x, cam.position.y, cam.position.z);
      L.setOrientation(_f.x, _f.y, _f.z, 0, 1, 0);
    }
    if (warm.length) variants(warm.shift()); // (one more sound baked per frame)
    if (!amb || dt <= 0) return;
    // the heartbeat when she's badly hurt
    const P = Z.player;
    hbT -= dt;
    if (!P.dead && P.hp < 35 && hbT <= 0) {
      hbT = 0.55 + (P.hp / 35) * 0.5;
      heartbeat(t + 0.01, 0.4 * (1 - P.hp / 40));
    }
    if (t > amb.nextEvent) {
      amb.nextEvent = t + R(25, 60);
      distantEvent();
    }
  };
  // (for the test bench: bake a sound into a plain array)
  A._bake = (name, sr = 44100) => {
    SR = sr;
    const [, make] = RECIPES[name];
    return make(rng(strSeed(name)));
  };
  A._names = () => Object.keys(RECIPES);
}
