// 🩸 the survivor's screen: health & armour, the gun and its ammo, a crosshair
// that kicks and marks hits, the wave and the score, banners and warnings,
// damage from every side, the sniper's scope, the death screen, the radar
// full of the dead - and on phones, the buttons to fight with.
const CSS = /* css */ `
  #discovery, #cake-way, #btn-action, #bcap, #blow, #kissreward, #celebrate { display: none !important; }
  #kisses { background: rgba(10, 8, 6, 0.62) !important; border-color: rgba(190, 40, 30, 0.55) !important; color: #e9e2d6 !important; font-family: "Arial Black", Impact, sans-serif; letter-spacing: 0.5px; font-size: 13px !important; }
  #map-btn { background: rgba(10, 8, 6, 0.62) !important; border-color: rgba(190, 40, 30, 0.55) !important; }
  #title { color: #d63a2c !important; text-shadow: 0 0 10px rgba(255, 40, 20, 0.45), 0 1px 3px #000 !important; font-family: Impact, "Arial Black", sans-serif; letter-spacing: 1px; }
  #title h1 span { color: #c8c1b2; }
  #radar { opacity: 0.95; }
  #music-btn, #where { filter: grayscale(0.85) brightness(0.85); }
  .tbtn { background: rgba(30, 26, 22, 0.42) !important; border-color: rgba(220, 200, 170, 0.4) !important; }
  #joystick { background: radial-gradient(circle, rgba(220, 60, 40, 0.14), rgba(220, 60, 40, 0.03)) !important; border-color: rgba(230, 120, 90, 0.4) !important; }
  #joy-knob { background: radial-gradient(circle, #e0745c, #9a1d10) !important; box-shadow: 0 0 16px rgba(220, 60, 30, 0.7) !important; }
  .flash { background: #e8eeff !important; }

  #zw { position: fixed; inset: 0; pointer-events: none; z-index: 14; font-family: "Segoe UI", Roboto, sans-serif; color: #eee6d8; display: none; }
  #zw.on { display: block; }
  #zw .vig { position: absolute; inset: 0; opacity: 0; background: radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(150, 0, 0, 0.55) 80%, rgba(90, 0, 0, 0.92) 100%); }
  #zw .low { position: absolute; inset: 0; opacity: 0; background: radial-gradient(ellipse at center, rgba(0,0,0,0) 35%, rgba(120, 0, 0, 0.5) 100%); animation: zwpulse 0.9s ease-in-out infinite; }
  #zw .bt { position: absolute; inset: 0; opacity: 0; background: radial-gradient(ellipse at center, rgba(40, 90, 140, 0) 40%, rgba(30, 70, 120, 0.4) 100%); mix-blend-mode: screen; transition: opacity 0.4s; }
  #zw .wf { position: absolute; inset: 0; opacity: 0; background: #fff3dc; }
  #zw .splat { position: absolute; pointer-events: none; transition: opacity 2.4s ease-in, transform 2.6s ease-in; }
  @keyframes zwpulse { 50% { opacity: 0.35; } }

  #zw .xh { position: absolute; left: 50%; top: 50%; width: 0; height: 0; }
  #zw .xh i { position: absolute; background: rgba(255, 245, 230, 0.92); box-shadow: 0 0 2px #000; }
  #zw .xh i.t, #zw .xh i.b { width: 2px; height: 9px; left: -1px; }
  #zw .xh i.l, #zw .xh i.r { width: 9px; height: 2px; top: -1px; }
  #zw .xh b { position: absolute; left: -2px; top: -2px; width: 4px; height: 4px; border-radius: 50%; background: #ff4a3a; box-shadow: 0 0 4px #ff2a1a; }
  #zw .xh.melee i { display: none; }
  #zw .hm { position: absolute; left: 50%; top: 50%; width: 30px; height: 30px; margin: -15px 0 0 -15px; opacity: 0; transform: rotate(45deg); }
  #zw .hm::before, #zw .hm::after { content: ""; position: absolute; left: 50%; top: 0; bottom: 0; width: 2px; margin-left: -1px; background: linear-gradient(#fff 0 35%, transparent 35% 65%, #fff 65%); }
  #zw .hm::after { transform: rotate(90deg); }
  #zw .hm.kill::before, #zw .hm.kill::after { background: linear-gradient(#ff3020 0 35%, transparent 35% 65%, #ff3020 65%); }
  #zw .skull { position: absolute; left: 50%; top: calc(50% - 46px); transform: translateX(-50%); font-size: 22px; opacity: 0; text-shadow: 0 0 8px #f00; }

  #zw .dmg { position: absolute; left: 50%; top: 50%; width: 220px; height: 220px; margin: -110px 0 0 -110px; opacity: 0; }
  #zw .dmg::before { content: ""; position: absolute; left: 50%; top: 0; width: 70px; height: 22px; margin-left: -35px; border-radius: 50% 50% 0 0 / 100% 100% 0 0; border-top: 5px solid rgba(255, 30, 20, 0.9); filter: drop-shadow(0 0 6px #f00); }

  #zw .hp { position: absolute; left: 182px; bottom: 22px; width: 250px; }
  #zw .bar { position: relative; height: 18px; background: rgba(10, 8, 6, 0.7); border: 1px solid rgba(255, 255, 255, 0.18); border-radius: 3px; overflow: hidden; margin-top: 5px; }
  #zw .bar i { position: absolute; left: 0; top: 0; bottom: 0; width: 100%; transition: width 0.15s; }
  #zw .bar u { position: absolute; left: 0; top: 0; bottom: 0; width: 100%; background: rgba(255, 220, 200, 0.5); transition: width 0.9s 0.25s; }
  #zw .bar.h i { background: linear-gradient(#e6402c, #8e140a); }
  #zw .bar.h.low i { background: linear-gradient(#ff2a10, #a00); animation: zwblink 0.5s infinite; }
  #zw .bar.a { height: 9px; }
  #zw .bar.a i { background: linear-gradient(#69a6ff, #2a4fb0); }
  #zw .bar span { position: absolute; left: 8px; top: 0; line-height: 18px; font: 700 12px "Arial Black", sans-serif; text-shadow: 0 1px 2px #000; }
  @keyframes zwblink { 50% { filter: brightness(1.6); } }

  #zw .wpn { position: absolute; right: 20px; bottom: 20px; text-align: right; text-shadow: 0 1px 3px #000, 0 0 10px rgba(0,0,0,0.6); }
  #zw .wpn .nm { font: 700 13px "Arial Black", sans-serif; letter-spacing: 1px; color: #d9cbb2; text-transform: uppercase; }
  #zw .wpn .am { font: 400 40px/1 Impact, "Arial Black", sans-serif; color: #fff; }
  #zw .wpn .am small { font-size: 20px; color: #b7aa95; }
  #zw .wpn .am.out { color: #ff4433; }
  #zw .wpn .ex { font: 600 13px sans-serif; color: #e8dcc6; margin-top: 2px; }
  #zw .wpn .rl { height: 3px; background: rgba(255,255,255,0.15); margin-top: 4px; width: 140px; margin-left: auto; opacity: 0; }
  #zw .wpn .rl i { display: block; height: 100%; width: 0; background: #ffd27a; }
  #zw .list { position: absolute; right: 20px; bottom: 106px; display: flex; gap: 4px; }
  #zw .list span { font: 700 10px sans-serif; padding: 3px 5px; border-radius: 3px; background: rgba(10,8,6,0.55); color: #a99c88; border: 1px solid rgba(255,255,255,0.08); }
  #zw .list span.on { color: #fff; border-color: rgba(255, 90, 60, 0.8); background: rgba(120, 20, 10, 0.55); }

  #zw .msg { position: absolute; left: 0; right: 0; top: 22%; text-align: center; opacity: 0; transition: opacity 0.4s; }
  #zw .msg h2 { font: 400 64px/1 Impact, "Arial Black", sans-serif; letter-spacing: 3px; color: #e0331f; text-shadow: 0 0 22px rgba(255, 30, 0, 0.55), 0 3px 0 #2a0000; }
  #zw .msg p { font: 600 16px sans-serif; color: #e9dfcd; margin-top: 8px; text-shadow: 0 1px 4px #000; }
  #zw .pop { position: absolute; left: 0; right: 0; top: 34%; text-align: center; font: 400 30px Impact, "Arial Black", sans-serif; letter-spacing: 2px; color: #fff; text-shadow: 0 0 12px rgba(255,40,0,0.8), 0 2px 0 #400; opacity: 0; }
  #zw .warn { position: absolute; left: 50%; top: 13%; transform: translateX(-50%); padding: 8px 22px; font: 400 22px Impact, "Arial Black", sans-serif; letter-spacing: 2px; color: #fff; background: repeating-linear-gradient(-45deg, rgba(180, 0, 0, 0.85) 0 14px, rgba(60, 0, 0, 0.85) 14px 28px); border: 2px solid #ff5a3a; opacity: 0; white-space: nowrap; }
  #zw .warn.on { animation: zwwarn 0.5s steps(2) infinite; }
  @keyframes zwwarn { 50% { border-color: #fff; } }
  #zw .toasts { position: absolute; left: 50%; bottom: 120px; transform: translateX(-50%); display: flex; flex-direction: column-reverse; align-items: center; gap: 4px; }
  #zw .toasts div { font: 700 15px "Arial Black", sans-serif; text-shadow: 0 1px 3px #000; animation: zwtoast 1.8s forwards; }
  @keyframes zwtoast { 0% { opacity: 0; transform: translateY(10px); } 12% { opacity: 1; transform: none; } 75% { opacity: 1; } 100% { opacity: 0; transform: translateY(-14px); } }
  #zw .feed { position: absolute; right: 18px; top: 52px; display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
  #zw .feed div { font: 600 12px sans-serif; background: rgba(10,8,6,0.55); padding: 2px 8px; border-radius: 3px; animation: zwfeed 3s forwards; }
  @keyframes zwfeed { 0%, 85% { opacity: 1; } 100% { opacity: 0; } }
  #zw .boss { position: absolute; left: 50%; top: 52px; transform: translateX(-50%); width: 340px; text-align: center; display: none; }
  #zw .boss b { font: 400 14px Impact, sans-serif; letter-spacing: 2px; color: #ffb199; text-shadow: 0 1px 3px #000; }
  #zw .boss .bar i { background: linear-gradient(#ff8a2a, #a83a00); }

  #zw .scope { position: absolute; inset: 0; display: none; background: radial-gradient(circle at center, rgba(0,0,0,0) 0 31vmin, #000 31.3vmin); }
  #zw .scope::before, #zw .scope::after { content: ""; position: absolute; left: 50%; top: 50%; background: rgba(0, 0, 0, 0.85); }
  #zw .scope::before { width: 62vmin; height: 1px; margin-left: -31vmin; }
  #zw .scope::after { width: 1px; height: 62vmin; margin-top: -31vmin; }
  #zw.scoped .scope { display: block; }
  #zw.scoped .xh { display: none; }

  #zw-dead { position: fixed; inset: 0; z-index: 60; display: none; align-items: center; justify-content: center; flex-direction: column; background: radial-gradient(ellipse at center, rgba(60, 0, 0, 0.55), rgba(5, 0, 0, 0.95)); color: #eee; text-align: center; font-family: sans-serif; }
  #zw-dead.on { display: flex; animation: zwfade 1s; }
  @keyframes zwfade { from { opacity: 0; } }
  #zw-dead h1 { font: 400 92px/1 Impact, "Arial Black", sans-serif; letter-spacing: 6px; color: #c8180c; text-shadow: 0 0 30px rgba(255, 0, 0, 0.5), 0 4px 0 #300; }
  #zw-dead .st { margin: 18px 0 26px; font: 600 15px/1.9 sans-serif; color: #d9cfbe; }
  #zw-dead .st b { color: #fff; font-family: "Arial Black", sans-serif; }
  #zw-dead button { font: 400 22px Impact, "Arial Black", sans-serif; letter-spacing: 2px; padding: 12px 34px; color: #fff; background: #8e140a; border: 2px solid #ff6a4a; border-radius: 6px; cursor: pointer; }
  #zw-dead button:hover { background: #b51f10; }

  /* phones: the fight buttons */
  .zwb { display: none; position: fixed; z-index: 15; border-radius: 50%; align-items: center; justify-content: center; color: #fff; text-shadow: 0 1px 3px #000; user-select: none; -webkit-user-select: none; touch-action: none; pointer-events: auto; background: rgba(30, 26, 22, 0.45); border: 1px solid rgba(220, 200, 170, 0.45); font: 700 12px sans-serif; }
  body.touch.zw-on .zwb { display: flex; }
  body.touch.zw-on.riding .zwb { display: none; }
  body.touch.zw-on.riding.zw-incar #zwb-fire { display: flex; }
  .zwb:active, .zwb.on { background: rgba(160, 30, 15, 0.55); }
  #zwb-fire { right: max(94px, calc(env(safe-area-inset-right) + 74px)); bottom: 30px; width: 86px; height: 86px; font-size: 30px; background: radial-gradient(circle at 50% 38%, rgba(230, 70, 40, 0.65), rgba(120, 10, 0, 0.6)); border: 2px solid rgba(255, 170, 140, 0.8); box-shadow: 0 0 16px rgba(255, 50, 20, 0.5); }
  #zwb-swap { right: max(110px, calc(env(safe-area-inset-right) + 90px)); bottom: 128px; width: 54px; height: 54px; font-size: 20px; }
  #zwb-reload { right: max(110px, calc(env(safe-area-inset-right) + 90px)); bottom: 192px; width: 54px; height: 54px; font-size: 20px; }
  #zwb-nade { right: max(178px, calc(env(safe-area-inset-right) + 158px)); bottom: 40px; width: 50px; height: 50px; font-size: 20px; }
  #zwb-strike { right: max(178px, calc(env(safe-area-inset-right) + 158px)); bottom: 104px; width: 50px; height: 50px; font-size: 20px; }
  #zwb-scope { right: max(178px, calc(env(safe-area-inset-right) + 158px)); bottom: 168px; width: 50px; height: 50px; font-size: 20px; display: none !important; }
  body.touch.zw-on.zw-sniper #zwb-scope { display: flex !important; }
  .zwb sup { position: absolute; right: 4px; top: 2px; font-size: 10px; }

  body.touch #zw .hp { left: 14px; top: 10px; bottom: auto; width: 150px; }
  body.touch #zw .bar { height: 14px; margin-top: 3px; }
  body.touch #zw .bar span { line-height: 14px; font-size: 10px; }
  body.touch #zw .bar.a { height: 6px; }
  body.touch #zw .wpn { right: 12px; top: 40px; bottom: auto; }
  body.touch #zw .wpn .am { font-size: 26px; }
  body.touch #zw .wpn .am small { font-size: 14px; }
  body.touch #zw .wpn .nm { font-size: 10px; }
  body.touch #zw .wpn .ex { font-size: 11px; }
  body.touch #zw .list { display: none; }
  body.touch #zw .feed { top: 214px; }
  body.touch #zw .msg h2 { font-size: 40px; }
  body.touch #zw .msg p { font-size: 13px; }
  body.touch #zw .pop { font-size: 22px; }
  body.touch #zw .warn { font-size: 15px; top: 18%; }
  body.touch #zw .boss { width: 220px; top: 46px; }
  body.touch #zw .toasts { bottom: 150px; }
  body.touch #zw-dead h1 { font-size: 58px; }
  body.riding #zw .wpn, body.riding #zw .list, body.riding #zw .xh { display: none; }
`;

