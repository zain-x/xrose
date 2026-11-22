// 🧟 the dead. Each one is a single skinned mesh on a 12-bone skeleton built
// right here from simple shapes (so a whole horde costs a few draw calls),
// with glowing eyes, its own clothes and blood. They wander and groan until
// they SEE her (or hear her guns) - then they scream, the ones around them
// wake too, and they come: shambling, sprinting, crawling. Heads come off,
// bodies burst, burn, and fly over car bonnets.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const BONES = ["hips", "spine", "chest", "head", "shL", "elL", "shR", "elR", "thL", "knL", "thR", "knR"];
const BI = Object.fromEntries(BONES.map((b, i) => [b, i]));
const PARENT = { spine: "hips", chest: "spine", head: "chest", shL: "chest", elL: "shL", shR: "chest", elR: "shR", thL: "hips", knL: "thL", thR: "hips", knR: "thR" };
const HEAD_Y = 1.58;

const BUILDS = {
  walker: { shX: 0.21, hipX: 0.1, limb: 1, chest: [0.2, 0.16, 0.12], belly: [0.16, 0.13, 0.11], pelvis: [0.17, 0.11, 0.115], head: 1 },
  runner: { shX: 0.19, hipX: 0.095, limb: 0.85, chest: [0.18, 0.15, 0.11], belly: [0.14, 0.12, 0.1], pelvis: [0.15, 0.1, 0.105], head: 0.97 },
  bloater: { shX: 0.27, hipX: 0.12, limb: 1.12, chest: [0.26, 0.2, 0.2], belly: [0.34, 0.3, 0.32], pelvis: [0.24, 0.14, 0.18], head: 1 },
  brute: { shX: 0.31, hipX: 0.13, limb: 1.6, chest: [0.33, 0.23, 0.2], belly: [0.26, 0.17, 0.17], pelvis: [0.21, 0.13, 0.15], head: 0.86 },
};
const TYPES = {
  walker: { name: "Walker", hp: 100, walk: [0.7, 1.3], run: [2.3, 3.2], dmg: 10, reach: 1.35, sight: 34, score: 100, scale: [0.93, 1.08], eyes: 0 },
  runner: { name: "Runner", hp: 70, walk: [1.1, 1.6], run: [4.4, 5.4], dmg: 7, reach: 1.3, sight: 48, score: 150, scale: [0.92, 1.03], eyes: 1 },
  crawler: { name: "Crawler", hp: 55, walk: [0.5, 0.8], run: [1.8, 2.4], dmg: 8, reach: 1.25, sight: 24, score: 80, scale: [0.95, 1.05], eyes: 0 },
  bloater: { name: "Bloater", hp: 150, walk: [0.7, 0.95], run: [1.7, 2.1], dmg: 12, reach: 1.7, sight: 28, score: 200, scale: [1.05, 1.15], eyes: 2 },
  brute: { name: "Brute", hp: 1100, walk: [1.1, 1.3], run: [3.0, 3.4], dmg: 28, reach: 2.25, sight: 44, score: 1000, scale: [1.5, 1.58], eyes: 3, big: true },
  // 🦖 the giants: three and a half times her height, slow, every step shakes the
  // street - a car bounces off their shins (ram them fast, or bring the guns)
  giant: { name: "Giant", hp: 2400, walk: [1.2, 1.5], run: [3.2, 3.8], dmg: 18, reach: 3.8, sight: 70, score: 3000, scale: [3.3, 3.7], eyes: 3, big: true, giant: true },
};
const SKIN = [0x8a9a7c, 0x7c8a8c, 0x9a9468, 0x6f7a62, 0xa3a08a, 0x8c8478];
const SHIRT = [0x4a5a6e, 0x6e2a2a, 0x3c4a32, 0x7a6a50, 0x2f2f36, 0x8a8478, 0x5a3a5e, 0x24506a, 0x8a5a20];
const PANTS = [0x2a2e3a, 0x3a3328, 0x23262b, 0x4a4436, 0x30383a];
const HAIR = [0x1c1612, 0x3a2a1c, 0x5a4a3a, 0x8a8070, 0x2a1a10];

function outfit(type) {
  const p = (a) => a[(Math.random() * a.length) | 0];
  const o = { skin: p(SKIN), shirt: p(SHIRT), pants: p(PANTS), hair: Math.random() < 0.75 ? p(HAIR) : null, sleeves: p(["short", "long", "long", "none"]), blood: 0.12 + Math.random() * 0.2, cap: null, tie: false, coat: false, legless: false };
  const r = Math.random();
  if (type === "walker" || type === "runner" || type === "crawler") {
    if (r < 0.14) Object.assign(o, { shirt: 0x1f2a48, pants: 0x161c2e, cap: 0x141a2c, sleeves: "short" }); // police
    else if (r < 0.26) Object.assign(o, { shirt: 0xc8c6bc, pants: 0x5a6a7a, coat: true, sleeves: "long", blood: 0.35 }); // doctor
    else if (r < 0.36) Object.assign(o, { shirt: 0xd8661a, pants: 0x2a3040, cap: Math.random() < 0.5 ? 0xd8c020 : null }); // road worker
    else if (r < 0.48) Object.assign(o, { shirt: 0x2a2a2e, pants: 0x2a2a2e, tie: true, sleeves: "long" }); // office
    else if (r < 0.56) Object.assign(o, { shirt: 0x8aa0a8, pants: 0x8aa0a8, sleeves: "none", hair: null }); // patient gown
  }
  if (type === "crawler") o.legless = true;
  if (type === "brute") Object.assign(o, { sleeves: "none", shirt: o.skin, hair: null, blood: 0.3, pants: 0x2a2620 });
  if (type === "giant") Object.assign(o, { skin: 0x7d8a6e, sleeves: "none", shirt: 0x7d8a6e, hair: null, blood: 0.45, pants: 0x3a2c22 });
  if (type === "bloater") Object.assign(o, { skin: 0x8f9a5a, sleeves: "none", shirt: 0x6a6a52, hair: null, blood: 0.18 });
  return o;
}

