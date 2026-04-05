const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'server', 'data', 'nuonuo.sqlite');
const EXPORT_PATH = path.join(__dirname, 'all_25k_codes_NEW.csv');

const db = new Database(DB_PATH);
console.log('正在为您生成全新的全量导出文件...');

try {
  const rows = db.prepare('SELECT code, status, created_at, used_at FROM license_codes').all();
  
  let csv = '\ufeffcode,status,created_at,used_at\n'; // 加入 BOM 确保 Excel 识别 UTF-8
  for (const row of rows) {
    csv += `${row.code},${row.status},${row.created_at || ''},${row.used_at || ''}\n`;
  }

  fs.writeFileSync(EXPORT_PATH, csv, 'utf-8');
  
  const stats = fs.statSync(EXPORT_PATH);
  console.log(`✅ 成功生成新文件：${EXPORT_PATH}`);
  console.log(`📊 记录数: ${rows.length}, 文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
} catch (e) {
  console.error('❌ 出错:', e.message);
} finally {
  db.close();
}
