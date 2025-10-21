# Supabase

Supabase関連ファイルを格納するディレクトリ

## 📂 構成

```
supabase/
├── migrations/              # データベースマイグレーション
│   ├── 01_create_tables.sql
│   ├── 02_create_triggers.sql
│   ├── 03_create_rls_policies.sql
│   └── 04_create_storage.sql
├── functions/               # Edge Functions（今後実装予定）
└── seed.sql                # サンプルデータ
```

## 🚀 セットアップ

詳細なセットアップ手順は以下のドキュメントを参照してください:

👉 **[Supabaseセットアップガイド](../docs/SUPABASE_SETUP.md)**

## 📝 マイグレーション実行順序

Supabase SQL Editorで以下の順序でファイルを実行してください:

1. `01_create_tables.sql` - テーブル作成
2. `02_create_triggers.sql` - トリガーと関数作成
3. `03_create_rls_policies.sql` - Row Level Securityポリシー設定
4. `04_create_storage.sql` - ストレージバケットとポリシー設定

## 🗄️ データベーススキーマ

### テーブル一覧

| テーブル名 | 説明 |
|---|---|
| `users` | ユーザー基本情報 |
| `player_profiles` | プレーヤー専用情報 |
| `posts` | 投稿（動画） |
| `likes` | いいね |
| `reactions` | スタンプリアクション |
| `post_counters` | 投稿のカウンター（非正規化） |
| `reports` | 通報 |
| `deletion_logs` | 削除履歴 |

### ストレージバケット

| バケット名 | 説明 | 公開設定 |
|---|---|---|
| `videos` | 動画ファイル・サムネイル | Public |
| `avatars` | プロフィール画像 | Public |

## 🔐 セキュリティ

- すべてのテーブルでRow Level Security (RLS)が有効
- ストレージバケットにもアクセス制御ポリシーが設定済み
- 詳細は`docs/tech_design.md`を参照

## 🧪 開発環境でのテストデータ

`seed.sql`にサンプルデータの例が記載されています。
実際にはアプリケーションからデータを作成することを推奨します。

## 📚 参考資料

- [技術設計書](../docs/tech_design.md) - データベース設計の詳細
- [要件定義書](../docs/requirements_v0.4.md) - データモデルの仕様
