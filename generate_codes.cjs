const fs = require('fs');
const path = require('path');

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
  let result = 'NUONUO-';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const codes = new Set();
const count = 5000;

console.log('正在计算 5,000 个唯一授权码...');

while (codes.size < count) {
  codes.add(generateCode());
}

let csv = 'code,status,created_at\n';
for (const code of codes) {
  const now = new Date().toISOString();
  csv += `${code},unused,${now}\n`;
}

// 写入当前目录
const targetPath = path.join(process.cwd(), 'nuonuo_codes.csv');
fs.writeFileSync(targetPath, csv);
console.log(`✅ 10,000 个授权码已成功写入 ${targetPath}`);
