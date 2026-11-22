/*
 * village_residents.js — 마을 화면에 함께 사는 주민 16명 (sd_walk.js 의 길 지점 이름·형식을 그대로 사용)
 *  key: assets/village/sd_{key}.png (+ _walk, _walk2)  /  home: 처음 서 있는 곳  /  zone: 오가는 구역  /  lines: 누르면 나오는 말풍선
 *  sd_walk.js 가 이 목록을 읽어 기존 주민 뒤에 붙임 (진행도에 따라 인원이 늘어남). 이 파일이 없어도 게임은 정상.
 */
// 마을 화면 SD 크기 10% 키움 (건물 문 크기에 맞춤): 주민 48→53px(발밑 기준점 42→46px), 주인공 56→62px, 나르미·달이 48→53px
(function () {
  try {
    var st = document.createElement("style");
    st.id = "village-sd-size";
    st.textContent = [
      "#village-hub-layer .sdw-npc-wrap{width:53px!important;height:53px!important;margin-left:-26.5px!important;margin-top:-46px!important;}",
      "#village-hub-layer .sdw-player img{width:62px!important;height:62px!important;}",
      "#village-hub-layer .hub-sd-walkers > img{width:53px!important;height:53px!important;}",
      // 탑뷰 마을 화면 아래 바로가기 독은 쓰지 않음 (핀을 눌러 이동)
      "#hub-thumb-dock{display:none!important;}",
      // 마을 화면 위쪽은 지도만: 직급·재건·예산·신뢰·성벽 정보 카드를 화면 맨 아래 얇은 띠로 내림, '개척촌' 제목·안내 문구는 뺌
      "#village-hub-layer #hub-unified-hud{top:auto!important;bottom:calc(8px + env(safe-area-inset-bottom))!important;left:8px!important;right:8px!important;",
      "  display:grid!important;grid-template-columns:auto 1fr;align-items:center;column-gap:10px;row-gap:5px;padding:7px 12px!important;",
      "  background:rgba(6,11,24,0.62)!important;border-color:rgba(240,201,105,0.32)!important;}",
      "#village-hub-layer #hub-unified-hud .huh-place{display:none!important;}",
      "#village-hub-layer #hub-unified-hud .huh-top{grid-column:1;}",
      "#village-hub-layer #hub-unified-hud .huh-prog{grid-column:2;}",
      "#village-hub-layer #hub-unified-hud .huh-metrics{grid-column:1 / span 2;padding-top:5px;}",
      "#village-hub-layer #hub-unified-hud .huh-rank{font-size:clamp(12px,calc(var(--appw,100vw)*0.034),14px);color:#fde68a;}",
      "#village-hub-layer #hub-unified-hud .huh-m-lbl{font-size:clamp(11px,calc(var(--appw,100vw)*0.031),13px);}",
      "#village-hub-layer #hub-unified-hud .huh-m-val{font-size:clamp(13px,calc(var(--appw,100vw)*0.036),15px);}",
      "#village-hub-layer .hub-hint-off{display:none!important;}",
      // 네온(빛나는 색 테두리·깜빡임) 없이 게임 원래 반투명 UI(선택지 바와 같은 어두운 유리 + 얇은 회백색 선)로 통일
      "#village-hub-layer #hub-unified-hud{background:rgba(10,16,28,0.5)!important;border:1px solid rgba(203,213,225,0.55)!important;border-radius:2px!important;box-shadow:0 4px 14px rgba(0,0,0,0.35)!important;backdrop-filter:blur(12px)!important;-webkit-backdrop-filter:blur(12px)!important;}",
      "#village-hub-layer #hub-unified-hud .huh-bar{background:rgba(255,255,255,0.12)!important;border:none!important;height:4px!important;}",
      "#village-hub-layer #hub-unified-hud .huh-bar-fill{background:rgba(241,245,249,0.85)!important;}",
      "#village-hub-layer #hub-unified-hud .huh-rank,#village-hub-layer #hub-unified-hud .huh-prog-txt{color:#f1f5f9!important;}",
      "#village-hub-layer #hub-unified-hud .huh-m-val.gold,#village-hub-layer #hub-unified-hud .huh-m-val.cyan,#village-hub-layer #hub-unified-hud .huh-m-val.green{color:#f8fafc!important;}",
      "#village-hub-layer #hub-unified-hud .huh-metrics{border-top:1px solid rgba(203,213,225,0.25)!important;}",
      "#village-hub-layer #hub-grid .hub-node,#village-hub-layer #hub-grid .hub-node.target,#village-hub-layer #hub-grid .hub-node.bonus,#village-hub-layer #hub-grid .hub-node.done{",
      "  background:rgba(10,16,28,0.55)!important;border:1px solid rgba(203,213,225,0.6)!important;border-radius:2px!important;box-shadow:0 4px 12px rgba(0,0,0,0.4)!important;",
      "  animation:none!important;backdrop-filter:blur(12px)!important;-webkit-backdrop-filter:blur(12px)!important;}",
      "#village-hub-layer #hub-grid .hub-node.target{border-left:3px solid rgba(248,250,252,0.95)!important;}",
      "#village-hub-layer #hub-grid .hub-node::after,#village-hub-layer #hub-grid .hub-node.target::after,#village-hub-layer #hub-grid .hub-node.bonus::after{border-top-color:rgba(203,213,225,0.75)!important;}",
      "#village-hub-layer #hub-grid .hub-node .hub-node-title{color:#f8fafc!important;}",
      "#village-hub-layer #hub-grid .hub-badge,#village-hub-layer #hub-grid .hub-badge.next,#village-hub-layer #hub-grid .hub-badge.bonus,#village-hub-layer #hub-grid .hub-badge.done{",
      "  background:transparent!important;border:none!important;box-shadow:none!important;padding:0!important;color:#cbd5e1!important;letter-spacing:0.04em;}",
      "#village-hub-layer #hub-grid .hub-badge img{filter:grayscale(1) brightness(1.6);}",
      // 대화 장면 왼쪽 위 칩(직급·이름 / 예산 / 신뢰): 두 줄 → 작은 한 줄 반투명 띠 (이름이 길면 말줄임)
      "#hud-chips{flex-wrap:nowrap!important;gap:0!important;overflow:hidden;align-items:stretch;}",
      "#hud-chips .hud-chip{padding:4px 9px!important;font-size:clamp(11px,calc(var(--appw,100vw)*0.031),13px)!important;border-radius:0!important;",
      "  background:rgba(10,16,28,0.42)!important;border:1px solid rgba(203,213,225,0.34)!important;border-left:none!important;flex-shrink:0;}",
      "#hud-chips .hud-chip:first-child{border-left:1px solid rgba(203,213,225,0.34)!important;display:block!important;min-width:0;flex-shrink:1;overflow:hidden;text-overflow:ellipsis;}",
      "#hud-chips .hud-chip .ui-ico{width:13px!important;height:13px!important;vertical-align:-2px;}",
      "#village-hub-layer .hub-player-pin{background:rgba(10,16,28,0.6)!important;border:1px solid rgba(203,213,225,0.6)!important;border-radius:2px!important;color:#f1f5f9!important;box-shadow:none!important;}",
    ].join("\n");
    (document.head || document.documentElement).appendChild(st);
  } catch (e) {}
})();

