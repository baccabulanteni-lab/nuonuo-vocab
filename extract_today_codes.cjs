const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'server', 'data', 'nuonuo.sqlite');
const EXPORT_PATH = path.join(__dirname, 'pure_new_20k.csv');

const db = new Database(DB_PATH);
console.log('正在精准提取今日生成的 20,000 个全新授权码...');

try {
  // 筛选今天 (2026-04-05) 生成的码
  const rows = db.prepare("SELECT code, status, created_at FROM license_codes WHERE created_at LIKE '2026-04-05%'").all();
  
  if (rows.length === 0) {
    throw new Error('未在数据库中找到今日生成的记录，请确认生成脚本是否执行成功。');
  }

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
