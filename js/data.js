/* =====================================================================
   DỮ LIỆU SHOP  —  CHỈ CẦN SỬA FILE NÀY
   ---------------------------------------------------------------------
   * "base"  = GIÁ GỐC trên teanstore.com (VNĐ).
   * Giá bán  = base + MARKUP (20.000đ) — web tự cộng, không cần tính tay.
   * ⚠️ Giá base bên dưới là GIÁ ĐIỀN TẠM (teanstore yêu cầu đăng nhập nên
     không đọc được). Hãy thay bằng giá thật trên teanstore rồi lưu lại.
   ===================================================================== */

window.SHOP = {
  name: "BDShopVN",
  tagline: "Shop Blox Fruits uy tín • Giao nhanh • Bảo hành",
  markup: 20000, // cộng thêm so với teanstore

  // Liên hệ (lấy từ myweb cũ — sửa lại thành của bạn)
  contact: {
    zalo: "http://zalo.me/0984840729",
    zaloPhone: "0984840729",
    facebook: "https://www.facebook.com/share/1coXuAtiMJ/?mibextid=wwXIfr",
    email: "",
  },

  // Thanh toán chuyển khoản — điền thông tin thật để hiện mã QR VietQR
  bank: {
    bankCode: "TPB",        // vd: "MB", "VCB", "TCB"
    accountNo: "82417112005",       // số tài khoản
    accountName: "DOAN NGOC NHU QUYNH",     // tên chủ tài khoản
   qrImage: "img/qr-chuyen-khoan.png",
  },
};

/* ---------- 0) ROBUX (mục riêng, không nằm trong Vật phẩm) ---------- */
window.ROBUX_GROUPS = [
  {
    id: "robux-120h",
    name: "Robux 120H",
    icon: "",
    iconImg: "img/robux.png",
    desc: "Robux giao sau 120 giờ — an toàn, không cần mật khẩu. Cần Roblox username.",
    needs: "username",
    items: [
      { id: "rb-400",   name: "400 Robux",   img: "img/robux.png", base: 80000 },
      { id: "rb-800",   name: "800 Robux",   img: "img/robux.png", base: 155000 },
      { id: "rb-1700",  name: "1.700 Robux", img: "img/robux.png", base: 320000 },
      { id: "rb-4500",  name: "4.500 Robux", img: "img/robux.png", base: 810000 },
      { id: "rb-10000", name: "10.000 Robux", img: "img/robux.png", base: 1750000 },
    ],
  },
];

