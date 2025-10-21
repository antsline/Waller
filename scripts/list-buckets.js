// ストレージバケット一覧取得
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🗄️  ストレージバケット一覧取得\n');

async function listBuckets() {
  try {
    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
      console.log('❌ エラー:', error.message);
      console.log('詳細:', JSON.stringify(error, null, 2));
      return;
    }

    console.log('取得したバケット一覧:');
    if (!data || data.length === 0) {
      console.log('  バケットが見つかりませんでした\n');
      console.log('💡 Supabase Dashboard > Storage で以下のバケットを作成してください:');
      console.log('   1. videos (Public)');
      console.log('   2. avatars (Public)');
    } else {
      data.forEach(bucket => {
        console.log(`  - ${bucket.name} (${bucket.public ? 'Public' : 'Private'})`);
      });
    }

  } catch (err) {
    console.log('❌ 予期しないエラー:', err.message);
  }
}

listBuckets();
