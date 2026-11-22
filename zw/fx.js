// 💥 effects: two particle clouds (one see-through - blood, smoke, dust - and
// one glowing - fire, sparks, muzzle light), blood & scorch decals on the
// street, bullet tracers, muzzle flashes, explosions and camera shake.
import * as THREE from "three";

const VERT = /* glsl */ `
  attribute vec4 pcolor;
  attribute float psize;
  uniform float uScale;
  uniform float uFogD;
  varying vec4 vC;
  varying float vFog;
  void main() {
    vC = pcolor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = psize * uScale / max(0.2, -mv.z);
    gl_Position = projectionMatrix * mv;
    float d = length(mv.xyz);
    vFog = 1.0 - exp(-uFogD * uFogD * d * d);
  }`;
const FRAG_NORMAL = /* glsl */ `
  uniform vec3 uFogC;
  varying vec4 vC;
  varying float vFog;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0 || vC.a < 0.003) discard;
    float a = vC.a * (1.0 - smoothstep(0.35, 1.0, d));
    gl_FragColor = vec4(mix(vC.rgb, uFogC, vFog), a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
const FRAG_ADD = /* glsl */ `
  varying vec4 vC;
  varying float vFog;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0 || vC.a < 0.003) discard;
    float a = vC.a * (1.0 - smoothstep(0.0, 1.0, d));
    gl_FragColor = vec4(vC.rgb * (1.0 - vFog), a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

// flags
const BOUNCE = 1,
  STICK = 2;

export class Cloud {
  constructor(max, additive, scene) {
    this.max = max;
    this.p = new Float32Array(max * 3);
    this.c = new Float32Array(max * 4);
    this.s = new Float32Array(max);
    this.v = new Float32Array(max * 3);
    this.c0 = new Float32Array(max * 4);
    this.c1 = new Float32Array(max * 4);
    this.s0 = new Float32Array(max);
    this.s1 = new Float32Array(max);
    this.age = new Float32Array(max).fill(1);
    this.life = new Float32Array(max).fill(1);
    this.g = new Float32Array(max);
    this.drag = new Float32Array(max);
    this.floor = new Float32Array(max);
    this.fl = new Uint8Array(max);
    this.next = 0;
    this.live = 0;
    const geo = new THREE.BufferGeometry();
    this.aP = new THREE.BufferAttribute(this.p, 3).setUsage(THREE.DynamicDrawUsage);
    this.aC = new THREE.BufferAttribute(this.c, 4).setUsage(THREE.DynamicDrawUsage);
    this.aS = new THREE.BufferAttribute(this.s, 1).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute("position", this.aP);
    geo.setAttribute("pcolor", this.aC);
    geo.setAttribute("psize", this.aS);
    this.uni = {
      uScale: { value: 400 },
      uFogD: { value: 0.01 },
      uFogC: { value: new THREE.Color(0x111111) },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uni,
      vertexShader: VERT,
      fragmentShader: additive ? FRAG_ADD : FRAG_NORMAL,
      transparent: true,
      depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = additive ? 3 : 2;
    scene.add(this.points);
  }
  spawn(x, y, z, vx, vy, vz, life, s0, s1, c0, c1, g = 0, drag = 0, fl = 0, floor = 0) {
    const i = this.next;
    this.next = (i + 1) % this.max;
    const i3 = i * 3,
      i4 = i * 4;
    this.p[i3] = x;
    this.p[i3 + 1] = y;
    this.p[i3 + 2] = z;
    this.v[i3] = vx;
    this.v[i3 + 1] = vy;
    this.v[i3 + 2] = vz;
    this.age[i] = 0;
    this.life[i] = life;
    this.s0[i] = s0;
    this.s1[i] = s1;
    for (let k = 0; k < 4; k++) {
      this.c0[i4 + k] = c0[k];
      this.c1[i4 + k] = c1[k];
    }
    this.g[i] = g;
    this.drag[i] = drag;
    this.fl[i] = fl;
    this.floor[i] = floor;
  }
  update(dt) {
    const { p, v, c, s, c0, c1, s0, s1, age, life, g, drag, fl, floor } = this;
    let live = 0;
    for (let i = 0; i < this.max; i++) {
      if (age[i] >= life[i]) {
        if (s[i] !== 0) s[i] = 0;
        continue;
      }
      live++;
      age[i] += dt;
      const u = Math.min(1, age[i] / life[i]);
      const i3 = i * 3,
        i4 = i * 4;
      const k = Math.max(0, 1 - drag[i] * dt);
      v[i3] *= k;
      v[i3 + 1] = v[i3 + 1] * k - g[i] * dt;
      v[i3 + 2] *= k;
      p[i3] += v[i3] * dt;
      p[i3 + 1] += v[i3 + 1] * dt;
      p[i3 + 2] += v[i3 + 2] * dt;
      if (p[i3 + 1] < floor[i] && v[i3 + 1] < 0) {
        p[i3 + 1] = floor[i];
        if (fl[i] & BOUNCE) {
          v[i3 + 1] *= -0.35;
          v[i3] *= 0.6;
          v[i3 + 2] *= 0.6;
        } else if (fl[i] & STICK) {
          v[i3] = v[i3 + 1] = v[i3 + 2] = 0;
          g[i] = 0;
        } else v[i3 + 1] = 0;
      }
      s[i] = s0[i] + (s1[i] - s0[i]) * u;
      c[i4] = c0[i4] + (c1[i4] - c0[i4]) * u;
      c[i4 + 1] = c0[i4 + 1] + (c1[i4 + 1] - c0[i4 + 1]) * u;
      c[i4 + 2] = c0[i4 + 2] + (c1[i4 + 2] - c0[i4 + 2]) * u;
      c[i4 + 3] = c0[i4 + 3] + (c1[i4 + 3] - c0[i4 + 3]) * u;
    }
    this.live = live;
    this.aP.needsUpdate = true;
    this.aC.needsUpdate = true;
    this.aS.needsUpdate = true;
  }
}

function canvasTex(size, draw) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  draw(cv.getContext("2d"), size);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function setupFx(Z) {
  const { scene, camera, api } = Z;
  const touch = api.isTouch;
  const norm = new Cloud(touch ? 1400 : 2800, false, scene);
  const glow = new Cloud(touch ? 900 : 1800, true, scene);
  const fx = (Z.fx = { norm, glow });
  const R = Z.rnd;

  // ---- decals: blood pools & scorch marks ---------------------------------------
  const splatTex = canvasTex(128, (g, S) => {
    g.clearRect(0, 0, S, S);
    g.fillStyle = "#fff";
    const blob = (x, y, r) => {
      g.beginPath();
      g.arc(x, y, r, 0, 7);
      g.fill();
    };
    blob(64, 64, 30);
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * 6.28,
        d = 22 + Math.random() * 26;
      blob(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, 4 + Math.random() * 10);
    }
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * 6.28,
        d = 40 + Math.random() * 22;
      blob(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, 1 + Math.random() * 3);
    }
  });
  const decalGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  function decalSet(color, max) {
    const mat = new THREE.MeshLambertMaterial({
      map: splatTex,
      color,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const im = new THREE.InstancedMesh(decalGeo, mat, max);
    im.frustumCulled = false;
    im.renderOrder = 1;
    const m = new THREE.Matrix4();
    m.makeScale(0, 0, 0);
    for (let i = 0; i < max; i++) im.setMatrixAt(i, m);
    scene.add(im);
    return { im, max, next: 0, items: Array.from({ length: max }, () => null) };
  }
  const bloodDecals = decalSet(0x5a0303, touch ? 90 : 240);
  const scorchDecals = decalSet(0x080706, touch ? 20 : 40);
  const _dm = new THREE.Matrix4(),
    _dq = new THREE.Quaternion(),
    _dv = new THREE.Vector3(),
    _ds = new THREE.Vector3(),
    _up = new THREE.Vector3(0, 1, 0);
  function addDecal(set, x, y, z, size, life = 70) {
    const i = set.next;
    set.next = (i + 1) % set.max;
    set.items[i] = { x, y: y + 0.02 + Math.random() * 0.01, z, size, a: Math.random() * 6.28, age: 0, life, grow: 0 };
    writeDecal(set, i);
  }
  function writeDecal(set, i) {
    const d = set.items[i];
    if (!d) return;
    const fade = Math.min(1, (d.life - d.age) / 4);
    const g = Math.min(1, 0.35 + d.grow * 0.65);
    const s = Math.max(0, d.size * g * fade);
    _dq.setFromAxisAngle(_up, d.a);
    _dv.set(d.x, d.y, d.z);
    _ds.set(s, 1, s);
    _dm.compose(_dv, _dq, _ds);
    set.im.setMatrixAt(i, _dm);
    set.im.instanceMatrix.needsUpdate = true;
  }
  function updateDecals(set, dt) {
    for (let i = 0; i < set.max; i++) {
      const d = set.items[i];
      if (!d) continue;
      d.age += dt;
      if (d.grow < 1) d.grow = Math.min(1, d.grow + dt * 1.5);
      if (d.age >= d.life) {
        set.items[i] = null;
        _dm.makeScale(0, 0, 0);
        set.im.setMatrixAt(i, _dm);
        set.im.instanceMatrix.needsUpdate = true;
      } else if (d.grow < 1 || d.life - d.age < 4) writeDecal(set, i);
    }
  }
  fx.bloodPool = (x, z, size = 1.6, y = 0) => addDecal(bloodDecals, x, y, z, size, 110);
  fx.scorch = (x, z, size = 4, y = 0) => addDecal(scorchDecals, x, y, z, size, 90);

  // ---- tracers ---------------------------------------------------------------------
  const MAXT = 64;
  const trP = new Float32Array(MAXT * 6),
    trC = new Float32Array(MAXT * 6);
  const trGeo = new THREE.BufferGeometry();
  const trAP = new THREE.BufferAttribute(trP, 3).setUsage(THREE.DynamicDrawUsage);
  const trAC = new THREE.BufferAttribute(trC, 3).setUsage(THREE.DynamicDrawUsage);
  trGeo.setAttribute("position", trAP);
  trGeo.setAttribute("color", trAC);
  const tracers = new THREE.LineSegments(
    trGeo,
    new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  tracers.frustumCulled = false;
  tracers.renderOrder = 4;
  scene.add(tracers);
  const trs = Array.from({ length: MAXT }, () => ({ live: false }));
  let trNext = 0;
  fx.tracer = (a, b, color = [3, 2.2, 1], speed = 380, len = 7) => {
    const t = trs[trNext];
    trNext = (trNext + 1) % MAXT;
    const dx = b.x - a.x,
      dy = b.y - a.y,
      dz = b.z - a.z,
      dist = Math.hypot(dx, dy, dz) || 1;
    Object.assign(t, {
      live: true,
      ax: a.x,
      ay: a.y,
      az: a.z,
      dx: dx / dist,
      dy: dy / dist,
      dz: dz / dist,
      dist,
      age: 0,
      speed,
      len,
      col: color,
    });
  };
  function updateTracers(dt) {
    for (let i = 0; i < MAXT; i++) {
      const t = trs[i],
        j = i * 6;
      if (!t.live) {
        trC[j] = trC[j + 1] = trC[j + 2] = trC[j + 3] = trC[j + 4] = trC[j + 5] = 0;
        continue;
      }
      t.age += dt;
      const head = Math.min(t.dist, t.speed * t.age);
      const tail = Math.max(0, head - t.len);
      if (tail >= t.dist - 0.01) {
        t.live = false;
        continue;
      }
      trP[j] = t.ax + t.dx * tail;
      trP[j + 1] = t.ay + t.dy * tail;
      trP[j + 2] = t.az + t.dz * tail;
      trP[j + 3] = t.ax + t.dx * head;
      trP[j + 4] = t.ay + t.dy * head;
      trP[j + 5] = t.az + t.dz * head;
      trC[j] = t.col[0] * 0.15;
      trC[j + 1] = t.col[1] * 0.15;
      trC[j + 2] = t.col[2] * 0.15;
      trC[j + 3] = t.col[0];
      trC[j + 4] = t.col[1];
      trC[j + 5] = t.col[2];
    }
    trAP.needsUpdate = true;
    trAC.needsUpdate = true;
  }

  // ---- muzzle flashes ------------------------------------------------------------------
  const flashTex = canvasTex(128, (g, S) => {
    const c = S / 2;
    const gr = g.createRadialGradient(c, c, 0, c, c, c);
    gr.addColorStop(0, "rgba(255,255,230,1)");
    gr.addColorStop(0.25, "rgba(255,200,90,0.9)");
    gr.addColorStop(1, "rgba(255,90,0,0)");
    g.fillStyle = gr;
    g.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2,
        r = i % 2 ? c * 0.28 : c * (0.75 + Math.random() * 0.25);
      g.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r);
    }
    g.fill();
  });
  const flashes = [];
  for (let i = 0; i < 5; i++) {
    const sp = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: flashTex,
        color: new THREE.Color(2.2, 1.6, 1.0),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    sp.visible = false;
    sp.renderOrder = 5;
    scene.add(sp);
    flashes.push({ sp, t: 0 });
  }
  let flashNext = 0;
  fx.muzzle = (pos, size = 0.5) => {
    const f = flashes[flashNext];
    flashNext = (flashNext + 1) % flashes.length;
    f.sp.position.copy(pos);
    const s = size * R(0.8, 1.25);
    f.sp.scale.set(s, s, s);
    f.sp.material.rotation = Math.random() * 6.28;
    f.sp.visible = true;
    f.t = 0.05;
    fx.light(pos, 0xffaa55, 5 * size + 2, 0.06, 14);
  };

  // ---- lights: a small pool that goes to whatever just flashed --------------------------
  const lights = [];
  for (let i = 0; i < (touch ? 2 : 3); i++) {
    const L = new THREE.PointLight(0xffaa55, 0, 20, 1.6);
    scene.add(L);
    lights.push({ L, t: 0, dur: 1, i0: 0 });
  }
  fx.light = (pos, color, intensity, dur, dist = 20) => {
    let pick = lights[0];
    for (const l of lights) if (l.L.intensity < pick.L.intensity) pick = l;
    pick.L.position.copy(pos);
    pick.L.color.setHex(color);
    pick.L.distance = dist;
    pick.i0 = intensity;
    pick.dur = dur;
    pick.t = 0;
    pick.L.intensity = intensity;
  };

  // ---- explosion meshes: a fireball and a ground shockwave ----------------------------------
  const balls = [];
  const ballGeo = new THREE.SphereGeometry(1, 18, 12);
  const ringGeo = new THREE.RingGeometry(0.7, 1, 40).rotateX(-Math.PI / 2);
  for (let i = 0; i < 4; i++) {
    const m = new THREE.Mesh(
      ballGeo,
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(3, 1.4, 0.4),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    const ring = new THREE.Mesh(
      ringGeo,
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(1.6, 1.0, 0.6),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    m.visible = ring.visible = false;
    m.renderOrder = ring.renderOrder = 4;
    scene.add(m, ring);
    balls.push({ m, ring, t: 9, r: 1 });
  }
  let ballNext = 0;

  // ---- particle recipes --------------------------------------------------------------------
  const C = (r, g, b, a) => [r, g, b, a];
  fx.blood = (p, dir, n = 12, power = 4, floor = 0) => {
    n = Math.ceil(n * (touch ? 1 : 1.7)); // 🩸 a lot of it
    for (let i = 0; i < n; i++) {
      const sp = power * R(0.25, 1);
      norm.spawn(
        p.x, p.y, p.z,
        (dir ? dir.x * sp : 0) + R(-1, 1) * power * 0.45,
        (dir ? dir.y * sp : 0) + R(0.4, 2.6),
        (dir ? dir.z * sp : 0) + R(-1, 1) * power * 0.45,
        R(0.6, 1.3), R(0.05, 0.13), R(0.04, 0.09),
        C(0.5, 0.02, 0.02, 1), C(0.28, 0.0, 0.0, 0.85),
        13, 0.4, STICK, floor + 0.03,
      );
    }
    // a red mist hangs where it hit
    for (let i = 0; i < (touch ? 3 : 6); i++)
      norm.spawn(
        p.x, p.y, p.z,
        R(-0.8, 0.8) + (dir ? dir.x * 1.6 : 0), R(-0.2, 0.7), R(-0.8, 0.8) + (dir ? dir.z * 1.6 : 0),
        R(0.3, 0.6), R(0.25, 0.45), R(0.9, 1.6),
        C(0.6, 0.03, 0.03, 0.6), C(0.32, 0.02, 0.02, 0),
        0, 2, 0, floor,
      );
  };
  // 🩸 blood on the walls: a splat on the tower face behind a hit
  const wallDecals = (() => {
    const max = touch ? 30 : 80;
    const mat = new THREE.MeshLambertMaterial({
      map: splatTex,
      color: 0x6a0404,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1.25), mat, max);
    im.frustumCulled = false;
    const m = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < max; i++) im.setMatrixAt(i, m);
    scene.add(im);
    return { im, max, next: 0 };
  })();
  const _wn = new THREE.Vector3(),
    _wq = new THREE.Quaternion(),
    _wq2 = new THREE.Quaternion(),
    _wz = new THREE.Vector3(0, 0, 1);
  fx.wallBlood = (p, size = 1.2) => {
    if (!Z.wallNormal(p, _wn)) return;
    const i = wallDecals.next;
    wallDecals.next = (i + 1) % wallDecals.max;
    _wq.setFromUnitVectors(_wz, _wn);
    _wq2.setFromAxisAngle(_wz, Math.random() * 6.28);
    _wq.multiply(_wq2);
    _dv.copy(p).addScaledVector(_wn, 0.04);
    _ds.set(size, size, 1);
    _dm.compose(_dv, _wq, _ds);
    wallDecals.im.setMatrixAt(i, _dm);
    wallDecals.im.instanceMatrix.needsUpdate = true;
    // and it runs down the wall a little
    for (let k = 0; k < 4; k++)
      norm.spawn(_dv.x + R(-0.3, 0.3) * size, _dv.y + R(-0.2, 0.3), _dv.z + R(-0.3, 0.3) * size, 0, -R(0.05, 0.25), 0, R(1.5, 3), 0.06, 0.05, C(0.45, 0.02, 0.02, 0.95), C(0.3, 0.01, 0.01, 0.6), 0, 0, 0, -99);
  };
  fx.gore = (p, n = 10, power = 6, floor = 0) => {
    for (let i = 0; i < n; i++)
      norm.spawn(
        p.x, p.y, p.z,
        R(-1, 1) * power, R(1, 2.2) * power * 0.7, R(-1, 1) * power,
        R(1.2, 2.2), R(0.12, 0.24), R(0.1, 0.2),
        C(0.32, 0.03, 0.03, 1), C(0.22, 0.02, 0.02, 0.9),
        16, 0.3, BOUNCE, floor + 0.06,
      );
    fx.blood(p, null, n * 2, power * 0.8, floor);
  };
  fx.sparks = (p, n = 8, power = 9) => {
    for (let i = 0; i < n; i++)
      glow.spawn(
        p.x, p.y, p.z,
        R(-1, 1) * power, R(0, 1.3) * power, R(-1, 1) * power,
        R(0.18, 0.45), R(0.06, 0.1), 0.02,
        C(3, 2.2, 0.9, 1), C(1.2, 0.3, 0.05, 0),
        16, 0.5, BOUNCE, 0.02,
      );
  };
  fx.dust = (p, n = 5, size = 0.4) => {
    for (let i = 0; i < n; i++)
      norm.spawn(
        p.x + R(-0.2, 0.2), p.y + R(0, 0.2), p.z + R(-0.2, 0.2),
        R(-1, 1), R(0.4, 1.6), R(-1, 1),
        R(0.6, 1.1), size, size * R(2.5, 4),
        C(0.32, 0.3, 0.28, 0.55), C(0.38, 0.36, 0.33, 0),
        -0.2, 1.5, 0, -99,
      );
  };
  fx.smoke = (p, n = 3, size = 1, dark = 0.12, rise = 1.6, life = 3) => {
    for (let i = 0; i < n; i++)
      norm.spawn(
        p.x + R(-0.3, 0.3) * size, p.y, p.z + R(-0.3, 0.3) * size,
        R(-0.4, 0.4), rise * R(0.7, 1.3), R(-0.4, 0.4),
        life * R(0.7, 1.2), size * R(0.6, 1), size * R(3, 4.5),
        C(dark, dark, dark * 1.05, 0.6), C(dark * 1.8, dark * 1.8, dark * 1.8, 0),
        -0.15, 0.5, 0, -99,
      );
  };
  fx.fire = (p, n = 3, size = 0.6, up = 2.6) => {
    for (let i = 0; i < n; i++)
      glow.spawn(
        p.x + R(-0.3, 0.3) * size, p.y + R(0, 0.2), p.z + R(-0.3, 0.3) * size,
        R(-0.5, 0.5), up * R(0.6, 1.3), R(-0.5, 0.5),
        R(0.4, 0.85), size * R(0.6, 1), size * R(1.4, 2.2),
        C(2.2, 1.0, 0.25, 0.9), C(0.9, 0.12, 0.02, 0),
        -1.5, 1, 0, -99,
      );
  };
  fx.toxic = (p, n = 30, power = 5) => {
    for (let i = 0; i < n; i++)
      glow.spawn(
        p.x, p.y, p.z,
        R(-1, 1) * power, R(0, 1) * power, R(-1, 1) * power,
        R(0.7, 1.3), R(0.4, 0.8), R(1.6, 2.8),
        C(0.5, 1.6, 0.25, 0.7), C(0.1, 0.5, 0.05, 0),
        -0.3, 2.2, 0, -99,
      );
  };
  // a jet of flame (the flamethrower)
  fx.flame = (p, d, spread = 0.12) => {
    const s = 17 * R(0.85, 1.15);
    glow.spawn(
      p.x, p.y, p.z,
      (d.x + R(-1, 1) * spread) * s, (d.y + R(-1, 1) * spread) * s + 0.6, (d.z + R(-1, 1) * spread) * s,
      R(0.45, 0.65), 0.15, R(1.4, 2.2),
      C(2.4, 1.3, 0.35, 0.9), C(1.1, 0.15, 0.02, 0),
      -2.5, 1.7, 0, -99,
    );
  };

  // ---- explosions ---------------------------------------------------------------------
  const _ev = new THREE.Vector3();
  fx.boom = (p, r = 6, big = 1) => {
    const b = balls[ballNext];
    ballNext = (ballNext + 1) % balls.length;
    b.m.position.copy(p);
    b.ring.position.set(p.x, Z.groundAt(p.x, p.z, p.y + 0.5) + 0.15, p.z);
    b.t = 0;
    b.r = r;
    b.m.visible = b.ring.visible = true;
    const n = Math.round((touch ? 14 : 26) * big);
    for (let i = 0; i < n; i++)
      glow.spawn(
        p.x, p.y + 0.3, p.z,
        R(-1, 1) * r * 1.2, R(0.2, 1.4) * r, R(-1, 1) * r * 1.2,
        R(0.35, 0.8), r * 0.25, r * R(0.45, 0.7),
        C(2.6, 1.3, 0.35, 0.95), C(1.0, 0.15, 0.02, 0),
        -1, 3.2, 0, -99,
      );
    fx.sparks(p, Math.round(18 * big), r * 2.2);
    const floor = Z.groundAt(p.x, p.z, p.y + 0.5);
    for (let i = 0; i < Math.round(10 * big); i++)
      norm.spawn(
        p.x, p.y + 0.3, p.z,
        R(-1, 1) * r * 1.6, R(0.6, 2) * r, R(-1, 1) * r * 1.6,
        R(1, 2), R(0.08, 0.22), 0.1,
        C(0.08, 0.07, 0.06, 1), C(0.05, 0.05, 0.05, 0.8),
        18, 0.2, BOUNCE, floor + 0.05,
      );
    _ev.copy(p);
    _ev.y += r * 0.3;
    fx.smoke(_ev, Math.round((touch ? 6 : 12) * big), r * 0.45, 0.07, 2.2, 4);
    if (p.y - floor < 2.5) fx.scorch(p.x, p.z, r * 1.3, floor);
    fx.light(p, 0xff8a3a, 30 * big, 0.5, r * 7);
    const d = camera.position.distanceTo(p);
    fx.shake(Math.max(0, (1.25 - d / (r * 9)) * big));
    if (d < r * 3) Z.hud.flash(0.35 * big);
    Z.sfx.explosion(p, big);
  };

  // ---- camera shake --------------------------------------------------------------------------
  let trauma = 0,
    shT = 0;
  fx.shake = (a) => {
    trauma = Math.min(1, trauma + a);
  };
  fx.applyShake = (dt) => {
    if (trauma <= 0.001) return;
    shT += dt;
    trauma = Math.max(0, trauma - dt * 1.4);
    const k = trauma * trauma;
    camera.position.x += Math.sin(shT * 47.3) * 0.32 * k;
    camera.position.y += Math.sin(shT * 53.1 + 1.3) * 0.26 * k;
    camera.position.z += Math.sin(shT * 41.7 + 2.1) * 0.32 * k;
    camera.rotateZ(Math.sin(shT * 37.9) * 0.05 * k);
  };

  // ---- per frame ---------------------------------------------------------------------------------
  fx.update = (sdt, dt) => {
    const sc =
      (innerHeight * api.renderer.getPixelRatio()) /
      (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    for (const c of [norm, glow]) {
      c.uni.uScale.value = sc;
      c.uni.uFogD.value = scene.fog.density;
      c.uni.uFogC.value.copy(scene.fog.color);
      c.update(sdt);
    }
    updateTracers(sdt);
    updateDecals(bloodDecals, sdt);
    updateDecals(scorchDecals, sdt);
    for (const f of flashes)
      if (f.sp.visible && (f.t -= dt) <= 0) f.sp.visible = false;
    for (const l of lights) {
      if (l.L.intensity <= 0) continue;
      l.t += dt;
      l.L.intensity = l.t >= l.dur ? 0 : l.i0 * (1 - l.t / l.dur);
    }
    for (const b of balls) {
      if (!b.m.visible) continue;
      b.t += sdt;
      const u = b.t / 0.55;
      if (u >= 1) {
        b.m.visible = b.ring.visible = false;
        continue;
      }
      const s = b.r * (0.25 + 0.75 * Math.sqrt(u));
      b.m.scale.setScalar(s * 0.75);
      b.m.material.opacity = (1 - u) * (1 - u);
      b.ring.scale.setScalar(b.r * (0.3 + 2.4 * u));
      b.ring.material.opacity = (1 - u) * 0.8;
    }
  };

  // ---- an explosion that hurts: zombies, the sky's machines, and her ---------------------------
  // opts.src 'player' | 'enemy'; opts.self: how much of it reaches her
  const _pc = new THREE.Vector3();
  Z.explode = (p, r, dmg, opts = {}) => {
    fx.boom(p, r * 0.8, opts.big || 1);
    Z.zombies.blast(p, r, dmg, opts.src || "player");
    if (opts.src !== "enemy") Z.aircraft.blast(p, r, dmg);
    Z.zombies.noise(p, 95);
    const pc = Z.pchest(_pc);
    const d = pc.distanceTo(p);
    if (d < r) {
      const k = 1 - d / r;
      const self = opts.self ?? (opts.src === "enemy" ? 1 : 0.3);
      Z.hurt(Math.min(opts.maxSelf ?? 999, dmg * self * k * (opts.src === "enemy" ? 1 : 0.4)), p, "blast");
      if (Z.onFoot()) {
        const v = api.vel;
        const dx = pc.x - p.x,
          dz = pc.z - p.z,
          l = Math.hypot(dx, dz) || 1;
        v.x += (dx / l) * 9 * k;
        v.z += (dz / l) * 9 * k;
        v.y += 6 * k;
      }
    }
  };
}
