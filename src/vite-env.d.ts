/// <reference types="vite/client" />

// 让项目里的 `import.meta.env.*` 在 `tsc --noEmit` 下通过类型检查。
// 这里显式声明仅覆盖我们实际会用到的变量。
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** 为空则用相对路径 `/api`（开发/同源反代）；生产可填 `https://你的后端域名` */
  readonly VITE_API_BASE_URL?: string;
  /**
   * 设为 `false` 时关闭邀请码：不请求 `/api/auth/activate`，仅本地标记已激活。
   * 默认（未设置）= 需要邀请码，与现有后端一致。
   */
  readonly VITE_REQUIRE_INVITE_CODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

