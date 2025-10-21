-- ====================================
-- 診断SQL: カウンター問題の原因特定
-- ====================================

-- 1. reactionsテーブルにデータが入っているか確認
SELECT
  post_id,
  user_id,
  reaction_type,
  created_at,
  updated_at
FROM reactions
ORDER BY created_at DESC
LIMIT 10;

-- 2. likesテーブルにデータが入っているか確認
SELECT
  post_id,
  user_id,
  created_at
FROM likes
ORDER BY created_at DESC
LIMIT 10;

-- 3. post_countersの現在の値を確認
SELECT
  post_id,
  like_count,
  reaction_fire_count,
  reaction_clap_count,
  reaction_sparkle_count,
  reaction_muscle_count,
  updated_at
FROM post_counters
ORDER BY updated_at DESC;

-- 4. 実際のカウントと比較
SELECT
  p.id as post_id,
  (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as actual_like_count,
  (SELECT COUNT(*) FROM reactions WHERE post_id = p.id AND reaction_type = 'fire') as actual_fire_count,
  (SELECT COUNT(*) FROM reactions WHERE post_id = p.id AND reaction_type = 'clap') as actual_clap_count,
  (SELECT COUNT(*) FROM reactions WHERE post_id = p.id AND reaction_type = 'sparkle') as actual_sparkle_count,
  (SELECT COUNT(*) FROM reactions WHERE post_id = p.id AND reaction_type = 'muscle') as actual_muscle_count,
  pc.like_count as counter_like_count,
  pc.reaction_fire_count as counter_fire_count,
  pc.reaction_clap_count as counter_clap_count,
  pc.reaction_sparkle_count as counter_sparkle_count,
  pc.reaction_muscle_count as counter_muscle_count
FROM posts p
LEFT JOIN post_counters pc ON pc.post_id = p.id
WHERE p.status = 'published'
ORDER BY p.created_at DESC;

-- 5. トリガーが存在するか確認
SELECT
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname IN ('trigger_update_like_count', 'trigger_update_reaction_count')
ORDER BY tgname;

-- 6. トリガー関数がSECURITY DEFINERか確認
SELECT
  proname as function_name,
  prosecdef as is_security_definer
FROM pg_proc
WHERE proname IN ('update_like_count', 'update_reaction_count');

-- 7. RLSポリシーを確認
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'post_counters'
ORDER BY policyname;