// ---- building one variant's mesh (skinned) + its loose head ----------------------------
function restFor(b) {
  return {
    hips: [0, 0.98, 0], spine: [0, 0.1, 0], chest: [0, 0.26, 0], head: [0, 0.24, 0],
    shL: [-b.shX, 0.12, 0], elL: [0, -0.29, 0], shR: [b.shX, 0.12, 0], elR: [0, -0.29, 0],
    thL: [-b.hipX, -0.04, 0], knL: [0, -0.44, 0], thR: [b.hipX, -0.04, 0], knR: [0, -0.44, 0],
  };
}
const _c = new THREE.Color();
function buildVariant(type) {
  const bk = type === "crawler" ? "walker" : type === "giant" ? "brute" : BUILDS[type] ? type : "walker";
  const B = BUILDS[bk];
  const O = outfit(type);
  const L = B.limb;
  const parts = [],
    headParts = [];
  function add(geo, bone, hex, blood = O.blood * 0.5) {
    const n = geo.attributes.position.count;
    const col = new Float32Array(n * 3);
    _c.setHex(hex);
    for (let i = 0; i < n; i++) {
      const k = 0.8 + Math.random() * 0.32;
      let r = _c.r * k,
        g = _c.g * k,
        b = _c.b * k;
      if (Math.random() < blood) {
        const m = 0.5 + Math.random() * 0.45;
        r = r * (1 - m) + 0.3 * m;
        g = g * (1 - m) + 0.008 * m;
        b = b * (1 - m) + 0.008 * m;
      }
      col[i * 3] = r;
      col[i * 3 + 1] = g;
      col[i * 3 + 2] = b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    if (bone === "head") headParts.push(geo.clone().translate(0, -HEAD_Y, 0));
    const si = new Uint16Array(n * 4),
      sw = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      si[i * 4] = BI[bone];
      sw[i * 4] = 1;
    }
    geo.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(si, 4));
    geo.setAttribute("skinWeight", new THREE.Float32BufferAttribute(sw, 4));
    parts.push(geo);
  }
  const ell = (sx, sy, sz, x, y, z, seg = 10) => new THREE.SphereGeometry(1, seg, Math.max(6, seg - 2)).scale(sx, sy, sz).translate(x, y, z);
  const cap = (r, len, x, y, z) => new THREE.CapsuleGeometry(r, len, 2, 7).translate(x, y, z);
  const box = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
  const torsoCol = O.sleeves === "none" && type !== "walker" && type !== "runner" ? O.skin : O.shirt;
  // torso
  add(ell(...B.pelvis, 0, 0.96, 0), "hips", O.pants);
  add(ell(B.belly[0], B.belly[1], B.belly[2], 0, 1.15, type === "bloater" ? 0.07 : 0), "spine", type === "bloater" ? O.skin : torsoCol, O.blood);
  add(ell(...B.chest, 0, 1.38, 0), "chest", torsoCol, O.blood);
  if (O.coat) add(new THREE.CylinderGeometry(B.pelvis[0] + 0.02, B.pelvis[0] + 0.07, 0.42, 9, 1, true).translate(0, 0.86, 0), "hips", O.shirt, 0.3);
  if (O.tie) add(box(0.045, 0.22, 0.02, 0, 1.33, B.chest[2] + 0.005), "chest", 0x6a0d0d, 0.1);
  if (type === "bloater")
    for (let i = 0; i < 7; i++) {
      const a = Math.random() * 2.4 - 1.2,
        y = 1.05 + Math.random() * 0.25;
      add(ell(0.045, 0.045, 0.045, Math.sin(a) * 0.3, y, Math.cos(a) * 0.3 + 0.06, 6), "spine", 0xb8d040, 0);
    }
  // neck & head
  add(new THREE.CylinderGeometry(0.052 * L, 0.062 * L, 0.13, 7).translate(0, 1.55, 0), "chest", O.skin);
  const hs = B.head;
  add(ell(0.112 * hs, 0.128 * hs, 0.118 * hs, 0, 1.71, 0.02, 12), "head", O.skin, 0.06);
  add(box(0.12 * hs, 0.055, 0.1 * hs, 0, 1.622, 0.05), "head", O.skin, 0.4);
  add(box(0.075 * hs, 0.024, 0.03, 0, 1.648, 0.1 * hs), "head", 0x1a0404, 0);
  for (const s of [-1, 1]) add(ell(0.027, 0.024, 0.02, s * 0.04 * hs, 1.735, 0.1 * hs, 6), "head", 0x100808, 0);
  add(box(0.026, 0.04, 0.03, 0, 1.7, 0.118 * hs), "head", O.skin, 0.1);
  if (O.hair) add(ell(0.122 * hs, 0.08 * hs, 0.124 * hs, 0, 1.77, 0.0), "head", O.hair, 0.05);
  else add(ell(0.035, 0.02, 0.035, 0.05, 1.8, 0.03, 6), "head", 0x5a0808, 0); // a wound on the bald scalp
  if (O.cap) {
    add(new THREE.CylinderGeometry(0.122 * hs, 0.126 * hs, 0.06, 10).translate(0, 1.81, 0), "head", O.cap, 0);
    add(box(0.19 * hs, 0.012, 0.08, 0, 1.79, 0.11 * hs), "head", O.cap, 0);
  }
  // arms
  for (const s of [-1, 1]) {
    const sx = s * B.shX,
      sh = s < 0 ? "shL" : "shR",
      el = s < 0 ? "elL" : "elR";
    add(cap(0.05 * L, 0.18, sx, 1.315, 0), sh, O.sleeves === "none" ? O.skin : O.shirt);
    add(cap(0.041 * L, 0.19, sx, 1.03, 0), el, O.sleeves === "long" ? O.shirt : O.skin);
    add(box(0.06 * L, 0.11 * L, 0.04 * L, sx, 0.86, 0.005), el, O.skin, 0.3);
  }
  // legs
  for (const s of [-1, 1]) {
    const hx = s * B.hipX,
      th = s < 0 ? "thL" : "thR",
      kn = s < 0 ? "knL" : "knR";
    add(cap(0.074 * L, 0.27, hx, 0.72, 0), th, O.pants);
    if (O.legless) add(ell(0.07 * L, 0.05, 0.07 * L, hx, 0.5, 0, 7), kn, 0x6a0606, 0.6);
    else {
      add(cap(0.058 * L, 0.3, hx, 0.29, 0), kn, O.pants, 0.12);
      add(box(0.1 * L, 0.075, 0.22 * L, hx, 0.038, 0.035), kn, 0x1a1714, 0);
    }
  }
  const geo = mergeGeometries(parts);
  for (const g of parts) g.dispose();
  geo.computeBoundingSphere();
  const headGeo = mergeGeometries(headParts);
  for (const g of headParts) g.dispose();
  // the bone pose at rest → its inverse (shared by every zombie of this build)
  const rest = restFor(B);
  const world = {};
  for (const b of BONES) {
    const [x, y, z] = rest[b];
    const p = PARENT[b] ? world[PARENT[b]] : [0, 0, 0];
    world[b] = [p[0] + x, p[1] + y, p[2] + z];
  }
  const inverses = BONES.map((b) => new THREE.Matrix4().makeTranslation(-world[b][0], -world[b][1], -world[b][2]));
  return { type, build: bk, rest, inverses, geo, headGeo, O };
}

// the eyes: one tiny mesh (two spheres) riding the head bone
const EYE_COL = [new THREE.Color(4.2, 0.9, 0.2), new THREE.Color(3.6, 3.0, 0.5), new THREE.Color(1.2, 4.0, 0.6), new THREE.Color(5, 0.4, 0.1)];

