/*
 * tutorial.js — 미니게임 시작 전 규칙 화면에 "그림 튜토리얼" 넣기 (나르미가 한 장씩 설명)
 *  - 대상: 나라장터 게시판 / 입찰 심사(본청 집무실) / 자동 마력 포탑 조립(발명냥이 공방)
 *  - 그림: assets/tutorial/{game}_{n}.png (실제 게임 화면에 짚을 곳 표시). 그림이 없으면 설명 글만
 *  - 시간 제한 게임도 설명 보는 동안 시간이 흐르지 않음 (시작 버튼 누르기 전)
 */
(function () {
  "use strict";
  try {
    var NAR = "assets/char/narumi_normal.png";
    var T = {
      board: { match: /나라장터 게시판/, steps: [
        "위쪽 나무판이 이번 공고의 <b>기준</b>이에요. 품목별 상한 가격과 '차단 대상'(예정가 초과 · 투찰률 짬짜미 · 독소 규격 · 무자격)을 먼저 기억해 두세요.",
        "공고 카드의 조항 3개 — <b>제시 단가 · 경쟁/투찰 · 자격/규격</b> — 옆 <b>[확인]</b>을 누르면 나르미가 정상/위반 힌트를 바로 알려줘요!",
        "기준을 하나라도 어기면 카드를 <b>왼쪽으로 밀어 찢어요</b>(반려). 아래 [찢어 폐기] 버튼도 같아요.",
        "문제가 없으면 <b>오른쪽으로 밀어 게시 승인</b>! 시간 안에 공고 6장을 처리하고, 연속으로 맞히면 콤보예요.",
      ] },
      audit: { match: /입찰 심사 데스크/, steps: [
        "상인이 납품 서류를 내밀어요. <b>상인의 말</b>에도 단서가 숨어 있어요.",
        "위쪽 탭에서 <b>① 견적서 · ② 등록증</b>을 넘겨 보고, 맨 아래 항상 펼쳐진 <b>📜 규정집</b>과 바로 대조해요!",
        "서류 항목을 누르면 규정집과 대조해요. 어긋난 항목은 <b>위반</b>으로 표시돼요.",
        "수상하면 <b>[추궁]</b>! 상인이 당황하며 변명하고, 제가 어디를 볼지 힌트를 드려요.",
        "뇌물 주머니는 <b>[밀어내기]</b>로 거절! 받으면 신뢰도가 떨어져요.",
        "다 확인했으면 — 위반이 있으면 <b>[제재 도장]</b>, 깨끗하면 <b>[승인 도장]</b>!",
      ] },
      turret: { match: /포탑 직접 조립/, steps: [
        "아래 작업대의 부품을 손가락으로 집어, 포탑 위 <b>빛나는 슬롯</b>까지 끌어다 놓아요.",
        "부품이 들어가면 바깥 <b>링이 줄어들어요</b>. 링이 <b>황금 원에 겹치는 순간</b> 화면을 톡! 하면 체결돼요.",
        "코어 → 포신 → 동력기, <b>3단계</b>를 조립해요. 황금 원 한가운데면 <b>PERFECT</b> — 포탑 화력이 올라가요!",
      ] },
    };
    var FS = function (min, k, max) { return "clamp(" + min + "px, calc(var(--appw, 100vw) * " + k + "), " + max + "px)"; };
    var css = [
      ".mg-banner-card.has-tut{max-width:min(96vw,440px)!important;padding:16px 14px 14px!important;gap:8px!important;}",
      ".mg-banner-card.has-tut > p{display:none!important;}",
      ".mg-banner-card.has-tut h3{font-size:" + FS(16, 0.045, 20) + "!important;text-align:center;}",
      ".tut{width:100%;display:flex;flex-direction:column;gap:8px;}",
      ".tut-img{width:100%;height:min(48dvh,430px);object-fit:contain;border-radius:10px;background:#05070d;border:1px solid rgba(240,201,105,0.35);}",
      ".tut-say{display:flex;gap:9px;align-items:flex-start;padding:10px 12px;border-radius:10px;background:rgba(6,10,20,0.85);border:1px solid rgba(255,255,255,0.16);}",
      ".tut-say img{width:44px;height:44px;object-fit:contain;flex-shrink:0;}",
      ".tut-text{color:#f8fafc;font-weight:600;font-size:" + FS(14, 0.04, 17) + ";line-height:1.6;word-break:keep-all;}",
      ".tut-text b{color:#fde68a;}",
      ".tut-nav{display:flex;align-items:center;justify-content:space-between;gap:8px;}",
      ".tut-nav button{min-height:44px;min-width:86px;border-radius:8px;border:1px solid rgba(255,255,255,0.3);background:rgba(15,23,42,0.85);color:#f8fafc;font-weight:800;font-size:15px;}",
      ".tut-nav button:disabled{opacity:0.35;}",
      ".tut-dots{display:flex;gap:6px;}",
      ".tut-dots i{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.3);}",
      ".tut-dots i.on{background:#f0c969;}",
      "#mg-rule-start.tut-ready{animation:tutPulse 1.1s ease-in-out infinite;}",
      "@keyframes tutPulse{0%,100%{filter:drop-shadow(0 0 0 rgba(240,201,105,0))}50%{filter:drop-shadow(0 0 12px rgba(240,201,105,0.9))}}",
    ].join("\n");
    var st = document.createElement("style"); st.id = "tutorial-style"; st.textContent = css; document.head.appendChild(st);

    function build(card, key) {
      var cfg = T[key], n = cfg.steps.length, idx = 0;
      card.classList.add("has-tut");
      var box = document.createElement("div"); box.className = "tut";
      box.innerHTML = '<img class="tut-img" alt="" /><div class="tut-say"><img src="' + NAR + '" alt="" /><div class="tut-text"></div></div>' +
        '<div class="tut-nav"><button type="button" class="tut-prev">◀ 이전</button><div class="tut-dots"></div><button type="button" class="tut-next">다음 ▶</button></div>';
      var start = card.querySelector("#mg-rule-start");
      card.insertBefore(box, start);
      var img = box.querySelector(".tut-img"), txt = box.querySelector(".tut-text"), dots = box.querySelector(".tut-dots");
      var prev = box.querySelector(".tut-prev"), nextB = box.querySelector(".tut-next");
      for (var i = 0; i < n; i++) dots.appendChild(document.createElement("i"));
      img.onerror = function () { img.style.display = "none"; };
      function render() {
        img.style.display = ""; img.src = "assets/tutorial/" + key + "_" + (idx + 1) + ".png";
        txt.innerHTML = "<b>" + (idx + 1) + "/" + n + "</b> · " + cfg.steps[idx];
        Array.prototype.forEach.call(dots.children, function (d, k) { d.classList.toggle("on", k === idx); });
        prev.disabled = idx === 0;
        nextB.textContent = idx === n - 1 ? "다시 보기 ↺" : "다음 ▶";
        if (start) start.classList.toggle("tut-ready", idx === n - 1);
      }
      prev.addEventListener("click", function (e) { e.stopPropagation(); if (idx > 0) { idx--; render(); } });
      nextB.addEventListener("click", function (e) { e.stopPropagation(); idx = idx < n - 1 ? idx + 1 : 0; render(); });
      img.addEventListener("click", function (e) { e.stopPropagation(); if (idx < n - 1) { idx++; render(); } });
      render();
    }
    function scan() {
      var card = document.querySelector("#mg-banner-overlay .mg-banner-card");
      if (!card || card.classList.contains("has-tut") || !card.querySelector("#mg-rule-start")) return;
      var h = card.querySelector("h3"), title = h ? h.textContent : "";
      Object.keys(T).some(function (k) { if (T[k].match.test(title)) { build(card, k); return true; } return false; });
    }
    function init() {
      var root = document.getElementById("mg-banner-overlay") || document.body;
      new MutationObserver(function () { setTimeout(scan, 0); }).observe(root, { childList: true, subtree: true });
      scan();
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  } catch (e) {
    if (window.console) console.warn("tutorial.js 비활성:", e);
  }
})();
