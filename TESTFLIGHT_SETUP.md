# TestFlightでのテスト手順

Phase 0が完了したので、TestFlightでテストする準備が整いました。

## 前提条件

- ✅ Apple Developer アカウント（有効）
- ✅ Expo アカウント
- ✅ Phase 0 実装完了

## 手順

### 1. EAS CLIのインストール

```bash
npm install -g eas-cli
```

### 2. Expoアカウントにログイン

```bash
eas login
```

Expoアカウントがない場合は、`eas register` で作成してください。

### 3. 環境変数の設定

`.env` ファイルが正しく設定されていることを確認：

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

### 4. Apple Developer設定

App Store Connectでアプリを作成：

1. https://appstoreconnect.apple.com/ にアクセス
2. 「マイApp」→「+」→「新規App」
3. 以下を入力：
   - **プラットフォーム**: iOS
   - **名前**: WALLER
   - **プライマリ言語**: 日本語
   - **バンドルID**: com.waller.app (app.config.jsと一致)
   - **SKU**: waller-app-001 (任意の一意な識別子)

App ID（数字10桁）をメモしてください。

### 5. eas.json の更新

`eas.json` の `submit.production.ios` セクションを更新：

```json
"submit": {
  "production": {
    "ios": {
      "appleId": "your_apple_id@example.com",  // Apple IDのメールアドレス
      "ascAppId": "1234567890",                // App Store ConnectのApp ID
      "appleTeamId": "ABCD123456"              // Team ID (任意)
    }
  }
}
```

**Team IDの確認方法:**
- https://developer.apple.com/account にアクセス
- 「Membership」セクションで確認

### 6. iOSビルドの作成

**初回のみ**: プロジェクトの設定

```bash
eas build:configure
```

**TestFlight用ビルド**（preview profile使用）:

```bash
eas build --platform ios --profile preview
```

このコマンドで：
- ビルドがクラウドで実行されます（約10〜20分）
- Apple Developerアカウントへの認証情報を求められます
- 自動的に証明書とプロビジョニングプロファイルが作成されます

### 7. ビルドの確認

ビルドが完了すると：
- URLが表示されます
- Expo Dashboard (https://expo.dev) でビルドステータスを確認できます
- `.ipa` ファイルがダウンロード可能になります

### 8. TestFlightへの送信

**方法A: EAS Submit（推奨）**

```bash
eas submit --platform ios --latest
```

- App Store Connect API Keyの作成を求められます
- 自動的にTestFlightにアップロードされます

**方法B: 手動アップロード**

1. `.ipa` ファイルをダウンロード
2. Transporter アプリを使用してアップロード
3. App Store Connect で承認

### 9. TestFlightでのテスト

1. App Store Connect → マイApp → WALLER を開く
2. TestFlight タブを選択
3. 「App Store Connect ユーザー」セクションで自分を追加
4. iPhoneでTestFlightアプリを開く
5. WALLERをインストールしてテスト開始！

## トラブルシューティング

### ビルドが失敗する場合

**エラー: "No Bundle Identifier found"**
```bash
# app.config.jsのbundleIdentifierを確認
```

**エラー: "Certificate creation failed"**
- Apple Developer アカウントの権限を確認
- 既存の証明書と競合している可能性があります

### Submit が失敗する場合

**エラー: "Authentication failed"**
```bash
# App Store Connect API Keyを作成
# https://appstoreconnect.apple.com/access/api
```

**エラー: "Invalid bundle version"**
- eas.json で `autoIncrement: true` が設定されているか確認

## 注意事項

### 開発環境の機能制限

現在の開発環境（Expo Go）では以下が動作しません：
- ❌ Google Sign-in
- ❌ Apple Sign-in
- ❌ 画像アップロード（Supabase Storage）

**TestFlightビルド（本番ビルド）では全て動作します！**

### 本番環境で必要な設定

1. **Supabase Storage設定**
   - `supabase/storage-setup.sql` を実行
   - `user-content` バケットを作成

2. **OAuth設定**
   - Google Cloud Console で OAuth クライアントを設定
   - Supabase Dashboard で Google/Apple プロバイダーを有効化

## コスト

- **EAS Build**: 無料枠あり（月30ビルドまで）
- **Apple Developer**: 12,980円/年
- **Supabase**: 無料枠あり（容量制限内）

## 次のステップ

TestFlightでのテストが完了したら：
1. フィードバックを収集
2. Phase 1の機能開発に進む
3. App Storeリリースの準備

---

**質問がある場合は、遠慮なく聞いてください！**
