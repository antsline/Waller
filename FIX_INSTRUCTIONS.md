# 🔧 カウンター更新問題の修正手順

## 問題の原因

**2つの問題が見つかりました:**

1. **RLS（Row Level Security）がトリガーをブロック**
   - `post_counters`テーブルにUPDATEポリシーが無いため、トリガーが更新できない状態でした

2. **トリガー関数のSQLエラー**
   - UPDATE時に同じカラムに2回代入しようとしていました（`reaction_fire_count = ... ; reaction_fire_count = ...`）

## 修正内容

`supabase/migrations/08_fix_counters_complete.sql` で以下を修正:
- ✅ RLSポリシーを追加（トリガーが更新できるように）
- ✅ トリガー関数を`SECURITY DEFINER`で再作成（RLSをバイパス）
- ✅ 重複代入エラーを修正（1つの式で減算+加算）
- ✅ 既存の不正確なカウントを修正

---

## 🚀 適用手順

### Supabase Dashboardで実行:

1. **Supabase Dashboard** にアクセス
   ```
   https://supabase.com/dashboard
   ```

2. **プロジェクトを選択**

3. **SQL Editor を開く**
   - 左メニューから「SQL Editor」をクリック

4. **新しいクエリを作成**
   - 「New query」ボタンをクリック

5. **修正SQLを貼り付けて実行**
   - `supabase/migrations/08_fix_counters_complete.sql` の内容を全てコピー
   - SQL Editorに貼り付け
   - 「Run」ボタンをクリック

6. **実行結果を確認**
   - 成功メッセージが表示されることを確認:
     ```
     ✅ カウンター更新の修正が完了しました
       - RLSポリシーを追加
       - トリガー関数をSECURITY DEFINERで再作成
       - 既存データを修正
     ```

---

## 🧪 動作確認

修正後、アプリで以下をテストしてください:

### 1. いいねのテスト
- [ ] いいねを押す → カウントが1増える
- [ ] もう一度押す → カウントが1減る

### 2. スタンプのテスト
- [ ] 🔥を押す → fireカウントが1増える
- [ ] 👏に変更 → fireが1減り、clapが1増える
- [ ] ✨に変更 → clapが1減り、sparkleが1増える
- [ ] 💪に変更 → sparkleが1減り、muscleが1増える

### 3. リアルタイム更新のテスト
- [ ] 別のデバイス/ブラウザで同じ投稿を開く
- [ ] 片方でスタンプを押す
- [ ] もう片方でカウントが自動更新される

---

## ❓ うまくいかない場合

エラーが出る場合は、以下の診断SQLを実行してください:

```sql
-- 1. RLSポリシーの確認
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'post_counters';

-- 2. トリガー関数の確認
SELECT proname, prosecdef
FROM pg_proc
WHERE proname IN ('update_like_count', 'update_reaction_count');

-- 3. 実際のデータ確認
SELECT
  r.post_id,
  COUNT(*) FILTER (WHERE r.reaction_type = 'fire') as actual_fire,
  COUNT(*) FILTER (WHERE r.reaction_type = 'clap') as actual_clap,
  COUNT(*) FILTER (WHERE r.reaction_type = 'sparkle') as actual_sparkle,
  COUNT(*) FILTER (WHERE r.reaction_type = 'muscle') as actual_muscle,
  pc.reaction_fire_count,
  pc.reaction_clap_count,
  pc.reaction_sparkle_count,
  pc.reaction_muscle_count
FROM reactions r
LEFT JOIN post_counters pc ON pc.post_id = r.post_id
GROUP BY r.post_id, pc.reaction_fire_count, pc.reaction_clap_count,
         pc.reaction_sparkle_count, pc.reaction_muscle_count;
```

エラー内容と診断結果を報告してください。
