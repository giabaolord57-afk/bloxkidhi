/* =====================================================================
   FX-EXTRA — CYBER VISUAL EFFECTS & MICRO-INTERACTIONS
   Chỉ bổ sung hiệu ứng thị giác, chuyển động mượt mà và tương tác giao diện.
   KHÔNG can thiệp dữ liệu, Supabase hay bất kỳ logic nghiệp vụ nào.
   ===================================================================== */
(function () {
  "use strict";

  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hover = window.matchMedia && matchMedia("(hover:hover)").matches;

  /* ---------- 1) CON TRỎ PHÁT SÁNG NĂNG LƯỢNG (PLASMA CURSOR GLOW) ---------- */
  if (!reduce && hover) {
    const dot = document.createElement("div");
    dot.id = "cursor-glow";
    document.body.appendChild(dot);

    let mouseX = innerWidth / 2, mouseY = innerHeight / 2;
    let curX = mouseX, curY = mouseY;
    let isVisible = false;

    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isVisible) {
        isVisible = true;
        dot.classList.add("show");
      }
    }, { passive: true });

    document.addEventListener("mouseleave", () => {
      isVisible = false;
      dot.classList.remove("show");
    });

    (function renderCursor() {
      // Dùng lerp mượt mà
      curX += (mouseX - curX) * 0.16;
      curY += (mouseY - curY) * 0.16;
      dot.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;
      requestAnimationFrame(renderCursor);
    })();

    // Tự động mở rộng hào quang khi rê vào nút, liên kết hoặc thẻ
    document.addEventListener("mouseover", (e) => {
      const isInteractive = !!(e.target.closest && e.target.closest("a, button, .card, .tab, input, select, .cart-btn"));
      dot.classList.toggle("big", isInteractive);
    });
  }

  /* ---------- 2) TIA LỬA ĐIỆN TỬ (CYBER SPARK BURST) KHI BẤM NÚT ---------- */
  document.addEventListener("pointerdown", (e) => {
    if (reduce) return;
    const btn = e.target.closest && e.target.closest(".btn, .tab, .cart-btn, [data-add], [data-copy]");
    if (!btn) return;

    // Gợn sóng (Ripple)
    const r = btn.getBoundingClientRect();
    const rip = document.createElement("span");
    rip.className = "ripple";
    const size = Math.max(r.width, r.height) * 1.5;
    rip.style.width = rip.style.height = size + "px";
    rip.style.left = (e.clientX - r.left - size / 2) + "px";
    rip.style.top = (e.clientY - r.top - size / 2) + "px";
    btn.appendChild(rip);
    rip.addEventListener("animationend", () => rip.remove());

    // Tạo chùm hạt điện tử phát sáng bay toả tròn
    const sparkCount = 8;
    for (let i = 0; i < sparkCount; i++) {
      const spark = document.createElement("span");
      spark.className = "cyber-spark";
      const angle = (Math.PI * 2 / sparkCount) * i + (Math.random() * 0.4 - 0.2);
      const dist = Math.random() * 35 + 20;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;

      spark.style.cssText = `
        position: fixed;
        left: ${e.clientX}px;
        top: ${e.clientY}px;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: ${i % 2 === 0 ? "var(--ac)" : "var(--pu)"};
        box-shadow: 0 0 8px ${i % 2 === 0 ? "var(--ac)" : "var(--pu)"};
        pointer-events: none;
        z-index: 99999;
        transform: translate(-50%, -50%) scale(1);
        transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.45s ease;
      `;
      document.body.appendChild(spark);

      requestAnimationFrame(() => {
        spark.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0)`;
        spark.style.opacity = "0";
      });

      setTimeout(() => spark.remove(), 480);
    }
  });

  /* ---------- 3) HIỆN DẦN KHI CUỘN (SCROLL REVEAL BẬC THANG) ---------- */
  let observer;
  // Lưới an toàn cho iPhone/Safari: nếu IntersectionObserver không báo kịp thì tự kiểm tra
  // theo vị trí cuộn, để nội dung KHÔNG BAO GIỜ bị kẹt ở trạng thái ẩn (trống trơn).
  function revealVisible() {
    document.querySelectorAll(".reveal:not(.in-view)").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight + 80 && r.bottom > -80) {
        el.classList.add("in-view");
        if (observer) observer.unobserve(el);
      }
    });
  }
  if (!reduce) {
    ["scroll", "touchmove", "resize", "orientationchange"].forEach((ev) =>
      window.addEventListener(ev, revealVisible, { passive: true }));
    setInterval(revealVisible, 600);
  }
  function initReveal(root) {
    if (reduce) return;
    if (!("IntersectionObserver" in window)) return; // không hỗ trợ -> luôn hiện sẵn
    const elements = root.querySelectorAll(".card, .steps > div, .odds, .buycode, .buysteps > div, .order-progress, .tw");
    if (!observer) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in-view");
            observer.unobserve(en.target);
          }
        });
      }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    }

    elements.forEach((el, index) => {
      if (el.classList.contains("in-view") || el.dataset.noReveal) return;
      el.classList.add("reveal");
      // Hiệu ứng xuất hiện so le nhẹ nhàng
      el.style.transitionDelay = `${(index % 4) * 0.05}s`;
      observer.observe(el);
    });
    setTimeout(revealVisible, 120);
  }

  // Tự động kích hoạt lại khi chuyển View / Route trong #app
  const appContainer = document.getElementById("app");
  if (appContainer) {
    new MutationObserver(() => initReveal(appContainer)).observe(appContainer, { childList: true, subtree: false });
    initReveal(appContainer);
  }

  /* ---------- 4) THANH TIẾN TRÌNH KHI CHUYỂN TRANG (ROUTE BAR) ---------- */
  const routeBar = document.createElement("div");
  routeBar.id = "route-bar";
  document.body.appendChild(routeBar);

  window.addEventListener("hashchange", () => {
    if (reduce) return;
    routeBar.classList.remove("go");
    void routeBar.offsetWidth; // Force reflow
    routeBar.classList.add("go");
  });

  /* ---------- 5) NÚT CUỘN LÊN ĐẦU TRANG (BACK TO TOP) PHÁT SÁNG ---------- */
  const topBtn = document.createElement("button");
  topBtn.id = "back-to-top";
  topBtn.setAttribute("aria-label", "Cuộn lên đầu trang");
  topBtn.innerHTML = "▲";
  topBtn.style.cssText = `
    position: fixed;
    right: 24px;
    bottom: 24px;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: rgba(16, 23, 38, 0.85);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(0, 240, 255, 0.3);
    color: var(--ac);
    font-size: 1.1rem;
    cursor: pointer;
    z-index: 99;
    display: grid;
    place-items: center;
    opacity: 0;
    pointer-events: none;
    transform: translateY(16px);
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  `;
  document.body.appendChild(topBtn);

  topBtn.addEventListener("mouseenter", () => {
    topBtn.style.borderColor = "var(--ac)";
    topBtn.style.boxShadow = "0 0 25px var(--glow)";
    topBtn.style.transform = "translateY(-3px) scale(1.08)";
  });
  topBtn.addEventListener("mouseleave", () => {
    topBtn.style.borderColor = "rgba(0, 240, 255, 0.3)";
    topBtn.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.5)";
    topBtn.style.transform = "translateY(0) scale(1)";
  });
  topBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("scroll", () => {
    const show = window.scrollY > 350;
    topBtn.style.opacity = show ? "1" : "0";
    topBtn.style.pointerEvents = show ? "auto" : "none";
    topBtn.style.transform = show ? "translateY(0)" : "translateY(16px)";
  }, { passive: true });

  /* ---------- 6) TỰ ĐỘNG ĐÓNG MENU MOBILE KHI BẤM RA NGOÀI ---------- */
  const burger = document.getElementById("burger");
  const links = document.getElementById("links");

  if (burger && links) {
    document.addEventListener("click", (e) => {
      if (!burger.contains(e.target) && !links.contains(e.target) && links.classList.contains("open")) {
        links.classList.remove("open");
      }
    });

    links.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        links.classList.remove("open");
      });
    });
  }

  /* ---------- 7) HIỆU ỨNG TỰ ĐỘNG FOCUS KHI TÌM KIẾM ---------- */
  document.addEventListener("keydown", (e) => {
    // Nhấn phím '/' để nhảy nhanh vào ô tìm kiếm nếu không ở trong input khác
    if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
      const q = document.getElementById("q");
      if (q) {
        e.preventDefault();
        q.focus();
        q.select();
      }
    }
  });

})();
