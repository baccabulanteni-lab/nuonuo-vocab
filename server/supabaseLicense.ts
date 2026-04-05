import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

/** 绑定到本应用自建账号（手机号）的列名；需在 Supabase 执行 server/supabase-license-migration.sql */
const BOUND_USERNAME_COL_RAW =
  process.env.LICENSE_BOUND_USERNAME_COLUMN?.trim() || 'bound_username';
if (!/^[a-z_][a-z0-9_]*$/i.test(BOUND_USERNAME_COL_RAW)) {
  throw new Error('LICENSE_BOUND_USERNAME_COLUMN 仅允许字母、数字、下划线');
}
const BOUND_USERNAME_COL = BOUND_USERNAME_COL_RAW;

export function useRemoteLicense(): boolean {
  return !!(url && serviceKey);
}

let _sb: SupabaseClient | null = null;
function sb(): SupabaseClient {
  if (!url || !serviceKey) throw new Error('缺少 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY');
  if (!_sb) {
    _sb = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _sb;
}

export async function userLicenseActiveRemote(username: string): Promise<boolean> {
  const u = username.trim().toLowerCase();
  const { data, error } = await sb()
    .from('license_codes')
    .select('id')
    .eq(BOUND_USERNAME_COL, u)
    .eq('status', 'used')
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('[license] Supabase 查询激活状态失败:', error.message);
    return false;
  }
  return !!data;
}

export type ActivateRemoteResult =
  | { ok: true; reused?: boolean }
  | { ok: false; status: number; error: string };

export async function activateLicenseRemote(
  username: string,
  rawCode: string
): Promise<ActivateRemoteResult> {
  const u = username.trim().toLowerCase();
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, status: 400, error: '请输入授权码' };

  const { data: row, error: selErr } = await sb()
    .from('license_codes')
    .select(`id, code, status, expires_at, ${BOUND_USERNAME_COL}`)
    .eq('code', code)
    .maybeSingle();

  if (selErr) {
    console.error('[license] Supabase 查询授权码失败:', selErr.message);
    return { ok: false, status: 503, error: '授权服务暂不可用' };
  }
  if (!row) return { ok: false, status: 404, error: '授权码不存在' };

  const r = row as Record<string, unknown>;
  const status = String(r.status ?? '');
  const bound = r[BOUND_USERNAME_COL] != null ? String(r[BOUND_USERNAME_COL]).toLowerCase() : '';

  if (status === 'used') {
    if (bound && bound === u) return { ok: true, reused: true };
    return { ok: false, status: 400, error: '授权码已被使用' };
  }

  const exp = r.expires_at;
  if (exp && typeof exp === 'string' && new Date(exp).getTime() < Date.now()) {
    return { ok: false, status: 400, error: '授权码已过期' };
  }

  const now = new Date().toISOString();
  const patch: Record<string, string> = {
    status: 'used',
    used_at: now,
    [BOUND_USERNAME_COL]: u,
  };

  const { data: updatedRows, error: upErr } = await sb()
    .from('license_codes')
    .update(patch)
    .eq('id', r.id as string | number)
    .eq('status', 'unused')
    .select('id');

  if (upErr) {
    console.error('[license] Supabase 核销失败:', upErr.message);
    return { ok: false, status: 500, error: '激活失败，请稍后重试' };
  }
  if (!updatedRows?.length) {
    const { data: again } = await sb()
      .from('license_codes')
      .select(BOUND_USERNAME_COL)
      .eq('code', code)
      .maybeSingle();
    const ag = again as Record<string, unknown> | null;
    const b2 =
      ag && ag[BOUND_USERNAME_COL] != null ? String(ag[BOUND_USERNAME_COL]).toLowerCase() : '';
    if (b2 === u) return { ok: true, reused: true };
    return { ok: false, status: 400, error: '授权码已被使用' };
  }

  return { ok: true };
}

export async function insertUnusedCodesRemote(
  codes: string[],
  expiresAt: string | null
): Promise<void> {
  const now = new Date().toISOString();
  const rows = codes.map((code) => ({
    code: code.toUpperCase(),
    status: 'unused',
    created_at: now,
    expires_at: expiresAt,
  }));
  const { error } = await sb().from('license_codes').insert(rows);
  if (error) throw new Error(error.message);
}

/** 逐条插入，重复 code 则跳过（用于 admin import） */
export async function importUnusedCodesRemote(codes: string[]): Promise<{
  inserted: number;
  skipped: number;
}> {
  const now = new Date().toISOString();
  let inserted = 0;
  let skipped = 0;
  for (const raw of codes) {
    const code = String(raw ?? '').trim().toUpperCase();
    if (!code) {
      skipped++;
      continue;
    }
    const { error } = await sb().from('license_codes').insert({
      code,
      status: 'unused',
      created_at: now,
      expires_at: null,
    });
    if (error) {
      if (error.code === '23505' || /duplicate|unique/i.test(error.message)) skipped++;
      else throw new Error(error.message);
    } else inserted++;
  }
  return { inserted, skipped };
}
