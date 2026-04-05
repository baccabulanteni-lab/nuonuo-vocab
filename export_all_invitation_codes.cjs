const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'server', 'data', 'nuonuo.sqlite');
const EXPORT_PATH = path.join(__dirname, 'all_invitation_codes.csv');

const db = new Database(DB_PATH);

console.log('正在导出所有邀请码...');

try {
  const rows = db.prepare('SELECT id, code, status, bound_user_id, created_at, used_at FROM license_codes').all();
  
  // CSV Header
  let csv = 'ID,邀请码,状态,绑定用户ID,创建时间,使用时间\n';
  
  for (const row of rows) {
    const line = [
      row.id,
      row.code,
      row.status,
      row.bound_user_id || '',
      row.created_at || '',
      row.used_at || ''
    ].map(val => `"${val}"`).join(',');
    csv += line + '\n';
  }

  fs.writeFileSync(EXPORT_PATH, csv);
  console.log(`\n✅ 成功导出！`);
  console.log(`文件路径：${EXPORT_PATH}`);
  console.log(`总计条数：${rows.length}`);
  
  // Show a summary of statuses
  const stats = rows.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
  }, {});
  
  console.log('\n统计信息：');
  for (const [status, count] of Object.entries(stats)) {
    console.log(`- ${status}: ${count}`);
  }

} catch (e) {
  console.error('❌ 出错:', e.message);
} finally {
  db.close();
}
