const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'server', 'data', 'nuonuo.sqlite');
const EXPORT_PATH = path.join(__dirname, 'all_25k_codes.csv');

const db = new Database(DB_PATH);
console.log('正在重新扫描并提取数据库（25,004 条）...');

try {
  const rows = db.prepare('SELECT code, status, created_at, used_at FROM license_codes').all();
  console.log(`从数据库读取到 ${rows.length} 条记录。`);

  let csv = 'code,status,created_at,used_at\n';
  for (const row of rows) {
    csv += `${row.code},${row.status},${row.created_at || ''},${row.used_at || ''}\n`;
  }

  // 写入并验证
  fs.writeFileSync(EXPORT_PATH, csv, 'utf-8');
  
  const stats = fs.statSync(EXPORT_PATH);
  console.log(`✅ 成功导出全量文件！路径: ${EXPORT_PATH}`);
  console.log(`📊 实际文件大小: ${stats.size} 字节`);

  if (stats.size < 100) {
    console.error('❌ 警告：文件大小异常（过小），请检查数据库查询结果！');
  }
} catch (e) {
  console.error('❌ 导出过程中出错:', e.message);
} finally {
  db.close();
}
