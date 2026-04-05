-- Supabase License RPC: activate_license_code
-- 用途：允许前端在用户登录后安全地校验并激活授权码。
--
-- 在 Supabase Dashboard -> SQL Editor 执行即可。
-- 注意：此功能使用 `SECURITY DEFINER`，可以绕过 RLS 修改记录。内部做了严谨校验以确保安全。

create or replace function public.activate_license_code(p_code text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row record;
  v_username text;
  v_email text;
begin
  -- 1. 获取当前调用请求的用户的 email
  -- 因为我们在前端把用户名处理成了 `username@nuonuo.local`
  v_email := auth.jwt() ->> 'email';
  if v_email is null or v_email = '' then
    return jsonb_build_object('ok', false, 'error', '未登录或登录信息异常');
  end if;

  -- 提取真正的前半部分 username
  v_username := split_part(v_email, '@', 1);

  -- 2. 查找授权码
  select * into v_row from public.license_codes where code = p_code;
  if not found then
    return jsonb_build_object('ok', false, 'error', '授权码不存在');
  end if;

  -- 3. 判断是否已使用
  if v_row.status = 'used' then
    if v_row.bound_username = v_username then
      return jsonb_build_object('ok', true, 'reused', true);
    else
      return jsonb_build_object('ok', false, 'error', '授权码已被使用');
    end if;
  end if;

  -- 4. 判断是否过期
  if v_row.expires_at is not null and v_row.expires_at < now() then
    return jsonb_build_object('ok', false, 'error', '授权码已过期');
  end if;

  -- 5. 执行更新
  update public.license_codes
  set status = 'used',
      used_at = now(),
      bound_username = v_username
  where id = v_row.id;

  return jsonb_build_object('ok', true);
end;
$$;
