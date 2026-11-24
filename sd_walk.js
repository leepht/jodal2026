/*
 * sd_walk.js — 마을 화면(허브) 2D 도로 그래프 기반 SD 주민 생활 & 손 드래그 이동(도로 경계 제한)
 *  - map_village_ruined / map_village_restored (1152x2016)의 실제 돌길·광장·건물 앞 좌표를 따라
 *    마을 전체(성문 ~ 공방 ~ 창고 ~ 검수소 ~ 본청 ~ 남쪽 입구)를 2D로 자연스럽게 이동
 *  - 행정관 + 나르미 + 달이 3인 밀착 대형 및 도로 위 직접 손 드래그 이동 지원 (도로 밖 건물·숲 침범 차단!)
 *  - 주민 SD도 직접 손으로 잡아 도로 위 원하는 위치로 이동 가능 (짧게 톡 탭하면 말풍선 인사)
 */
(function () {
  "use strict";
  try {
    var DIR = "assets/village/";
    var IMG_W = 1152, IMG_H = 2016;
    var ASPECT_Y = IMG_H / IMG_W; // 1.75 (정규화 거리 계산 시 X/Y 등방 보정)

    // 실제 마을 지도(1152x2016)의 노란 돌길 중심선 & 건물 현관 앞 웨이포인트 그래프
    var NODES = {
      gate:          { x: 0.73, y: 0.20, next: ["upper_road"] },
      upper_road:    { x: 0.62, y: 0.26, next: ["gate", "workshop_fork"] },
      workshop_fork: { x: 0.51, y: 0.34, next: ["upper_road", "workshop_door", "mid_upper"] },
      workshop_door: { x: 0.35, y: 0.34, next: ["workshop_fork"] },
      mid_upper:     { x: 0.42, y: 0.43, next: ["workshop_fork", "warehouse_door", "mid_plaza"] },
      warehouse_door:{ x: 0.33, y: 0.42, next: ["mid_upper"] },
      mid_plaza:     { x: 0.42, y: 0.53, next: ["mid_upper", "inspect_fork"] },
      inspect_fork:  { x: 0.52, y: 0.62, next: ["mid_plaza", "inspect_door", "center_sq"] },
      inspect_door:  { x: 0.67, y: 0.56, next: ["inspect_fork"] },
      center_sq:     { x: 0.55, y: 0.70, next: ["inspect_fork", "lower_fork"] },
      lower_fork:    { x: 0.57, y: 0.77, next: ["center_sq", "office_door", "board_door", "south_road"] },
      office_door:   { x: 0.45, y: 0.76, next: ["lower_fork"] },
      board_door:    { x: 0.68, y: 0.77, next: ["lower_fork"] },
      south_road:    { x: 0.56, y: 0.85, next: ["lower_fork", "south_entry"] },
      south_entry:   { x: 0.53, y: 0.88, next: ["south_road"] },
    };

    // 도로 캡슐 세그먼트 [x1, y1, x2, y2, 도로 반폭(정규화 X 기준)] — 지붕·벽·숲으로 드래그 이탈 원천 차단!
    var ROAD_SEGMENTS = [
      [0.75, 0.19, 0.63, 0.25, 0.048], // 성문 입구 ~ 윗길
      [0.63, 0.25, 0.51, 0.34, 0.054], // 윗길 ~ 공방 삼거리
      [0.51, 0.34, 0.35, 0.34, 0.036], // 발명냥이 공방 현관 지선
      [0.51, 0.34, 0.42, 0.43, 0.054], // 공방 삼거리 ~ 창고 앞
      [0.42, 0.43, 0.33, 0.42, 0.032], // 전략 비축창고 현관 지선
      [0.42, 0.43, 0.42, 0.53, 0.055], // 창고 앞 ~ 중앙 굽잇길
      [0.42, 0.53, 0.52, 0.62, 0.056], // 중앙 굽잇길 ~ 검수소 삼거리
      [0.52, 0.62, 0.67, 0.56, 0.045], // 품질 검수소 현관 마당 지선
      [0.52, 0.62, 0.55, 0.70, 0.060], // 검수소 삼거리 ~ 중앙 광장
      [0.55, 0.70, 0.57, 0.77, 0.062], // 중앙 광장 ~ 남쪽 사거리
      [0.57, 0.77, 0.45, 0.76, 0.038], // 본청 집무실 현관 지선
      [0.57, 0.77, 0.68, 0.77, 0.038], // 나라장터 게시판 현관 지선
      [0.57, 0.77, 0.54, 0.88, 0.052], // 남쪽 진입로 (하단 상태바 위까지만 허용)
    ];

    // 임의 좌표 (nx, ny)를 가장 가까운 도로 캡슐 내부로 투영·제한
    function clampToRoad(nx, ny, isTrio) {
      var cy = Math.max(0.185, Math.min(0.880, ny));
      var cx = Math.max(0.18, Math.min(0.84, nx));
      var px = cx, py = cy * ASPECT_Y;
      var bestDistSq = 1e9, bestProjX = px, bestProjY = py, bestRad = 0.04;
      // 3인 밀착 대열(행정관+나르미+달이)은 양옆 마스코트가 건물 벽에 닿지 않도록 여유 마진 적용
      var radScale = isTrio ? 0.72 : 0.92;

      for (var i = 0; i < ROAD_SEGMENTS.length; i++) {
        var s = ROAD_SEGMENTS[i];
        var ax = s[0], ay = s[1] * ASPECT_Y;
        var bx = s[2], by = s[3] * ASPECT_Y;
        // 좁은 건물 현관 지선에서는 3인 대열의 좌우 마스코트가 벽에 닿지 않도록 끝점 20% 여유
        if (isTrio && s[4] < 0.042) {
          bx = ax + (bx - ax) * 0.78;
          by = ay + (by - ay) * 0.78;
        }
        var r = s[4] * radScale;
        var abx = bx - ax, aby = by - ay;
        var lenSq = abx * abx + aby * aby;
        var t = lenSq > 1e-8 ? ((px - ax) * abx + (py - ay) * aby) / lenSq : 0;
        if (t < 0) t = 0; else if (t > 1) t = 1;
        var qx = ax + abx * t, qy = ay + aby * t;
        var dx = px - qx, dy = py - qy;
        var d = Math.sqrt(dx * dx + dy * dy);
        var excess = Math.max(0, d - r);
        if (excess === 0) {
          // 이미 도로 폭 안쪽이면 손가락 위치 1:1 그대로 허용!
          return { x: cx, y: cy };
        }
        if (excess < bestDistSq) {
          bestDistSq = excess;
          bestProjX = qx + (dx / d) * r;
          bestProjY = qy + (dy / d) * r;
          bestRad = r;
        }
      }
      return {
        x: Math.max(0.20, Math.min(0.82, bestProjX)),
        y: Math.max(0.185, Math.min(0.880, bestProjY / ASPECT_Y)),
      };
    }

    function nearestNodeId(nx, ny) {
      var bestId = "center_sq", bestD = 1e9;
      var keys = Object.keys(NODES);
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i], nd = NODES[k];
        var d = Math.hypot(nx - nd.x, (ny - nd.y) * ASPECT_Y);
        if (d < bestD) { bestD = d; bestId = k; }
      }
      return bestId;
    }

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
      /* 행정관 + 나르미 + 달이 3인 밀착 대형 (이름표가 좌우 간격을 벌리지 않도록 상단 플로팅 + 나르미·달이 크기 확대·밀착!) */
      "#village-hub-layer #hub-sd-walkers{position:absolute!important;left:0!important;top:0!important;bottom:auto!important;width:118px!important;height:70px!important;margin-left:-59px!important;margin-top:-62px!important;",
      "  display:block!important;pointer-events:auto!important;cursor:grab!important;touch-action:none!important;user-select:none!important;-webkit-user-select:none!important;transition:none!important;will-change:transform;}",
      "#village-hub-layer #hub-sd-walkers:active,#village-hub-layer #hub-sd-walkers.sdw-dragging{cursor:grabbing!important;}",
      "#village-hub-layer #hub-sd-walkers::before{content:'';position:absolute;left:50%;bottom:2px;width:78px;height:11px;margin-left:-39px;border-radius:50%;background:rgba(0,0,0,0.38);filter:blur(2px);pointer-events:none;}",
      "#village-hub-layer #hub-sd-walkers img[data-sd]{scale:var(--face,1) 1;animation:sdIdleSoft 1.2s ease-in-out infinite alternate;pointer-events:none;}",
      "#village-hub-layer #hub-sd-walkers.sdw-moving img[data-sd]{animation:sdStepSoft .36s ease-in-out infinite;}",
      "#village-hub-layer .sdw-player{position:absolute!important;left:50%!important;bottom:0!important;transform:translateX(-50%)!important;width:66px!important;height:66px!important;z-index:3!important;display:flex!important;align-items:flex-end!important;justify-content:center!important;pointer-events:none;}",
      "#village-hub-layer .sdw-player img{width:66px!important;height:66px!important;object-fit:contain;filter:drop-shadow(0 4px 8px rgba(0,0,0,.68));}",
      "#village-hub-layer .sdw-player .hub-player-pin{position:absolute!important;left:50%!important;bottom:calc(100% + 1px)!important;transform:translateX(-50%)!important;padding:2px 7px!important;font-size:10px!important;white-space:nowrap!important;animation:none!important;pointer-events:none;}",
      "#village-hub-layer #hub-sd-walkers > img[data-sd='narumi']{position:absolute!important;left:50%!important;bottom:0!important;margin-left:-57px!important;width:60px!important;height:60px!important;z-index:2!important;filter:drop-shadow(0 3px 6px rgba(0,0,0,.62));}",
      "#village-hub-layer #hub-sd-walkers > img[data-sd='dali']{position:absolute!important;left:50%!important;bottom:0!important;margin-left:-3px!important;width:60px!important;height:60px!important;z-index:2!important;filter:drop-shadow(0 3px 6px rgba(0,0,0,.62));}",
      /* 주민 레이어: z-index 스택을 분리하지 않아 행정관 일행과 자연스럽게 Y축 원근 정렬 */
      ".sdw-npc-layer{position:absolute;inset:0;pointer-events:none;overflow:hidden;}",
      ".sdw-npc-wrap{position:absolute;left:0;top:0;width:53px;height:53px;margin-left:-26.5px;margin-top:-46px;pointer-events:auto;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;will-change:transform;}",
      ".sdw-npc-wrap:active,.sdw-npc-wrap.sdw-dragging{cursor:grabbing;}",
      ".sdw-npc-wrap::before{content:'';position:absolute;left:50%;bottom:2px;width:26px;height:8px;margin-left:-13px;border-radius:50%;background:rgba(0,0,0,0.34);filter:blur(1.5px);}",
      ".sdw-npc{display:block;width:100%;height:100%;object-fit:contain;scale:var(--face,1) 1;filter:drop-shadow(0 3px 5px rgba(0,0,0,.5));animation:sdIdleSoft 1.35s ease-in-out infinite alternate;pointer-events:none;}",
      ".sdw-npc.sdw-moving{animation:sdStepSoft .38s ease-in-out infinite;}",
      ".sdw-npc-wrap.sdw-hop .sdw-npc{animation:sdTapHop .36s cubic-bezier(.22,.8,.36,1)!important;}",
      ".sdw-bubble{position:absolute;left:50%;bottom:calc(100% + 4px);transform:translateX(-50%) scale(0.85);opacity:0;pointer-events:none;white-space:nowrap;max-width:210px;overflow:hidden;text-overflow:ellipsis;padding:4px 9px;border-radius:10px;background:rgba(8,13,26,0.92);border:1px solid rgba(240,201,105,0.75);color:#fef9c3;font-size:11px;font-weight:700;box-shadow:0 4px 12px rgba(0,0,0,0.6);transition:opacity .18s ease,transform .18s ease;z-index:90;}",
      ".sdw-bubble.show{opacity:1;transform:translateX(-50%) scale(1);}",
      "#village-hub-layer #hub-grid{z-index:80!important;}",
      "#village-hub-layer #hub-unified-hud{z-index:85!important;}",
      "@keyframes sdIdleSoft{0%{transform:translateY(0) rotate(-1.2deg)}100%{transform:translateY(-3px) rotate(1.2deg)}}",
      "@keyframes sdStepSoft{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-4px) rotate(3deg)}}",
      "@keyframes sdTapHop{0%{transform:translateY(0) scale(1)}40%{transform:translateY(-12px) scale(1.12)}100%{transform:translateY(0) scale(1)}}",
    ].join("\n");
    var st = document.createElement("style");
    st.id = "sd-walk-style";
    st.textContent = css;
    document.head.appendChild(st);

    // ---- 걷기 그림 사전 로드 (나르미·달이는 단일 스탠딩 PNG 사용 → 404 방지) ----
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
      if (!!on === !!img._sdwOn) return;
      img._sdwOn = !!on;
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
      }, 170);
    }
    function face(img, dir) { if (img) img.style.setProperty("--face", dir < 0 ? "-1" : "1"); }

    var hub, walkers, mapBox, mapImg, playerImg, npcLayer;
    var npcs = [];
    var rafId = null;

    // 행정관 + 나르미 + 달이 3인방 상태 (정규화 맵 좌표)
    var player = {
      x: 0.55, y: 0.78,
      sx: 0.55, sy: 0.78,
      tx: 0.55, ty: 0.78,
      gliding: false,
      startTime: 0,
      durMs: 420,
      dragging: false,
      moving: false,
    };

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
    // CSS zoom(1080x1920 세로 모니터 등) 환경에서도 오차 0px인 포인터 → 정규화 맵 좌표 변환
    function clientToNorm(clientX, clientY) {
      var br = mapBox.getBoundingClientRect();
      var mr = getMapRect();
      var relX = (clientX - br.left) / Math.max(1, br.width);
      var relY = (clientY - br.top) / Math.max(1, br.height);
      var lx = relX * mr.bw;
      var ly = relY * mr.bh;
      return {
        x: (lx - mr.x) / Math.max(1, mr.w),
        y: (ly - mr.y) / Math.max(1, mr.h),
      };
    }

    function setTrioMoving(on, dir) {
      if (!walkers) return;
      var imgs = walkers.querySelectorAll("img[data-sd]");
      if (dir) imgs.forEach(function (im) { face(im, dir); });
      if (player.moving === !!on) return;
      player.moving = !!on;
      walkers.classList.toggle("sdw-moving", !!on);
      imgs.forEach(function (im) { setWalking(im, !!on); });
    }

    function renderPlayerTransform(rect) {
      if (!walkers) return;
      var px = normToPx(player.x, player.y, rect);
      var perspScale = (0.82 + Math.max(0, Math.min(1, (player.y - 0.18) / 0.78)) * 0.24) * (player.dragging ? 1.06 : 1);
      walkers.style.transform = "translate3d(" + px.x.toFixed(1) + "px," + px.y.toFixed(1) + "px,0) scale(" + perspScale.toFixed(3) + ")";
      walkers.style.zIndex = String(player.dragging ? 78 : (11 + Math.round(player.y * 60)));
    }

    // hub_map.js 에서 거점 핀을 눌렀을 때 호출되는 공식 연동 함수
    window.NakkeWalkPlayerTo = function (nx, ny, instant) {
      var cl = clampToRoad(nx, ny, true);
      if (instant) {
        player.gliding = false;
        player.x = player.tx = cl.x;
        player.y = player.ty = cl.y;
        setTrioMoving(false, 0);
        if (mapBox) renderPlayerTransform(getMapRect());
        return;
      }
      player.sx = player.x; player.sy = player.y;
      player.tx = cl.x; player.ty = cl.y;
      var d = Math.hypot(player.tx - player.sx, (player.ty - player.sy) * ASPECT_Y);
      player.durMs = Math.max(260, Math.min(680, d * 950));
      player.startTime = performance.now();
      player.gliding = true;
      var dir = Math.abs(player.tx - player.sx) > 0.005 ? (player.tx < player.sx ? -1 : 1) : 0;
      setTrioMoving(true, dir);
    };

    // ---- 주인공 + 나르미 + 달이 초기화 & 손 드래그 ----
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
      frames(key);
      var imgs = walkers.querySelectorAll(":scope > img");
      imgs.forEach(function (im) {
        if (im.getAttribute("data-sd")) return;
        var m = (im.getAttribute("src") || "").match(/sd_([a-z0-9_]+)\.png/);
        if (m) im.setAttribute("data-sd", m[1]);
      });

      // 행정관+나르미+달이 일행 손 드래그 바인딩 (도로 경계 내부로 제한)
      if (!walkers._dragBound) {
        walkers._dragBound = true;
        var pid = null, offX = 0, offY = 0, idleStopT = null;
        walkers.addEventListener("pointerdown", function (ev) {
          ev.stopPropagation();
          ev.preventDefault();
          pid = ev.pointerId;
          try { walkers.setPointerCapture(pid); } catch (_) {}
          var pt = clientToNorm(ev.clientX, ev.clientY);
          offX = player.x - pt.x;
          offY = player.y - pt.y;
          // 손가락이 너무 멀리 잡혔으면 오프셋 제한
          if (Math.abs(offX) > 0.08) offX = 0;
          if (Math.abs(offY) > 0.06) offY = 0;
          player.dragging = true;
          player.gliding = false;
          walkers.classList.add("sdw-dragging");
          renderPlayerTransform(getMapRect());
        });
        walkers.addEventListener("pointermove", function (ev) {
          if (ev.pointerId !== pid || !player.dragging) return;
          ev.preventDefault();
          var pt = clientToNorm(ev.clientX, ev.clientY);
          var cl = clampToRoad(pt.x + offX, pt.y + offY, true);
          var dx = cl.x - player.x;
          var dy = cl.y - player.y;
          player.x = cl.x;
          player.y = cl.y;
          if (Math.hypot(dx, dy) > 0.0015) {
            setTrioMoving(true, Math.abs(dx) > 0.002 ? (dx < 0 ? -1 : 1) : 0);
            clearTimeout(idleStopT);
            idleStopT = setTimeout(function () { if (player.dragging) setTrioMoving(false, 0); }, 140);
          }
          renderPlayerTransform(getMapRect());
        });
        var endPlayerDrag = function (ev) {
          if (ev.pointerId !== pid) return;
          pid = null;
          player.dragging = false;
          clearTimeout(idleStopT);
          walkers.classList.remove("sdw-dragging");
          setTrioMoving(false, 0);
          renderPlayerTransform(getMapRect());
        };
        walkers.addEventListener("pointerup", endPlayerDrag);
        walkers.addEventListener("pointercancel", endPlayerDrag);
      }
      renderPlayerTransform(getMapRect());
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
      var jitterX = (Math.random() - 0.5) * 0.04;
      var jitterY = (Math.random() - 0.5) * 0.016;
      var cl = clampToRoad(tgt.x + jitterX, tgt.y + jitterY, false);
      n.sx = n.x; n.sy = n.y;
      n.tx = cl.x; n.ty = cl.y;
      n.nodeId = nextId;
      var dist = Math.hypot((n.tx - n.sx) * 0.72, n.ty - n.sy);
      n.durMs = Math.max(950, (dist / n.speed) * 1000);
      n.startTime = now;
      n.walking = true;
      if (Math.abs(n.tx - n.sx) > 0.008) face(n.img, n.tx < n.sx ? -1 : 1);
      setWalking(n.img, true);
    }

    function showNpcBubble(npc) {
      var wrap = npc.wrap, bubble = npc.bubble, def = npc.def;
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
      var activeCount = step >= 3 ? NPC_DEFS.length : (step >= 1 ? 7 : 6);
      var defs = NPC_DEFS.slice(0, activeCount);
      var EXTRA = Array.isArray(window.NAKKE_EXTRA_RESIDENTS) ? window.NAKKE_EXTRA_RESIDENTS : [];
      defs = defs.concat(EXTRA.slice(0, Math.min(EXTRA.length, 8 + step * 3)));
      var now = performance.now();

      defs.forEach(function (def, idx) {
        var home = NODES[def.home] || NODES.center_sq;
        var initPos = clampToRoad(home.x + (Math.random() - 0.5) * 0.036, home.y + (Math.random() - 0.5) * 0.015, false);
        var wrap = document.createElement("div");
        wrap.className = "sdw-npc-wrap";

        var img = document.createElement("img");
        img.className = "sdw-npc";
        img.alt = def.key;
        img.setAttribute("data-sd", def.key);
        img.onerror = function () { wrap.style.display = "none"; };
        img.src = DIR + "sd_" + def.key + ".png";
        frames(def.key);

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
          x: initPos.x,
          y: initPos.y,
          sx: initPos.x, sy: initPos.y,
          tx: initPos.x, ty: initPos.y,
          speed: 0.062 + Math.random() * 0.024,
          queue: [],
          walking: false,
          dragging: false,
          startTime: now,
          durMs: 1000,
          waitUntil: now + 350 + idx * 380,
          bubbleTimer: null,
          lineIdx: idx % def.lines.length,
        };
        face(img, Math.random() < 0.5 ? -1 : 1);

        // 손으로 잡아 도로 안에서 직접 이동 + 짧게 탭하면 말풍선 반응!
        var dPid = null, startCx = 0, startCy = 0, dragged = false, offX = 0, offY = 0, stopWalkT = null;
        wrap.addEventListener("pointerdown", function (ev) {
          ev.stopPropagation();
          ev.preventDefault();
          dPid = ev.pointerId;
          startCx = ev.clientX;
          startCy = ev.clientY;
          dragged = false;
          try { wrap.setPointerCapture(dPid); } catch (_) {}
          var pt = clientToNorm(ev.clientX, ev.clientY);
          offX = npc.x - pt.x;
          offY = npc.y - pt.y;
          if (Math.abs(offX) > 0.06) offX = 0;
          if (Math.abs(offY) > 0.05) offY = 0;
          npc.dragging = true;
          npc.walking = false;
          npc.queue = [];
          setWalking(npc.img, false);
          wrap.classList.add("sdw-dragging");
        });
        wrap.addEventListener("pointermove", function (ev) {
          if (ev.pointerId !== dPid || !npc.dragging) return;
          ev.preventDefault();
          if (!dragged && Math.hypot(ev.clientX - startCx, ev.clientY - startCy) > 5) {
            dragged = true;
          }
          if (!dragged) return;
          var pt = clientToNorm(ev.clientX, ev.clientY);
          var cl = clampToRoad(pt.x + offX, pt.y + offY, false);
          var dx = cl.x - npc.x;
          var dy = cl.y - npc.y;
          npc.x = cl.x;
          npc.y = cl.y;
          if (Math.hypot(dx, dy) > 0.0012) {
            if (Math.abs(dx) > 0.002) face(npc.img, dx < 0 ? -1 : 1);
            setWalking(npc.img, true);
            clearTimeout(stopWalkT);
            stopWalkT = setTimeout(function () { if (npc.dragging) setWalking(npc.img, false); }, 140);
          }
        });
        var endNpcDrag = function (ev) {
          if (ev.pointerId !== dPid) return;
          dPid = null;
          npc.dragging = false;
          clearTimeout(stopWalkT);
          wrap.classList.remove("sdw-dragging");
          setWalking(npc.img, false);
          npc.nodeId = nearestNodeId(npc.x, npc.y);
          npc.waitUntil = performance.now() + 3000;
          if (!dragged) {
            showNpcBubble(npc);
          }
        };
        wrap.addEventListener("pointerup", endNpcDrag);
        wrap.addEventListener("pointercancel", endNpcDrag);

        npcs.push(npc);
      });

      function stepLoop(ts) {
        if (!hub.classList.contains("active")) { rafId = null; return; }
        var rect = getMapRect();

        // 주인공 3인방 거점 자동 이동 보간
        if (player.gliding && !player.dragging) {
          var pp = Math.min(1, (ts - player.startTime) / player.durMs);
          var ease = 1 - Math.pow(1 - pp, 2.2);
          player.x = player.sx + (player.tx - player.sx) * ease;
          player.y = player.sy + (player.ty - player.sy) * ease;
          if (pp >= 1) {
            player.gliding = false;
            setTrioMoving(false, 0);
          }
        }
        renderPlayerTransform(rect);

        // 주민 SD 루프
        for (var i = 0; i < npcs.length; i++) {
          var n = npcs[i];
          if (!n.dragging) {
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
          }

          var px = normToPx(n.x, n.y, rect);
          var perspScale = (0.80 + Math.max(0, Math.min(1, (n.y - 0.18) / 0.78)) * 0.28) * (n.dragging ? 1.09 : 1);
          n.wrap.style.transform = "translate3d(" + px.x.toFixed(1) + "px," + px.y.toFixed(1) + "px,0) scale(" + perspScale.toFixed(3) + ")";
          n.wrap.style.zIndex = String(n.dragging ? 77 : (10 + Math.round(n.y * 60)));
        }
        rafId = requestAnimationFrame(stepLoop);
      }
      rafId = requestAnimationFrame(stepLoop);
    }

    function onHubChange() {
      if (hub.classList.contains("active")) {
        ensurePlayer();
        setTimeout(startNpcs, 80);
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
      if (hub.classList.contains("active")) onHubChange();
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  } catch (e) {
    if (window.console) console.warn("sd_walk.js 비활성:", e);
  }
})();