// 마을 화면의 '거점을 터치해 주세요' 류 안내 문구 숨김 (어느 파일에서 만들어도 글자로 찾아서 숨김)
(function () {
  try {
    var RX = /(가\s*보고\s*싶은|가고\s*싶은)\s*거점|거점을\s*(터치|눌러)\s*(해\s*)?주세요/;
    function sweep() {
      var hub = document.getElementById("village-hub-layer");
      if (!hub) return;
      var all = hub.querySelectorAll("div,span,p,strong,b,small");
      for (var i = 0; i < all.length; i++) {
        var n = all[i];
        if (n.classList.contains("hub-hint-off") || n.children.length > 2) continue;
        if (RX.test(n.textContent || "")) n.classList.add("hub-hint-off");
      }
    }
    function init() {
      var hub = document.getElementById("village-hub-layer");
      if (!hub) return;
      var t = null;
      new MutationObserver(function () { clearTimeout(t); t = setTimeout(sweep, 30); }).observe(hub, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["class"] });
      sweep();
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  } catch (e) {}
})();

window.NAKKE_EXTRA_RESIDENTS = [
  { key: "npc_baker", home: "center_sq", zone: ["center_sq", "lower_fork", "office_door"],
    lines: ["갓 구운 빵 나왔어요! 하나 드셔 보세요~", "밀가루가 제때 들어오니 오븐이 쉴 틈이 없네요!"] },
  { key: "npc_baker_staff_01", home: "lower_fork", zone: ["lower_fork", "center_sq", "south_road"],
    lines: ["밀가루 자루 나갑니다냥! 비켜 주세요~", "검수 도장 찍힌 밀가루라 안심이다냥."] },
  { key: "npc_baker_staff_02", home: "south_road", zone: ["south_road", "south_entry", "lower_fork"],
    lines: ["오늘 반죽은 세 배로 해야겠다냥.", "빵 냄새 맡고 다들 줄 서 있다냥!"] },
  { key: "npc_clerk", home: "office_door", zone: ["office_door", "lower_fork", "center_sq"],
    lines: ["입찰 서류 정리 끝! 이번 공고도 투명하게요.", "행정관님, 결재할 서류 여기 있어요!"] },
  { key: "npc_farmer", home: "south_entry", zone: ["south_entry", "south_road", "lower_fork"],
    lines: ["올해 밭은 풍년이겠구먼!", "새 쇠스랑 품질이 아주 좋아. 정품이라 그런가?"] },
  { key: "npc_granny_cat", home: "mid_plaza", zone: ["mid_plaza", "mid_upper"],
    lines: ["아이고, 우리 행정관 왔는가. 밥은 먹었고?", "마을이 다시 시끌시끌하니 좋구먼."] },
  { key: "npc_kid_girl", home: "center_sq", zone: ["center_sq", "inspect_fork", "mid_plaza", "lower_fork", "board_door"],
    lines: ["행정관님이다! 같이 놀아요!", "바구니에 사과 가득 땄어요!"] },
  { key: "npc_kitten_kid", home: "inspect_fork", zone: ["inspect_fork", "center_sq", "mid_plaza", "inspect_door"],
    lines: ["냥! 나도 커서 경비대 할 거다냥!", "포탑 빛이 반짝반짝 멋있다냥!"] },
  { key: "npc_militia", home: "upper_road", zone: ["upper_road", "gate", "workshop_fork"],
    lines: ["성문 쪽 순찰 중입니다. 이상 없습니다!", "새로 받은 창이 손에 착 감긴다냥."] },
  { key: "npc_militia_c", home: "gate", zone: ["gate", "upper_road"],
    lines: ["망루에서 보면 마을이 한눈에 보인다.", "화살은 넉넉하다. 비축창고 덕분이지."] },
  { key: "villager_man", home: "inspect_door", zone: ["inspect_door", "inspect_fork", "center_sq"],
    lines: ["검수소 덕에 불량 목재가 싹 사라졌어요.", "지붕 수리할 목재 받으러 왔습니다!"] },
  { key: "villager_woman", home: "mid_plaza", zone: ["mid_plaza", "inspect_fork", "center_sq", "mid_upper"],
    lines: ["시장에 물건이 다시 가득해졌어요!", "이번 달 장보기가 한결 수월하네요~"] },
  { key: "merchant_02", home: "board_door", zone: ["board_door", "lower_fork"],
    lines: ["공고 기준대로 정직하게 견적 냈습니다.", "게시판이 깔끔하니 경쟁할 맛이 납니다."] },
  { key: "merchant_03", home: "board_door", zone: ["board_door", "lower_fork", "center_sq"],
    lines: ["시간은 금! 납기는 반드시 지킵니다.", "검수 통과, 이번에도 문제없습니다요!"] },
  { key: "merchant_04", home: "warehouse_door", zone: ["warehouse_door", "mid_upper"],
    lines: ["비축 물량 장부, 주판으로 딱 맞췄습니다.", "마력석 단가는 공정가 그대로입니다."] },
  { key: "merchant_05", home: "workshop_door", zone: ["workshop_door", "workshop_fork"],
    lines: ["공방 부품 납품하러 왔습니다요.", "포탑 부품 주문, 언제든 말씀만 하세요!"] },
];
