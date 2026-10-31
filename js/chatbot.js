/* Support 24/7 — dữ liệu lấy trực tiếp từ js/data.js; không API, không gửi thông tin khách ra ngoài. */
(()=>{'use strict';
const $=id=>document.getElementById(id), fab=$('chatFab'),panel=$('chatWidget'),body=$('cwBody'),quick=$('cwQuick'),input=$('cwInput');
if(!fab||!panel||!window.SHOP)return;
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const fmt=n=>Number(n).toLocaleString('vi-VN')+'đ';
const contact=window.SHOP.contact||{};
const link=(url,label)=>url?'['+label+']('+url+')':label;
const groups=[...(window.ROBUX_GROUPS||[]),...(window.ITEM_GROUPS||[]),...(window.CAY_THUE_GROUPS||[]),...(window.STEAL_AN_EGG_GROUPS||[])];
// Quét tất cả nhóm trong data.js, kể cả các nhóm đặt tên khác.
Object.keys(window).filter(k=>/GROUPS$/.test(k)&&Array.isArray(window[k])).forEach(k=>window[k].forEach(g=>{if(g&&g.items&&!groups.includes(g))groups.push(g)}));
const products=[];function walk(node,category){if(!node||typeof node!=='object')return;if(Array.isArray(node)){node.forEach(x=>walk(x,category));return}const cat=node.name&&Array.isArray(node.items)?node.name:category;if(node.name&&typeof node.base==='number')products.push({name:node.name,base:node.base,category:category||'',id:node.id,raw:node});if(node.items)walk(node.items,cat);if(node.groups)walk(node.groups,cat)}groups.forEach(g=>walk(g,g.name));
const unique=[...new Map(products.map(x=>[x.id||x.name,x])).values()];
let started=false,last=null;
const localOrders=()=>{try{return JSON.parse(localStorage.getItem('orders')||'[]')}catch(_){return []}};
const etaText=o=>o.status==='Hoàn thành'?'Đã hoàn thành':o.status==='Từ chối'?'Không áp dụng':o.estimated_completion_at?new Date(o.estimated_completion_at).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}):'Chưa có dự kiến';
const orderStatus=o=>o.status==='Hoàn thành'?'3/3':o.status==='Đã duyệt'?'1/3':o.status==='Đang xử lý'?'2/3':o.status==='Từ chối'?'Không áp dụng':'0/3';
async function orderReply(question=''){
 const db=window.BX_SUPABASE;
 if(!db)return 'Chưa kết nối được hệ thống đơn hàng. Vui lòng thử lại sau.';
 try{
  const {data:{user},error:authError}=await db.auth.getUser();
  if(authError)throw authError;
  if(user){
   const {data,error}=await db.rpc('get_my_bloxshop_orders');
   if(error)return 'Chưa tải được lịch sử tài khoản. Admin cần chạy SETUP-BOT-LICH-SU-DON.sql trong Supabase. Bạn có thể xem đơn tại mục Tài khoản.';
   const orders=Array.isArray(data)?data:[];
   if(!orders.length)return 'Tài khoản này chưa có đơn được liên kết. Đơn cũ chưa gắn tài khoản vẫn có thể tra cứu bằng mã đơn và mã tra cứu trong mục Đơn hàng.';
   const q=norm(question),code=(q.match(/(?:don|ma)\s*([a-z0-9-]{4,})/)||[])[1];
   const selected=code?orders.filter(o=>norm(o.order_code)===code):orders;
   if(!selected.length)return 'Không tìm thấy mã đơn đó trong lịch sử tài khoản đang đăng nhập. Hãy kiểm tra lại mã đơn.';
   const show=/tat ca|lich su|nhung don|cac don|don nao|con don/.test(q)?selected.slice(0,10):selected.slice(0,5);
   return 'Lịch sử đơn hàng của tài khoản ('+orders.length+' đơn gần nhất):\\n'+show.map(o=>'• '+o.order_code+' — '+o.status+' ('+orderStatus(o)+') — '+fmt(o.price)+'. Dự kiến: '+etaText(o)).join('\n')+(selected.length>show.length?'\nXem thêm tại mục Tài khoản → Lịch sử đơn hàng.':'')+'\nThời gian chỉ là dự kiến và có thể được Admin điều chỉnh.';
  }
  const orders=localOrders();
  if(!orders.length)return 'Bạn chưa đăng nhập. Vào Tài khoản → Đăng nhập để bot xem lịch sử đơn của bạn. Đơn đặt trên thiết bị này vẫn có thể tra cứu tại mục Đơn hàng.';
  const o=orders[0];
  if(!o.token)return 'Vui lòng đăng nhập để xem lịch sử tài khoản, hoặc tra cứu đơn bằng thông tin riêng trong mục Đơn hàng.';
  const {data,error}=await db.rpc('lookup_bloxshop_order',{p_code:o.code,p_token:o.token});
  if(error||!data)return 'Không tra cứu được đơn gần nhất. Hãy vào mục Đơn hàng để thử lại.';
  return 'Đơn '+data.code+' — '+data.status+' ('+orderStatus(data)+'). Dự kiến: '+etaText(data)+'. Đăng nhập để xem toàn bộ lịch sử đơn liên kết tài khoản.';
 }catch(_){return 'Không thể tải lịch sử đơn lúc này. Vui lòng thử lại sau.';}
}
function append(who,message){const row=document.createElement('div');row.className='cw-msg '+who;const avatar=document.createElement('span');avatar.className='cw-msg-av';avatar.textContent=who==='bot'?'🤖':'👤';const bubble=document.createElement('div');bubble.className='cw-bubble';// Chỉ tạo link từ URL cấu hình shop, không thực thi HTML từ tin nhắn.
const parts=String(message).split(/(https?:\/\/[^\s]+)/g);parts.forEach(part=>{if(/^https?:\/\//.test(part)){const a=document.createElement('a');a.href=part;a.target='_blank';a.rel='noopener noreferrer';a.textContent=part;bubble.append(a)}else bubble.append(document.createTextNode(part))});row.append(avatar,bubble);body.append(row);body.scrollTop=body.scrollHeight}
const priceOf=p=>typeof p.raw.price==='number'?p.raw.price:p.base+((p.raw&&p.raw.noMarkup)?0:(window.SHOP.markup||0));
const detail=p=>{last=p;let r=p.name+' — '+p.category+'\nGiá theo dữ liệu shop: '+fmt(priceOf(p))+'.';const d=p.raw.desc||p.raw.note||p.raw.eta||'';if(d)r+='\nThông tin: '+d;const g=groups.find(g=>g.name===p.category);if(g){if(g.desc)r+='\n'+g.desc;if(g.needs==='username')r+='\nKhi đặt cần Roblox username; không gửi mật khẩu cho bot.';}if(p.raw.isCustomDays)r+='\nGói tính theo số ngày; giá chính thức sẽ được tính theo lựa chọn của khách.';return r};
const categories=[...new Set(groups.map(g=>g.name).filter(Boolean))];
const byCategory=q=>{let matches=groups.filter(g=>norm(q).includes(norm(g.name))||norm(g.name).split(' ').filter(x=>x.length>3).every(x=>norm(q).includes(x)));if(/cay thue/.test(q))matches=groups.filter(g=>/cay thue|steal an egg/i.test(g.name));if(/gamepass/.test(q))matches=groups.filter(g=>/gamepass/i.test(g.name));if(/robux/.test(q))matches=groups.filter(g=>/robux/i.test(g.name));if(/trai|vinh vien/.test(q))matches=groups.filter(g=>/trai|vinh vien/i.test(g.name));if(!matches.length)return null;const ps=unique.filter(p=>matches.some(g=>p.category===g.name));return 'Shop có '+ps.length+' sản phẩm/gói thuộc '+[...new Set(matches.map(g=>g.name))].join(', ')+'.\n'+ps.slice(0,15).map(p=>'• '+p.name+': '+fmt(priceOf(p))).join('\n')+(ps.length>15?'\nBạn nói tên hoặc mức giá mong muốn, mình sẽ liệt kê tiếp.':'')};
const answers={
hello:'Chào bạn! Mình là Support 24/7 của BDShopVN. Bạn có thể hỏi giá, danh sách sản phẩm, cách mua, thanh toán, thời gian giao, bảo hành hoặc đơn hàng. Mình sẽ trả lời ngay theo dữ liệu shop.',
buy:'Cách mua: 1) Chọn danh mục và sản phẩm. 2) Chọn số lượng hoặc tùy chọn nếu có. 3) Thêm vào giỏ hàng. 4) Mở giỏ hàng, kiểm tra sản phẩm và tổng tiền. 5) Điền thông tin giao hàng theo yêu cầu từng sản phẩm, chọn phương thức thanh toán và gửi đơn. 6) Theo dõi trạng thái trong lịch sử đơn hàng. Với Robux 120H, cần Roblox username, không cần mật khẩu.',
robux:'Robux 120H được mô tả giao sau khoảng 120 giờ, cần Roblox username và không cần mật khẩu.\n'+unique.filter(p=>/robux/i.test(p.category)).map(p=>'• '+p.name+': '+fmt(priceOf(p))).join('\n')+'\nĐây là thời gian sản phẩm, còn ETA từng đơn có thể được Admin điều chỉnh.',
categories:'Các danh mục trong dữ liệu shop:\n'+categories.map(x=>'• '+x).join('\n')+'\nBạn hỏi tên danh mục để mình báo các sản phẩm và giá ngay tại đây.',
pay:'Shop có thông tin chuyển khoản trong cấu hình: ngân hàng '+(window.SHOP.bank?.bankCode||'chưa cập nhật')+', tên người nhận '+(window.SHOP.bank?.accountName||'chưa cập nhật')+'. Hãy đối chiếu số tài khoản/QR tại bước thanh toán trước khi chuyển tiền; không gửi OTP hay mật khẩu cho bất kỳ ai. Nếu chọn thẻ cào, làm theo biểu mẫu và mức quy đổi hiển thị tại bước thanh toán.',
warranty:'Dữ liệu sản phẩm hiện chưa cung cấp một thời hạn bảo hành chung áp dụng cho tất cả mặt hàng. Mình không muốn tự hứa sai. Bạn gửi tên sản phẩm hoặc mã đơn, mình sẽ hỗ trợ tra cứu thông tin có sẵn; điều kiện bảo hành riêng cần được Admin xác nhận.',
account:'Bạn có thể đăng nhập để xem các đơn gắn với tài khoản. Đơn cũ chưa liên kết tài khoản cần mã đơn và mã tra cứu riêng. Không nhập mật khẩu, OTP hoặc token tra cứu vào khung chat công khai.',
contact:'Liên hệ Admin BDShopVN:\nZalo: '+(contact.zalo||'chưa cập nhật')+'\nFacebook: '+(contact.facebook||'chưa cập nhật')+'.',
};
function reply(question){const q=norm(question);if(!q)return 'Bạn nhập câu hỏi giúp mình nhé.';if(/cam on|thank|thanks/.test(q))return 'Rất vui được hỗ trợ bạn! 😊';
if(/^(hi|hello|alo|chao|xin chao|shop oi|ad oi)$/.test(q))return answers.hello;
if(/lien he|zalo|facebook|admin|nhan vien|tu van truc tiep/.test(q))return answers.contact;
if(/bao hanh|hoan tien|doi tra/.test(q))return answers.warranty;
if(/thanh toan|chuyen khoan|the cao|nap tien|qr/.test(q))return answers.pay;
if(/cach mua|dat hang|mua hang|gio hang/.test(q))return answers.buy;
if(/mat khau|bao mat|otp|dang nhap/.test(q))return answers.account;
if(/shop ban gi|danh muc|san pham nao/.test(q))return answers.categories;
const scored=unique.map(p=>{const n=norm(p.name),words=n.split(' ').filter(w=>w.length>2),tokens=q.split(' ');let score=q.includes(n)?100+n.length:0;if(!score&&words.length){let hits=words.filter(w=>tokens.includes(w)).length;if(hits>=Math.min(2,words.length))score=hits/words.length*30+hits}return {p,score}}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
if(scored.length){if(/so sanh/.test(q)&&scored.length>1)return scored.slice(0,4).map(x=>detail(x.p)).join('\n\n');return detail(scored[0].p)}
if(last&&/^(gia|bao nhieu|mua sao|chi tiet|san pham nay|cai nay|loai nay|giao bao lau)/.test(q))return detail(last);
if(/robux|120h/.test(q))return answers.robux;
const listing=byCategory(q);if(listing)return listing;
if(/giao bao lau|mat bao lau|thoi gian giao/.test(q))return 'Robux 120H: dự kiến 120 giờ theo mô tả sản phẩm. Với các sản phẩm khác, thời gian hoàn thành phụ thuộc từng gói và ETA Admin cập nhật; dữ liệu hiện không có thời hạn chung để cam kết.';
return 'Mình chưa xác định chính xác sản phẩm hoặc vấn đề bạn muốn hỏi. Bạn có thể nhắn tên sản phẩm, “liệt kê giá Robux”, “cày thuê có gì”, “cách mua”, “thanh toán” hoặc “lịch sử đơn hàng”. Mình sẽ trả lời chi tiết ngay trong chat; thông tin chưa có trong dữ liệu shop mình sẽ nói rõ.';
}
async function send(q){q=String(q||'').trim().slice(0,500);if(!q)return;append('user',q);input.value='';const n=norm(q);const answer=/don hang|kiem tra don|trang thai don|bao gio don|khi nao xong don|hoan thanh du kien|du kien don|lich su don|don cua toi|don nao|cac don|nhung don/.test(n)?await orderReply(q):reply(q);append('bot',answer)}
const prompts=['Shop bán gì?','Cách mua hàng','Bảng giá Robux','Cày thuê có gì?','Gamepass có gì?','Thanh toán','Lịch sử đơn hàng','Liên hệ admin'];prompts.forEach(t=>{const b=document.createElement('button');b.className='cw-chip';b.textContent=t;b.addEventListener('click',()=>send(t));quick.append(b)});
function open(){panel.classList.add('open');fab.classList.add('hidden');if(!started){started=true;append('bot',answers.hello+' Bạn có thể chọn câu hỏi nhanh bên dưới nhé.')}input.focus()}
fab.addEventListener('click',open);$('chatClose').addEventListener('click',()=>{panel.classList.remove('open');fab.classList.remove('hidden')});$('cwSend').addEventListener('click',()=>send(input.value));input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send(input.value)}});
})();
