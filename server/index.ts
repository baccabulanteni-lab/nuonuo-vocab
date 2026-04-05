import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import {
  importUnusedCodesRemote,
  insertUnusedCodesRemote,
  useRemoteLicense,
} from './supabaseLicense';

const PORT = Number(process.env.API_PORT || 8787);
const ADMIN_KEY = process.env.ADMIN_KEY || 'nuonuo-admin-change-me';

const app = express();
app.use(cors());

// 详细日志
app.use((req, _res, next) => {
  console.log('[API]', req.method, req.url);
  next();
});
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Key');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

function nowIso() {
  return new Date().toISOString();
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: nowIso(), strategy: 'supabase-only' });
});

// Admin endpoints (generating/importing codes) using Supabase functionality
app.post('/api/admin/codes', (req, res) => {
  void (async () => {
    const key = String(req.header('x-admin-key') || '');
    if (key !== ADMIN_KEY) {
      res.status(401).json({ error: 'admin key 无效' });
      return;
    }
    const count = Math.max(1, Math.min(500, Number(req.body?.count || 1)));
    const prefix = String(req.body?.prefix || 'NN').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const expiresAt = req.body?.expiresAt ? String(req.body.expiresAt) : null;
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(
        `${prefix}-${crypto.randomBytes(3).toString('hex').toUpperCase()}-${crypto
          .randomBytes(3)
          .toString('hex')
          .toUpperCase()}`
      );
    }

    if (!useRemoteLicense()) {
      res.status(500).json({ error: '服务器未配置 Supabase 环境变量，无法生成授权码' });
      return;
    }

    try {
      await insertUnusedCodesRemote(codes, expiresAt);
      res.json({ ok: true, codes });
    } catch (e) {
      console.error('[admin/codes]', e);
      res.status(500).json({ error: e instanceof Error ? e.message : '写入 Supabase 失败' });
    }
  })();
});

app.post('/api/admin/codes/import', (req, res) => {
  void (async () => {
    const key = String(req.header('x-admin-key') || '');
    if (key !== ADMIN_KEY) {
      res.status(401).json({ error: 'admin key 无效' });
      return;
    }
    const raw = req.body?.codes;
    if (!Array.isArray(raw) || raw.length === 0) {
      res.status(400).json({ error: '请提供 JSON body: { "codes": ["NUONUO-XXX", ...] }' });
      return;
    }
    if (raw.length > 2000) {
      res.status(400).json({ error: '单次最多导入 2000 条' });
      return;
    }

    if (!useRemoteLicense()) {
      res.status(500).json({ error: '服务器未配置 Supabase 环境变量，无法导入授权码' });
      return;
    }

    try {
      const { inserted, skipped } = await importUnusedCodesRemote(raw);
      res.json({ ok: true, inserted, ignoredDuplicatesOrEmpty: skipped, skippedEmpty: 0 });
    } catch (e) {
      console.error('[admin/import]', e);
      res.status(500).json({ error: e instanceof Error ? e.message : '导入失败' });
    }
  })();
});

app.listen(PORT, () => {
  console.log(`Admin API running at http://localhost:${PORT}`);
  console.log(`授权码存储: Supabase (license_codes) - Frontend API routes migrated purely to JS SDK.`);
});
