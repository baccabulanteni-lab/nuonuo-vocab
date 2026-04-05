import { createClient } from '@supabase/supabase-js';
import Database from 'better-sqlite3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const DB_PATH = path.resolve(process.cwd(), 'server', 'data', 'nuonuo.sqlite');
const db = new Database(DB_PATH);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function sync() {
  console.log('🔄 Starting Cloud-to-Local Sync...');

  // 1. Fetch from Supabase
  const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
  const { data: codes, error: cError } = await supabase.from('license_codes').select('*');

  if (pError || cError) {
    console.error('Error fetching from Supabase:', pError || cError);
    return;
  }

  console.log(`Fetched ${profiles?.length} profiles and ${codes?.length} codes.`);

  // 2. Sync to SQLite
  const now = new Date().toISOString();
  
  const userInsert = db.prepare(`
    INSERT OR IGNORE INTO users (username, password_hash, created_at)
    VALUES (?, ?, ?)
  `);
  
  const codeInsert = db.prepare(`
    INSERT OR IGNORE INTO license_codes (code, status, bound_user_id, created_at, used_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  db.transaction(() => {
    // Sync Users
    for (const p of profiles || []) {
      // Note: Supabase passwords aren't visible, so we set a default or dummy hash 
      // User will need to register if they forgot, or we can use nuonuo:hash for now
      // Actually, we'll use a special 'nuonuo:password' hash for those synced from cloud
      // (User will have to use 'nuonuo' as password if we can't get theirs)
      userInsert.run(p.username, 'nuonuo:password', p.created_at || now);
    }

    // Sync Codes
    for (const c of codes || []) {
      // Find the local user ID by username (we need to map Supabase UUID to SQLite ID)
      const u = db.prepare('SELECT id FROM users WHERE username = ?').get(c.bound_user_name || '') as { id: number } | undefined;
      codeInsert.run(
        c.code.toUpperCase(),
        c.status === 'used' ? 'used' : 'unused',
        u?.id || null,
        c.created_at || now,
        c.used_at || null
      );
    }
  })();

  console.log('✅ Sync Completed Successfully.');
}

sync().catch(console.error);
