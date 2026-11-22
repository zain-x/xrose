// 🔊 every sound of the dead city is made live with WebAudio - no files:
// gunshots (one recipe per gun) with a street echo, zombie groans and screams
// placed in 3D, explosions, the gunship's rotor, jets, drones, a heartbeat
// when she's hurt, and a low dread under it all that turns into a pulse in a
// fight.
import * as THREE from "three";

const GUN = {
  pistol: { vol: 0.55, crack: 2600, dec: 0.16, thump: 0.6, tf0: 170, tf1: 50, tdec: 0.09, rev: 0.35 },
  magnum: { vol: 0.85, crack: 1900, dec: 0.34, thump: 1.0, tf0: 120, tf1: 38, tdec: 0.16, rev: 0.6 },
  shotgun: { vol: 0.95, crack: 1300, dec: 0.42, thump: 1.1, tf0: 95, tf1: 34, tdec: 0.2, rev: 0.55 },
  uzi: { vol: 0.36, crack: 3200, dec: 0.08, thump: 0.4, tf0: 190, tf1: 70, tdec: 0.05, rev: 0.22 },
  ak: { vol: 0.55, crack: 2300, dec: 0.15, thump: 0.75, tf0: 135, tf1: 45, tdec: 0.08, rev: 0.32 },
  sniper: { vol: 1.0, crack: 4200, dec: 0.5, thump: 1.0, tf0: 110, tf1: 32, tdec: 0.2, rev: 0.9 },
  minigun: { vol: 0.3, crack: 2900, dec: 0.06, thump: 0.45, tf0: 160, tf1: 60, tdec: 0.04, rev: 0.15 },
  gl: { vol: 0.6, crack: 700, dec: 0.16, thump: 1.3, tf0: 210, tf1: 70, tdec: 0.14, rev: 0.25 },
  rpg: { vol: 0.75, crack: 900, dec: 0.5, thump: 1.0, tf0: 90, tf1: 40, tdec: 0.2, rev: 0.5 },
  heli: { vol: 0.5, crack: 2000, dec: 0.12, thump: 0.6, tf0: 120, tf1: 45, tdec: 0.07, rev: 0.4 },
};

