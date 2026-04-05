const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'server', 'data', 'nuonuo.sqlite');
const EXPORT_PATH = path.join(__dirname, 'new_20k_import.csv');

const db = new Database(DB_PATH);
console.log('正在生成纯净版导入文件 (已排除旧码以避免冲突)...');

try {
  // 排除掉已知的 5 个旧码
  const excludeList = ["'NN-VIP-7777'", "'NN-VIP-8888'", "'NN-VIP-9999'", "'NUONUO'", "'NUONUO-324N6AU'"].join(',');
  const rows = db.prepare(`SELECT code, status, created_at FROM license_codes WHERE code NOT IN (${excludeList})`).all();
  
  let csv = 'code,status,created_at\n';
  for (const row of rows) {
    csv += `${row.code},${row.status},${row.created_at || ''}\n`;
  }

  fs.writeFileSync(EXPORT_PATH, csv);
  console.log(`✅ 成功生成纯净版文件：${EXPORT_PATH}，共 ${rows.length} 条记录`);
} catch (e) {
  console.error('❌ 出错:', e.message);
} finally {
  db.close();
}
