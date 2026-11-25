// 🧟 ROMBIE WORLD - the zombie race laid over Rose Island.
// index.html hands in its world (scene, camera, the girl, collision helpers)
// through `api`; every module here hangs its part on the shared context Z:
//   fx (particles, blood, explosions)  · audio (all of it synthesized)
//   hud (bars, crosshair, messages)    · world (night, fog, fires, ash)
//   zombies · weapons · pickups · aircraft · the hunt (below): ten of them,
//   and when the last one falls she goes back to Rose World
import * as THREE from "three";
import { setupFx } from "./fx.js";
import { setupAudio } from "./audio.js";
import { setupHud } from "./hud.js";
import { setupWorld } from "./world.js";
import { setupZombies } from "./zombies.js";
import { setupWeapons } from "./weapons.js";
import { setupPickups } from "./pickups.js";
import { setupAircraft } from "./aircraft.js";
import { setupRace } from "./race.js";

export function initZombieWorld(api) {
  const Z = {
    api,
    THREE,
    scene: api.scene,
    camera: api.camera,
    t: 0, // world time (slowed by bullet time)
    rt: 0, // real time
    ts: 1, // world time scale
    slow: { k: 1, until: 0 }, // a short slow-motion beat
    bulletUntil: 0, // ⏱ adrenaline: bullet time until (real time)
    entered: false,
  };
  const TILE = api.TILE;
  Z.rnd = (a, b) => a + Math.random() * (b - a);
  Z.pick = (arr) => arr[(Math.random() * arr.length) | 0];
  Z.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  Z.touch = () => api.isTouch;
  Z.onFoot = () => api.vehMode === "walk";

  // ---- the player ---------------------------------------------------------
  const P = (Z.player = {
    hp: 1000, // 🙂 a LOT of health: they can hardly hurt her
    max: 1000,
    armor: 0,
    dead: false,
    deadT: 0,
    inv: 0, // invulnerable until (real time)
    lastHurt: -99,
    kills: 0,
    heads: 0,
    score: 0,
    deaths: 0,
    best: 0,
  });
  try {
    P.best = +localStorage.getItem("rombie-best") || 0;
  } catch (e) {}

  // where "she" is: her body, or whatever she rides
  Z.ppos = () => api.focusPos();
  const _pc = new THREE.Vector3();
  Z.pchest = (out = _pc) => {
    out.copy(api.focusPos());
    out.y += Z.onFoot() ? 1.15 : 1.0;
    return out;
  };

  // ---- the city is solid: towers block bullets, sight and zombies ------------
  function solidAt(x, y, z) {
    if (y < 0) return true;
    const s = api.towerSpec(Math.floor(x / TILE), Math.floor(z / TILE));
    if (!s) return false;
    for (const t of s.tiers)
      if (
        y < t.h &&
        Math.abs(x - s.x) < t.w / 2 &&
        Math.abs(z - s.z) < t.d / 2
      )
        return true;
    return false;
  }
  Z.solidAt = solidAt;
  // how far a ray goes before it meets the street or a tower (≤ maxT)
  Z.hitKind = "none";
  Z.rayCast = (o, d, maxT, step = 0.9) => {
    let lim = maxT;
    Z.hitKind = "none";
    if (d.y < -1e-5) {
      const tg = -o.y / d.y;
      if (tg < lim) {
        lim = tg;
        Z.hitKind = "ground";
      }
    }
    for (let t = step * 0.5; t < lim; t += step) {
      const y = o.y + d.y * t;
      if (y > 420) {
        if (d.y >= 0) break;
        continue;
      }
      if (solidAt(o.x + d.x * t, y, o.z + d.z * t)) {
        // narrow it down
        let a = t - step,
          b = t;
        for (let i = 0; i < 5; i++) {
          const m = (a + b) / 2;
          if (solidAt(o.x + d.x * m, o.y + d.y * m, o.z + d.z * m)) b = m;
          else a = m;
        }
        Z.hitKind = "wall";
        return Math.max(0, a);
      }
    }
    return lim;
  };
  const _ld = new THREE.Vector3();
  Z.los = (a, b) => {
    _ld.subVectors(b, a);
    const len = _ld.length();
    if (len < 0.01) return true;
    _ld.multiplyScalar(1 / len);
    return Z.rayCast(a, _ld, len, 1.2) >= len - 0.4;
  };
  // which way a tower's face looks, at a point just in front of it (or null)
  Z.wallNormal = (p, out) => {
    const s = api.towerSpec(Math.floor(p.x / TILE), Math.floor(p.z / TILE));
    if (!s) return null;
    let best = null,
      bd = 1.2;
    const dx = p.x - s.x,
      dz = p.z - s.z;
    for (const t of s.tiers) {
      if (p.y > t.h + 0.3) continue;
      const ex = Math.abs(Math.abs(dx) - t.w / 2),
        ez = Math.abs(Math.abs(dz) - t.d / 2);
      if (ex < bd && Math.abs(dz) <= t.d / 2 + 0.3) {
        bd = ex;
        best = [Math.sign(dx), 0];
      }
      if (ez < bd && Math.abs(dx) <= t.w / 2 + 0.3) {
        bd = ez;
        best = [0, Math.sign(dz)];
      }
    }
    return best ? out.set(best[0], 0, best[1]) : null;
  };
  // the highest surface under a point (street 0 or a roof)
  Z.groundAt = (x, z, y = 999) => api.roofUnder(x, z, y);
  // a free street spot? (on land, not inside a tower)
  const _fp = new THREE.Vector3();
  Z.freeSpot = (x, z, margin = 1) => {
    if (api.landDist(x, z) > -3) return false;
    _fp.set(x, 0.5, z);
    api.pushOutPoint(_fp, margin);
    return Math.abs(_fp.x - x) < 0.01 && Math.abs(_fp.z - z) < 0.01;
  };

  // ---- hurting her ---------------------------------------------------------
  Z.hurt = (amt, src, kind = "hit") => {
    if (P.dead || !Z.entered || Z.rt < P.inv) return;
    amt = Math.min(10, amt * 0.3); // 🙂 easy: soft hits, never more than 10 at once
    if (!Z.onFoot()) amt *= 0.5; // the car's steel takes half
    if (P.armor > 0) {
      const a = Math.min(P.armor, amt * 0.6);
      P.armor -= a;
      amt -= a;
    }
    P.hp -= amt;
    P.lastHurt = Z.rt;
    Z.hud.hurt(amt, src);
    Z.sfx.hurt(amt);
    Z.fx.shake(Math.min(0.7, 0.08 + amt * 0.025));
    if (P.hp <= 0) die(kind);
  };
  Z.heal = (n) => {
    P.hp = Math.min(P.max, P.hp + n);
  };
  function die() {
    P.hp = 0;
    P.dead = true;
    P.deadT = 0;
    P.deaths++;
    if (!Z.onFoot()) api.exitVehicle();
    Z.slowmo(0.3, 1.6);
    Z.sfx.death();
    Z.weapons.onDeath();
    if (P.score > P.best) {
      P.best = P.score;
      try {
        localStorage.setItem("rombie-best", String(P.best));
      } catch (e) {}
    }
    try {
      document.exitPointerLock();
    } catch (e) {}
  }
  Z.respawn = () => {
    // the spot furthest from the dead, among a few streets near the start
    const g = api.girl;
    let best = null,
      bestD = -1;
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2,
        r = i === 0 ? 6 : 8 + Math.random() * 32; // (close to the plaza and her car)
      // snap onto a street line (the lots' edges are the roads)
      let x = Math.cos(a) * r - 98,
        z = Math.sin(a) * r - 46;
      if (Math.random() < 0.5) x = Math.round(x / TILE) * TILE;
      else z = Math.round(z / TILE) * TILE;
      if (!Z.freeSpot(x, z, 1.5)) continue;
      let dmin = 999;
      for (const zb of Z.zombies.list)
        if (zb.alive) dmin = Math.min(dmin, Math.hypot(zb.pos.x - x, zb.pos.z - z));
      if (dmin > bestD) {
        bestD = dmin;
        best = [x, z];
      }
    }
    if (!best) best = [-98, -46];
    g.pos.set(best[0], 0, best[1]);
    g.climbing = false;
    api.vel.set(0, 0, 0);
    // 🏁 racing: back in the car at the last gate she went through
    if (Z.race && Z.race.state === "run") Z.race.respawn();
    Z.zombies.clearAround(Z.ppos(), 22);
    P.hp = P.max;
    P.armor = Math.max(P.armor, 25);
    P.dead = false;
    P.inv = Z.rt + 3;
    Z.ts = 1;
    Z.slow.until = 0;
    Z.weapons.onRespawn();
    Z.hud.hideDeath();
    if (!api.isTouch) api.canvas.requestPointerLock();
  };

  // ⏱ slow motion: k for `secs` real seconds
  let slowFree = 0;
  Z.slowmo = (k, secs, force = false) => {
    if (!force && Z.rt < slowFree) return; // (a beat of slow motion is special: not too often)
    Z.slow.k = Math.min(Z.slow.until > Z.rt ? Z.slow.k : 1, k);
    Z.slow.until = Math.max(Z.slow.until, Z.rt + secs);
    slowFree = Z.slow.until + 4;
  };

  // ---- score & kill streaks --------------------------------------------------
  const streak = { n: 0, t: -9 };
  Z.onKill = (zb, how) => {
    P.kills++;
    D.waveKills++;
    let pts = zb.def.score;
    if (how.head) {
      P.heads++;
      pts += 50;
    }
    if (how.decap) pts += 25;
    if (Z.rt - streak.t < 1.6) streak.n++;
    else streak.n = 1;
    streak.t = Z.rt;
    pts *= 1 + Math.min(streak.n - 1, 9) * 0.25;
    P.score += Math.round(pts);
    Z.hud.kill(zb, how, streak.n);
    if (Z.race) Z.race.onKill(zb, how);
    if (streak.n === 4 || streak.n === 8) Z.slowmo(0.35, 0.5);
  };

  // ---- the wave director ------------------------------------------------------
  const D = (Z.director = {
    wave: 1,
    waveKills: 0,
    lull: 0, // a breather after a wave (seconds)
    nextHeli: 150,
    nextBomb: 260,
    nextDrop: 35,
    t: 0,
  });
  D.need = () => 14 + D.wave * 8;
  D.population = () => {
    const touch = api.isTouch;
    const cap = touch ? 14 : 26;
    const n = (touch ? 6 : 10) + D.wave * (touch ? 1 : 2);
    return Math.min(cap, D.lull > 0 ? Math.ceil(n * 0.4) : n);
  };
  function director(dt) {
    D.t += dt;
    // no waves, no gunships, no bombers: just a supply crate now and then
    if (D.t > D.nextDrop) {
      D.nextDrop = D.t + Z.rnd(95, 130);
      Z.aircraft.supplyDrop();
    }
  }

  // ---- 🧟 the hunt: ten of them took the island - take all ten down and Rose
  // World is hers again ----------------------------------------------------------------------
  const HUNT_TYPES = ["walker", "walker", "walker", "runner", "walker", "crawler", "walker", "runner", "walker", "giant"];
  const HOME = "/"; // where she goes when the last one falls: Rose World
  const Hn = (Z.hunt = { total: HUNT_TYPES.length, killed: 0, done: false, wakeT: 25 });
  Hn.start = () => {
    let n = 0;
    for (const type of HUNT_TYPES) if (Z.zombies.spawnHunt(type)) n++;
    Hn.total = n; // (always ten - a street spot is never far)
    Z.hud.banner("ROMBIE WORLD", `Take down all ${Hn.total} zombies to get back to Rose World 🌹`, 5);
  };
  Hn.left = () => Hn.total - Hn.killed;
  // (zombies.js calls this once for each of the ten, however it dies)
  Hn.onDead = () => {
    if (Hn.done) return;
    Hn.killed++;
    if (Hn.killed >= Hn.total) return win();
    Z.hud.toast(Hn.left() === 1 ? "🧟 1 zombie left!" : `🧟 ${Hn.left()} zombies left`, "#ff9ec2");
    // the last few come for her (so she never has to search the whole island)
    if (Hn.left() <= 3) for (const o of Z.zombies.list) if (o.hunt && o.alive) Z.zombies.wake(o);
  };
  function win() {
    Hn.done = true;
    Z.slowmo(0.35, 1.4, true);
    Z.hud.banner(`🌹 ALL ${Hn.total} ZOMBIES DOWN`, "Rose World is safe again - taking you back…", 5);
    try {
      localStorage.setItem("rombie-cleared", String(Date.now()));
    } catch (e) {}
    try {
      if (window.trackButtonClick) window.trackButtonClick(`🧟 Took down all ${Hn.total} zombies - off to Rose World 🌹`);
    } catch (e) {}
    setTimeout(() => location.assign(HOME), 5000);
  }
  // now and then one of the rest picks up her trail (so the hunt never stalls)
  Hn.update = (dt) => {
    if (Hn.done || P.dead) return;
    Hn.wakeT -= dt;
    if (Hn.wakeT <= 0) {
      Hn.wakeT = Z.rnd(18, 28);
      const rest = Z.zombies.list.filter((o) => o.hunt && o.alive && !o.aware);
      if (rest.length) Z.zombies.wake(Z.pick(rest));
    }
  };

  // ---- the modules -------------------------------------------------------------
  setupFx(Z);
  setupAudio(Z);
  setupHud(Z);
  setupWorld(Z);
  setupZombies(Z);
  setupWeapons(Z);
  setupPickups(Z);
  setupAircraft(Z);
  setupRace(Z);

  // ---- per frame -------------------------------------------------------------------
  function update(dt) {
    Z.world.update(dt); // night, fog, flicker - even before she enters
    if (!api.started || !Z.entered) {
      Z.fx.update(dt, dt); // (the wrecks already burn behind the start card)
      return;
    }
    if (api.uiPaused) {
      Z.audio.update(0);
      return;
    }
    Z.rt += dt;
    // world time: bullet time and slow-motion beats
    let k = 1;
    if (Z.rt < Z.bulletUntil) k = 0.4;
    if (Z.rt < Z.slow.until) k = Math.min(k, Z.slow.k);
    Z.ts += (k - Z.ts) * Math.min(1, dt * 10);
    const sdt = dt * Z.ts;
    Z.t += sdt;

    if (P.dead) {
      P.deadT += dt;
      if (P.deadT > 1.9) Z.hud.showDeath();
    } else if (P.hp < P.max && Z.rt - P.lastHurt > 3) {
      // 🙂 a few quiet seconds and she heals right back up
      P.hp = Math.min(P.max, P.hp + dt * P.max * 0.05);
    }

    Z.weapons.update(dt, sdt);
    Z.zombies.update(sdt, dt);
    Z.race.update(dt);
    Z.aircraft.update(sdt);
    Z.pickups.update(dt);
    if (!P.dead) director(dt);
    Hn.update(dt);
    Z.fx.update(sdt, dt);
    Z.audio.update(dt);
    Z.hud.update(dt);
    Z.weapons.cameraFx(dt);
    Z.fx.applyShake(dt);
  }

  function onEnter() {
    if (Z.entered) return;
    Z.entered = true;
    Z.audio.start();
    Z.hud.onEnter();
    Z.world.onEnter();
    Hn.start(); // 🧟 the ten of them, out in the streets around her
  }

  return {
    update,
    onEnter,
    poseGirl: (dt) => Z.weapons.poseGirl(dt),
    cam: () => Z.weapons.cam,
    speedMul: () => Z.weapons.speedMul(),
    blockMove: () => P.dead,
    gaitSign: () => Z.weapons.gaitSign(),
    sens: () => Z.weapons.sens(),
    get timeScale() {
      return Z.ts;
    },
    debug: Z, // (for poking at it from the console: ZW is not global, so only via code)
  };
}
