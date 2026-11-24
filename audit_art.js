/*
 * audit_art.js — 본청 집무실(입찰 심사) 미니게임: 휴대폰용 화면 + 대화 장면 (index.html 코드는 그대로, 화면·연출만 추가)
 *  - 상인이 들어오면: 큰 서 있는 그림 + 아래 대사창으로 첫 인사 (화면 누르면 서류 심사로)
 *  - [추궁] 누르면: 당황한 얼굴(merchant*_shock.png, 없으면 기본) + 변명 → 나르미 힌트(어느 서류 어느 항목을 볼지, 정답은 말 안 함)
 *  - 서류·탭·도장 버튼 크게, 서류 항목이 세로 공간을 고르게 채움, UI 재질(assets/ui_art/*) 입힘 (없으면 원래 색)
 */
(function () {
  "use strict";
  try {
    var U = "assets/ui_art/";
    var FS = function (min, k, max) { return "clamp(" + min + "px, calc(var(--appw, 100vw) * " + k + "), " + max + "px)"; };
    var SM = function (mq, cls, arr) {
      return "@media " + mq + "{\n" + arr.join("\n") + "\n}\n" + arr.map(function (r) { return r.replace(/^\s*(\.)/, "html." + cls + " $1"); }).join("\n");
    };
    var css = [
      ".audit-wrap{padding:6px!important;gap:6px!important;}",
      /* 상인 부스: 고대비 짙은 남색 카드 (못 장식과 글자 겹침 제거) */
      ".audit-booth{padding:8px 10px!important;background:linear-gradient(180deg,rgba(15,23,42,0.96),rgba(10,16,30,0.98))!important;border:1.5px solid rgba(240,201,105,0.45)!important;border-radius:10px!important;box-shadow:0 4px 12px rgba(0,0,0,0.45)!important;gap:9px!important;}",
      ".audit-booth img{width:54px!important;height:64px!important;object-fit:cover!important;object-position:center top!important;border-radius:6px;border:1px solid rgba(240,201,105,0.35);}",
      ".audit-booth span{font-size:" + FS(12, 0.034, 14) + "!important;}",
      ".audit-booth-speech{font-size:" + FS(12.5, 0.035, 14.5) + "!important;line-height:1.42!important;color:#f8fafc!important;word-break:keep-all!important;margin-top:2px!important;}",
      /* 외곽 시트: 겹치는 양피지 텍스처 제거 → 깔끔한 다크 데스크 컨테이너 */
      ".audit-parchment{flex:1 1 auto!important;min-height:0!important;display:flex!important;flex-direction:column!important;gap:6px!important;padding:7px!important;color:#0f172a!important;",
      "  background:rgba(12,18,32,0.84)!important;border:1px solid rgba(148,163,184,0.28)!important;border-radius:10px!important;box-shadow:none!important;overflow:hidden!important;}",
      /* [수정 11/24] 남는 공간은 서류 칸(.audit-split)만 채움 — 예전엔 정상 상인의 '청렴 서약서' 줄까지 늘어나 견적서·규정집이 잘렸음 */
      ".audit-parchment > .audit-split{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;gap:6px;}",
      /* 상단 탭: ① 견적서 / ② 등록증 (고대비 명확한 선택 상태) */
      ".audit-wrap > .audit-doc-tabs{display:none!important;}",
      ".audit-pane-tabs{display:flex;gap:6px;flex-shrink:0;}",
      ".audit-pane-tabs .audit-doc-tab{flex:1;min-height:38px!important;border-radius:8px!important;font-size:" + FS(13.5, 0.037, 15.5) + "!important;font-weight:900!important;",
      "  background:rgba(30,41,59,0.92)!important;color:#cbd5e1!important;border:1.5px solid rgba(148,163,184,0.35)!important;box-shadow:none!important;}",
      ".audit-pane-tabs .audit-doc-tab.active{background:#faf6eb!important;color:#7c2d12!important;border-color:#f0c969!important;box-shadow:0 2px 8px rgba(240,201,105,0.28),inset 0 -3px 0 #b45309!important;filter:none!important;}",
      /* 2분할 구조 */
      ".audit-split{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;gap:6px;}",
      ".audit-pane{min-height:0;overflow-y:auto;scrollbar-width:thin;display:flex;flex-direction:column;gap:5px;border-radius:8px;}",
      ".audit-pane > div{display:flex;flex-direction:column;gap:5px;flex:0 0 auto;}",
      /* 위쪽 상인 서류: 깔끔한 아이보리 종이 + 고대비 흰색 항목 슬립 */
      ".audit-pane-top{flex:1.12 1 0;padding:8px 9px!important;background:#faf6eb!important;border:1.5px solid #d4c39e!important;box-shadow:inset 0 1px 0 rgba(255,255,255,0.7);}",
      ".audit-pane-top .audit-doc-head{font-size:" + FS(13.5, 0.037, 15.5) + "!important;font-weight:900!important;color:#3b2412!important;border-bottom:1.5px solid #d6c5a3!important;padding-bottom:4px!important;margin-bottom:2px!important;}",
      ".audit-pane-top .audit-doc-head span:last-child:not(.quote-item-pill){display:none!important;}",
      ".audit-pane-top .audit-doc-head span.quote-item-pill{display:inline-block!important;padding:2px 8px;border-radius:999px;background:#efe4c8;border:1px solid #cbb68a;color:#7c2d12!important;font-size:0.8em;font-weight:900;white-space:nowrap;}",
      ".audit-pane-top .audit-field{flex:0 0 auto!important;min-height:36px!important;max-height:none!important;align-items:center!important;padding:6px 9px!important;margin:0!important;border-radius:6px!important;",
      "  font-size:" + FS(13.5, 0.037, 15.5) + "!important;line-height:1.35!important;color:#0f172a!important;font-weight:700!important;word-break:keep-all!important;",
      "  background:#ffffff!important;border:1.5px solid #e2d6bc!important;box-shadow:0 1px 2px rgba(60,40,10,0.08)!important;}",
      ".audit-pane-top .audit-field.marked-bad{background:#fef2f2!important;border:2px solid #dc2626!important;color:#7f1d1d!important;}",
      ".audit-pane-top .audit-field.marked-ok{background:#f0fdf4!important;border:1.5px solid #16a34a!important;color:#14532d!important;}",
      ".audit-pane-top .audit-info-row{min-height:30px!important;padding:4px 9px!important;background:#f3ecda!important;border:1px solid #dfd3b8!important;font-size:" + FS(12.5, 0.034, 14) + "!important;color:#334155!important;}",
      ".audit-field strong{color:#9a3412!important;font-weight:900!important;margin-right:3px;}",
      ".audit-badge-mini{font-size:" + FS(11, 0.03, 12.5) + "!important;padding:3px 8px!important;border-radius:999px!important;font-weight:800!important;background:#e2e8f0!important;color:#334155!important;white-space:nowrap;}",
      ".audit-field.marked-bad .audit-badge-mini{background:#dc2626!important;color:#fff!important;}",
      ".audit-field.marked-ok .audit-badge-mini{background:#16a34a!important;color:#fff!important;}",
      ".audit-seal-img{width:40px!important;height:40px!important;flex-shrink:0;}",
      /* 맨 아래 규정집: 고대비 미드나잇 네이비 기준표 (한눈에 스캔 가능, 나무 두루마리 겹침 완전 제거!) */
      ".audit-pane-bottom.pane-rules{flex:1.18 1 0!important;padding:8px 9px!important;border-radius:8px!important;overflow-y:auto!important;",
      "  background:linear-gradient(180deg,#111d36 0%,#0b1326 100%)!important;border:1.5px solid rgba(96,165,250,0.52)!important;color:#f1f5f9!important;box-shadow:inset 0 1px 0 rgba(255,255,255,0.08)!important;}",
      ".audit-pane-bottom.pane-rules > div{margin:0!important;padding:0!important;gap:5px!important;}",
      ".audit-split:has(.pane-rules) .audit-pane-top{flex:1.0 1 0;}",
      ".pane-rules .audit-doc-head{display:flex!important;justify-content:space-between!important;align-items:center!important;gap:6px!important;color:#e0f2fe!important;",
      "  border-bottom:1px solid rgba(96,165,250,0.32)!important;padding-bottom:4px!important;margin-bottom:2px!important;font-size:" + FS(13, 0.036, 15) + "!important;font-weight:900!important;}",
      ".pane-rules .audit-doc-head span.rule-ref-date{display:inline-block!important;white-space:nowrap!important;padding:2px 8px;border-radius:999px;background:rgba(250,204,21,0.16);border:1px solid rgba(250,204,21,0.65);color:#fde68a!important;font-size:0.82em;font-weight:900;}",
      ".pane-rules .rule-grid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:4px!important;margin:0!important;}",
      /* [수정 11/24] 가격 칸: 공간 되면 '이름 가격' 한 줄, 모자라면 자동 두 줄 (예전엔 늘 두 줄이라 세로 긴 폰에서 규정집 맨 아래가 잘림) */
      ".pane-rules .rule-cell{cursor:pointer;border-radius:6px;padding:5px 8px!important;color:#f8fafc!important;font-size:" + FS(12, 0.033, 13.5) + "!important;line-height:1.3!important;font-weight:700!important;",
      "  display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;column-gap:6px;row-gap:0;white-space:nowrap;",
      "  background:rgba(30,45,74,0.92)!important;border:1px solid rgba(148,163,184,0.32)!important;}",
      ".pane-rules .rule-cell strong{display:inline;color:#fde68a!important;font-size:0.86em;font-weight:800;margin:0;}",
      ".pane-rules .rule-note{background:transparent!important;border:none!important;padding:0!important;margin:0!important;display:flex!important;flex-direction:column!important;gap:4px!important;}",
      ".pane-rules .rule-line{cursor:pointer;border-radius:6px;padding:5px 8px!important;color:#f1f5f9!important;font-size:" + FS(12, 0.033, 13.8) + "!important;line-height:1.38!important;word-break:keep-all!important;",
      "  background:rgba(23,37,66,0.92)!important;border:1px solid rgba(148,163,184,0.3)!important;display:flex!important;align-items:baseline!important;gap:6px!important;}",
      ".pane-rules .rule-line strong{display:inline!important;flex-shrink:0!important;color:#fde68a!important;font-weight:900!important;font-size:0.95em!important;}",
      ".pane-rules .rule-line span{color:#f8fafc!important;font-weight:600!important;}",
      ".pane-rules .rule-seal-line{align-items:center!important;justify-content:space-between!important;background:rgba(20,83,45,0.38)!important;border-color:rgba(74,222,128,0.5)!important;padding:4px 8px!important;}",
      ".pane-rules .rule-seal-line strong{display:block!important;color:#86efac!important;}",
      ".pane-rules .rule-seal-sub{font-size:0.86em!important;color:#dcfce7!important;margin-top:1px;}",
      ".pane-rules .rule-seal-line .audit-seal-img{width:34px!important;height:34px!important;}",
      ".rule-pick{outline:2px solid #facc15!important;outline-offset:0;background:rgba(250,204,21,0.18)!important;border-color:#facc15!important;}",
      ".rule-point{outline:2.5px solid #38bdf8!important;outline-offset:0;background:rgba(56,189,248,0.22)!important;border-color:#38bdf8!important;}",
      ".audit-field.cmp-target{outline:2px dashed #5b3a1e;}",
      /* 황금 참치 주머니: 슬림하고 선명한 뇌물 바 */
      ".bribe-pouch{position:relative;flex-shrink:0;min-height:48px!important;padding:6px 10px 6px 54px!important;border-radius:8px!important;font-size:" + FS(12, 0.034, 14) + "!important;font-weight:700!important;",
      "  color:#fef3c7!important;background:linear-gradient(90deg,rgba(120,40,52,0.96),rgba(48,14,24,0.98))!important;",
      "  border:1.5px solid rgba(240,201,105,0.78)!important;box-shadow:0 4px 12px rgba(0,0,0,0.45)!important;word-break:keep-all;}",
      ".bribe-pouch img{position:absolute;left:6px;top:50%;width:42px!important;height:42px!important;transform:translateY(-50%) rotate(-8deg);filter:drop-shadow(0 3px 5px rgba(0,0,0,0.6));}",
      ".bribe-pouch > span:first-of-type{font-style:italic;line-height:1.35;}",
      ".bribe-pouch > span:last-child{background:#92400e!important;border:1px solid #fde68a!important;color:#fffbeb!important;border-radius:6px!important;padding:5px 9px!important;font-size:" + FS(11.5, 0.032, 13) + "!important;font-weight:900;font-style:normal;}",
      /* [수정 11/24] 정상 상인의 '청렴 계약 서약서' 줄: 뇌물 주머니와 같은 높이의 초록 띠 → 상인마다 화면 배치 동일 */
      ".audit-parchment > div:not(.audit-split):not(.bribe-pouch):not(.stamp-ink-overlay):not(.audit-citation){flex:0 0 auto!important;min-height:48px;margin-top:0!important;align-items:center!important;gap:8px;padding:6px 12px!important;border-radius:8px;",
      "  background:linear-gradient(90deg,rgba(21,94,52,0.92),rgba(10,40,26,0.96));border:1.5px solid rgba(74,222,128,0.6);color:#bbf7d0!important;font-size:" + FS(12, 0.034, 14) + "!important;font-weight:800!important;word-break:keep-all;}",
      ".stamp-btn{min-height:52px!important;font-size:" + FS(14, 0.04, 16.5) + "!important;}",
      /* 대조 결과 팝업: 가독성 강화 (word-break: keep-all) */
      "#audit-cmp{position:absolute;left:12px;right:12px;top:33%;z-index:55;padding:12px 14px;border-radius:10px;background:rgba(9,15,29,0.95);border:1.5px solid rgba(240,201,105,0.65);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);",
      "  color:#f8fafc;font-size:" + FS(13.5, 0.037, 16) + ";line-height:1.55;word-break:keep-all;display:none;box-shadow:0 14px 36px rgba(0,0,0,0.75);}",
      "#audit-cmp.on{display:block;animation:atIn .2s ease;}",
      "#audit-cmp .cmp-res{display:block;margin-top:6px;font-weight:900;font-size:1.05em;}",
      "#audit-pick-hint{position:absolute;left:10px;right:10px;top:6px;z-index:54;padding:8px 12px;border-radius:8px;background:rgba(15,23,42,0.95);border:1.5px solid #facc15;color:#fef08a;font-weight:800;",
      "  font-size:" + FS(12.5, 0.035, 14.5) + ";word-break:keep-all;display:none;text-align:center;box-shadow:0 6px 18px rgba(0,0,0,0.6);}",
      "#audit-pick-hint.on{display:block;}",
      /* 아이폰 Safari·세로 모니터·데스크톱(논리 높이 ≤780px) 전용: 모든 서류 항목 + 규정집 전 항목이 한눈에 들어오도록 컴팩트 최적화 */
      SM("(max-height: 780px)", "short-stage", [
        "  .audit-wrap{padding:4px!important;gap:4px!important;}",
        "  .audit-booth{padding:5px 8px!important;gap:7px!important;}",
        "  .audit-booth img{width:40px!important;height:48px!important;}",
        "  .audit-booth-speech{font-size:11.5px!important;line-height:1.3!important;}",
        "  .audit-parchment{padding:5px!important;gap:4px!important;}",
        "  .audit-split{gap:4px!important;}",
        "  .audit-pane-tabs .audit-doc-tab{min-height:32px!important;font-size:12.5px!important;padding:4px!important;}",
        "  .audit-pane-top{padding:5px 7px!important;flex:0.95 1 0!important;}",
        "  .audit-pane > div{gap:3.5px!important;}",
        "  .audit-pane-top .audit-doc-head{font-size:12.5px!important;padding-bottom:3px!important;margin-bottom:1px!important;}",
        "  .audit-pane-top .audit-field{min-height:29px!important;padding:4px 8px!important;font-size:12.5px!important;}",
        "  .audit-seal-img{width:32px!important;height:32px!important;}",
        "  .audit-pane-bottom.pane-rules{padding:5px 7px!important;flex:1.25 1 0!important;}",
        "  .pane-rules .audit-doc-head{font-size:12px!important;padding-bottom:3px!important;margin-bottom:1px!important;}",
        "  .pane-rules .rule-grid{gap:3px!important;}",
        "  .pane-rules .rule-cell{min-width:0!important;padding:3px 5px!important;font-size:10.8px!important;display:flex!important;justify-content:space-between!important;align-items:center!important;gap:3px!important;white-space:nowrap!important;}",
        "  .pane-rules .rule-cell strong{display:inline!important;margin:0!important;font-size:1em!important;}",
        "  .pane-rules .rule-note{gap:3px!important;}",
        "  .pane-rules .rule-line{padding:3px 6px!important;font-size:11px!important;line-height:1.28!important;}",
        "  .pane-rules .rule-seal-line{padding:3px 6px!important;}",
        "  .pane-rules .rule-seal-line .audit-seal-img{width:26px!important;height:26px!important;}",
        "  .bribe-pouch{min-height:36px!important;padding:4px 8px 4px 42px!important;font-size:11.2px!important;}",
        "  .audit-parchment > div:not(.audit-split):not(.bribe-pouch):not(.stamp-ink-overlay):not(.audit-citation){min-height:36px;padding:4px 10px!important;font-size:11.2px!important;}",
        "  .bribe-pouch img{width:30px!important;height:30px!important;}",
        "  .bribe-pouch > span:last-child{padding:4px 7px!important;font-size:11px!important;}",
        "  .stamp-btn{min-height:42px!important;font-size:13px!important;padding:6px 8px!important;}",
      ]),
      /* 갤럭시 S23/S24(360px)·Z Flip·Z Fold 커버(344px)·노트북 좁은 창 대응 */
      SM("(max-width: 390px)", "narrow-stage", [
        "  .pane-rules .rule-cell{padding:3px 4.5px!important;font-size:10px!important;gap:2px!important;letter-spacing:-0.025em!important;}",
        "  .pane-rules .rule-line{font-size:10.5px!important;gap:5px!important;}",
        "  .audit-pane-top .audit-field{font-size:12px!important;padding:4px 7px!important;}",
      ]),
      SM("(max-width: 355px)", "ultra-narrow-stage", [
        "  .pane-rules .rule-cell{padding:3px 3.5px!important;font-size:9.3px!important;gap:1.5px!important;letter-spacing:-0.035em!important;}",
      ]),
      /* 갤럭시 S23/S24 삼성 인터넷(360x640) 등 초단축 세로 화면(≤680px) 대응 */
      SM("(max-height: 680px)", "ultra-short-stage", [
        "  .audit-wrap{padding:3px!important;gap:3px!important;}",
        "  .audit-booth{padding:4px 7px!important;gap:6px!important;}",
        "  .audit-booth img{width:34px!important;height:40px!important;}",
        "  .audit-booth-speech{font-size:10.8px!important;line-height:1.24!important;margin-top:1px!important;}",
        "  .audit-parchment{padding:4px!important;gap:3px!important;}",
        "  .audit-split{gap:3px!important;}",
        "  .audit-pane-tabs .audit-doc-tab{min-height:28px!important;font-size:12px!important;padding:3px!important;}",
        "  .audit-pane-top{padding:4px 6px!important;flex:1.02 1 0!important;}",
        "  .audit-pane > div{gap:2.5px!important;}",
        "  .audit-pane-top .audit-doc-head{font-size:12px!important;padding-bottom:2px!important;margin-bottom:1px!important;}",
        "  .audit-pane-top .audit-field{min-height:25px!important;padding:3px 7px!important;font-size:11.8px!important;line-height:1.22!important;}",
        "  .audit-badge-mini{padding:2px 6px!important;font-size:10px!important;}",
        "  .audit-pane-bottom.pane-rules{padding:4px 6px!important;flex:1.24 1 0!important;}",
        "  .pane-rules .audit-doc-head{font-size:11.5px!important;padding-bottom:2px!important;margin-bottom:1px!important;}",
        "  .pane-rules .rule-note{gap:2.5px!important;}",
        "  .pane-rules .rule-line{padding:2.5px 5px!important;font-size:10.3px!important;line-height:1.2!important;}",
        "  .pane-rules .rule-seal-line{padding:2.5px 6px!important;}",
        "  .pane-rules .rule-seal-line .audit-seal-img{width:22px!important;height:22px!important;}",
        "  .bribe-pouch{min-height:32px!important;padding:3px 7px 3px 38px!important;font-size:10.5px!important;}",
        "  .audit-parchment > div:not(.audit-split):not(.bribe-pouch):not(.stamp-ink-overlay):not(.audit-citation){min-height:32px;padding:3px 9px!important;font-size:10.5px!important;}",
        "  .bribe-pouch img{width:26px!important;height:26px!important;}",
        "  .bribe-pouch > span:last-child{padding:3px 6px!important;font-size:10.5px!important;}",
        "  .stamp-btn{min-height:38px!important;font-size:12.5px!important;padding:4px 6px!important;}",
      ]),
      /* [수정 11/24] 세로 긴 폰 맞춤: 넓은 폰(400px+)은 문서 칸 여유를 규정집으로, 좁은 폰(380px 이하)은 규정집 여백만 살짝 줄임 */
      "@media (min-width: 400px) and (min-height: 741px){",
      "  .audit-split:has(.pane-rules) .audit-pane-top{flex:0.9 1 0;}",
      "}",
      "@media (max-width: 380px) and (min-height: 741px){",
      "  .pane-rules .rule-grid{gap:3px!important;}",
      "  .pane-rules .rule-note{gap:3px!important;}",
      "  .pane-rules .rule-cell{padding:4px 7px!important;}",
      "  .pane-rules .rule-line{padding:3.5px 7px!important;line-height:1.3!important;}",
      "  .pane-rules .rule-seal-line .audit-seal-img{width:30px!important;height:30px!important;}",
      "  .audit-pane-top .audit-field{min-height:33px!important;padding:5px 8px!important;}",
      "}",
      /* 대화 장면 */
      "#audit-talk{position:absolute;inset:0;z-index:60;display:none;flex-direction:column;justify-content:flex-end;",
      "  background:linear-gradient(180deg,rgba(5,8,16,0.35) 0%,rgba(5,8,16,0.55) 55%,rgba(3,5,10,0.92) 100%);}",
      "#audit-talk.on{display:flex;animation:atIn .25s ease;}",
      "@keyframes atIn{from{opacity:0}to{opacity:1}}",
      "#audit-talk .at-portrait{position:absolute;left:50%;bottom:24%;height:66%;max-width:96%;transform:translateX(-50%);object-fit:contain;filter:drop-shadow(0 10px 24px rgba(0,0,0,0.6));}",
      "#audit-talk .at-portrait.shake{animation:atShake .45s ease;}",
      "@keyframes atShake{0%,100%{transform:translateX(-50%)}20%{transform:translateX(calc(-50% - 10px))}40%{transform:translateX(calc(-50% + 9px))}60%{transform:translateX(calc(-50% - 6px))}80%{transform:translateX(calc(-50% + 4px))}}",
      "#audit-talk .at-box{position:relative;margin:0 10px calc(12px + env(safe-area-inset-bottom));min-height:26%;padding:16px 18px 14px;border-radius:12px;",
      "  background:rgba(6,10,20,0.86);border:1px solid rgba(255,255,255,0.18);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);}",
      "#audit-talk .at-name{display:inline-block;margin-bottom:8px;padding:3px 12px;border-radius:6px;background:rgba(240,201,105,0.18);border:1px solid rgba(240,201,105,0.6);",
      "  color:#fde68a;font-weight:900;font-size:" + FS(14, 0.04, 17) + ";}",
      "#audit-talk .at-text{color:#f8fafc;font-weight:600;font-size:" + FS(16, 0.047, 20) + ";line-height:1.65;word-break:keep-all;}",
      "#audit-talk .at-next{position:absolute;right:14px;bottom:10px;color:#cbd5e1;font-size:13px;animation:atBlink 1s infinite;}",
      "@keyframes atBlink{50%{opacity:0.3}}",
    ].join("\n");
    var st = document.createElement("style"); st.id = "audit-art-style"; st.textContent = css; document.head.appendChild(st);

    // 상인별 나르미 힌트 (정답은 말하지 않고 볼 곳만)
    var HINT = {
      "외지 떠돌이 상인": "말이 꼬이는 걸 보니 수상해요! ① 견적서의 '제시 단가'·'창고 주소', ② 등록증의 '직인'을 아래 규정집과 대조해 보세요.",
      "개척촌 지역 목수 조합": "말에 흔들림이 없어요. 서류가 아래 규정집 기준에 맞는지만 차분히 확인해요.",
      "야시장 마력 브로커": "상호 얘기에 당황했어요! ② 등록증의 '등록 상호'·'유효 기한'·'직인'을 견적서·규정집과 맞춰 보세요.",
      "동부 방패 대장간": "투박하지만 거짓은 없어 보여요. 창고 주소와 단가만 규정집과 한 번 더 비교해요.",
      "왕도 특급 납품단": "운임 핑계가 길어요! ① 견적서의 '제시 단가'와 '납품 기한'을 규정집 기준과 비교해 보세요.",
    };

    var talk, lastName = "", queue = [];
    function ensureTalk() {
      if (talk && talk.isConnected) return talk;
      var host = document.getElementById("minigame-layer") || document.getElementById("app") || document.body;
      talk = document.createElement("div"); talk.id = "audit-talk";
      talk.innerHTML = '<img class="at-portrait" alt="" /><div class="at-box"><div class="at-name"></div><div class="at-text"></div><div class="at-next">▼ 화면 터치</div></div>';
      host.appendChild(talk);
      talk.addEventListener("click", function (e) { e.stopPropagation(); next(); });
      return talk;
    }
    function show(item) {
      var t = ensureTalk(), im = t.querySelector(".at-portrait");
      if (item.img) {
        im.style.display = "";
        im.onerror = function () { if (item.fallback && im.getAttribute("src") !== item.fallback) im.src = item.fallback; else im.style.display = "none"; };
        im.src = item.img;
        im.classList.remove("shake"); void im.offsetWidth; if (item.shake) im.classList.add("shake");
      } else im.style.display = "none";
      t.querySelector(".at-name").textContent = item.name;
      t.querySelector(".at-text").textContent = item.text;
      t.classList.add("on");
    }
    function next() {
      if (queue.length) show(queue.shift());
      else if (talk) talk.classList.remove("on");
    }
    function play(items) { queue = items.slice(); next(); }
    function clean(s) { return (s || "").replace(/^\s*["“]|["”]\s*$/g, "").trim(); }

    function boothInfo() {
      var booth = document.getElementById("audit-booth-box");
      if (!booth) return null;
      var img = booth.querySelector("img"), nameEl = booth.querySelector("span"), sp = document.getElementById("audit-speech");
      var name = nameEl ? nameEl.textContent.replace(/^#\d+\s*/, "").trim() : "";
      return { booth: booth, img: img ? img.getAttribute("src") : "", name: name, speech: sp ? sp.textContent : "" };
    }

    function onChange() {
      var b = boothInfo();
      if (!b) { lastName = ""; return; }
      if (b.name && b.name !== lastName) {     // 새 상인 등장 → 첫 인사 대화
        lastName = b.name;
        play([{ name: b.name, text: clean(b.speech), img: b.img }]);
      }
    }

    document.addEventListener("click", function (e) {
      var btn = e.target && e.target.closest ? e.target.closest("#audit-interrogate") : null;
      if (!btn) return;
      setTimeout(function () {                 // 원래 코드가 추궁 대사로 바꾼 뒤
        var b = boothInfo(); if (!b) return;
        // 당황 얼굴: assets/expr/{상인}_shock.png (캐릭터 폴더는 건드리지 않음), 없으면 기본 얼굴
        var shock = b.img.replace(/^.*\/([^\/]+)_normal\.png$/, "assets/expr/$1_shock.png");
        var hint = HINT[b.name] || "말과 서류가 맞는지 규정집과 하나씩 대조해 보세요!";
        play([
          { name: b.name, text: clean(b.speech), img: shock, fallback: b.img, shake: b.booth.classList.contains("sweat") },
          { name: "나르미", text: hint, img: "assets/char/narumi_normal.png" },
        ]);
      }, 60);
    });

    // ---------- 누르고 대조하기: 규정집 규정을 누름 → 견적서/등록증 항목을 누름 → 맞대어 결과 ----------
    var RULES = {
      price_wood: "삼나무 목재 적정가 130G ~ 200G / 단", price_shield: "경비대 방패 적정가 140G ~ 210G / 개",
      price_mana: "고순도 마력석 적정가 180G ~ 260G / 상자", price_gate: "성문 보강재 적정가 160G ~ 240G / 묶음",
      delivery: "최대 납기: D+5 (5일 이내) 필수", addr: "공식 등기 구역: 서쪽 제재소 · 중앙 공방로 · 남쪽 광장 · 동쪽 보급창",
      match: "상호 일치: 견적서 신청 상호 = 등록증 등록 상호",
      expiry: "유효 기한: 기준일 2026.03.02 이후 필수 (경과 시 만료)",
      seal: "정품 발바닥 인장: 기울지 않은 규정집 견본과 같아야 함",
    };
    var FIELD_RULE = {
      q_delivery: "delivery", q_vendor: "match", q_addr: "addr",
      r_vendor: "match", r_addr: "addr", r_expiry: "expiry", r_seal: "seal",
    };
    var picked = null;
    function priceRuleForItem() {
      var q = document.querySelector(".audit-pane-top") || document;
      var t = q.textContent || "";
      if (/목재/.test(t)) return "price_wood"; if (/방패/.test(t)) return "price_shield";
      if (/마력석/.test(t)) return "price_mana"; if (/보강재/.test(t)) return "price_gate"; return "price_wood";
    }
    function ruleOfField(fid) { return fid === "q_price" ? priceRuleForItem() : FIELD_RULE[fid]; }
    function tagRules() {
      var pane = document.querySelector(".audit-pane-bottom.pane-rules");
      if (!pane) return;
      if (!pane.querySelector("[data-rule]")) {
        pane.querySelectorAll(".rule-cell").forEach(function (c) {
          var t = c.textContent; c.dataset.rule = /목재/.test(t) ? "price_wood" : /방패/.test(t) ? "price_shield" : /마력석/.test(t) ? "price_mana" : "price_gate";
        });
        pane.querySelectorAll("div").forEach(function (d) {
          if (d.dataset.rule || d.classList.contains("rule-grid") || d.classList.contains("rule-cell") || d.querySelector("div")) return;
          var t = d.textContent || "";
          var key = /최대 납기/.test(t) ? "delivery" : /공식 등기/.test(t) ? "addr" : /유효 기한|유효기간/.test(t) ? "expiry" : /상호 일치|필수 일치/.test(t) ? "match" : /인장 견본/.test(t) ? "seal" : null;
          if (key && t.length < 120) { d.dataset.rule = key; d.classList.add("rule-line"); if (d.parentElement) d.parentElement.classList.add("rule-note"); }
        });
      }
      pane.querySelectorAll("[data-rule]").forEach(function (r) { r.classList.toggle("rule-pick", r.dataset.rule === picked); });
    }
    function hostEl() { return document.getElementById("minigame-layer") || document.body; }
    function hintBar(on, text) {
      var h = document.getElementById("audit-pick-hint");
      if (!h) { h = document.createElement("div"); h.id = "audit-pick-hint"; hostEl().appendChild(h); }
      if (text) h.textContent = text; h.classList.toggle("on", !!on);
    }
    function showCmp(ruleKey, fieldEl, chosenKey) {
      var c = document.getElementById("audit-cmp");
      if (!c) { c = document.createElement("div"); c.id = "audit-cmp"; hostEl().appendChild(c); c.addEventListener("click", function () { c.classList.remove("on"); }); }
      var label = fieldEl ? (fieldEl.querySelector("span") || fieldEl).textContent.trim() : "";
      var bad = fieldEl && fieldEl.classList.contains("marked-bad"), ok = fieldEl && fieldEl.classList.contains("marked-ok");
      var badMsg = fieldEl && fieldEl.dataset ? fieldEl.dataset.badMsg : "";
      var pairInfo = fieldEl && fieldEl.dataset ? fieldEl.dataset.pairInfo : "";
      var wrong = chosenKey && chosenKey !== ruleKey && !(chosenKey.indexOf("price") === 0 && ruleKey.indexOf("price") === 0);
      var res = wrong ? "<span class='cmp-res' style='color:#fde68a'>↺ 이 항목은 다른 규정과 맞대야 해요 → " + RULES[ruleKey] + "</span>"
        : bad ? "<span class='cmp-res' style='color:#fca5a5'>🚨 규정 위반!" + (badMsg ? " " + badMsg : "") + "</span>"
          : ok ? "<span class='cmp-res' style='color:#86efac'>✓ 규정과 일치</span>" : "";
      var pairLine = pairInfo ? "<br/>🔍 <b style='color:#e2e8f0'>비교</b> " + pairInfo : "";
      c.innerHTML = "📜 <b style='color:#fde68a'>규정</b> " + RULES[chosenKey && !wrong ? chosenKey : ruleKey] + "<br/>📄 <b style='color:#bae6fd'>서류</b> " + label + pairLine + res;
      c.classList.add("on");
      clearTimeout(c._t); c._t = setTimeout(function () { c.classList.remove("on"); }, 3800);
    }
    document.addEventListener("click", function (e) {
      if (!e.target || !e.target.closest) return;
      var r = e.target.closest(".audit-pane-bottom [data-rule]");
      if (r) {                                  // ① 규정 고르기
        picked = picked === r.dataset.rule ? null : r.dataset.rule;
        tagRules();
        hintBar(!!picked, "대조 모드 — 이제 위 ① 견적서 또는 ② 등록증의 항목을 눌러 맞대 보세요");
        return;
      }
      var f = e.target.closest("[data-fid]");
      if (f && document.getElementById("audit-sheet")) {   // ② 항목 누름 → (원래 코드가 판정) → 맞대기 결과
        var fid = f.dataset.fid, chosen = picked;
        picked = null; hintBar(false);
        setTimeout(function () {
          var fe = document.querySelector('[data-fid="' + fid + '"]');
          var key = ruleOfField(fid);
          if (key) showCmp(key, fe, chosen);
          tagRules();
          var pr = document.querySelector('.audit-pane-bottom [data-rule="' + key + '"]');
          if (pr) {
            try { pr.scrollIntoView({ behavior: "smooth", block: "nearest" }); } catch (_) { }
            pr.classList.add("rule-point");
            setTimeout(function () { pr.classList.remove("rule-point"); }, 1600);
          }
        }, 80);
      }
    }, true);

    var pending = false;
    function schedule() { if (pending) return; pending = true; requestAnimationFrame(function () { pending = false; onChange(); tagRules(); }); }
    function init() {
      var root = document.getElementById("mg-content") || document.body;
      new MutationObserver(schedule).observe(root, { childList: true, subtree: true });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  } catch (e) {
    if (window.console) console.warn("audit_art.js 비활성:", e);
  }
})();
