-- BDShopVN: thông báo tự động cho tài khoản
-- Chạy một lần trong Supabase SQL Editor (đã được áp dụng trực tiếp cho project).

create or replace function public.bdshop_notify_order_status()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.user_id is not null and old.status is distinct from new.status then
    insert into public.user_notifications(user_id,title,body,source)
    values (new.user_id,'Trạng thái đơn hàng đã thay đổi',
      'Đơn ' || coalesce(new.order_code,new.id::text) || ': ' ||
      coalesce(old.status,'Chưa có trạng thái') || ' → ' ||
      coalesce(new.status,'Chưa xác định') ||
      '. Mở mục Đơn hàng để xem chi tiết.','system');
  end if;
  return new;
end; $$;

drop trigger if exists trg_bdshop_notify_order_status on public.orders;
create trigger trg_bdshop_notify_order_status
after update of status on public.orders
for each row when (old.status is distinct from new.status)
execute function public.bdshop_notify_order_status();

create or replace function public.bdshop_notify_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare display_name text;
begin
  display_name := coalesce(nullif(new.raw_user_meta_data ->> 'username',''),
    split_part(coalesce(new.email,''),'@',1),'bạn');
  insert into public.user_notifications(user_id,title,body,source)
  values (new.id,'Chào mừng bạn đến với BDShopVN! 🎉',
    'Xin chào ' || display_name ||
    '! Tài khoản của bạn đã được tạo thành công. Chúc bạn mua sắm vui vẻ và đừng quên theo dõi trạng thái đơn hàng tại mục Đơn hàng nhé.',
    'system');
  return new;
end; $$;

drop trigger if exists trg_bdshop_welcome_new_user on auth.users;
create trigger trg_bdshop_welcome_new_user
after insert on auth.users
for each row execute function public.bdshop_notify_new_user();

create or replace function public.bdshop_notify_password_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.encrypted_password is distinct from old.encrypted_password then
    insert into public.user_notifications(user_id,title,body,source)
    values (new.id,'Mật khẩu tài khoản đã được thay đổi',
      'Mật khẩu BDShopVN của bạn vừa được cập nhật thành công. Nếu không phải bạn thực hiện, hãy liên hệ Admin ngay.',
      'system');
  end if;
  return new;
end; $$;

drop trigger if exists trg_bdshop_password_changed on auth.users;
create trigger trg_bdshop_password_changed
after update of encrypted_password on auth.users
for each row when (old.encrypted_password is distinct from new.encrypted_password)
execute function public.bdshop_notify_password_change();

revoke all on function public.bdshop_notify_order_status() from public, anon, authenticated;
revoke all on function public.bdshop_notify_new_user() from public, anon, authenticated;
revoke all on function public.bdshop_notify_password_change() from public, anon, authenticated;
