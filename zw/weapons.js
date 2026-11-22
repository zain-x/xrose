// 🔫 the arsenal: a katana and a chainsaw, pistol and .50 magnum, a combat
// shotgun, Uzi and AK-47, a sniper rifle with a real scope, a minigun that
// spins up, a flamethrower, a grenade launcher and an RPG - plus hand
// grenades (Q) and air strikes (X). Each one is a little 3D model in her right
// hand; she raises it, aims over the shoulder, and it kicks.
import * as THREE from "three";

const DEFS = [
  { id: "katana", key: 1, short: "KAT", name: "Katana", melee: true, dmg: 115, range: 2.8, arc: 0.3, rate: 2.6, headChance: 0.5, decap: 0.95, decapBody: 0.3, knock: 3, hold: "blade" },
  { id: "chainsaw", key: 1, short: "SAW", name: "Chainsaw", melee: true, fuel: true, dps: 280, range: 2.4, arc: 0.45, use: 6, headChance: 0.3, decap: 0.8, decapBody: 0.35, gib: 0.3, knock: 1, hold: "saw" },
  { id: "pistol", key: 2, short: "PST", name: "Pistol", dmg: 34, rate: 5.5, mag: 15, res: Infinity, spread: 0.012, recoil: 0.025, noise: 45, reload: 1.1, head: 2.8, decap: 0.3, knock: 1, range: 160, hold: "pistol" },
  { id: "magnum", key: 2, short: "MAG", name: ".50 Magnum", dmg: 120, rate: 2.2, mag: 7, res: 21, max: 63, spread: 0.008, recoil: 0.09, noise: 70, reload: 1.6, head: 3, pierce: 1, decap: 1, knock: 5, range: 200, hold: "pistol" },
  { id: "shotgun", key: 3, short: "SHT", name: "Combat Shotgun", dmg: 21, pellets: 9, rate: 1.3, mag: 8, res: 16, max: 64, spread: 0.075, recoil: 0.11, noise: 75, reload: 2.1, head: 2.2, decap: 0.6, knock: 3.2, range: 60, hold: "rifle" },
  { id: "uzi", key: 4, short: "UZI", name: "Uzi", dmg: 19, rate: 15, auto: true, mag: 32, res: 96, max: 320, spread: 0.04, recoil: 0.011, noise: 50, reload: 1.3, head: 2.5, decap: 0.25, knock: 0.6, range: 110, hold: "pistol" },
  { id: "ak", key: 4, short: "AK", name: "AK-47", dmg: 33, rate: 10, auto: true, mag: 30, res: 90, max: 300, spread: 0.022, recoil: 0.02, noise: 70, reload: 1.8, head: 2.8, decap: 0.5, knock: 1.4, range: 200, hold: "rifle" },
  { id: "sniper", key: 5, short: "SNP", name: "Sniper Rifle", dmg: 280, rate: 0.85, mag: 5, res: 15, max: 40, spread: 0.035, recoil: 0.13, noise: 90, reload: 2.4, head: 4, pierce: 4, decap: 1, knock: 6, range: 320, zoom: true, hold: "rifle" },
  { id: "minigun", key: 6, short: "MG", name: "Machine Gun", dmg: 25, rate: 24, auto: true, mag: 400, res: 400, max: 900, belt: true, spread: 0.05, recoil: 0.006, noise: 85, reload: 0, head: 2.4, decap: 0.4, knock: 2, range: 170, spin: 0.3, slow: 0.85, hold: "heavy" },
  { id: "flamer", key: 6, short: "FLM", name: "Flamethrower", flame: true, fuel: true, dps: 60, range: 11, use: 8, noise: 40, hold: "heavy" },
  { id: "gl", key: 7, short: "GL", name: "Grenade Launcher", proj: "grenade", rate: 1.4, mag: 6, res: 12, max: 36, recoil: 0.08, noise: 80, reload: 2.6, blast: 6, bdmg: 260, speed: 30, hold: "rifle" },
  { id: "rpg", key: 7, short: "RPG", name: "RPG-7", proj: "rocket", rate: 0.9, mag: 1, res: 5, max: 12, recoil: 0.14, noise: 90, reload: 2.0, blast: 7.5, bdmg: 430, speed: 60, hold: "rpg" },
];
export const WEAPON_IDS = DEFS.map((d) => d.id);

// how each kind of gun is held: the gun arm's shoulder lift & elbow (they sum to
// zero, so the forearm - and the gun - point along the aim), and the other hand
const HOLD = {
  pistol: { sh: 0.05, el: -0.05, sup: { sh: 0.05, z: -0.42, el: -0.25 } },
  rifle: { sh: 0.5, el: -0.5, sup: { sh: 0.32, z: -0.5, el: -0.75 } },
  heavy: { sh: 0.75, el: -0.75, sup: { sh: 0.6, z: -0.45, el: -0.9 } },
  rpg: { sh: 1.0, el: -1.0, sup: { sh: 0.55, z: -0.4, el: -0.95 } },
};

