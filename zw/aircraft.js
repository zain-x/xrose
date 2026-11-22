// 🚁 death from above: an attack GUNSHIP that hunts her with a searchlight,
// chin-gun bursts and rocket salvos (shoot it down and it spins out and
// crashes in a fireball), kamikaze DRONES that dive at her beeping faster and
// faster, and JETS on bombing runs down a red-marked strip of street - plus
// her own side: an air strike on call, and the cargo plane with supply drops.
import * as THREE from "three";

export function setupAircraft(Z) {
  const { api, scene } = Z;
  const touch = api.isTouch;
  const R = Z.rnd;
  const A = (Z.aircraft = { list: [] });
  const list = A.list;
  const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, metalness: 0.45, ...o });
  const DARK = M(0x2c3628),
    BLACK = M(0x121412),
    GREY = M(0x6a7078),
    LIGHTGREY = M(0xb8bec6),
    GLASS = M(0x0a1a22, { roughness: 0.1, metalness: 0.9, emissive: 0x041018 }),
    REDL = new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 0.2, 0.1) }),
    GREENL = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 4, 0.4) }),
    WHITEL = new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 4, 4) }),
    BLUEL = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 1.4, 4) });
  const ADD = (c, op = 0.5) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const _v = new THREE.Vector3(),
    _v2 = new THREE.Vector3(),
    _v3 = new THREE.Vector3(),
    _pc = new THREE.Vector3();
  function mesh(geo, mat, parent, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = !touch;
    parent.add(m);
    return m;
  }
  // the highest roof around a point (so they fly over the towers)
  function skyFloor(x, z) {
    let h = 0;
    for (const [ox, oz] of [[0, 0], [20, 0], [-20, 0], [0, 20], [0, -20]]) h = Math.max(h, api.roofUnder(x + ox, z + oz, 999));
    return h;
  }

  // ---- 🚁 the gunship ------------------------------------------------------------------------
  function gunshipModel() {
    const g = new THREE.Group();
    mesh(new THREE.SphereGeometry(1, 16, 12).scale(1.1, 1.0, 2.5), DARK, g);
    mesh(new THREE.SphereGeometry(1, 14, 10).scale(0.8, 0.65, 1.0), GLASS, g, 0, 0.25, 1.65);
    const boom = mesh(new THREE.CylinderGeometry(0.2, 0.38, 5, 10), DARK, g, 0, 0.3, -3.9);
    boom.rotation.x = Math.PI / 2;
    mesh(new THREE.BoxGeometry(0.14, 1.7, 1.0), DARK, g, 0, 1.0, -6.2);
    mesh(new THREE.BoxGeometry(2.0, 0.1, 0.6), DARK, g, 0, 0.35, -5.9);
    const tail = new THREE.Group();
    tail.position.set(0.25, 1.1, -6.3);
    g.add(tail);
    mesh(new THREE.BoxGeometry(0.05, 1.5, 0.16), BLACK, tail);
    mesh(new THREE.BoxGeometry(0.05, 0.16, 1.5), BLACK, tail);
    const rotor = new THREE.Group();
    rotor.position.set(0, 1.3, 0);
    g.add(rotor);
    mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.35, 10), BLACK, rotor);
    for (let i = 0; i < 4; i++) {
      const b = mesh(new THREE.BoxGeometry(7, 0.06, 0.38), BLACK, rotor, 0, 0.15, 0);
      b.rotation.y = (i * Math.PI) / 2;
      b.geometry.translate(3.5, 0, 0);
    }
    // a soft disc so the spinning blades read as a blur
    const blur = mesh(new THREE.CircleGeometry(7, 32).rotateX(-Math.PI / 2), ADD(0x445044, 0.12), rotor, 0, 0.16, 0);
    blur.castShadow = false;
    mesh(new THREE.BoxGeometry(3.8, 0.12, 0.8), DARK, g, 0, -0.2, 0.3);
    for (const s of [-1, 1]) {
      const pod = mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.3, 10), BLACK, g, s * 1.65, -0.45, 0.4);
      pod.rotation.x = Math.PI / 2;
      mesh(new THREE.BoxGeometry(0.1, 0.1, 3.2), BLACK, g, s * 0.85, -1.2, 0);
      mesh(new THREE.BoxGeometry(0.08, 0.5, 0.08), BLACK, g, s * 0.75, -0.95, 0.7);
      mesh(new THREE.BoxGeometry(0.08, 0.5, 0.08), BLACK, g, s * 0.75, -0.95, -0.7);
      mesh(new THREE.SphereGeometry(0.09, 8, 6), s < 0 ? REDL : GREENL, g, s * 1.9, -0.2, 0.3);
    }
    mesh(new THREE.SphereGeometry(0.28, 10, 8), BLACK, g, 0, -0.85, 1.9);
    const barrel = mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.0, 8), BLACK, g, 0, -0.92, 2.4);
    barrel.rotation.x = Math.PI / 2;
    const gunTip = new THREE.Object3D();
    gunTip.position.set(0, -0.92, 2.95);
    g.add(gunTip);
    const strobe = mesh(new THREE.SphereGeometry(0.1, 6, 5), WHITEL, g, 0, 1.9, -6.2);
    const pods = [new THREE.Object3D(), new THREE.Object3D()];
    pods[0].position.set(-1.65, -0.45, 1.1);
    pods[1].position.set(1.65, -0.45, 1.1);
    g.add(pods[0], pods[1]);
    // the searchlight's beam
    const beam = new THREE.Mesh(new THREE.ConeGeometry(3.2, 1, 24, 1, true).translate(0, -0.5, 0), ADD(0xfff2c8, 0.07));
    beam.renderOrder = 3;
    scene.add(beam);
    g.scale.setScalar(1.15);
    scene.add(g);
    return { g, rotor, tail, gunTip, strobe, pods, beam };
  }
  let spot = null,
    spotGlow = null;
  if (!touch) {
    spot = new THREE.SpotLight(0xfff0d0, 0, 140, 0.22, 0.55, 1.2);
    scene.add(spot, spot.target);
  }
  spotGlow = new THREE.Mesh(new THREE.CircleGeometry(4.5, 32).rotateX(-Math.PI / 2), ADD(0xfff0c0, 0.0));
  spotGlow.renderOrder = 2;
  scene.add(spotGlow);

  let G = null;
  A.gunshipAlive = () => !!G && G.state !== "wreck";
  A.spawnGunship = () => {
    if (G) return;
    const p = Z.ppos();
    const a = Math.random() * 6.283;
    const m = gunshipModel();
    const hp = 900 + Z.director.wave * 120;
    G = {
      kind: "gunship",
      m,
      pos: new THREE.Vector3(p.x + Math.cos(a) * 260, 80, p.z + Math.sin(a) * 260),
      vel: new THREE.Vector3(),
      yaw: 0,
      bank: 0,
      hp,
      max: hp,
      state: "arrive",
      orbitA: a,
      orbitR: R(34, 48),
      fireT: 3,
      burst: 0,
      burstT: 0,
      rocketT: 6,
      salvo: 0,
      salvoT: 0,
      smokeT: 0,
      deadT: 0,
      spin: 0,
      alive: true,
      radius: 3.6,
      snd: Z.sfx.loop("rotor", _v.set(0, 0, 0)),
    };
    G.damage = (d, pt) => {
      if (G.state === "crash" || G.state === "wreck") return;
      G.hp -= d;
      Z.hud.hitmark("hit");
      if (G.hp <= 0) gunshipDown();
    };
    list.push(G);
    Z.hud.warn("⚠ GUNSHIP INBOUND", 4);
    Z.sfx.siren();
  };
  function gunshipDown() {
    G.state = "crash";
    G.spin = 0;
    Z.fx.boom(G.pos, 4, 1);
    Z.player.score += 2000;
    Z.hud.banner("GUNSHIP DOWN", "+2000", 2.6);
    Z.slowmo(0.35, 0.9);
    Z.hud.boss(null);
  }
  const eRockets = [];
  const rocketGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8).rotateX(Math.PI / 2);
  function enemyRocket(from, target) {
    const m = new THREE.Mesh(rocketGeo, BLACK);
    m.position.copy(from);
    scene.add(m);
    const vel = _v.subVectors(target, from).normalize().multiplyScalar(48).clone();
    eRockets.push({ m, vel, age: 0, smokeT: 0 });
    Z.sfx.shot("rpg", from);
  }
  function updateERockets(dt) {
    const pc = Z.pchest(_pc);
    for (let i = eRockets.length - 1; i >= 0; i--) {
      const r = eRockets[i],
        p = r.m.position;
      r.age += dt;
      p.addScaledVector(r.vel, dt);
      r.m.lookAt(_v.copy(p).add(r.vel));
      r.smokeT -= dt;
      if (r.smokeT <= 0) {
        r.smokeT = 0.03;
        Z.fx.smoke(p, 1, 0.3, 0.35, 0.2, 1.8);
        Z.fx.fire(p, 1, 0.3, 0);
      }
      const floor = Z.groundAt(p.x, p.z, p.y + 0.5);
      if (p.y <= floor + 0.2 || Z.solidAt(p.x, p.y, p.z) || p.distanceTo(pc) < 1.4 || r.age > 6) {
        scene.remove(r.m);
        eRockets.splice(i, 1);
        Z.explode(p, 6, 48, { src: "enemy", big: 0.9 });
      }
    }
  }
  // the chin gun: a burst that rakes the street around her
  function gunRound() {
    G.m.gunTip.getWorldPosition(_v);
    const pc = Z.pchest(_pc);
    const p = Z.ppos();
    const sp = api.vehMode === "walk" ? Math.hypot(api.vel.x, api.vel.z) : 8;
    const miss = 0.7 + sp * 0.16 + _v.distanceTo(pc) * 0.012;
    _v2.set(pc.x + R(-1, 1) * miss, pc.y + R(-1, 0.5) * miss, pc.z + R(-1, 1) * miss);
    _v3.subVectors(_v2, _v).normalize();
    const t = Z.rayCast(_v, _v3, 220, 1);
    const end = _v2.copy(_v).addScaledVector(_v3, t);
    // did it pass through her?
    const toP = _pc.copy(pc).sub(_v);
    const along = toP.dot(_v3);
    if (along > 0 && along < t + 0.5) {
      const closest = _pc.copy(_v).addScaledVector(_v3, along);
      const dx = closest.x - p.x,
        dz = closest.z - p.z,
        cy = closest.y - p.y;
      if (Math.hypot(dx, dz) < 0.55 && cy > -0.2 && cy < 1.9) {
        Z.hurt(6 + Z.director.wave * 0.5, G.pos, "bullet");
        Z.fx.blood(closest, _v3, 4, 2);
      }
    }
    Z.fx.tracer(_v, end, [3.5, 1.4, 0.4], 260, 9);
    Z.fx.sparks(end, 4, 7);
    Z.fx.dust(end, 2, 0.25);
    Z.fx.muzzle(_v, 0.9);
    Z.sfx.shot("heli", _v);
  }
  function updateGunship(dt) {
    if (!G) return;
    const m = G.m;
    const p = Z.ppos();
    m.rotor.rotation.y += dt * 26;
    m.tail.rotation.x += dt * 40;
    m.strobe.visible = Math.sin(Z.t * 9) > 0.6;
    if (G.state === "arrive" || G.state === "orbit") {
      const d2 = Math.hypot(G.pos.x - p.x, G.pos.z - p.z);
      if (G.state === "arrive" && d2 < 120) G.state = "orbit";
      G.orbitA += dt * 0.22;
      const tx = p.x + Math.cos(G.orbitA) * G.orbitR,
        tz = p.z + Math.sin(G.orbitA) * G.orbitR;
      const alt = Math.max(Math.max(skyFloor(tx, tz), skyFloor(G.pos.x, G.pos.z)) + 18, p.y + 24, 32);
      _v.set(tx - G.pos.x, alt - G.pos.y, tz - G.pos.z);
      const maxS = G.state === "arrive" ? 42 : 20;
      if (_v.length() > maxS) _v.setLength(maxS);
      G.vel.lerp(_v, Math.min(1, dt * 1.1));
      G.pos.addScaledVector(G.vel, dt);
      // face her, lean into the turn
      const want = Math.atan2(p.x - G.pos.x, p.z - G.pos.z);
      let da = want - G.yaw;
      da = Math.atan2(Math.sin(da), Math.cos(da));
      G.yaw += da * Math.min(1, dt * 1.5);
      const side = G.vel.x * Math.cos(G.yaw) - G.vel.z * Math.sin(G.yaw);
      const fwd = G.vel.x * Math.sin(G.yaw) + G.vel.z * Math.cos(G.yaw);
      G.bank += (Z.clamp(-side * 0.03, -0.45, 0.45) - G.bank) * Math.min(1, dt * 2);
      m.g.rotation.set(Z.clamp(fwd * 0.012, -0.3, 0.3), G.yaw, G.bank, "YXZ");
      // the guns
      const pc = Z.pchest();
      if (G.state === "orbit" && !Z.player.dead) {
        G.fireT -= dt;
        if (G.fireT <= 0 && G.burst <= 0) {
          m.gunTip.getWorldPosition(_v3);
          if (Z.los(_v3, pc)) {
            G.burst = 9 + ((Math.random() * 6) | 0);
            G.burstT = 0;
          }
          G.fireT = R(2.2, 3.6);
        }
        if (G.burst > 0) {
          G.burstT -= dt;
          if (G.burstT <= 0) {
            G.burstT = 0.085;
            G.burst--;
            gunRound();
          }
        }
        G.rocketT -= dt;
        if (G.rocketT <= 0) {
          G.rocketT = R(7, 11);
          m.gunTip.getWorldPosition(_v3);
          if (Z.los(_v3, pc)) {
            G.salvo = 2;
            G.salvoT = 0;
          }
        }
        if (G.salvo > 0) {
          G.salvoT -= dt;
          if (G.salvoT <= 0) {
            G.salvoT = 0.35;
            const pod = m.pods[G.salvo % 2];
            pod.getWorldPosition(_v3);
            const lead = api.vehMode === "walk" ? api.vel : _v2.set(0, 0, 0);
            _v2.set(p.x + lead.x * 0.6 + R(-3, 3), p.y + 0.5, p.z + lead.z * 0.6 + R(-3, 3));
            enemyRocket(_v3, _v2);
            G.salvo--;
          }
        }
      }
      // smoking when hurt
      const hk = G.hp / G.max;
      if (hk < 0.5) {
        G.smokeT -= dt;
        if (G.smokeT <= 0) {
          G.smokeT = 0.06;
          _v.set(0, 1, -1).applyMatrix4(m.g.matrixWorld);
          Z.fx.smoke(_v, 1, 0.8, 0.06, 1, 2.5);
          if (hk < 0.25) Z.fx.fire(_v, 2, 0.6, 1);
        }
      }
      Z.hud.boss("GUNSHIP", Math.max(0, hk));
      // the searchlight sweeps over her
      m.gunTip.getWorldPosition(_v3);
      const wob = Z.t * 0.9;
      _v2.set(p.x + Math.sin(wob) * 2.5, Z.groundAt(p.x, p.z, p.y + 1), p.z + Math.cos(wob * 1.3) * 2.5);
      const L = _v3.distanceTo(_v2);
      m.beam.position.copy(_v3);
      m.beam.scale.set(1, L, 1);
      m.beam.lookAt(_v2);
      m.beam.rotateX(-Math.PI / 2);
      m.beam.visible = true;
      spotGlow.position.set(_v2.x, _v2.y + 0.06, _v2.z);
      spotGlow.material.opacity = 0.22;
      if (spot) {
        spot.position.copy(_v3);
        spot.target.position.copy(_v2);
        spot.intensity = 900;
      }
    } else if (G.state === "crash") {
      m.beam.visible = false;
      spotGlow.material.opacity = 0;
      if (spot) spot.intensity = 0;
      G.spin = Math.min(5, G.spin + dt * 3);
      G.yaw += G.spin * dt;
      G.vel.y -= 14 * dt;
      G.vel.x *= 1 - dt * 0.3;
      G.vel.z *= 1 - dt * 0.3;
      G.pos.addScaledVector(G.vel, dt);
      m.g.rotation.set(0.3, G.yaw, 0.4, "YXZ");
      Z.fx.smoke(G.pos, 2, 1.2, 0.05, 1, 3);
      Z.fx.fire(G.pos, 3, 1, 1);
      const floor = Z.groundAt(G.pos.x, G.pos.z, G.pos.y + 1);
      if (G.pos.y <= floor + 1 || Z.solidAt(G.pos.x, G.pos.y - 1, G.pos.z)) {
        G.pos.y = Math.max(floor + 0.8, G.pos.y);
        Z.explode(G.pos, 13, 420, { src: "player", big: 2.2, self: 0.6 });
        G.state = "wreck";
        G.alive = false;
        G.deadT = 0;
        m.g.rotation.set(0.25, G.yaw, 1.2, "YXZ");
        m.g.traverse((o) => {
          if (!o.isMesh || !o.material) return;
          if (o.material.transparent) o.visible = false;
          else o.material = BLACK;
        });
        G.snd.stop();
      }
    } else if (G.state === "wreck") {
      G.deadT += dt;
      if (Math.random() < dt * 30) Z.fx.fire(G.pos, 1, 1.3, 2.2);
      if (Math.random() < dt * 5) Z.fx.smoke(_v.copy(G.pos).setY(G.pos.y + 2), 1, 1.5, 0.05, 2.5, 6);
      if (G.deadT > 30) {
        scene.remove(m.g);
        scene.remove(m.beam);
        list.splice(list.indexOf(G), 1);
        G = null;
        return;
      }
    }
    m.g.position.copy(G.pos);
    if (G && G.state !== "wreck") G.snd.set(G.pos, 0.9, 13 + Math.min(4, G.vel.length() * 0.1));
  }

  // ---- 🛸 kamikaze drones ---------------------------------------------------------------------------
  const drones = [];
  const rotorDisc = new THREE.CircleGeometry(0.24, 16).rotateX(-Math.PI / 2);
  const discMat = ADD(0x888888, 0.25);
  function droneModel() {
    const g = new THREE.Group();
    mesh(new THREE.BoxGeometry(0.42, 0.14, 0.42), BLACK, g);
    mesh(new THREE.SphereGeometry(0.09, 8, 6), GLASS, g, 0, -0.08, 0.18);
    const discs = [];
    for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const arm = mesh(new THREE.BoxGeometry(0.5, 0.04, 0.05), GREY, g, x * 0.2, 0.03, z * 0.2);
      arm.rotation.y = x * z > 0 ? -Math.PI / 4 : Math.PI / 4;
      const d = new THREE.Mesh(rotorDisc, discMat);
      d.position.set(x * 0.36, 0.08, z * 0.36);
      g.add(d);
      discs.push(d);
    }
    const led = mesh(new THREE.SphereGeometry(0.05, 6, 5), REDL, g, 0, 0.1, 0);
    // a little payload of explosives
    mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.22, 8), M(0x4a5233), g, 0, -0.14, 0).rotation.z = Math.PI / 2;
    g.scale.setScalar(1.6);
    scene.add(g);
    return { g, discs, led };
  }
  A.spawnDrones = (n) => {
    const p = Z.ppos();
    const a0 = Math.random() * 6.283;
    for (let i = 0; i < n; i++) {
      const a = a0 + R(-0.5, 0.5);
      const d = {
        kind: "drone",
        m: droneModel(),
        pos: new THREE.Vector3(p.x + Math.cos(a) * R(90, 120), R(28, 40), p.z + Math.sin(a) * R(90, 120)),
        vel: new THREE.Vector3(),
        hp: 25,
        alive: true,
        radius: 0.9,
        beepT: 1,
        snd: drones.length < 3 ? Z.sfx.loop("drone", _v.set(0, 0, 0)) : null,
        ph: Math.random() * 6,
      };
      d.damage = (dmg) => {
        if (!d.alive) return;
        d.hp -= dmg;
        if (d.hp <= 0) killDrone(d, true);
      };
      drones.push(d);
      list.push(d);
    }
    Z.hud.warn(`⚠ ${n > 1 ? n + " DRONES" : "DRONE"} INCOMING`, 3);
  };
  function killDrone(d, shot) {
    d.alive = false;
    scene.remove(d.m.g);
    if (d.snd) d.snd.stop();
    drones.splice(drones.indexOf(d), 1);
    list.splice(list.indexOf(d), 1);
    if (shot) {
      Z.player.score += 150;
      Z.hud.feed("🛸 Drone");
      Z.explode(d.pos, 3.5, 90, { src: "player", self: 0.4, big: 0.6 });
    } else Z.explode(d.pos, 4.5, 34, { src: "enemy", big: 0.8 });
  }
  function updateDrones(dt) {
    const pc = Z.pchest(_pc);
    for (let i = drones.length - 1; i >= 0; i--) {
      const d = drones[i];
      d.ph += dt;
      _v.subVectors(pc, d.pos);
      const dist = _v.length();
      const hd = Math.hypot(_v.x, _v.z);
      // high until close, then down to her chest
      const tgtY = hd > 28 ? Math.max(pc.y + 10, skyFloor(d.pos.x, d.pos.z) + 8) : pc.y;
      _v2.set(_v.x, tgtY - d.pos.y, _v.z).normalize().multiplyScalar(hd > 28 ? 15 : 12);
      _v2.x += Math.sin(d.ph * 3.1) * 1.5;
      _v2.y += Math.sin(d.ph * 4.3) * 0.8;
      d.vel.lerp(_v2, Math.min(1, dt * 2));
      d.pos.addScaledVector(d.vel, dt);
      if (Z.solidAt(d.pos.x, d.pos.y, d.pos.z)) d.pos.y += 8 * dt + 0.3;
      d.m.g.position.copy(d.pos);
      d.m.g.rotation.set(d.vel.z * 0.03, Math.atan2(d.vel.x, d.vel.z), -d.vel.x * 0.03);
      for (const disc of d.m.discs) disc.rotation.y += dt * 50;
      // beep faster as it comes
      d.beepT -= dt;
      const rate = Z.clamp(dist / 40, 0.08, 1);
      d.m.led.visible = d.beepT > rate * 0.5;
      if (d.beepT <= 0) {
        d.beepT = rate;
        if (dist < 50) Z.sfx.beep(d.pos, 0.15);
      }
      if (d.snd) d.snd.set(d.pos, 0.35, 200 + Math.min(80, d.vel.length() * 4));
      if (dist < 1.9 && !Z.player.dead) killDrone(d, false);
      else if (dist > 260) {
        scene.remove(d.m.g);
        if (d.snd) d.snd.stop();
        drones.splice(i, 1);
        list.splice(list.indexOf(d), 1);
      }
    }
  }

  // ---- ✈️ jets: enemy bombing runs and her own air strike -------------------------------------------
  function jetModel(friendly) {
    const g = new THREE.Group();
    const body = friendly ? LIGHTGREY : GREY;
    const f = mesh(new THREE.CylinderGeometry(0.55, 0.75, 11, 12), body, g);
    f.rotation.x = Math.PI / 2;
    const nose = mesh(new THREE.ConeGeometry(0.55, 3, 12), body, g, 0, 0, 7);
    nose.rotation.x = Math.PI / 2;
    mesh(new THREE.SphereGeometry(0.5, 10, 8).scale(0.8, 0.7, 2), GLASS, g, 0, 0.5, 3.5);
    const wing = new THREE.Shape();
    wing.moveTo(0, 2.5);
    wing.lineTo(6, -2.5);
    wing.lineTo(-6, -2.5);
    wing.closePath();
    const wg = new THREE.ExtrudeGeometry(wing, { depth: 0.15, bevelEnabled: false }).rotateX(Math.PI / 2);
    mesh(wg, body, g, 0, 0, -0.5);
    mesh(new THREE.BoxGeometry(0.12, 2.2, 1.8), body, g, 0.9, 1.1, -4.6).rotation.z = -0.3;
    mesh(new THREE.BoxGeometry(0.12, 2.2, 1.8), body, g, -0.9, 1.1, -4.6).rotation.z = 0.3;
    const burner = mesh(new THREE.ConeGeometry(0.6, 3.5, 12, 1, true), ADD(friendly ? 0x6ab0ff : 0xff9a4a, 0.75), g, 0, 0, -7.2);
    burner.rotation.x = -Math.PI / 2;
    burner.castShadow = false;
    mesh(new THREE.SphereGeometry(0.12, 6, 5), friendly ? BLUEL : REDL, g, 6, 0, -2.5);
    mesh(new THREE.SphereGeometry(0.12, 6, 5), friendly ? BLUEL : REDL, g, -6, 0, -2.5);
    for (const s of [-1, 1]) {
      const b = mesh(new THREE.CylinderGeometry(0.2, 0.2, 2, 8), BLACK, g, s * 2.8, -0.4, -0.6);
      b.rotation.x = Math.PI / 2;
    }
    scene.add(g);
    return g;
  }
  const runs = [];
  const bombs = [];
  const bombGeo = new THREE.CylinderGeometry(0.22, 0.22, 1.3, 8).rotateX(Math.PI / 2);
  function startRun(center, yaw, friendly, delay) {
    const dir = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    let alt = 75;
    for (let s = -420; s <= 420; s += 30) alt = Math.max(alt, skyFloor(center.x + dir.x * s, center.z + dir.z * s) + 25);
    // the strip on the street that's about to burn
    let strip = null;
    if (!friendly) {
      strip = new THREE.Mesh(new THREE.PlaneGeometry(14, 120).rotateX(-Math.PI / 2), ADD(0xff2010, 0.0));
      strip.rotation.y = yaw;
      strip.position.set(center.x, Z.groundAt(center.x, center.z, center.y + 2) + 0.12, center.z);
      strip.renderOrder = 2;
      scene.add(strip);
    }
    const targets = [];
    for (let s = -55; s <= 55; s += 10) {
      const x = center.x + dir.x * s + R(-2, 2),
        z = center.z + dir.z * s + R(-2, 2);
      targets.push({ s, p: new THREE.Vector3(x, Z.groundAt(x, z, 999), z), dropped: false });
    }
    const run = { dir, center: center.clone(), alt, t: -delay, friendly, strip, targets, jet: null, speed: 140, snd: null, whistled: false };
    run.entry = { kind: "jet", friendly, alive: true, pos: null, radius: 4.5, hp: 700 };
    run.entry.damage = (d) => {
      if (friendly || !run.jet) return;
      run.entry.hp -= d;
      if (run.entry.hp <= 0) {
        Z.explode(run.entry.pos, 10, 200, { src: "player", big: 1.8, self: 0.3 });
        Z.player.score += 1500;
        Z.hud.banner("JET DOWN", "+1500", 2.4);
        scene.remove(run.jet);
        run.jet = null;
        run.dead = true;
        run.entry.alive = false;
      }
    };
    runs.push(run);
    return run;
  }
  A.bombingRun = () => {
    const p = Z.ppos();
    startRun(p.clone(), Math.random() * 6.283, false, 4);
    Z.hud.warn("⚠ AIRSTRIKE INCOMING - MOVE!", 4.5);
    Z.sfx.siren();
  };
  A.friendlyStrike = (point, yaw) => {
    startRun(point, yaw, true, 2.5);
    for (let i = 0; i < 20; i++)
      Z.fx.norm.spawn(point.x, point.y + 0.3, point.z, R(-0.4, 0.4), R(1, 2.5), R(-0.4, 0.4), R(2.5, 4), 0.4, R(2, 3.5), [0.8, 0.12, 0.08, 0.7], [0.5, 0.15, 0.12, 0], -0.1, 0.4, 0, -99);
  };
  function updateRuns(dt) {
    for (let i = runs.length - 1; i >= 0; i--) {
      const r = runs[i];
      r.t += dt;
      if (r.strip) r.strip.material.opacity = r.t < 0 ? 0.18 + 0.14 * Math.sin(Z.t * 12) : Math.max(0, 0.3 - r.t * 0.2);
      if (r.t < -1.5 || r.dead) {
        if (r.dead && r.t > 6) {
          if (r.strip) scene.remove(r.strip);
          if (r.snd) r.snd.stop();
          list.splice(list.indexOf(r.entry), 1);
          runs.splice(i, 1);
        }
        continue;
      }
      if (!r.jet) {
        r.jet = jetModel(r.friendly);
        r.snd = Z.sfx.loop("jet", _v.set(0, 0, 0));
        r.entry.pos = new THREE.Vector3();
        list.push(r.entry);
      }
      // along the line: from 420 m before the centre to 420 m past it
      const s = -420 + (r.t + 1.5) * r.speed;
      const jp = r.entry.pos.set(r.center.x + r.dir.x * s, r.alt, r.center.z + r.dir.z * s);
      r.jet.position.copy(jp);
      r.jet.rotation.set(0, Math.atan2(r.dir.x, r.dir.z), Math.sin(r.t * 2) * 0.05);
      const camD = jp.distanceTo(Z.camera.position);
      r.snd.set(jp, Math.min(1.4, 160 / Math.max(30, camD)), 500 + Math.max(0, 1600 - camD * 6));
      // bombs leave when the jet is just before each mark
      for (const tg of r.targets) {
        if (tg.dropped || s < tg.s - 75) continue;
        tg.dropped = true;
        const m = new THREE.Mesh(bombGeo, BLACK);
        m.position.copy(jp);
        scene.add(m);
        bombs.push({ m, from: jp.clone(), to: tg.p, t: 0, dur: 1.5, friendly: r.friendly });
        if (!r.whistled) {
          r.whistled = true;
          Z.sfx.whistle(tg.p);
        }
      }
      if (s > 430) {
        scene.remove(r.jet);
        r.jet = null;
        r.snd.stop();
        if (r.strip) scene.remove(r.strip);
        list.splice(list.indexOf(r.entry), 1);
        runs.splice(i, 1);
      }
    }
    for (let i = bombs.length - 1; i >= 0; i--) {
      const b = bombs[i];
      b.t += dt;
      const u = Math.min(1, b.t / b.dur);
      b.m.position.lerpVectors(b.from, b.to, u);
      b.m.position.y = THREE.MathUtils.lerp(b.from.y, b.to.y, u * u);
      b.m.lookAt(_v.copy(b.to));
      if (u >= 1) {
        scene.remove(b.m);
        bombs.splice(i, 1);
        Z.explode(b.to, 7.5, b.friendly ? 240 : 170, { src: b.friendly ? "player" : "enemy", big: 1.2, self: b.friendly ? 0.5 : 1 });
      }
    }
  }

  // ---- 📦 the supply plane ------------------------------------------------------------------------
  const cargo = [];
  function cargoModel() {
    const g = new THREE.Group();
    const f = mesh(new THREE.CylinderGeometry(1.8, 1.6, 22, 14), M(0x5a6450), g);
    f.rotation.x = Math.PI / 2;
    const n = mesh(new THREE.SphereGeometry(1.8, 14, 10), M(0x5a6450), g, 0, 0, 11);
    n.scale.z = 1.4;
    mesh(new THREE.BoxGeometry(30, 0.4, 3.6), M(0x4a5442), g, 0, 1.6, 1);
    for (const x of [-10, -5, 5, 10]) {
      const e = mesh(new THREE.CylinderGeometry(0.6, 0.6, 2.6, 10), BLACK, g, x, 1.0, 2.2);
      e.rotation.x = Math.PI / 2;
    }
    mesh(new THREE.BoxGeometry(0.4, 5, 3.4), M(0x4a5442), g, 0, 3.2, -10);
    mesh(new THREE.BoxGeometry(11, 0.3, 2.6), M(0x4a5442), g, 0, 1.2, -10);
    mesh(new THREE.SphereGeometry(0.2, 6, 5), REDL, g, -15, 1.6, 1);
    mesh(new THREE.SphereGeometry(0.2, 6, 5), GREENL, g, 15, 1.6, 1);
    scene.add(g);
    return g;
  }
  A.supplyDrop = () => {
    const p = Z.ppos();
    let drop = null;
    for (let t = 0; t < 20 && !drop; t++) {
      const a = Math.random() * 6.283,
        d = R(22, 42);
      const x = p.x + Math.cos(a) * d,
        z = p.z + Math.sin(a) * d;
      if (Z.freeSpot(x, z, 2)) drop = new THREE.Vector3(x, 0, z);
    }
    if (!drop) return;
    const yaw = Math.random() * 6.283;
    const dir = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    let alt = 110;
    for (let s = -500; s <= 500; s += 40) alt = Math.max(alt, skyFloor(drop.x + dir.x * s, drop.z + dir.z * s) + 30);
    const c = { g: cargoModel(), drop, dir, alt, s: -520, dropped: false, snd: Z.sfx.loop("rotor", _v.set(0, 0, 0)) };
    c.entry = { kind: "cargo", friendly: true, alive: true, pos: new THREE.Vector3(), radius: 0 };
    list.push(c.entry);
    cargo.push(c);
    Z.hud.toast("📦 SUPPLY DROP INCOMING", "#ffe14a");
  };
  function updateCargo(dt) {
    for (let i = cargo.length - 1; i >= 0; i--) {
      const c = cargo[i];
      c.s += dt * 45;
      const p = c.entry.pos.set(c.drop.x + c.dir.x * c.s, c.alt, c.drop.z + c.dir.z * c.s);
      c.g.position.copy(p);
      c.g.rotation.y = Math.atan2(c.dir.x, c.dir.z);
      c.snd.set(p, 0.5, 9);
      if (!c.dropped && c.s >= 0) {
        c.dropped = true;
        Z.pickups.addDrop(c.drop.x, c.drop.z, c.alt - 4);
      }
      if (c.s > 520) {
        scene.remove(c.g);
        c.snd.stop();
        list.splice(list.indexOf(c.entry), 1);
        cargo.splice(i, 1);
      }
    }
  }

  // ---- shooting at them ----------------------------------------------------------------------------
  const hit = { a: null, t: 0, point: new THREE.Vector3() };
  A.hitTest = (o, d, maxT) => {
    hit.a = null;
    let best = maxT;
    for (const a of list) {
      if (!a.alive || a.friendly || !a.pos || !a.radius) continue;
      const c = a.pos;
      const ox = o.x - c.x,
        oy = o.y - c.y,
        oz = o.z - c.z;
      const b = ox * d.x + oy * d.y + oz * d.z;
      const disc = b * b - (ox * ox + oy * oy + oz * oz - a.radius * a.radius);
      if (disc < 0) continue;
      const t = -b - Math.sqrt(disc);
      if (t > 0 && t < best) {
        best = t;
        hit.a = a;
        hit.t = t;
      }
    }
    if (!hit.a) return null;
    hit.point.copy(o).addScaledVector(d, hit.t);
    return hit;
  };
  A.nearestAhead = (pos, vel, cosMin) => {
    let best = null,
      bc = cosMin;
    const vl = vel.length() || 1;
    for (const a of list) {
      if (!a.alive || a.friendly || !a.pos || !a.radius) continue;
      _v.subVectors(a.pos, pos);
      const l = _v.length();
      if (l > 260) continue;
      const c = _v.dot(vel) / (l * vl);
      if (c > bc) {
        bc = c;
        best = a.pos;
      }
    }
    return best;
  };
  A.blast = (p, r, dmg) => {
    for (const a of [...list]) {
      if (!a.alive || a.friendly || !a.pos || !a.radius) continue;
      const d = a.pos.distanceTo(p);
      if (d < r + a.radius) a.damage(dmg * (1 - d / (r + a.radius)), p);
    }
  };

  A.update = (dt) => {
    updateGunship(dt);
    updateERockets(dt);
    updateDrones(dt);
    updateRuns(dt);
    updateCargo(dt);
    if (!G || G.state !== "orbit") {
      spotGlow.material.opacity = 0;
      if (spot) spot.intensity = 0;
      if (G) G.m.beam.visible = false;
    }
  };
}
