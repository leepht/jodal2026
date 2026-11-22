/*
 * sd_walk.js — 마을 화면(허브) 2D 도로 그래프 기반 SD 주민 생활 & 걷기 연출
 *  - map_village_ruined / map_village_restored (1152x2016)의 실제 돌길·광장·건물 앞 좌표를 따라
 *    마을 전체(성문 ~ 공방 ~ 창고 ~ 검수소 ~ 본청 ~ 남쪽 입구)를 2D로 자연스럽게 이동
 *  - Y축 원근 크기 보정 + Y-sorting(z-index) + 3프레임 걷기(서기↔왼발↔서기↔오른발)
 *  - 주민 SD를 터치/클릭하면 고개를 돌리며 한 줄 말풍선 반응!
 */
(function () {
  "use strict";
  try {
    var DIR = "assets/village/";
    var IMG_W = 1152, IMG_H = 2016;

    // 실제 마을 지도(1152x2016)의 노란 돌길 중심선 & 건물 현관 앞 웨이포인트 그래프
    var NODES = {
      gate:         { x: 0.73, y: 0.20, next: ["upper_road"] },
      upper_road:   { x: 0.61, y: 0.26, next: ["gate", "workshop_fork"] },
      workshop_fork:{ x: 0.50, y: 0.34, next: ["upper_road", "workshop_door", "mid_upper"] },
      workshop_door:{ x: 0.33, y: 0.34, next: ["workshop_fork"] },
      mid_upper:    { x: 0.42, y: 0.42, next: ["workshop_fork", "warehouse_door", "mid_plaza"] },
      warehouse_door:{ x: 0.30, y: 0.41, next: ["mid_upper"] },
      mid_plaza:    { x: 0.41, y: 0.52, next: ["mid_upper", "inspect_fork"] },
      inspect_fork: { x: 0.53, y: 0.62, next: ["mid_plaza", "inspect_door", "center_sq"] },
      inspect_door: { x: 0.67, y: 0.56, next: ["inspect_fork"] },
      center_sq:    { x: 0.54, y: 0.69, next: ["inspect_fork", "lower_fork"] },
      lower_fork:   { x: 0.57, y: 0.77, next: ["center_sq", "office_door", "board_door", "south_road"] },
      office_door:  { x: 0.44, y: 0.76, next: ["lower_fork"] },
      board_door:   { x: 0.69, y: 0.77, next: ["lower_fork"] },
      south_road:   { x: 0.56, y: 0.86, next: ["lower_fork", "south_entry"] },
      south_entry:  { x: 0.51, y: 0.93, next: ["south_road"] },
    };

    // 캐릭터별 활동 구역 · 초기 거점 · 터치 시 대사 말풍선
    var NPC_DEFS = [
      { key: "chief",       home: "gate",          zone: ["gate", "upper_road", "workshop_fork", "mid_upper"],
        lines: ["허허, 자네 덕분에 마을에 활기가 도는구먼!", "성문 경계는 이상 없네. 천천히 둘러보게나."] },
      { key: "inventor",    home: "workshop_door", zone: ["workshop_door", "workshop_fork", "mid_upper", "warehouse_door"],
        lines: ["자동 마력 포탑 출력이 최고조다냥!", "새 마력 코어 설계도 구경할래냥?"] },
      { key: "guard",       home: "upper_road",    zone: ["gate", "upper_road", "workshop_fork", "mid_upper", "mid_plaza"],
        lines: ["개척촌 순찰 이상 무! 보급로도 안전합니다!", "행정관님, 언제든 출동 준비 완료입니다!"] },
      { key: "villager_01", home: "mid_plaza",     zone: ["mid_upper", "mid_plaza", "inspect_fork", "inspect_door", "center_sq"],
        lines: ["오늘 들어온 정품 목재 품질이 끝내주던데요!", "고양이 발바닥 인장이 꾹 찍혀 있으니 안심이에요~"] },
      { key: "merchant",    home: "board_door",    zone: ["inspect_door", "inspect_fork", "center_sq", "lower_fork", "board_door"],
        lines: ["이제는 정직한 단가로 당당히 입찰합니다요!", "나라장터 게시판이 깔끔해지니 장사할 맛 납니다!"] },
      { key: "villager_02", home: "office_door",   zone: ["mid_plaza", "center_sq", "lower_fork", "office_door", "south_road"],
        lines: ["본청 집무실 불이 밤늦게까지 켜져 있더라고요!", "행정관님, 무리하지 마시고 쉬엄쉬엄 하세요~"] },
      { key: "villager_03", home: "south_road",    zone: ["center_sq", "lower_fork", "board_door", "south_road", "south_entry"],
        lines: ["남쪽 보급로로 수레가 술술 들어오고 있어요!", "마을이 하루가 다르게 되살아나는 게 보여요!"] },
      { key: "captain",     home: "inspect_fork",  zone: ["gate", "upper_road", "workshop_fork", "mid_plaza", "inspect_fork", "center_sq"],
        lines: ["전선 경비대 전원, 보급 물자 수령 완료했습니다.", "공정한 조달이 곧 최강의 방어선입니다!"] },
    ];

    var css = [
      ".hub-sd-walkers{transition:left 0.55s ease-out,bottom 0.55s ease-out!important;z-index:8!important;}",
      ".hub-sd-walkers img[data-sd]{scale:var(--face,1) 1;animation:sdIdleSoft 1.2s ease-in-out infinite alternate;}",
      ".hub-sd-walkers.sdw-moving img[data-sd]{animation:sdStepSoft .42s ease-in-out infinite;}",
      ".sdw-player{display:flex;flex-direction:column;align-items:center;gap:1px;}",
      ".sdw-player img{width:56px!important;height:56px!important;object-fit:contain;filter:drop-shadow(0 4px 8px rgba(0,0,0,.65));}",
      ".sdw-player .hub-player-pin{padding:2px 7px;font-size:10px;animation:none;}",
      ".sdw-npc-layer{position:absolute;inset:0;z-index:3;pointer-events:none;overflow:hidden;}",
      ".sdw-npc-wrap{position:absolute;left:0;top:0;width:48px;height:48px;margin-left:-24px;margin-top:-42px;pointer-events:auto;cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-select:none;will-change:transform;}",
      ".sdw-npc-wrap::before{content:'';position:absolute;left:50%;bottom:2px;width:26px;height:8px;margin-left:-13px;border-radius:50%;background:rgba(0,0,0,0.34);filter:blur(1.5px);}",
      ".sdw-npc{display:block;width:100%;height:100%;object-fit:contain;scale:var(--face,1) 1;filter:drop-shadow(0 3px 5px rgba(0,0,0,.5));animation:sdIdleSoft 1.35s ease-in-out infinite alternate;}",
      ".sdw-npc.sdw-moving{animation:sdStepSoft .40s ease-in-out infinite;}",
      ".sdw-npc-wrap.sdw-hop .sdw-npc{animation:sdTapHop .36s cubic-bezier(.22,.8,.36,1)!important;}",
      ".sdw-bubble{position:absolute;left:50%;bottom:calc(100% + 4px);transform:translateX(-50%) scale(0.85);opacity:0;pointer-events:none;white-space:nowrap;max-width:210px;overflow:hidden;text-overflow:ellipsis;padding:4px 9px;border-radius:10px;background:rgba(8,13,26,0.92);border:1px solid rgba(240,201,105,0.75);color:#fef9c3;font-size:11px;font-weight:700;box-shadow:0 4px 12px rgba(0,0,0,0.6);transition:opacity .18s ease,transform .18s ease;z-index:90;}",
      ".sdw-bubble.show{opacity:1;transform:translateX(-50%) scale(1);}",
      "@keyframes sdIdleSoft{0%{transform:translateY(0) rotate(-1.2deg)}100%{transform:translateY(-3px) rotate(1.2deg)}}",
      "@keyframes sdStepSoft{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-4px) rotate(3deg)}}",
      "@keyframes sdTapHop{0%{transform:translateY(0) scale(1)}40%{transform:translateY(-12px) scale(1.12)}100%{transform:translateY(0) scale(1)}}",
    ].join("\n");
    var st = document.createElement("style");
    st.id = "sd-walk-style";
    st.textContent = css;
    document.head.appendChild(st);

    // ---- 걷기 그림 사전 로드 ----
    var walkOk = { narumi: false, dali: false };
    var walk2Ok = { narumi: false, dali: false };
    function frames(key) {
      if (!(key in walkOk)) {
        walkOk[key] = false;
        walk2Ok[key] = false;
        var p = new Image();
        p.onload = function () { walkOk[key] = true; };
        p.src = DIR + "sd_" + key + "_walk.png";
        var p2 = new Image();
        p2.onload = function () { walk2Ok[key] = true; };
        p2.src = DIR + "sd_" + key + "_walk2.png";
      }
      var stand = DIR + "sd_" + key + ".png";
      var walk = DIR + "sd_" + key + "_walk.png";
      var walk2 = DIR + "sd_" + key + "_walk2.png";
      var cycle = walkOk[key] ? (walk2Ok[key] ? [walk, stand, walk2, stand] : [walk, stand]) : [stand];
      return { stand: stand, walk: walk, hasWalk: walkOk[key], cycle: cycle };
    }
    function setWalking(img, on) {
      var key = img && img.getAttribute("data-sd");
      if (!key) return;
      clearInterval(img._sdwT);
      img._sdwT = null;
      img.classList.toggle("sdw-moving", !!on);
      var f = frames(key);
      if (!on) {
        if (img.src.indexOf(f.stand) < 0) img.src = f.stand;
        return;
      }
      var n = 0;
      img._sdwT = setInterval(function () {
        var ff = frames(key);
        if (!ff.hasWalk) return;
        img.src = ff.cycle[n % ff.cycle.length];
        n += 1;
      }, 175);
    }
    function face(img, dir) { if (img) img.style.setProperty("--face", dir < 0 ? "-1" : "1"); }

    var hub, walkers, mapBox, mapImg, playerImg, npcLayer;
    var npcs = [];
    var rafId = null;

    function gender() {
      var app = document.getElementById("app");
      var g = app && app.getAttribute("data-gender");
      return g === "f" ? "f" : "m";
    }

    // hub_map.js 와 동일한 object-fit: cover 좌표 투영
    function getMapRect() {
      var bw = mapBox.clientWidth || 390;
      var bh = mapBox.clientHeight || 680;
      var iw = (mapImg && mapImg.naturalWidth) || IMG_W;
      var ih = (mapImg && mapImg.naturalHeight) || IMG_H;
      var sc = Math.max(bw / iw, bh / ih);
      return { bw: bw, bh: bh, w: iw * sc, h: ih * sc, x: (bw - iw * sc) / 2, y: (bh - ih * sc) / 2 };
    }
    function normToPx(nx, ny, rect) {
      return { x: rect.x + nx * rect.w, y: rect.y + ny * rect.h };
    }

    // ---- 주인공 SD ----
    function ensurePlayer() {
      if (!walkers) return;
      var pin = document.getElementById("hub-player-pin");
      if (!pin) return;
      var wrap = pin.parentNode;
      if (!wrap.classList || !wrap.classList.contains("sdw-player")) {
        wrap = document.createElement("div");
        wrap.className = "sdw-player";
        pin.parentNode.insertBefore(wrap, pin);
        wrap.appendChild(pin);
      }
      playerImg = wrap.querySelector("img[data-sd]");
      if (!playerImg) {
        playerImg = document.createElement("img");
        playerImg.alt = "행정관 SD";
        playerImg.onerror = function () { this.style.display = "none"; };
        wrap.appendChild(playerImg);
      }
      var key = gender() === "f" ? "player_f" : "player_m";
      playerImg.setAttribute("data-sd", key);
      playerImg.style.display = "";
      playerImg.src = DIR + "sd_" + key + ".png";
      var imgs = walkers.querySelectorAll(":scope > img");
      imgs.forEach(function (im) {
        if (im.getAttribute("data-sd")) return;
        var m = (im.getAttribute("src") || "").match(/sd_([a-z0-9_]+)\.png/);
        if (m) im.setAttribute("data-sd", m[1]);
      });
    }

    var lastX = 50;
    function onWalkerMove() {
      var x = parseFloat(walkers.style.left);
      if (!isFinite(x) || Math.abs(x - lastX) < 0.5) return;
      var dir = x < lastX ? -1 : 1;
      lastX = x;
      var imgs = walkers.querySelectorAll("img[data-sd]");
      imgs.forEach(function (im) { face(im, dir); setWalking(im, true); });
      walkers.classList.add("sdw-moving");
      clearTimeout(walkers._sdwStop);
      walkers._sdwStop = setTimeout(function () {
        walkers.classList.remove("sdw-moving");
        imgs.forEach(function (im) { setWalking(im, false); });
      }, 620);
    }

    // ---- 도로 그래프 최단 경로(BFS) ----
    function findPath(startId, goalId) {
      if (startId === goalId) return [];
      var q = [[startId]];
      var seen = {};
      seen[startId] = true;
      while (q.length) {
        var path = q.shift();
        var cur = path[path.length - 1];
        var nexts = (NODES[cur] && NODES[cur].next) || [];
        for (var i = 0; i < nexts.length; i++) {
          var nb = nexts[i];
          if (seen[nb]) continue;
          var np = path.concat(nb);
          if (nb === goalId) return np.slice(1);
          seen[nb] = true;
          q.push(np);
        }
      }
      return [];
    }

    function stopNpcs() {
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
      npcs.forEach(function (n) {
        clearInterval(n.img._sdwT);
        clearTimeout(n.bubbleTimer);
      });
      npcs = [];
    }

    function progressStep() {
      var t = (document.getElementById("hub-progress-text") || {}).textContent || "";
      var m = t.match(/(\d)\s*\/\s*6/);
      return m ? parseInt(m[1], 10) : 0;
    }

    function pickNextRoute(n) {
      var pool = n.def.zone;
      var choices = pool.filter(function (id) { return id !== n.nodeId; });
      if (!choices.length) choices = Object.keys(NODES);
      var targetId = choices[Math.floor(Math.random() * choices.length)];
      n.queue = findPath(n.nodeId, targetId);
      if (!n.queue.length) {
        n.waitUntil = performance.now() + 1400;
        return;
      }
      advanceSegment(n, performance.now());
    }

    function advanceSegment(n, now) {
      var nextId = n.queue.shift();
      var tgt = NODES[nextId];
      if (!tgt) {
        n.walking = false;
        setWalking(n.img, false);
        n.waitUntil = now + 1400 + Math.random() * 2400;
        return;
      }
      // 길 폭 안에서 미세 오프셋(주민끼리 완전히 겹치지 않도록)
      var jitterX = (Math.random() - 0.5) * 0.045;
      var jitterY = (Math.random() - 0.5) * 0.018;
      n.sx = n.x; n.sy = n.y;
      n.tx = Math.max(0.12, Math.min(0.88, tgt.x + jitterX));
      n.ty = Math.max(0.18, Math.min(0.95, tgt.y + jitterY));
      n.nodeId = nextId;
      var dist = Math.hypot((n.tx - n.sx) * 0.72, n.ty - n.sy);
      n.durMs = Math.max(950, (dist / n.speed) * 1000);
      n.startTime = now;
      n.walking = true;
      if (Math.abs(n.tx - n.sx) > 0.008) face(n.img, n.tx < n.sx ? -1 : 1);
      setWalking(n.img, true);
    }

    function startNpcs() {
      if (!mapBox) return;
      if (!npcLayer || !npcLayer.isConnected) {
        npcLayer = document.createElement("div");
        npcLayer.className = "sdw-npc-layer";
        mapBox.appendChild(npcLayer);
      }
      stopNpcs();
      npcLayer.innerHTML = "";

      var step = progressStep();
      // 기본부터 마을 전역에 6명 활동, 재건が進행되면 경비대장 포함 8명까지 활기 증가
      var activeCount = step >= 3 ? NPC_DEFS.length : (step >= 1 ? 7 : 6);
      var defs = NPC_DEFS.slice(0, activeCount);
      // [에셋 세션] 함께 사는 주민 16명(village_residents.js): 처음 8명 → 진행도마다 +3명 (복구 후 전원)
      var EXTRA = Array.isArray(window.NAKKE_EXTRA_RESIDENTS) ? window.NAKKE_EXTRA_RESIDENTS : [];
      defs = defs.concat(EXTRA.slice(0, Math.min(EXTRA.length, 8 + step * 3)));
      var now = performance.now();

      defs.forEach(function (def, idx) {
        var home = NODES[def.home] || NODES.center_sq;
        var wrap = document.createElement("div");
        wrap.className = "sdw-npc-wrap";

        var img = document.createElement("img");
        img.className = "sdw-npc";
        img.alt = def.key;
        img.setAttribute("data-sd", def.key);
        img.onerror = function () { wrap.style.display = "none"; };
        img.src = DIR + "sd_" + def.key + ".png";
        frames(def.key); // 걷기 프레임 미리 로드

        var bubble = document.createElement("div");
        bubble.className = "sdw-bubble";

        wrap.appendChild(img);
        wrap.appendChild(bubble);
        npcLayer.appendChild(wrap);

        var npc = {
          def: def,
          wrap: wrap,
          img: img,
          bubble: bubble,
          nodeId: def.home,
          x: home.x + (Math.random() - 0.5) * 0.04,
          y: home.y + (Math.random() - 0.5) * 0.015,
          sx: home.x, sy: home.y,
          tx: home.x, ty: home.y,
          speed: 0.062 + Math.random() * 0.024, // 정규화 거리/초
          queue: [],
          walking: false,
          startTime: now,
          durMs: 1000,
          waitUntil: now + 350 + idx * 380,
          bubbleTimer: null,
          lineIdx: idx % def.lines.length,
        };
        face(img, Math.random() < 0.5 ? -1 : 1);

        // 터치/클릭 시 폴짝 뛰며 말풍선 표시!
        wrap.addEventListener("pointerdown", function (ev) {
          ev.stopPropagation();
          wrap.classList.remove("sdw-hop");
          void wrap.offsetWidth;
          wrap.classList.add("sdw-hop");
          bubble.textContent = def.lines[npc.lineIdx % def.lines.length];
          npc.lineIdx++;
          bubble.classList.add("show");
          clearTimeout(npc.bubbleTimer);
          npc.bubbleTimer = setTimeout(function () {
            bubble.classList.remove("show");
            wrap.classList.remove("sdw-hop");
          }, 2400);
          // 잠깐 멈춰서 인사
          if (npc.walking) {
            npc.walking = false;
            npc.queue = [];
            setWalking(npc.img, false);
          }
          npc.waitUntil = performance.now() + 2000;
        });

        npcs.push(npc);
      });

      function stepLoop(ts) {
        if (!hub.classList.contains("active")) { rafId = null; return; }
        var rect = getMapRect();
        for (var i = 0; i < npcs.length; i++) {
          var n = npcs[i];
          if (n.walking) {
            var p = Math.min(1, (ts - n.startTime) / n.durMs);
            n.x = n.sx + (n.tx - n.sx) * p;
            n.y = n.sy + (n.ty - n.sy) * p;
            if (p >= 1) {
              if (n.queue.length) {
                advanceSegment(n, ts);
              } else {
                n.walking = false;
                setWalking(n.img, false);
                n.waitUntil = ts + 1400 + Math.random() * 2600;
              }
            }
          } else if (ts >= n.waitUntil) {
            pickNextRoute(n);
          }

          var px = normToPx(n.x, n.y, rect);
          // 원근 보정: 위(성문 0.20)는 약간 작게(0.82), 아래(남쪽 0.93)는 약간 크게(1.06)
          var perspScale = 0.80 + Math.max(0, Math.min(1, (n.y - 0.18) / 0.78)) * 0.28;
          n.wrap.style.transform = "translate3d(" + px.x.toFixed(1) + "px," + px.y.toFixed(1) + "px,0) scale(" + perspScale.toFixed(3) + ")";
          // 아래쪽 캐릭터가 자연스럽게 앞 레이어에 오도록 Y-sorting
          n.wrap.style.zIndex = String(10 + Math.round(n.y * 60));
        }
        rafId = requestAnimationFrame(stepLoop);
      }
      rafId = requestAnimationFrame(stepLoop);
    }

    function onHubChange() {
      if (hub.classList.contains("active")) {
        lastX = parseFloat(walkers.style.left) || 50;
        ensurePlayer();
        setTimeout(startNpcs, 100);
      } else {
        stopNpcs();
      }
    }

    function init() {
      hub = document.getElementById("village-hub-layer");
      walkers = document.getElementById("hub-sd-walkers");
      mapImg = document.getElementById("hub-map-img");
      mapBox = mapImg ? mapImg.parentNode : (walkers ? walkers.parentNode : null);
      if (!hub || !walkers || !mapBox) return;
      new MutationObserver(onHubChange).observe(hub, { attributes: true, attributeFilter: ["class"] });
      new MutationObserver(onWalkerMove).observe(walkers, { attributes: true, attributeFilter: ["style"] });
      if (hub.classList.contains("active")) onHubChange();
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  } catch (e) {
    if (window.console) console.warn("sd_walk.js 비활성:", e);
  }
})();
