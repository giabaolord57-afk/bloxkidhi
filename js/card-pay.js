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

  var api = {
    DENOMINATIONS: DENOMINATIONS, STEP: STEP,
    feeRateFor: feeRateFor, roundDownToCard: roundDownToCard, roundForCards: roundForCards, MAX_ROUND_UP: MAX_ROUND_UP,
    cardDue: cardDue, suggestCards: suggestCards, groupCards: groupCards
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.BXCardPay = api;
})(typeof window !== "undefined" ? window : globalThis);
