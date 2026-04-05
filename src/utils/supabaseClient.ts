import { createClient } from '@supabase/supabase-js';

/**
 * 核心修复：Supabase 客户端强制要求以 http(s):// 开头。
 * 这里我们动态拼接本地开发地址，确保通过 Vite Proxy 代理转发。
 */
const getCorrectUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:3001/supabase';
  // 确保拿到的地址形如 http://localhost:3001/supabase
  return window.location.origin + '/supabase';
};

const supabaseUrlFromEnv = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const supabaseAnonKeyFromEnv = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

const resolvedSupabaseUrl = supabaseUrlFromEnv || getCorrectUrl();

if (!supabaseAnonKeyFromEnv) {
  // 只在缺 env 时给出更明确的报错（便于你在部署环境中排查）。
  throw new Error('[Supabase] 缺少 VITE_SUPABASE_ANON_KEY，请在 .env 配置后重启开发服务器。');
}

export const supabase = createClient(resolvedSupabaseUrl, supabaseAnonKeyFromEnv);

/**
 * 为“需要 RLS auth.uid()”的数据库请求显式绑定 access token。
 * 注意：当使用 `accessToken` 选项时，不能再通过该 client 调用 `supabase.auth.*`。
 */
export function createSupabaseClientWithAccessToken(accessToken: string) {
  return createClient(resolvedSupabaseUrl, supabaseAnonKeyFromEnv, {
    accessToken: async () => accessToken,
  });
}
