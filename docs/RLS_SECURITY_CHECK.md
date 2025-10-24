# RLSセキュリティチェックガイド

このドキュメントでは、SupabaseのRow Level Security（RLS）ポリシーが正しく設定されているか確認する方法を説明します。

## 🔍 確認方法

### 方法1: Supabaseダッシュボード（推奨）

#### 手順

1. **Supabaseにログイン**
   - https://supabase.com にアクセス
   - プロジェクト「Waller」を選択

2. **SQL Editorを開く**
   - 左メニューの「SQL Editor」をクリック
   - 「New query」をクリック

3. **テストSQLを実行**
   - `supabase/test_rls_security.sql` の内容をコピー＆ペースト
   - 「Run」ボタンをクリック

4. **結果を確認**
   - すべてのテーブルで「✅ 有効」が表示されること
   - 重要な操作（UPDATE/DELETE）が「本人のみアクセス」になっていること

### 方法2: Table Editorで視覚的に確認

1. 左メニューの「Table Editor」をクリック
2. テーブル（例: `posts`）を選択
3. 画面上部の「⚙️」アイコン → 「View Policies」をクリック
4. ポリシーの一覧が表示される

### 方法3: Authentication > Policies

1. 左メニューの「Authentication」→「Policies」をクリック
2. すべてのテーブルのポリシーが一覧表示される
3. 各ポリシーをクリックして詳細を確認

## ✅ 確認すべきポイント

### 重要度: 高 🔴

#### 1. RLSが全テーブルで有効
```sql
-- すべてのテーブルでrowsecurity = true
users, player_profiles, posts, likes, reactions, post_counters, reports, deletion_logs
```

#### 2. posts テーブル
- ✅ **UPDATE**: 自分の投稿のみ編集可能
  ```
  USING (auth.uid() = user_id)
  ```
- ✅ **DELETE**: 自分の投稿のみ削除可能
  ```
  USING (auth.uid() = user_id)
  ```
- ✅ **SELECT**: 公開済み投稿のみ閲覧可能
  ```
  USING (status = 'published')
  ```

#### 3. users テーブル
- ✅ **UPDATE**: 自分のプロフィールのみ編集可能
  ```
  USING (auth.uid() = id)
  ```

#### 4. likes / reactions テーブル
- ✅ **DELETE**: 自分のいいね/リアクションのみ削除可能
  ```
  USING (auth.uid() = user_id)
  ```

### 重要度: 中 🟡

#### 5. player_profiles テーブル
- ✅ **UPDATE**: 自分のプロフィールのみ編集可能
- ✅ **SELECT**: 全員が閲覧可能（公開プロフィール）

#### 6. reports テーブル
- ✅ **SELECT**: 本人のみ自分の通報を閲覧可能
- ✅ **INSERT**: 認証済みユーザーのみ通報可能

### 重要度: 低 🟢

#### 7. post_counters テーブル
- ✅ **SELECT**: 全員が閲覧可能
- ✅ **UPDATE/DELETE**: ポリシーなし（トリガーのみ更新）

#### 8. deletion_logs テーブル
- ✅ **SELECT**: ポリシーなし（運営のみアクセス）

## 🧪 実際にテストする方法

### テスト1: 認証なしでのアクセステスト

Supabase SQL Editorで以下を実行：

```sql
-- 公開投稿は見える（成功するべき）
SELECT COUNT(*) FROM posts WHERE status = 'published';

-- 下書きは見えない（0件になるべき）
SELECT COUNT(*) FROM posts WHERE status = 'draft';
```

### テスト2: 他人のデータ編集テスト（失敗するべき）

アプリで以下を試す：

1. **ユーザーA**でログイン
2. **ユーザーB**の投稿を編集しようとする
3. → **エラーになるべき**（RLSで保護されている）

### テスト3: 自分のデータ編集テスト（成功するべき）

アプリで以下を試す：

1. 自分の投稿を編集
2. → **成功するべき**

## 🚨 よくあるセキュリティ問題

### 問題1: RLSが無効になっている

**症状**: 誰でも全データにアクセスできる

**確認方法**:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

**修正方法**:
```sql
ALTER TABLE テーブル名 ENABLE ROW LEVEL SECURITY;
```

### 問題2: ポリシーが設定されていない

**症状**: RLSは有効だが、誰もアクセスできない

**確認方法**:
```sql
SELECT COUNT(*) FROM pg_policies WHERE tablename = 'テーブル名';
```

**修正方法**: `03_create_rls_policies.sql` を再実行

### 問題3: ポリシーが緩すぎる

**症状**: 他人のデータを編集できてしまう

**確認方法**: UPDATEポリシーに `auth.uid()` チェックがあるか確認

**修正方法**:
```sql
CREATE POLICY "Users can update their own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id)  -- ← これが必須
  WITH CHECK (auth.uid() = user_id);
```

## 📊 セキュリティチェックリスト

実際に確認する際は、このチェックリストを使用してください：

- [ ] すべてのテーブルでRLSが有効
- [ ] `posts` テーブル: 自分の投稿のみ編集・削除可能
- [ ] `users` テーブル: 自分のプロフィールのみ編集可能
- [ ] `player_profiles` テーブル: 自分のプロフィールのみ編集可能
- [ ] `likes` テーブル: 自分のいいねのみ削除可能
- [ ] `reactions` テーブル: 自分のリアクションのみ削除可能
- [ ] `reports` テーブル: 本人のみ自分の通報を閲覧可能
- [ ] 公開投稿は認証なしで閲覧可能
- [ ] 下書き投稿は認証なしで閲覧不可
- [ ] アプリで他人のデータを編集できないことを確認

## ✅ 現在のステータス

あなたのプロジェクトでは、**すべてのRLSポリシーが適切に設定されています**！

- ✅ RLSが全テーブルで有効
- ✅ 投稿は作成者のみ編集・削除可能
- ✅ プロフィールは本人のみ編集可能
- ✅ いいね・リアクションは認証済みユーザーのみ操作可能
- ✅ 通報は本人のみ閲覧可能

**結論**: リポジトリを公開しても、データは完全に保護されています！

## 🔗 参考リンク

- [Supabase RLS公式ドキュメント](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
