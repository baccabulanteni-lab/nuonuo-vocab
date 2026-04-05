import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

const devPreviewProxy = {
  '/api': {
    target: 'http://localhost:8787',
    changeOrigin: true,
  },
  '/supabase': {
    target: 'https://mddsftsfpukzgmwjccxj.supabase.co',
    changeOrigin: true,
    secure: false,
    rewrite: (path: string) => path.replace(/^\/supabase/, ''),
    configure: (proxy) => {
      proxy.on('error', (err, _req, _res) => {
        console.log('[Vite Proxy Error]', err);
      });
      proxy.on('proxyReq', (proxyReq, req, _res) => {
        console.log('[Vite Proxy Request]', req.method, req.url, '->', proxyReq.path);
      });
    },
  },
} as const;

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      /** 0.0.0.0：允许手机/平板通过局域网 IPv4 访问本机 */
      host: '0.0.0.0',
      /** 与 package.json 中 `npm run dev` 的 --port 3001 一致；3001 被占用时自动顺延，避免「整站打不开」 */
      port: 3001,
      strictPort: false,
      open: true,
      /** Vite 6 默认会校验 Host；用 IP 访问时常被拦截成「打不开」，开发内测时关闭 */
      allowedHosts: true as const,
      proxy: { ...devPreviewProxy },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    preview: {
      port: 3001,
      strictPort: false,
      host: '0.0.0.0',
      allowedHosts: true as const,
      /** `npm run preview` 与 dev 一致转发 /api，避免本地预览时登录请求打到静态服务器 404 */
      proxy: { ...devPreviewProxy },
    },
  };
});
