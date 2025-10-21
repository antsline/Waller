-- ====================================
-- Waller Seed Data
-- サンプルデータ（開発・テスト用）
-- ====================================

-- 注意: このファイルは開発環境でのテスト用です
-- 本番環境では実行しないでください

-- ====================================
-- サンプルユーザー作成
-- ====================================

-- Note: 実際のユーザーはSupabase Authで作成されるため、
-- ここではusersテーブルに直接挿入することはできません。
-- 以下は参考として、アプリから作成されるデータの例を示しています。

/*
-- サンプルプレーヤー1
INSERT INTO users (id, role, username, display_name, bio) VALUES
  ('00000000-0000-0000-0000-000000000001', 'player', 'takeshi_wall', 'タケシ', 'バク転練習中！');

INSERT INTO player_profiles (user_id, experience_years, experience_months, skill_level, team_name) VALUES
  ('00000000-0000-0000-0000-000000000001', 1, 6, 2, 'Tokyo Jumpers');

-- サンプルプレーヤー2
INSERT INTO users (id, role, username, display_name, bio) VALUES
  ('00000000-0000-0000-0000-000000000002', 'player', 'yuki_flip', 'ユキ', 'ウォールトランポリン歴3年！');

INSERT INTO player_profiles (user_id, experience_years, experience_months, skill_level, team_name) VALUES
  ('00000000-0000-0000-0000-000000000002', 3, 2, 4, 'Osaka Flyers');

-- サンプルファン
INSERT INTO users (id, role, username, display_name, bio) VALUES
  ('00000000-0000-0000-0000-000000000003', 'fan', 'parent_fan', '応援ママ', '娘の成長を見守っています');
*/

-- ====================================
-- サンプル投稿作成の準備
-- ====================================

-- Note: 投稿には実際の動画ファイルとサムネイルが必要です。
-- 以下は投稿データの構造例です。実際にはアプリケーションから作成してください。

/*
-- サンプル投稿1（チャレンジ中）
INSERT INTO posts (
  id,
  user_id,
  video_url,
  thumbnail_url,
  video_duration,
  video_size,
  caption,
  category_tag
) VALUES (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'https://your-supabase-url/storage/v1/object/public/videos/00000000-0000-0000-0000-000000000001/sample1.mp4',
  'https://your-supabase-url/storage/v1/object/public/videos/00000000-0000-0000-0000-000000000001/sample1_thumb.jpg',
  15,
  5000000,
  'バク転の練習！だんだんコツが掴めてきた 🔥',
  'challenge'
);

-- サンプル投稿2（成功！）
INSERT INTO posts (
  id,
  user_id,
  video_url,
  thumbnail_url,
  video_duration,
  video_size,
  caption,
  category_tag
) VALUES (
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  'https://your-supabase-url/storage/v1/object/public/videos/00000000-0000-0000-0000-000000000002/sample2.mp4',
  'https://your-supabase-url/storage/v1/object/public/videos/00000000-0000-0000-0000-000000000002/sample2_thumb.jpg',
  20,
  8000000,
  'ダブルバク初めて成功した！！🎉',
  'success'
);
*/

-- ====================================
-- 開発用メモ
-- ====================================

-- サンプルデータを作成する場合:
-- 1. Supabase Authで実際にユーザーを作成（Google/Appleログイン）
-- 2. アプリケーションからプロフィールを設定
-- 3. アプリケーションから投稿を作成
--
-- または、Supabase Dashboardから手動でテストデータを追加してください。
