const fs = require('fs');

/**
 * 授权码生成逻辑：NUONUO-XXXXXX (6位随机字符)
 */
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 避开容易混淆的 0, 1, O, I
  let result = 'NUONUO-';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const codes = new Set();
const count = 10000;

console.log('正在计算 10,000 个唯一授权码...');

while (codes.size < count) {
  codes.add(generateCode());
}

// 准备 CSV 内容，必须匹配你的数据库列名
// code, status, created_at
let csv = 'code,status,created_at\n';
for (const code of codes) {
  const now = new Date().toISOString();
  csv += `${code},unused,${now}\n`;
}

fs.writeFileSync('nuonuo_codes.csv', csv);
console.log('✅ 10,000 个授权码已成功写入 nuonuo_codes.csv');
