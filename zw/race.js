// 🏁 ROMBIE WORLD's race: a loop of glowing gates through Rose Island's
// streets. She starts in her violet car on the line beside the rose plaza;
// three laps against the clock - and every zombie she takes out knocks time
// off the lap (a giant: five whole seconds). Her car carries a pair of
// machine guns on the roof: hold the left mouse button (or the 🔥 button on a
// phone) and they rake the road ahead. Nothing here is hard: no time limit,
// no losing - just the best lap to beat.
import * as THREE from "three";

export function setupRace(Z) {
  const { api, scene } = Z;
  const touch = api.isTouch;
  const R = Z.rnd;
  const P = Z.player;

  // ---- the circuit ------------------------------------------------------------------
  // street crossings, clockwise round downtown, back to the line by the plaza
  const START = { x: -96, z: -48, yaw: Math.PI }; // (facing down the street, south)
  const PTS = [
    [-96, -160],
    [32, -160],
    [160, -160],
    [224, -64],
    [224, 96],
    [128, 160],
    [0, 160],
    [-32, 64],
    [-32, -32],
    [START.x, START.z], // the finish line
  ];
  const N = PTS.length;
  const LAPS = 3;
  const RING = 7; // a gate's radius
  const PASS = 11.5; // this close counts as through it

  const RS = (Z.race = {
    state: "idle", // 'count' → 'run' → 'done' → 'run' (the next race)
    race: 1,
    lap: 1,
    next: 0, // the gate she's heading for
    lapStart: 0,
    lapBonus: 0, // seconds her kills took off this lap
    raceStart: 0,
    raceBonus: 0,
    laps: [],
    best: 0,
    kills: 0,
    fireTouch: false,
    fireMouse: false,
  });
  try {
    RS.best = +localStorage.getItem("rombie-best-lap") || 0;
  } catch (e) {}

  // ---- the gates: an upright neon ring across the street + a beam to the sky ----------------
  const ringGeo = new THREE.TorusGeometry(RING, 0.42, 10, 56);
  const beamGeo = new THREE.CylinderGeometry(1.1, 1.1, 220, 12, 1, true).translate(0, 110 + RING * 2, 0);
  const COL = { next: new THREE.Color(2.2, 0.35, 1.3), after: new THREE.Color(0.25, 0.9, 1.6), finish: new THREE.Color(2.4, 1.9, 0.5) };
  const gates = PTS.map(([x, z], i) => {
    const [px, pz] = i === 0 ? [START.x, START.z] : PTS[i - 1];
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = Math.atan2(x - px, z - pz);
    const ringMat = new THREE.MeshBasicMaterial({ color: COL.next, toneMapped: false });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = RING + 0.6;
    const beamMat = new THREE.MeshBasicMaterial({
      color: COL.next,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
      side: THREE.DoubleSide,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    g.add(ring, beam);
    // the finish: a chequered banner across the top of the ring
    if (i === N - 1) g.add(chequer());
    g.visible = false;
    scene.add(g);
    return { g, ring, ringMat, beam, beamMat, x, z };
  });
  function chequer() {
    const cv = document.createElement("canvas");
    cv.width = 512;
    cv.height = 128;
    const c = cv.getContext("2d");
    for (let y = 0; y < 4; y++) for (let x = 0; x < 16; x++) {
      c.fillStyle = (x + y) % 2 ? "#111" : "#f4f4f4";
      c.fillRect(x * 32, y * 32, 32, 32);
    }
    c.fillStyle = "rgba(0,0,0,0.55)";
    c.fillRect(150, 30, 212, 68);
    c.font = '900 52px Impact, "Arial Black", sans-serif';
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillStyle = "#ffd23a";
    c.fillText("FINISH", 256, 66);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(13, 3.25), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, toneMapped: false }));
    m.position.y = RING * 2 + 2.6;
    return m;
  }
  function showGates() {
    gates.forEach((G, i) => {
      const isNext = i === RS.next,
        isAfter = i === (RS.next + 1) % N;
      G.g.visible = RS.state !== "idle" && (isNext || isAfter);
      const c = isNext ? (i === N - 1 ? COL.finish : COL.next) : COL.after;
      G.ringMat.color.copy(c);
      G.beamMat.color.copy(c);
      G.beamMat.opacity = isNext ? 0.26 : 0.1;
      G.ring.scale.setScalar(isNext ? 1 : 0.8);
    });
  }

  // ---- the race HUD ------------------------------------------------------------------------------
  const css = document.createElement("style");
  css.textContent = `
  #zr { position: fixed; left: 18px; top: 16px; z-index: 14; display: none; pointer-events: none; color: #fff; font-family: Impact, "Arial Black", sans-serif; text-shadow: 0 2px 4px #000; min-width: 190px; }
  body.zw-on #zr { display: block; }
  #zr .top { font-size: 15px; letter-spacing: 1.5px; color: #ffd23a; }
  #zr .top b { color: #ff4fa8; font-weight: 400; margin-left: 10px; }
  #zr .tm { font-size: 40px; line-height: 1.05; letter-spacing: 1px; }
  #zr .tm small { font-size: 20px; color: #7dff9a; margin-left: 8px; opacity: 0; transition: opacity 0.3s; }
  #zr .tm small.on { opacity: 1; }
  #zr .bst { font: 700 12px sans-serif; color: #e9dcc8; letter-spacing: 0.5px; }
  #zr .dir { display: flex; align-items: center; gap: 10px; margin-top: 8px; font: 700 14px sans-serif; color: #fff; }
  #zr .dir i { display: inline-block; width: 0; height: 0; border-left: 13px solid transparent; border-right: 13px solid transparent; border-bottom: 30px solid #ff4fa8; filter: drop-shadow(0 0 6px rgba(255, 80, 170, 0.9)); transform-origin: 50% 60%; }
  #zr .hint { margin-top: 6px; font: 700 12px sans-serif; color: #ffcf6a; display: none; }
  #zr .hint.on { display: block; }
  #zr-count { position: fixed; left: 0; right: 0; top: 30%; z-index: 16; text-align: center; pointer-events: none; font: 400 150px/1 Impact, "Arial Black", sans-serif; color: #fff; text-shadow: 0 0 30px currentColor, 0 6px 0 #000; opacity: 0; }
  #zr-count.go { animation: zrpop 0.9s ease-out forwards; }
  @keyframes zrpop { 0% { opacity: 1; transform: scale(1.6); } 60% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(0.9); } }
  body.touch #zr { left: 14px; top: 58px; min-width: 150px; }
  body.touch #zr .tm { font-size: 28px; }
  body.touch #zr .top { font-size: 12px; }
  body.touch #zr-count { font-size: 100px; }
  `;
  document.head.appendChild(css);
  const hud = document.createElement("div");
  hud.id = "zr";
  hud.innerHTML = `<div class="top"><span class="lp">LAP 1/${LAPS}</span><b class="cp">GATE 1/${N}</b></div>
    <div class="tm"><span class="t">0:00.0</span><small class="bn"></small></div>
    <div class="bst">BEST LAP —</div>
    <div class="dir"><i></i><span class="ds"></span></div>
    <div class="hint">🚗 F / the car button - back in the car</div>`;
  document.body.appendChild(hud);
  const el = {
    lp: hud.querySelector(".lp"),
    cp: hud.querySelector(".cp"),
    t: hud.querySelector(".t"),
    bn: hud.querySelector(".bn"),
    bst: hud.querySelector(".bst"),
    arrow: hud.querySelector(".dir i"),
    ds: hud.querySelector(".ds"),
    hint: hud.querySelector(".hint"),
  };
  const count = document.createElement("div");
  count.id = "zr-count";
  document.body.appendChild(count);
  function bigText(txt, color) {
    count.textContent = txt;
    count.style.color = color;
    count.classList.remove("go");
    void count.offsetWidth;
    count.classList.add("go");
  }
  const fmt = (s) => {
    s = Math.max(0, s);
    const m = Math.floor(s / 60);
    return `${m}:${(s - m * 60).toFixed(1).padStart(4, "0")}`;
  };
  let bonusShown = 0,
    bonusT = 0;
  function bonus(secs) {
    if (RS.state !== "run") return;
    RS.lapBonus += secs;
    RS.raceBonus += secs;
    bonusShown = Z.rt - bonusT < 1.2 ? bonusShown + secs : secs;
    bonusT = Z.rt;
    el.bn.textContent = `−${bonusShown.toFixed(1)}s`;
    el.bn.classList.add("on");
  }

  // ---- her car on the line ---------------------------------------------------------------------
  function placeCar(x, z, yaw) {
    const c = api.car;
    c.pos.set(x, 0, z);
    c.yaw = yaw;
    c.speed = 0;
    c.steer = 0;
    c.slip = 0;
    c.vy = 0;
    c.g.position.copy(c.pos);
    c.g.rotation.set(0, yaw, 0, "YXZ");
  }
  function intoCar(x, z, yaw) {
    if (api.vehMode !== "walk") api.exitVehicle();
    placeCar(x, z, yaw);
    api.girl.pos.set(x + Math.cos(yaw) * 2.4, 0, z - Math.sin(yaw) * 2.4);
    api.enterCar(api.car);
  }
  // where she rejoins after a fall: the last gate she went through, facing the next
  RS.respawn = () => {
    const [px, pz] = RS.next === 0 ? [START.x, START.z] : PTS[RS.next - 1];
    const [nx, nz] = PTS[RS.next];
    intoCar(px, pz, Math.atan2(nx - px, nz - pz));
  };

  // ---- start · gates · laps ------------------------------------------------------------------------
  let countT = 0,
    countStep = 0;
  RS.start = () => {
    intoCar(START.x, START.z, START.yaw);
    RS.state = "count";
    RS.next = 0;
    RS.lap = 1;
    countT = 0;
    countStep = 0;
    showGates();
    Z.hud.banner("ROMBIE WORLD", "Drive through the glowing gates · run them over · mind the giants", 4.5);
    // a giant waits down the first street, on the left
    setTimeout(() => Z.zombies.spawnGiant(-64, -128), 600);
  };
  function go() {
    RS.state = "run";
    RS.lapStart = RS.raceStart = Z.rt;
    RS.lapBonus = RS.raceBonus = 0;
    RS.laps = [];
  }
  function passGate() {
    const finish = RS.next === N - 1;
    Z.sfx.gate(finish);
    if (!finish) {
      RS.next++;
      Z.hud.pop(`GATE ${RS.next}/${N}`, "#ff7ad0");
      showGates();
      return;
    }
    // a lap
    const lt = Math.max(0, Z.rt - RS.lapStart - RS.lapBonus);
    RS.laps.push(lt);
    let rec = false;
    if (!RS.best || lt < RS.best) {
      RS.best = lt;
      rec = true;
      try {
        localStorage.setItem("rombie-best-lap", String(lt));
      } catch (e) {}
    }
    RS.next = 0;
    RS.lapStart = Z.rt;
    RS.lapBonus = 0;
    if (RS.lap >= LAPS) {
      const total = Math.max(0, Z.rt - RS.raceStart - RS.raceBonus);
      Z.hud.banner("🏁 RACE " + RS.race + " DONE", `Time ${fmt(total)} · best lap ${fmt(Math.min(...RS.laps))} · ☠ ${RS.kills}${rec ? " · NEW RECORD!" : ""}`, 6);
      Z.slowmo(0.4, 1.2);
      RS.state = "done";
      RS.doneT = Z.rt;
    } else {
      RS.lap++;
      Z.hud.banner(rec ? "NEW BEST LAP!" : `LAP ${RS.lap}/${LAPS}`, `Last lap ${fmt(lt)}`, 2.6);
    }
    showGates();
  }

  // ---- kills take time off ------------------------------------------------------------------------
  const rk = [];
  RS.onKill = (zb) => {
    RS.kills++;
    bonus(zb.def.giant ? 5 : zb.def.big ? 2 : 0.5);
  };
  let bloodyT = 0;
  RS.roadkill = (zb, spd) => {
    bloodyT = 2.2; // 🩸 the tyres leave red tracks for a while
    const now = Z.rt;
    rk.push(now);
    while (rk.length && now - rk[0] > 1.6) rk.shift();
    if (rk.length === 3) {
      Z.slowmo(0.35, 0.7);
      setTimeout(() => Z.hud.pop("CARNAGE!", "#ff3a2a"), 300);
    } else if (rk.length === 6) {
      Z.slowmo(0.3, 0.9);
      setTimeout(() => Z.hud.pop("MASSACRE!", "#ff3a2a"), 300);
    }
  };

  // ---- the car's roof guns ------------------------------------------------------------------------------
  const gunMat = new THREE.MeshStandardMaterial({ color: 0x2c2e33, metalness: 0.8, roughness: 0.35 });
  const guns = new THREE.Group();
  for (const s of [-1, 1]) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.17, 0.72), gunMat);
    body.position.set(0.42 * s, 1.6, 0.1);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.8, 8).rotateX(Math.PI / 2), gunMat);
    barrel.position.set(0.42 * s, 1.63, 0.82);
    const mount = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.22, 0.14), gunMat);
    mount.position.set(0.42 * s, 1.47, 0.05);
    guns.add(body, barrel, mount);
  }
  api.car.g.add(guns);
  const canFire = () => api.vehMode === "car" && api.started && Z.entered && !api.uiPaused && !P.dead;
  addEventListener("mousedown", (e) => {
    if (e.button === 0 && canFire() && (e.target === api.canvas || document.pointerLockElement)) RS.fireMouse = true;
  });
  addEventListener("mouseup", (e) => {
    if (e.button === 0) RS.fireMouse = false;
  });
  let gunCool = 0,
    gunSide = 1,
    gunN = 0;
  const _o = new THREE.Vector3(),
    _d = new THREE.Vector3(),
    _f = new THREE.Vector3(),
    _e = new THREE.Vector3(),
    _a = new THREE.Vector3();
  function aimTarget(o, f) {
    let best = null,
      bc = 0.94;
    for (const zb of Z.zombies.list) {
      if (!zb.alive) continue;
      _a.set(zb.pos.x, zb.pos.y + (zb.def.giant ? 1.1 : 1.4) * zb.scale, zb.pos.z).sub(o);
      const l = _a.length();
      if (l > 110 || l < 2) continue;
      const c = _a.dot(f) / l;
      if (c > bc) {
        bc = c;
        best = zb;
      }
    }
    return best;
  }
  function shoot() {
    const d = api.drv;
    d.g.updateMatrixWorld(true);
    gunSide = -gunSide;
    guns.localToWorld(_o.set(0.42 * gunSide, 1.63, 1.25));
    _f.set(Math.sin(d.yaw), 0, Math.cos(d.yaw));
    const tgt = aimTarget(_o, _f);
    if (tgt) _d.set(tgt.pos.x, tgt.pos.y + (tgt.def.giant ? 1.1 : 1.4) * tgt.scale, tgt.pos.z).sub(_o).normalize();
    else _d.copy(_f).setY(-0.012).normalize();
    _d.x += R(-0.012, 0.012);
    _d.y += R(-0.008, 0.008);
    _d.z += R(-0.012, 0.012);
    _d.normalize();
    const wallT = Z.rayCast(_o, _d, 140, 0.9);
    const kind = Z.hitKind;
    const h = Z.zombies.hitTest(_o, _d, wallT);
    const ah = Z.aircraft.hitTest(_o, _d, h ? h.t : wallT);
    let end = wallT;
    if (ah) {
      ah.a.damage(30, ah.point);
      Z.fx.sparks(ah.point, 6, 8);
      end = ah.t;
    } else if (h) {
      const head = h.part === "head";
      Z.zombies.damage(h.zb, 30 * (head ? 2.6 : h.part === "legs" ? 0.7 : 1) * R(0.92, 1.08), {
        dir: _d.clone(),
        part: head ? "head" : "body",
        point: h.point.clone(),
        decap: 0.55,
        knock: 2.5,
      });
      if (h.zb.alive) Z.hud.hitmark(head ? "head" : "hit");
      end = h.t;
    } else if (kind === "wall" || kind === "ground") {
      _e.copy(_o).addScaledVector(_d, end);
      Z.fx.sparks(_e, 3, 6);
      if (kind === "ground") Z.fx.dust(_e, 1, 0.2);
    }
    _e.copy(_o).addScaledVector(_d, end);
    Z.fx.muzzle(_o, 0.6);
    if (gunN++ % 2 === 0) Z.fx.tracer(_o, _e, [3, 2.1, 0.9], 420, 9);
    Z.sfx.shot("minigun", _o);
    if (gunN % 4 === 0) Z.zombies.noise(_o, 70);
  }

  // ---- per frame ------------------------------------------------------------------------------------
  const _tr = new THREE.Vector3();
  let trackT = 0,
    hudT = 0;
  RS.update = (dt) => {
    if (RS.state === "idle") return;
    const inCar = api.vehMode === "car" && api.drv;
    document.body.classList.toggle("zw-incar", !!inCar);
    // her own car keeps the guns; whichever car she drives wears them
    const host = inCar ? api.drv.g : api.car.g;
    if (guns.parent !== host) host.add(guns);

    if (RS.state === "count") {
      countT += dt;
      if (inCar) api.drv.speed = 0; // (held on the line)
      const steps = [
        [0.9, "3", "#ff3a3a"],
        [1.9, "2", "#ffb03a"],
        [2.9, "1", "#ffe23a"],
        [3.9, "GO!", "#5dff7a"],
      ];
      if (countStep < steps.length && countT >= steps[countStep][0]) {
        const [, txt, col] = steps[countStep];
        bigText(txt, col);
        Z.sfx.raceBeep(txt === "GO!");
        countStep++;
        if (txt === "GO!") go();
      }
    } else if (RS.state === "done" && Z.rt - RS.doneT > 6) {
      // the next race starts right here, through the finish line
      RS.race++;
      RS.lap = 1;
      RS.kills = 0;
      bigText("GO!", "#5dff7a");
      Z.sfx.raceBeep(true);
      go();
      showGates();
    }

    // through the next gate?
    if (RS.state === "run" && !P.dead) {
      const p = Z.ppos();
      const [gx, gz] = PTS[RS.next];
      if (Math.hypot(p.x - gx, p.z - gz) < PASS && p.y < RING * 2 + 4) passGate();
    }
    // the gates breathe
    const pulse = 1 + Math.sin(Z.rt * 4) * 0.04;
    const G = gates[RS.next];
    G.ring.scale.setScalar(pulse);

    // the roof guns
    if (inCar && (RS.fireMouse || RS.fireTouch) && canFire()) {
      gunCool -= dt;
      while (gunCool <= 0) {
        shoot();
        gunCool += 1 / 14;
      }
    } else gunCool = Math.max(0, gunCool - dt);
    if (!inCar) RS.fireMouse = false;

    // 🩸 red tyre tracks after a roadkill
    if (bloodyT > 0 && inCar) {
      bloodyT -= dt;
      trackT -= dt;
      const d = api.drv;
      if (trackT <= 0 && Math.abs(d.speed) > 3) {
        trackT = 0.1;
        const fx = Math.sin(d.yaw),
          fz = Math.cos(d.yaw);
        for (const s of [-1, 1]) {
          _tr.set(d.pos.x - fx * 1.5 + fz * 0.85 * s, 0, d.pos.z - fz * 1.5 - fx * 0.85 * s);
          Z.fx.bloodPool(_tr.x, _tr.z, R(0.3, 0.45) * Math.min(1, bloodyT), d.pos.y);
        }
      }
    }

    // the panel (a few times a second is plenty)
    hudT -= dt;
    if (hudT > 0) return;
    hudT = 0.05;
    const running = RS.state === "run";
    el.lp.textContent = RS.race > 1 ? `RACE ${RS.race} · LAP ${RS.lap}/${LAPS}` : `LAP ${RS.lap}/${LAPS}`;
    el.cp.textContent = RS.next === N - 1 ? "FINISH ▸" : `GATE ${RS.next + 1}/${N}`;
    el.t.textContent = running ? fmt(Z.rt - RS.lapStart - RS.lapBonus) : RS.state === "done" ? "🏁" : "0:00.0";
    if (Z.rt - bonusT > 1.4) el.bn.classList.remove("on");
    el.bst.textContent = `BEST LAP ${RS.best ? fmt(RS.best) : "—"}`;
    // the arrow: where the next gate is from where the camera looks
    const p = Z.ppos();
    const [gx, gz] = PTS[RS.next];
    const dx = gx - p.x,
      dz = gz - p.z;
    const yaw = api.yaw,
      u = dx * Math.cos(yaw) - dz * Math.sin(yaw), // to the right
      v = -dx * Math.sin(yaw) - dz * Math.cos(yaw); // ahead
    el.arrow.style.transform = `rotate(${Math.atan2(u, v).toFixed(3)}rad)`;
    el.ds.textContent = `${Math.round(Math.hypot(dx, dz))} m`;
    el.hint.classList.toggle("on", running && api.vehMode === "walk");
  };

  // the radar: the next gate rides the rim in pink, the one after in blue; on
  // foot, her car in amber
  RS.radar = (proj, dot, rg) => {
    if (RS.state === "idle") return;
    const a = PTS[RS.next],
      b = PTS[(RS.next + 1) % N];
    const qb = proj(b[0], b[1], false);
    if (qb) dot(qb, 3.5, "rgba(90, 210, 255, 0.8)");
    const qa = proj(a[0], a[1], true);
    if (qa) {
      dot(qa, 5.5, "#ff4fa8");
      rg.strokeStyle = "#fff";
      rg.lineWidth = 1.5;
      rg.stroke();
    }
    if (api.vehMode === "walk") {
      const qc = proj(api.car.pos.x, api.car.pos.z, true);
      if (qc) {
        rg.fillStyle = "#ffb43a";
        rg.fillRect(qc[0] - 4, qc[1] - 3, 8, 6);
      }
    }
  };
}
