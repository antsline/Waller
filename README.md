# WALLER

ウォールトランポリン特化型動画SNSアプリ

## 📋 プロジェクト概要

WALLERは、ウォールトランポリンの「技」「挑戦」「成長」を気軽に共有できるコミュニティ型SNSです。

## 🚀 技術スタック

- **フロントエンド**: React Native (Expo SDK 51+)
- **バックエンド**: Supabase (PostgreSQL + Auth + Storage)
- **言語**: TypeScript
- **状態管理**: Zustand + React Query
- **ナビゲーション**: React Navigation

## 📂 ディレクトリ構成

```
waller/
├── docs/                       # プロジェクトドキュメント
│   ├── requirements_v0.4.md    # 要件定義書
│   ├── tech_design.md          # 技術設計書
│   ├── screen_design.md        # 画面設計書
│   ├── dev_plan.md             # 開発計画書
│   ├── phase0_tasks.md         # MVPタスク一覧
│   └── implementation_guide.md # 実装ガイド
│
├── src/                        # ソースコード
│   ├── screens/                # 画面コンポーネント
│   │   ├── auth/               # 認証関連画面
│   │   ├── home/               # ホーム・フィード画面
│   │   ├── post/               # 投稿関連画面
│   │   └── profile/            # プロフィール画面
│   ├── components/             # 共通コンポーネント
│   ├── hooks/                  # カスタムフック
│   ├── services/               # API層・Supabase
│   ├── stores/                 # グローバル状態管理
│   ├── types/                  # 型定義
│   └── utils/                  # ユーティリティ関数
│
├── supabase/                   # Supabase関連
│   ├── migrations/             # DBマイグレーション
│   └── functions/              # Edge Functions
│
├── assets/                     # 画像・フォント
│   ├── images/
│   └── fonts/
│
├── App.tsx                     # アプリエントリーポイント
├── app.json                    # Expo設定
├── package.json                # 依存関係
└── tsconfig.json               # TypeScript設定
```

## 🛠️ セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example`をコピーして`.env`を作成し、Supabaseの認証情報を設定してください。

```bash
cp .env.example .env
```

### 3. Supabaseプロジェクトの設定

1. [Supabase](https://supabase.com)でプロジェクトを作成
2. `docs/tech_design.md`の手順に従ってデータベースを構築
3. `.env`ファイルにプロジェクトURLとAnon Keyを設定

### 4. 開発サーバーの起動

```bash
npm start
```

## 📱 開発

### iOS

```bash
npm run ios
```

### Android

```bash
npm run android
```

### Web

```bash
npm run web
```

## 📚 ドキュメント

詳細なドキュメントは`docs/`ディレクトリを参照してください:

- [要件定義書](./docs/requirements_v0.4.md)
- [技術設計書](./docs/tech_design.md)
- [画面設計書](./docs/screen_design.md)
- [開発計画書](./docs/dev_plan.md)
- [MVPタスク一覧](./docs/phase0_tasks.md)
- [実装ガイド](./docs/implementation_guide.md)

## 🎯 現在のフェーズ

**Phase 0 (MVP開発中)**

目標: 基本的な動画投稿・閲覧・リアクション機能の実装

## 📄 ライセンス

Private Project
