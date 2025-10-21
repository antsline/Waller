-- ====================================
-- 新規登録時にNULL許可 (ロール選択・プロフィール設定前)
-- ====================================

-- role, username, display_name を NULL 許可に変更
ALTER TABLE users
  ALTER COLUMN role DROP NOT NULL,
  ALTER COLUMN username DROP NOT NULL,
  ALTER COLUMN display_name DROP NOT NULL;

-- ただし、プロフィール設定完了時にはこれらが必須になるよう、
-- 後で制約を追加する想定（アプリ側で保証）
