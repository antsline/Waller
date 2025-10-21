// Supabase接続テストスクリプト
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Supabase環境変数チェック\n');

// 1. 環境変数の存在確認
if (!supabaseUrl) {
  console.log('❌ EXPO_PUBLIC_SUPABASE_URL が設定されていません');
  process.exit(1);
} else {
  console.log('✅ EXPO_PUBLIC_SUPABASE_URL が設定されています');
  console.log(`   URL: ${supabaseUrl.substring(0, 30)}...`);
}

if (!supabaseAnonKey) {
  console.log('❌ EXPO_PUBLIC_SUPABASE_ANON_KEY が設定されていません');
  process.exit(1);
} else {
  console.log('✅ EXPO_PUBLIC_SUPABASE_ANON_KEY が設定されています');
  console.log(`   KEY: ${supabaseAnonKey.substring(0, 30)}...`);
}

// 2. URL形式チェック
if (!supabaseUrl.startsWith('https://')) {
  console.log('\n⚠️  警告: URLは https:// で始まる必要があります');
  process.exit(1);
}

if (!supabaseUrl.includes('.supabase.co')) {
  console.log('\n⚠️  警告: URLに .supabase.co が含まれていません');
  process.exit(1);
}

// 3. API Key形式チェック
if (!supabaseAnonKey.startsWith('eyJ')) {
  console.log('\n⚠️  警告: Anon Keyは eyJ で始まるJWTトークンである必要があります');
  process.exit(1);
}

console.log('\n✨ すべてのチェックが完了しました！');
console.log('\n次のステップ:');
console.log('  npm start を実行してアプリを起動してください');
