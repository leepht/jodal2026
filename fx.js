/*
 * fx.js — 미니게임 효과(FX) 엔진 (index.html 과 따로 둔 파일)
 *  - 그림 효과: 폭발 / 마법 충격(하늘색) / 보라 충격 / 금빛 반짝임  → assets/fx/*.png (검은 바탕, '더하기' 합성으로 검은색은 안 보임)
 *  - 광선: 포탑 빔 (assets/fx/fx_blue_beam.png 를 두 점 사이로 늘여 그림)
 *  - 입자: 불티(spark) / 먼지(dust) / 나무 파편(chip),  고리: 퍼지는 빛 고리(ring)
 *  - 그림 파일이 없거나 아직 안 불러졌으면 코드로 그린 빛으로 대신함 → 게임은 항상 정상 진행
 * 사용: const fx = window.NakkeFX ? NakkeFX.layer() : null;  ...  fx.burst("boom", x, y, 120); ... 매 프레임 fx.draw(ctx);
 */
(function () {
  "use strict";
  var DIR = "assets/fx/";
  var FILES = { boom: "fx_explosion.png", magic: "fx_magic_burst.png", purple: "fx_purple_burst.png", spark: "fx_sparkle.png", beam: "fx_blue_beam.png" };
  var TINT = { boom: "255,170,60", magic: "90,200,255", purple: "190,110,255", spark: "255,220,110", beam: "110,210,255" };
  var IMG = {};
  Object.keys(FILES).forEach(function (k) { var im = new Image(); im.src = DIR + FILES[k]; IMG[k] = im; });
  function ok(im) { return im && im.complete && im.naturalWidth > 0; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function glow(ctx, x, y, r, rgb, a) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(255,255,255," + a + ")");
    g.addColorStop(0.25, "rgba(" + rgb + "," + (a * 0.9) + ")");
    g.addColorStop(1, "rgba(" + rgb + ",0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  function layer() {
    var items = [];
    var lastDraw = 0; // [11/24] 화면 주사율(60/100/144Hz)과 상관없이 같은 속도: 실제 흐른 시간으로 진행

    var api = {
      // 그림 효과 한 번 (kind: boom | magic | purple | spark)
      burst: function (kind, x, y, size, o) {
        o = o || {};
        items.push({ t: "burst", kind: kind, x: x, y: y, s: size || 100, life: 0, dur: o.dur || 18, grow: o.grow || 1.5,
          rot: Math.random() * 6.283, vr: (Math.random() - 0.5) * 0.08, a: o.alpha == null ? 1 : o.alpha });
        return api;
      },
      // 두 점 사이 광선
      beam: function (x1, y1, x2, y2, o) {
        o = o || {};
        items.push({ t: "beam", x1: x1, y1: y1, x2: x2, y2: y2, w: o.w || 22, life: 0, dur: o.dur || 8, rgb: o.rgb || TINT.beam });
        return api;
      },
      // 입자 (shape: spark 불티 | dust 먼지 | chip 나무 파편)
      particles: function (x, y, o) {
        o = o || {};
        var n = o.n || 10, sp = o.speed || 4, shape = o.shape || "spark";
        for (var i = 0; i < n; i++) {
          var ang = (o.angle != null ? o.angle : -Math.PI / 2) + (Math.random() - 0.5) * (o.spread != null ? o.spread : Math.PI * 2);
          var v = sp * (0.45 + Math.random() * 0.8);
          items.push({ t: "p", shape: shape, x: x, y: y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, g: o.gravity != null ? o.gravity : (shape === "chip" ? 0.32 : (shape === "dust" ? -0.02 : 0.06)),
            r: (o.size || (shape === "dust" ? 9 : 3)) * (0.6 + Math.random() * 0.8), life: 0, dur: (o.life || (shape === "dust" ? 26 : 20)) * (0.7 + Math.random() * 0.6),
            rgb: o.rgb || (shape === "dust" ? "150,120,90" : (shape === "chip" ? "150,100,55" : TINT.boom)), rot: Math.random() * 6.283, vr: (Math.random() - 0.5) * 0.4 });
        }
        return api;
      },
      // 퍼지는 빛 고리
      ring: function (x, y, o) {
        o = o || {};
        items.push({ t: "ring", x: x, y: y, r0: o.r0 || 10, r1: o.r1 || 120, sy: o.squash || 1, w: o.w || 6, life: 0, dur: o.dur || 20, rgb: o.rgb || TINT.magic });
        return api;
      },
      clear: function () { items.length = 0; },
      draw: function (ctx) {
        var nowD = performance.now();
        var f = lastDraw ? Math.min(3, Math.max(0, (nowD - lastDraw) / 16.667)) : 1; // 60Hz 한 장 = 1
        lastDraw = nowD;
        for (var i = items.length - 1; i >= 0; i--) {
          var it = items[i]; it.life += f;
          var k = it.life / it.dur;
          if (k >= 1) { items.splice(i, 1); continue; }
          ctx.save();
          if (it.t === "burst") {
            var s = it.s * (0.45 + (it.grow - 0.45) * easeOut(k)), a = it.a * (k < 0.5 ? 1 : 1 - (k - 0.5) / 0.5);
            it.rot += it.vr * f;
            ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = Math.max(0, a);
            ctx.translate(it.x, it.y); ctx.rotate(it.rot);
            var im = IMG[it.kind];
            if (ok(im)) ctx.drawImage(im, -s / 2, -s / 2, s, s);
            else glow(ctx, 0, 0, s * 0.45, TINT[it.kind] || TINT.boom, 0.9);
          } else if (it.t === "beam") {
            var dx = it.x2 - it.x1, dy = it.y2 - it.y1, len = Math.sqrt(dx * dx + dy * dy), ab = 1 - k;
            ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = ab;
            ctx.translate(it.x1, it.y1); ctx.rotate(Math.atan2(dy, dx));
            var bm = IMG.beam, w = it.w * (0.7 + 0.3 * ab);
            if (ok(bm)) ctx.drawImage(bm, 0, -w / 2, len, w);
            else {
              ctx.strokeStyle = "rgba(" + it.rgb + ",0.55)"; ctx.lineWidth = w * 0.6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, 0); ctx.stroke();
              ctx.strokeStyle = "rgba(255,255,255,0.95)"; ctx.lineWidth = Math.max(1.5, w * 0.12); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, 0); ctx.stroke();
            }
            glow(ctx, 0, 0, w * 0.9, it.rgb, 0.6 * ab);
          } else if (it.t === "p") {
            it.x += it.vx * f; it.y += it.vy * f; it.vy += it.g * f; it.vx *= Math.pow(0.97, f); it.rot += it.vr * f;
            var ap = 1 - k;
            if (it.shape === "spark") {
              ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = ap;
              ctx.strokeStyle = "rgba(" + it.rgb + ",1)"; ctx.lineWidth = it.r * 0.8; ctx.lineCap = "round";
              ctx.beginPath(); ctx.moveTo(it.x, it.y); ctx.lineTo(it.x - it.vx * 2.2, it.y - it.vy * 2.2); ctx.stroke();
            } else if (it.shape === "dust") {
              ctx.globalAlpha = ap * 0.55; var rr = it.r * (1 + k * 1.8);
              var g2 = ctx.createRadialGradient(it.x, it.y, 0, it.x, it.y, rr);
              g2.addColorStop(0, "rgba(" + it.rgb + ",0.8)"); g2.addColorStop(1, "rgba(" + it.rgb + ",0)");
              ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(it.x, it.y, rr, 0, Math.PI * 2); ctx.fill();
            } else {
              ctx.globalAlpha = Math.min(1, ap * 1.4); ctx.translate(it.x, it.y); ctx.rotate(it.rot);
              ctx.fillStyle = "rgba(" + it.rgb + ",1)"; ctx.fillRect(-it.r * 1.4, -it.r * 0.45, it.r * 2.8, it.r * 0.9);
              ctx.strokeStyle = "rgba(60,35,15,0.9)"; ctx.lineWidth = 1; ctx.strokeRect(-it.r * 1.4, -it.r * 0.45, it.r * 2.8, it.r * 0.9);
            }
          } else if (it.t === "ring") {
            var r = it.r0 + (it.r1 - it.r0) * easeOut(k);
            ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 1 - k;
            ctx.strokeStyle = "rgba(" + it.rgb + ",1)"; ctx.lineWidth = it.w * (1 - k * 0.6);
            ctx.beginPath(); ctx.ellipse(it.x, it.y, r, r * it.sy, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = Math.max(1, it.w * 0.25);
            ctx.beginPath(); ctx.ellipse(it.x, it.y, r, r * it.sy, 0, 0, Math.PI * 2); ctx.stroke();
          }
          ctx.restore();
        }
      },
    };
    return api;
  }
  window.NakkeFX = { layer: layer, images: IMG };
})();