export function setupZombies(Z) {
  const { api, scene } = Z;
  const touch = api.isTouch;
  const R = Z.rnd;
  const Zs = (Z.zombies = { list: [] });
  const list = Zs.list;

  const eyeGeo = mergeGeometries([
    new THREE.SphereGeometry(0.021, 6, 5).translate(-0.04, 0.155, 0.107),
    new THREE.SphereGeometry(0.021, 6, 5).translate(0.04, 0.155, 0.107),
  ]);
  const eyeMats = EYE_COL.map((c) => new THREE.MeshBasicMaterial({ color: c }));
  const deadEyeMat = new THREE.MeshBasicMaterial({ color: 0x220a06 });
  const stumpGeo = new THREE.CylinderGeometry(0.05, 0.056, 0.035, 9);
  const stumpMat = new THREE.MeshStandardMaterial({ color: 0x6a0303, emissive: 0x1a0000, roughness: 0.4 });

  // variants: a few per type, made as needed and kept
  const variants = { walker: [], runner: [], crawler: [], bloater: [], brute: [], giant: [] };
  const VMAX = { walker: touch ? 6 : 10, runner: 3, crawler: 3, bloater: 2, brute: 1, giant: 1 };
  function variantFor(type) {
    const v = variants[type];
    if (v.length < VMAX[type]) {
      const nv = buildVariant(type);
      v.push(nv);
      return nv;
    }
    return v[(Math.random() * v.length) | 0];
  }
  // pre-build a couple so the first wave doesn't stutter
  for (let i = 0; i < 3; i++) variantFor("walker");

  let nextId = 1;
  function makeZombie(type, x, z, rise) {
    const def = TYPES[type];
    const V = variantFor(type);
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, emissive: 0x000000 });
    const mesh = new THREE.SkinnedMesh(V.geo, mat);
    const bones = {};
    const arr = BONES.map((b) => {
      const bone = new THREE.Bone();
      bone.position.set(...V.rest[b]);
      bones[b] = bone;
      return bone;
    });
    for (const b of BONES) if (PARENT[b]) bones[PARENT[b]].add(bones[b]);
    mesh.add(bones.hips);
    mesh.bind(new THREE.Skeleton(arr, V.inverses), new THREE.Matrix4());
    mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1, 0), 2.3);
    mesh.castShadow = !touch;
    mesh.rotation.order = "YXZ";
    const eyes = new THREE.Mesh(eyeGeo, eyeMats[def.eyes]);
    bones.head.add(eyes);
    const stump = new THREE.Mesh(stumpGeo, stumpMat);
    stump.position.set(0, 0.25, 0.005);
    stump.visible = false;
    bones.chest.add(stump);
    const wave = Math.min(Z.director.wave, 5);
    const hp = def.hp * (1 + 0.03 * (wave - 1));
    const zb = {
      id: nextId++,
      type,
      def,
      V,
      mesh,
      mat,
      bones,
      eyes,
      stump,
      scale: R(def.scale[0], def.scale[1]),
      pos: new THREE.Vector3(x, rise ? -1.8 : 0, z),
      yaw: Math.random() * 6.283,
      vel: new THREE.Vector3(),
      walkSpd: R(def.walk[0], def.walk[1]),
      runSpd: R(def.run[0], def.run[1]),
      spd: 0,
      hp,
      maxHp: hp,
      alive: true,
      state: rise ? "rise" : "wander",
      st: 0,
      phase: Math.random() * 6.28,
      armStyle: type === "runner" ? 3 : def.big ? 0 : (Math.random() * 3) | 0,
      limp: Math.random() < 0.4 ? (Math.random() < 0.5 ? -1 : 1) : 0,
      aware: false,
      lastSeen: -99,
      seeT: Math.random() * 0.3,
      attackCD: 0,
      hitDone: false,
      groanT: R(2, 9),
      wanderT: 0,
      wanderYaw: Math.random() * 6.28,
      wanderGo: true,
      burning: 0,
      burnAcc: 0,
      kick: 0,
      kickDir: 1,
      flash: 0,
      fall: 0,
      fallSign: -1,
      deadT: 0,
      spurt: 0,
      avoidSide: 0,
      avoidT: 0,
      killedBy: null,
    };
    mesh.scale.setScalar(zb.scale);
    mesh.position.copy(zb.pos);
    mesh.rotation.y = zb.yaw;
    scene.add(mesh);
    mesh.updateMatrixWorld(true);
    list.push(zb);
    if (rise) {
      Z.fx.dust(_v.set(x, 0.1, z), 6, 0.5);
      Z.fx.scorch(x, z, 1.3);
    }
    return zb;
  }
  function removeZombie(zb) {
    scene.remove(zb.mesh);
    zb.mat.dispose();
    zb.mesh.skeleton.dispose();
    const i = list.indexOf(zb);
    if (i >= 0) list.splice(i, 1);
    zb.removed = true;
  }

  // ---- spawning --------------------------------------------------------------------------
  function pickType() {
    const w = Z.director.wave,
      r = Math.random();
    const run = Math.min(0.3, 0.05 * w);
    if (r < run) return "runner";
    if (r < run + 0.1) return "crawler";
    if (w >= 2 && r > 1 - Math.min(0.12, 0.03 * w)) return "bloater";
    if (w >= 4 && Math.random() < 0.015) return "brute";
    return "walker";
  }
  const _v = new THREE.Vector3(),
    _v2 = new THREE.Vector3(),
    _v3 = new THREE.Vector3();
  function spawnSpot(dMin, dMax, behind = true, margin = 0.8) {
    const p = Z.ppos(),
      cam = Z.camera;
    const fx = -Math.sin(api.yaw),
      fz = -Math.cos(api.yaw);
    const drv = !Z.onFoot() && api.drv;
    for (let tries = 0; tries < 16; tries++) {
      let a = Math.random() * 6.283,
        d = R(dMin, dMax);
      // 🏁 racing: most of them wait on the road ahead of the car
      if (drv && Math.random() < 0.75) {
        a = Math.atan2(Math.cos(drv.yaw), Math.sin(drv.yaw)) + R(-0.55, 0.55);
        d = R(dMin + 25, dMax + 55);
      }
      let x = p.x + Math.cos(a) * d,
        z = p.z + Math.sin(a) * d;
      // most of them come down the streets
      if (Math.random() < 0.7) {
        if (Math.random() < 0.5) x = Math.round(x / api.TILE) * api.TILE + R(-3, 3);
        else z = Math.round(z / api.TILE) * api.TILE + R(-3, 3);
      }
      if (!Z.freeSpot(x, z, margin)) continue;
      // not popping up right in front of her eyes, close by
      const dx = x - cam.position.x,
        dz = z - cam.position.z,
        dd = Math.hypot(dx, dz);
      if (behind && dd < 45 && (dx * fx + dz * fz) / dd > 0.5 && tries < 12) continue;
      return [x, z];
    }
    return null;
  }
  Zs.spawn = (type = pickType(), dMin = 36, dMax = 72) => {
    const s = spawnSpot(dMin, dMax);
    if (!s) return null;
    return makeZombie(type, s[0], s[1], Math.random() < 0.55);
  };
  function spawnHorde() {
    const s = spawnSpot(45, 75);
    if (!s) return;
    const n = touch ? 3 : 4 + ((Math.random() * 3) | 0);
    for (let i = 0; i < n; i++) {
      const x = s[0] + R(-3, 3),
        z = s[1] + R(-3, 3);
      if (Z.freeSpot(x, z, 0.6)) makeZombie(Math.random() < 0.8 ? "walker" : "runner", x, z, false);
    }
  }
  Zs.spawnBoss = () => {
    const s = spawnSpot(40, 60, false);
    if (!s) return;
    const zb = makeZombie("brute", s[0], s[1], true);
    alert(zb, true);
    Z.hud.warn("☠ A BRUTE IS COMING", 3.5);
  };
  // 🦖 a giant, far off down a street (they're seen from a long way)
  Zs.spawnGiant = (x, z) => {
    if (x === undefined) {
      const s = spawnSpot(85, 140, false, 2.6);
      if (!s) return null;
      [x, z] = s;
    }
    const zb = makeZombie("giant", x, z, false);
    Z.sfx.voice(headPos(zb, _v), "roar", 0.4);
    return zb;
  };
  function stomp(zb, dP, side) {
    const k = 1 - dP / 120;
    const fx = zb.pos.x + Math.cos(zb.yaw) * 0.14 * zb.scale * side,
      fz = zb.pos.z - Math.sin(zb.yaw) * 0.14 * zb.scale * side;
    Z.fx.dust(_v.set(fx, 0.15, fz), 3, 1.3);
    if (k > 0.25) Z.fx.shake(0.32 * k * k);
    Z.sfx.stomp(zb.pos, 0.35 + 0.65 * k);
  }
  function giantLands(zb, dP) {
    const k = Math.max(0, 1 - dP / 140);
    Z.fx.shake(0.95 * k);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * 6.283;
      Z.fx.dust(_v.set(zb.pos.x + Math.cos(a) * 3.5, 0.2, zb.pos.z + Math.sin(a) * 3.5), 2, 1.8);
    }
    Z.fx.bloodPool(zb.pos.x + Math.sin(zb.yaw) * zb.fallSign * 3, zb.pos.z + Math.cos(zb.yaw) * zb.fallSign * 3, 6, 0);
    Z.sfx.stomp(zb.pos, 2.2);
    Z.sfx.explosion(zb.pos, 0.35);
  }
  Zs.clearAround = (p, r) => {
    for (const zb of [...list]) if (zb.pos.distanceTo(p) < r) removeZombie(zb);
  };

  // ---- waking up ----------------------------------------------------------------------------
  function headPos(zb, out) {
    return out.set(0, 0.13, 0.02).applyMatrix4(zb.bones.head.matrixWorld);
  }
  function chestPos(zb, out) {
    return out.set(0, 0.06, 0).applyMatrix4(zb.bones.chest.matrixWorld);
  }
  function alert(zb, scream) {
    if (!zb.alive) return;
    const was = zb.aware;
    zb.aware = true;
    zb.lastSeen = Z.t;
    if (was || zb.state === "rise") return;
    if (scream && (zb.type !== "walker" || Math.random() < 0.55)) {
      zb.state = "scream";
      zb.st = 0;
      Z.sfx.voice(headPos(zb, _v), zb.def.big ? "roar" : "scream", zb.type === "runner" ? 1.15 : zb.def.giant ? 0.45 : 1);
      // the ones around it hear the scream
      for (const o of list)
        if (o !== zb && o.alive && !o.aware && o.pos.distanceToSquared(zb.pos) < 144) {
          o.aware = true;
          o.lastSeen = Z.t;
          if (o.state !== "rise") {
            o.state = "chase";
            o.st = 0;
          }
        }
    } else if (zb.state !== "attack") {
      zb.state = "chase";
      zb.st = 0;
    }
  }
  Zs.noise = (p, radius) => {
    const r2 = radius * radius;
    for (const zb of list)
      if (zb.alive && !zb.aware && zb.pos.distanceToSquared(p) < r2) alert(zb, Math.random() < 0.25);
  };
  const _pc = new THREE.Vector3();
  function perceive(zb) {
    const p = Z.ppos();
    const dx = p.x - zb.pos.x,
      dz = p.z - zb.pos.z,
      d = Math.hypot(dx, dz);
    if (Z.player.dead) {
      zb.aware = false;
      return;
    }
    if (!zb.aware) {
      let sees = false;
      if (d < 5.5 && Math.abs(p.y - zb.pos.y) < 4) sees = true;
      else if (!Z.onFoot() && d < 22) sees = true; // an engine is loud
      else if (d < zb.def.sight) {
        const cosA = (dx * Math.sin(zb.yaw) + dz * Math.cos(zb.yaw)) / (d || 1);
        if (cosA > 0.2 || d < 12) sees = Z.los(headPos(zb, _v), Z.pchest(_pc));
      }
      if (sees) alert(zb, true);
    } else {
      if (d < 7 || (d < zb.def.sight * 1.4 && Z.los(headPos(zb, _v), Z.pchest(_pc)))) zb.lastSeen = Z.t;
      if (Z.t - zb.lastSeen > 12 && d > 45) {
        zb.aware = false;
        zb.state = "wander";
      }
    }
  }

  // ---- hurting them -------------------------------------------------------------------------
  const ZERO = new THREE.Vector3();
  Zs.damage = (zb, dmg, o = {}) => {
    if (!zb.alive) return false;
    const dir = o.dir || ZERO;
    const point = o.point || chestPos(zb, _v3);
    const head = o.part === "head";
    zb.hp -= dmg;
    zb.flash = 0.09;
    if (!zb.aware) alert(zb, false);
    zb.lastSeen = Z.t;
    if (!o.fire) {
      Z.fx.blood(point, dir, head ? 16 : 10, head ? 5.5 : 3.6, zb.pos.y);
      Z.sfx.flesh(point, head);
      // it lands on the street behind them
      if (Math.random() < 0.6)
        Z.fx.bloodPool(point.x + dir.x * R(0.4, 1.4), point.z + dir.z * R(0.4, 1.4), R(0.45, 1.0), Math.max(0, zb.pos.y));
      if (head && zb.hp <= 0) Z.fx.gore(point, 5, 3.5, zb.pos.y);
    }
    // the hit rocks them back
    const fwdDot = dir.x * Math.sin(zb.yaw) + dir.z * Math.cos(zb.yaw);
    zb.kickDir = fwdDot < 0 ? 1 : -1;
    zb.kick = Math.min(1.2, zb.kick + Math.min(1, dmg / 55) * (zb.def.giant ? 0.12 : zb.def.big ? 0.3 : 1));
    if (o.knock) {
      const k = o.knock * (zb.def.giant ? 0.03 : zb.def.big ? 0.15 : 1);
      zb.vel.x += dir.x * k;
      zb.vel.z += dir.z * k;
    }
    if (dmg >= 45 && !zb.def.big && zb.hp > 0 && zb.state !== "attack" && zb.state !== "rise") {
      zb.state = "stagger";
      zb.st = 0;
    }
    if (zb.hp > 0) return true;
    // ☠
    const how = { head, decap: false, gib: false, car: !!o.car, fire: !!o.fire };
    const overkill = -zb.hp;
    if ((o.gib && !zb.def.giant) || (o.blast && overkill > 90 && !zb.def.big)) {
      how.gib = true;
      gib(zb, dir, o.blast ? 9 : o.gibPower || 6);
    } else if (!o.fire && (head ? dmg >= 70 || Math.random() < (o.decap ?? 0.4) : Math.random() < (o.decapBody ?? 0))) {
      how.decap = true;
      how.head = true;
      decapitate(zb, dir, dmg);
    } else if (o.launch) {
      die(zb, dir, o);
      zb.state = "launched";
      zb.vel.set(o.launch.x, o.launch.y, o.launch.z);
      zb.spin = R(5, 11) * (Math.random() < 0.5 ? -1 : 1);
      // 🪓 the bumper takes the head clean off: it sails over the roof
      if (o.popHead) {
        popHead(zb, dir, 600, 1.5);
        how.decap = how.head = true;
      }
    } else die(zb, dir, o);
    if (o.fire) {
      zb.mat.color.setRGB(0.25, 0.22, 0.2);
      zb.burning = Math.max(zb.burning, 2);
    }
    if (!o.noScore) Z.onKill(zb, how);
    Z.pickups.drop(zb.pos, zb.type);
    if (zb.type === "bloater") burst(zb);
    return true;
  };
  function die(zb, dir, o) {
    zb.alive = false;
    zb.state = "dying";
    zb.st = 0;
    zb.deadT = 0;
    const fwdDot = dir.x * Math.sin(zb.yaw) + dir.z * Math.cos(zb.yaw);
    zb.fallSign = fwdDot < -0.1 ? -1 : fwdDot > 0.1 ? 1 : Math.random() < 0.5 ? -1 : 1;
    zb.eyes.material = deadEyeMat;
    if (Math.random() < 0.5 || zb.def.giant) Z.sfx.voice(headPos(zb, _v), "die", zb.def.giant ? 0.4 : zb.type === "brute" ? 0.6 : 1);
    Z.fx.bloodPool(zb.pos.x + Math.sin(zb.yaw) * zb.fallSign * 0.9, zb.pos.z + Math.cos(zb.yaw) * zb.fallSign * 0.9, 2 + Math.random() * 1.4, Math.max(0, zb.pos.y));
    zb.spurt = Math.max(zb.spurt, 0.8); // the wound keeps pouring a moment
  }

  // 🪓 off with the head: it flies, the neck pumps blood, the body stumbles on
  const debris = [];
  const _q = new THREE.Quaternion();
  function popHead(zb, dir, dmg, up = 1) {
    zb.mesh.updateMatrixWorld(true);
    const hp = zb.bones.head.getWorldPosition(new THREE.Vector3());
    zb.bones.head.getWorldQuaternion(_q);
    zb.bones.head.scale.setScalar(0.0001);
    zb.stump.visible = true;
    const head = new THREE.Mesh(zb.V.headGeo, zb.mat);
    head.scale.setScalar(zb.scale);
    head.position.copy(hp);
    head.quaternion.copy(_q);
    head.castShadow = !touch;
    const e = new THREE.Mesh(eyeGeo, eyeMats[zb.def.eyes]);
    head.add(e);
    scene.add(head);
    const sp = 3 + Math.min(9, dmg * 0.025);
    addDebris(head, hp, _v.set(dir.x * sp + R(-1, 1), R(3.5, 6.5) * up, dir.z * sp + R(-1, 1)), 0.14 * zb.scale, e);
    zb.spurt = 2.2;
    zb.eyes.visible = false;
    Z.fx.blood(hp, _v.set(dir.x, 0.6, dir.z), 26, 5.5, zb.pos.y);
    Z.sfx.gore(hp);
    return hp;
  }
  function decapitate(zb, dir, dmg) {
    const hp = popHead(zb, dir, dmg);
    zb.alive = false;
    zb.state = "headless";
    zb.st = 0;
    zb.headlessFor = R(0.6, 1.3);
    zb.fallSign = Math.random() < 0.7 ? 1 : -1;
    if (Z.camera.position.distanceTo(hp) < 30) Z.slowmo(0.45, 0.35);
  }
  // 💥 burst apart
  const GIB_GEO = [
    new THREE.CapsuleGeometry(0.06, 0.3, 2, 6),
    new THREE.CapsuleGeometry(0.075, 0.32, 2, 6),
    new THREE.SphereGeometry(0.16, 8, 6).scale(1.2, 0.9, 0.8),
  ];
  const gibMats = new Map();
  function gibMat(hex) {
    if (!gibMats.has(hex)) gibMats.set(hex, new THREE.MeshStandardMaterial({ color: hex, roughness: 0.85 }));
    return gibMats.get(hex);
  }
  function gib(zb, dir, power) {
    zb.mesh.updateMatrixWorld(true);
    const c = chestPos(zb, new THREE.Vector3());
    const O = zb.V.O;
    const pieces = [
      [GIB_GEO[0], O.sleeves === "none" ? O.skin : O.shirt],
      [GIB_GEO[0], O.skin],
      [GIB_GEO[1], O.pants],
      [GIB_GEO[1], O.pants],
      [GIB_GEO[2], 0x5a0a0a],
      [GIB_GEO[2], O.shirt],
    ];
    for (const [g, col] of pieces) {
      const m = new THREE.Mesh(g, gibMat(col));
      m.scale.setScalar(zb.scale);
      m.castShadow = !touch;
      scene.add(m);
      addDebris(m, c, _v.set(dir.x * power * 0.6 + R(-1, 1) * power * 0.5, R(0.5, 1.2) * power, dir.z * power * 0.6 + R(-1, 1) * power * 0.5), 0.1);
    }
    const head = new THREE.Mesh(zb.V.headGeo, zb.mat.clone());
    head.scale.setScalar(zb.scale);
    head.position.copy(c);
    scene.add(head);
    addDebris(head, c, _v.set(dir.x * power + R(-2, 2), R(4, 8), dir.z * power + R(-2, 2)), 0.14);
    Z.fx.gore(c, 14, 7, zb.pos.y);
    Z.fx.bloodPool(zb.pos.x, zb.pos.z, 2.6, Math.max(0, zb.pos.y));
    Z.sfx.gore(c);
    zb.alive = false;
    removeZombie(zb);
  }
  function addDebris(m, p, v, r, eyes = null) {
    m.position.copy(p);
    debris.push({ m, vel: v.clone(), ang: new THREE.Vector3(R(-12, 12), R(-8, 8), R(-12, 12)), r, age: 0, landed: false, rest: false, eyes, trail: 0 });
    while (debris.length > (touch ? 10 : 24)) {
      const d = debris.shift();
      scene.remove(d.m);
    }
  }
  function updateDebris(dt) {
    const p = Z.ppos();
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i],
        m = d.m;
      d.age += dt;
      if (d.eyes && d.age > 1.5) d.eyes.material = deadEyeMat;
      if (d.age > 14) {
        m.position.y -= dt * 0.25;
        if (d.age > 17) {
          scene.remove(m);
          debris.splice(i, 1);
        }
        continue;
      }
      // ⚽ a head on the street gets kicked when she runs into it
      if (d.rest && Z.onFoot()) {
        const dx = m.position.x - p.x,
          dz = m.position.z - p.z,
          dd = Math.hypot(dx, dz);
        if (dd < 0.6 && Math.abs(m.position.y - p.y) < 0.8) {
          const sp = Math.max(4, Math.hypot(api.vel.x, api.vel.z) * 1.2);
          d.vel.set((dx / (dd || 1)) * sp, 3, (dz / (dd || 1)) * sp);
          d.rest = false;
          d.ang.set(R(-10, 10), R(-5, 5), R(-10, 10));
        }
      }
      if (d.rest) continue;
      d.vel.y -= 18 * dt;
      m.position.addScaledVector(d.vel, dt);
      m.rotation.x += d.ang.x * dt;
      m.rotation.y += d.ang.y * dt;
      m.rotation.z += d.ang.z * dt;
      if (Z.solidAt(m.position.x, m.position.y, m.position.z) && m.position.y > 0.3) {
        m.position.x -= d.vel.x * dt * 1.5;
        m.position.z -= d.vel.z * dt * 1.5;
        d.vel.x *= -0.4;
        d.vel.z *= -0.4;
      }
      const floor = Z.groundAt(m.position.x, m.position.z, m.position.y + 0.3) + d.r;
      if (!d.landed) {
        d.trail -= dt;
        if (d.trail <= 0) {
          d.trail = 0.04;
          Z.fx.blood(m.position, null, 1, 0.6, floor - d.r);
        }
      }
      if (m.position.y < floor) {
        m.position.y = floor;
        if (!d.landed) {
          d.landed = true;
          Z.fx.bloodPool(m.position.x, m.position.z, 0.9, floor - d.r);
        }
        d.vel.y *= -0.32;
        d.vel.x *= 0.62;
        d.vel.z *= 0.62;
        d.ang.multiplyScalar(0.55);
        if (Math.abs(d.vel.y) < 0.6 && Math.hypot(d.vel.x, d.vel.z) < 0.4) d.rest = true;
      }
    }
  }

  // 🤢 the bloater bursts: a cloud of rot that eats everything around it
  function burst(zb) {
    const c = chestPos(zb, new THREE.Vector3());
    Z.fx.toxic(c, touch ? 24 : 46, 5);
    Z.fx.gore(c, 10, 6, zb.pos.y);
    Z.fx.light(c, 0x88ff44, 18, 0.5, 18);
    Z.sfx.gore(c);
    Z.sfx.explosion(c, 0.45);
    Z.fx.shake(0.25);
    for (const o of list)
      if (o !== zb && o.alive) {
        const d = o.pos.distanceTo(zb.pos);
        if (d < 4.5) Zs.damage(o, 70 * (1 - d / 5), { dir: _v2.subVectors(o.pos, zb.pos).normalize(), knock: 5 });
      }
    const pc = Z.pchest(_pc);
    const d = pc.distanceTo(c);
    if (d < 4.2) Z.hurt(32 * (1 - d / 4.5), c, "toxic");
    if (zb.alive) {
      zb.alive = false;
    }
    if (!zb.removed) removeZombie(zb);
  }

  Zs.ignite = (zb) => {
    if (!zb.alive) return;
    zb.burning = 5;
    if (!zb.aware) alert(zb, false);
  };

  // ---- explosions, melee, bullets -----------------------------------------------------------------
  Zs.blast = (p, r, dmg, src) => {
    for (const zb of [...list]) {
      if (!zb.alive) continue;
      const c = chestPos(zb, _v3);
      const d = c.distanceTo(p);
      if (d > r) continue;
      const k = Math.max(0.15, 1 - d / r);
      const dir = _v2.subVectors(zb.pos, p).setY(0).normalize();
      Zs.damage(zb, dmg * k, {
        dir,
        part: "body",
        point: c,
        knock: 9 * k,
        blast: true,
        noScore: src === "enemy",
        launch: new THREE.Vector3(dir.x * 9 * k, 5 + 7 * k, dir.z * 9 * k),
      });
    }
  };
  // a swing: everything in an arc in front of her
  Zs.melee = (o, fx, fz, range, cosArc, dmg, opts) => {
    let hits = 0;
    for (const zb of [...list]) {
      if (!zb.alive) continue;
      const dx = zb.pos.x - o.x,
        dz = zb.pos.z - o.z,
        d = Math.hypot(dx, dz);
      if (d > range + 0.3 * zb.scale || Math.abs(zb.pos.y - o.y) > 2.2) continue;
      if (d > 0.7 && (dx * fx + dz * fz) / d < cosArc) continue;
      const head = Math.random() < opts.headChance;
      const point = head ? headPos(zb, _v3) : chestPos(zb, _v3);
      Zs.damage(zb, dmg * R(0.9, 1.25), { dir: _v2.set(dx / (d || 1), 0.15, dz / (d || 1)), part: head ? "head" : "body", point: point.clone(), decap: opts.decap, decapBody: opts.decapBody, knock: opts.knock, gib: opts.gib && Math.random() < opts.gib });
      hits++;
    }
    return hits;
  };
  // the first zombie a ray hits: which, where, and in what part
  function raySphere(o, d, c, r) {
    const ox = o.x - c.x,
      oy = o.y - c.y,
      oz = o.z - c.z;
    const b = ox * d.x + oy * d.y + oz * d.z;
    const cc = ox * ox + oy * oy + oz * oz - r * r;
    const disc = b * b - cc;
    if (disc < 0) return -1;
    const s = Math.sqrt(disc);
    if (-b - s >= 0) return -b - s;
    return -b + s >= 0 ? 0 : -1;
  }
  function rayCapsule(o, d, a, b, r) {
    const ux = b.x - a.x,
      uy = b.y - a.y,
      uz = b.z - a.z;
    const wx = o.x - a.x,
      wy = o.y - a.y,
      wz = o.z - a.z;
    const B = d.x * ux + d.y * uy + d.z * uz,
      C = ux * ux + uy * uy + uz * uz,
      D = d.x * wx + d.y * wy + d.z * wz,
      E = ux * wx + uy * wy + uz * wz;
    const den = C - B * B;
    let tc = den > 1e-6 ? (E - B * D) / den : E / C;
    tc = Math.max(0, Math.min(1, tc));
    const px = a.x + ux * tc,
      py = a.y + uy * tc,
      pz = a.z + uz * tc;
    const sc = Math.max(0, (px - o.x) * d.x + (py - o.y) * d.y + (pz - o.z) * d.z);
    const qx = o.x + d.x * sc - px,
      qy = o.y + d.y * sc - py,
      qz = o.z + d.z * sc - pz;
    const dist2 = qx * qx + qy * qy + qz * qz;
    if (dist2 > r * r) return -1;
    return Math.max(0, sc - Math.sqrt(r * r - dist2));
  }
  const _hA = new THREE.Vector3(),
    _hB = new THREE.Vector3(),
    _hC = new THREE.Vector3(),
    _hH = new THREE.Vector3(),
    _hF = new THREE.Vector3();
  const hit = { zb: null, t: 0, part: "body", point: new THREE.Vector3() };
  Zs.hitTest = (o, d, maxT, skip = null) => {
    hit.zb = null;
    let best = maxT;
    for (const zb of list) {
      if (!zb.alive || (skip && skip.has(zb))) continue;
      const s = zb.scale;
      const low = zb.type === "crawler" ? 0.4 : 0.95;
      _hC.set(zb.pos.x, zb.pos.y + low * s, zb.pos.z);
      const tc = raySphere(o, d, _hC, 1.3 * s);
      if (tc < 0 || tc > best) continue;
      headPos(zb, _hH);
      _hA.setFromMatrixPosition(zb.bones.hips.matrixWorld);
      _hB.set(0, 0.2, 0).applyMatrix4(zb.bones.chest.matrixWorld);
      _hF.set(0, -0.4, 0).applyMatrix4(zb.bones.knL.matrixWorld);
      _hF.lerp(_v.set(0, -0.4, 0).applyMatrix4(zb.bones.knR.matrixWorld), 0.5);
      let t = raySphere(o, d, _hH, 0.155 * s),
        part = "head";
      const tb = rayCapsule(o, d, _hA, _hB, 0.25 * s);
      if (tb >= 0 && (t < 0 || tb < t - 0.05)) {
        t = tb;
        part = "body";
      }
      const tl = rayCapsule(o, d, _hF, _hA, 0.17 * s);
      if (tl >= 0 && (t < 0 || tl < t - 0.05)) {
        t = tl;
        part = "legs";
      }
      if (t >= 0 && t < best) {
        best = t;
        hit.zb = zb;
        hit.t = t;
        hit.part = part;
      }
    }
    if (hit.zb) hit.point.copy(o).addScaledVector(d, hit.t);
    return hit.zb ? hit : null;
  };
  // the nearest zombie to the crosshair (for aim assist on phones)
  Zs.assist = (o, d, maxD, cosMin) => {
    let best = null,
      bc = cosMin;
    for (const zb of list) {
      if (!zb.alive) continue;
      headPos(zb, _hH);
      _hH.y -= 0.18 * zb.scale;
      const dx = _hH.x - o.x,
        dy = _hH.y - o.y,
        dz = _hH.z - o.z,
        l = Math.hypot(dx, dy, dz);
      if (l > maxD) continue;
      const c = (dx * d.x + dy * d.y + dz * d.z) / l;
      if (c > bc && Z.los(o, _hH)) {
        bc = c;
        best = { zb, point: _hH.clone() };
      }
    }
    return best;
  };

  // ---- poses ----------------------------------------------------------------------------------
  const lerp = THREE.MathUtils.lerp;
  function resetPose(B) {
    for (const k of BONES) B[k].rotation.set(0, 0, 0);
  }
  function legs(B, ph, a, zb, kneeK = 0.9) {
    const la = zb.limp < 0 ? 0.6 : 1,
      ra = zb.limp > 0 ? 0.6 : 1;
    B.thL.rotation.x = -Math.sin(ph) * 0.5 * a * la;
    B.thR.rotation.x = Math.sin(ph) * 0.5 * a * ra;
    B.knL.rotation.x = (Math.max(0, Math.cos(ph)) * kneeK + 0.1) * a;
    B.knR.rotation.x = (Math.max(0, -Math.cos(ph)) * kneeK + 0.1) * a;
  }
  function arms(B, zb, ph, a, t) {
    const s = zb.armStyle,
      j = zb.id;
    if (s === 0 || s === 1) {
      B.shL.rotation.set(-1.3 + Math.sin(ph + j) * 0.1 + Math.sin(t * 3 + j) * 0.05, 0, -0.12);
      B.elL.rotation.x = -0.25;
      if (s === 0) {
        B.shR.rotation.set(-1.22 - Math.sin(ph) * 0.1, 0, 0.12);
        B.elR.rotation.x = -0.3;
      } else {
        B.shR.rotation.set(Math.sin(ph) * 0.25 * a + 0.05, 0, 0.14);
        B.elR.rotation.x = -0.1;
      }
    } else if (s === 2) {
      B.shL.rotation.set(Math.sin(ph) * 0.3 * a, 0, -0.12);
      B.shR.rotation.set(-Math.sin(ph) * 0.3 * a, 0, 0.12);
      B.elL.rotation.x = B.elR.rotation.x = -0.15;
    } else {
      // a runner's wild pumping arms
      B.shL.rotation.set(Math.sin(ph) * 1.0 * a - 0.5, 0, -0.2);
      B.shR.rotation.set(-Math.sin(ph) * 1.0 * a - 0.5, 0, 0.2);
      B.elL.rotation.x = B.elR.rotation.x = -1.1;
    }
  }
  function pose(zb, dt, t) {
    const B = zb.bones;
    resetPose(B);
    B.hips.position.y = 0.98;
    const j = zb.id;
    const S = zb.state;
    const a = Math.min(1, zb.spd / 1.4);
    if (zb.type === "crawler" && S !== "dying" && S !== "dead" && S !== "launched" && S !== "headless") {
      // dragging itself along on its hands
      const ph = zb.phase;
      B.hips.position.y = 0.32;
      B.hips.rotation.x = 1.35;
      B.thL.rotation.x = 0.15 + Math.sin(ph) * 0.12;
      B.thR.rotation.x = 0.15 - Math.sin(ph) * 0.12;
      B.head.rotation.x = -1.1 + Math.sin(t * 2 + j) * 0.15;
      B.head.rotation.z = Math.sin(t * 1.3 + j) * 0.2;
      const reach = S === "attack" ? 0.6 : 0.5;
      B.shL.rotation.set(-1.6 - Math.sin(ph) * reach, 0, -0.25);
      B.shR.rotation.set(-1.6 + Math.sin(ph) * reach, 0, 0.25);
      B.elL.rotation.x = -0.3 - Math.max(0, Math.cos(ph)) * 0.6;
      B.elR.rotation.x = -0.3 - Math.max(0, -Math.cos(ph)) * 0.6;
      if (S === "attack") B.head.rotation.x += Math.sin(zb.st * 16) * 0.25;
      return;
    }
    switch (S) {
      case "rise": {
        const u = Math.min(1, zb.st / 1.6);
        B.shL.rotation.set(-2.7 + Math.sin(t * 7 + j) * 0.25, 0, -0.2);
        B.shR.rotation.set(-2.6 + Math.cos(t * 6 + j) * 0.25, 0, 0.2);
        B.spine.rotation.x = 0.4 * (1 - u);
        B.head.rotation.x = -0.4 * (1 - u) + 0.2;
        B.thL.rotation.x = -0.7 * (1 - u);
        B.thR.rotation.x = -0.5 * (1 - u);
        B.knL.rotation.x = 1.2 * (1 - u);
        B.knR.rotation.x = 1.0 * (1 - u);
        break;
      }
      case "scream": {
        const u = Math.min(1, zb.st / 0.25);
        B.head.rotation.x = -0.75 * u + Math.sin(t * 40) * 0.04;
        B.spine.rotation.x = -0.25 * u;
        B.chest.rotation.x = -0.1 * u;
        B.shL.rotation.set(-0.5, 0, -1.15 * u);
        B.shR.rotation.set(-0.5, 0, 1.15 * u);
        B.elL.rotation.x = B.elR.rotation.x = -0.7;
        B.thL.rotation.x = -0.2;
        B.thR.rotation.x = 0.2;
        B.knL.rotation.x = B.knR.rotation.x = 0.25;
        break;
      }
      case "attack": {
        const st = zb.st;
        const u1 = Math.min(1, st / 0.3),
          u2 = Math.min(1, Math.max(0, (st - 0.3) / 0.13));
        const up = lerp(-1.3, -2.7, u1),
          sh = lerp(up, -0.6, u2);
        B.shL.rotation.set(sh, 0, -0.15);
        B.shR.rotation.set(sh + 0.1, 0, 0.15);
        B.elL.rotation.x = B.elR.rotation.x = lerp(-0.6, -0.15, u2);
        B.spine.rotation.x = lerp(lerp(0.2, -0.15, u1), 0.55, u2);
        B.head.rotation.x = lerp(0.1, 0.45, u2);
        B.thL.rotation.x = -0.25;
        B.thR.rotation.x = 0.3;
        B.knL.rotation.x = 0.35;
        B.knR.rotation.x = 0.2;
        break;
      }
      case "headless": {
        // no head and still standing: arms flailing, staggering
        B.shL.rotation.set(-1.8 + Math.sin(t * 13 + j) * 0.9, 0, -0.4 + Math.sin(t * 9) * 0.3);
        B.shR.rotation.set(-1.6 + Math.cos(t * 12 + j) * 0.9, 0, 0.4 + Math.cos(t * 8) * 0.3);
        B.elL.rotation.x = -0.4;
        B.elR.rotation.x = -0.6;
        B.spine.rotation.x = Math.sin(t * 5) * 0.2;
        B.spine.rotation.z = Math.sin(t * 7 + j) * 0.25;
        const knee = Math.min(1, zb.st / zb.headlessFor);
        B.knL.rotation.x = B.knR.rotation.x = knee * 0.7;
        B.thL.rotation.x = B.thR.rotation.x = -knee * 0.35;
        B.hips.position.y = 0.98 - knee * 0.12;
        break;
      }
      case "dying":
      case "dead":
      case "launched": {
        const u = S === "dying" ? Math.min(1, zb.st / (zb.def.giant ? 1.6 : 0.65)) : 1;
        const back = zb.fallSign < 0;
        B.knL.rotation.x = 0.9 * Math.sin(Math.PI * Math.min(1, u * 1.3)) + (S === "dead" ? 0.15 : 0);
        B.knR.rotation.x = 0.6 * Math.sin(Math.PI * u) + (S === "dead" ? 0.3 : 0);
        B.thL.rotation.x = -0.3 * Math.sin(Math.PI * u);
        B.shL.rotation.set(back ? lerp(-0.5, -2.8, u) : lerp(-1, -0.2, u), 0, -0.3 - 0.5 * u);
        B.shR.rotation.set(back ? lerp(-0.5, -2.4, u) : lerp(-1, 0.1, u), 0, 0.3 + 0.7 * u);
        B.elL.rotation.x = -0.3;
        B.elR.rotation.x = -0.8;
        B.head.rotation.z = 0.5 * u * (j % 2 ? 1 : -1);
        B.head.rotation.x = back ? -0.3 * u : 0.2 * u;
        if (S === "launched") {
          B.shL.rotation.x = -2 + Math.sin(t * 15) * 1;
          B.shR.rotation.x = -1.5 + Math.cos(t * 14) * 1;
          B.thL.rotation.x = Math.sin(t * 12) * 0.8;
          B.thR.rotation.x = -Math.sin(t * 12) * 0.8;
        }
        break;
      }
      default: {
        // walking / chasing / wandering / staggering
        const ph = zb.phase;
        const run = zb.type === "runner" && S === "chase" ? 1 : zb.state === "chase" ? 0.35 : 0;
        legs(B, ph, Math.max(a, 0.12), zb, lerp(0.9, 1.45, run));
        if (run > 0.5) {
          B.thL.rotation.x *= 1.7;
          B.thR.rotation.x *= 1.7;
        }
        B.hips.position.y = 0.98 + (Math.abs(Math.cos(ph)) - 0.6) * 0.06 * a;
        B.hips.rotation.y = Math.sin(ph) * 0.12 * a;
        B.hips.rotation.z = Math.cos(ph) * 0.05 * a;
        B.spine.rotation.x = 0.18 + run * 0.32 + (zb.def.big ? 0.12 : 0);
        B.spine.rotation.z = Math.sin(ph) * 0.09 * a + (zb.limp ? zb.limp * 0.06 : 0);
        B.spine.rotation.y = -Math.sin(ph) * 0.1 * a;
        B.chest.rotation.x = 0.06;
        const look = zb.aware ? 0 : 1;
        B.head.rotation.x = 0.18 + Math.sin(t * 1.7 + j) * 0.12 - run * 0.25;
        B.head.rotation.z = Math.sin(t * 1.1 + j * 2) * 0.25 * (0.4 + 0.6 * look);
        B.head.rotation.y = Math.sin(t * 0.6 + j) * 0.35 * look;
        // a sudden twitch now and then
        if (Math.sin(t * 2.3 + j * 7) > 0.985) B.head.rotation.z += 0.6;
        arms(B, zb, ph, a, t);
        if (zb.def.big) {
          B.shL.rotation.set(Math.sin(ph) * 0.4 * a - 0.15, 0, -0.35);
          B.shR.rotation.set(-Math.sin(ph) * 0.4 * a - 0.15, 0, 0.35);
          B.elL.rotation.x = B.elR.rotation.x = -0.5;
        }
        if (S === "stagger") {
          B.spine.rotation.x -= 0.4 * zb.kickDir;
          B.shL.rotation.x += 0.6;
          B.shR.rotation.x += 0.5;
        }
      }
    }
    // burning: they thrash
    if (zb.burning > 0 && zb.alive) {
      B.shL.rotation.x = -2 + Math.sin(t * 14 + j) * 0.8;
      B.shR.rotation.x = -2 + Math.cos(t * 13 + j) * 0.8;
      B.head.rotation.z += Math.sin(t * 17) * 0.3;
    }
    // the hit rocks the body back (a spring)
    if (zb.kick > 0.01 && zb.alive) {
      B.spine.rotation.x -= zb.kick * 0.45 * zb.kickDir;
      B.head.rotation.x -= zb.kick * 0.35 * zb.kickDir;
      B.shL.rotation.x += zb.kick * 0.4;
      B.shR.rotation.x += zb.kick * 0.4;
    }
  }

  // ---- per frame ----------------------------------------------------------------------------------
  let spawnT = 1.5,
    hordeT = 30,
    giantT = 4,
    frame = 0;
  const _d = new THREE.Vector3(),
    _cp = new THREE.Vector3(),
    _car = new THREE.Vector3(),
    _carPrev = new THREE.Vector3();
  let carPrevOk = false;
  function steer(zb, tx, tz, spd, dt) {
    let ux = tx - zb.pos.x,
      uz = tz - zb.pos.z;
    const l = Math.hypot(ux, uz) || 1;
    ux /= l;
    uz /= l;
    // a tower in the way: go round it (keep to the side picked)
    const ahead = 1.5 + spd * 0.35;
    if (Z.solidAt(zb.pos.x + ux * ahead, 1, zb.pos.z + uz * ahead)) {
      if (Z.t > zb.avoidT) {
        const test = (s) => {
          const a = s * 1.1,
            cx = ux * Math.cos(a) - uz * Math.sin(a),
            cz = ux * Math.sin(a) + uz * Math.cos(a);
          return !Z.solidAt(zb.pos.x + cx * ahead, 1, zb.pos.z + cz * ahead);
        };
        zb.avoidSide = test(1) ? 1 : test(-1) ? -1 : zb.id % 2 ? 1 : -1;
        zb.avoidT = Z.t + 1.2;
      }
      const a = zb.avoidSide * 1.2,
        cx = ux * Math.cos(a) - uz * Math.sin(a),
        cz = ux * Math.sin(a) + uz * Math.cos(a);
      ux = cx;
      uz = cz;
    }
    // face where it goes, then go
    const want = Math.atan2(ux, uz);
    let da = want - zb.yaw;
    da = Math.atan2(Math.sin(da), Math.cos(da));
    zb.yaw += da * Math.min(1, dt * (zb.type === "runner" ? 9 : 5));
    const fwd = Math.max(0.2, Math.cos(da));
    zb.pos.x += Math.sin(zb.yaw) * spd * fwd * dt;
    zb.pos.z += Math.cos(zb.yaw) * spd * fwd * dt;
    return l;
  }

  Zs.update = (dt, rdt) => {
    frame++;
    const t = Z.t;
    const p = Z.ppos();
    const P = Z.player;
    const onFoot = Z.onFoot();
    // ---- spawn ----
    spawnT -= dt;
    let aliveN = 0;
    for (const zb of list) if (zb.alive) aliveN++;
    if (spawnT <= 0) {
      spawnT = 0.35;
      if (!P.dead && aliveN < Z.director.population()) Zs.spawn();
    }
    hordeT -= dt;
    if (hordeT <= 0) {
      hordeT = R(35, 60);
      if (!P.dead && aliveN < Z.director.population() + 6) spawnHorde();
    }
    // 🦖 a few giants always walk the city
    giantT -= dt;
    if (giantT <= 0) {
      giantT = R(6, 12);
      let gN = 0;
      for (const zb of list) if (zb.alive && zb.def.giant) gN++;
      if (!P.dead && gN < (touch ? 2 : 3)) Zs.spawnGiant();
    }
    // the car she drives: where it is and how fast it really goes
    const inCar = api.vehMode === "car" && api.drv;
    if (inCar) {
      _car.copy(api.drv.pos);
      if (!carPrevOk) _carPrev.copy(_car);
      carPrevOk = true;
    } else carPrevOk = false;
    const cvx = inCar ? (_car.x - _carPrev.x) / Math.max(rdt, 1e-4) : 0,
      cvz = inCar ? (_car.z - _carPrev.z) / Math.max(rdt, 1e-4) : 0;
    const carSpd = Math.hypot(cvx, cvz);

    let hunting = 0,
      brute = null,
      bruteD = 1e9;
    for (let i = list.length - 1; i >= 0; i--) {
      const zb = list[i];
      if (zb.removed) continue;
      zb.st += dt;
      const dxp = p.x - zb.pos.x,
        dzp = p.z - zb.pos.z,
        dP = Math.hypot(dxp, dzp);
      // far behind her: let it go (another will come)
      const far = zb.def.giant ? 2.4 : 1;
      if (dP > 125 * far && (zb.alive ? !zb.aware || dP > 160 * far : true)) {
        removeZombie(zb);
        continue;
      }
      zb.kick = Math.max(0, zb.kick - dt * 3.5);
      if (zb.flash > 0) {
        zb.flash -= dt;
        zb.mat.emissive.setRGB(zb.flash > 0 ? 0.35 : 0, 0.02, 0.02);
      }
      // ---- the dead and the dying ----
      if (!zb.alive) {
        if (zb.state === "headless") {
          zb.spurt -= dt;
          zb.pos.x += Math.sin(zb.yaw + Math.sin(t * 3) * 0.8) * 0.7 * dt;
          zb.pos.z += Math.cos(zb.yaw + Math.sin(t * 3) * 0.8) * 0.7 * dt;
          if (zb.st > zb.headlessFor) {
            zb.state = "dying";
            zb.st = 0;
            Z.fx.bloodPool(zb.pos.x, zb.pos.z, 2, Math.max(0, zb.pos.y));
          }
        } else if (zb.state === "launched") {
          zb.vel.y -= 20 * dt;
          zb.pos.addScaledVector(zb.vel, dt);
          zb.fall += zb.spin * dt;
          api.pushOutPoint(zb.pos, 0.4);
          const floor = Z.groundAt(zb.pos.x, zb.pos.z, zb.pos.y + 0.5);
          if (zb.pos.y <= floor && zb.vel.y < 0) {
            zb.pos.y = floor;
            zb.state = "dead";
            zb.st = 0;
            const f = ((zb.fall % 6.283) + 6.283) % 6.283;
            zb.fallSign = f < Math.PI ? 1 : -1;
            Z.fx.blood(zb.pos, null, 10, 3, floor);
            Z.fx.bloodPool(zb.pos.x, zb.pos.z, 2, floor);
            Z.sfx.flesh(zb.pos, false);
          }
        } else if (zb.state === "dying") {
          zb.spurt -= dt;
          if (zb.st > (zb.def.giant ? 1.6 : 0.65)) {
            zb.state = "dead";
            zb.st = 0;
            if (zb.def.giant) giantLands(zb, dP);
          }
        } else {
          zb.deadT += dt;
          zb.spurt -= dt;
          if (zb.deadT > (touch ? 6 : 11)) {
            zb.pos.y -= dt * 0.3;
            if (zb.deadT > (touch ? 9 : 14)) {
              removeZombie(zb);
              continue;
            }
          }
        }
        // the neck pumps
        if (zb.spurt > 0 && frame % 2 === 0) {
          zb.mesh.updateMatrixWorld(true);
          _v.set(0, 0.27, 0).applyMatrix4(zb.bones.chest.matrixWorld);
          _d.set(0, 0, 0.05).applyMatrix4(zb.bones.chest.matrixWorld).sub(_v);
          _d.set(_d.x * 4, 1, _d.z * 4).normalize();
          const pumpK = 0.5 + 0.5 * Math.sin(t * 11);
          Z.fx.blood(_v, _d, Math.round(2 + pumpK * 3), 3 + pumpK * 2.5, Math.max(0, zb.pos.y));
        }
        // a slide from the knock
        zb.vel.multiplyScalar(Math.max(0, 1 - dt * 5));
        if (zb.state !== "launched") zb.pos.addScaledVector(zb.vel, dt);
        // fall
        const u = zb.state === "dying" ? Math.min(1, zb.st / (zb.def.giant ? 1.6 : 0.65)) : zb.state === "headless" ? 0 : 1;
        if (zb.state !== "launched") zb.fall = zb.fallSign * (Math.PI / 2) * u * u;
        zb.mesh.position.set(zb.pos.x, zb.pos.y + (zb.state === "launched" ? 0.4 : 0.13 * zb.scale * u), zb.pos.z);
        zb.mesh.rotation.set(zb.fall, zb.yaw, 0);
        if (zb.burning > 0) {
          zb.burning -= dt;
          zb.burnAcc += dt * 10;
          if (zb.burnAcc >= 1) {
            zb.burnAcc = 0;
            Z.fx.fire(_v.set(zb.pos.x, zb.pos.y + 0.3, zb.pos.z), 1, 0.5, 1.6);
          }
        }
        if (zb.state !== "dead" || zb.st < 0.3 || frame % 4 === 0) pose(zb, dt, t);
        continue;
      }

      // ---- the living ----
      zb.seeT -= dt;
      if (zb.seeT <= 0) {
        zb.seeT = 0.22 + Math.random() * 0.12;
        if (zb.state !== "rise") perceive(zb);
      }
      if (zb.aware && dP < 40) hunting++;
      if (zb.def.big && zb.aware && dP < bruteD) {
        brute = zb;
        bruteD = dP;
      }
      zb.attackCD -= dt;
      let spd = 0;
      const reach = zb.def.reach * (zb.def.big ? 1 : zb.scale);
      const dy = Math.abs(p.y - zb.pos.y);
      switch (zb.state) {
        case "rise": {
          const u = Math.min(1, zb.st / 1.6);
          zb.pos.y = -1.8 * (1 - (1 - (1 - u) * (1 - u)));
          if (frame % 6 === 0 && u < 0.9) Z.fx.dust(_v.set(zb.pos.x, 0.1, zb.pos.z), 1, 0.45);
          if (u >= 1) {
            zb.pos.y = 0;
            zb.state = zb.aware ? "chase" : "wander";
            zb.st = 0;
            if (Math.random() < 0.5) Z.sfx.voice(headPos(zb, _v), "groan");
          }
          break;
        }
        case "wander": {
          zb.wanderT -= dt;
          if (zb.wanderT <= 0) {
            zb.wanderT = R(2.5, 6);
            zb.wanderGo = Math.random() < 0.6;
            zb.wanderYaw = zb.yaw + R(-1.4, 1.4);
          }
          if (zb.wanderGo) {
            spd = zb.walkSpd * 0.75;
            steer(zb, zb.pos.x + Math.sin(zb.wanderYaw) * 5, zb.pos.z + Math.cos(zb.wanderYaw) * 5, spd, dt);
          }
          if (zb.aware) zb.state = "chase";
          break;
        }
        case "scream":
          {
            let da = Math.atan2(dxp, dzp) - zb.yaw;
            da = Math.atan2(Math.sin(da), Math.cos(da));
            zb.yaw += da * Math.min(1, dt * 8);
            if (zb.st > (zb.def.big ? 1.3 : 0.8)) {
              zb.state = "chase";
              zb.st = 0;
            }
          }
          break;
        case "stagger":
          if (zb.st > 0.4) {
            zb.state = zb.aware ? "chase" : "wander";
            zb.st = 0;
          }
          break;
        case "chase": {
          if (!zb.aware) {
            zb.state = "wander";
            break;
          }
          spd = zb.runSpd * (zb.burning > 0 ? 1.25 : 1);
          if (P.dead) spd = zb.walkSpd;
          const tgt = inCar ? _car : p;
          steer(zb, tgt.x, tgt.z, spd, dt);
          if (dP < reach && dy < (inCar ? 2.5 : 1.8) && zb.attackCD <= 0 && !P.dead) {
            if (zb.type === "bloater" && onFoot) {
              Zs.damage(zb, 9999, { dir: _v2.set(-dxp, 0, -dzp).normalize(), noScore: true });
              break;
            }
            zb.state = "attack";
            zb.st = 0;
            zb.hitDone = false;
            if (Math.random() < 0.6) Z.sfx.voice(headPos(zb, _v), zb.def.big ? "roar" : "attack", zb.def.giant ? 0.45 : 1);
          }
          break;
        }
        case "attack": {
          let da = Math.atan2(dxp, dzp) - zb.yaw;
          da = Math.atan2(Math.sin(da), Math.cos(da));
          zb.yaw += da * Math.min(1, dt * 7);
          if (zb.type === "runner" && zb.st < 0.35) spd = 2.5;
          if (!zb.hitDone && zb.st > 0.36) {
            zb.hitDone = true;
            if (dP < reach + 0.55 && dy < (inCar ? 2.5 : 1.9)) {
              let dmg = zb.def.dmg;
              if (inCar) dmg *= carSpd < 3 ? 0.5 : 0;
              if (dmg > 0) Z.hurt(dmg, zb.pos, "claw");
              if (zb.def.big) {
                Z.fx.dust(_v.set(p.x, 0.1, p.z), 10, zb.def.giant ? 1.6 : 0.8);
                Z.fx.shake(zb.def.giant ? 0.7 : 0.45);
                if (onFoot) {
                  const kb = zb.def.giant ? 16 : 11;
                  api.vel.x += (dxp / (dP || 1)) * kb;
                  api.vel.z += (dzp / (dP || 1)) * kb;
                  api.vel.y += zb.def.giant ? 7 : 5;
                } else if (inCar && zb.def.giant) {
                  // a giant's swat shoves the car back
                  api.drv.speed = -Math.max(6, Math.abs(api.drv.speed) * 0.5);
                }
              }
            }
          }
          if (zb.st > 0.75) {
            zb.state = "chase";
            zb.st = 0;
            zb.attackCD = zb.type === "runner" ? 0.25 : 0.45;
          }
          break;
        }
      }
      if (zb.removed || !zb.alive) continue;
      // 🩸 the wounded leave a trail
      if (zb.hp < zb.maxHp * 0.55 && zb.spd > 0.3) {
        zb.dripT = (zb.dripT || 0) - dt;
        if (zb.dripT <= 0) {
          zb.dripT = R(0.35, 0.7);
          chestPos(zb, _v);
          Z.fx.blood(_v, null, 2, 0.6, 0);
          Z.fx.bloodPool(zb.pos.x + R(-0.3, 0.3), zb.pos.z + R(-0.3, 0.3), R(0.25, 0.55), 0);
        }
      }
      // knockback, the others around it, the towers, the shore
      zb.pos.addScaledVector(zb.vel, dt);
      zb.vel.multiplyScalar(Math.max(0, 1 - dt * 6));
      for (let k = i - 1; k >= 0; k--) {
        const o = list[k];
        if (!o.alive || o.removed) continue;
        const ox = zb.pos.x - o.pos.x,
          oz = zb.pos.z - o.pos.z;
        const min = 0.42 * (zb.scale + o.scale);
        const d2 = ox * ox + oz * oz;
        if (d2 < min * min && d2 > 1e-6) {
          const d = Math.sqrt(d2),
            push = (min - d) * 0.5;
          zb.pos.x += (ox / d) * push;
          zb.pos.z += (oz / d) * push;
          o.pos.x -= (ox / d) * push;
          o.pos.z -= (oz / d) * push;
        }
      }
      if (onFoot && dP < 0.75 * zb.scale && dy < 1.5) {
        const push = 0.75 * zb.scale - dP;
        zb.pos.x -= (dxp / (dP || 1)) * push;
        zb.pos.z -= (dzp / (dP || 1)) * push;
      }
      if (zb.state !== "rise") {
        zb.pos.y = 0;
        api.pushOutPoint(zb.pos, 0.32 * zb.scale);
        api.keepOnLand(zb.pos, 0.6);
        zb.pos.y = 0;
      }
      // 🦖 a giant: the car bounces off its shins (hard), and it staggers
      if (inCar && zb.def.giant && carSpd > 3 && Math.abs(_car.y - zb.pos.y) < 6 && Z.t > (zb.ramT || 0)) {
        const cx = zb.pos.x - _car.x,
          cz = zb.pos.z - _car.z,
          cd = Math.hypot(cx, cz);
        if (cd < 3.9) {
          zb.ramT = Z.t + 0.7;
          const dir = _v2.set(cvx / carSpd, 0, cvz / carSpd);
          const pt = chestPos(zb, _v3).clone();
          Zs.damage(zb, carSpd * 22, { dir, point: pt, ram: true });
          if (zb.alive) {
            zb.state = "stagger";
            zb.st = 0;
          }
          const d = api.drv,
            nx = cx / (cd || 1),
            nz = cz / (cd || 1);
          d.speed = -Math.min(14, 3 + carSpd * 0.3);
          d.pos.x -= nx * (3.95 - cd);
          d.pos.z -= nz * (3.95 - cd);
          Z.fx.shake(0.85);
          Z.fx.blood(pt, dir, 30, 7, 0);
          Z.sfx.stomp(zb.pos, 1.6);
          if (zb.alive) Z.hud.pop("GIANT HIT!", "#ffcf6a");
        }
      }
      // 🚗 under her wheels
      if (inCar && carSpd > 4 && !zb.def.giant && Math.abs(_car.y - zb.pos.y) < 2.2) {
        const cx = zb.pos.x - _car.x,
          cz = zb.pos.z - _car.z,
          cd = Math.hypot(cx, cz);
        if (cd < 2.3 + (zb.type === "brute" ? 0.5 : 0)) {
          const dir = _v2.set(cvx / carSpd, 0, cvz / carSpd);
          if (zb.type === "brute" && carSpd < 16) {
            Zs.damage(zb, carSpd * 14, { dir, knock: 6 });
            api.drv.speed *= 0.3;
            Z.fx.shake(0.5);
          } else {
            const opts = {
              dir,
              car: true,
              point: chestPos(zb, _v3).clone(),
              launch: new THREE.Vector3(dir.x * carSpd * 0.9 + (cx / (cd || 1)) * 3, 4 + carSpd * 0.3, dir.z * carSpd * 0.9 + (cz / (cd || 1)) * 3),
            };
            const roll = Math.random();
            if (carSpd > 36 && roll < 0.28 && zb.type !== "brute") {
              opts.gib = true; // 💥 at full boost they burst on the bumper
              opts.gibPower = 7 + carSpd * 0.12;
            } else if (roll < 0.6) opts.popHead = true;
            Zs.damage(zb, 9999, opts);
            api.drv.speed *= 0.94;
            Z.fx.shake(0.25);
            Z.fx.blood(opts.point, dir, 30, 7 + carSpd * 0.08, 0); // a red spray over the bonnet
            if (Math.random() < 0.5) Z.hud.splat(0.3 + Math.random() * 0.3); // 🩸 …and the windscreen
            if (Z.race) Z.race.roadkill(zb, carSpd);
          }
          continue;
        }
      }
      // 🔥 burning
      if (zb.burning > 0) {
        zb.burning -= dt;
        zb.burnAcc += dt * 14;
        if (zb.burnAcc >= 1) {
          zb.burnAcc = 0;
          Z.fx.fire(chestPos(zb, _v), 2, 0.55, 2);
          zb.mat.emissive.setRGB(0.5 + Math.random() * 0.4, 0.15, 0.02);
        }
        Zs.damage(zb, 32 * dt, { fire: true });
        if (!zb.alive) continue;
        if (Math.random() < dt * 0.8) Z.sfx.voice(headPos(zb, _v), "scream", 1.2);
        for (const o of list)
          if (o !== zb && o.alive && !o.burning && o.pos.distanceToSquared(zb.pos) < 0.8) Zs.ignite(o);
        if (zb.burning <= 0) zb.mat.emissive.setRGB(0, 0, 0);
      }
      // groans
      zb.groanT -= dt;
      if (zb.groanT <= 0) {
        zb.groanT = zb.aware ? R(2.5, 6) : R(6, 14);
        if (dP < (zb.def.giant ? 90 : 45)) Z.sfx.voice(headPos(zb, _v), "groan", zb.def.giant ? 0.42 : zb.type === "brute" ? 0.7 : zb.type === "runner" ? 1.2 : R(0.9, 1.1));
      }
      // the walk cycle follows the real speed
      zb.spd += (spd - zb.spd) * Math.min(1, dt * 8);
      zb.phase += dt * (zb.spd / (0.55 * zb.scale)) * Math.PI * 0.5 + (zb.state === "wander" && spd === 0 ? dt * 0.2 : 0);
      if (zb.def.giant && zb.spd > 0.4) {
        const sn = Math.floor(zb.phase / Math.PI);
        if (sn !== zb.stepN) {
          zb.stepN = sn;
          if (dP < 120) stomp(zb, dP, sn & 1 ? 1 : -1);
        }
      }
      zb.mesh.position.copy(zb.pos);
      zb.mesh.rotation.set(0, zb.yaw, 0);
      if (dP < 70 || (frame + zb.id) % 3 === 0) pose(zb, dt, t);
    }
    if (inCar) _carPrev.copy(_car);
    Z.audio.intensity += (Math.min(1, hunting / 6) - Z.audio.intensity) * Math.min(1, rdt * 1.5);
    if (!Z.aircraft.gunshipAlive()) Z.hud.boss(brute && bruteD < (brute.def.giant ? 90 : 60) ? brute.def.name.toUpperCase() : null, brute ? brute.hp / brute.maxHp : null);
    updateDebris(dt);
  };
}
