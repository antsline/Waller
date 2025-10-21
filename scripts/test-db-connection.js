// Supabaseデータベース接続テスト
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔌 Supabaseデータベース接続テスト\n');

async function testConnection() {
  try {
    // usersテーブルの存在確認（件数取得）
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log('❌ データベース接続エラー:');
      console.log(`   ${error.message}`);
      console.log('\n💡 確認ポイント:');
      console.log('   1. Supabase SQLエディタでマイグレーションを実行しましたか？');
      console.log('   2. テーブルが正しく作成されていますか？');
      console.log('   3. RLSポリシーが設定されていますか？');
      process.exit(1);
    }

    console.log('✅ データベース接続成功！');
    console.log(`   usersテーブル: ${count || 0}件のレコード`);

    // 他のテーブルも確認
    const tables = ['player_profiles', 'posts', 'likes', 'reactions', 'post_counters', 'reports', 'deletion_logs'];

    console.log('\n📊 テーブル確認:');
    for (const table of tables) {
      const { count: tableCount, error: tableError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (tableError) {
        console.log(`   ❌ ${table}: エラー`);
      } else {
        console.log(`   ✅ ${table}: ${tableCount || 0}件`);
      }
    }

    // ストレージバケット確認
    console.log('\n🗄️  ストレージバケット確認:');
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) {
      console.log('   ⚠️  ストレージ情報取得エラー');
    } else {
      const videosBucket = buckets.find(b => b.name === 'videos');
      const avatarsBucket = buckets.find(b => b.name === 'avatars');

      console.log(`   ${videosBucket ? '✅' : '❌'} videos バケット`);
      console.log(`   ${avatarsBucket ? '✅' : '❌'} avatars バケット`);
    }

    console.log('\n🎉 すべての接続テストが完了しました！');
    console.log('\n次のステップ:');
    console.log('   npm start でアプリを起動できます');

  } catch (err) {
    console.log('❌ 予期しないエラー:');
    console.log(`   ${err.message}`);
    process.exit(1);
  }
}

testConnection();
