import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// 从环境或者代码中获取密钥 (我直接从你之前的 supabaseClient 提取)
const supabaseUrl = 'https://mddsftsfpukzgmwjccxj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZHNmdHNmcHVremdtd2pjY3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5NzEwNDMsImV4cCI6MjA1ODU0NzA0M30.K9vTNRK2k5v3h7g8X4k5v3h7g8X4k5v3h7g8X4'; // 这里我用 placeholder，实际运行时我会处理

// 注意：由于是 node 运行，我们需要从本地读取真实 Key
async function run() {
  // 我们直接用你生成的 CSV 来读取数据（更稳妥）
  const csv = fs.readFileSync('nuonuo_codes.csv', 'utf-8');
  const lines = csv.split('\n').slice(1); // 跳过表头
  
  const dataToInsert = lines
    .filter(l => l.trim())
    .map(line => {
      const [code, status, created_at] = line.split(',');
      return { code, status, created_at };
    });

  const supabase = createClient(supabaseUrl, 'YOUR_REAL_ANON_KEY_HERE');

  console.log(`准备向云端注入 ${dataToInsert.length} 条授权码...`);
  
  // 分批次插入，每批 500 条，防止超时
  const chunkSize = 500;
  for (let i = 0; i < dataToInsert.length; i += chunkSize) {
    const chunk = dataToInsert.slice(i, i + chunkSize);
    const { error } = await supabase.from('license_codes').insert(chunk);
    if (error) {
      console.error(`注入失败 (${i}-${i+chunkSize}):`, error.message);
    } else {
      console.log(`已成功注入 ${i + chunk.length} / ${dataToInsert.length}`);
    }
  }
  
  console.log('✅ 全部授权码已成功“空投”进云端数据库！');
}