/* ---------- 1) VẬT PHẨM BLOX FRUITS ---------- */
window.ITEM_GROUPS = [
  {
    id: "trai-vinh-vien",
    name: "Trái Ác Quỷ Vĩnh Viễn",
    icon: "🍎",
    desc: "Trái ác quỷ vĩnh viễn (Permanent) gắn vào acc của bạn. Giao qua trade/gift trong game.",
    needs: "username",
    items: [
      { id: "pf-1", name: "Rocket", img: "img/fruits/perm-rocket.webp", base: 10000 },
      { id: "pf-2", name: "Spin", img: "img/fruits/perm-spin.webp", base: 12000 },
      { id: "pf-3", name: "Blade", img: "img/fruits/perm-blade.webp", base: 17000 },
      { id: "pf-4", name: "Spring", img: "img/fruits/perm-spring.webp", base: 30000 },
      { id: "pf-5", name: "Bomb", img: "img/fruits/perm-bomb.webp", base: 37000 },
      { id: "pf-6", name: "Smoke", img: "img/fruits/perm-smoke.webp", base: 42000 },
      { id: "pf-7", name: "Flame - Lửa", img: "img/fruits/perm-flame.webp", base: 95000 },
      { id: "pf-8", name: "Ice - Băng", img: "img/fruits/perm-ice.webp", base: 130000 },
      { id: "pf-9", name: "Sand - Cát", img: "img/fruits/perm-sand.webp", base: 145000 },
      { id: "pf-10", name: "Eagle - Chim Ưng", img: "img/fruits/perm-eagle.webp", base: 160000 },
      { id: "pf-11", name: "Dark - Bóng Tối", img: "img/fruits/perm-dark.webp", base: 160000 },
      { id: "pf-12", name: "Diamond - Kim Cương", img: "img/fruits/perm-diamond.webp", base: 175000 },
      { id: "pf-13", name: "Rubber - Cao Su", img: "img/fruits/perm-rubber.webp", base: 190000 },
      { id: "pf-14", name: "Light - Ánh Sáng", img: "img/fruits/perm-light.webp", base: 195000 },
      { id: "pf-15", name: "Ghost - Bóng Ma", img: "img/fruits/perm-ghost.webp", base: 220000 },
      { id: "pf-16", name: "Magma - Dung Nham", img: "img/fruits/perm-magma.webp", base: 230000 },
      { id: "pf-17", name: "Quake - Chấn Động", img: "img/fruits/perm-quake.webp", base: 270000 },
      { id: "pf-18", name: "Creation - Sáng Tạo", img: "img/fruits/perm-creation.webp", base: 295000 },
      { id: "pf-19", name: "Buddha - Phật Tổ", img: "img/fruits/perm-buddha.webp", base: 300000 },
      { id: "pf-20", name: "Love", img: "img/fruits/perm-love.webp", base: 305000 },
      { id: "pf-21", name: "Spider", img: "img/fruits/perm-spider.webp", base: 330000 },
      { id: "pf-22", name: "Sound - Âm Thanh", img: "img/fruits/perm-sound.webp", base: 345000 },
      { id: "pf-23", name: "Lightning - Trái Lôi", img: "img/fruits/perm-lightning.webp", base: 350000 },
      { id: "pf-24", name: "Portal - Cổng Dịch Chuyển", img: "img/fruits/perm-portal.webp", base: 360000 },
      { id: "pf-25", name: "Phoenix", img: "img/fruits/perm-phoenix.webp", base: 360000 },
      { id: "pf-26", name: "Pain", img: "img/fruits/perm-pain.webp", base: 390000 },
      { id: "pf-27", name: "Blizzard", img: "img/fruits/perm-blizzard.webp", base: 400000 },
      { id: "pf-28", name: "Gravity - Trọng Lực", img: "img/fruits/perm-gravity.webp", base: 420000 },
      { id: "pf-29", name: "Venom - Độc", img: "img/fruits/perm-venom.webp", base: 430000 },
      { id: "pf-30", name: "Shadow", img: "img/fruits/perm-shadow.webp", base: 430000 },
      { id: "pf-31", name: "Dough (Mochi - Bột)", img: "img/fruits/perm-dough.webp", base: 430000 },
      { id: "pf-32", name: "T-Rex - Khủng Long", img: "img/fruits/perm-trex.webp", base: 430000 },
      { id: "pf-33", name: "Mammoth - Voi Ma Mút", img: "img/fruits/perm-mamoth.webp", base: 430000 },
      { id: "pf-34", name: "Gas", img: "img/fruits/perm-gas.webp", base: 455000 },
      { id: "pf-35", name: "Spirit - Linh Hồn", img: "img/fruits/perm-spirit.webp", base: 465000 },
      { id: "pf-36", name: "Yeti", img: "img/fruits/perm-yeti.webp", base: 530000 },
      { id: "pf-37", name: "Tiger - Hổ (Báo Đốm cũ)", img: "img/fruits/perm-tiger.webp", base: 540000 },
      { id: "pf-38", name: "Control - Điều Khiển", img: "img/fruits/perm-control.webp", base: 680000 },
      { id: "pf-39", name: "Kitsune", img: "img/fruits/perm-kitsune.webp", base: 735000, tag: "HOT" },
      { id: "pf-40", name: "Dragon - Rồng", img: "img/fruits/perm-dragon.webp", base: 900000, tag: "HOT" },
    ],
  },
  {
    id: "trai-ruong",
    name: "Trái Ác Quỷ Rương",
    icon: "🎁",
    desc: "Các trái ác quỷ trong rương, giao vào acc Roblox của bạn qua trade/gift trong game.",
    needs: "username",
    items: [
      { id: "ch-1", name: "Divine Portal", img: "img/fruits/divine-portal.webp", base: 170000 },
      { id: "ch-2", name: "Ruby Diamond", img: "img/fruits/ruby-diamond.webp", base: 40000 },
      { id: "ch-3", name: "Topaz Diamond", img: "img/fruits/topaz-diamond.webp", base: 40000 },
      { id: "ch-4", name: "Rose Quartz Diamond", img: "img/fruits/rose-quartz-diamond.webp", base: 70000 },
      { id: "ch-5", name: "Emerald Diamond", img: "img/fruits/emerald-diamond.webp", base: 70000 },
      { id: "ch-6", name: "Super Spirit Pain", img: "img/fruits/super-spirit-pain.webp", base: 300000 },
      { id: "ch-7", name: "Celestial Pain", img: "img/fruits/celestial-pain.webp", base: 150000 },
      { id: "ch-8", name: "Frustration Pain", img: "img/fruits/frustration-pain.webp", base: 120000 },
      { id: "ch-9", name: "Sadness Pain", img: "img/fruits/sadness-pain.webp", base: 130000 },
      { id: "ch-10", name: "Torment Pain", img: "img/fruits/torment-pain.webp", base: 40000 },
      { id: "ch-11", name: "Thermite Bomb", img: "img/fruits/thermite-bomb.webp", base: 65000 },
      { id: "ch-12", name: "Azura Bomb", img: "img/fruits/azura-bomb.webp", base: 65000 },
      { id: "ch-13", name: "Nuclear Bomb", img: "img/fruits/nuclear-bomb.webp", base: 65000 },
      { id: "ch-14", name: "Celebration Bomb", img: "img/fruits/celebration-bomb.webp", base: 20000 },
      { id: "ch-15", name: "Galaxy Empyrean Kitsune", img: "img/fruits/galaxy-empyrean-kitsune.webp", base: 1100000 },
      { id: "ch-16", name: "Empyrean Kitsune", img: "img/fruits/empyrean-kitsune.webp", base: 800000 },
      { id: "ch-17", name: "West Dragon", img: "img/fruits/west-dragon.webp", base: 450000 },
      { id: "ch-18", name: "East Dragon", img: "img/fruits/east-dragon.webp", base: 400000 },
      { id: "ch-19", name: "Ember Dragon", img: "img/fruits/ember-dragon.webp", base: 700000 },
      { id: "ch-20", name: "Purple Lightning", img: "img/fruits/purple-lightning.webp", base: 550000 },
      { id: "ch-21", name: "Yellow Lightning", img: "img/fruits/yellow-lightning.webp", base: 190000 },
      { id: "ch-22", name: "Red Lightning", img: "img/fruits/red-lightning.webp", base: 280000 },
      { id: "ch-23", name: "Green Lightning", img: "img/fruits/green-lightning.webp", base: 60000 },
      { id: "ch-24", name: "Fiend Yeti", img: "img/fruits/fiend-yeti.webp", base: 100000 },
      { id: "ch-25", name: "Werewolf", img: "img/fruits/werewolf.webp", base: 110000 },
      { id: "ch-26", name: "Lightning", img: "img/fruits/lightning.webp", base: 20000 },
      { id: "ch-27", name: "Shadow", img: "img/fruits/shadow.webp", base: 12000 },
      { id: "ch-28", name: "Pain", img: "img/fruits/pain.webp", base: 12000 },
      { id: "ch-29", name: "Buddha", img: "img/fruits/buddha.webp", base: 12000 },
      { id: "ch-30", name: "Portal", img: "img/fruits/portal.webp", base: 12000 },
      { id: "ch-31", name: "T-Rex", img: "img/fruits/t-rex.webp", base: 17000 },
      { id: "ch-32", name: "Mammoth", img: "img/fruits/mammoth.webp", base: 10000 },
      { id: "ch-33", name: "Spirit", img: "img/fruits/spirit.webp", base: 20000 },
      { id: "ch-34", name: "Gravity", img: "img/fruits/gravity.webp", base: 12000 },
      { id: "ch-35", name: "Venom", img: "img/fruits/venom.webp", base: 16999.5 },
      { id: "ch-36", name: "Dough", img: "img/fruits/dough.webp", base: 17000 },
      { id: "ch-37", name: "Gas", img: "img/fruits/gas.webp", base: 17000 },
      { id: "ch-38", name: "Tiger", img: "img/fruits/tiger.webp", base: 23000 },
      { id: "ch-39", name: "Yeti", img: "img/fruits/yeti.webp", base: 23000 },
      { id: "ch-40", name: "Control", img: "img/fruits/control.webp", base: 30000 },
      { id: "ch-41", name: "Kitsune", img: "img/fruits/kitsune.webp", base: 75000 },
    ],
  },
  {
    id: "gamepass",
    name: "Gamepass Blox Fruits",
    icon: "🎫",
    desc: "Gamepass chính chủ tặng thẳng vào tài khoản Roblox của bạn.",
    needs: "username",
    items: [
      { id: "gp-2xmoney",   name: "2x Money", img: "img/gamepass/x2-money.png",          base: 120000 },
      { id: "gp-2xmastery", name: "2x Mastery", img: "img/gamepass/x2-mastery.png",        base: 120000 },
      { id: "gp-2xboss",    name: "2x Boss Drops", img: "img/gamepass/x2-boss-drops-chance.png",     base: 120000 },
      { id: "gp-fastboat",  name: "Fast Boats", img: "img/gamepass/fast-boat.png",        base: 105000 },
      { id: "gp-darkblade", name: "Dark Blade", img: "img/gamepass/dark-blade.png",        base: 190000 },
      { id: "gp-notifier",  name: "Fruit Notifier", img: "img/gamepass/fruits-notifer.png",    base: 65000 },
      { id: "gp-storage",   name: "+1 Fruit Storage", img: "img/gamepass/1-fruit-storage.png",  base: 90000 },
    ],
  },
];

