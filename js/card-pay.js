/* Tính tiền thanh toán bằng thẻ cào: chiết khấu + làm tròn theo mệnh giá card.
 *
 * Quy tắc:
 *  - Phí chiết khấu tính trên giá gốc (20% / 15% / 12% theo bậc).
 *  - Tổng khách phải trả = giá gốc + phí.
 *  - Vì không có card lẻ (2.000đ, 8.000đ...), tổng được làm tròn XUỐNG bội số của 10.000đ
 *    (card nhỏ nhất). Shop chịu phần lẻ, không bắt khách trả dư.
 *      72.000 -> 70.000 (50k + 20k)      78.000 -> 70.000 (không lên 80.000)
 *  - Ngoại lệ: nếu làm tròn LÊN chỉ cao hơn tối đa 5.000đ và dùng ÍT card hơn hẳn thì làm tròn lên.
 *      96.000 -> 100.000 (1 card 100k thay vì 50k+30k+10k)
 *  - Tối thiểu 10.000đ (1 card nhỏ nhất) để đơn nhỏ không bị về 0.
 */
(function (root) {
  "use strict";

  var DENOMINATIONS = [10000, 20000, 30000, 50000, 100000, 200000, 300000, 500000];
  var STEP = DENOMINATIONS[0]; // card nhỏ nhất = đơn vị làm tròn
  var MAX_ROUND_UP = 5000;     // chỉ làm tròn lên nếu khách trả thêm không quá mức này

  function feeRateFor(amount) {
    return amount <= 100000 ? 0.20 : amount <= 200000 ? 0.15 : 0.12;
  }

  /** Làm tròn xuống bội số của STEP, nhưng không thấp hơn 1 STEP. */
  function roundDownToCard(amount) {
    return Math.max(STEP, Math.floor(amount / STEP) * STEP);
  }

  /** Chọn số tiền cần nạp: mặc định làm tròn xuống, lên nếu gần card lớn và gọn hơn. */
  function roundForCards(exact) {
    var down = roundDownToCard(exact);
    if (down >= exact) return down; // đã là bội số 10.000đ
    var up = down + STEP;
    if (up - exact <= MAX_ROUND_UP && suggestCards(up).length < suggestCards(down).length) return up;
    return down;
  }

  /** Số tiền cần trả bằng thẻ cho một đơn có giá gốc `total`. */
  function cardDue(total) {
    var rate = feeRateFor(total);
    var fee = Math.round(total * rate);
    var exact = total + fee;
    var due = roundForCards(exact);
    return { total: total, rate: rate, fee: fee, exact: exact, due: due, rounding: due - exact };
  }

  /** Ít card nhất để ra đúng `amount` (bội số của STEP). Trả về mảng mệnh giá giảm dần. */
  function suggestCards(amount) {
    if (amount <= 0 || amount % STEP !== 0) return [];
    var n = amount / STEP, best = new Array(n + 1), prev = new Array(n + 1);
    best[0] = 0;
    for (var i = 1; i <= n; i++) {
      best[i] = Infinity;
      for (var k = 0; k < DENOMINATIONS.length; k++) {
        var d = DENOMINATIONS[k] / STEP;
        if (d <= i && best[i - d] + 1 < best[i]) { best[i] = best[i - d] + 1; prev[i] = d; }
      }
    }
    var out = [];
    for (var j = n; j > 0; j -= prev[j]) out.push(prev[j] * STEP);
    return out.sort(function (a, b) { return b - a; });
  }

  /** Gộp [50000,20000,20000] -> [{value:50000,count:1},{value:20000,count:2}] */
  function groupCards(list) {
    var map = {};
    list.forEach(function (v) { map[v] = (map[v] || 0) + 1; });
    return Object.keys(map).map(Number).sort(function (a, b) { return b - a; })
      .map(function (v) { return { value: v, count: map[v] }; });
  }

  /* ---------- Hiệu ứng chuyển động cho phần thanh toán thẻ cào ---------- */
  var FX_CSS =
    "@keyframes bxIn{from{opacity:0;transform:translateY(-10px) scale(.98)}to{opacity:1;transform:none}}" +
    "@keyframes bxPulse{0%{box-shadow:0 0 0 0 rgba(0,240,255,.55)}100%{box-shadow:0 0 0 14px rgba(0,240,255,0)}}" +
    "@keyframes bxFlash{0%{text-shadow:0 0 0 rgba(0,240,255,0);transform:scale(1)}35%{text-shadow:0 0 18px rgba(0,240,255,.9);transform:scale(1.12)}100%{text-shadow:0 0 0 rgba(0,240,255,0);transform:scale(1)}}" +
    "@keyframes bxOk{0%{box-shadow:0 0 0 0 rgba(16,185,129,.6)}100%{box-shadow:0 0 0 16px rgba(16,185,129,0)}}" +
    ".bx-in{animation:bxIn .45s cubic-bezier(.16,1,.3,1) both}" +
    ".bx-pulse{animation:bxPulse .7s ease-out}" +
    ".bx-flash{display:inline-block;transform-origin:right center;animation:bxFlash .6s ease-out}" +
    ".bx-ok{animation:bxOk .8s ease-out;border-color:rgba(16,185,129,.7)!important}" +
    "#cardHint{transition:border-color .3s,background-color .3s}" +
    "@media (prefers-reduced-motion:reduce){.bx-in,.bx-pulse,.bx-flash,.bx-ok{animation:none!important}}";

  function reducedMotion() {
    return typeof window !== "undefined" && window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function injectStyles() {
    if (typeof document === "undefined" || document.getElementById("bx-cardpay-fx")) return;
    var st = document.createElement("style");
    st.id = "bx-cardpay-fx";
    st.textContent = FX_CSS;
    document.head.appendChild(st);
  }

  /** Chạy lại 1 class animation trên phần tử (kể cả khi đã có class đó). */
  function replay(el, cls) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth; // ép reflow để animation chạy lại
    el.classList.add(cls);
  }

  /** Đếm số chạy từ giá trị cũ đến giá trị mới, kèm hiệu ứng sáng lên. */
  function animateNumber(el, to, format) {
    if (!el) return;
    var from = typeof el._bxVal === "number" ? el._bxVal : to;
    el._bxVal = to;
    if (el._bxRaf) cancelAnimationFrame(el._bxRaf);
    if (from === to || reducedMotion() || typeof requestAnimationFrame === "undefined") {
      el.textContent = format(to);
      return;
    }
    var t0 = null, dur = 550;
    replay(el, "bx-flash");
    (function frame(t) {
      if (t0 === null) t0 = t;
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = format(Math.round(from + (to - from) * e));
      if (k < 1) el._bxRaf = requestAnimationFrame(frame);
      else el.textContent = format(to);
    })(performance.now());
  }

  injectStyles();

  var api = {
    DENOMINATIONS: DENOMINATIONS, STEP: STEP,
    feeRateFor: feeRateFor, roundDownToCard: roundDownToCard, roundForCards: roundForCards, MAX_ROUND_UP: MAX_ROUND_UP,
    cardDue: cardDue, suggestCards: suggestCards, groupCards: groupCards,
    animateNumber: animateNumber, replay: replay
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.BXCardPay = api;
})(typeof window !== "undefined" ? window : globalThis);
