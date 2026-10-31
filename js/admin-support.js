/* Admin: trả lời khách ngay trong khung chat CSKH (Supabase Realtime + polling dự phòng). */
(()=>{'use strict';
const db=window.BX_SUPABASE,$=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
if(!db||!$('supportCard'))return;
let pending=null,chats=[],cur=null,lastId=0,started=false,listBusy=false,sending=false,channel=null;
const time=t=>new Date(t).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'});
const say=t=>{$('supMessage').textContent=t||''};
const needSql=e=>/support_|relation|schema cache|does not exist/i.test(e&&e.message||'')?'Cần chạy SETUP-CHAT-CSKH.sql trong Supabase SQL Editor. ('+e.message+')':(e&&e.message)||'Lỗi';
async function loadChats(){
  if(listBusy)return;listBusy=true;
  try{
    const {data,error}=await db.from('support_chats').select('*').order('last_message_at',{ascending:false}).limit(100);
    if(error){say(needSql(error));$('supList').innerHTML='<div class="sup-empty">Chưa có dữ liệu.</div>';return}
    say('');chats=data||[];renderList();loadRatings();
    if(cur){const c=chats.find(x=>x.id===cur.id);if(c){cur=c;renderHead()}}
  }finally{listBusy=false}
}
function renderList(){
  const total=chats.reduce((n,c)=>n+(c.unread_admin||0),0),u=$('supUnread');
  u.style.display=total?'':'none';u.textContent=total;
  document.title=(total?'('+total+') ':'')+'Admin Dashboard | BDShopVN';
  $('supList').innerHTML=chats.length?chats.map(c=>`<button type="button" class="sup-item ${cur&&cur.id===c.id?'on':''}" data-chat="${esc(c.id)}"><b><span>${esc(c.username||'Khách')}</span><span>${c.unread_admin?`<span class="sup-dot">${c.unread_admin}</span>`:''}</span></b><small>${esc(c.last_message||'')}</small><small><span class="sup-tag ${c.mode==='admin'?'admin':''}">${c.mode==='admin'?'Chờ/đang chat với Admin':'Khách dùng AI'}</span> ${c.status==='closed'?'<span class="sup-tag closed">Đã đóng</span>':''} · ${esc(time(c.last_message_at))}</small></button>`).join(''):'<div class="sup-empty">Chưa có khách nào liên hệ CSKH.</div>';
}
function renderHead(){
  if(!cur)return;
  $('supTitle').innerHTML=`<b>${esc(cur.username||'Khách')}</b> <span class="sup-tag ${cur.mode==='admin'?'admin':''}">${cur.mode==='admin'?'Đang chờ Admin':'Khách đang dùng AI'}</span> ${cur.status==='closed'?'<span class="sup-tag closed">Đã đóng</span>':''}`;
  $('supToggle').hidden=false;$('supToggle').textContent=cur.status==='closed'?'Mở lại hội thoại':'Đóng hội thoại';
  $('supInput').disabled=false;$('supSend').disabled=sending;$('supEmojiBtn').disabled=false;$('supImgBtn').disabled=false;if(typeof renderQuick==='function'&&!qEdit)renderQuick();
}
async function signed(path){try{const {data}=await db.storage.from('support-images').createSignedUrl(path,3600);return data&&data.signedUrl||null}catch(_){return null}}
function bubble(m){
  const d=document.createElement('div');d.className='sup-m '+(m.sender==='admin'?'admin':'user');
  if(m.image_path){signed(m.image_path).then(u=>{if(!u)return;const im=document.createElement('img');im.alt='Ảnh';im.src=u;im.onclick=()=>window.open(u,'_blank','noopener');im.onload=()=>{const b=$('supMsgs');b.scrollTop=b.scrollHeight};d.prepend(im)})}
  if(m.body)d.append(document.createTextNode(m.body));const s=document.createElement('small');s.textContent=(m.sender==='admin'?'Admin · ':'Khách · ')+time(m.created_at);d.append(s);return d;
}
async function pull(reset){
  if(!cur)return;
  const box=$('supMsgs');
  const {data,error}=await db.from('support_messages').select('id,sender,body,image_path,created_at').eq('chat_id',cur.id).gt('id',reset?0:lastId).order('id',{ascending:true}).limit(300);
  if(error){say(needSql(error));return}
  if(reset){box.innerHTML=''}
  if(!data||!data.length){if(reset)box.innerHTML='<div class="sup-empty">Chưa có tin nhắn.</div>';return}
  const stick=reset||box.scrollHeight-box.scrollTop-box.clientHeight<80;
  const empty=box.querySelector('.sup-empty');if(empty)empty.remove();
  data.forEach(m=>{lastId=Math.max(lastId,m.id);box.append(bubble(m))});
  if(stick)box.scrollTop=box.scrollHeight;
  if(data.some(m=>m.sender==='user')&&!document.hidden)markRead();
}
async function markRead(){
  if(!cur)return;const id=cur.id;
  try{await db.rpc('support_admin_mark_read',{p_chat_id:id});const c=chats.find(x=>x.id===id);if(c){c.unread_admin=0;renderList()}}catch(_){}
}
async function select(id){
  const c=chats.find(x=>x.id===id);if(!c)return;
  cur=c;lastId=0;renderList();renderHead();await pull(true);await markRead();$('supInput').focus();
}
async function send(){
  if(!cur||sending)return;const t=$('supInput').value.trim();if(!t&&!pending)return;
  sending=true;$('supSend').disabled=true;let path=null;
  if(pending){
    path=cur.id+'/'+(crypto.randomUUID?crypto.randomUUID():Date.now()+'')+'.jpg';
    const {error:ue}=await db.storage.from('support-images').upload(path,pending.blob,{contentType:'image/jpeg'});
    if(ue){sending=false;$('supSend').disabled=false;say('Không tải được ảnh: '+needSql(ue)+' (cần chạy SETUP-CHAT-CSKH-V2.sql)');return}
  }
  const {error}=await db.rpc('support_admin_send',{p_chat_id:cur.id,p_body:t,p_image_path:path});
  sending=false;$('supSend').disabled=false;
  if(error){say('Không gửi được: '+needSql(error));return}
  say('');$('supInput').value='';clearImg();await pull(false);loadChats();
}
function clearImg(){if(pending){URL.revokeObjectURL(pending.url);pending=null}$('supPrev').hidden=true;$('supPrev').textContent='';$('supFile').value=''}
function compress(f){return new Promise((ok,no)=>{const u=URL.createObjectURL(f),im=new Image();im.onload=()=>{URL.revokeObjectURL(u);const k=Math.min(1,1280/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*k));c.height=Math.max(1,Math.round(im.height*k));const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);c.toBlob(b=>b?ok(b):no(new Error('Không xử lý được ảnh')),'image/jpeg',.82)};im.onerror=()=>{URL.revokeObjectURL(u);no(new Error('Tệp không phải ảnh'))};im.src=u})}
$('supImgBtn').addEventListener('click',()=>$('supFile').click());
$('supFile').addEventListener('change',async()=>{
  const f=$('supFile').files[0];if(!f)return;if(!/^image\//.test(f.type)||f.size>10*1024*1024){say('Chỉ gửi ảnh PNG/JPG/WebP/GIF tối đa 10MB.');$('supFile').value='';return}
  try{const blob=await compress(f);clearImg();pending={blob,url:URL.createObjectURL(blob)};const p=$('supPrev');p.hidden=false;const im=document.createElement('img');im.src=pending.url;const sp=document.createElement('span');sp.textContent='Ảnh sẽ gửi cùng tin nhắn ';const x=document.createElement('button');x.type='button';x.className='btn btn-g btn-s';x.textContent='✕';x.onclick=clearImg;p.append(im,sp,x)}catch(e){say(e.message)}
});
const EM='😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 😉 😍 🥰 😘 😎 🤩 🥳 😢 😭 😡 😱 🤔 🙄 😴 👍 👎 👏 🙏 💪 🔥 ❤️ 💔 ✨ 🎉 🎁 💎 ⭐ ✅ ❌ 🎮 🍎 💰 🛒'.split(' ');
EM.forEach(e=>{const b=document.createElement('button');b.type='button';b.textContent=e;b.onclick=()=>{const t=$('supInput'),a=t.selectionStart??t.value.length,z=t.selectionEnd??a;t.value=t.value.slice(0,a)+e+t.value.slice(z);t.focus();t.setSelectionRange(a+e.length,a+e.length)};$('supEmoji').append(b)});
$('supEmojiBtn').addEventListener('click',()=>{$('supEmoji').hidden=!$('supEmoji').hidden});

// ===== Tin nhắn nhanh (mẫu trả lời) — lưu trên trình duyệt Admin, tự thêm/xóa được. {ten} = tên khách. =====
const QKEY='bx_sup_quick_v1';
const QDEF=[
 ['👋 Chào','Chào {ten}! Mình là nhân viên CSKH BDShopVN, mình có thể hỗ trợ gì cho bạn ạ?'],
 ['⏳ Chờ chút','Bạn vui lòng chờ mình kiểm tra một chút nhé, mình phản hồi ngay ạ.'],
 ['🧾 Xin mã đơn','Bạn gửi giúp mình mã đơn hàng (dạng BX...) để mình kiểm tra nhé.'],
 ['📸 Xin ảnh/bill','Bạn gửi giúp mình ảnh chụp màn hình hoặc bill chuyển khoản để mình đối soát nhé.'],
 ['🎮 Xin username','Bạn cho mình xin Roblox username (không cần mật khẩu) để mình xử lý đơn nhé.'],
 ['💳 Đã nhận tiền','Mình đã nhận được thanh toán của bạn, đơn sẽ được xử lý sớm nhất có thể ạ.'],
 ['🕒 Đơn đang xử lý','Đơn của bạn đang được xử lý. Bạn xem thời gian dự kiến tại mục Tài khoản → Lịch sử đơn hàng nhé. Cảm ơn bạn đã kiên nhẫn!'],
 ['🔐 Bảo mật','Vì bảo mật, bạn đừng gửi mật khẩu tài khoản ngân hàng, OTP hay mã thẻ qua chat công khai nhé. Mình chỉ cần thông tin đơn hàng thôi ạ.'],
 ['✅ Đã xong','Vấn đề của bạn đã được xử lý xong ạ. Nếu ổn, bạn bấm “Vấn đề đã được giải quyết” và đánh giá giúp shop nhé!'],
 ['🙏 Cảm ơn','Cảm ơn bạn đã ủng hộ BDShopVN! Cần gì cứ nhắn mình bất cứ lúc nào nhé.']
];
let quick=null,qEdit=false;
const qLoad=()=>{try{const v=JSON.parse(localStorage.getItem(QKEY)||'null');if(Array.isArray(v)&&v.every(x=>Array.isArray(x)&&typeof x[0]==='string'&&typeof x[1]==='string'))return v}catch(_){}return QDEF.map(x=>x.slice())};
const qSave=()=>{try{localStorage.setItem(QKEY,JSON.stringify(quick))}catch(_){}};
function renderQuick(){
  if(!quick)quick=qLoad();const box=$('supQuick');box.textContent='';
  quick.forEach((q,i)=>{const b=document.createElement('button');b.type='button';b.className='sup-q'+(qEdit?' del':'');b.textContent=q[0];b.title=qEdit?'Bấm để xóa mẫu này':q[1];b.disabled=!qEdit&&!cur;b.dataset.q=i;box.append(b)});
  const add=document.createElement('button');add.type='button';add.className='sup-q tool';add.dataset.qadd='1';add.textContent='＋ Thêm mẫu';box.append(add);
  const ed=document.createElement('button');ed.type='button';ed.className='sup-q tool';ed.dataset.qedit='1';ed.textContent=qEdit?'✔ Xong':'✏️ Sửa';box.append(ed);
  if(qEdit){const r=document.createElement('button');r.type='button';r.className='sup-q tool';r.dataset.qreset='1';r.textContent='↺ Mẫu mặc định';box.append(r)}
  else{const l=document.createElement('label');l.className='sup-q-auto';l.innerHTML='<input type="checkbox" id="supQAuto" style="width:auto;margin:0"> Bấm là gửi luôn';try{l.firstChild.checked=localStorage.getItem('bx_sup_qauto')==='1'}catch(_){}box.append(l)}
}
$('supQuick').addEventListener('click',e=>{
  const t=e.target.closest('button');if(!t)return;
  if(t.dataset.qedit){qEdit=!qEdit;renderQuick();return}
  if(t.dataset.qreset){if(confirm('Khôi phục danh sách tin nhắn nhanh mặc định?')){quick=QDEF.map(x=>x.slice());qSave();renderQuick()}return}
  if(t.dataset.qadd){
    const text=prompt('Nội dung tin nhắn nhanh (dùng {ten} để chèn tên khách):');if(!text||!text.trim())return;
    const label=prompt('Tên hiển thị trên nút (ngắn gọn, có thể kèm emoji):',text.trim().slice(0,16));if(!label||!label.trim())return;
    quick.push([label.trim().slice(0,24),text.trim().slice(0,1000)]);qSave();renderQuick();return}
  if(t.dataset.q===undefined)return;const i=Number(t.dataset.q);
  if(qEdit){quick.splice(i,1);qSave();renderQuick();return}
  if(!cur)return;
  const text=quick[i][1].replace(/\{ten\}/gi,cur.username||'bạn');const box=$('supInput');
  if($('supQAuto')&&$('supQAuto').checked){box.value=text;send();return}
  box.value=box.value?box.value.replace(/\s*$/,' ')+text:text;box.focus();
});
$('supQuick').addEventListener('change',e=>{if(e.target.id==='supQAuto'){try{localStorage.setItem('bx_sup_qauto',e.target.checked?'1':'0')}catch(_){}}});
renderQuick();
async function loadRatings(){
  const {data,error}=await db.from('support_ratings').select('id,username,rating,comment,created_at').order('created_at',{ascending:false}).limit(50);
  if(error){$('supRatings').innerHTML='<tr><td colspan="4">Chưa có dữ liệu đánh giá (chạy SETUP-CHAT-CSKH-V2.sql).</td></tr>';return}
  const r=data||[];$('supAvg').textContent=r.length?'TB '+(r.reduce((n,x)=>n+x.rating,0)/r.length).toFixed(1)+'/5 · '+r.length+' đánh giá':'';
  $('supRatings').innerHTML=r.length?r.map(x=>`<tr><td>${esc(time(x.created_at))}</td><td>${esc(x.username||'Khách')}</td><td><span class="stars-on">${'★'.repeat(x.rating)}</span><span style="color:#475569">${'★'.repeat(5-x.rating)}</span> ${x.rating}/5</td><td>${esc(x.comment||'—')}</td></tr>`).join(''):'<tr><td colspan="4">Chưa có đánh giá nào.</td></tr>';
}
function listen(){
  if(channel)return;
  try{channel=db.channel('support-admin').on('postgres_changes',{event:'*',schema:'public',table:'support_messages'},()=>{loadChats();pull(false)}).on('postgres_changes',{event:'*',schema:'public',table:'support_chats'},()=>loadChats()).subscribe()}catch(_){}
}
function start(){
  if(started)return;started=true;loadChats();listen();
  setInterval(()=>{if(document.hidden)return;loadChats();pull(false)},10000); // dự phòng khi Realtime chưa bật
}
$('supList').addEventListener('click',e=>{const b=e.target.closest('[data-chat]');if(b)select(b.dataset.chat)});
$('supForm').addEventListener('submit',e=>{e.preventDefault();send()});
$('supInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}});
$('supToggle').addEventListener('click',async()=>{
  if(!cur)return;const {error}=await db.rpc('support_admin_set_status',{p_chat_id:cur.id,p_status:cur.status==='closed'?'open':'closed'});
  if(error){say(needSql(error));return}loadChats();
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&started){loadChats();pull(false)}});
// Chỉ chạy khi Admin đã đăng nhập (dashboard được hiện).
const dash=$('dashboard');
const check=()=>{if(!dash.hidden)start()};
new MutationObserver(check).observe(dash,{attributes:true,attributeFilter:['hidden']});check();
})();
