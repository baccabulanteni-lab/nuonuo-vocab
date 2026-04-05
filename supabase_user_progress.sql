-- Supabase schema: user_progress (v1)
-- 用途：跨设备同步学习进度（cloud sync 的“单行 jsonb”载体）
--
-- 在 Supabase Dashboard -> SQL Editor 执行即可。

create table if not exists public.user_progress (
  profile_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_progress enable row level security;

-- SELECT：仅允许读取自己的行
drop policy if exists "user_progress_select_own" on public.user_progress;
create policy "user_progress_select_own"
  on public.user_progress for select
  using (profile_id = auth.uid());

-- INSERT：仅允许插入自己的行
drop policy if exists "user_progress_insert_own" on public.user_progress;
create policy "user_progress_insert_own"
  on public.user_progress for insert
  with check (profile_id = auth.uid());

-- UPDATE：仅允许更新自己的行
drop policy if exists "user_progress_update_own" on public.user_progress;
create policy "user_progress_update_own"
  on public.user_progress for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