function makeModel(id) {
  const g = new THREE.Group();
  const M = (c, metal = 0.6, rough = 0.45, em = 0) => new THREE.MeshStandardMaterial({ color: c, metalness: metal, roughness: rough, emissive: em ? c : 0x000000, emissiveIntensity: em });
  const METAL = M(0x2b2d31, 0.75, 0.38),
    DARK = M(0x141518, 0.5, 0.5),
    WOOD = M(0x6b3a1c, 0.05, 0.7),
    OLIVE = M(0x48512f, 0.3, 0.6),
    STEEL = M(0xa8adb4, 0.95, 0.22),
    ORANGE = M(0xd0640e, 0.2, 0.5);
  const box = (w, h, d, mat, x, y, z, rx = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.rotation.x = rx;
    g.add(m);
    return m;
  };
  const cyl = (r, len, mat, x, y, z, seg = 10, parent = g) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), mat);
    m.rotation.x = Math.PI / 2;
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };
  const muzzle = new THREE.Object3D();
  g.add(muzzle);
  let spin = null,
    warhead = null,
    pilot = null;
  switch (id) {
    case "katana": {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.007, 0.78, 0.032), M(0xd8dde4, 1, 0.12, 0.08));
      blade.position.set(0, 0.5, 0.0);
      g.add(blade);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.07, 4), blade.material);
      tip.position.set(0, 0.925, 0);
      tip.scale.set(0.4, 1, 1);
      g.add(tip);
      const tsuba = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.012, 12), M(0x1a1410, 0.8, 0.3));
      tsuba.position.y = 0.11;
      g.add(tsuba);
      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.26, 8), M(0x4a0a0a, 0.1, 0.8));
      grip.position.y = -0.0;
      g.add(grip);
      muzzle.position.set(0, 0.8, 0);
      break;
    }
    case "chainsaw":
      box(0.12, 0.16, 0.3, ORANGE, 0, 0.04, -0.06);
      box(0.13, 0.05, 0.12, DARK, 0, 0.14, -0.08);
      box(0.018, 0.075, 0.58, STEEL, 0, 0.03, 0.36);
      box(0.026, 0.09, 0.56, DARK, 0, 0.03, 0.37).scale.set(1, 1, 1);
      muzzle.position.set(0, 0.03, 0.6);
      break;
    case "pistol":
      box(0.034, 0.045, 0.19, METAL, 0, 0.065, 0.06);
      box(0.03, 0.1, 0.045, DARK, 0, 0.0, -0.005, -0.25);
      muzzle.position.set(0, 0.067, 0.17);
      break;
    case "magnum":
      box(0.044, 0.06, 0.27, STEEL, 0, 0.068, 0.09);
      cyl(0.02, 0.1, STEEL, 0, 0.068, 0.255);
      box(0.034, 0.11, 0.05, WOOD, 0, 0.0, -0.01, -0.25);
      muzzle.position.set(0, 0.07, 0.31);
      break;
    case "shotgun":
      cyl(0.02, 0.62, METAL, 0, 0.075, 0.28);
      cyl(0.03, 0.2, WOOD, 0, 0.042, 0.26);
      box(0.05, 0.075, 0.22, METAL, 0, 0.06, 0.0);
      box(0.042, 0.09, 0.3, WOOD, 0, 0.035, -0.24, 0.12);
      box(0.03, 0.09, 0.04, DARK, 0, -0.01, -0.03, -0.3);
      muzzle.position.set(0, 0.075, 0.6);
      break;
    case "uzi":
      box(0.045, 0.08, 0.25, DARK, 0, 0.06, 0.05);
      box(0.03, 0.17, 0.035, METAL, 0, -0.04, 0.0);
      cyl(0.012, 0.06, METAL, 0, 0.065, 0.2);
      muzzle.position.set(0, 0.065, 0.23);
      break;
    case "ak":
      box(0.052, 0.07, 0.36, METAL, 0, 0.06, 0.05);
      cyl(0.012, 0.34, METAL, 0, 0.074, 0.39);
      box(0.056, 0.058, 0.2, WOOD, 0, 0.058, 0.29);
      box(0.034, 0.18, 0.06, M(0x5a3214, 0.1, 0.6), 0, -0.05, 0.13, 0.32);
      box(0.042, 0.085, 0.3, WOOD, 0, 0.035, -0.25, 0.12);
      box(0.03, 0.09, 0.04, DARK, 0, -0.01, -0.02, -0.3);
      muzzle.position.set(0, 0.074, 0.57);
      break;
    case "sniper": {
      box(0.05, 0.07, 0.42, OLIVE, 0, 0.06, 0.05);
      cyl(0.015, 0.62, DARK, 0, 0.078, 0.55);
      cyl(0.026, 0.32, DARK, 0, 0.145, 0.06);
      const lens = cyl(0.024, 0.005, M(0x3a5aa0, 0.9, 0.05, 0.4), 0, 0.145, 0.222);
      lens.scale.set(1, 1, 1);
      box(0.046, 0.1, 0.34, OLIVE, 0, 0.032, -0.3, 0.1);
      box(0.03, 0.09, 0.04, DARK, 0, -0.01, -0.02, -0.3);
      box(0.01, 0.16, 0.01, DARK, 0.02, -0.02, 0.5, 0.4);
      box(0.01, 0.16, 0.01, DARK, -0.02, -0.02, 0.5, 0.4);
      muzzle.position.set(0, 0.078, 0.87);
      break;
    }
    case "minigun": {
      box(0.15, 0.15, 0.32, DARK, 0, 0.06, 0.02);
      box(0.12, 0.15, 0.17, OLIVE, -0.14, 0.0, -0.05);
      box(0.03, 0.08, 0.12, METAL, 0, 0.17, 0.0);
      spin = new THREE.Group();
      spin.position.set(0, 0.06, 0.18);
      g.add(spin);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        cyl(0.013, 0.56, METAL, Math.cos(a) * 0.04, Math.sin(a) * 0.04, 0.28, 6, spin);
      }
      cyl(0.06, 0.03, METAL, 0, 0, 0.5, 12, spin);
      muzzle.position.set(0, 0.06, 0.76);
      break;
    }
    case "flamer": {
      cyl(0.055, 0.34, M(0x8a1a10, 0.4, 0.4), 0, -0.02, -0.02);
      cyl(0.02, 0.48, METAL, 0, 0.07, 0.25);
      box(0.05, 0.06, 0.18, DARK, 0, 0.06, 0.0);
      box(0.03, 0.09, 0.04, DARK, 0, -0.02, 0.12, -0.3);
      pilot = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.6, 1.2, 3) }));
      pilot.position.set(0, 0.07, 0.5);
      g.add(pilot);
      muzzle.position.set(0, 0.07, 0.52);
      break;
    }
    case "gl":
      cyl(0.072, 0.15, DARK, 0, 0.04, 0.08, 12);
      cyl(0.036, 0.32, OLIVE, 0, 0.072, 0.3);
      box(0.04, 0.08, 0.26, DARK, 0, 0.03, -0.18, 0.12);
      box(0.03, 0.09, 0.04, DARK, 0, -0.03, 0.0, -0.3);
      muzzle.position.set(0, 0.072, 0.47);
      break;
    case "rpg": {
      cyl(0.042, 1.02, OLIVE, 0, 0.1, 0.13);
      box(0.03, 0.1, 0.04, DARK, 0, 0.03, 0.0, -0.3);
      box(0.03, 0.1, 0.04, DARK, 0, 0.03, 0.25, -0.3);
      warhead = new THREE.Group();
      g.add(warhead);
      const wb = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.16, 10), M(0x3a4426, 0.3, 0.6));
      wb.rotation.x = Math.PI / 2;
      wb.position.set(0, 0.1, 0.72);
      warhead.add(wb);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 10), M(0x3a4426, 0.3, 0.6));
      tip.rotation.x = Math.PI / 2;
      tip.position.set(0, 0.1, 0.88);
      warhead.add(tip);
      muzzle.position.set(0, 0.1, 0.66);
      break;
    }
  }
  g.traverse((m) => {
    if (m.isMesh) m.castShadow = true;
  });
  g.visible = false;
  return { g, muzzle, spin, warhead, pilot };
}