export function setupHud(Z) {
  const { api } = Z;
  const st = document.createElement("style");
  st.textContent = CSS;
  document.head.appendChild(st);

  const root = document.createElement("div");
  root.id = "zw";
  root.innerHTML = `
    <div class="bt"></div><div class="vig"></div><div class="low"></div><div class="wf"></div>
    <div class="scope"></div>
    <div class="dmg"></div><div class="dmg"></div><div class="dmg"></div><div class="dmg"></div>
    <div class="xh"><i class="t"></i><i class="b"></i><i class="l"></i><i class="r"></i><b></b></div>
    <div class="hm"></div><div class="skull">💀</div>
    <div class="hp">
      <div class="bar h"><u></u><i></i><span>100</span></div>
      <div class="bar a"><i></i></div>
    </div>
    <div class="list"></div>
    <div class="wpn"><div class="nm"></div><div class="am"></div><div class="ex"></div><div class="rl"><i></i></div></div>
    <div class="boss"><b></b><div class="bar"><i></i></div></div>
    <div class="msg"><h2></h2><p></p></div>
    <div class="pop"></div>
    <div class="warn"></div>
    <div class="toasts"></div>
    <div class="feed"></div>`;
  document.body.appendChild(root);
  const $ = (s) => root.querySelector(s);
  const el = {
    vig: $(".vig"),
    low: $(".low"),
    bt: $(".bt"),
    wf: $(".wf"),
    xh: $(".xh"),
    xt: $(".xh .t"),
    xb: $(".xh .b"),
    xl: $(".xh .l"),
    xr: $(".xh .r"),
    hm: $(".hm"),
    skull: $(".skull"),
    hpBar: $(".bar.h"),
    hpI: $(".bar.h i"),
    hpU: $(".bar.h u"),
    hpT: $(".bar.h span"),
    arI: $(".bar.a i"),
    arBar: $(".bar.a"),
    list: $(".list"),
    nm: $(".wpn .nm"),
    am: $(".wpn .am"),
    ex: $(".wpn .ex"),
    rl: $(".wpn .rl"),
    rlI: $(".wpn .rl i"),
    boss: $(".boss"),
    bossT: $(".boss b"),
    bossI: $(".boss .bar i"),
    msg: $(".msg"),
    msgH: $(".msg h2"),
    msgP: $(".msg p"),
    pop: $(".pop"),
    warn: $(".warn"),
    toasts: $(".toasts"),
    feed: $(".feed"),
    dmg: [...root.querySelectorAll(".dmg")],
  };

  // the death screen
  const dead = document.createElement("div");
  dead.id = "zw-dead";
  dead.innerHTML = `<h1>YOU DIED</h1><div class="st"></div><button>☠ RISE AGAIN</button>`;
  document.body.appendChild(dead);
  dead.querySelector("button").addEventListener("click", (e) => {
    e.stopPropagation();
    Z.respawn();
  });
  addEventListener("keydown", (e) => {
    if (dead.classList.contains("on") && (e.code === "Enter" || e.code === "Space")) {
      e.preventDefault();
      Z.respawn();
    }
  });

  // 💋 the counter at the top becomes the body count (the 🗺️ stays)
  const kissEl = document.getElementById("kisses");
  const scoreEl = document.createElement("span");
  if (kissEl) {
    for (const n of [...kissEl.childNodes]) if (n.id !== "map-btn") kissEl.removeChild(n);
    kissEl.appendChild(scoreEl);
  }

  const H = (Z.hud = {});
  let hurtA = 0,
    flashA = 0,
    hmT = 0,
    skullT = 0,
    msgT = 0,
    popT = 0,
    warnT = 0,
    lastHp = 100,
    bossFrac = null;
  const dmgA = [0, 0, 0, 0],
    dmgSrc = [null, null, null, null];

  H.onEnter = () => {
    root.classList.add("on");
    document.body.classList.add("zw-on");
  };
  H.hurt = (amt, src) => {
    hurtA = Math.min(1, hurtA + 0.25 + amt * 0.03);
    if (amt >= 6) H.splat(Math.min(0.7, amt / 30));
    if (src) {
      let k = 0;
      for (let i = 1; i < 4; i++) if (dmgA[i] < dmgA[k]) k = i;
      dmgA[k] = 1;
      dmgSrc[k] = { x: src.x, z: src.z };
    }
  };
  H.flash = (a) => (flashA = Math.min(1, flashA + a));
  // 🩸 blood on the lens: a close kill (or a claw) splashes the screen, then it runs off
  const splatImgs = [];
  function makeSplatImg() {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 256;
    const g = cv.getContext("2d");
    const blob = (x, y, r, a) => {
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(120, 4, 4, ${a})`);
      gr.addColorStop(0.75, `rgba(90, 0, 0, ${a * 0.9})`);
      gr.addColorStop(1, "rgba(60, 0, 0, 0)");
      g.fillStyle = gr;
      g.beginPath();
      g.arc(x, y, r, 0, 7);
      g.fill();
    };
    blob(128, 128, 56 + Math.random() * 20, 0.85);
    for (let i = 0; i < 22; i++) {
      const a = Math.random() * 6.28,
        d = 40 + Math.random() * 80;
      blob(128 + Math.cos(a) * d, 128 + Math.sin(a) * d, 4 + Math.random() * 16, 0.8);
    }
    // drips
    for (let i = 0; i < 5; i++) {
      const x = 90 + Math.random() * 80;
      g.fillStyle = "rgba(100, 2, 2, 0.8)";
      g.fillRect(x, 128, 4 + Math.random() * 5, 60 + Math.random() * 60);
      blob(x + 3, 128 + 60 + Math.random() * 60, 6, 0.8);
    }
    return cv.toDataURL();
  }
  H.splat = (amount = 0.4) => {
    if (!splatImgs.length) for (let i = 0; i < 5; i++) splatImgs.push(makeSplatImg());
    const n = amount > 0.5 ? 3 : amount > 0.25 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const d = document.createElement("div");
      d.className = "splat";
      const s = (160 + Math.random() * 260) * (0.6 + amount);
      d.style.width = d.style.height = s + "px";
      d.style.left = Math.random() * (innerWidth - s * 0.5) - s * 0.25 + "px";
      d.style.top = Math.random() * (innerHeight - s * 0.5) - s * 0.25 + "px";
      d.style.background = `url(${splatImgs[(Math.random() * splatImgs.length) | 0]}) center/contain no-repeat`;
      d.style.transform = `rotate(${Math.random() * 360}deg)`;
      d.style.opacity = Math.min(0.95, 0.55 + amount);
      root.appendChild(d);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          d.style.opacity = 0;
          d.style.transform += " translateY(30px) scale(1.04)";
        }),
      );
      setTimeout(() => d.remove(), 2700);
    }
    while (root.querySelectorAll(".splat").length > 9) root.querySelector(".splat").remove();
  };
  H.hitmark = (kind) => {
    hmT = kind === "kill" ? 0.3 : 0.14;
    el.hm.classList.toggle("kill", kind === "kill" || kind === "head");
    if (kind === "head") skullT = 0.5;
  };
  H.banner = (h, p = "", secs = 3.2) => {
    el.msgH.textContent = h;
    el.msgP.textContent = p;
    msgT = secs;
  };
  H.pop = (text, color = "#fff") => {
    el.pop.textContent = text;
    el.pop.style.color = color;
    popT = 1.1;
  };
  H.warn = (text, secs = 4) => {
    el.warn.textContent = text;
    warnT = secs;
  };
  H.toast = (text, color = "#9df07a") => {
    const d = document.createElement("div");
    d.textContent = text;
    d.style.color = color;
    el.toasts.appendChild(d);
    setTimeout(() => d.remove(), 1900);
    while (el.toasts.children.length > 4) el.toasts.firstChild.remove();
  };
  H.feed = (html) => {
    const d = document.createElement("div");
    d.innerHTML = html;
    el.feed.prepend(d);
    setTimeout(() => d.remove(), 3100);
    while (el.feed.children.length > 5) el.feed.lastChild.remove();
  };
  const STREAK = { 2: "DOUBLE KILL", 3: "TRIPLE KILL", 5: "MULTI KILL", 8: "MASSACRE", 12: "ZOMBIE APOCALYPSE", 16: "UNSTOPPABLE" };
  H.kill = (zb, how, streak) => {
    H.hitmark(how.head ? "head" : "kill");
    if (how.decap) H.pop(Math.random() < 0.5 ? "HEADS OFF!" : "DECAPITATED!", "#ff5a3a");
    else if (how.head) H.pop("HEADSHOT", "#fff");
    else if (how.gib) H.pop(Math.random() < 0.5 ? "SPLATTER!" : "OBLITERATED", "#ffb03a");
    else if (how.car) H.pop("ROADKILL", "#ffd23a");
    if (STREAK[streak]) setTimeout(() => H.pop(STREAK[streak], "#ffcf4a"), 450);
    if (zb.def.big) H.banner(zb.def.giant ? "GIANT DOWN" : "BRUTE DOWN", "+" + zb.def.score, 2.4);
    const ic = how.decap ? "🪓" : how.head ? "🎯" : how.gib ? "💥" : how.car ? "🚗" : how.fire ? "🔥" : "☠";
    H.feed(`${ic} ${zb.def.name}`);
  };
  H.boss = (name, frac) => {
    if (frac == null) {
      el.boss.style.display = "none";
      bossFrac = null;
      return;
    }
    el.boss.style.display = "block";
    el.bossT.textContent = name;
    bossFrac = frac;
    el.bossI.style.width = Math.max(0, frac * 100) + "%";
  };
  H.showDeath = () => {
    if (dead.classList.contains("on")) return;
    const P = Z.player,
      D = Z.director;
    dead.querySelector(".st").innerHTML = `Zombies <b>${Z.hunt ? Z.hunt.killed + "/" + Z.hunt.total : D.wave}</b> &nbsp;·&nbsp; Kills <b>${P.kills}</b> &nbsp;·&nbsp; Headshots <b>${P.heads}</b><br>Score <b>${P.score}</b> &nbsp;·&nbsp; Best <b>${P.best}</b>`;
    dead.classList.add("on");
  };
  H.hideDeath = () => dead.classList.remove("on");
  H.scope = (on) => root.classList.toggle("scoped", !!on);

  // ---- phone buttons ---------------------------------------------------------------
  function tbtn(id, html, onDown, onUp) {
    const b = document.createElement("div");
    b.className = "zwb";
    b.id = id;
    b.innerHTML = html;
    document.body.appendChild(b);
    b.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        b.classList.add("on");
        onDown && onDown(e);
      },
      { passive: false },
    );
    const up = (e) => {
      e.preventDefault();
      b.classList.remove("on");
      onUp && onUp(e);
    };
    b.addEventListener("touchend", up, { passive: false });
    b.addEventListener("touchcancel", up, { passive: false });
    return b;
  }
  // FIRE: hold to shoot - and slide the thumb to aim while shooting
  let fireId = null,
    fx0 = 0,
    fy0 = 0;
  const fireBtn = tbtn(
    "zwb-fire",
    "🔥",
    (e) => {
      const t = e.changedTouches[0];
      fireId = t.identifier;
      fx0 = t.clientX;
      fy0 = t.clientY;
      Z.weapons.input.fire = true;
      if (Z.race) Z.race.fireTouch = true;
    },
    () => {
      fireId = null;
      Z.weapons.input.fire = false;
      if (Z.race) Z.race.fireTouch = false;
    },
  );
  fireBtn.addEventListener(
    "touchmove",
    (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier !== fireId) continue;
        const dx = t.clientX - fx0,
          dy = t.clientY - fy0;
        fx0 = t.clientX;
        fy0 = t.clientY;
        const k = Z.weapons.scoped ? 0.0012 : 0.0045;
        api.yaw -= dx * k;
        api.pitch = Z.clamp(api.pitch - dy * k, -1.5, 1.5);
      }
    },
    { passive: false },
  );
  tbtn("zwb-swap", "⇄", () => Z.weapons.cycle(1));
  tbtn("zwb-reload", "↻", () => Z.weapons.reload());
  const nadeBtn = tbtn("zwb-nade", "💣<sup></sup>", () => Z.weapons.throwGrenade());
  const strikeBtn = tbtn("zwb-strike", "✈️<sup></sup>", () => Z.weapons.callStrike());
  tbtn("zwb-scope", "🎯", () => Z.weapons.toggleScope());

  // ---- the radar: heading-up, the dead in red --------------------------------------
  const radar = document.getElementById("radar");
  const rg = radar.getContext("2d");
  let radarT = 0;
  function drawRadar() {
    const S = radar.width,
      c = S / 2,
      Rr = S / 2 - 4,
      RANGE = 75;
    rg.clearRect(0, 0, S, S);
    rg.beginPath();
    rg.arc(c, c, Rr, 0, 7);
    rg.fillStyle = "rgba(8, 12, 8, 0.72)";
    rg.fill();
    rg.lineWidth = 2;
    rg.strokeStyle = "rgba(200, 50, 30, 0.6)";
    rg.stroke();
    rg.lineWidth = 1;
    rg.strokeStyle = "rgba(160, 200, 150, 0.15)";
    for (const f of [0.33, 0.66]) {
      rg.beginPath();
      rg.arc(c, c, Rr * f, 0, 7);
      rg.stroke();
    }
    // a sweep
    const sw = (Z.rt * 1.6) % 6.283;
    const gr = rg.createConicGradient ? rg.createConicGradient(sw - 0.6, c, c) : null;
    if (gr) {
      gr.addColorStop(0, "rgba(120, 255, 120, 0)");
      gr.addColorStop(0.09, "rgba(120, 255, 120, 0.13)");
      gr.addColorStop(0.1, "rgba(120, 255, 120, 0)");
      rg.fillStyle = gr;
      rg.beginPath();
      rg.arc(c, c, Rr, 0, 7);
      rg.fill();
    }
    const yaw = api.yaw,
      fx = -Math.sin(yaw),
      fz = -Math.cos(yaw),
      rx = Math.cos(yaw),
      rz = -Math.sin(yaw);
    const p = Z.ppos();
    const sc = Rr / RANGE;
    const proj = (x, z, clampRim) => {
      const dx = x - p.x,
        dz = z - p.z;
      let u = (dx * rx + dz * rz) * sc,
        v = -(dx * fx + dz * fz) * sc;
      const l = Math.hypot(u, v);
      if (l > Rr - 3) {
        if (!clampRim) return null;
        u *= (Rr - 4) / l;
        v *= (Rr - 4) / l;
      }
      return [c + u, c + v];
    };
    const dot = (q, r, col) => {
      rg.beginPath();
      rg.arc(q[0], q[1], r, 0, 7);
      rg.fillStyle = col;
      rg.fill();
    };
    for (const it of Z.pickups.list) {
      const q = proj(it.pos.x, it.pos.z, it.kind === "drop");
      if (!q) continue;
      rg.fillStyle = it.kind === "weapon" || it.kind === "drop" ? "#ffd84a" : it.kind === "health" ? "#5dff7a" : it.kind === "armor" ? "#6aa8ff" : "#d8d0b0";
      if (it.kind === "health") {
        rg.fillRect(q[0] - 3.5, q[1] - 1, 7, 2);
        rg.fillRect(q[0] - 1, q[1] - 3.5, 2, 7);
      } else rg.fillRect(q[0] - 2.5, q[1] - 2.5, 5, 5);
    }
    const pulse = 0.6 + 0.4 * Math.sin(Z.rt * 8);
    for (const zb of Z.zombies.list) {
      if (!zb.alive) continue;
      const q = proj(zb.pos.x, zb.pos.z, zb.def.big);
      if (!q) continue;
      const hunting = zb.state === "chase" || zb.state === "attack" || zb.state === "scream";
      if (zb.def.big) {
        dot(q, zb.def.giant ? 7 : 5.5, `rgba(255, 60, 20, ${pulse})`);
        rg.strokeStyle = "#fff";
        rg.stroke();
      } else dot(q, hunting ? 3.2 : 2.2, hunting ? `rgba(255, 40, 30, ${pulse})` : "rgba(170, 40, 30, 0.75)");
    }
    for (const a of Z.aircraft.list) {
      if (!a.alive || !a.pos) continue;
      const q = proj(a.pos.x, a.pos.z, true);
      rg.save();
      rg.translate(q[0], q[1]);
      rg.fillStyle = a.friendly ? "#7ad0ff" : "#ff9a2a";
      rg.beginPath();
      rg.moveTo(0, -6);
      rg.lineTo(5, 5);
      rg.lineTo(-5, 5);
      rg.closePath();
      rg.fill();
      rg.restore();
    }
    // 🏁 the race gates
    if (Z.race) Z.race.radar(proj, dot, rg);
    // her
    rg.fillStyle = "#fff";
    rg.beginPath();
    rg.moveTo(c, c - 6);
    rg.lineTo(c + 4.5, c + 5);
    rg.lineTo(c, c + 2.5);
    rg.lineTo(c - 4.5, c + 5);
    rg.closePath();
    rg.fill();
  }

  // ---- per frame --------------------------------------------------------------------------
  let lastList = "";
  H.update = (dt) => {
    if (!Z.entered) return;
    const P = Z.player,
      W = Z.weapons;
    // bars
    const hp = Math.max(0, P.hp);
    el.hpI.style.width = (hp / P.max) * 100 + "%";
    if (hp < lastHp - 0.5 || hp > lastHp) el.hpU.style.width = (hp / P.max) * 100 + "%";
    lastHp = hp;
    el.hpT.textContent = Math.ceil(hp);
    el.hpBar.classList.toggle("low", hp < P.max * 0.3);
    el.arI.style.width = P.armor + "%";
    el.arBar.style.opacity = P.armor > 0 ? 1 : 0.35;
    // the gun
    const w = W.cur;
    if (w) {
      el.nm.textContent = w.name;
      if (w.melee) {
        el.am.innerHTML = w.fuel ? `${Math.ceil(W.ammoOf(w))}<small> %</small>` : "∞";
        el.am.classList.remove("out");
      } else {
        const mag = W.magOf(w),
          res = W.reserveOf(w);
        el.am.innerHTML = w.belt ? `${mag}<small> belt</small>` : `${mag}<small> / ${res === Infinity ? "∞" : res}</small>`;
        el.am.classList.toggle("out", mag === 0);
      }
      el.ex.textContent = `💣 ${W.grenades}   ✈️ ${W.strikes}`;
      el.rl.style.opacity = W.reloading ? 1 : 0;
      el.rlI.style.width = (W.reloadFrac * 100).toFixed(0) + "%";
      root.classList.toggle("melee", !!w.melee);
      el.xh.classList.toggle("melee", !!w.melee);
      document.body.classList.toggle("zw-sniper", w.id === "sniper");
      const sig = W.owned.map((x) => x.id + (x === w ? "*" : "")).join(",");
      if (sig !== lastList) {
        lastList = sig;
        el.list.innerHTML = W.owned.map((x) => `<span class="${x === w ? "on" : ""}">${x.key} ${x.short}</span>`).join("");
      }
    }
    nadeBtn.querySelector("sup").textContent = W.grenades || "";
    strikeBtn.querySelector("sup").textContent = W.strikes || "";
    strikeBtn.style.opacity = W.strikes ? 1 : 0.35;
    nadeBtn.style.opacity = W.grenades ? 1 : 0.35;
    // crosshair spread
    const s = 6 + W.spreadPx;
    el.xt.style.top = -s - 9 + "px";
    el.xb.style.top = s + "px";
    el.xl.style.left = -s - 9 + "px";
    el.xr.style.left = s + "px";
    // score line
    const D = Z.director;
    scoreEl.textContent = Z.hunt
      ? `🧟 ${Z.hunt.killed} / ${Z.hunt.total}   ·   ${P.score}`
      : `☠ ${P.kills}   ·   WAVE ${D.wave}   ·   ${P.score}`;
    // overlays
    hurtA = Math.max(0, hurtA - dt * 1.3);
    el.vig.style.opacity = hurtA.toFixed(3);
    el.low.style.opacity = hp < P.max * 0.3 && !P.dead ? 1 : 0;
    flashA = Math.max(0, flashA - dt * 2.5);
    el.wf.style.opacity = flashA.toFixed(3);
    el.bt.style.opacity = Z.rt < Z.bulletUntil ? 1 : 0;
    hmT -= dt;
    el.hm.style.opacity = hmT > 0 ? 1 : 0;
    skullT -= dt;
    el.skull.style.opacity = skullT > 0 ? Math.min(1, skullT * 4) : 0;
    msgT -= dt;
    el.msg.style.opacity = msgT > 0 ? 1 : 0;
    popT -= dt;
    el.pop.style.opacity = popT > 0 ? Math.min(1, popT * 3) : 0;
    el.pop.style.transform = `scale(${1 + Math.max(0, popT - 0.9) * 2})`;
    warnT -= dt;
    el.warn.style.opacity = warnT > 0 ? 1 : 0;
    el.warn.classList.toggle("on", warnT > 0);
    // damage arcs point at where it came from
    const p = Z.ppos();
    for (let i = 0; i < 4; i++) {
      dmgA[i] = Math.max(0, dmgA[i] - dt * 0.9);
      el.dmg[i].style.opacity = dmgA[i].toFixed(2);
      if (dmgA[i] > 0 && dmgSrc[i]) {
        const dx = dmgSrc[i].x - p.x,
          dz = dmgSrc[i].z - p.z;
        const ang = Math.atan2(dx, dz); // world bearing
        const rel = -(ang - (api.yaw + Math.PI));
        el.dmg[i].style.transform = `rotate(${rel}rad)`;
      }
    }
    radarT += dt;
    if (radarT > 0.1) {
      radarT = 0;
      drawRadar();
    }
  };
}
