create or replace function public.activate_license_code(p_code text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row record;
  v_user_id uuid;
  v_username text;
  v_email text;
  v_old_profile_id uuid;
begin
  v_user_id := auth.uid();
  v_email := auth.jwt() ->> 'email';
  
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'error', '未登录或登录信息异常');
  end if;

  v_username := split_part(v_email, '@', 1);

  -- 1. 查找是否有个“僵尸卡”占用了这个手机号
  select id into v_old_profile_id from public.profiles where username = v_username and id != v_user_id;

  if found then
    -- 2. 解绑旧授权码
    update public.license_codes 
    set bound_profile_id = null, status = 'unused' 
    where bound_profile_id = v_old_profile_id;
    
    -- 3. 安全删除僵尸卡
    delete from public.profiles where id = v_old_profile_id;
  end if;

  -- 4. 插入您的新卡片
  insert into public.profiles (id, username, license_activated)
  values (v_user_id, v_username, false)
  on conflict (id) do update set username = excluded.username;

  -- 5. 查找授权码
  select * into v_row from public.license_codes where code = p_code;
  if not found then
    return jsonb_build_object('ok', false, 'error', '授权码不存在');
  end if;

  if v_row.status = 'used' then
    if v_row.bound_profile_id = v_user_id then
      -- 补发一次更新，防止以前成功了但没写进 profiles 的情况
      update public.profiles
      set license_activated = true,
          activated_with_code = p_code
      where id = v_user_id;
      return jsonb_build_object('ok', true, 'reused', true);
    else
      return jsonb_build_object('ok', false, 'error', '授权码已被使用');
    end if;
  end if;

  -- 6. 正式绑卡 (在 license_codes 标记为已用)
  update public.license_codes
  set status = 'used',
      used_at = now(),
      bound_profile_id = v_user_id
  where code = p_code;

  -- 7. 关键同步：在 profiles 表里记录激活状态和邀请码！
  update public.profiles
  set license_activated = true,
      activated_with_code = p_code
  where id = v_user_id;

  return jsonb_build_object('ok', true);
end;
$$;
