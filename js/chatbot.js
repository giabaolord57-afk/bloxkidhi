/* Support 24/7 — dữ liệu lấy trực tiếp từ js/data.js; không API, không gửi thông tin khách ra ngoài. */
(()=>{'use strict';
const $=id=>document.getElementById(id), fab=$('chatFab'),panel=$('chatWidget'),body=$('cwBody'),quick=$('cwQuick'),input=$('cwInput');
if(!fab||!panel||!window.SHOP)return;
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const fmt=n=>Number(n).toLocaleString('vi-VN')+'đ';
const contact=window.SHOP.contact||{};
const link=(url,label)=>url?'['+label+']('+url+')':label;
const groups=[...(window.ROBUX_GROUPS||[]),...(window.ITEM_GROUPS||[]),...(window.CAY_THUE_GROUPS||[]),...(window.STEAL_AN_EGG_GROUPS||[])];
// Dữ liệu Cày thuê nằm ở window.BOOST.groups (tên biến không kết thúc bằng GROUPS) nên phải nạp riêng.
const boostGroups=((window.BOOST&&window.BOOST.groups)||[]).filter(g=>g&&g.items);
boostGroups.forEach(g=>{if(!groups.includes(g))groups.push(g)});
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
   const q=norm(question),code=(q.match(/\b(bx[a-f0-9]{12})\b/i)||[])[1]?.toUpperCase();
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
const fmtTime=ts=>{const d=ts?new Date(ts):new Date();if(isNaN(d))return '';const o={timeZone:'Asia/Ho_Chi_Minh'},t=d.toLocaleTimeString('vi-VN',{...o,hour:'2-digit',minute:'2-digit'}),day=x=>x.toLocaleDateString('vi-VN',o);return day(d)===day(new Date())?t:t+' · '+d.toLocaleDateString('vi-VN',{...o,day:'2-digit',month:'2-digit'})};
// ===== AI (Gemini) — chỉ gọi khi bot từ khóa không hiểu; lỗi/hết lượt thì dùng câu trả lời cũ =====
const aiHist=[];let aiBusy=false,aiOffUntil=0;
const redact=t=>String(t).replace(/[\w.+-]+@[\w-]+\.[\w.]+/g,'[email]').replace(/\d[\d\s.-]{7,}\d/g,'[số]');
function aiContext(){
 const lines=[];groups.forEach(g=>{const ps=unique.filter(p=>p.category===g.name);if(!ps.length)return;lines.push('## '+g.name+(g.desc?' — '+g.desc:'')+'\n'+ps.slice(0,40).map(p=>p.name+': '+fmt(priceOf(p))).join('; '))});
 if(window.BOOST&&window.BOOST.desc)lines.push('## Lưu ý cày thuê: '+window.BOOST.desc);
 lines.push('## Cách mua: '+answers.buy,'## Thanh toán: chuyển khoản (VietQR, có thể gửi bill) hoặc thẻ cào; làm theo biểu mẫu ở bước thanh toán.','## Bảo hành: chưa có chính sách chung; điều kiện riêng do Admin xác nhận.','## LIÊN HỆ: Zalo '+(contact.zalo||'chưa cập nhật')+'; Facebook '+(contact.facebook||'chưa cập nhật'));
 const faqTxt=faqList.map(f=>'Hỏi: '+f.title+'\nĐáp: '+faqFill(f.a)).join('\n\n').slice(0,7000);
 return lines.join('\n').slice(0,6800)+'\n\n=== FAQ CỦA SHOP ===\n'+faqTxt}
async function askAI(q){
 const dbx=window.BX_SUPABASE;
 if(!window.SHOP.aiChat)return {error:'Trợ lý AI hiện đang được tắt. Bạn có thể liên hệ Admin để được hỗ trợ.'};
 if(!dbx)return {error:'Website chưa kết nối được Supabase nên chưa gọi được Gemini. Vui lòng tải lại trang hoặc liên hệ Admin.'};
 if(Date.now()<aiOffUntil)return {error:'Gemini đang tạm ngắt sau lỗi kết nối. Vui lòng thử lại sau khoảng 1 phút hoặc bấm “☏ Gặp CSKH”.'};
 let ctl,t;
 try{
  ctl=new AbortController();t=setTimeout(()=>ctl.abort(),22000);
  const {data,error}=await dbx.functions.invoke('ai-chat',{body:{message:redact(q),context:aiContext(),history:aiHist.slice(-6)},signal:ctl.signal});
  clearTimeout(t);
  if(error||!data||typeof data.reply!=='string'){
   aiOffUntil=Date.now()+60000;
   const code=data&&data.error;
   if(code==='rate'||code==='cap')return {error:'Gemini đang quá lượt sử dụng tạm thời. Vui lòng thử lại sau hoặc bấm “☏ Gặp CSKH”.'};
   return {error:'Chưa kết nối được Gemini (có thể Edge Function chưa được deploy hoặc cấu hình API/CORS đang lỗi). Vui lòng thử lại sau hoặc bấm “☏ Gặp CSKH”.'};
  }
  aiHist.push({role:'user',text:redact(q)},{role:'model',text:data.reply});if(aiHist.length>12)aiHist.splice(0,2);
  return {reply:data.reply};
 }catch(_){
  if(t)clearTimeout(t);aiOffUntil=Date.now()+60000;
  return {error:'Kết nối Gemini bị gián đoạn hoặc quá thời gian chờ. Vui lòng thử lại sau hoặc bấm “☏ Gặp CSKH”.'};
 }
}
function append(who,message,imgUrl,ts){const staff=who==='staff';const row=document.createElement('div');row.className='cw-msg '+(staff?'bot staff':who);const avatar=document.createElement('span');avatar.className='cw-msg-av';avatar.textContent=staff?'🎧':who==='bot'?'🤖':'👤';const bubble=document.createElement('div');bubble.className='cw-bubble';// Chỉ tạo link từ URL cấu hình shop, không thực thi HTML từ tin nhắn.
const parts=String(message).split(/(https?:\/\/[^\s]+)/g);parts.forEach(part=>{if(/^https?:\/\//.test(part)){const a=document.createElement('a');a.href=part;a.target='_blank';a.rel='noopener noreferrer';a.textContent=part;bubble.append(a)}else bubble.append(document.createTextNode(part))});if(imgUrl){const im=document.createElement('img');im.className='cw-img';im.alt='Ảnh';im.src=imgUrl;im.addEventListener('click',()=>window.open(imgUrl,'_blank','noopener'));im.addEventListener('load',()=>{body.scrollTop=body.scrollHeight});bubble.append(im)}const tm=document.createElement('span');tm.className='cw-time';tm.textContent=fmtTime(ts);bubble.append(tm);row.append(avatar,bubble);body.append(row);body.scrollTop=body.scrollHeight}
const priceOf=p=>typeof p.raw.price==='number'?p.raw.price:p.base+((p.raw&&p.raw.noMarkup)?0:(window.SHOP.markup||0));
const detail=p=>{last=p;let r=p.name+' — '+p.category+'\nGiá theo dữ liệu shop: '+fmt(priceOf(p))+'.';const d=p.raw.desc||p.raw.note||p.raw.eta||'';if(d)r+='\nThông tin: '+d;const g=groups.find(g=>g.name===p.category);if(g){if(g.desc)r+='\n'+g.desc;if(g.needs==='username')r+='\nKhi đặt cần Roblox username; không gửi mật khẩu cho bot.';}if(p.raw.isCustomDays)r+='\nGói tính theo số ngày; giá chính thức sẽ được tính theo lựa chọn của khách.';return r};
const categories=[...new Set(groups.map(g=>g.name).filter(Boolean))];
const byCategory=q=>{let matches=groups.filter(g=>norm(q).includes(norm(g.name))||norm(g.name).split(' ').filter(x=>x.length>3).every(x=>norm(q).includes(x)));if(/cay thue|booster/.test(q))matches=boostGroups;if(/gamepass/.test(q))matches=groups.filter(g=>/gamepass/i.test(g.name));if(/robux/.test(q))matches=groups.filter(g=>/robux/i.test(g.name));if(/trai|vinh vien/.test(q))matches=groups.filter(g=>/trai|vinh vien/i.test(g.name));if(!matches.length)return null;const ps=unique.filter(p=>matches.some(g=>p.category===g.name));return 'Shop có '+ps.length+' sản phẩm/gói thuộc '+[...new Set(matches.map(g=>g.name))].join(', ')+'.\n'+ps.slice(0,15).map(p=>'• '+p.name+': '+fmt(priceOf(p))).join('\n')+(ps.length>15?'\nBạn nói tên hoặc mức giá mong muốn, mình sẽ liệt kê tiếp.':'')};
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
// ===== FAQ (js/faq.js): khớp cụm từ; cụm dài nhất thắng. Khách gõ nguyên tên sản phẩm thì ưu tiên chi tiết sản phẩm. =====
const faqList=Array.isArray(window.SHOP_FAQ)?window.SHOP_FAQ:[];
const faqFill=t=>String(t).replace(/\{zalo\}/g,contact.zalo||'(chưa cập nhật)').replace(/\{facebook\}/g,contact.facebook||'(chưa cập nhật)');
function faqMatch(n){
 const hay=' '+n+' ';let best=null,len=0;
 faqList.forEach(f=>(f.k||[]).forEach(k=>{if(k.length>len&&hay.includes(' '+k+' ')){best=f;len=k.length}}));
 if(!best)return null;
 if(unique.some(p=>{const pn=norm(p.name);return pn.length>=7&&n.includes(pn)}))return null;
 return best}
const FALLBACK='Mình chưa xác định chính xác sản phẩm hoặc vấn đề bạn muốn hỏi. Bạn có thể nhắn tên sản phẩm, “liệt kê giá Robux”, “cày thuê có gì”, “cách mua”, “thanh toán” hoặc “lịch sử đơn hàng”. Mình sẽ trả lời chi tiết ngay trong chat; thông tin chưa có trong dữ liệu shop mình sẽ nói rõ.';
function reply(question){const q=norm(question);if(!q)return 'Bạn nhập câu hỏi giúp mình nhé.';if(/cam on|thank|thanks/.test(q))return 'Rất vui được hỗ trợ bạn! 😊';
if(/^(hi|hello|alo|chao|xin chao|shop oi|ad oi)$/.test(q))return answers.hello;
const faq=faqMatch(q);if(faq)return faqFill(faq.a);
if(/lien he|zalo|facebook|admin|nhan vien|tu van truc tiep/.test(q))return answers.contact;
if(/bao hanh|hoan tien|doi tra/.test(q))return answers.warranty;
if(/thanh toan|chuyen khoan|the cao|nap tien|qr/.test(q))return answers.pay;
if(/cach mua|dat hang|mua hang|gio hang/.test(q))return answers.buy;
if(/mat khau|bao mat|otp|dang nhap/.test(q))return answers.account;
if(/shop ban gi|danh muc|san pham nao/.test(q))return answers.categories;
if(/cay thue|booster|thue acc/.test(q)&&!unique.some(p=>q.includes(norm(p.name))&&norm(p.name).length>14)){
 const bd=window.BOOST&&window.BOOST.desc?window.BOOST.desc+'\n':'';
 return 'Dịch vụ Cày thuê gồm '+boostGroups.length+' nhóm:\n'+boostGroups.map(g=>{const ps=unique.filter(p=>p.category===g.name).map(priceOf);const lo=Math.min(...ps),hi=Math.max(...ps);return '• '+(g.icon||'')+' '+g.name+' ('+ps.length+' gói'+(ps.length?', '+(lo===hi?fmt(lo):fmt(lo)+' – '+fmt(hi)):'')+')'}).join('\n')+'\n'+bd+'Bạn nhắn tên nhóm (vd: “Cày Level”, “Steal An Egg”) hoặc tên gói để mình báo chi tiết giá.';
}
const scored=unique.map(p=>{const n=norm(p.name),words=n.split(' ').filter(w=>w.length>2),tokens=q.split(' ');let score=q.includes(n)?100+n.length:0;if(!score&&words.length){let hits=words.filter(w=>tokens.includes(w)).length;if(hits>=Math.min(2,words.length))score=hits/words.length*30+hits}return {p,score}}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
if(scored.length){if(/so sanh/.test(q)&&scored.length>1)return scored.slice(0,4).map(x=>detail(x.p)).join('\n\n');return detail(scored[0].p)}
if(last&&!/robux|120h|cay thue|booster/.test(q)&&/^(gia|bao nhieu|mua sao|chi tiet|san pham nay|cai nay|loai nay|giao bao lau)/.test(q))return detail(last);
if(/robux|120h/.test(q))return answers.robux;
const listing=byCategory(q);if(listing)return listing;
if(/giao bao lau|mat bao lau|thoi gian giao/.test(q))return 'Robux 120H: dự kiến 120 giờ theo mô tả sản phẩm. Với các sản phẩm khác, thời gian hoàn thành phụ thuộc từng gói và ETA Admin cập nhật; dữ liệu hiện không có thời hạn chung để cam kết.';
return FALLBACK;
}
// ===== CSKH: chat trực tiếp với Admin (Supabase) — nút "Gặp CSKH" <-> "Hỏi AI" =====
const STAFF_TEXT='Tôi cần gặp nhân viên hỗ trợ';
const db=window.BX_SUPABASE,statusEl=panel.querySelector('.cw-status'),badge=fab.querySelector('.chat-fab-badge'),sendBtn=$('cwSend');
let sentInSession=false,pendingImg=null,mode='ai',chat=null,lastId=0,channel=null,poller=null,historyLoaded=false,busyStaff=false,unread=0,sending=false;
const staffBtn=document.createElement('button');staffBtn.className='cw-chip cw-chip-staff';staffBtn.type='button';
function renderMode(){const m=mode==='admin';resolveBtn.style.display=(m&&sentInSession)?'':'none';imgBtn.hidden=!m;if(!m)clearImg();staffBtn.textContent=m?'🤖 Hỏi AI':'☏ Gặp CSKH';staffBtn.title=m?'Quay lại trợ lý AI':'Chat trực tiếp với nhân viên hỗ trợ';
 panel.classList.toggle('cw-staff-mode',m);if(statusEl)statusEl.textContent=m?'● Đang chat với nhân viên CSKH':'● Trợ lý tự động BDShopVN';
 input.placeholder=m?'Nhắn cho nhân viên CSKH...':'Nhập câu hỏi...'}
const isOpen=()=>panel.classList.contains('open');
function setBadge(n){unread=n;if(!badge)return;if(n>0){badge.textContent=n>9?'9+':String(n);badge.style.display=''}else badge.style.display='none'}
async function getUser(){if(!db)return null;try{const {data:{session}}=await db.auth.getSession();return session?session.user:null}catch(_){return null}}
const signed=async path=>{try{const {data}=await db.storage.from('support-images').createSignedUrl(path,3600);return data&&data.signedUrl||null}catch(_){return null}};
const userName=u=>String((u&&u.email)||'').split('@')[0]||'khach';
async function markRead(){if(!db||!chat)return;try{await db.rpc('support_mark_read_user')}catch(_){}}
// Chỉ vẽ tin của nhân viên; tin của khách đã được vẽ ngay lúc gửi (tránh trùng).
async function pull(){if(!db||!chat)return;try{const {data,error}=await db.from('support_messages').select('id,sender,body,image_path,created_at').eq('chat_id',chat.id).gt('id',lastId).order('id',{ascending:true}).limit(50);if(error||!data||!data.length)return;let fresh=0;for(const m of data){lastId=Math.max(lastId,m.id);if(m.sender==='admin'){append('staff',m.body,m.image_path?await signed(m.image_path):null,m.created_at);fresh++}}if(fresh){if(isOpen())markRead();else setBadge(unread+fresh)}}catch(_){}}
function listen(){if(!db||!chat||channel)return;try{channel=db.channel('support-'+chat.id).on('postgres_changes',{event:'INSERT',schema:'public',table:'support_messages',filter:'chat_id=eq.'+chat.id},()=>pull()).subscribe()}catch(_){}
 poller=setInterval(()=>{if(document.hidden)return;pull()},8000)}
function stopListen(){if(channel&&db){try{db.removeChannel(channel)}catch(_){}}channel=null;if(poller)clearInterval(poller);poller=null}
async function loadHistory(){if(historyLoaded||!chat)return;historyLoaded=true;try{let qy=db.from('support_messages').select('id,sender,body,image_path,created_at').eq('chat_id',chat.id);if(chat.session_no!=null)qy=qy.eq('session_no',chat.session_no);const {data}=await qy.order('id',{ascending:false}).limit(50);sentInSession=(data||[]).some(m=>m.sender==='user'&&(m.image_path||m.body!==STAFF_TEXT));renderMode();for(const m of (data||[]).reverse()){lastId=Math.max(lastId,m.id);append(m.sender==='admin'?'staff':'user',m.body,m.image_path?await signed(m.image_path):null,m.created_at)}if((data||[]).length)append('bot',mode==='admin'?'— Đây là lịch sử trò chuyện với CSKH. Nhân viên sẽ trả lời ngay tại đây. —':'— Lịch sử trò chuyện với CSKH ở trên. Bạn đang dùng trợ lý AI; bấm “Gặp CSKH” để nhắn nhân viên. —')}catch(_){}}
async function initSupport(){renderMode();const u=await getUser();if(!u){stopListen();chat=null;mode='ai';historyLoaded=false;lastId=0;renderMode();return}
 try{const {data}=await db.from('support_chats').select('*').eq('user_id',u.id).maybeSingle();if(data){chat=data;mode=data.mode==='admin'?'admin':'ai';setBadge(data.unread_user||0);if(started)loadHistory();listen()}}catch(_){}renderMode()}
function failStaff(){append('bot','Chưa kết nối được kênh CSKH trực tuyến (Admin cần chạy SETUP-CHAT-CSKH.sql trong Supabase). Bạn có thể liên hệ trực tiếp:\n'+answers.contact)}
async function requestStaff(){if(busyStaff)return;busyStaff=true;staffBtn.disabled=true;
 try{append('user',STAFF_TEXT);const u=await getUser();
  if(!u){append('bot','Để chat với nhân viên CSKH, bạn cần đăng nhập để Admin nhận diện đúng tài khoản và đơn hàng của bạn.\nĐăng nhập tại: '+new URL('tai-khoan.html',location.href).href+'\nHoặc liên hệ nhanh:\n'+answers.contact);return}
  const {data,error}=await db.rpc('support_open_chat',{p_username:userName(u)});if(error||!data){failStaff();return}
  const first=!chat;chat=Array.isArray(data)?data[0]:data;mode='admin';
  const {data:mid,error:e2}=await db.rpc('support_send_message',{p_body:STAFF_TEXT});if(e2){mode='ai';renderMode();failStaff();return}
  if(typeof mid==='number')lastId=Math.max(lastId,mid);historyLoaded=true;listen();renderMode();
  append('bot','Đã gửi yêu cầu tới nhân viên CSKH. Bạn cứ nhắn nội dung cần hỗ trợ ngay trong khung chat này, Admin sẽ trả lời trực tiếp tại đây. Muốn hỏi trợ lý tự động, bấm “🤖 Hỏi AI”.')
 }finally{busyStaff=false;staffBtn.disabled=false;renderMode()}}
async function backToAI(){mode='ai';renderMode();if(db&&chat){try{await db.rpc('support_set_mode',{p_mode:'ai'})}catch(_){}}append('bot','Đã chuyển sang Hỏi AI. Từ giờ trợ lý tự động sẽ trả lời bạn thay cho nhân viên. Cần gặp nhân viên, bấm “☏ Gặp CSKH” nhé.')}
staffBtn.addEventListener('click',()=>mode==='admin'?backToAI():requestStaff());
async function sendStaff(q){if(!q&&!pendingImg)return;const img=pendingImg;let path=null;
 if(img){try{path=chat.id+'/'+(crypto.randomUUID?crypto.randomUUID():Date.now()+''+Math.random().toString(16).slice(2))+'.jpg';const {error:ue}=await db.storage.from('support-images').upload(path,img.blob,{contentType:'image/jpeg'});if(ue)throw ue}catch(e){append('bot','Chưa tải được ảnh lên: '+((e&&e.message)||'lỗi')+'. Admin cần chạy SETUP-CHAT-CSKH-V2.sql trong Supabase.');return}}
 const {data,error}=await db.rpc('support_send_message',{p_body:q,p_image_path:path});
 if(error){append('bot','Chưa gửi được tin nhắn tới nhân viên: '+(error.message||'lỗi kết nối')+'. Vui lòng thử lại hoặc bấm “🤖 Hỏi AI”.');return}
 append('user',q,img?img.url:null);sentInSession=true;renderMode();input.value='';clearImg();if(typeof data==='number')lastId=Math.max(lastId,data)}
async function send(q){q=String(q||'').trim().slice(0,mode==='admin'?1000:500);if(!q&&!(mode==='admin'&&pendingImg))return;
 if(mode==='admin'){if(sending)return;sending=true;sendBtn.disabled=true;try{await sendStaff(q)}finally{sending=false;sendBtn.disabled=false}return}
 append('user',q);input.value='';const n=norm(q);let answer=!faqMatch(n)&&/don hang|kiem tra don|trang thai don|bao gio don|khi nao xong don|hoan thanh du kien|du kien don|lich su don|don cua toi|don nao|cac don|nhung don/.test(n)?await orderReply(q):reply(q);
 if(answer===FALLBACK&&window.SHOP.aiChat){
  if(aiBusy){append('bot','Mình đang xử lý câu hỏi trước, bạn đợi một chút rồi gửi lại nhé.');return}
  aiBusy=true;sendBtn.disabled=true;append('bot','Đang soạn câu trả lời…');const wait=body.lastElementChild;
  try{const ai=await askAI(q);answer=(ai&&ai.reply)||((ai&&ai.error)||'Chưa nhận được phản hồi từ Gemini. Vui lòng thử lại sau hoặc bấm “☏ Gặp CSKH”.')}
  finally{aiBusy=false;sendBtn.disabled=false;if(wait&&wait.parentNode)wait.remove()}
 }
 append('bot',answer)}

// ===== Emoji, ảnh, "Đã giải quyết" + đánh giá sao =====
const row=panel.querySelector('.cw-input-row');
const mkBtn=(cls,txt,title)=>{const b=document.createElement('button');b.type='button';b.className='cw-tool '+cls;b.textContent=txt;b.title=title;b.setAttribute('aria-label',title);return b};
const emojiBtn=mkBtn('cw-emoji-btn','😊','Chèn emoji'),imgBtn=mkBtn('cw-img-btn','📷','Gửi ảnh cho nhân viên');
const file=document.createElement('input');file.type='file';file.accept='image/png,image/jpeg,image/webp,image/gif';file.hidden=true;
row.insertBefore(imgBtn,input);row.insertBefore(emojiBtn,imgBtn);row.append(file);
const prev=document.createElement('div');prev.className='cw-preview';prev.hidden=true;row.parentNode.insertBefore(prev,row);
const EMOJIS='😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 😉 😍 🥰 😘 😎 🤩 🥳 😢 😭 😡 😱 🤔 🙄 😴 👍 👎 👏 🙏 💪 🔥 ❤️ 💔 ✨ 🎉 🎁 💎 ⭐ ✅ ❌ 🎮 🍎 💰 🛒'.split(' ');
const pop=document.createElement('div');pop.className='cw-emoji-pop';pop.hidden=true;
EMOJIS.forEach(e=>{const b=document.createElement('button');b.type='button';b.textContent=e;b.addEventListener('click',()=>{const a=input.selectionStart??input.value.length,z=input.selectionEnd??a;input.value=input.value.slice(0,a)+e+input.value.slice(z);const pos=a+e.length;input.focus();input.setSelectionRange(pos,pos)});pop.append(b)});
row.parentNode.insertBefore(pop,row);
emojiBtn.addEventListener('click',e=>{e.stopPropagation();pop.hidden=!pop.hidden});
panel.addEventListener('click',e=>{if(!pop.hidden&&!pop.contains(e.target)&&e.target!==emojiBtn)pop.hidden=true});
function clearImg(){if(pendingImg){URL.revokeObjectURL(pendingImg.url);pendingImg=null}if(typeof prev!=='undefined'){prev.hidden=true;prev.textContent=''}file.value=''}
function compress(f){return new Promise((ok,no)=>{const u=URL.createObjectURL(f),im=new Image();im.onload=()=>{URL.revokeObjectURL(u);const k=Math.min(1,1280/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*k));c.height=Math.max(1,Math.round(im.height*k));const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);c.toBlob(b=>b?ok(b):no(new Error('Không xử lý được ảnh')),'image/jpeg',.82)};im.onerror=()=>{URL.revokeObjectURL(u);no(new Error('Tệp không phải ảnh hợp lệ'))};im.src=u})}
imgBtn.addEventListener('click',()=>file.click());
file.addEventListener('change',async()=>{const f=file.files&&file.files[0];if(!f)return;if(!/^image\//.test(f.type)||f.size>10*1024*1024){append('bot','Chỉ gửi được ảnh (PNG/JPG/WebP/GIF) tối đa 10MB.');file.value='';return}
 try{const blob=await compress(f);clearImg();pendingImg={blob,url:URL.createObjectURL(blob)};prev.hidden=false;prev.textContent='';const im=document.createElement('img');im.src=pendingImg.url;im.alt='Ảnh sẽ gửi';const x=document.createElement('button');x.type='button';x.textContent='✕';x.title='Bỏ ảnh';x.addEventListener('click',clearImg);const t=document.createElement('span');t.textContent='Ảnh sẽ gửi cùng tin nhắn';prev.append(im,t,x)}catch(e){append('bot',(e&&e.message)||'Không đọc được ảnh.')}});
input.addEventListener('paste',e=>{if(mode!=='admin')return;const it=[...(e.clipboardData?.items||[])].find(i=>i.type.startsWith('image/'));if(it){e.preventDefault();const dt=new DataTransfer();dt.items.add(it.getAsFile());file.files=dt.files;file.dispatchEvent(new Event('change'))}});

// Nút "Vấn đề đã được giải quyết" -> hộp đánh giá sao ngay giữa khung chat
const resolveBtn=document.createElement('button');resolveBtn.type='button';resolveBtn.className='cw-chip cw-chip-resolve';resolveBtn.textContent='✅ Vấn đề đã được giải quyết';resolveBtn.style.display='none';
const modal=document.createElement('div');modal.className='cw-modal';modal.hidden=true;modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
modal.innerHTML='<div class="cw-modal-card"><div class="cw-modal-title">Vấn đề đã được giải quyết?</div><div class="cw-modal-sub">Bạn đánh giá lần hỗ trợ này thế nào?</div><div class="cw-face" aria-hidden="true">🙂</div><div class="cw-stars" role="radiogroup" aria-label="Số sao"></div><div class="cw-star-label"> </div><textarea class="cw-modal-text" rows="3" maxlength="500" placeholder="Gửi đánh giá cho nhân viên bằng tin nhắn (không bắt buộc)..."></textarea><div class="cw-modal-err"></div><div class="cw-modal-actions"><button type="button" class="cw-modal-cancel">Chưa xong</button><button type="button" class="cw-modal-ok" disabled>Gửi đánh giá</button></div></div>';
panel.append(modal);
const starsBox=modal.querySelector('.cw-stars'),starLbl=modal.querySelector('.cw-star-label'),txt=modal.querySelector('.cw-modal-text'),okBtn=modal.querySelector('.cw-modal-ok'),errEl=modal.querySelector('.cw-modal-err');
const LABELS=['Rất tệ','Chưa tốt','Bình thường','Tốt','Rất hài lòng'],FACES=['😡','😞','😐','🙂','🤩'],faceEl=modal.querySelector('.cw-face');let stars=0;
const paint=n=>{[...starsBox.children].forEach((b,i)=>b.classList.toggle('on',i<n));starLbl.textContent=n?n+'/5 — '+LABELS[n-1]:' ';faceEl.textContent=n?FACES[n-1]:'🙂';faceEl.classList.toggle('idle',!n)};
for(let i=1;i<=5;i++){const b=document.createElement('button');b.type='button';b.textContent='★';b.title=LABELS[i-1];b.setAttribute('role','radio');b.setAttribute('aria-label',i+' sao');b.addEventListener('mouseenter',()=>paint(i));b.addEventListener('focus',()=>paint(i));b.addEventListener('click',()=>{stars=i;paint(i);okBtn.disabled=false});starsBox.append(b)}
starsBox.addEventListener('mouseleave',()=>paint(stars));
const closeModal=()=>{modal.hidden=true};
resolveBtn.addEventListener('click',()=>{if(!chat){append('bot','Nút này dùng sau khi bạn đã chat với nhân viên CSKH để đánh giá lần hỗ trợ. Hãy bấm “☏ Gặp CSKH” (cần đăng nhập) để được nhân viên hỗ trợ trước nhé.');return}stars=0;paint(0);txt.value='';errEl.textContent='';okBtn.disabled=true;okBtn.textContent='Gửi đánh giá';modal.hidden=false});
modal.querySelector('.cw-modal-cancel').addEventListener('click',closeModal);
modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)closeModal()});
okBtn.addEventListener('click',async()=>{if(!stars)return;okBtn.disabled=true;okBtn.textContent='Đang gửi...';errEl.textContent='';const c=txt.value.trim();
 const {data:newNo,error}=await db.rpc('support_resolve',{p_rating:stars,p_comment:c});
 if(error){errEl.textContent='Chưa gửi được: '+(error.message||'lỗi')+(/support_resolve|schema cache|does not exist/i.test(error.message||'')?' (Admin cần chạy SETUP-CHAT-CSKH-V2.sql)':'');okBtn.disabled=false;okBtn.textContent='Gửi đánh giá';return}
 closeModal();
 // Kết thúc phiên cũ: xoá khung chat, mở phiên mới (tin nhắn cũ vẫn lưu cho Admin xem).
 if(chat){if(typeof newNo==='number')chat.session_no=newNo;else if(chat.session_no!=null)chat.session_no++}
 sentInSession=false;mode='ai';historyLoaded=true;body.textContent='';clearImg();renderMode();
 append('bot',FACES[stars-1]+' Cảm ơn bạn đã đánh giá '+'★'.repeat(stars)+'☆'.repeat(5-stars)+' ('+stars+'/5 — '+LABELS[stars-1]+')! Phản hồi đã được gửi tới nhân viên CSKH.\nMột phiên hỗ trợ mới đã được mở cho bạn.');
 append('bot',answers.hello+' Cần gặp nhân viên, bấm “☏ Gặp CSKH” nhé.')});
quick.append(staffBtn,resolveBtn);
const prompts=['Shop bán gì?','Cách mua hàng','Bảng giá Robux','Cày thuê có gì?','Gamepass có gì?','Thanh toán','Lịch sử đơn hàng','Liên hệ admin'];prompts.forEach(t=>{const b=document.createElement('button');b.className='cw-chip';b.textContent=t;b.addEventListener('click',()=>{if(mode==='admin')backToAI().then(()=>send(t));else send(t)});quick.append(b)});
function open(){panel.classList.add('open');fab.classList.add('hidden');if(!started){started=true;append('bot',answers.hello+' Bạn có thể chọn câu hỏi nhanh bên dưới, hoặc bấm “☏ Gặp CSKH” để chat với nhân viên.');loadHistory()}setBadge(0);if(chat)markRead();input.focus()}
fab.addEventListener('click',open);$('chatClose').addEventListener('click',()=>{panel.classList.remove('open');fab.classList.remove('hidden')});sendBtn.addEventListener('click',()=>send(input.value));input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send(input.value)}});
renderMode();initSupport();if(db)db.auth.onAuthStateChange((ev)=>{if(ev==='SIGNED_IN'||ev==='SIGNED_OUT')setTimeout(initSupport,0)});
})();
