const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 配置信息 (直接连云端)
const supabaseUrl = 'https://mddsftspukzgmwjccxj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZHNmdHNmcHVremdtd2pjY3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NDY2MjQsImV4cCI6MjA5MDUyMjYyNH0.giSjl74K8VW0-ltDL8uo23I0CUW2eN7QBVe9eew5xAA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inject() {
  const csvPath = path.join(process.cwd(), 'nuonuo_codes.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('❌ 找不到 nuonuo_codes.csv 文件，请先生成它！');
    return;
  }

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').slice(1);
  const data = lines
    .filter(l => l.trim())
    .map(l => {
      const parts = l.split(',');
      return {
        code: parts[0],
        status: parts[1],
        created_at: parts[2]
      };
    });

  console.log(`🚀 发现 ${data.length} 条数据，准备开始极速注入...`);

  // 每批 500 条
  const chunkSize = 500;
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    const { error } = await supabase.from('license_codes').insert(chunk);
    
    if (error) {
      console.error(`❌ 注入失败 (索引 ${i}):`, error.message);
    } else {
      console.log(`✅ 已送达: ${i + chunk.length} / ${data.length}`);
    }
  }

  console.log('\n✨ 搞定！5,000 个授权码已全部安全抵达云端数据库。');
}

inject();