export function setupWeapons(Z) {
  const { api, camera, scene } = Z;
  const girl = api.girl;
  const touch = api.isTouch;
  const R = Z.rnd;
  const P = Z.player;

  // her hand (the right one: the rig's « L » side) holds the gun
  const holder = new THREE.Group();
  holder.position.set(0, -0.3, 0.015);
  holder.rotation.x = Math.PI / 2;
  girl.elbowL.add(holder);
  const baseZL = girl.armL.rotation.z,
    baseZR = girl.armR.rotation.z;
  // (yaw last: a raised arm can then sweep sideways - with no yaw it's the same pose)
  girl.armL.rotation.order = girl.armR.rotation.order = "YXZ";

  const all = DEFS.map((d) => {
    const w = { ...d, mag: d.mag || 0, res: d.res ?? 0, ammo: d.fuel ? 100 : 0, model: makeModel(d.id) };
    holder.add(w.model.g);
    return w;
  });
  const byId = Object.fromEntries(all.map((w) => [w.id, w]));
  const W = (Z.weapons = {
    owned: [],
    cur: null,
    input: { fire: false, aim: false },
    grenades: 2,
    strikes: 1,
    reloading: false,
    reloadFrac: 0,
    spreadPx: 0,
    scoped: false,
    cam: { d: 6.8, sh: 0, up: 0 },
  });
  // a fresh model of a gun (for the weapon crates)
  W.preview = (id) => {
    const m = makeModel(id).g;
    m.visible = true;
    return m;
  };
  W.has = (id) => W.owned.some((w) => w.id === id);
  W.magOf = (w) => w.mag;
  W.reserveOf = (w) => w.res;
  W.ammoOf = (w) => w.ammo;

  let cool = 0,
    reloadT = 0,
    switchT = 0,
    heat = 0,
    spinK = 0,
    lastShot = -9,
    swingT = 9,
    swingDir = 1,
    swingHit = false,
    throwT = 9,
    thrown = true,
    emptyT = 0,
    scopeTouch = false,
    sawTick = 0,
    flameTick = 0;
  const loops = {};
  function loopOn(kind) {
    if (!loops[kind]) loops[kind] = Z.sfx.loop(kind, null);
    return loops[kind];
  }
  function stopLoops() {
    for (const k in loops) {
      loops[k].stop();
      delete loops[k];
    }
  }

  function equip(w) {
    if (!w || w === W.cur) return;
    W.cur = w;
    for (const o of all) o.model.g.visible = false;
    w.model.g.visible = true;
    W.reloading = false;
    switchT = 0.35;
    cool = Math.max(cool, 0.3);
    spinK = 0;
    stopLoops();
    if (Z.entered) Z.sfx.cock();
    W.scoped = false;
    scopeTouch = false;
  }
  W.give = (id, bonus = 1) => {
    const w = byId[id];
    if (!w) return "none";
    if (!W.owned.includes(w)) {
      W.owned.push(w);
      W.owned.sort((a, b) => all.indexOf(a) - all.indexOf(b));
      const d0 = DEFS.find((d) => d.id === id);
      if (w.fuel) w.ammo = 100;
      else if (!w.melee) {
        w.mag = d0.mag;
        w.res = d0.res === Infinity ? Infinity : Math.round((d0.res || 0) * bonus);
      }
      equip(w);
      return "new";
    }
    const d0 = DEFS.find((d) => d.id === id);
    if (w.fuel) w.ammo = 100;
    else if (w.belt) w.res = w.mag = Math.min(w.max, w.mag + d0.mag);
    else if (!w.melee && w.res !== Infinity) w.res = Math.min(w.max || 999, w.res + d0.mag * 2);
    return "ammo";
  };
  W.addAmmo = (k = 1) => {
    let any = false;
    for (const w of W.owned) {
      if (w.melee && !w.fuel) continue;
      if (w.fuel) {
        if (w.ammo < 100) any = true;
        w.ammo = Math.min(100, w.ammo + 45 * k);
      } else if (w.belt) {
        if (w.mag < w.max) any = true;
        w.res = w.mag = Math.min(w.max, w.mag + Math.ceil(180 * k));
      } else if (w.res !== Infinity) {
        const add = Math.ceil(DEFS.find((d) => d.id === w.id).mag * 1.5 * k);
        if (w.res < (w.max || 999)) any = true;
        w.res = Math.min(w.max || 999, w.res + add);
      }
    }
    return any;
  };
  W.give("katana");
  W.give("shotgun");
  W.give("pistol");
  // 🔫 Rombie World: she starts with the machine gun in her hands, belt full
  W.give("minigun");
  byId.minigun.mag = byId.minigun.res = byId.minigun.max;

  // ---- choosing -------------------------------------------------------------------------------
  W.cycle = (dir = 1) => {
    if (!W.owned.length) return;
    let i = W.owned.indexOf(W.cur);
    for (let k = 0; k < W.owned.length; k++) {
      i = (i + dir + W.owned.length) % W.owned.length;
      const w = W.owned[i];
      if (hasAmmo(w) || w.melee) return equip(w);
    }
  };
  function selectSlot(n) {
    const inSlot = W.owned.filter((w) => w.key === n);
    if (!inSlot.length) return;
    const i = inSlot.indexOf(W.cur);
    equip(inSlot[(i + 1) % inSlot.length]);
  }
  function hasAmmo(w) {
    if (w.melee && !w.fuel) return true;
    if (w.fuel) return w.ammo > 0;
    return w.mag > 0 || w.res > 0;
  }
  W.reload = () => {
    const w = W.cur;
    if (!w || w.melee || w.fuel || w.belt || W.reloading) return;
    if (w.mag >= DEFS.find((d) => d.id === w.id).mag || w.res <= 0) return;
    W.reloading = true;
    reloadT = 0;
    Z.sfx.reload(w.reload);
  };
  W.toggleScope = () => (scopeTouch = !scopeTouch);

  // ---- input -------------------------------------------------------------------------------------
  const canAct = () => api.started && Z.entered && !api.uiPaused && !P.dead && api.vehMode === "walk";
  addEventListener("mousedown", (e) => {
    if (!canAct() || !api.locked) return;
    if (e.button === 0) W.input.fire = true;
    if (e.button === 2) W.input.aim = true;
  });
  addEventListener("mouseup", (e) => {
    if (e.button === 0) W.input.fire = false;
    if (e.button === 2) W.input.aim = false;
  });
  addEventListener("contextmenu", (e) => {
    if (api.started) e.preventDefault();
  });
  document.addEventListener("pointerlockchange", () => {
    if (!document.pointerLockElement) W.input.fire = W.input.aim = false;
  });
  let wheelT = 0;
  addEventListener(
    "wheel",
    (e) => {
      if (!canAct() || !api.locked) return;
      const now = performance.now();
      if (now - wheelT < 110) return;
      wheelT = now;
      W.cycle(e.deltaY > 0 ? 1 : -1);
    },
    { passive: true },
  );
  addEventListener("keydown", (e) => {
    if (!canAct() || e.repeat) return;
    const m = /^Digit([1-7])$/.exec(e.code);
    if (m) return selectSlot(+m[1]);
    if (e.code === "KeyR") W.reload();
    else if (e.code === "KeyQ") W.throwGrenade();
    else if (e.code === "KeyX") W.callStrike();
  });

  // ---- shooting ------------------------------------------------------------------------------------
  const _o = new THREE.Vector3(),
    _d = new THREE.Vector3(),
    _dd = new THREE.Vector3(),
    _m = new THREE.Vector3(),
    _e = new THREE.Vector3(),
    _gc = new THREE.Vector3(),
    _t = new THREE.Vector3(),
    _up = new THREE.Vector3(0, 1, 0),
    _rt = new THREE.Vector3();
  function muzzlePos(out) {
    W.cur.model.muzzle.getWorldPosition(out);
    return out;
  }
  // the aim ray from the screen centre, starting past her
  function aimRay(o, d) {
    o.copy(camera.position);
    camera.getWorldDirection(d);
    if (touch && !W.scoped) {
      const a = Z.zombies.assist(o, d, 75, Math.cos(0.17));
      if (a) d.subVectors(a.point, o).normalize();
    }
    Z.pchest(_gc);
    const skip = Math.max(0, _gc.sub(o).dot(d) - 0.3);
    o.addScaledVector(d, skip);
  }
  function spreadDir(d, s, out) {
    // a random direction in a cone of half-angle ~s around d
    _rt.crossVectors(d, _up);
    if (_rt.lengthSq() < 1e-6) _rt.set(1, 0, 0);
    _rt.normalize();
    _t.crossVectors(_rt, d).normalize();
    const a = Math.random() * 6.283,
      r = Math.sqrt(Math.random()) * s;
    return out.copy(d).addScaledVector(_rt, Math.cos(a) * r).addScaledVector(_t, Math.sin(a) * r).normalize();
  }
  function curSpread(w) {
    const mv = Math.min(1, Math.hypot(api.vel.x, api.vel.z) / 7);
    let s = (w.spread || 0) * (1 + mv * 0.8 + heat * 1.5) * (W.input.aim ? 0.45 : 1);
    if (W.scoped) s = 0.0008;
    if (!girl.grounded) s *= 1.5;
    return s;
  }
  const hitsBy = new Map();
  const skip = new Set();
  function wallBloodBehind(point, d) {
    // the spray behind a hit lands on a wall, if one is close behind it
    const t = Z.rayCast(point, d, 4.5, 0.4);
    if (Z.hitKind === "wall" && Math.random() < 0.85) {
      _e.copy(point).addScaledVector(d, t);
      Z.fx.wallBlood(_e, R(0.9, 1.7));
    }
  }
  function fireHitscan(w) {
    aimRay(_o, _d);
    muzzlePos(_m);
    hitsBy.clear();
    const n = w.pellets || 1;
    const s = curSpread(w);
    let anyHit = false;
    for (let i = 0; i < n; i++) {
      spreadDir(_d, s, _dd);
      const wallT = Z.rayCast(_o, _dd, w.range, 0.8);
      const kind = Z.hitKind;
      skip.clear();
      let end = wallT,
        stopped = false;
      for (let k = 0; k <= (w.pierce || 0); k++) {
        const h = Z.zombies.hitTest(_o, _dd, end, skip);
        const ah = Z.aircraft.hitTest(_o, _dd, h ? h.t : end);
        if (ah) {
          ah.a.damage(w.dmg * (w.pellets ? 1 : 1), ah.point);
          Z.fx.sparks(ah.point, 6, 8);
          Z.hud.hitmark("hit");
          end = ah.t;
          stopped = true;
          anyHit = true;
          break;
        }
        if (!h) break;
        skip.add(h.zb);
        const mult = h.part === "head" ? w.head : h.part === "legs" ? 0.7 : 1;
        let e = hitsBy.get(h.zb);
        if (!e) {
          e = { dmg: 0, head: false, legs: false, point: h.point.clone(), t: h.t, dir: _dd.clone(), hits: 0 };
          hitsBy.set(h.zb, e);
        }
        e.dmg += w.dmg * mult * R(0.92, 1.08);
        e.hits++;
        if (h.part === "head") {
          e.head = true;
          e.point.copy(h.point);
        }
        anyHit = true;
        wallBloodBehind(h.point, _dd);
        if (k === (w.pierce || 0)) {
          end = h.t;
          stopped = true;
        }
      }
      // where it ends: a spark on stone, dust off the street
      _e.copy(_o).addScaledVector(_dd, end);
      if (!stopped && end < w.range - 0.5) {
        if (kind === "wall" || kind === "ground") {
          Z.fx.sparks(_e, 4, 6);
          Z.fx.dust(_e, 2, 0.18);
          if (Math.random() < 0.15) Z.sfx.ricochet(_e);
        }
      }
      if (i < 3 || Math.random() < 0.5) Z.fx.tracer(_m, _e, w.id === "sniper" ? [3.4, 3.0, 2.4] : [3, 2.1, 0.9], w.id === "sniper" ? 600 : 380, w.id === "minigun" ? 9 : 6);
    }
    for (const [zb, e] of hitsBy) {
      const close = zb.pos.distanceTo(girl.pos) < 3.6;
      Z.zombies.damage(zb, e.dmg, {
        dir: e.dir,
        part: e.head ? "head" : "body",
        point: e.point,
        decap: w.decap,
        knock: (w.knock || 1) * e.hits,
        gib: w.pellets && close && e.dmg > zb.hp + 60 && !zb.def.big,
      });
      if (zb.alive) Z.hud.hitmark("hit");
      else if (close) Z.hud.splat(e.head ? 0.6 : 0.4);
    }
    if (anyHit && !hitsBy.size) Z.hud.hitmark("hit");
  }

  // ---- projectiles: grenades, launcher rounds, rockets ------------------------------------------------
  const projs = [];
  const nadeGeo = new THREE.SphereGeometry(0.075, 8, 6);
  const nadeMat = new THREE.MeshStandardMaterial({ color: 0x3e4a2a, roughness: 0.6, metalness: 0.3 });
  const blinkMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 0.3, 0.2) });
  const rocketMat = new THREE.MeshStandardMaterial({ color: 0x3a4426, roughness: 0.6, metalness: 0.3 });
  function launch(kind, pos, vel) {
    let m;
    if (kind === "rocket") {
      m = new THREE.Group();
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.5, 8), rocketMat);
      b.rotation.x = Math.PI / 2;
      m.add(b);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 8), rocketMat);
      tip.rotation.x = Math.PI / 2;
      tip.position.z = 0.32;
      m.add(tip);
    } else {
      m = new THREE.Mesh(nadeGeo, nadeMat);
      if (kind === "hand") {
        const l = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), blinkMat);
        l.position.y = 0.07;
        m.add(l);
        m.userData.l = l;
      }
    }
    m.position.copy(pos);
    scene.add(m);
    projs.push({ kind, m, vel: vel.clone(), age: 0, fuse: kind === "hand" ? 2.3 : 6, bounced: 0, smokeT: 0 });
  }
  function boom(pr, p) {
    scene.remove(pr.m);
    const w = pr.kind === "rocket" ? byId.rpg : byId.gl;
    const r = pr.kind === "hand" ? 6.5 : w.blast,
      dmg = pr.kind === "hand" ? 300 : w.bdmg;
    Z.explode(p, r, dmg, { src: "player", big: pr.kind === "rocket" ? 1.3 : 1, maxSelf: 35 });
    if (Z.camera.position.distanceTo(p) < 45) Z.slowmo(0.5, 0.18);
  }
  function updateProjs(dt) {
    for (let i = projs.length - 1; i >= 0; i--) {
      const pr = projs[i],
        m = pr.m;
      pr.age += dt;
      if (pr.kind === "rocket") {
        // a touch of homing on whatever flies in front of it
        const tgt = Z.aircraft.nearestAhead(m.position, pr.vel, 0.94);
        if (tgt) {
          _t.subVectors(tgt, m.position).normalize().multiplyScalar(pr.vel.length());
          pr.vel.lerp(_t, Math.min(1, dt * 2.2));
        }
        pr.smokeT -= dt;
        if (pr.smokeT <= 0) {
          pr.smokeT = touch ? 0.035 : 0.018;
          Z.fx.smoke(m.position, 1, 0.25, 0.3, 0.2, 1.6);
          Z.fx.fire(m.position, 1, 0.25, 0);
        }
      } else pr.vel.y -= (pr.kind === "hand" ? 16 : 11) * dt;
      _t.copy(m.position);
      m.position.addScaledVector(pr.vel, dt);
      if (pr.kind === "rocket") m.lookAt(_e.copy(m.position).add(pr.vel));
      else {
        m.rotation.x += dt * 8;
        if (m.userData.l) m.userData.l.visible = Math.sin(pr.age * (10 + pr.age * 14)) > 0;
      }
      const p = m.position;
      // contact: a zombie, a flying machine, a wall, the ground
      let hitNow = false;
      if (pr.kind !== "hand") {
        _d.copy(pr.vel).normalize();
        const seg = pr.vel.length() * dt;
        const h = Z.zombies.hitTest(_t, _d, seg + 0.2);
        const ah = Z.aircraft.hitTest(_t, _d, seg + 0.5);
        if (h || ah) hitNow = true;
      }
      const floor = Z.groundAt(p.x, p.z, p.y + 0.5);
      if (Z.solidAt(p.x, p.y, p.z) && p.y > floor + 0.05) {
        if (pr.kind === "hand") {
          m.position.copy(_t);
          pr.vel.x *= -0.45;
          pr.vel.z *= -0.45;
        } else hitNow = true;
      }
      if (p.y <= floor + 0.07) {
        if (pr.kind === "hand") {
          p.y = floor + 0.07;
          if (pr.vel.y < -1) Z.sfx.empty();
          pr.vel.y *= -0.35;
          pr.vel.x *= 0.65;
          pr.vel.z *= 0.65;
        } else hitNow = true;
      }
      if (hitNow || pr.age > pr.fuse) {
        projs.splice(i, 1);
        boom(pr, p);
      }
    }
  }
  W.throwGrenade = () => {
    if (!canAct() || W.grenades <= 0 || throwT < 0.6) return;
    W.grenades--;
    throwT = 0;
    thrown = false;
    Z.sfx.swing();
  };
  W.callStrike = () => {
    if (!canAct() || W.strikes <= 0) return;
    aimRay(_o, _d);
    const t = Z.rayCast(_o, _d, 220, 1);
    _e.copy(_o).addScaledVector(_d, Math.min(t, 220));
    if (_e.y > 3) _e.y = Z.groundAt(_e.x, _e.z, _e.y + 0.5);
    W.strikes--;
    Z.aircraft.friendlyStrike(_e.clone(), api.yaw + Math.PI);
    Z.hud.toast("✈️ AIR STRIKE INBOUND", "#7ad0ff");
  };

  // ---- one shot of the current gun ---------------------------------------------------------------------
  function shoot(w) {
    if (w.proj) {
      aimRay(_o, _d);
      const t = Z.rayCast(_o, _d, 240, 1);
      _e.copy(_o).addScaledVector(_d, t);
      muzzlePos(_m);
      _d.subVectors(_e, _m).normalize();
      if (w.proj === "grenade") _d.y += 0.08;
      launch(w.proj === "rocket" ? "rocket" : "gl", _m, _d.multiplyScalar(w.speed));
      Z.fx.smoke(_m, w.proj === "rocket" ? 6 : 3, 0.4, 0.35, 0.6, 1.5);
      if (w.proj === "rocket") {
        // the back-blast
        camera.getWorldDirection(_t);
        _e.copy(_m).addScaledVector(_t, -1.2);
        Z.fx.smoke(_e, 8, 0.6, 0.35, 0.4, 1.8);
        Z.fx.fire(_e, 4, 0.5, 0);
      }
    } else fireHitscan(w);
    muzzlePos(_m);
    Z.fx.muzzle(_m, w.id === "minigun" ? 0.55 : w.id === "pistol" || w.id === "uzi" ? 0.35 : w.id === "sniper" || w.id === "magnum" || w.id === "shotgun" ? 0.75 : 0.5);
    // a brass case flies out to the right
    if (!w.proj) {
      _rt.set(Math.cos(api.yaw), 0, -Math.sin(api.yaw));
      Z.fx.norm.spawn(_m.x, _m.y, _m.z, _rt.x * R(1.5, 3), R(1.5, 3), _rt.z * R(1.5, 3), 1.2, 0.035, 0.035, [0.75, 0.55, 0.18, 1], [0.6, 0.45, 0.15, 1], 14, 0.2, 1, Z.groundAt(_m.x, _m.z, _m.y) + 0.02);
    }
    Z.sfx.shot(w.id);
    Z.zombies.noise(girl.pos, w.noise || 50);
    // kick
    const k = w.recoil * (W.input.aim ? 0.6 : 1) * (W.scoped ? 0.7 : 1);
    api.pitch = Math.min(1.45, api.pitch + k * R(0.7, 1.1));
    api.yaw += k * R(-0.35, 0.35);
    Z.fx.shake(Math.min(0.3, k * 2.2));
    heat = Math.min(1, heat + (w.auto ? 0.07 : 0.25));
    if (!w.belt) w.mag--;
    else {
      w.mag--;
      w.res = w.mag;
    }
    lastShot = Z.rt;
  }

  // ---- per frame ---------------------------------------------------------------------------------------------
  W.update = (dt, sdt) => {
    const w = W.cur;
    const act = canAct();
    if (!act) {
      W.input.fire = false;
      if (P.dead || api.vehMode !== "walk") stopLoops();
    }
    cool -= dt;
    switchT -= dt;
    heat = Math.max(0, heat - dt * 1.6);
    emptyT -= dt;
    // the scope
    const wantScope = act && w && w.zoom && (W.input.aim || scopeTouch) && switchT <= 0 && !W.reloading;
    const wasScoped = W.scoped;
    W.scoped = !!wantScope;
    if (W.scoped !== wasScoped) {
      // (only on the change: riding, the car code hides her itself)
      Z.hud.scope(W.scoped);
      girl.g.visible = !W.scoped;
    }
    if (W.scoped) {
      _e.set(girl.pos.x, girl.pos.y + 1.66, girl.pos.z);
      camera.position.copy(_e).addScaledVector(_t.set(-Math.sin(api.yaw), 0, -Math.cos(api.yaw)), 0.3);
      camera.quaternion.setFromEuler(_eul.set(api.pitch, api.yaw, 0, "YXZ"));
    }
    // reload
    if (W.reloading) {
      reloadT += dt;
      W.reloadFrac = Math.min(1, reloadT / w.reload);
      if (reloadT >= w.reload) {
        W.reloading = false;
        const full = DEFS.find((d) => d.id === w.id).mag;
        const take = Math.min(full - w.mag, w.res);
        w.mag += take;
        if (w.res !== Infinity) w.res -= take;
      }
    }
    // the minigun spins up while the trigger is held
    if (w && w.spin) {
      const want = act && W.input.fire && w.mag > 0 ? 1 : 0;
      spinK += (want - spinK) * Math.min(1, dt * (want ? 1 / w.spin : 1.5));
      if (w.model.spin) w.model.spin.rotation.z += dt * spinK * 40;
      const L = spinK > 0.02 ? loopOn("spin") : null;
      if (L) L.set(null, 0.18 * spinK, 40 + spinK * 90);
      else if (loops.spin) {
        loops.spin.stop();
        delete loops.spin;
      }
    }
    if (w && w.model.warhead) w.model.warhead.visible = w.mag > 0 && !W.reloading;
    // fire
    if (act && w && switchT <= 0 && !W.reloading) {
      if (w.melee && !w.fuel) {
        if (W.input.fire && cool <= 0) {
          cool = 1 / w.rate;
          swingT = 0;
          swingHit = false;
          swingDir = -swingDir;
          Z.sfx.swing();
        }
      } else if (w.id === "chainsaw") updateSaw(w, dt);
      else if (w.flame) updateFlamer(w, dt);
      else if (W.input.fire && cool <= 0) {
        if (w.mag <= 0) {
          if (w.res > 0 && !w.belt) W.reload();
          else if (emptyT <= 0) {
            emptyT = 0.4;
            Z.sfx.empty();
            if (!w.auto || w.belt) W.cycle(1);
          }
        } else if (!w.spin || spinK > 0.85) {
          cool = 1 / w.rate;
          shoot(w);
          if (!w.auto) W.input.fire = touch ? W.input.fire : false;
        }
      }
    }
    if (w && !w.fuel && !w.melee && w.mag <= 0 && w.res > 0 && !W.reloading && !w.belt && act && Z.rt - lastShot > 0.25) W.reload();
    // the katana's cut lands a beat into the swing
    swingT += dt;
    if (w && w.id === "katana" && !swingHit && swingT > 0.1 && swingT < 0.3) {
      swingHit = true;
      const fx = -Math.sin(api.yaw),
        fz = -Math.cos(api.yaw);
      const n = Z.zombies.melee(girl.pos, fx, fz, w.range, w.arc, w.dmg, w);
      if (n) {
        Z.sfx.slash();
        Z.slowmo(0.25, 0.07);
        Z.fx.shake(0.15);
        Z.hud.splat(0.25);
      }
    }
    // the grenade leaves her hand
    throwT += dt;
    if (!thrown && throwT > 0.22) {
      thrown = true;
      camera.getWorldDirection(_d);
      _m.set(girl.pos.x, girl.pos.y + 1.7, girl.pos.z).addScaledVector(_d, 0.5);
      _d.multiplyScalar(17);
      _d.y += 4.5;
      _d.x += api.vel.x * 0.5;
      _d.z += api.vel.z * 0.5;
      launch("hand", _m, _d);
    }
    updateProjs(sdt);
    // a bit of HUD info
    const s = w && !w.melee && !w.flame ? curSpread(w) : 0;
    W.spreadPx = Math.min(60, (s * innerHeight) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))));
    if (w && w.model.pilot) w.model.pilot.scale.setScalar(0.8 + Math.random() * 0.5);
  };
  const _eul = new THREE.Euler();

  function updateSaw(w, dt) {
    const L = loopOn("chainsaw");
    const cutting = W.input.fire && w.ammo > 0;
    if (cutting) {
      w.ammo = Math.max(0, w.ammo - w.use * dt);
      sawTick -= dt;
      if (sawTick <= 0) {
        sawTick = 0.1;
        const fx = -Math.sin(api.yaw),
          fz = -Math.cos(api.yaw);
        const n = Z.zombies.melee(girl.pos, fx, fz, w.range, w.arc, w.dps * 0.1, w);
        if (n) {
          Z.fx.shake(0.12);
          muzzlePos(_m);
          Z.fx.blood(_m, _t.set(fx, 0.5, fz), 10, 4);
          Z.hud.splat(0.12);
        }
        L.set(null, n ? 0.5 : 0.4, n ? 72 : 120);
      }
    } else L.set(null, w.ammo > 0 ? 0.13 : 0, 70);
    if (w.ammo <= 0 && W.input.fire && emptyT <= 0) {
      emptyT = 0.5;
      Z.sfx.empty();
      W.cycle(1);
    }
  }
  function updateFlamer(w, dt) {
    const on = W.input.fire && w.ammo > 0;
    const L = loopOn("flame");
    L.set(null, on ? 0.45 : 0, null);
    if (!on) {
      if (w.ammo <= 0 && W.input.fire && emptyT <= 0) {
        emptyT = 0.5;
        Z.sfx.empty();
        W.cycle(1);
      }
      return;
    }
    w.ammo = Math.max(0, w.ammo - w.use * dt);
    muzzlePos(_m);
    camera.getWorldDirection(_d);
    const n = touch ? 2 : 4;
    for (let i = 0; i < n; i++) Z.fx.flame(_m, _d);
    Z.fx.light(_m, 0xff8a2a, 9, 0.12, 16);
    flameTick -= dt;
    if (flameTick <= 0) {
      flameTick = 0.1;
      Z.zombies.noise(girl.pos, w.noise);
      for (const zb of Z.zombies.list) {
        if (!zb.alive) continue;
        _e.set(zb.pos.x, zb.pos.y + 1 * zb.scale, zb.pos.z).sub(_m);
        const d = _e.length();
        if (d > w.range) continue;
        if (_e.dot(_d) / d < 0.93 - (d < 2.5 ? 0.3 : 0)) continue;
        Z.zombies.ignite(zb);
        Z.zombies.damage(zb, w.dps * 0.1, { fire: true, dir: _d });
      }
    }
  }

  // ---- her pose: the gun up and on the aim -------------------------------------------------------------
  let readyK = 0,
    aimK = 0,
    deadK = 0;
  const lerp = THREE.MathUtils.lerp;
  W.poseGirl = (dt) => {
    const w = W.cur;
    const busy = girl.climbing || girl.swim || girl.rest;
    holder.visible = !!w && !busy && !P.dead && Z.entered;
    const B = girl.body;
    if (P.dead) {
      deadK = Math.min(1, deadK + dt * 1.6);
      const e = deadK * deadK;
      B.rotation.set(-1.5 * e, 0, 0.1 * e);
      B.position.y = 0.12 * e;
      girl.armL.rotation.x = lerp(girl.armL.rotation.x, -2.6, e);
      girl.armR.rotation.x = lerp(girl.armR.rotation.x, -2.2, e);
      girl.legL.rotation.x = girl.legR.rotation.x = lerp(0, -0.1, e);
      girl.kneeL.rotation.x = girl.kneeR.rotation.x = 0.1;
      return;
    }
    deadK = 0;
    if (!Z.entered || !w || busy) {
      girl.armL.rotation.z = baseZL;
      girl.armR.rotation.z = baseZR;
      girl.armL.rotation.y = girl.armR.rotation.y = 0;
      return;
    }
    const sprint = api.keys.ShiftLeft || api.keys.ShiftRight;
    const recentlyFired = Z.rt - lastShot < 0.6 || W.input.fire;
    const ready = w.melee ? 0 : sprint && !recentlyFired && !W.input.aim ? 0.25 : 1;
    readyK += (ready - readyK) * Math.min(1, dt * 10);
    aimK += ((W.input.aim || W.scoped ? 1 : 0) - aimK) * Math.min(1, dt * 10);
    const AL = girl.armL,
      AR = girl.armR,
      EL = girl.elbowL,
      ER = girl.elbowR;
    const a = Z.clamp(api.pitch, -1.2, 1.3);
    // she faces the aim (or where she runs, sprinting with the gun down)
    if ((!w.melee && readyK > 0.5) || (w.melee && (swingT < 0.35 || W.input.fire))) {
      girl.yaw = api.yaw + Math.PI;
      girl.g.rotation.y = girl.yaw;
    }
    if (w.melee) {
      if (w.id === "katana") {
        // ready: blade forward and low; a swing sweeps across
        const u = Math.min(1, swingT / 0.3);
        const sw = swingT < 0.3 ? Math.sin(u * Math.PI) : 0;
        const across = swingT < 0.3 ? lerp(-1.1, 1.1, u) * swingDir : 0;
        AL.rotation.x = lerp(-0.5, -1.7, sw);
        AL.rotation.y = across * 0.9;
        AL.rotation.z = baseZL - 0.25 * sw;
        EL.rotation.x = lerp(-0.7, -0.15, sw);
        B.rotation.y = across * 0.35;
        holder.rotation.set(Math.PI / 2 + lerp(0.2, -0.3, sw), 0, across * 0.3);
      } else {
        // the chainsaw, held low in both hands
        const j = W.input.fire ? Math.sin(Z.rt * 60) * 0.03 : 0;
        AL.rotation.set(-0.75 - a * 0.4 + j, 0, baseZL + 0.15);
        EL.rotation.x = -0.75;
        AR.rotation.set(-0.85 - a * 0.4 + j, 0, -0.5);
        ER.rotation.x = -0.8;
        holder.rotation.set(Math.PI / 2, 0, 0);
      }
      return;
    }
    holder.rotation.set(Math.PI / 2, 0, 0);
    const H = HOLD[w.hold] || HOLD.rifle;
    const k = readyK;
    // reloading / switching: the gun dips
    const dip = (W.reloading ? Math.sin(Math.min(1, W.reloadFrac) * Math.PI) * 0.7 : 0) + Math.max(0, switchT) * 2;
    const recoil = Math.max(0, 1 - (Z.rt - lastShot) * 12) * (w.recoil || 0) * 3;
    const ax = -Math.PI / 2 - a + H.sh + dip + recoil;
    AL.rotation.x = lerp(AL.rotation.x, ax, k);
    AL.rotation.y = lerp(0, 0.08, k);
    AL.rotation.z = lerp(baseZL, baseZL + 0.12, k);
    EL.rotation.x = lerp(EL.rotation.x, H.el - recoil * 0.5, k);
    const S = H.sup;
    AR.rotation.x = lerp(AR.rotation.x, -Math.PI / 2 - a + S.sh + dip * 0.7, k);
    AR.rotation.y = lerp(0, -0.15, k);
    AR.rotation.z = lerp(baseZR, S.z, k);
    ER.rotation.x = lerp(ER.rotation.x, S.el, k);
    // the grenade throw: the support arm winds up and over
    if (throwT < 0.45) {
      const u = throwT / 0.45;
      AR.rotation.x = lerp(-2.9, -0.6, u);
      AR.rotation.z = baseZR + 0.2;
      ER.rotation.x = -0.5;
    }
    B.rotation.y += (aimK * 0.06);
  };
  W.speedMul = () => {
    const w = W.cur;
    if (!w) return 1;
    let k = 1;
    if (w.slow) k *= lerp(1, w.slow, Math.max(0.5, spinK));
    if (W.scoped) k *= 0.35;
    else if (W.input.aim) k *= 0.6;
    return k;
  };
  W.gaitSign = () => {
    if (!W.cur || W.cur.melee || readyK < 0.5) return 1;
    const fx = Math.sin(girl.yaw),
      fz = Math.cos(girl.yaw);
    return api.vel.x * fx + api.vel.z * fz < -0.4 ? -1 : 1;
  };
  W.sens = () => (W.scoped ? 0.22 : W.input.aim ? 0.7 : 1);
  // the camera: over her shoulder with a gun, tighter when aiming
  W.cameraFx = (dt) => {
    const w = W.cur;
    const armed = Z.entered && w && !P.dead && api.vehMode === "walk";
    const k = Math.min(1, dt * 9);
    const tgt = !armed ? [6.8, 0, 0] : w.melee ? [5.4, 0.45, 0] : aimK > 0.5 ? [2.9, 0.72, -0.12] : readyK > 0.5 ? [4.3, 0.85, -0.18] : [5.6, 0.5, 0];
    W.cam.d += (tgt[0] - W.cam.d) * k;
    W.cam.sh += (tgt[1] - W.cam.sh) * k;
    W.cam.up += (tgt[2] - W.cam.up) * k;
    const fov = W.scoped ? 13 : aimK > 0.5 && armed ? 56 : 70;
    if (Math.abs(camera.fov - fov) > 0.05) {
      camera.fov += (fov - camera.fov) * Math.min(1, dt * (W.scoped ? 18 : 10));
      camera.updateProjectionMatrix();
    }
  };
  W.onDeath = () => {
    W.input.fire = W.input.aim = false;
    if (W.scoped) {
      W.scoped = false;
      Z.hud.scope(false);
      girl.g.visible = true;
    }
    stopLoops();
  };
  W.onRespawn = () => {
    deadK = 0;
    girl.body.rotation.set(0, 0, 0);
    girl.body.position.y = 0;
    const p = byId.pistol;
    p.mag = DEFS.find((d) => d.id === "pistol").mag;
    W.grenades = Math.max(W.grenades, 2);
    const mg = byId.minigun;
    if (W.has("minigun")) mg.mag = mg.res = Math.max(mg.mag, 300); // (back up with a belt to spare)
    equip((W.has("minigun") && mg) || W.owned.find((x) => x.id !== "katana" && hasAmmo(x)) || p);
  };
}
