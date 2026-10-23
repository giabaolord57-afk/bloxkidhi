(function () {
  "use strict";
  const S = window.SHOP, MK = S.markup, db = window.BX_SUPABASE;
  const $ = (s, r = document) => r.querySelector(s);
  const app = $("#app");

  /* ---------- helpers ---------- */
  const sell = (base) => base + MK;
  const vnd = (n) => n.toLocaleString("vi-VN", { maximumFractionDigits: 1 }) + "đ";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem("bx_" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("bx_" + k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
  };
  let mem = { cart: [], orders: [] }; // fallback when storage blocked
  const getCart = () => store.get("cart", mem.cart);
  const setCart = (c) => { mem.cart = c; store.set("cart", c); updateBadge(); };
  const getOrders = () => store.get("orders", mem.orders);
  const setOrders = (o) => { mem.orders = o; store.set("orders", o); };

  let toastT;
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2200);
  }
  function updateBadge() {
    const n = getCart().reduce((a, l) => a + l.qty, 0), b = $("#cartCount");
    b.textContent = n; b.classList.toggle("zero", n === 0);
  }
  function addToCart(line) {
    const c = getCart(), ex = c.find((l) => l.key === line.key);
    if (ex) { ex.qty += 1; }
    else c.push({ ...line, qty: 1 });
    setCart(c); toast("Đã thêm vào giỏ: " + line.name);
  }

  /* ---------- views ---------- */
  const views = {};

  function ticker() {
    const pool = [];
    ITEM_GROUPS.forEach((g) => g.items.slice(0, 4).forEach((i) => pool.push([g.icon, i.name, i.base])));
    BOOST.groups.forEach((g) => g.items.slice(0, 2).forEach((i) => pool.push([g.icon, i.name, i.base])));
    const html = pool.map((x) => `<span class="tk"><i>${x[0]}</i>${esc(x[1].length > 34 ? x[1].slice(0, 32) + "…" : x[1])}<b>${vnd(sell(x[2]))}</b></span>`).join("");
    // Two identical groups + translateX(-50%) create a seamless, continuous loop.
    return `<div class="ticker" aria-hidden="true"><div class="ticker-track"><div class="ticker-group">${html}</div><div class="ticker-group">${html}</div></div></div>`;
  }

  views.home = () => {
    const nItem = ITEM_GROUPS.reduce((a, g) => a + g.items.length, 0);
    const nBoost = BOOST.groups.reduce((a, g) => a + g.items.length, 0);
    const feat = [
      ...ITEM_GROUPS.flatMap((g) => g.items.filter((i) => i.tag).map((i) => ({ t: "item", g, i }))),
      ...BOOST.groups.flatMap((g) => g.items.filter((i) => i.tag).map((i) => ({ t: "boost", g, i }))),
    ].slice(0, 6);
    return `
    <section class="hero">
      <div class="hero-floor" aria-hidden="true"></div>
      <div class="hero-in">
        <div class="hero-txt">
          <span class="tag g">BLOX FRUITS • NẠP TỰ ĐỘNG</span>
          <h1>Mọi thứ cho <span class="shine">Blox Fruits</span><br>trong một cửa hàng</h1>
          <p>${esc(S.tagline)}. Mua vật phẩm và thuê cày nhanh chóng, an toàn.</p>
          <div class="row"><a class="btn btn-p" href="#/cay-thue">⚔️ Cày thuê ngay</a><a class="btn btn-g" href="#/vat-pham">Xem vật phẩm</a></div>
          <div class="hero-stats">
            <div><b data-count="${nItem + nBoost}">0</b><span>Dịch vụ & vật phẩm</span></div>
            <div><b data-count="${ITEM_GROUPS.length + BOOST.groups.length}">0</b><span>Nhóm dịch vụ</span></div>
            <div><b>24/7</b><span>Hỗ trợ Zalo</span></div>
          </div>
        </div>
        <img class="hero-logo" src="img/logo.png" alt="BDShopVN">
      </div>
    </section>
    ${ticker()}

    <div class="sec-h"><div><h2>Danh mục</h2><p class="muted small">Chọn dịch vụ bạn cần</p></div></div>
    <div class="grid g3">
      <a class="card hv cat" href="#/vat-pham"><span class="ico">💎</span><h3>Vật phẩm Blox Fruits</h3><p>Robux 120H, trái ác quỷ vĩnh viễn, trái rương, gamepass.</p><span class="go">Xem vật phẩm →</span></a>
      <a class="card hv cat" href="#/cay-thue"><span class="ico">⚔️</span><h3>Cày thuê Blox Fruits</h3><p>Level, Sea, Race V4, CDK, Godhuman, Mastery, Beli…</p><span class="go">Xem bảng giá →</span></a>
      <a class="card hv cat" href="#/steal-an-egg"><span class="ico">🥚</span><h3>Steal An Egg</h3><p>Cày thuê Steal An Egg theo ngày (25k/ngày), auto sự kiện, chạy bộ, cướp trứng, upgrade...</p><span class="go">Xem dịch vụ →</span></a>
      <a class="card hv cat" href="#/acc"><span class="ico">🎮</span><h3>Acc tự chọn</h3><p>Chọn acc theo tên, xem thông số. Gửi mã acc cho admin rồi thanh toán để nhận mật khẩu.</p><span class="go">Chọn acc →</span></a>
      <a class="card hv cat" href="#/tui-mu"><span class="ico">🎒</span><h3>Acc túi mù</h3><p>50.000đ / acc. 100% có Soul Guitar, CDK, Godhuman.</p><span class="go">Xem acc túi mù →</span></a>
      <a class="card hv cat" href="#/don-hang"><span class="ico">📦</span><h3>Đơn hàng của tôi</h3><p>Theo dõi trạng thái các đơn bạn đã đặt trên thiết bị này.</p><span class="go">Xem đơn →</span></a>
      <a class="card hv cat" href="${esc(S.contact.zalo)}" target="_blank" rel="noopener"><span class="ico">💬</span><h3>Hỗ trợ Zalo</h3><p>Cần tư vấn, đặt đơn lớn hay hỏi bảo hành? Nhắn ngay.</p><span class="go">Nhắn Zalo →</span></a>
    </div>

    <div class="sec-h"><div><h2>Bán chạy</h2></div></div>
    <div class="grid g3">${feat.map((f) => f.t === "item" ? itemCard(f.g, f.i) : boostCard(f.g, f.i)).join("")}</div>

    <div class="sec-h"><div><h2>Mua hàng thế nào?</h2></div></div>
    <div class="steps">
      <div><b>Chọn sản phẩm</b>Chọn dịch vụ hoặc vật phẩm bạn cần.</div>
      <div><b>Thêm vào giỏ hàng</b>Bấm “+ Giỏ hàng” ở sản phẩm đã chọn.</div>
      <div><b>Điền thông tin</b>Vào giỏ hàng, nhập thông tin acc Roblox (cần cày / cần mua) và thông tin liên hệ của bạn.</div>
      <div><b>Gửi mã đơn & thanh toán</b>Sau khi đặt, mã đơn hàng sẽ hiện ra. Liên hệ admin, gửi mã đơn rồi thanh toán.</div>
      <div><b>Chờ hoàn thành</b>Admin xử lý đơn, bạn theo dõi trạng thái ở mục Đơn hàng.</div>
    </div>`;
  };

  function itemCard(g, i) {
    const pic = i.img ? `<div class="fimg"><img src="${esc(i.img)}" alt="${esc(i.name)}" loading="lazy" decoding="async" width="128" height="128"></div>` : "";
    return `<div class="card prod${i.img ? " has-img" : ""}">${pic}
      <h3>${i.img ? "" : g.icon + " "}${esc(i.name)} ${i.tag ? `<span class="tag">${esc(i.tag)}</span>` : ""}</h3>
      <div class="meta">${esc(g.name)}</div>
      <div class="pf"><span class="price">${vnd(sell(i.base))}</span>
      <button class="btn btn-p btn-s" data-add="item|${g.id}|${i.id}">+ Giỏ hàng</button></div></div>`;
  }
  function boostCard(g, i) {
    if (i.isCustomDays) {
      const rate = i.ratePerDay || 25000;
      return `<div class="card prod custom-service-card" data-service-card="${esc(i.id)}" data-rate="${rate}">
        <h3>${g.icon} ${esc(i.name)} ${i.tag ? `<span class="tag">${esc(i.tag)}</span>` : ""}</h3>
        <div class="meta">Cày thuê • ${esc(g.name)}${i.eta ? " • " + esc(i.eta) : ""}</div>
        ${i.note ? `<div class="service-note-box"><b>✦ Tính năng & Ghi chú:</b><p>${esc(i.note)}</p></div>` : ""}
        <div class="days-selector-wrap">
          <label class="f">Số ngày cày:</label>
          <div class="days-control">
            <button type="button" class="btn-day-step" data-step="-1">−</button>
            <input type="number" min="1" max="99" value="1" class="days-input" data-days-for="${esc(i.id)}">
            <button type="button" class="btn-day-step" data-step="1">+</button>
            <span class="days-unit">ngày</span>
          </div>
        </div>
        <div class="pf">
          <div>
            <span class="muted small" style="display:block">Tổng cộng:</span>
            <span class="price custom-total" data-total-for="${esc(i.id)}">${vnd(rate)}</span>
            <span class="muted small" style="display:block;font-size:0.75rem">(${vnd(rate)} / ngày)</span>
          </div>
          <button class="btn btn-p btn-s" data-add-custom="${g.id}|${i.id}">+ Giỏ hàng</button>
        </div>
      </div>`;
    }
    return `<div class="card prod">
      <h3>${g.icon} ${esc(i.name)} ${i.tag ? `<span class="tag">${esc(i.tag)}</span>` : ""}</h3>
      <div class="meta">Cày thuê • ${esc(g.name)}${i.eta ? " • " + esc(i.eta) : ""}</div>
      <div class="pf"><span class="price">${vnd(sell(i.base))}</span>
      <button class="btn btn-p btn-s" data-add="boost|${g.id}|${i.id}">+ Giỏ hàng</button></div></div>`;
  }

  const searchBox = `<div class="search"><span>🔍</span><input type="search" id="q" placeholder="Tìm nhanh dịch vụ, tên trái…" autocomplete="off"></div>`;

  views["vat-pham"] = (p) => {
    const all = p[0] === "all";
    const cur = ITEM_GROUPS.find((g) => g.id === p[0]) || (all ? null : ITEM_GROUPS[0]);
    const cards = all ? ITEM_GROUPS.flatMap((g) => g.items.map((i) => itemCard(g, i))) : cur.items.map((i) => itemCard(cur, i));
    return `
    <div class="ph"><div class="crumb"><a href="#/">Trang chủ</a> / Vật phẩm</div><h1>Vật phẩm Blox Fruits</h1>
    <p>Robux, trái ác quỷ và gamepass giao thẳng vào tài khoản Roblox của bạn.</p></div>
    <div class="tabs"><a class="tab ${all ? "on" : ""}" href="#/vat-pham/all">✨ Tất cả</a>${ITEM_GROUPS.map((g) => `<a class="tab ${cur && g.id === cur.id ? "on" : ""}" href="#/vat-pham/${g.id}">${g.icon} ${esc(g.name)}</a>`).join("")}</div>
    ${searchBox}
    ${cur ? `<div class="note" style="margin-bottom:18px">${esc(cur.desc)}</div>` : ""}
    <div class="grid g3" id="list">${cards.join("")}</div><div class="empty" id="none" hidden><div class="big">🔍</div>Không tìm thấy kết quả phù hợp.</div>`;
  };
  views["vat-pham"].after = () => bindSearch();

  views["cay-thue"] = (p) => {
    const all = p[0] === "all";
    const cur = BOOST.groups.find((g) => g.id === p[0]) || (all ? null : BOOST.groups[0]);
    const cards = all ? BOOST.groups.flatMap((g) => g.items.map((i) => boostCard(g, i))) : cur.items.map((i) => boostCard(cur, i));
    return `
    <div class="ph"><div class="crumb"><a href="#/">Trang chủ</a> / Cày thuê</div><h1>Cày thuê Blox Fruits</h1>
    <p>${esc(BOOST.desc)}</p></div>
    <div class="tabs"><a class="tab ${all ? "on" : ""}" href="#/cay-thue/all">✨ Tất cả</a>${BOOST.groups.map((g) => `<a class="tab ${cur && g.id === cur.id ? "on" : ""}" href="#/cay-thue/${g.id}">${g.icon} ${esc(g.name)}</a>`).join("")}</div>
    ${searchBox}
    <div class="grid g3" id="list">${cards.join("")}</div><div class="empty" id="none" hidden><div class="big">🔍</div>Không tìm thấy kết quả phù hợp.</div>
    <div class="note" style="margin-top:22px">🔒 Đơn cày thuê cần <b>mật khẩu Roblox</b> khi đặt hàng. Mật khẩu được lưu riêng, chỉ admin xem được và tự xoá khi đơn hoàn thành. Hãy đổi mật khẩu sau khi xong.</div>`;
  };
  views["cay-thue"].after = () => bindSearch();

  views["steal-an-egg"] = () => {
    const g = BOOST.groups.find((x) => x.id === "steal-an-egg") || BOOST.groups.find((x) => x.id === "dich-vu-khac") || {
      id: "steal-an-egg", name: "Steal An Egg", icon: "🥚",
      items: [
        {
          id: "steal-an-egg-daily",
          name: "Cày thuê Steal An Egg",
          tag: "HOT",
          eta: "Theo ngày",
          base: 5000,
          price: 25000,
          ratePerDay: 25000,
          isCustomDays: true,
          note: "Auto làm sự kiện, chạy bộ, cướp trứng, upgrade,..."
        }
      ]
    };
    const cards = g.items.map((i) => boostCard(g, i));
    return `
    <div class="ph"><div class="crumb"><a href="#/">Trang chủ</a> / Steal An Egg</div><h1>Cày thuê Steal An Egg</h1>
    <p>Dịch vụ cày thuê Steal An Egg theo ngày: auto làm sự kiện, chạy bộ, cướp trứng, upgrade bảo mật tuyệt đối.</p></div>
    <div class="grid g3" id="list">${cards.join("")}</div>
    <div class="note" style="margin-top:22px">🔒 Đơn cày thuê cần <b>mật khẩu Roblox</b> khi đặt hàng. Mật khẩu được lưu riêng, chỉ admin xem được và tự xoá khi đơn hoàn thành. Hãy đổi mật khẩu sau khi xong.</div>`;
  };
  views["dich-vu-khac"] = views["steal-an-egg"];

  function bindSearch() {
    const q = $("#q"); if (!q) return;
    const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
    q.addEventListener("input", () => {
      const k = norm(q.value.trim()); let n = 0;
      document.querySelectorAll("#list .prod").forEach((el) => { const ok = !k || norm(el.textContent).includes(k); el.hidden = !ok; if (ok) n++; });
      $("#none").hidden = n > 0;
    });
  }

  views["gio-hang"] = () => {
    const c = getCart();
    if (!c.length) return `<div class="empty"><div class="big">🛒</div><h2>Giỏ hàng trống</h2><p>Hãy chọn vài sản phẩm nhé.</p><p style="margin-top:16px"><a class="btn btn-p" href="#/vat-pham">Mua sắm ngay</a></p></div>`;
    const total = c.reduce((a, l) => a + l.unit * l.qty, 0);
    const needUser = c.some((l) => l.type === "item" || l.type === "boost");
    // Cần đăng nhập để shop thực hiện giao dịch thay khách: cày thuê, trái vĩnh viễn, trái rương và gamepass.
    const passwordGroups = ["trai-vinh-vien", "trai-ruong", "gamepass"];
    const needPass = c.some((l) => l.type === "boost" || (l.type === "item" && passwordGroups.includes(l.group)));
    return `
    <div class="ph"><h1>Giỏ hàng</h1></div>
    <div class="layout">
      <div class="card">${c.map((l) => `
        <div class="line"><div class="nm"><b>${esc(l.name)}</b><span>${esc(l.cat)} • ${vnd(l.unit)}</span></div>
          <div class="qty"><button data-q="${esc(l.key)}|-1">−</button><b>${l.qty}</b><button data-q="${esc(l.key)}|1">+</button></div>
          <b style="min-width:92px;text-align:right">${vnd(l.unit * l.qty)}</b>
          <button class="x" data-rm="${esc(l.key)}" aria-label="Xoá">✕</button></div>`).join("")}
      </div>
      <form class="card" id="co">
        <h3 style="margin-bottom:14px">Thông tin đặt hàng</h3>
        ${needUser ? `<div class="field"><label class="f">Roblox username *</label><input type="text" name="user" required placeholder="Tên đăng nhập Roblox"></div>` : ""}
        ${needPass ? `<div class="field"><label class="f" for="rbpw">Mật khẩu Roblox * <span class="muted small">(để shop thực hiện dịch vụ/đơn hàng)</span></label>
          <div class="pw"><input type="password" name="password" id="rbpw" required maxlength="128" autocomplete="new-password" placeholder="Mật khẩu tài khoản Roblox"><button type="button" class="pw-t" data-pwtoggle aria-label="Hiện hoặc ẩn mật khẩu">👁</button></div></div>
        <label class="agree"><input type="checkbox" name="agree" required> <span>Tôi đồng ý cung cấp mật khẩu để shop thực hiện dịch vụ/đơn hàng và sẽ đổi mật khẩu ngay sau khi hoàn tất.</span></label>` : ""}
        <div class="field"><label class="f">Zalo / SĐT liên hệ *</label><input type="text" name="contact" required placeholder="Số Zalo hoặc link Facebook"></div>
        <div class="field"><label class="f">Ghi chú</label><textarea name="note" rows="2" placeholder="Yêu cầu thêm (không ghi mật khẩu vào đây)"></textarea></div>
        <div class="sum"><span>Tạm tính</span><span>${vnd(total)}</span></div>
        <div class="sum t"><span>Tổng</span><span class="price">${vnd(total)}</span></div>
        <button class="btn btn-p" style="width:100%;margin-top:14px">Đặt hàng</button>
        <p class="muted small" style="margin-top:10px">${needPass ? "🔒 Chỉ cung cấp mật khẩu nếu bạn đồng ý để shop đăng nhập thực hiện đơn. Đổi mật khẩu ngay sau khi hoàn tất; không dùng lại mật khẩu ở dịch vụ khác." : "Đơn này không yêu cầu mật khẩu Roblox."}</p>
      </form>
    </div>`;
  };
  views["gio-hang"].after = () => {
    const f = $("#co"); if (!f) return;
    f.addEventListener("submit", async (e) => {
      e.preventDefault(); const btn=f.querySelector('button[type="submit"], button.btn-p'); btn.disabled=true;
      try {
        const d=Object.fromEntries(new FormData(f)); const c=getCart();
        const {data,error}=await db.rpc('place_bloxshop_order',{p_customer:(d.user||'Khách hàng').trim(),p_contact:d.contact.trim(),p_lines:c.map(l=>({key:l.key,qty:l.qty}))});
        if(error) throw error;
        let pwFailed=false;
        if(d.password){
          try{const {error:pe}=await db.rpc('save_bloxshop_order_password',{p_code:data.code,p_token:data.token,p_password:d.password});if(pe)throw pe;}
          catch(pe){console.error(pe);pwFailed=true;}
        }
        const o={code:data.code,token:data.token,at:Date.now(),user:(d.user||'').trim(),contact:d.contact.trim(),total:data.total,status:data.status,lines:data.lines};
        setOrders([o,...getOrders()]);setCart([]);location.hash='#/thanh-toan/'+o.code;
        if(pwFailed)toast('Đơn đã tạo nhưng chưa lưu được mật khẩu. Vui lòng nhắn Zalo cho shop mã đơn '+o.code+'.');
      } catch(err){console.error(err);toast('Không thể tạo đơn: '+(err.message||'Vui lòng thử lại'));} finally {btn.disabled=false;}
    });
  };

  const orderText = (o) => `ĐƠN ${o.code}\n` + o.lines.map((l) => `- ${l.name} x${l.qty} = ${vnd(l.unit * l.qty)}`).join("\n") +
    `\nTổng: ${vnd(o.total)}\n` + (o.user ? `Roblox: ${o.user}\n` : "") + `Liên hệ: ${o.contact}` + (o.note ? `\nGhi chú: ${o.note}` : "");

  const progressStep = (status) => ({"Đã duyệt":1,"Đang xử lý":2,"Hoàn thành":3})[status] || 0;
  function orderProgress(status) {
    const step=progressStep(status), rejected=status==="Từ chối";
    return `<div class="order-progress" data-order-progress role="status" aria-label="Tiến độ đơn hàng: ${esc(status || 'Chờ duyệt')}">
      <div class="order-progress-head"><b>Tiến độ đơn hàng</b><span class="order-progress-count">${rejected?'Đã từ chối':step+'/3'}</span></div>
      <div class="order-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="3" aria-valuenow="${step}" aria-label="Tiến độ đơn hàng"><span class="order-progress-fill${rejected?' rejected':''}" style="width:${step/3*100}%"></span></div>
      <div class="order-progress-labels"><span class="${step>=1?'active':''}">Đã duyệt</span><span class="${step>=2?'active':''}">Đang xử lý</span><span class="${step>=3?'active':''}">Hoàn thành</span></div>
      ${rejected?'<p class="order-progress-rejected">Đơn hàng đã bị từ chối, không tính là hoàn thành.</p>':''}
    </div>`;
  }
  function refreshDetailStatus(o) {
    const label=$('[data-detail-status]'); if(label) label.textContent=o.status||'Chờ duyệt';
    const progress=$('[data-order-progress]'); if(progress) progress.outerHTML=orderProgress(o.status);
  }
  views["thanh-toan"] = (p) => {
    const o = getOrders().find((x) => x.code === p[0]);
    if (!o) return `<div class="empty"><div class="big">🤔</div><h2>Không tìm thấy đơn</h2><p><a href="#/don-hang">Xem đơn hàng</a></p></div>`;
    const b = S.bank, hasBank = b.bankCode && b.accountNo;
    const qr = hasBank ? `https://img.vietqr.io/image/${encodeURIComponent(b.bankCode)}-${encodeURIComponent(b.accountNo)}-compact2.png?amount=${o.total}&addInfo=${encodeURIComponent(o.code)}${b.accountName ? "&accountName=" + encodeURIComponent(b.accountName) : ""}` : "";
    return `
    <div class="ph"><div class="note ok" style="margin-bottom:16px">✅ Đã tạo đơn <b>${esc(o.code)}</b>. Hoàn tất thanh toán rồi gửi đơn qua Zalo để shop xử lý.</div><h1>Thanh toán</h1></div>
    <div class="layout">
      <div class="card"><h3 style="margin-bottom:12px">Chi tiết đơn</h3><p style="margin-bottom:12px">Trạng thái: <strong class="status" data-detail-status>${esc(o.status || "Chờ duyệt")}</strong></p>
        ${orderProgress(o.status)}
        ${o.lines.map((l) => `<div class="line"><div class="nm"><b>${esc(l.name)}</b><span>${esc(l.cat)} × ${l.qty}</span></div><b>${vnd(l.unit * l.qty)}</b></div>`).join("")}
        <div class="sum t"><span>Tổng cần thanh toán</span><span class="price">${vnd(o.total)}</span></div>
        <div class="row" style="margin-top:14px"><button class="btn btn-p" id="sendZalo">💬 Sao chép đơn & mở Zalo</button><a class="btn btn-g" href="${esc(S.contact.facebook)}" target="_blank" rel="noopener">Facebook admin</a></div>
      </div>
      <div class="card"><h3 style="margin-bottom:12px">Chuyển khoản</h3>
        ${hasBank ? `<img class="qr" src="${qr}" alt="QR chuyển khoản"><div class="pay" style="margin-top:14px">
          <div class="r"><span>Ngân hàng</span><b>${esc(b.bankCode)}</b></div>
          <div class="r"><span>Số tài khoản</span><b>${esc(b.accountNo)}</b></div>
          ${b.accountName ? `<div class="r"><span>Chủ TK</span><b>${esc(b.accountName)}</b></div>` : ""}
          <div class="r"><span>Số tiền</span><b>${vnd(o.total)}</b></div>
          <div class="r"><span>Nội dung</span><b>${esc(o.code)}</b></div></div>`
          : `<div class="note">Shop chưa cấu hình tài khoản ngân hàng. Vui lòng nhắn Zalo <b>${esc(S.contact.zaloPhone)}</b> để nhận thông tin chuyển khoản. Nội dung CK: <b>${esc(o.code)}</b>.</div>`}
      </div>
    </div>`;
  };
  // Refresh a saved order from the server using its private lookup token.
  async function syncOrderStatus(o) {
    if (!o?.token) return false;
    try {
      const {data,error}=await db.rpc('lookup_bloxshop_order',{p_code:o.code,p_token:o.token});
      if(error) { console.warn('Order lookup failed:',error.message); return false; }
      if(!data || typeof data.status !== 'string') return false;
      o.status=data.status;
      const all=getOrders(); const saved=all.find(x=>x.code===o.code);
      if(saved){saved.status=data.status;setOrders(all);}
      return true;
    } catch(e) { console.warn('Order lookup failed:',e); return false; }
  }
  views["thanh-toan"].after = (p) => {
    const o = getOrders().find((x) => x.code === p[0]); const btn = $("#sendZalo"); if (!o || !btn) return;
    syncOrderStatus(o).then(ok=>{if(ok && location.hash==='#/thanh-toan/'+o.code) refreshDetailStatus(o);});
    btn.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(orderText(o)); toast("Đã sao chép đơn — dán vào Zalo"); } catch (e) { toast("Hãy tự sao chép nội dung đơn"); }
      window.open(S.contact.zalo, "_blank", "noopener");
    });
  };

  views["don-hang"] = () => {
    const os = getOrders();
    return `<div class="ph"><div class="crumb"><a href="#/">Trang chủ</a> / Đơn hàng</div><h1>Đơn hàng của tôi</h1><p>Các đơn đặt trên thiết bị này. Trạng thái được đồng bộ từ Supabase khi mở trang này.</p></div>` +
      (os.length ? `<div class="tw"><table><thead><tr><th>Mã đơn</th><th>Sản phẩm</th><th class="n">Tổng</th><th>Trạng thái</th><th></th></tr></thead><tbody>${os.map((o) => `
        <tr><td><b>${esc(o.code)}</b><div class="muted small">${new Date(o.at).toLocaleString("vi-VN")}</div></td>
        <td>${o.lines.map((l) => esc(l.name) + (l.qty > 1 ? " ×" + l.qty : "")).join(", ")}</td>
        <td class="n">${vnd(o.total)}</td><td><span class="status" data-order-status="${esc(o.code)}">${esc(o.status || "Chờ duyệt")}</span></td>
        <td><a class="btn btn-g btn-s" href="#/thanh-toan/${esc(o.code)}">Chi tiết</a></td></tr>`).join("")}</tbody></table></div>`
        : `<div class="empty"><div class="big">📦</div><p>Bạn chưa có đơn hàng nào.</p></div>`);
  };

  views["don-hang"].after = async () => {
    const orders=getOrders(); let changed=false;
    for(const o of orders){if(!o.token)continue;try{const {data,error}=await db.rpc('lookup_bloxshop_order',{p_code:o.code,p_token:o.token});if(!error&&data){o.status=data.status;changed=true;}}catch(e){console.warn(e);}}
    if(changed){setOrders(orders);document.querySelectorAll('[data-order-status]').forEach(el=>{const o=orders.find(x=>x.code===el.dataset.orderStatus);if(o)el.textContent=o.status;});}
  };
  /* ---------- ACC TỰ CHỌN & ACC TÚI MÙ (mua qua Zalo/Facebook, không cần giỏ hàng) ---------- */
  const AS = { blindbag: { price: 50000, odds: [], accounts: [] }, accounts: [], categories: [] };
  const accPrice = (x) => { const c=AS.categories.find(z=>z.id===x.category_id); return x.price!==null&&x.price!==undefined ? Number(x.price) : (c ? Number(c.price) : 50000); };
  const findAcc = (code) => { const x=AS.accounts.find(a=>a.code===code); return x ? {x,bag:!!AS.categories.find(c=>c.id===x.category_id)?.is_blindbag}:null; };
  async function refreshAccData(){
    if(!db)return;
    const [cr,ar]=await Promise.all([
      db.from('acc_categories').select('id,name,price,is_blindbag,active').eq('active',true).order('created_at',{ascending:true}),
      db.from('acc_inventory').select('id,category_id,code,name,details,price,cover_url,gallery_urls,active,sold').eq('active',true).eq('sold',false).order('created_at',{ascending:false})
    ]);
    if(!cr.error) AS.categories=cr.data||[];
    if(!ar.error) AS.accounts=ar.data||[];
    AS.categories=AS.categories.map(c=>({...c,is_blindbag: Boolean(c.is_blindbag || ['túi mù','tui mu','acc túi mù','acc tui mu'].includes(String(c.name||'').trim().toLocaleLowerCase('vi-VN')))}));
    AS.blindbag={...AS.blindbag, ...((AS.categories.find(c=>c.is_blindbag))||{}), accounts:AS.accounts.filter(a=>AS.categories.find(c=>c.id===a.category_id)?.is_blindbag)};
  }
  views.acc = (p=[]) => {
    const selected=p[0], cats=AS.categories, list=AS.accounts.filter(a=>!selected||a.category_id===selected), current=cats.find(c=>c.id===selected);
    return `<div class="ph"><div class="crumb"><a href="#/">Trang chủ</a> / Kho acc</div><h1>${current?esc(current.name):'Tất cả acc'}</h1><p>Chọn danh mục để xem acc đang bán. Giá từng acc tự động lấy từ giá của danh mục.</p></div>
    <div class="tabs"><a class="tab ${!selected?'on':''}" href="#/acc">Tất cả danh mục</a>${cats.map(c=>`<a class="tab ${c.id===selected?'on':''}" href="#/acc/${esc(c.id)}">${c.is_blindbag?'🎒':'🎮'} ${esc(c.name)} · ${vnd(c.price)}</a>`).join('')}</div>
    ${list.length?`<div class="search"><span>🔍</span><input type="search" id="q" placeholder="Tìm theo tên, thông số hoặc mã acc…" autocomplete="off"></div><div class="grid g3" id="list">${list.map(accCard).join('')}</div><div class="empty" id="none" hidden>Không tìm thấy acc phù hợp.</div>`:`<div class="empty"><div class="big">🎮</div><h2>Chưa có acc đang bán</h2><p>Admin sẽ cập nhật thêm acc sau.</p><p style="margin-top:16px"><a class="btn btn-p" href="${esc(S.contact.zalo)}" target="_blank" rel="noopener">💬 Nhắn Zalo admin</a></p></div>`}`;
  };
  views.acc.after = () => bindSearch();
  function accCard(a) {
    const c=AS.categories.find(z=>z.id===a.category_id), details=String(a.details||'').split(/\n|,/).map(x=>x.trim()).filter(Boolean);
    return `<div class="card prod">${a.cover_url?`<img src="${esc(a.cover_url)}" alt="${esc(a.name)}" loading="lazy" style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:10px;margin-bottom:10px">`:''}<div class="acc-top"><span class="acc-id">Mã: ${esc(a.code)}</span><span class="tag">${esc(c?.name||'Acc')}</span></div><h3>👤 ${esc(a.name)}</h3>${details.length?`<dl class="kv">${details.map((d,i)=>`<dt>${i===0?'Thông tin':'Chi tiết '+(i+1)}</dt><dd>${esc(d)}</dd>`).join('')}</dl>`:''}<div class="pf"><span class="price">${vnd(accPrice(a))}</span><a class="btn btn-p btn-s" href="#/mua-acc/${esc(a.code)}">Chọn acc</a></div></div>`;
  }
  views["tui-mu"] = () => {
    const B=AS.blindbag, cat=AS.categories.find(c=>c.is_blindbag);
    return `<div class="ph"><div class="crumb"><a href="#/">Trang chủ</a> / Acc túi mù</div><h1>Acc túi mù</h1><p>Mỗi acc giá <b>${vnd(cat?.price ?? 50000)}</b>. Chọn acc đang có trong kho.</p></div>${B.accounts.length?`<div class="grid g3">${B.accounts.map(a=>`<div class="card bag"><img src="${esc(a.cover_url||'img/tui-mu-50k-cover.jpg')}" alt="${esc(a.name||'Acc túi mù 50K')}" loading="lazy" style="display:block;width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:10px;margin-bottom:12px"><div class="muted small">Mã: ${esc(a.code)}</div><h3>${esc(a.name)}</h3><div class="price" style="font-size:1.4rem">${vnd(accPrice(a))}</div><a class="btn btn-pu" href="#/mua-acc/${esc(a.code)}">🎲 Chọn acc này</a></div>`).join('')}</div>`:`<div class="empty"><div class="big">🎒</div><h2>Chưa có acc túi mù</h2><p>Admin sẽ cập nhật thêm acc sau.</p></div>`}<p style="margin-top:18px"><a href="#/acc">Xem tất cả danh mục acc →</a></p>`;
  };

  views["mua-acc"] = (p) => {
    const f = findAcc(p[0]);
    if (!f) return `<div class="empty"><div class="big">🤔</div><h2>Không tìm thấy acc</h2><p><a href="#/acc">Xem acc tự chọn</a> · <a href="#/tui-mu">Xem acc túi mù</a></p></div>`;
    const { x, bag } = f, price = accPrice(x), category=AS.categories.find(c=>c.id===x.category_id), kind = category?.name || (bag ? "acc túi mù" : "acc");
    if (x.sold) return `<div class="empty"><div class="big">😢</div><h2>Acc này đã bán</h2><p><a href="${bag ? "#/tui-mu" : "#/acc"}">Chọn acc khác</a></p></div>`;
    const b = S.bank || {}, hasBank = b.bankCode && b.accountNo;
    const qr = hasBank ? `https://img.vietqr.io/image/${encodeURIComponent(b.bankCode)}-${encodeURIComponent(b.accountNo)}-compact2.png?amount=${price}&addInfo=${encodeURIComponent(x.code)}${b.accountName ? "&accountName=" + encodeURIComponent(b.accountName) : ""}` : "";
    const msg = `Mình muốn mua ${kind} mã ${x.code} (tên acc: ${x.name}) - giá ${vnd(price)}.`;
    return `
    <div class="ph"><div class="crumb"><a href="#/">Trang chủ</a> / <a href="${bag ? "#/tui-mu" : "#/acc"}">${esc(category?.name || (bag ? "Acc túi mù" : "Acc tự chọn"))}</a> / ${esc(x.code)}</div><h1>Mua ${kind}</h1></div>
    <div class="layout">
      <div class="card">
        ${x.cover_url?`<img src="${esc(x.cover_url)}" alt="${esc(x.name)}" style="width:100%;max-height:420px;object-fit:contain;border-radius:12px;margin-bottom:12px">`:''}${Array.isArray(x.gallery_urls)&&x.gallery_urls.length?`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;margin-bottom:14px">${x.gallery_urls.slice(0,30).map((u,i)=>`<a href="${esc(u)}" target="_blank" rel="noopener"><img src="${esc(u)}" alt="Ảnh phụ ${i+1}" loading="lazy" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px"></a>`).join('')}</div>`:''}
        <div class="buycode"><span class="muted small">MÃ ACC CỦA BẠN</span><b id="bcode">${esc(x.code)}</b>
          <button class="btn btn-g btn-s" data-copy="${esc(x.code)}">Sao chép mã</button></div>
        <dl class="kv" style="margin-top:14px"><dt>Tên acc</dt><dd>${esc(x.name)}</dd><dt>Loại</dt><dd>${esc(category?.name || (bag ? "Acc túi mù" : "Acc tự chọn"))}</dd><dt>Giá</dt><dd><b class="price">${vnd(price)}</b></dd></dl>
        <div class="buysteps">
          <div><b>Gửi mã acc cho admin</b>Nhắn mã <b>${esc(x.code)}</b> cho admin qua Zalo hoặc Facebook.
            <div class="row" style="margin-top:10px"><button class="btn btn-p btn-s" data-copy="${esc(msg)}">Sao chép tin nhắn</button>
            <a class="btn btn-g btn-s" href="${esc(S.contact.zalo)}" target="_blank" rel="noopener">💬 Zalo</a>
            <a class="btn btn-g btn-s" href="${esc(S.contact.facebook)}" target="_blank" rel="noopener">Facebook</a></div></div>
          <div><b>Thanh toán</b>Chuyển khoản đúng số tiền, nội dung ghi mã acc <b>${esc(x.code)}</b>.</div>
          <div><b>Nhận mật khẩu</b>Sau khi thanh toán, admin gửi mật khẩu acc cho bạn qua Zalo. Hãy quay video lúc nhận acc và đổi mật khẩu ngay.</div>
        </div>
      </div>
      <div class="card"><h3 style="margin-bottom:12px">Thanh toán</h3>
        ${hasBank ? `<img class="qr" src="${qr}" alt="QR chuyển khoản"><div class="pay" style="margin-top:14px">
          <div class="r"><span>Ngân hàng</span><b>${esc(b.bankCode)}</b></div><div class="r"><span>Số tài khoản</span><b>${esc(b.accountNo)}</b></div>
          ${b.accountName ? `<div class="r"><span>Chủ TK</span><b>${esc(b.accountName)}</b></div>` : ""}
          <div class="r"><span>Số tiền</span><b>${vnd(price)}</b></div><div class="r"><span>Nội dung</span><b>${esc(x.code)}</b></div></div>`
        : `<div class="note">Nhắn admin qua Zalo <b>${esc(S.contact.zaloPhone)}</b> để nhận thông tin chuyển khoản. Nội dung CK: <b>${esc(x.code)}</b>.</div>`}
      </div>
    </div>`;
  };

  // Bảng giá gốc vs giá bán (dành cho chủ shop): #/bang-gia
  views["bang-gia"] = () => {
    const rows = [
      ...ITEM_GROUPS.flatMap((g) => g.items.map((i) => ["Vật phẩm • " + g.name, i.name, i.base])),
      ...BOOST.groups.flatMap((g) => g.items.map((i) => ["Cày thuê • " + g.name, i.name, i.base])),
    ];
    return `<div class="ph"><h1>Bảng giá (nội bộ)</h1><p>Giá gốc teanstore + ${vnd(MK)} = giá bán. Sửa giá gốc trong <code>js/data.js</code>. Trang này không có link công khai.</p></div>
      <div class="tw"><table><thead><tr><th>Nhóm</th><th>Sản phẩm</th><th class="n">Giá gốc</th><th class="n">+ Lãi</th><th class="n">Giá bán</th></tr></thead><tbody>
      ${rows.map((r) => `<tr><td class="muted">${esc(r[0])}</td><td>${esc(r[1])}</td><td class="n">${vnd(r[2])}</td><td class="n">${vnd(MK)}</td><td class="n"><b style="color:var(--ac)">${vnd(sell(r[2]))}</b></td></tr>`).join("")}</tbody></table></div>`;
  };

  /* ---------- router ---------- */
  function route() {
    const parts = (location.hash.replace(/^#\/?/, "") || "").split("/").filter(Boolean);
    const name = parts[0] || "home", params = parts.slice(1);
    const v = views[name] || views.home;
    app.innerHTML = v(params);
    if (v.after) v.after(params);
    countUp();
    document.querySelectorAll(".links a").forEach((a) => a.classList.toggle("on", a.dataset.r === (views[name] ? name : "home") || (name === "thanh-toan" && a.dataset.r === "don-hang")));
    $("#links").classList.remove("open");
    window.scrollTo(0, 0);
  }

  document.addEventListener("click", (e) => {
    const cp = e.target.closest("[data-copy]");
    if (cp) { const t = cp.dataset.copy; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast("Đã sao chép"), () => toast("Không sao chép được, hãy tự chép: " + t)); return; }
    const pt = e.target.closest("[data-pwtoggle]");
    if (pt) { const i = pt.parentElement.querySelector("input"); i.type = i.type === "password" ? "text" : "password"; return; }
    const add = e.target.closest("[data-add]");
    if (add) {
      flyToCart(add);
      const [type, gid, id] = add.dataset.add.split("|");
      if (type === "item") { const g = ITEM_GROUPS.find((x) => x.id === gid), i = g.items.find((x) => x.id === id); addToCart({ key: type+"|"+gid+"|"+i.id, group:gid, type, id: i.id, name: i.name, cat: g.name, unit: sell(i.base) }); }
      else if (type === "boost") { const g = BOOST.groups.find((x) => x.id === gid), i = g.items.find((x) => x.id === id); addToCart({ key: type+"|"+gid+"|"+i.id, group:gid, type, id: i.id, name: i.name, cat: "Cày thuê • " + g.name, unit: sell(i.base) }); }
      return;
    }
    const stepBtn = e.target.closest(".btn-day-step");
    if (stepBtn) {
      const card = stepBtn.closest(".custom-service-card");
      if (card) {
        const inp = card.querySelector(".days-input");
        const rate = Number(card.dataset.rate) || 25000;
        const step = Number(stepBtn.dataset.step) || 1;
        let val = Math.max(1, (Number(inp.value) || 1) + step);
        inp.value = val;
        const totalEl = card.querySelector(".custom-total");
        if (totalEl) totalEl.textContent = vnd(val * rate);
      }
      return;
    }
    const addCustom = e.target.closest("[data-add-custom]");
    if (addCustom) {
      flyToCart(addCustom);
      const [gid, id] = addCustom.dataset.addCustom.split("|");
      const g = BOOST.groups.find((x) => x.id === gid);
      const i = g ? g.items.find((x) => x.id === id) : null;
      const card = addCustom.closest(".custom-service-card");
      const inp = card ? card.querySelector(".days-input") : null;
      const days = Math.max(1, Number(inp ? inp.value : 1) || 1);
      const rate = i?.ratePerDay || 25000;
      addToCart({
        key: `boost|${gid}|${id}-${days}d`,
        group: gid,
        type: "boost",
        id: `${id}-${days}d`,
        name: `${i?.name || "Cày thuê Steal An Egg"} (${days} ngày)`,
        cat: `Cày thuê • ${g?.name || "Dịch vụ khác"}`,
        unit: days * rate,
        qty: 1
      });
      return;
    }
    const q = e.target.closest("[data-q]");
    if (q) { const raw = q.dataset.q, sep = raw.lastIndexOf("|"), k = raw.slice(0, sep), d = Number(raw.slice(sep + 1)); let c = getCart(); const l = c.find((x) => x.key === k); if (l) { l.qty += +d; if (l.qty < 1) c = c.filter((x) => x !== l); setCart(c); route(); } return; }
    const rm = e.target.closest("[data-rm]");
    if (rm) { setCart(getCart().filter((x) => x.key !== rm.dataset.rm)); route(); }
  });

  document.addEventListener("input", (e) => {
    if (e.target && e.target.classList && e.target.classList.contains("days-input")) {
      const card = e.target.closest(".custom-service-card");
      if (card) {
        const rate = Number(card.dataset.rate) || 25000;
        let val = Math.max(1, Number(e.target.value) || 1);
        const totalEl = card.querySelector(".custom-total");
        if (totalEl) totalEl.textContent = vnd(val * rate);
      }
    }
  });

  /* ---------- hiệu ứng ---------- */
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function countUp() {
    document.querySelectorAll("[data-count]").forEach((el) => {
      const to = +el.dataset.count; if (reduce) { el.textContent = to + "+"; return; }
      const t0 = performance.now(), dur = 900;
      (function step(t) { const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))) + (k === 1 ? "+" : ""); if (k < 1) requestAnimationFrame(step); })(t0);
    });
  }

  function flyToCart(btn) {
    const cart = $(".cart-btn"); if (!cart || reduce || !btn.animate) return bump();
    const a = btn.getBoundingClientRect(), b = cart.getBoundingClientRect();
    const dot = document.createElement("div"); dot.className = "fly"; document.body.appendChild(dot);
    const x0 = a.left + a.width / 2 - 9, y0 = a.top + a.height / 2 - 9, x1 = b.left + b.width / 2 - 9, y1 = b.top + b.height / 2 - 9;
    dot.animate([{ transform: `translate(${x0}px,${y0}px) scale(1)`, opacity: 1 }, { transform: `translate(${(x0 + x1) / 2}px,${Math.min(y0, y1) - 60}px) scale(1.2)`, opacity: 1, offset: .5 }, { transform: `translate(${x1}px,${y1}px) scale(.3)`, opacity: .2 }], { duration: 650, easing: "cubic-bezier(.4,.1,.3,1)" }).onfinish = () => { dot.remove(); bump(); };
  }
  function bump() { const b = $("#cartCount"); b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); }

  // spotlight + nghiêng thẻ theo chuột
  if (!reduce && matchMedia("(hover:hover)").matches) {
    document.addEventListener("mousemove", (e) => {
      const c = e.target.closest && e.target.closest(".card");
      if (!c) return;
      const r = c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      c.style.setProperty("--mx", x + "px"); c.style.setProperty("--my", y + "px");
      if (c.classList.contains("prod") || c.classList.contains("cat")) {
        c.style.transform = `perspective(700px) rotateX(${((y / r.height) - .5) * -6}deg) rotateY(${((x / r.width) - .5) * 6}deg) translateY(-3px)`;
      }
    });
    document.addEventListener("mouseout", (e) => { const c = e.target.closest && e.target.closest(".card"); if (c && !c.contains(e.relatedTarget)) c.style.transform = ""; });
  }

  // hạt sáng bay nền
  (function particles() {
    if (reduce) return;
    const cv = document.createElement("canvas"); cv.id = "fx"; document.body.prepend(cv);
    const cx = cv.getContext("2d"); let W, H, P = [];
    const cols = ["34,225,255", "99,102,241", "168,85,247"];
    function size() { W = cv.width = innerWidth; H = cv.height = innerHeight; P = Array.from({ length: Math.min(50, Math.round(W / 28)) }, () => mk(true)); }
    function mk(r) { return { x: Math.random() * W, y: r ? Math.random() * H : H + 10, s: Math.random() * 2.2 + .6, v: Math.random() * .35 + .12, d: Math.random() * 2 - 1, c: cols[(Math.random() * 3) | 0], a: Math.random() * .5 + .25 }; }
    function tick() {
      if (document.hidden) return requestAnimationFrame(tick);
      cx.clearRect(0, 0, W, H);
      for (const p of P) {
        p.y -= p.v; p.x += Math.sin((p.y + p.d * 90) / 55) * .25;
        if (p.y < -10) Object.assign(p, mk(false));
        cx.beginPath(); cx.fillStyle = `rgba(${p.c},${p.a})`; cx.shadowColor = `rgba(${p.c},.9)`; cx.shadowBlur = 10; cx.arc(p.x, p.y, p.s, 0, 6.283); cx.fill();
      }
      requestAnimationFrame(tick);
    }
    addEventListener("resize", size); size(); tick();
  })();

  window.addEventListener("scroll", () => document.querySelector(".nav").classList.toggle("scrolled", scrollY > 8), { passive: true });

  $("#burger").addEventListener("click", () => $("#links").classList.toggle("open"));
  window.addEventListener("hashchange", route);

  /* init */
  document.title = S.name + " - Shop Blox Fruits uy tín";
  $("#footTag").textContent = S.tagline;
  $("#fZalo").href = S.contact.zalo; $("#fFb").href = S.contact.facebook; $("#yr").textContent = new Date().getFullYear();
  updateBadge(); refreshAccData().finally(route);
})();
