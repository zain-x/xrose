// 🌑 the island after the fall: always night under a blood moon, a thick
// sick-green haze, street lamps that stutter and die, rooftop signs that
// flicker « QUARANTINE », wrecked cars burning at the crossroads with smoke
// pouring up, ash falling and embers rising - and nothing romantic left.
import * as THREE from "three";
import { Cloud } from "./fx.js?v=hunt-1";

export function setupWorld(Z) {
  const { api, scene, camera } = Z;
  const E = api.env;
  const touch = api.isTouch;
  const R = Z.rnd;
  const TILE = api.TILE;
  const W = (Z.world = {});

  // ---- what doesn't belong here anymore ------------------------------------------
  function hideRomance() {
    for (const o of api.hideList) if (o) o.visible = false;
    for (const h of api.floatingHearts) h.sprite.visible = false;
    for (const s of api.surprises) {
      s.beam.visible = false;
      s.marker.visible = false;
    }
  }
  hideRomance();
  api.setStorm(0.3); // a cold drizzle over the city

  // ---- the night itself ------------------------------------------------------------
  const FOG = new THREE.Color(0x3a3550); // (a lighter night: she can see the streets)
  const HEMI_SKY = new THREE.Color(0xa4a0c4),
    HEMI_GND = new THREE.Color(0x4e3a46);
  if (E.moonDisc) {
    E.moonDisc.material.color.set(0xff4a2a);
    E.moonDisc.scale.multiplyScalar(1.5);
  }
  if (E.moonGlow) E.moonGlow.material.color.set(0xff3a1a);
  function atmosphere() {
    scene.fog.color.copy(FOG);
    scene.background.copy(FOG);
    scene.fog.density = touch ? 0.0058 : 0.0048;
    E.hemi.color.copy(HEMI_SKY);
    E.hemi.groundColor.copy(HEMI_GND);
    E.hemi.intensity = 1.7;
    E.moonFill.color.setHex(0xd2614c);
    E.moonFill.intensity = 1.15;
    E.keyLight.intensity = 0;
    api.renderer.toneMappingExposure = 1.3;
    E.uNight.value = 0.75; // the city's windows and neon still burning
    if (E.starMat) E.starMat.uniforms.uOpacity.value *= 0.3;
    if (E.moonGlow) E.moonGlow.material.opacity = Math.max(E.moonGlow.material.opacity, 0.22);
  }

  // ---- street lamps that stutter (some are just dead) -----------------------------------
  const lampF = E.lampLights.map(() => ({ off: 0, k: 1 }));
  function flickerLamps(dt) {
    E.lampLights.forEach((L, i) => {
      const f = lampF[i];
      // which lamp this is right now (they move with the camera): hash its spot
      const gx = Math.round(L.position.x / TILE),
        gz = Math.round(L.position.z / TILE);
      const h = api.hash(gx, gz, 91);
      if (h < 0.3) {
        L.intensity = 0; // dead
        return;
      }
      f.off -= dt;
      if (f.off <= 0 && Math.random() < dt * (h < 0.55 ? 3 : 0.4)) f.off = R(0.04, 0.25);
      f.k += ((f.off > 0 ? 0.05 : 1) - f.k) * Math.min(1, dt * 30);
      L.intensity *= f.k;
    });
    if (E.lampHeadMat) E.lampHeadMat.emissiveIntensity *= 0.7 + 0.3 * Math.random();
  }

  // ---- rooftop signs: no more « Rose ♥ », just the warnings - flickering ---------------
  const signF = E.LABEL_MATS.map(() => ({ off: 0, base: R(0.6, 0.95) }));
  function flickerSigns(dt) {
    E.LABEL_MATS.forEach((m, i) => {
      const f = signF[i];
      f.off -= dt;
      if (f.off <= 0 && Math.random() < dt * 0.6) f.off = R(0.05, 0.35);
      m.opacity = f.off > 0 ? R(0.05, 0.25) : f.base * (0.92 + Math.random() * 0.08);
    });
  }

  // ---- 🔥 burning wrecks at the crossroads ------------------------------------------------
  const CHAR = new THREE.MeshStandardMaterial({ color: 0x1b1714, roughness: 0.95, metalness: 0.2 });
  const RUST = new THREE.MeshStandardMaterial({ color: 0x4a2414, roughness: 1, metalness: 0.1 });
  const EMBER = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 0.6, 0.1) });
  function wreckModel() {
    const g = new THREE.Group();
    const box = (w, h, d, mat, x, y, z, rx = 0, rz = 0) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      m.rotation.set(rx, 0, rz);
      m.castShadow = !touch;
      g.add(m);
      return m;
    };
    box(1.9, 0.55, 4.3, CHAR, 0, 0.55, 0, 0, 0.03);
    box(1.65, 0.5, 2.0, CHAR, 0, 1.08, -0.25, 0.05, -0.04);
    box(1.95, 0.08, 1.2, RUST, 0, 0.86, 1.55, -0.35, 0); // the bonnet, bent up
    box(0.5, 0.2, 1.4, RUST, 0.6, 0.86, -1.6);
    const ember = box(1.5, 0.05, 3.6, EMBER, 0, 0.3, 0);
    ember.castShadow = false;
    for (const [x, z] of [[-0.95, 1.35], [0.95, -1.35], [-0.95, -1.35]]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 10), CHAR);
      w.rotation.z = Math.PI / 2;
      w.position.set(x, 0.3, z);
      g.add(w);
    }
    g.visible = false;
    scene.add(g);
    return g;
  }
  const WRECKS = touch ? 4 : 7;
  const wrecks = Array.from({ length: WRECKS }, () => ({ g: wreckModel(), key: null, x: 0, z: 0, fa: 0, sa: 0 }));
  const fireLights = [];
  if (!touch)
    for (let i = 0; i < 2; i++) {
      const L = new THREE.PointLight(0xff7a2a, 0, 24, 1.6);
      scene.add(L);
      fireLights.push(L);
    }
  W.wrecks = wrecks;
  let assignT = 0;
  const cand = [];
  function assignWrecks() {
    const cx = camera.position.x,
      cz = camera.position.z;
    const g0x = Math.round(cx / TILE),
      g0z = Math.round(cz / TILE);
    cand.length = 0;
    for (let gx = g0x - 4; gx <= g0x + 4; gx++)
      for (let gz = g0z - 4; gz <= g0z + 4; gz++) {
        if (api.hash(gx, gz, 77) > 0.24) continue;
        const ox = (api.hash(gx, gz, 78) - 0.5) * 6,
          oz = (api.hash(gx, gz, 79) - 0.5) * 6;
        const x = gx * TILE + ox,
          z = gz * TILE + oz;
        if (api.landDist(x, z) > -8) continue;
        if (!Z.freeSpot(x, z, 2.5)) continue;
        cand.push({ key: gx + "," + gz, x, z, a: api.hash(gx, gz, 80) * 6.28, d: Math.hypot(x - cx, z - cz) });
      }
    cand.sort((a, b) => a.d - b.d);
    const want = cand.slice(0, WRECKS);
    const keep = new Set(want.map((c) => c.key));
    const free = wrecks.filter((w) => !w.key || !keep.has(w.key));
    for (const w of wrecks) if (w.key && !keep.has(w.key)) w.key = null;
    for (const c of want) {
      if (wrecks.some((w) => w.key === c.key)) continue;
      const w = free.pop();
      if (!w) break;
      w.key = c.key;
      w.x = c.x;
      w.z = c.z;
      w.g.position.set(c.x, 0, c.z);
      w.g.rotation.y = c.a;
    }
    for (const w of wrecks) w.g.visible = !!w.key;
  }
  const _wp = new THREE.Vector3();
  let fireSnd = null,
    burnT = 0;
  function updateWrecks(dt) {
    assignT -= dt;
    if (assignT <= 0) {
      assignT = 0.6;
      assignWrecks();
    }
    const p = Z.ppos();
    let near = null,
      nearD = 1e9;
    const lit = [];
    for (const w of wrecks) {
      if (!w.key) continue;
      const d = Math.hypot(w.x - camera.position.x, w.z - camera.position.z);
      if (d < nearD) {
        nearD = d;
        near = w;
      }
      lit.push({ w, d });
      if (d > 95) continue;
      w.fa += dt * (touch ? 14 : 26);
      w.sa += dt * (touch ? 1.6 : 3);
      _wp.set(w.x, 0.9, w.z);
      if (w.fa >= 1) {
        const n = w.fa | 0;
        w.fa -= n;
        Z.fx.fire(_wp, n, 0.9, 2.4);
      }
      if (w.sa >= 1) {
        const n = w.sa | 0;
        w.sa -= n;
        _wp.y = 2.2;
        Z.fx.smoke(_wp, n, 1.3, 0.05, 2.6, 6);
      }
      // too close: it burns her; the dead that stumble in catch fire
      if (Z.entered) {
        const pd = Math.hypot(p.x - w.x, p.z - w.z);
        if (pd < 2.4 && p.y < 2 && Z.onFoot()) {
          burnT -= dt;
          if (burnT <= 0) {
            burnT = 0.25;
            Z.hurt(3, null, "fire");
          }
          // and she's pushed out of the wreck
          const k = (2.4 - pd) / Math.max(pd, 0.01);
          api.girl.pos.x += (p.x - w.x) * k * 0.5;
          api.girl.pos.z += (p.z - w.z) * k * 0.5;
        }
        for (const zb of Z.zombies.list)
          if (zb.alive && !zb.burning && Math.abs(zb.pos.x - w.x) < 1.8 && Math.abs(zb.pos.z - w.z) < 2.4)
            Z.zombies.ignite(zb);
      }
    }
    lit.sort((a, b) => a.d - b.d);
    fireLights.forEach((L, i) => {
      const it = lit[i];
      if (!it || it.d > 90) {
        L.intensity = 0;
        return;
      }
      L.position.set(it.w.x, 2.2, it.w.z);
      L.intensity = 9 + Math.sin(Z.rt * 23 + i) * 2 + Math.random() * 3;
    });
    if (Z.entered) {
      if (!fireSnd) fireSnd = Z.sfx.loop("fire", _wp.set(0, 0, 0));
      if (near) fireSnd.set(_wp.set(near.x, 1, near.z), nearD < 60 ? 0.5 : 0);
    }
  }

  // ---- ash falling, embers rising ------------------------------------------------------------
  const ash = new Cloud(touch ? 300 : 700, false, scene);
  const embers = new Cloud(touch ? 90 : 220, true, scene);
  let ashA = 0,
    embA = 0;
  function updateAmbientParticles(dt) {
    const c = camera.position;
    ashA += dt * (touch ? 50 : 115);
    while (ashA >= 1) {
      ashA--;
      const g = R(0.12, 0.22);
      ash.spawn(
        c.x + R(-45, 45), c.y + R(4, 26), c.z + R(-45, 45),
        R(-0.6, 0.6) + 0.5, R(-0.9, -0.4), R(-0.6, 0.6),
        6, R(0.05, 0.1), R(0.05, 0.1),
        [g, g, g, 0.75], [g, g, g, 0], 0, 0, 0, -99,
      );
    }
    embA += dt * (touch ? 12 : 30);
    while (embA >= 1) {
      embA--;
      embers.spawn(
        c.x + R(-40, 40), c.y + R(-6, 4), c.z + R(-40, 40),
        R(-0.5, 0.5), R(0.6, 1.8), R(-0.5, 0.5),
        R(3, 5), R(0.05, 0.09), 0.02,
        [2.4, 0.8, 0.15, 1], [1.2, 0.15, 0.02, 0], -0.2, 0.2, 0, -99,
      );
    }
    const sc =
      (innerHeight * api.renderer.getPixelRatio()) /
      (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    for (const cl of [ash, embers]) {
      cl.uni.uScale.value = sc;
      cl.uni.uFogD.value = scene.fog.density;
      cl.uni.uFogC.value.copy(scene.fog.color);
      cl.update(dt);
    }
  }

  W.onEnter = () => {};
  W.update = (dt) => {
    hideRomance();
    atmosphere();
    flickerLamps(dt);
    flickerSigns(dt);
    updateWrecks(dt);
    updateAmbientParticles(dt);
  };
}
