// ➕ what keeps her alive: medkits, armour vests, ammo boxes, grenades,
// weapon crates (the gun floats over its crate), adrenaline (bullet time),
// air-strike flares - scattered through the streets, dropped by the dead,
// and floating down under a parachute from the supply plane.
import * as THREE from "three";
import { WEAPON_IDS } from "./weapons.js";

const KIND_COL = {
  health: 0x52ff7a,
  armor: 0x5aa0ff,
  ammo: 0xffd45a,
  grenade: 0xb4ff5a,
  weapon: 0xffb02a,
  strike: 0xff4a3a,
  adrenaline: 0x4af0ff,
  drop: 0xffe14a,
};
const WEIGHTS = [
  ["health", 30],
  ["ammo", 28],
  ["weapon", 14],
  ["armor", 10],
  ["grenade", 9],
  ["adrenaline", 5],
  ["strike", 4],
];

export function setupPickups(Z) {
  const { api, scene } = Z;
  const touch = api.isTouch;
  const R = Z.rnd;
  const PK = (Z.pickups = { list: [] });
  const list = PK.list;

  // a beam of light so she can spot them through the haze
  const beamTex = (() => {
    const cv = document.createElement("canvas");
    cv.width = 4;
    cv.height = 128;
    const g = cv.getContext("2d");
    const gr = g.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, "rgba(255,255,255,0)");
    gr.addColorStop(0.7, "rgba(255,255,255,0.35)");
    gr.addColorStop(1, "rgba(255,255,255,0.9)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 4, 128);
    return new THREE.CanvasTexture(cv);
  })();
  const beamGeo = new THREE.CylinderGeometry(0.22, 0.32, 14, 10, 1, true).translate(0, 7, 0);
  const ringGeo = new THREE.RingGeometry(0.55, 0.75, 28).rotateX(-Math.PI / 2);
  const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, metalness: 0.2, ...o });
  const WHITE = M(0xe8e6e0),
    RED = M(0xc01010, { emissive: 0x600000 }),
    OLIVE = M(0x4a5233),
    WOOD = M(0x7a5a32, { roughness: 0.85 }),
    NAVY = M(0x1e2a4a),
    STEEL = M(0x8a9098, { metalness: 0.8, roughness: 0.3 }),
    BRASS = M(0xc09a40, { metalness: 0.8, roughness: 0.3 }),
    CYAN = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 2.5, 3) }),
    FLARE = new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 0.4, 0.2) });
  const beamMats = {},
    ringMats = {};
  for (const k in KIND_COL) {
    beamMats[k] = new THREE.MeshBasicMaterial({ color: KIND_COL[k], map: beamTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, opacity: 0.55 });
    ringMats[k] = new THREE.MeshBasicMaterial({ color: KIND_COL[k], transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, opacity: 0.7 });
  }

  function box(g, w, h, d, mat, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = !touch;
    g.add(m);
    return m;
  }
  function model(kind, opt) {
    const g = new THREE.Group();
    if (kind === "health") {
      const s = opt.big ? 1.25 : 0.9;
      box(g, 0.5 * s, 0.34 * s, 0.32 * s, WHITE);
      for (const z of [-1, 1]) {
        box(g, 0.28 * s, 0.08 * s, 0.01, RED, 0, 0, z * 0.165 * s);
        box(g, 0.08 * s, 0.24 * s, 0.01, RED, 0, 0, z * 0.165 * s);
      }
      box(g, 0.16 * s, 0.05 * s, 0.05 * s, M(0x222222), 0, 0.2 * s, 0);
    } else if (kind === "armor") {
      box(g, 0.5, 0.62, 0.16, NAVY);
      box(g, 0.36, 0.3, 0.04, M(0x34446a), 0, 0.06, 0.09);
      box(g, 0.12, 0.22, 0.12, NAVY, -0.19, 0.38, 0);
      box(g, 0.12, 0.22, 0.12, NAVY, 0.19, 0.38, 0);
    } else if (kind === "ammo") {
      box(g, 0.56, 0.3, 0.3, OLIVE);
      box(g, 0.57, 0.06, 0.31, M(0xd0a020), 0, 0.06, 0);
      for (let i = 0; i < 4; i++) {
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.14, 8), BRASS);
        b.position.set(-0.12 + i * 0.08, 0.22, 0);
        g.add(b);
      }
    } else if (kind === "grenade") {
      box(g, 0.4, 0.14, 0.3, WOOD);
      for (const x of [-0.09, 0.09]) {
        const s = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), OLIVE);
        s.position.set(x, 0.14, 0);
        s.scale.y = 1.2;
        g.add(s);
        box(g, 0.03, 0.05, 0.03, STEEL, x, 0.24, 0);
      }
    } else if (kind === "weapon") {
      box(g, 0.9, 0.3, 0.4, WOOD, 0, -0.25, 0);
      const gun = Z.weapons.preview(opt.id);
      gun.rotation.y = Math.PI / 2;
      gun.position.y = 0.12;
      gun.scale.setScalar(1.35);
      g.add(gun);
    } else if (kind === "strike") {
      box(g, 0.3, 0.2, 0.15, M(0x2a3020), 0, 0, 0);
      const f = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.32, 8), FLARE);
      f.position.set(0.12, 0.2, 0);
      f.rotation.z = 0.4;
      g.add(f);
    } else if (kind === "adrenaline") {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 10), CYAN);
      g.add(t);
      box(g, 0.12, 0.03, 0.12, STEEL, 0, 0.16, 0);
      const n = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.14, 4), STEEL);
      n.position.y = -0.22;
      g.add(n);
    } else if (kind === "drop") {
      box(g, 1.2, 0.9, 1.2, WOOD, 0, 0.45, 0);
      box(g, 1.22, 0.12, 1.22, M(0x3a3020), 0, 0.2, 0);
      box(g, 1.22, 0.12, 1.22, M(0x3a3020), 0, 0.7, 0);
      box(g, 0.4, 0.4, 0.02, M(0xdddddd), 0, 0.45, 0.61);
      box(g, 0.24, 0.07, 0.03, RED, 0, 0.45, 0.62);
      box(g, 0.07, 0.24, 0.03, RED, 0, 0.45, 0.62);
    }
    return g;
  }

  function add(kind, x, z, opt = {}) {
    const y = opt.y ?? Z.groundAt(x, z, 2);
    const root = new THREE.Group();
    root.position.set(x, y, z);
    const m = model(kind, opt);
    m.position.y = kind === "drop" ? 0 : 0.8;
    root.add(m);
    const beam = new THREE.Mesh(beamGeo, beamMats[kind].clone());
    beam.renderOrder = 3;
    root.add(beam);
    const ring = new THREE.Mesh(ringGeo, ringMats[kind].clone());
    ring.position.y = 0.04;
    root.add(ring);
    if (kind === "drop") {
      beam.scale.set(2.2, 2.5, 2.2);
      ring.scale.setScalar(2);
    }
    scene.add(root);
    const it = { kind, root, m, beam, ring, pos: root.position, opt, age: 0, life: opt.life || 0, phase: Math.random() * 6 };
    list.push(it);
    return it;
  }
  function remove(it) {
    scene.remove(it.root);
    it.beam.material.dispose();
    it.ring.material.dispose();
    const i = list.indexOf(it);
    if (i >= 0) list.splice(i, 1);
  }
  function rollKind() {
    let tot = 0;
    for (const [, w] of WEIGHTS) tot += w;
    let r = Math.random() * tot;
    for (const [k, w] of WEIGHTS) if ((r -= w) < 0) return k;
    return "ammo";
  }
  function weaponToFind() {
    const missing = WEAPON_IDS.filter((id) => !Z.weapons.has(id) && id !== "pistol" && id !== "katana");
    const pool = missing.length && Math.random() < 0.8 ? missing : WEAPON_IDS.filter((id) => id !== "pistol" && id !== "katana");
    return pool[(Math.random() * pool.length) | 0];
  }
  function spawnAround() {
    const p = Z.ppos();
    for (let t = 0; t < 10; t++) {
      const a = Math.random() * 6.283,
        d = R(18, 85);
      let x = p.x + Math.cos(a) * d,
        z = p.z + Math.sin(a) * d;
      if (Math.random() < 0.6) x = Math.round(x / api.TILE) * api.TILE + R(-4, 4);
      if (!Z.freeSpot(x, z, 1)) continue;
      const kind = rollKind();
      add(kind, x, z, kind === "weapon" ? { id: weaponToFind() } : kind === "health" ? { big: Math.random() < 0.3 } : {});
      return;
    }
  }

  // ---- the dead drop things ------------------------------------------------------------
  PK.drop = (pos, type) => {
    const r = Math.random();
    const x = pos.x,
      z = pos.z;
    if (type === "brute" || type === "giant") {
      add("weapon", x + 1, z, { id: weaponToFind(), life: 60 });
      add("health", x - 1, z, { big: true, life: 60 });
      return;
    }
    const chance = type === "runner" ? 0.16 : type === "bloater" ? 0.22 : 0.12;
    if (r > chance) return;
    const k = Math.random();
    add(k < 0.45 ? "ammo" : k < 0.82 ? "health" : "grenade", x, z, { life: 30, y: Math.max(0, pos.y) });
  };
  // 🪂 a supply crate floating down
  PK.addDrop = (x, z, fromY) => {
    const it = add("drop", x, z, { life: 0 });
    const ground = it.pos.y;
    it.falling = true;
    it.ground = ground;
    it.pos.y = fromY;
    it.beam.visible = false;
    // the parachute
    const chute = new THREE.Group();
    const canopy = new THREE.Mesh(
      new THREE.SphereGeometry(2.4, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x6a7a4a, side: THREE.DoubleSide, roughness: 0.9 }),
    );
    canopy.scale.y = 0.55;
    canopy.position.y = 5;
    chute.add(canopy);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x222222 });
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      pts.push(new THREE.Vector3(0, 0.9, 0), new THREE.Vector3(Math.cos(a) * 2.3, 5, Math.sin(a) * 2.3));
    }
    chute.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
    it.root.add(chute);
    it.chute = chute;
    return it;
  };

  function collect(it) {
    const P = Z.player,
      W = Z.weapons;
    let ok = true,
      msg = "",
      col = "#9df07a",
      snd = "ammo";
    switch (it.kind) {
      case "health": {
        if (P.hp >= P.max) return false;
        const n = it.opt.big ? 65 : 30;
        Z.heal(n);
        msg = `+${n} HEALTH`;
        snd = "health";
        break;
      }
      case "armor":
        if (P.armor >= 100) return false;
        P.armor = Math.min(100, P.armor + 50);
        msg = "+50 ARMOR";
        col = "#7ab0ff";
        snd = "armor";
        break;
      case "ammo":
        ok = W.addAmmo(1);
        if (!ok) return false;
        msg = "+AMMO";
        col = "#ffd45a";
        break;
      case "grenade":
        if (W.grenades >= 6) return false;
        W.grenades = Math.min(6, W.grenades + 2);
        msg = "+2 GRENADES";
        col = "#c4ff6a";
        break;
      case "strike":
        W.strikes = Math.min(3, W.strikes + 1);
        msg = "✈️ AIR STRIKE READY (X)";
        col = "#ff7a5a";
        snd = "power";
        break;
      case "adrenaline":
        Z.bulletUntil = Z.rt + 8;
        Z.heal(15);
        msg = "⏱ ADRENALINE - BULLET TIME";
        col = "#6af0ff";
        snd = "power";
        break;
      case "weapon": {
        const r = W.give(it.opt.id);
        const name = W.owned.find((w) => w.id === it.opt.id).name;
        if (r === "new") {
          Z.hud.pop(name.toUpperCase() + "!", "#ffb02a");
          msg = `🔫 ${name}`;
        } else msg = `+${name} AMMO`;
        col = "#ffb02a";
        snd = "weapon";
        break;
      }
      case "drop": {
        const id = weaponToFind();
        const r = W.give(id, 1.5);
        W.addAmmo(1.5);
        Z.heal(50);
        P.armor = Math.min(100, P.armor + 50);
        W.grenades = Math.min(6, W.grenades + 2);
        W.strikes = Math.min(3, W.strikes + 1);
        const name = W.owned.find((w) => w.id === id).name;
        Z.hud.banner("SUPPLY DROP", `${r === "new" ? name + " · " : ""}ammo · medkit · armor · grenades · air strike`, 2.6);
        msg = "📦 SUPPLIES";
        col = "#ffe14a";
        snd = "power";
        break;
      }
    }
    Z.sfx.pickup(snd);
    Z.hud.toast(msg, col);
    Z.fx.sparks(it.pos.clone().setY(it.pos.y + 0.8), 10, 3);
    return true;
  }

  // ---- per frame ------------------------------------------------------------------------------
  let spawnT = 0;
  const _sm = new THREE.Vector3();
  PK.update = (dt) => {
    const p = Z.ppos();
    const want = touch ? 10 : 15;
    spawnT -= dt;
    if (spawnT <= 0) {
      spawnT = 0.5;
      let natural = 0;
      for (const it of list) if (!it.life && it.kind !== "drop") natural++;
      if (natural < want) spawnAround();
    }
    const reach = Z.onFoot() ? 1.7 : 3.2;
    for (let i = list.length - 1; i >= 0; i--) {
      const it = list[i];
      it.age += dt;
      const dx = it.pos.x - p.x,
        dz = it.pos.z - p.z,
        d = Math.hypot(dx, dz);
      if (d > 150 && it.kind !== "drop") {
        remove(it);
        continue;
      }
      if (it.life && it.age > it.life) {
        remove(it);
        continue;
      }
      // the crate drifting down
      if (it.falling) {
        it.pos.y -= dt * 4.5;
        it.root.rotation.y += dt * 0.3;
        it.chute.rotation.z = Math.sin(it.age * 1.3) * 0.08;
        if (it.pos.y <= it.ground) {
          it.pos.y = it.ground;
          it.falling = false;
          it.root.remove(it.chute);
          it.beam.visible = true;
          Z.fx.dust(_sm.set(it.pos.x, it.ground + 0.2, it.pos.z), 10, 0.8);
          Z.sfx.explosion(it.pos, 0.15);
        }
      }
      if (!it.falling && it.kind === "drop" && Math.random() < dt * 6) {
        // green smoke marks it
        _sm.set(it.pos.x + 1, it.pos.y + 0.3, it.pos.z);
        Z.fx.norm.spawn(_sm.x, _sm.y, _sm.z, R(-0.3, 0.3), R(1.2, 2.2), R(-0.3, 0.3), R(3, 5), 0.5, R(2.5, 4), [0.25, 0.7, 0.2, 0.5], [0.3, 0.55, 0.25, 0], -0.1, 0.4, 0, -99);
      }
      // bob, spin and glow (blinking when it's about to go)
      if (it.kind !== "drop") {
        it.m.position.y = 0.8 + Math.sin(it.age * 2.2 + it.phase) * 0.12;
        it.m.rotation.y += dt * 1.4;
      }
      const blink = it.life && it.life - it.age < 5 ? (Math.sin(it.age * 18) > 0 ? 1 : 0.2) : 1;
      it.beam.material.opacity = (0.4 + 0.15 * Math.sin(it.age * 3)) * blink;
      it.ring.scale.setScalar((it.kind === "drop" ? 2 : 1) * (1 + 0.15 * Math.sin(it.age * 4)));
      it.m.visible = blink > 0.5 || !it.life;
      if (!it.falling && !Z.player.dead && d < reach && Math.abs(it.pos.y - p.y) < 2.5) {
        if (collect(it)) remove(it);
      }
    }
  };
}
