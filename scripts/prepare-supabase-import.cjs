const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'all_invitation_codes.csv');
const outputPath = path.join(__dirname, 'supabase_import_ready.csv');

try {
  const content = fs.readFileSync(inputPath, 'utf8');
  const lines = content.split(/\r?\n/);
  
  // 提取包含 "NUONUO-" 的行
  const validCodes = [];
  for (const line of lines) {
    if (line.includes('NUONUO-')) {
      const match = line.match(/NUONUO-[A-Z0-9]+/);
      if (match) {
        validCodes.push(match[0]);
      }
    }
  }

  // 构建标准 Supabase CSV (列名必须匹配表结构)
  // 表结构：code (text), status (text), created_at (timestamptz)
  let csv = 'code,status,updated_at\n';
  const now = new Date().toISOString();
  for (const code of validCodes) {
    csv += `${code},unused,${now}\n`;
  }

  fs.writeFileSync(outputPath, csv);
  console.log(`✅ 成功清洗 ${validCodes.length} 个授权码，已保存至 ${outputPath}`);
} catch (e) {
  console.error('清洗失败:', e.message);
}
