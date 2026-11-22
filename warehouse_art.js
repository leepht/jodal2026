/*
 * warehouse_art.js — 마을 미니게임(창고 정리 · 나라장터 게시판) 휴대폰용 화면 맞춤 + 그림 (index.html 코드는 그대로, 화면만 바꿈)
 *  [창고] 4x4 칸을 가로 99% · 남는 세로 끝까지 크게 / 끄는 블록 그림자도 칸 크기에 맞춤 / 칸·버튼에 물건 그림
 *  [게시판] 공고 카드 글씨 크게 · 조항을 카드 높이에 고르게 · 진한 갈색 글씨로 가독성
 *  그림 파일이 없거나 오류가 나도 원래 모습 그대로 진행
 */
(function () {
  "use strict";
  try {
    var ICON = {
      mana: "assets/minigame/item_mana_crystal.png",
      core: "assets/items/part_core.png",
      shield: "assets/minigame/wh_shield_rack.png",
      potion: "assets/minigame/wh_potion_box.png",
      wood: "assets/minigame/wh_lumber.png",
      wood2: "assets/minigame/wh_lumber_reinforced.png",
      food: "assets/minigame/wh_food_crate.png",
    };
    function pick(label, round2) {
      var t = (label || "").replace(/\s+/g, "");
      if (/마력석|^마력$/.test(t)) return ICON.mana;
      if (/마력핵|핵심|예비핵|코어/.test(t)) return ICON.core;
      if (/방패/.test(t)) return ICON.shield;
      if (/포션/.test(t)) return ICON.potion;
      if (/강화목/.test(t)) return ICON.wood2;
      if (/목재/.test(t)) return round2 ? ICON.wood2 : ICON.wood;
      if (/식량|구호/.test(t)) return ICON.food;
      return null;
    }
    var FS = function (min, k, max) { return "clamp(" + min + "px, calc(var(--appw, 100vw) * " + k + "), " + max + "px)"; };
    var css = [
      /* ---------- 창고 ---------- */
      ".wh-wrap{padding:6px!important;gap:6px!important;}",
      ".wh-top-info{font-size:" + FS(12, 0.034, 14) + "!important;}",
      ".wh-grid-shell{flex:1 1 auto!important;min-height:0!important;gap:4px!important;justify-content:center!important;}",
      ".wh-grid{max-width:none!important;gap:2.2%!important;padding:2.4%!important;}",
      ".wh-cell{font-size:" + FS(11, 0.032, 14) + "!important;border-radius:8px!important;}",
      ".wh-cell.filled{position:relative;font-size:" + FS(10, 0.028, 13) + "!important;justify-content:flex-end!important;padding-bottom:3px;text-shadow:0 1px 2px #000,0 0 4px #000;",
      "  background-size:78% 78%!important;background-position:center 36%!important;background-repeat:no-repeat!important;}",
      ".wh-grid-shell > :not(.wh-grid){font-size:" + FS(11.5, 0.032, 13.5) + "!important;}",
      ".wh-palette{gap:5px!important;}",
      ".wh-piece-btn{min-height:76px!important;padding:5px 3px!important;gap:3px!important;}",
      ".wh-piece-btn span{font-size:" + FS(11, 0.03, 13) + "!important;}",
      ".wh-piece-icon{width:34px;height:34px;object-fit:contain;filter:drop-shadow(0 2px 3px rgba(0,0,0,.6));pointer-events:none;}",
      ".wh-controls button,.wh-ctrl-btn{min-height:46px!important;font-size:" + FS(13, 0.037, 15.5) + "!important;}",
      ".wh-drag-ghost{transform:translate(-50%,-50%) scale(var(--wh-ghost-scale,1.06))!important;}",
      /* ---------- 공통 재질 (창고는 나무 프레임 유지, 게시판은 고대비 깔끔 카드) ---------- */
      ".wh-top-info{background:url('assets/ui_art/ui_wood_frame.png') center/100% 100% no-repeat, rgba(28,18,10,0.92)!important;border:none!important;color:#fff7e6!important;padding:10px 14px!important;}",
      ".wh-piece-btn{background:url('assets/ui_art/ui_wood_frame.png') center/100% 100% no-repeat, rgba(28,18,10,0.92)!important;border:none!important;}",
      ".wh-piece-btn.selected{filter:brightness(1.25) drop-shadow(0 0 6px rgba(240,201,105,0.9));}",
      /* ---------- 개척촌 나라장터 게시판 (초고대비 가독성 개편) ---------- */
      ".board-wrap{padding:8px!important;gap:8px!important;background:rgba(7,11,22,0.58)!important;}",
      ".board-rules-strip{background:linear-gradient(180deg,#111d36 0%,#0b1326 100%)!important;border:1.5px solid rgba(250,204,21,0.58)!important;border-radius:10px!important;",
      "  color:#f8fafc!important;padding:9px 12px!important;display:flex!important;flex-direction:column!important;gap:4px!important;box-shadow:0 4px 14px rgba(0,0,0,0.45)!important;word-break:keep-all!important;}",
      ".board-rule-row{display:flex!important;align-items:baseline!important;gap:7px!important;font-size:" + FS(12.5, 0.035, 14.5) + "!important;line-height:1.4!important;}",
      ".board-rule-row strong{flex-shrink:0!important;color:#fde68a!important;font-weight:900!important;}",
      ".board-rule-row span{color:#e2e8f0!important;font-weight:600!important;}",
      ".board-notice-card{background:#faf6eb!important;border:2px solid #c9b58c!important;border-radius:12px!important;padding:16px 12px 12px!important;color:#0f172a!important;box-shadow:0 10px 26px rgba(0,0,0,0.48)!important;}",
      ".board-notice-card > div:not(.board-feedback):not(.stamp-ink-overlay){flex:1;display:flex;flex-direction:column;gap:10px;min-height:0;}",
      ".board-notice-head{font-size:" + FS(15, 0.042, 18) + "!important;font-weight:900!important;color:#1e293b!important;line-height:1.35!important;word-break:keep-all!important;",
      "  flex-wrap:wrap;gap:4px;padding:4px 2px 8px!important;margin-bottom:2px!important;border-bottom:2px solid #d4c39e!important;}",
      ".board-notice-head span:last-child{display:none!important;}",
      ".board-clause{flex:1 1 0;max-height:112px;min-height:68px;flex-direction:row!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;",
      "  padding:11px 12px!important;margin:0!important;border-radius:10px!important;font-size:" + FS(14.5, 0.04, 17) + "!important;line-height:1.42!important;color:#0f172a!important;word-break:keep-all!important;",
      "  background:#ffffff!important;border:1.5px solid #dfd3b8!important;box-shadow:0 2px 6px rgba(60,40,10,0.08)!important;}",
      ".board-clause.flagged{background:#fef2f2!important;border:2px solid #dc2626!important;box-shadow:inset 4px 0 0 #dc2626!important;}",
      ".board-clause.checked-ok{background:#f0fdf4!important;border:2px solid #16a34a!important;box-shadow:inset 4px 0 0 #16a34a!important;}",
      ".board-clause-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;}",
      ".board-clause-text strong{display:block;color:#9a3412!important;font-size:0.8em;font-weight:900;letter-spacing:0.02em;}",
      ".board-clause-text span{color:#0f172a!important;font-weight:700!important;word-break:keep-all!important;}",
      ".board-check-btn{flex-shrink:0!important;min-width:68px!important;min-height:38px!important;padding:6px 12px!important;border-radius:999px!important;",
      "  border:2px solid #b91c1c!important;background:#fff5f5!important;color:#b91c1c!important;font-size:" + FS(12.5, 0.035, 14.5) + "!important;font-weight:900!important;white-space:nowrap!important;cursor:pointer!important;}",
      ".board-clause.flagged .board-check-btn{background:#dc2626!important;border-color:#dc2626!important;color:#ffffff!important;}",
      ".board-clause.checked-ok .board-check-btn{background:#16a34a!important;border-color:#16a34a!important;color:#ffffff!important;}",
      ".board-feedback{font-size:" + FS(13, 0.036, 15) + "!important;line-height:1.45!important;min-height:50px!important;padding:9px 12px!important;border-radius:8px!important;",
      "  background:#0f172a!important;border:1.5px solid rgba(148,163,184,0.38)!important;color:#f8fafc!important;word-break:keep-all!important;display:block!important;}",
      ".board-actions .stamp-btn{min-height:54px!important;font-size:" + FS(15, 0.042, 17.5) + "!important;}",
      /* 아이폰 짧은 뷰포트(≤720px) 대응: 게시판·창고 모두 한 화면에 여유롭게 표시 */
      "@media (max-height: 720px){",
      "  .board-wrap{padding:6px!important;gap:6px!important;}",
      "  .board-rules-strip{padding:6px 9px!important;gap:2px!important;}",
      "  .board-rule-row{font-size:11.5px!important;line-height:1.32!important;}",
      "  .board-notice-card{padding:11px 10px 9px!important;}",
      "  .board-notice-card > div:not(.board-feedback):not(.stamp-ink-overlay){gap:7px!important;}",
      "  .board-notice-head{font-size:14px!important;padding:2px 2px 6px!important;}",
      "  .board-clause{min-height:52px!important;max-height:84px!important;padding:7px 10px!important;font-size:13.5px!important;}",
      "  .board-check-btn{min-width:60px!important;min-height:34px!important;padding:4px 10px!important;font-size:12px!important;}",
      "  .board-feedback{min-height:42px!important;padding:7px 10px!important;font-size:12px!important;line-height:1.38!important;}",
      "  .board-actions .stamp-btn{min-height:44px!important;font-size:14px!important;}",
      "  .wh-piece-btn{min-height:60px!important;}",
      "  .wh-controls button,.wh-ctrl-btn{min-height:40px!important;font-size:12.5px!important;}",
      "}",
    ].join("\n");
    var st = document.createElement("style"); st.id = "warehouse-art-style"; st.textContent = css; document.head.appendChild(st);

    // 창고 4x4 칸: 가로 99% · 남는 세로 끝까지
    function fitGrid() {
      var grid = document.querySelector(".wh-grid");
      if (!grid) return;
      var shell = grid.parentElement;
      if (!shell) return;
      var others = 0;
      Array.prototype.forEach.call(shell.children, function (ch) { if (ch !== grid) others += ch.offsetHeight + 4; });
      var size = Math.floor(Math.min(shell.clientWidth * 0.99, shell.clientHeight - others - 2));
      if (size < 120) return;
      var px = size + "px";
      if (grid.style.width !== px) { grid.style.width = px; grid.style.height = px; }
      var cell = grid.querySelector(".wh-cell");
      if (cell && cell.offsetWidth) document.documentElement.style.setProperty("--wh-ghost-scale", (cell.offsetWidth / 28).toFixed(2));
    }

    function decorate() {
      var pal = document.querySelector(".wh-palette");
      var round2 = !!(pal && /강화목|마력핵|예비핵/.test(pal.textContent || ""));
      document.querySelectorAll(".wh-cell.filled").forEach(function (cell) {
        var src = pick(cell.textContent, round2);
        if (!src) return;
        var want = 'url("' + src + '")';
        if (cell.style.backgroundImage !== want) cell.style.backgroundImage = want;
      });
      document.querySelectorAll(".wh-piece-btn").forEach(function (btn) {
        if (btn.querySelector(".wh-piece-icon")) return;
        var spans = btn.querySelectorAll("span");
        var name = spans.length ? spans[spans.length - 1].textContent : btn.textContent;
        var src = pick(name, round2);
        if (!src) return;
        var im = document.createElement("img");
        im.className = "wh-piece-icon"; im.alt = ""; im.src = src;
        im.onerror = function () { this.remove(); };
        btn.insertBefore(im, btn.firstChild);
      });
      fitGrid();
    }
    var pending = false;
    function schedule() {
      if (pending) return; pending = true;
      requestAnimationFrame(function () { pending = false; decorate(); });
    }
    function init() {
      var root = document.getElementById("mg-content") || document.body;
      new MutationObserver(schedule).observe(root, { childList: true, subtree: true });
      window.addEventListener("resize", schedule);
      window.addEventListener("orientationchange", function () { setTimeout(schedule, 150); });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  } catch (e) {
    if (window.console) console.warn("warehouse_art.js 비활성:", e);
  }
})();
