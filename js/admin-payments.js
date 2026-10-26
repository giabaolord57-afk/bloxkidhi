(()=>{'use strict';
const db=window.BX_SUPABASE,$=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const vnd=n=>Number(n||0).toLocaleString('vi-VN')+'đ';
const BILL_LINK_SECONDS=86400; // link bill sống 24 giờ
const KEY=id=>'pay|'+id; // lưu trạng thái "đã dọn" chung bảng admin_archived_orders, không cần SQL mới
let loading=false,busy=false,rows=[],billLinks=new Map(),archived=new Set(),selected=new Set(),cardPos={},cardCnt={};

async function fetchAll(){
  let data=[];const size=500;
  for(let o=0;;o+=size){
    const {data:b,error}=await db.from('payment_submissions').select('id,order_code,method,status,bill_path,card_provider,card_denomination,card_code,card_serial,card_fee_percent,notes,admin_note,created_at').order('created_at',{ascending:false}).range(o,o+size-1);
    if(error)throw error;data.push(...(b||[]));if(!b||b.length<size)break;
  }
  return data;
}
function visible(){
  const arch=$('showPayArchived').checked,done=$('showPayDone').checked;
  return rows.filter(p=>arch?archived.has(KEY(p.id)):!archived.has(KEY(p.id))&&(done||p.status==='Chờ kiểm tra'));
}
function syncSel(){
  const checks=[...$('paymentSubmissions').querySelectorAll('[data-pay-check]')],arch=$('showPayArchived').checked;
  $('selectAllPay').checked=checks.length>0&&checks.every(x=>x.checked);
  $('selectAllPay').indeterminate=checks.some(x=>x.checked)&&!$('selectAllPay').checked;
  $('paySelectedCount').textContent='Đã chọn '+selected.size+' bill';
  $('archivePaySelected').disabled=busy||!selected.size||arch;
  $('restorePaySelected').disabled=busy||!selected.size||!arch;
}
function render(){
  const list=visible();
  $('payCounts').textContent='Đang hiển thị '+list.length+' bill · Đã dọn: '+rows.filter(p=>archived.has(KEY(p.id))).length+' trong '+rows.length+' bill. Bill đã dọn vẫn còn trong Supabase.';
  $('paymentSubmissions').innerHTML=list.map(p=>{
    const link=billLinks.get(p.id);
    const bill=!p.bill_path?'—':link?`<a href="${esc(link)}" target="_blank" rel="noopener">Mở bill</a>`:'Không tạo được link bill';
    const detail=p.method==='card'?`<b>Card ${cardPos[p.id]||''}/${cardCnt[p.order_code]||1}</b><br>${esc(p.card_provider)} · ${vnd(p.card_denomination)}<br><small>Mã: ${esc(p.card_code)}<br>Serial: ${esc(p.card_serial)}<br>Phí chiết khấu: ${Number(p.card_fee_percent||0)}%</small>`:'Chuyển khoản ngân hàng';
    return `<tr><td><input type="checkbox" data-pay-check="${p.id}" style="width:auto" ${selected.has(String(p.id))?'checked':''}></td><td><b>${esc(p.order_code)}</b><br><small>${new Date(p.created_at).toLocaleString('vi-VN')}</small></td><td>${p.method==='card'?'🎟️ Thẻ cào':'🏦 Chuyển khoản'}</td><td>${detail}</td><td>${bill}</td><td><select data-payment-status="${p.id}">${['Chờ kiểm tra','Đã xác nhận','Từ chối'].map(s=>`<option ${s===p.status?'selected':''}>${s}</option>`).join('')}</select></td><td><input data-payment-note="${p.id}" value="${esc(p.admin_note||'')}" placeholder="Ghi chú" style="min-width:130px"></td><td><button class="btn btn-p btn-s" data-payment-save="${p.id}">Lưu</button></td></tr>`;
  }).join('')||'<tr><td colspan="8">Không có bill nào trong mục này.</td></tr>';
  syncSel();
}
async function loadPayments(){
  if(loading||!$('paymentSubmissions')||$('dashboard')?.hidden)return;
  loading=true;$('paymentMessage').textContent='Đang tải...';
  try{
    const [data,ar]=await Promise.all([fetchAll(),db.from('admin_archived_orders').select('order_id')]);
    rows=data;archived=new Set((ar.data||[]).map(x=>String(x.order_id)).filter(x=>x.startsWith('pay|')));
    selected.clear();cardPos={};cardCnt={};
    rows.slice().reverse().forEach(p=>{if(p.method==='card'){cardCnt[p.order_code]=(cardCnt[p.order_code]||0)+1;cardPos[p.id]=cardCnt[p.order_code];}});
    billLinks=new Map();
    await Promise.all(rows.filter(p=>p.bill_path).map(async p=>{const {data:l,error}=await db.storage.from('payment-bills').createSignedUrl(p.bill_path,BILL_LINK_SECONDS);if(!error&&l?.signedUrl)billLinks.set(p.id,l.signedUrl);}));
    render();$('paymentMessage').textContent='Đã tải '+rows.length+' yêu cầu thanh toán. Link bill dùng được trong 24 giờ.';
  }catch(e){
    $('paymentMessage').textContent='Không tải được thanh toán: '+(e.message||e);
    $('paymentSubmissions').innerHTML='<tr><td colspan="8">Hãy chạy SETUP-THANH-TOAN-BILL-THE-CAO.sql và kiểm tra quyền Admin.</td></tr>';
  }finally{loading=false;}
}
async function setArchived(on){
  if(!selected.size||busy)return;busy=true;syncSel();
  try{
    const ids=[...selected].map(KEY);
    const q=on?db.from('admin_archived_orders').upsert(ids.map(order_id=>({order_id})),{onConflict:'order_id'}):db.from('admin_archived_orders').delete().in('order_id',ids);
    const {error}=await q;if(error)throw error;
    ids.forEach(k=>on?archived.add(k):archived.delete(k));selected.clear();
    $('paymentMessage').textContent=on?'Đã dọn bill đã chọn.':'Đã khôi phục bill đã chọn.';
  }catch(err){$('paymentMessage').textContent='Không thực hiện được: '+(err.message||err)+' (cần chạy SUPABASE-DON-DON.sql).';}
  finally{busy=false;render();}
}
$('refreshPayments')?.addEventListener('click',loadPayments);
['showPayDone','showPayArchived'].forEach(id=>$(id)?.addEventListener('change',()=>{selected.clear();render();}));
$('selectAllPay')?.addEventListener('change',e=>{selected.clear();if(e.target.checked)visible().forEach(p=>selected.add(String(p.id)));render();});
$('archivePaySelected')?.addEventListener('click',()=>setArchived(true));
$('restorePaySelected')?.addEventListener('click',()=>setArchived(false));
$('paymentSubmissions')?.addEventListener('change',e=>{const c=e.target.closest('[data-pay-check]');if(!c)return;c.checked?selected.add(c.dataset.payCheck):selected.delete(c.dataset.payCheck);syncSel();});
$('paymentSubmissions')?.addEventListener('click',async e=>{
  const b=e.target.closest('[data-payment-save]');if(!b)return;
  const id=b.dataset.paymentSave,status=$(`[data-payment-status="${id}"]`)?.value,admin_note=$(`[data-payment-note="${id}"]`)?.value||'';b.disabled=true;
  try{
    const row=await db.from('payment_submissions').select('order_code').eq('id',id).maybeSingle();if(row.error)throw row.error;if(!row.data?.order_code)throw new Error('Không tìm thấy mã đơn.');
    const {error}=await db.from('payment_submissions').update({status,admin_note,reviewed_at:new Date().toISOString()}).eq('order_code',row.data.order_code);if(error)throw error;
    const map={'Đã xác nhận':'Đã duyệt','Từ chối':'Từ chối'};
    if(map[status]){const upd=await db.from('orders').update({status:map[status]}).eq('order_code',row.data.order_code);if(upd.error)console.warn('Đã lưu thanh toán nhưng chưa cập nhật trạng thái đơn:',upd.error.message);}
    $('paymentMessage').textContent='Đã lưu trạng thái cho toàn bộ thẻ/bill của đơn.';await loadPayments();
  }catch(err){$('paymentMessage').textContent='Không lưu được: '+(err.message||err);}finally{b.disabled=false;}
});
const dashboard=$('dashboard');if(dashboard){new MutationObserver(()=>{if(!dashboard.hidden)loadPayments();}).observe(dashboard,{attributes:true,attributeFilter:['hidden']});}
$('refresh')?.addEventListener('click',()=>loadPayments());
})();
