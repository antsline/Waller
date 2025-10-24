# GitHub Pages 設定ガイド

このディレクトリには、Wallerアプリの利用規約とプライバシーポリシーのHTMLファイルが含まれています。

## ファイル一覧

- `terms.html` - 利用規約
- `privacy.html` - プライバシーポリシー

## GitHub Pagesの有効化手順

### 1. GitHubリポジトリの設定を開く

1. GitHubでリポジトリ（https://github.com/antsline/Waller）を開く
2. 右上の「Settings」タブをクリック

### 2. GitHub Pagesを有効化

1. 左サイドバーの「Pages」をクリック
2. 「Source」セクションで以下を設定：
   - **Branch**: `main` を選択
   - **Folder**: `/docs` を選択
3. 「Save」ボタンをクリック

### 3. 公開確認

数分後、以下のURLでアクセス可能になります：

- 利用規約: https://antsline.github.io/Waller/terms.html
- プライバシーポリシー: https://antsline.github.io/Waller/privacy.html

### 4. カスタムドメインの設定（オプション）

独自ドメインを使用する場合：

1. Pagesの設定画面で「Custom domain」にドメインを入力
2. DNSレコードを設定（CNAMEレコード）
3. 「Enforce HTTPS」にチェックを入れる

## ファイルの更新方法

1. `terms.html` または `privacy.html` を編集
2. GitHubにコミット＆プッシュ
3. 数分後に自動的に反映される

## 注意事項

- **更新日**: HTMLファイル内の「最終更新日」を忘れずに更新してください
- **アプリ側の変更不要**: URLは変わらないため、アプリの再ビルドは不要です
- **キャッシュ**: ブラウザのキャッシュにより、すぐに反映されない場合があります（強制リロード: Cmd+Shift+R）

## テンプレートのカスタマイズ

必要に応じて以下を変更してください：

### 連絡先情報
- お問い合わせ先の情報
- 運営者情報

### 法的内容
- 利用規約の条項
- プライバシーポリシーの内容
- データ収集・利用に関する詳細

### デザイン
- CSSスタイル
- カラースキーム（現在はアプリのブランドカラー #FF6B00 を使用）

## お問い合わせフォームの設定

`SettingsScreen.tsx`の`CONTACT_URL`を以下のいずれかに設定してください：

### オプション1: Googleフォーム（推奨）
1. Google Forms（https://forms.google.com）でフォームを作成
2. 「送信」→「リンク」でURLを取得
3. `CONTACT_URL`に設定

### オプション2: メールアドレス
```typescript
const CONTACT_URL = 'mailto:support@example.com';
```

### オプション3: 専用お問い合わせページ
独自のお問い合わせページを作成してURLを設定
