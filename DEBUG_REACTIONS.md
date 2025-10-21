# リアクションカウント問題のデバッグ手順

## 問題
スタンプを押しても変更してもカウントが0のまま

## 確認手順

### Step 1: Supabase Dashboardでデータを確認

#### 1-1. reactionsテーブルを確認
1. Supabase Dashboard > Table Editor > reactions
2. スタンプを押した後、レコードが追加されているか確認
3. 確認項目:
   - `post_id`: 投稿ID
   - `user_id`: ユーザーID
   - `reaction_type`: fire/clap/sparkle/muscle
   - `created_at`, `updated_at`: タイムスタンプ

**期待される動作:** スタンプを押すとレコードが追加される

#### 1-2. post_countersテーブルを確認
1. Supabase Dashboard > Table Editor > post_counters
2. 該当する投稿のカウンターを確認
3. 確認項目:
   - `like_count`: いいねの数
   - `reaction_fire_count`: 🔥の数
   - `reaction_clap_count`: 👏の数
   - `reaction_sparkle_count`: ✨の数
   - `reaction_muscle_count`: 💪の数

**期待される動作:** スタンプを押すと対応するカウントが増える

---

### Step 2: トリガーが動作しているか確認

#### 2-1. トリガーの存在確認
Supabase Dashboard > SQL Editor で以下を実行:

```sql
-- トリガーが存在するか確認
SELECT * FROM pg_trigger WHERE tgname = 'trigger_update_reaction_count';
```

**期待される結果:** 1行返ってくる

#### 2-2. トリガー関数の確認
```sql
-- トリガー関数を確認
SELECT proname, prosrc FROM pg_proc WHERE proname = 'update_reaction_count';
```

**期待される結果:** update_reaction_count関数が存在する

---

### Step 3: 手動でカウントを確認

#### 3-1. 実際のリアクション数をカウント
```sql
-- 投稿ごとのリアクション数を集計
SELECT
  post_id,
  COUNT(*) FILTER (WHERE reaction_type = 'fire') as fire_count,
  COUNT(*) FILTER (WHERE reaction_type = 'clap') as clap_count,
  COUNT(*) FILTER (WHERE reaction_type = 'sparkle') as sparkle_count,
  COUNT(*) FILTER (WHERE reaction_type = 'muscle') as muscle_count
FROM reactions
GROUP BY post_id;
```

#### 3-2. post_countersと比較
```sql
-- post_countersの値を確認
SELECT
  post_id,
  reaction_fire_count,
  reaction_clap_count,
  reaction_sparkle_count,
  reaction_muscle_count
FROM post_counters;
```

**確認:** 両方の結果が一致するか？

---

### Step 4: トリガーを手動で再作成

もしトリガーが動作していない場合、以下を実行:

```sql
-- 既存のトリガーを削除
DROP TRIGGER IF EXISTS trigger_update_reaction_count ON reactions;

-- トリガーを再作成
CREATE TRIGGER trigger_update_reaction_count
  AFTER INSERT OR UPDATE OR DELETE ON reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_reaction_count();
```

---

### Step 5: カウントを手動で修正（一時的な対処）

データが不整合な場合、手動で修正:

```sql
-- カウントを正しい値に更新
UPDATE post_counters pc
SET
  reaction_fire_count = (SELECT COUNT(*) FROM reactions WHERE post_id = pc.post_id AND reaction_type = 'fire'),
  reaction_clap_count = (SELECT COUNT(*) FROM reactions WHERE post_id = pc.post_id AND reaction_type = 'clap'),
  reaction_sparkle_count = (SELECT COUNT(*) FROM reactions WHERE post_id = pc.post_id AND reaction_type = 'sparkle'),
  reaction_muscle_count = (SELECT COUNT(*) FROM reactions WHERE post_id = pc.post_id AND reaction_type = 'muscle'),
  like_count = (SELECT COUNT(*) FROM likes WHERE post_id = pc.post_id);
```

---

## 結果報告

上記の手順を実行して、以下を教えてください：

1. reactionsテーブルにデータは入っていますか？
2. post_countersの値はどうなっていますか？
3. トリガーは存在していますか？
4. 手動集計とpost_countersの値は一致していますか？

これらの情報をもとに問題を特定します。
