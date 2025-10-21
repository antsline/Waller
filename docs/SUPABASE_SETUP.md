# 🚀 Supabaseセットアップガイド

このガイドでは、Wallerアプリケーションで使用するSupabaseプロジェクトのセットアップ手順を説明します。

## 📋 目次

1. [Supabaseプロジェクト作成](#1-supabaseプロジェクト作成)
2. [データベースマイグレーション実行](#2-データベースマイグレーション実行)
3. [認証設定](#3-認証設定)
4. [環境変数設定](#4-環境変数設定)
5. [動作確認](#5-動作確認)

---

## 1. Supabaseプロジェクト作成

### 1-1. Supabaseアカウント作成

1. [Supabase](https://supabase.com)にアクセス
2. 「Start your project」をクリック
3. GitHubアカウントでサインアップ

### 1-2. 新規プロジェクト作成

1. ダッシュボードで「New Project」をクリック
2. 以下の情報を入力:
   - **Name**: `waller-mvp`（任意）
   - **Database Password**: 強力なパスワードを設定（**必ず保存してください**）
   - **Region**: `Northeast Asia (Tokyo)` 推奨
   - **Pricing Plan**:
     - 開発環境: `Free`
     - 本番環境: `Pro` ($25/月)

3. 「Create new project」をクリック
4. プロジェクトの初期化を待つ（2-3分）

---

## 2. データベースマイグレーション実行

### 2-1. SQL Editorを開く

1. Supabaseダッシュボードで作成したプロジェクトを開く
2. 左サイドバーから「SQL Editor」を選択

### 2-2. マイグレーションファイルを実行

以下の順序で、各SQLファイルの内容をコピー&ペーストして実行してください:

#### ステップ1: テーブル作成

```bash
# ファイル: supabase/migrations/01_create_tables.sql
```

1. `01_create_tables.sql`の内容をSQLエディタにコピー
2. 「Run」ボタンをクリック
3. 成功メッセージを確認

#### ステップ2: トリガー作成

```bash
# ファイル: supabase/migrations/02_create_triggers.sql
```

1. `02_create_triggers.sql`の内容をSQLエディタにコピー
2. 「Run」ボタンをクリック
3. 成功メッセージを確認

#### ステップ3: RLSポリシー作成

```bash
# ファイル: supabase/migrations/03_create_rls_policies.sql
```

1. `03_create_rls_policies.sql`の内容をSQLエディタにコピー
2. 「Run」ボタンをクリック
3. 成功メッセージを確認

#### ステップ4: ストレージ設定

```bash
# ファイル: supabase/migrations/04_create_storage.sql
```

1. `04_create_storage.sql`の内容をSQLエディタにコピー
2. 「Run」ボタンをクリック
3. 成功メッセージを確認

### 2-3. テーブル作成確認

1. 左サイドバーから「Table Editor」を選択
2. 以下のテーブルが作成されていることを確認:
   - ✅ users
   - ✅ player_profiles
   - ✅ posts
   - ✅ likes
   - ✅ reactions
   - ✅ post_counters
   - ✅ reports
   - ✅ deletion_logs

### 2-4. ストレージバケット確認

1. 左サイドバーから「Storage」を選択
2. 以下のバケットが作成されていることを確認:
   - ✅ videos
   - ✅ avatars

---

## 3. 認証設定

### 3-1. メール認証設定（開発用）

1. 左サイドバーから「Authentication」→「Providers」を選択
2. 「Email」がデフォルトで有効になっていることを確認

### 3-2. Google OAuth設定（本番用）

#### Google Cloud Consoleでの設定

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新規プロジェクトを作成
3. 「APIとサービス」→「認証情報」→「認証情報を作成」→「OAuthクライアントID」
4. アプリケーションの種類:
   - **iOSアプリ**: Bundle IDを入力 (`com.waller.app`)
   - **Androidアプリ**: パッケージ名とSHA-1証明書を入力
5. クライアントIDとクライアントシークレットをコピー

#### Supabaseでの設定

1. Supabase > Authentication > Providers > Google
2. 「Enabled」をオンにする
3. 以下を入力:
   - **Client ID (for OAuth)**: Google Cloud ConsoleのクライアントID
   - **Client Secret (for OAuth)**: クライアントシークレット
4. 「Save」をクリック

### 3-3. Apple Sign In設定（本番用）

#### Apple Developer Consoleでの設定

1. [Apple Developer](https://developer.apple.com/)にアクセス
2. 「Certificates, Identifiers & Profiles」を選択
3. Services IDを作成
4. Sign In with Appleを有効化
5. 必要な情報（Services ID, Team ID, Key ID, Private Key）を取得

#### Supabaseでの設定

1. Supabase > Authentication > Providers > Apple
2. 「Enabled」をオンにする
3. Apple Developer Consoleから取得した情報を入力
4. 「Save」をクリック

---

## 4. 環境変数設定

### 4-1. Supabase認証情報の取得

1. Supabaseダッシュボードで「Settings」→「API」を選択
2. 以下の情報をコピー:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 4-2. .envファイルの作成

プロジェクトルートで以下を実行:

```bash
cp .env.example .env
```

### 4-3. .envファイルの編集

`.env`ファイルを開き、取得した情報を設定:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OAuth Configuration（本番環境のみ）
EXPO_PUBLIC_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
EXPO_PUBLIC_APPLE_CLIENT_ID=com.waller.app
```

**⚠️ 重要**: `.env`ファイルは絶対にGitにコミットしないでください！

---

## 5. 動作確認

### 5-1. データベース接続テスト

プロジェクトルートで以下のコマンドを実行:

```bash
npm start
```

### 5-2. Supabase Clientの初期化確認

`src/services/supabase.ts`ファイルを作成して接続テスト:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 接続テスト
supabase.from('users').select('count').then(console.log);
```

### 5-3. ストレージ接続確認

Supabaseダッシュボードで:

1. Storage > videos バケットを開く
2. 手動でテストファイルをアップロード
3. 公開URLが取得できることを確認

---

## ✅ セットアップ完了チェックリスト

以下がすべて完了していることを確認してください:

- [ ] Supabaseプロジェクトが作成されている
- [ ] 8つのテーブルが作成されている
- [ ] RLSポリシーが設定されている
- [ ] 2つのストレージバケット（videos, avatars）が作成されている
- [ ] 認証プロバイダー（Email/Google/Apple）が設定されている
- [ ] `.env`ファイルにSupabase認証情報が設定されている
- [ ] アプリからSupabaseに接続できる

---

## 🐛 トラブルシューティング

### エラー: "relation does not exist"

- 原因: テーブルが作成されていない
- 解決: マイグレーションファイルを順番に再実行

### エラー: "Row Level Security is enabled"

- 原因: RLSポリシーが正しく設定されていない
- 解決: `03_create_rls_policies.sql`を再実行

### エラー: "JWT expired"

- 原因: セッションの有効期限切れ
- 解決: アプリを再起動してログインし直す

### ストレージアップロードエラー

- 原因: ストレージポリシーが正しく設定されていない
- 解決: `04_create_storage.sql`を再実行

---

## 📚 参考リンク

- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Supabase認証ガイド](https://supabase.com/docs/guides/auth)
- [Supabase RLSガイド](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storageガイド](https://supabase.com/docs/guides/storage)

---

## 🎉 次のステップ

Supabaseのセットアップが完了したら、次は開発を開始します！

`docs/phase0_tasks.md`を参照して、Sprint 1のタスクから始めてください。