/* ---------- 2) CÀY THUÊ BLOX FRUITS ---------- */
window.BOOST = {
  desc: "Cày thuê thủ công bởi đội ngũ booster, bảo mật acc. Cần user + mật khẩu (hoặc cookie) để cày. Đổi mật khẩu ngay khi hoàn thành.",
  groups: [
    {
      id: "level", name: "Cày Level", icon: "⚔️",
      items: [
        { id: "ct-1", name: "1500 Level", base: 20000 },
        { id: "ct-2", name: "2800 Level ( MAX )", base: 40000 },
      ],
    },
    {
      id: "nhiemvu", name: "Nhiệm Vụ Trái", icon: "🍎",
      items: [
        { id: "ct-3", name: "Full Nhiệm Vụ Pain ( Bao trái )", base: 55000 },
        { id: "ct-4", name: "Full Nhiệm Vụ Control ( Bao trái )", base: 60000 },
        { id: "ct-5", name: "Full Nhiệm Vụ Lighting ( Bao trái )", base: 60000 },
        { id: "ct-6", name: "Full Nhiệm Vụ Gravity ( Bao trái )", base: 50000 },
        { id: "ct-7", name: "Full Nhiệm Vụ Angle ( Bao trái )", base: 50000 },
        { id: "ct-8", name: "Awaken Full Phoenix", base: 40000 },
        { id: "ct-9", name: "Awaken Full Dough", base: 40000 },
        { id: "ct-10", name: "Awaken Full Chiêu DF Dưới 1M", base: 20000 },
        { id: "ct-11", name: "Full Mastery Gun,DF ( tự chọn )", base: 30000 },
        { id: "ct-12", name: "Full Mastery Sword, Melee ( tự chọn )", base: 25000 },
      ],
    },
    {
      id: "toc", name: "Tộc & Haki", icon: "🧬",
      items: [
        { id: "ct-13", name: "Lấy Haki Draco", base: 30000 },
        { id: "ct-14", name: "Haki Observation V2", base: 25000 },
        { id: "ct-15", name: "Haki 7 màu", base: 20000 },
        { id: "ct-16", name: "Lấy Tộc Draco", base: 20000 },
        { id: "ct-17", name: "Lấy Tộc Cyborg", base: 20000 },
        { id: "ct-18", name: "Lấy Tộc Quỷ", base: 20000 },
        { id: "ct-19", name: "Up Tộc v1-v3", base: 20000 },
        { id: "ct-20", name: "Draco v1-v3", base: 30000 },
        { id: "ct-21", name: "Gạt cần cổng V4", base: 20000 },
        { id: "ct-22", name: "Full Gear V4 Tự Chọn ( bao tất cả mọi thứ )", base: 50000 },
        { id: "ct-23", name: "Combo Full Dragon : Lấy Tộc Dra v4, Lấy Heart + Storm 500 Mastery, Kéo Tim ( yêu cầu có đủ 8 đại và hoàn thành 20 lần hành trình biển )", base: 150000 },
      ],
    },
    {
      id: "vo", name: "Võ & Kiếm", icon: "🗡️",
      items: [
        { id: "ct-24", name: "Lấy GodHuman ( Bao tất cả mọi thứ )", base: 30000 },
        { id: "ct-25", name: "Lấy Dragon Talon", base: 20000 },
        { id: "ct-26", name: "Electric Claw v2", base: 20000 },
        { id: "ct-27", name: "Lấy Sanguine Art", base: 40000 },
        { id: "ct-28", name: "Up Yoru v1-v3 ( bao tất cả mọi thứ )", base: 110000 },
        { id: "ct-29", name: "Yoru v3 ( yêu cầu có 4 tộc cơ bản v3 + yoru v2 )", base: 100000 },
        { id: "ct-30", name: "Yoru v2", base: 40000 },
        { id: "ct-31", name: "Lấy Yama", base: 20000 },
        { id: "ct-32", name: "Lấy Tushita", base: 20000 },
        { id: "ct-33", name: "Lấy CDK - Song Kiếm", base: 35000 },
        { id: "ct-34", name: "True Triple Katana | TTK", base: 30000 },
        { id: "ct-35", name: "Dark Dagger | Mini Yoru", base: 60000 },
        { id: "ct-36", name: "Skull Guitar", base: 30000 },
        { id: "ct-37", name: "Lấy 1 Trong Wando-Shishui-Saddi", base: 20000 },
        { id: "ct-38", name: "Dark Coat | Áo Râu Đen", base: 60000 },
      ],
    },
    {
      id: "dragon", name: "Dragon & Phụ Kiện", icon: "🐉",
      items: [
        { id: "ct-39", name: "Lấy 8 Đại ( yêu cầu dragon talon )", base: 35000 },
        { id: "ct-40", name: "Dragon Storm ( yêu cầu 8 đại )", base: 40000 },
        { id: "ct-41", name: "Dragon Heart ( yêu cầu 8 đại )", base: 40000 },
        { id: "ct-42", name: "Lấy Mặt Nạ Kitsune", base: 25000 },
        { id: "ct-43", name: "Lấy Kitsune Ribbon", base: 25000 },
        { id: "ct-44", name: "Fox Lamp", base: 20000 },
        { id: "ct-45", name: "Shark Anchor", base: 20000 },
        { id: "ct-46", name: "Lấy mảnh gương", base: 20000 },
        { id: "ct-47", name: "Đánh rip_indra", base: 20000 },
      ],
    },
    {
      id: "bien", name: "Leviathan & Sự Kiện", icon: "🌊",
      items: [
        { id: "ct-48", name: "Lấy 30 Vảy Leviathan", base: 80000 },
        { id: "ct-49", name: "Lấy 15 Vảy Leviathan", base: 40000 },
        { id: "ct-50", name: "Lấy khiên leviathan", base: 60000 },
        { id: "ct-51", name: "Kéo Tim Leviathan Về Hydra/Tiki", base: 35000 },
        { id: "ct-52", name: "Hoàn thành 20 lần sự kiện biển", base: 25000 },
        { id: "ct-53", name: "Đánh Tyrant of the skies", base: 15000 },
        { id: "ct-54", name: "2 Nguyên Thạch Bóng Tối", base: 30000 },
      ],
    },
    {
      id: "nhan", name: "Random Nhẫn", icon: "💍",
      items: [
        { id: "ct-55", name: "Random Nhẫn Cấp 3", base: 90000 },
        { id: "ct-56", name: "Random Nhẫn Cấp 4", base: 250000 },
      ],
    },
    {
      id: "tien", name: "Bounty, Belli & Fragment", icon: "💰",
      items: [
        { id: "ct-57", name: "1M Bounty", base: 30000 },
        { id: "ct-58", name: "5M Bounty", base: 100000 },
        { id: "ct-59", name: "10M Bounty", base: 200000 },
        { id: "ct-60", name: "20M Bounty", base: 400000 },
        { id: "ct-61", name: "30M Bounty", base: 600000 },
        { id: "ct-62", name: "10M Belli", base: 10000 },
        { id: "ct-63", name: "20M Belli", base: 20000 },
        { id: "ct-64", name: "50M Belli", base: 50000 },
        { id: "ct-65", name: "100M Belli", base: 100000 },
        { id: "ct-66", name: "10K Fragment", base: 15000 },
        { id: "ct-67", name: "20K Fragment", base: 30000 },
        { id: "ct-68", name: "50K Fragment", base: 75000 },
        { id: "ct-69", name: "100K Fragments", base: 150000 },
      ],
    },
    {
      id: "steal-an-egg",
      name: "Steal An Egg",
      icon: "🥚",
      desc: "Cày thuê Steal An Egg theo ngày: auto làm sự kiện, chạy bộ, cướp trứng, upgrade...",
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
      ],
    },
  ],
};