export function setupAudio(Z) {
  const { api } = Z;
  const R = Z.rnd;
  let ctx = null,
    bus = null,
    revIn = null,
    noiseBuf = null,
    voices = 0,
    started = false;
  const sfx = (Z.sfx = {});
  const A = (Z.audio = { intensity: 0 });

  function makeImpulse(secs, decay) {
    const n = Math.floor(ctx.sampleRate * secs);
    const b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < n; i++)
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
    }
    return b;
  }
  A.start = () => {
    if (started) return;
    ctx = api.audio();
    if (!ctx) return;
    started = true;
    if (ctx.state !== "running") ctx.resume();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 5;
    comp.attack.value = 0.003;
    comp.release.value = 0.2;
    comp.connect(ctx.destination);
    bus = ctx.createGain();
    bus.gain.value = 0.9;
    bus.connect(comp);
    const conv = ctx.createConvolver();
    conv.buffer = makeImpulse(2.6, 3.2);
    revIn = ctx.createGain();
    revIn.gain.value = 1;
    const wet = ctx.createGain();
    wet.gain.value = 0.42;
    revIn.connect(conv).connect(wet).connect(comp);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    startAmbience();
  };
  const ok = () => started && ctx && ctx.state === "running";

  // ---- plumbing -----------------------------------------------------------------
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
  // route a finished sound: through a panner (or straight), plus some echo
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

  // ---- guns ---------------------------------------------------------------------
  sfx.shot = (id, pos = null) => {
    if (!ok()) return;
    const p = GUN[id] || GUN.pistol;
    const t = ctx.currentTime;
    const n = noise(t, p.dec + 0.05);
    const f = filt("lowpass", p.crack, 0.7);
    f.frequency.setValueAtTime(p.crack, t);
    f.frequency.exponentialRampToValueAtTime(p.crack * 0.2, t + p.dec);
    const g = gainEnv(t, 0.001, p.vol * R(0.85, 1.05), p.dec);
    n.connect(f).connect(g);
    const o = osc("sine", p.tf0, t, p.tdec + 0.05);
    o.frequency.exponentialRampToValueAtTime(p.tf1, t + p.tdec);
    const og = gainEnv(t, 0.002, p.vol * p.thump, p.tdec);
    o.connect(og);
    route([g, og], pos, p.rev, 10);
    if (id === "rpg" || id === "gl") {
      // the rocket's whoosh away
      const w = noise(t, 0.7);
      const bp = filt("bandpass", 500, 2);
      bp.frequency.exponentialRampToValueAtTime(2200, t + 0.6);
      const wg = gainEnv(t, 0.05, 0.25, 0.6);
      w.connect(bp).connect(wg);
      route([wg], pos, 0.2);
    }
  };
  sfx.empty = () => {
    if (!ok()) return;
    const t = ctx.currentTime;
    const n = noise(t, 0.03);
    const g = gainEnv(t, 0.001, 0.25, 0.02);
    n.connect(filt("highpass", 3000)).connect(g);
    route([g], null, 0);
  };
  function click(t, f = 2500, v = 0.22) {
    const n = noise(t, 0.04);
    const g = gainEnv(t, 0.001, v, 0.03);
    n.connect(filt("bandpass", f, 3)).connect(g);
    route([g], null, 0.05);
  }
  sfx.reload = (secs) => {
    if (!ok()) return;
    const t = ctx.currentTime;
    click(t + 0.05, 1800);
    click(t + secs * 0.45, 2400);
    click(t + secs * 0.9, 3200, 0.3);
    click(t + secs * 0.95, 1500, 0.25);
  };
  sfx.cock = () => {
    if (!ok()) return;
    const t = ctx.currentTime;
    click(t, 2000, 0.3);
    click(t + 0.12, 3200, 0.35);
    const o = osc("sine", 3100, t + 0.12, 0.3);
    const g = gainEnv(t + 0.12, 0.002, 0.04, 0.25);
    o.connect(g);
    route([g], null, 0.1);
  };
  sfx.swing = () => {
    if (!ok()) return;
    const t = ctx.currentTime;
    const n = noise(t, 0.25);
    const bp = filt("bandpass", 700, 1.5);
    bp.frequency.exponentialRampToValueAtTime(2800, t + 0.16);
    const g = gainEnv(t, 0.04, 0.3, 0.16);
    n.connect(bp).connect(g);
    route([g], null, 0.05);
  };
  sfx.slash = () => {
    if (!ok()) return;
    const t = ctx.currentTime;
    for (const f of [2600, 3900]) {
      const o = osc("sine", f, t, 0.35);
      const g = gainEnv(t, 0.002, 0.05, 0.3);
      o.connect(g);
      route([g], null, 0.15);
    }
    sfx.flesh(null, true);
  };
  // a bullet into a body (head = a crack of bone too)
  sfx.flesh = (pos, head = false) => {
    if (!ok()) return;
    const t = ctx.currentTime;
    const n = noise(t, 0.12);
    const lp = filt("lowpass", 900);
    lp.frequency.exponentialRampToValueAtTime(200, t + 0.1);
    const g = gainEnv(t, 0.002, head ? 0.5 : 0.35, 0.1);
    n.connect(lp).connect(g);
    const nodes = [g];
    if (head) {
      const o = osc("sine", 1100, t, 0.08);
      o.frequency.exponentialRampToValueAtTime(180, t + 0.06);
      const og = gainEnv(t, 0.001, 0.3, 0.06);
      o.connect(og);
      const c = noise(t, 0.06);
      const cg = gainEnv(t, 0.001, 0.2, 0.05);
      c.connect(filt("bandpass", 2600, 2)).connect(cg);
      nodes.push(og, cg);
    }
    route(nodes, pos, 0.05, 8);
  };
  // the wet one: a head coming off, a body bursting
  sfx.gore = (pos) => {
    if (!ok()) return;
    const t = ctx.currentTime;
    const n = noise(t, 0.4);
    const lp = filt("lowpass", 1400, 2);
    lp.frequency.exponentialRampToValueAtTime(160, t + 0.32);
    const g = gainEnv(t, 0.004, 0.6, 0.32);
    n.connect(lp).connect(g);
    const o = osc("sine", 90, t, 0.3);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.25);
    const og = gainEnv(t, 0.003, 0.5, 0.25);
    o.connect(og);
    route([g, og], pos, 0.1, 10);
  };
  sfx.ricochet = (pos) => {
    if (!ok() || Math.random() < 0.6) return;
    const t = ctx.currentTime;
    const o = osc("sine", R(2500, 4200), t, 0.3);
    o.frequency.exponentialRampToValueAtTime(R(900, 1500), t + 0.25);
    const g = gainEnv(t, 0.002, 0.06, 0.25);
    o.connect(g);
    route([g], pos, 0.2, 6);
  };

  // ---- explosions -----------------------------------------------------------------
  sfx.explosion = (pos, big = 1) => {
    if (!ok()) return;
    const t = ctx.currentTime;
    const dur = 1.1 + big * 0.6;
    const n = noise(t, dur);
    const lp = filt("lowpass", 1600, 0.6);
    lp.frequency.exponentialRampToValueAtTime(70, t + dur);
    const g = gainEnv(t, 0.005, 1.0 * big, dur);
    n.connect(lp).connect(g);
    const o = osc("sine", 70, t, dur);
    o.frequency.exponentialRampToValueAtTime(24, t + dur * 0.8);
    const og = gainEnv(t, 0.005, 1.1 * big, dur * 0.8);
    o.connect(og);
    const c = noise(t, 0.2);
    const cg = gainEnv(t, 0.001, 0.4, 0.15);
    c.connect(filt("bandpass", 3000, 1)).connect(cg);
    route([g, og, cg], pos, 0.7, 18);
  };
  sfx.whistle = (pos) => {
    if (!ok()) return;
    const t = ctx.currentTime;
    const o = osc("sine", 1900, t, 1.3);
    o.frequency.exponentialRampToValueAtTime(420, t + 1.25);
    const g = gainEnv(t, 0.3, 0.12, 0.95);
    o.connect(g);
    route([g], pos, 0.2, 20);
  };

  // ---- the dead: groans, screams, roars -------------------------------------------------
  const VOICE = {
    groan: { f: [62, 105], dur: [0.9, 1.8], dist: 12, f1: 380, f2: 820, gl: 0.85, v: 0.5 },
    scream: { f: [190, 300], dur: [0.7, 1.1], dist: 45, f1: 820, f2: 1500, gl: 1.45, v: 0.55 },
    roar: { f: [46, 60], dur: [1.3, 1.9], dist: 80, f1: 340, f2: 900, gl: 0.8, v: 0.9 },
    attack: { f: [120, 170], dur: [0.3, 0.45], dist: 30, f1: 650, f2: 1250, gl: 1.2, v: 0.45 },
    die: { f: [85, 130], dur: [0.5, 0.8], dist: 20, f1: 420, f2: 950, gl: 0.5, v: 0.4 },
  };
  sfx.voice = (pos, kind = "groan", pitch = 1) => {
    if (!ok()) return;
    if (voices >= (api.isTouch ? 3 : 6) && kind === "groan") return;
    const V = VOICE[kind];
    const t = ctx.currentTime;
    const dur = R(V.dur[0], V.dur[1]);
    const f0 = R(V.f[0], V.f[1]) * pitch;
    const o = osc("sawtooth", f0, t, dur + 0.1);
    const o2 = osc("sawtooth", f0 * 1.012 + 2, t, dur + 0.1);
    if (kind === "scream" || kind === "attack") {
      o.frequency.linearRampToValueAtTime(f0 * V.gl, t + dur * 0.3);
      o.frequency.linearRampToValueAtTime(f0 * 0.75, t + dur);
    } else o.frequency.linearRampToValueAtTime(f0 * V.gl, t + dur);
    o2.frequency.setValueAtTime(f0 * 1.012 + 2, t);
    o2.frequency.linearRampToValueAtTime(f0 * V.gl * 1.01, t + dur);
    const lfo = osc("sine", R(4, 9), t, dur + 0.1);
    const lg = ctx.createGain();
    lg.gain.value = f0 * 0.07;
    lfo.connect(lg).connect(o.frequency);
    const sh = shaper(V.dist);
    o.connect(sh);
    o2.connect(sh);
    const b1 = filt("bandpass", V.f1, 5),
      b2 = filt("bandpass", V.f2, 7);
    const mix = ctx.createGain();
    mix.gain.value = 0.6;
    sh.connect(b1).connect(mix);
    sh.connect(b2).connect(mix);
    const n = noise(t, dur + 0.1);
    const ng = ctx.createGain();
    ng.gain.value = 0.25;
    n.connect(filt("bandpass", 1400, 1)).connect(ng).connect(mix);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(V.v, t + Math.min(0.15, dur * 0.3));
    g.gain.setValueAtTime(V.v, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    mix.connect(g);
    voices++;
    o.onended = () => voices--;
    route([g], pos, 0.18, kind === "roar" ? 14 : 5);
  };

  // ---- her ----------------------------------------------------------------------------
  sfx.hurt = (amt) => {
    if (!ok()) return;
    const t = ctx.currentTime;
    const n = noise(t, 0.15);
    const g = gainEnv(t, 0.003, Math.min(0.6, 0.2 + amt * 0.02), 0.12);
    n.connect(filt("lowpass", 500)).connect(g);
    // a short breath of a cry
    const o = osc("triangle", R(300, 340), t, 0.24);
    o.frequency.linearRampToValueAtTime(240, t + 0.22);
    const vg = gainEnv(t, 0.02, 0.08, 0.2);
    const b = filt("bandpass", 950, 3);
    o.connect(b).connect(vg);
    route([g, vg], null, 0.05);
  };
  sfx.death = () => {
    if (!ok()) return;
    const t = ctx.currentTime;
    const o = osc("sine", 3300, t, 3);
    const g = gainEnv(t, 0.05, 0.05, 2.8);
    o.connect(g);
    const s = osc("sine", 50, t, 2);
    s.frequency.exponentialRampToValueAtTime(28, t + 1.8);
    const sg = gainEnv(t, 0.01, 0.8, 1.8);
    s.connect(sg);
    route([g, sg], null, 0.4);
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
  sfx.pickup = (kind) => {
    if (!ok()) return;
    const t = ctx.currentTime;
    if (kind === "weapon") return sfx.cock();
    const notes =
      kind === "health"
        ? [523, 784, 1047]
        : kind === "armor"
          ? [330, 494, 659]
          : kind === "power"
            ? [440, 660, 880, 1320]
            : [700, 1050];
    notes.forEach((f, i) => {
      const o = osc(kind === "armor" ? "square" : "sine", f, t + i * 0.07, 0.3);
      const g = gainEnv(t + i * 0.07, 0.005, kind === "armor" ? 0.05 : 0.13, 0.22);
      o.connect(g);
      route([g], null, 0.15);
    });
  };
  sfx.beep = (pos, v = 0.12) => {
    if (!ok()) return;
    const t = ctx.currentTime;
    const o = osc("square", 1750, t, 0.08);
    const g = gainEnv(t, 0.002, v, 0.06);
    o.connect(g);
    route([g], pos, 0, 6);
  };
  // 🦶 a giant's footfall: a deep thump with a little grit under it
  sfx.stomp = (pos, v = 1) => {
    if (!ok()) return;
    const t = ctx.currentTime;
    const o = osc("sine", 58, t, 0.55);
    o.frequency.exponentialRampToValueAtTime(26, t + 0.5);
    const og = gainEnv(t, 0.004, Math.min(1.4, 0.8 * v), 0.5);
    o.connect(og);
    const n = noise(t, 0.32);
    const ng = gainEnv(t, 0.003, Math.min(0.6, 0.3 * v), 0.28);
    n.connect(filt("lowpass", 420, 0.7)).connect(ng);
    route([og, ng], pos, 0.35, 16);
  };
  // 🚦 the start lights: three low beeps, then a high one for GO
  sfx.raceBeep = (go = false) => {
    if (!ok()) return;
    const t = ctx.currentTime;
    const o = osc("square", go ? 1320 : 660, t, go ? 0.7 : 0.25);
    const g = gainEnv(t, 0.004, 0.16, go ? 0.65 : 0.2);
    o.connect(filt("lowpass", 3200, 0.7)).connect(g);
    route([g], null, 0.15);
  };
  // 🏁 through a gate: a bright two-note chime (three for a lap)
  sfx.gate = (lap = false) => {
    if (!ok()) return;
    const t = ctx.currentTime;
    const notes = lap ? [784, 988, 1319] : [880, 1319];
    notes.forEach((f, i) => {
      const o = osc("triangle", f, t + i * 0.09, 0.5);
      const g = gainEnv(t + i * 0.09, 0.005, 0.18, 0.42);
      o.connect(g);
      route([g], null, 0.3);
    });
  };
  sfx.siren = () => {
    if (!ok()) return;
    const t = ctx.currentTime;
    const o = osc("sawtooth", 560, t, 3.2);
    for (let i = 0; i < 4; i++) {
      o.frequency.linearRampToValueAtTime(940, t + i * 0.8 + 0.4);
      o.frequency.linearRampToValueAtTime(560, t + i * 0.8 + 0.8);
    }
    const g = gainEnv(t, 0.1, 0.12, 3);
    o.connect(filt("lowpass", 2200)).connect(g);
    route([g], null, 0.3);
  };
  sfx.waveHorn = () => {
    if (!ok()) return;
    const t = ctx.currentTime;
    for (const f of [73.4, 110, 146.8]) {
      const o = osc("sawtooth", f, t, 2.4);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.13, t + 0.5);
      g.gain.setValueAtTime(0.13, t + 1.4);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.3);
      o.connect(filt("lowpass", 700)).connect(g);
      route([g], null, 0.6);
    }
  };

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
      const bp = filt("bandpass", 140, 1.2);
      const am = ctx.createGain();
      am.gain.value = 0.5;
      const lfo = osc("square", 16, t, 9999);
      const lg = ctx.createGain();
      lg.gain.value = 0.5;
      lfo.connect(lg).connect(am.gain);
      n.connect(bp).connect(am).connect(out);
      const hum = osc("sawtooth", 62, t, 9999);
      const hg = ctx.createGain();
      hg.gain.value = 0.15;
      hum.connect(filt("lowpass", 300)).connect(hg).connect(out);
      nodes.push(n, lfo, hum);
      rateParam = lfo.frequency;
    } else if (kind === "jet") {
      const n = noise(t, 9999);
      const bp = filt("bandpass", 900, 0.6);
      n.connect(bp).connect(out);
      const r = noise(t, 9999);
      const rg = ctx.createGain();
      rg.gain.value = 1.4;
      r.connect(filt("lowpass", 180)).connect(rg).connect(out);
      nodes.push(n, r);
      rateParam = bp.frequency;
    } else if (kind === "drone") {
      const o = osc("sawtooth", 210, t, 9999);
      const o2 = osc("sawtooth", 423, t, 9999);
      const g2 = ctx.createGain();
      g2.gain.value = 0.4;
      o.connect(filt("bandpass", 900, 1)).connect(out);
      o2.connect(g2).connect(out);
      nodes.push(o, o2);
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
      const o = osc("square", 60, t, 9999);
      o.connect(filt("bandpass", 1200, 2)).connect(out);
      nodes.push(o);
      rateParam = o.frequency;
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

  // ---- the dread underneath --------------------------------------------------------------
  let amb = null;
  function startAmbience() {
    const t = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.value = 0;
    out.gain.setTargetAtTime(1, t, 3);
    out.connect(bus);
    // a low drone
    for (const f of [55, 55.35, 82.4]) {
      const o = osc("sawtooth", f, t, 99999);
      const g = ctx.createGain();
      g.gain.value = f > 80 ? 0.012 : 0.03;
      o.connect(filt("lowpass", 170, 0.8)).connect(g).connect(out);
    }
    // wind
    const w = noise(t, 99999);
    const wf = filt("lowpass", 380, 0.7);
    const wl = osc("sine", 0.07, t, 99999);
    const wlg = ctx.createGain();
    wlg.gain.value = 220;
    wl.connect(wlg).connect(wf.frequency);
    const wg = ctx.createGain();
    wg.gain.value = 0.07;
    w.connect(wf).connect(wg).connect(out);
    // the fight pulse (a kick + a low note), louder the more of them chase her
    const pulse = ctx.createGain();
    pulse.gain.value = 0;
    pulse.connect(bus);
    amb = { out, pulse, nextBeat: 0, nextEvent: t + 12 };
  }
  function kick(t) {
    const o = osc("sine", 130, t, 0.3);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    const g = gainEnv(t, 0.003, 0.7, 0.22);
    o.connect(g).connect(amb.pulse);
    const b = osc("sawtooth", 41.2, t, 0.45);
    const bg = gainEnv(t, 0.02, 0.18, 0.4);
    b.connect(filt("lowpass", 160)).connect(bg).connect(amb.pulse);
  }
  // far off: a siren, a scream, someone else's gunfight
  function distantEvent() {
    const t = ctx.currentTime;
    const cp = api.camera.position;
    const a = Math.random() * 6.28;
    const far = new THREE.Vector3(cp.x + Math.cos(a) * 160, 10, cp.z + Math.sin(a) * 160);
    const r = Math.random();
    if (r < 0.35) {
      const o = osc("sine", 620, t, 7);
      for (let i = 0; i < 5; i++) {
        o.frequency.linearRampToValueAtTime(880, t + i * 1.4 + 0.7);
        o.frequency.linearRampToValueAtTime(620, t + i * 1.4 + 1.4);
      }
      const g = gainEnv(t, 1.5, 0.05, 5.4);
      o.connect(g);
      route([g], null, 1.2);
    } else if (r < 0.7) {
      sfx.voice(far, "scream", R(0.8, 1.2));
    } else {
      const n = 3 + ((Math.random() * 6) | 0);
      for (let i = 0; i < n; i++)
        setTimeout(() => ok() && sfx.shot("ak", far), i * R(90, 160));
    }
  }

  // ---- per frame: the ears follow the camera ---------------------------------------------
  const _f = new THREE.Vector3();
  let beatT = 0,
    hbT = 0;
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
    if (!amb || dt <= 0) return;
    // the pulse
    const k = Z.clamp(A.intensity, 0, 1);
    amb.pulse.gain.setTargetAtTime(k * 0.55, t, 0.6);
    beatT -= dt;
    if (k > 0.05 && beatT <= 0) {
      beatT = 60 / (96 + 30 * k);
      kick(t + 0.02);
    }
    // the heartbeat when she's badly hurt
    const P = Z.player;
    hbT -= dt;
    if (!P.dead && P.hp < 35 && hbT <= 0) {
      hbT = 0.55 + (P.hp / 35) * 0.5;
      heartbeat(t + 0.01, 0.5 * (1 - P.hp / 40));
    }
    if (t > amb.nextEvent) {
      amb.nextEvent = t + R(16, 40);
      distantEvent();
    }
  };
}
