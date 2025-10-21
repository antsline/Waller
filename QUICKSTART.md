# 🚀 Waller クイックスタートガイド

このガイドでは、Wallerアプリの開発を最短で開始する手順を説明します。

## ⚡ 3ステップで開始

### ステップ1: 依存関係のインストール ✅

```bash
npm install
```

**完了！** すでにインストール済みです。

---

### ステップ2: Supabaseセットアップ 🔄

#### 2-1. Supabaseプロジェクト作成

1. [Supabase](https://supabase.com)にアクセス
2. 「New Project」をクリック
3. プロジェクト情報を入力:
   - Name: `waller-mvp`
   - Password: 強力なパスワード（保存必須）
   - Region: `Northeast Asia (Tokyo)`
   - Plan: `Free`（開発用）
4. 「Create new project」をクリック（2-3分待つ）

#### 2-2. データベース構築

Supabase Dashboard > SQL Editor で以下のファイルを順番に実行:

1. `supabase/migrations/01_create_tables.sql`
2. `supabase/migrations/02_create_triggers.sql`
3. `supabase/migrations/03_create_rls_policies.sql`
4. `supabase/migrations/04_create_storage.sql`

各ファイルをコピー&ペーストして「Run」ボタンをクリック

#### 2-3. 環境変数設定

```bash
# .envファイルを作成
cp .env.example .env
```

Supabase Dashboard > Settings > API から以下を取得して`.env`に設定:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

📖 **詳細**: [Supabaseセットアップガイド](./docs/SUPABASE_SETUP.md)

---

### ステップ3: アプリ起動

```bash
npm start
```

Expoの開発サーバーが起動します。

- **iOS**: `i` キーを押す（Xcode必須）
- **Android**: `a` キーを押す（Android Studio必須）
- **Web**: `w` キーを押す

---

## 📱 開発の進め方

### 開発タスクの確認

`docs/phase0_tasks.md`を開いて、実装するタスクを確認してください。

### 推奨開発順序

1. **Sprint 1**: 基盤構築（認証・プロフィール）
2. **Sprint 2**: コア機能（投稿・フィード・リアクション）
3. **Sprint 3**: サブ機能（編集・削除・通報）
4. **Sprint 4**: テスト・デプロイ

### AIを活用した開発

```
「docs/phase0_tasks.md の Task 1.1 を実装してください」
```

のように、Claudeに指示して開発を進められます。

---

## 📚 ドキュメント

| ドキュメント | 説明 |
|---|---|
| [要件定義書](./docs/requirements_v0.4.md) | アプリの仕様・機能 |
| [技術設計書](./docs/tech_design.md) | DB・API・技術詳細 |
| [画面設計書](./docs/screen_design.md) | UI/UX設計 |
| [開発計画書](./docs/dev_plan.md) | 開発の進め方 |
| [タスク一覧](./docs/phase0_tasks.md) | MVP実装タスク |
| [実装ガイド](./docs/implementation_guide.md) | コーディングパターン |
| [Supabaseセットアップ](./docs/SUPABASE_SETUP.md) | バックエンド設定 |

---

## 🛠️ よく使うコマンド

```bash
# 開発サーバー起動
npm start

# iOS起動
npm run ios

# Android起動
npm run android

# TypeScriptチェック
npx tsc --noEmit

# Lint実行
npm run lint

# Lintの自動修正
npm run lint -- --fix
```

---

## ❓ トラブルシューティング

### エラー: "Supabase connection failed"

- `.env`ファイルが正しく設定されているか確認
- Supabaseプロジェクトが起動しているか確認

### エラー: "Metro bundler failed"

```bash
# キャッシュをクリア
npx expo start -c
```

### エラー: "Package not found"

```bash
# node_modulesを再インストール
rm -rf node_modules
npm install
```

---

## 🎯 次のアクション

✅ ステップ1: 依存関係のインストール（完了）
🔄 ステップ2: Supabaseセットアップ（**← 今ここ**）
⏭️ ステップ3: 開発開始

Supabaseのセットアップが完了したら、`docs/phase0_tasks.md`を開いて開発を始めましょう！
