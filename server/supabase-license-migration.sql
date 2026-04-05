-- 在 Supabase → SQL Editor 执行一次即可。
-- 自建 Node API（server/index.ts）在配置 SUPABASE_SERVICE_ROLE_KEY 后，
-- 会在核销授权码时写入该列，用于绑定「手机号/用户名」与已使用码（登录时据此判断 licenseActivated）。

alter table public.license_codes
  add column if not exists bound_username text;

comment on column public.license_codes.bound_username is
  '糯糯背单词自建登录账号（小写），与 SQLite users.username 对应；非 Supabase Auth 的 user id。';

create index if not exists license_codes_bound_username_used_idx
  on public.license_codes (bound_username)
  where status = 'used';
