/*
 * hub_map.js — 개척촌 100% 풀스크린 마을 지도 + 상단 '원-카드 통합 HUD' + 하단 단일 퀵 이동 버튼
 *  - 상단 중복 HUD 칩 + 헤더 + 하단 스탯바 + 상태바를 모두 1개의 투명 글래스 정보 카드(#hub-unified-hud)로 통합
 *  - 마을 지도는 화면 100%(inset: 0) 가득 차게 표시, 위·아래 오버레이만 투명하게 올려 가독성·시야 동시 확보
 *  - 하단에는 '다음 업무 바로 이동' 단일 버튼만 깔끔하게 플로팅 (보너스 거점은 지도 위 하늘색 핀으로 직관 접근)
 */
(function () {
  "use strict";
  try {
    var IMG_W = 1152, IMG_H = 2016;
    var FAC = {
      office:    { name: "본청 집무실",     pin: [0.24, 0.58], walk: [0.43, 0.74], img: "assets/bg/bg_office.png",
                   after: "책상 위 입찰 서류가 가지런하다. 오늘 맡은 심사는 모두 끝냈다.",
                   peace: "정직한 계약 장부가 쌓여 개척촌 재정이 흑자로 돌아섰다." },
      board:     { name: "나라장터 게시판", pin: [0.78, 0.64], walk: [0.68, 0.75], img: "assets/minigame/map_board.png",
                   after: "공정한 공고만 남은 게시판. 담합 공고는 모두 걸러냈다.",
                   peace: "투명한 공개입찰 공고 앞에 상인들이 질서 있게 줄을 서 있다." },
      inspect:   { name: "품질 검수소",     pin: [0.73, 0.40], walk: [0.65, 0.56], img: "assets/minigame/map_03_convoy.png",
                   after: "강도·순도 검수를 마친 보급 수레가 성문을 향해 출발했다.",
                   peace: "정품 인증을 통과한 목재와 포션이 마을 곳곳으로 안전하게 배송된다." },
      warehouse: { name: "전략 비축창고",   pin: [0.20, 0.35], walk: [0.31, 0.41], img: "assets/minigame/map_warehouse.png",
                   after: "팔레트마다 비축품이 빈틈없이 쌓였다.",
                   peace: "고순도 마력석과 비상 방패가 빈틈없이 정리되어 든든하다." },
      workshop:  { name: "발명냥이 공방",   pin: [0.30, 0.22], walk: [0.35, 0.34], img: "assets/bg/bg_workshop.png",
                   after: "조립을 마친 자동 마력 포탑이 작업대 위에서 푸르게 빛난다.",
                   peace: "혁신 시제품 포탑이 개척촌의 명물이 되어 새 연구가 한창이다." },
      gate:      { name: "개척지 성문",     pin: [0.77, 0.22], walk: [0.72, 0.22], img: "assets/bg/bg_gate_siege.png",
                   after: "", peace: "맑은 하늘 아래 이전 촌장과 나르미, 달이가 기다리고 있다." },
    };
    var START = [0.54, 0.78];
    var BY_NAME = {};
    Object.keys(FAC).forEach(function (k) { BY_NAME[FAC[k].name] = k; });

    var css = [
      /* 1. 마을 열려 있을 때 상단 기존 중복 HUD 칩 숨김 (우측 메뉴 버튼만 유지) */
      "#app.hub-open #hud-bar{background:none!important;padding:calc(10px + var(--safe-top,0px)) 10px 0!important;}",
      "#app.hub-open #hud-chips{display:none!important;}",
      "#app.hub-open #hud-utils{margin-left:auto!important;}",

      /* 2. 100% 풀스크린 엣지-투-엣지 마을 지도 (모든 기존 헤더·하단 스탯·상태바 제거) */
      "#village-hub-layer{padding:0!important;background:#050812!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;overflow:hidden!important;}",
      "#village-hub-layer .hub-map-box{position:absolute!important;inset:0!important;margin:0!important;border:none!important;border-radius:0!important;box-shadow:none!important;background:#050812!important;}",
      "#village-hub-layer #hub-map-img{filter:none!important;}",
      "#village-hub-layer .hub-map-box::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:2;background:linear-gradient(180deg,rgba(4,8,18,0.58) 0%,rgba(4,8,18,0) 22%,rgba(4,8,18,0) 80%,rgba(4,8,18,0.68) 100%);}",
      "#village-hub-layer .hub-header, #village-hub-layer > div:has(#hub-stats-row), #village-hub-layer #hub-stats-row, #village-hub-layer #hub-status-bar{display:none!important;}",

      /* 3. 상단 원-카드 통합 투명 정보 패널 (장소 · 직급 · 재건율 · 골드 · 신뢰 · 성벽 한 장에!) */
      "#hub-unified-hud{position:absolute;top:calc(10px + var(--safe-top,0px));left:10px;right:60px;z-index:15;pointer-events:none;",
      "  padding:9px 12px;border-radius:12px;background:rgba(6,11,24,0.64);border:1px solid rgba(240,201,105,0.42);",
      "  backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:0 6px 18px rgba(0,0,0,0.45);display:flex;flex-direction:column;gap:6px;}",
      ".huh-top{display:flex;align-items:baseline;justify-content:space-between;gap:8px;}",
      ".huh-place{font-size:16px;font-weight:900;color:#fde68a;letter-spacing:-0.02em;text-shadow:0 1px 4px rgba(0,0,0,0.85);white-space:nowrap;}",
      ".huh-rank{font-size:12px;font-weight:700;color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-shadow:0 1px 3px rgba(0,0,0,0.85);}",
      ".huh-prog{display:flex;align-items:center;gap:8px;}",
      ".huh-bar{flex:1;height:6px;border-radius:999px;background:rgba(15,23,42,0.72);overflow:hidden;border:1px solid rgba(255,255,255,0.14);}",
      ".huh-bar-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,#38bdf8,#f0c969 65%,#4ade80);transition:width 0.35s ease;}",
      ".huh-prog-txt{font-size:11.5px;font-weight:800;color:#fde68a;white-space:nowrap;}",
      ".huh-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding-top:4px;border-top:1px solid rgba(255,255,255,0.12);}",
      ".huh-m{display:flex;align-items:center;justify-content:center;gap:4px;white-space:nowrap;}",
      ".huh-m-lbl{font-size:11px;font-weight:700;color:#94a3b8;}",
      ".huh-m-val{font-size:13px;font-weight:900;color:#f8fafc;text-shadow:0 1px 3px rgba(0,0,0,0.85);}",
      ".huh-m-val.gold{color:#fde68a;}",
      ".huh-m-val.cyan{color:#7dd3fc;}",
      ".huh-m-val.green{color:#86efac;}",

      /* 4. 지도 위 대형 모바일 핀 + 70x70px+ 확장 터치 영역 */
      "#village-hub-layer .hub-grid{position:absolute!important;inset:0!important;display:block!important;padding:0!important;z-index:6!important;pointer-events:none!important;}",
      "#village-hub-layer .hub-grid .hub-node{position:absolute;pointer-events:auto;width:auto!important;min-width:96px;min-height:46px;max-width:48%;padding:7px 12px!important;",
      "  display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:2px!important;",
      "  background:rgba(8,13,26,0.78)!important;border:2px solid rgba(255,255,255,0.45)!important;border-radius:14px!important;",
      "  transform:translate(-50%,calc(-100% - 10px));box-shadow:0 6px 16px rgba(0,0,0,0.58);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);",
      "  touch-action:manipulation;-webkit-tap-highlight-color:transparent;transition:transform 0.12s ease,box-shadow 0.16s ease;}",
      "#village-hub-layer .hub-grid .hub-node:active{transform:translate(-50%,calc(-100% - 8px)) scale(0.95);}",
      "#village-hub-layer .hub-grid .hub-node::before{content:'';position:absolute;inset:-12px;border-radius:20px;}",
      "#village-hub-layer .hub-grid .hub-node::after{content:'';position:absolute;left:50%;bottom:-9px;margin-left:-8px;border:8px solid transparent;border-bottom:0;border-top-color:rgba(255,255,255,0.65);}",
      "#village-hub-layer .hub-grid .hub-node-sub{display:none!important;}",
      "#village-hub-layer .hub-grid .hub-node-title{font-size:13.5px!important;font-weight:800!important;white-space:nowrap;letter-spacing:-0.02em;line-height:1.15;text-shadow:0 1px 3px rgba(0,0,0,0.75);}",
      "#village-hub-layer .hub-grid .hub-badge{font-size:10px!important;font-weight:800!important;padding:2px 7px!important;border-radius:999px!important;}",
      "#village-hub-layer .hub-grid .hub-node.target{border-color:#f0c969!important;background:linear-gradient(180deg,rgba(52,36,8,0.88),rgba(20,15,6,0.88))!important;box-shadow:0 0 0 3px rgba(240,201,105,0.34),0 8px 20px rgba(0,0,0,0.68)!important;animation:hubTargetPulse 1.6s ease-in-out infinite;z-index:9;}",
      "#village-hub-layer .hub-grid .hub-node.target::after{border-top-color:#f0c969;}",
      "#village-hub-layer .hub-grid .hub-node.bonus{border-color:#38bdf8!important;background:linear-gradient(180deg,rgba(10,36,58,0.84),rgba(8,20,34,0.84))!important;box-shadow:0 0 0 2px rgba(56,189,248,0.28),0 6px 16px rgba(0,0,0,0.6)!important;z-index:7;}",
      "#village-hub-layer .hub-grid .hub-node.bonus::after{border-top-color:#38bdf8;}",
      "#village-hub-layer .hub-grid .hub-node.done{border-color:rgba(74,222,128,0.85)!important;z-index:6;}",
      "#village-hub-layer .hub-grid .hub-node.locked{opacity:0.62;filter:saturate(0.5);}",
      "#village-hub-layer .hub-grid .hub-node.hubpin-shake{animation:hubPinShake .32s ease!important;}",
      "@keyframes hubTargetPulse{0%,100%{box-shadow:0 0 0 2px rgba(240,201,105,0.35),0 6px 18px rgba(0,0,0,0.68)}50%{box-shadow:0 0 0 7px rgba(240,201,105,0.22),0 8px 24px rgba(240,201,105,0.4)}}",
      "@keyframes hubPinShake{0%,100%{margin-left:0}25%{margin-left:-6px}75%{margin-left:6px}}",

      /* 5. 하단 단일 투명 플로팅 CTA 버튼 1개만! (지도가 뒤로 그대로 비침) */
      "#hub-thumb-dock{position:absolute;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:12;pointer-events:none;display:flex;justify-content:center;}",
      ".htd-primary{pointer-events:auto;width:100%;min-height:50px;padding:10px 16px;border-radius:14px;border:1.5px solid rgba(240,201,105,0.92);background:linear-gradient(135deg,rgba(245,158,11,0.44),rgba(146,64,14,0.80));backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:#fffbeb;font-size:15px;font-weight:900;display:flex;align-items:center;justify-content:space-between;gap:8px;box-shadow:0 8px 22px rgba(0,0,0,0.55);touch-action:manipulation;cursor:pointer;text-shadow:0 1px 3px rgba(0,0,0,0.65);}",
      ".htd-primary:active{transform:scale(0.98);}",
      ".htd-pill-tag{font-size:11px;font-weight:900;padding:3px 9px;border-radius:999px;background:#f0c969;color:#1c1917;flex-shrink:0;text-shadow:none;}",

      "#hub-visit{position:absolute;inset:0;z-index:30;display:none;flex-direction:column;justify-content:flex-end;background:#05070d center/cover no-repeat;}",
      "#hub-visit.on{display:flex;animation:hubVisitIn .35s ease;}",
      "@keyframes hubVisitIn{from{opacity:0}to{opacity:1}}",
      "#hub-visit .hv-box{margin:0 12px calc(14px + env(safe-area-inset-bottom));padding:14px 16px 12px;border-radius:12px;background:rgba(6,10,20,0.84);",
      "  border:1px solid rgba(255,255,255,0.22);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:#f1f5f9;}",
      "#hub-visit .hv-name{font-weight:800;color:#fde68a;font-size:clamp(16px,calc(var(--appw,100vw)*0.048),20px);margin-bottom:6px;}",
      "#hub-visit .hv-text{font-size:clamp(14px,calc(var(--appw,100vw)*0.042),18px);line-height:1.6;word-break:keep-all;}",
      "#hub-visit .hv-back{margin-top:10px;width:100%;min-height:48px;padding:12px;border-radius:10px;border:1px solid rgba(255,255,255,0.34);background:rgba(15,23,42,0.88);color:#f8fafc;font-weight:800;font-size:15px;}",
    ].join("\n");
    var st = document.createElement("style");
    st.id = "hub-map-style";
    st.textContent = css;
    document.head.appendChild(st);

    var app, hub, box, img, grid, walkers, visit, dock, unifiedHud;

    function restored() { return /restored/.test((img && img.getAttribute("src")) || ""); }

    function rect() {
      var bw = box.clientWidth, bh = box.clientHeight;
      var iw = (img && img.naturalWidth) || IMG_W, ih = (img && img.naturalHeight) || IMG_H;
      var sc = Math.max(bw / iw, bh / ih);
      return { bw: bw, bh: bh, w: iw * sc, h: ih * sc, x: (bw - iw * sc) / 2, y: (bh - ih * sc) / 2 };
    }
    function toPx(f) { var r = rect(); return { x: r.x + f[0] * r.w, y: r.y + f[1] * r.h, bw: r.bw, bh: r.bh }; }

    function keyOf(node) {
      var t = node.querySelector(".hub-node-title");
      return t ? BY_NAME[(t.textContent || "").trim()] : null;
    }

    function walkTo(f, instant) {
      if (typeof window.NakkeWalkPlayerTo === "function") {
        window.NakkeWalkPlayerTo(f[0], f[1], !!instant);
        return;
      }
      if (!walkers) return;
      var p = toPx(f);
      walkers.style.left = Math.round(p.x) + "px";
      walkers.style.bottom = Math.round(Math.max(84, p.bh - p.y - 18)) + "px";
    }

    function openVisit(k) {
      var f = FAC[k];
      if (!f) return;
      if (!visit) {
        visit = document.createElement("div");
        visit.id = "hub-visit";
        visit.innerHTML = '<div class="hv-box"><div class="hv-name"></div><div class="hv-text"></div><button type="button" class="hv-back">마을 지도로 돌아가기</button></div>';
        hub.appendChild(visit);
        visit.querySelector(".hv-back").addEventListener("click", function (e) {
          e.stopPropagation();
          visit.classList.remove("on");
        });
      }
      visit.style.backgroundImage = "url('" + f.img + "')";
      visit.querySelector(".hv-name").textContent = f.name;
      visit.querySelector(".hv-text").textContent = restored() ? f.peace : f.after;
      setTimeout(function () { visit.classList.add("on"); }, 420);
    }

    // 모든 상태 정보(직급·골드·신뢰·성벽·재건율)를 기존 DOM에서 읽어 단일 통합 투명 카드로 표시!
    function renderUnifiedHud() {
      if (!hub) return;
      if (!unifiedHud || !unifiedHud.isConnected) {
        unifiedHud = document.createElement("div");
        unifiedHud.id = "hub-unified-hud";
        hub.appendChild(unifiedHud);
      }
      var chips = document.querySelectorAll("#hud-chips .hud-chip");
      var rankTxt = (chips[0] && chips[0].textContent || "수습 행정관").trim();
      var goldTxt = (chips[1] && chips[1].textContent || "1,200G").trim();
      var trustTxt = ((chips[2] && chips[2].textContent || "50%").replace(/신뢰\s*/, "")).trim();
      var progTxt = ((document.getElementById("hub-progress-text") || {}).textContent || "재건 0/6").trim();
      var fillW = ((document.getElementById("hub-progress-fill") || {}).style || {}).width || "0%";
      var statsTxt = ((document.getElementById("hub-stats-row") || {}).textContent || "");
      var wallM = statsTxt.match(/성벽[^\d]*(\d+)/);
      var wallTxt = wallM ? wallM[1] : "100";

      unifiedHud.innerHTML =
        '<div class="huh-top">' +
          '<span class="huh-place">' + (restored() ? "✨ 개척촌 (복구)" : "🏰 개척촌") + "</span>" +
          '<span class="huh-rank">' + rankTxt + "</span>" +
        "</div>" +
        '<div class="huh-prog">' +
          '<div class="huh-bar"><div class="huh-bar-fill" style="width:' + fillW + '"></div></div>' +
          '<span class="huh-prog-txt">' + progTxt + "</span>" +
        "</div>" +
        '<div class="huh-metrics">' +
          '<div class="huh-m"><span class="huh-m-lbl">예산</span><span class="huh-m-val gold">' + goldTxt + "</span></div>" +
          '<div class="huh-m"><span class="huh-m-lbl">신뢰</span><span class="huh-m-val cyan">' + trustTxt + "</span></div>" +
          '<div class="huh-m"><span class="huh-m-lbl">성벽</span><span class="huh-m-val green">' + wallTxt + "</span></div>" +
        "</div>";
    }

    function renderThumbDock() {
      if (!hub) return;
      if (!dock || !dock.isConnected) {
        dock = document.createElement("div");
        dock.id = "hub-thumb-dock";
        hub.appendChild(dock);
      }
      dock.innerHTML = "";
      var nodes = Array.prototype.slice.call(grid.querySelectorAll(".hub-node"));
      var targetNode = nodes.find(function (n) { return n.classList.contains("target"); });
      if (targetNode) {
        var tk = keyOf(targetNode);
        var tName = tk ? FAC[tk].name : "다음 거점";
        var pri = document.createElement("button");
        pri.type = "button";
        pri.className = "htd-primary";
        pri.innerHTML =
          '<span style="display:flex;align-items:center;gap:8px;min-width:0;">' +
            '<span class="htd-pill-tag">' + (restored() ? "작별 인사" : "다음 업무") + "</span>" +
            '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + tName + " 이동</span>" +
          "</span>" +
          '<span style="font-size:17px;flex-shrink:0;">▸</span>';
        pri.addEventListener("click", function () { targetNode.click(); });
        dock.appendChild(pri);
      }
    }

    function layout() {
      if (!hub || !hub.classList.contains("active")) return;
      renderUnifiedHud();
      grid.querySelectorAll(".hub-node").forEach(function (node) {
        var k = keyOf(node);
        if (!k) return;
        var p = toPx(FAC[k].pin);
        // 상단 단일 통합 카드(112px) ~ 하단 단일 CTA(84px) 사이 안전 영역 클램핑
        var safeX = Math.max(58, Math.min(p.bw - 58, p.x));
        var safeY = Math.max(166, Math.min(p.bh - 86, p.y));
        node.style.left = Math.round(safeX) + "px";
        node.style.top = Math.round(safeY) + "px";
        if (!node._hubPin) {
          node._hubPin = true;
          node.addEventListener("click", function () {
            var kk = keyOf(node);
            if (!kk) return;
            walkTo(FAC[kk].walk);
            var isLocked = node.classList.contains("locked");
            var isMainDone = node.classList.contains("done") && !/재도전/.test(node.textContent || "");
            if (isLocked) {
              node.classList.remove("hubpin-shake"); void node.offsetWidth; node.classList.add("hubpin-shake");
              return;
            }
            if ((restored() && kk !== "gate") || (!restored() && isMainDone)) openVisit(kk);
          });
        }
      });
      renderThumbDock();
    }

    function onOpen() {
      var isOn = hub.classList.contains("active");
      if (app) app.classList.toggle("hub-open", isOn);
      if (!isOn) { if (visit) visit.classList.remove("on"); return; }
      setTimeout(function () { layout(); walkTo(START, true); }, 60);
    }

    function init() {
      app = document.getElementById("app");
      hub = document.getElementById("village-hub-layer");
      img = document.getElementById("hub-map-img");
      grid = document.getElementById("hub-grid");
      walkers = document.getElementById("hub-sd-walkers");
      box = img ? img.parentNode : null;
      if (!hub || !img || !grid || !box) return;
      new MutationObserver(onOpen).observe(hub, { attributes: true, attributeFilter: ["class"] });
      new MutationObserver(function () { setTimeout(layout, 0); }).observe(grid, { childList: true });
      var chipsEl = document.getElementById("hud-chips");
      if (chipsEl) new MutationObserver(renderUnifiedHud).observe(chipsEl, { childList: true, subtree: true, characterData: true });
      var statsEl = document.getElementById("hub-stats-row");
      if (statsEl) new MutationObserver(renderUnifiedHud).observe(statsEl, { childList: true, subtree: true, characterData: true });
      img.addEventListener("load", layout);
      window.addEventListener("resize", function () { setTimeout(layout, 50); });
      if (hub.classList.contains("active")) onOpen();
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  } catch (e) {
    if (window.console) console.warn("hub_map.js 비활성:", e);
  }
})();
