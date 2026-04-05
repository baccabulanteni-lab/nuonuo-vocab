const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'server', 'data', 'nuonuo.sqlite');
const EXPORT_PATH = path.join(__dirname, 'all_25k_codes.csv');

const db = new Database(DB_PATH);
console.log('正在为您打包全量 25,004 个授权码...');

try {
  const rows = db.prepare('SELECT code, status, created_at, used_at FROM license_codes').all();
  
  let csv = 'code,status,created_at,used_at\n';
  for (const row of rows) {
    csv += `${row.code},${row.status},${row.created_at || ''},${row.used_at || ''}\n`;
  }

  fs.writeFileSync(EXPORT_PATH, csv);
  console.log(`✅ 成功导出全量文件：${EXPORT_PATH}，总计 ${rows.length} 条记录`);
} catch (e) {
  console.error('❌ 出错:', e.message);
} finally {
  db.close();
}
