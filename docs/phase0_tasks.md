# ✅ Phase 0（MVP）タスク一覧

---

## 📋 タスクの読み方

### 記号の意味
- `[ ]` 未着手
- `[x]` 完了
- `[>]` 進行中
- `[!]` ブロック中（依存タスク未完了）

### タスク構造
```
## Sprint X: スプリント名
### X.Y カテゴリ名
- [ ] Task X.Y.Z: タスク名
  - 目的: 何のためのタスクか
  - 前提: このタスクを始める前に必要なこと
  - 成果物: 完了時に存在すべきファイル/機能
  - 参考: 参照すべきドキュメント
```

---

## Sprint 1: 基盤構築（1-2週間）

### 1.1 環境セットアップ

- [ ] **Task 1.1.1: Expoプロジェクト作成**
  - **目的**: React Native開発環境の構築
  - **前提**: Node.js 18+、npm/yarn インストール済み
  - **成果物**: 
    - `waller/` プロジェクトディレクトリ
    - `package.json`
    - `app.json`
  - **手順**:
    ```bash
    npx create-expo-app waller
    cd waller
    npx expo install expo-router
    ```
  - **参考**: `implementation_guide.md` 第1章

---

- [ ] **Task 1.1.2: 必要なパッケージのインストール**
  - **目的**: MVP開発に必要なライブラリの導入
  - **前提**: Task 1.1.1 完了
  - **成果物**: `package.json` に依存関係追加
  - **手順**:
    ```bash
    # Supabase
    npm install @supabase/supabase-js
    
    # Navigation
    npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
    npx expo install react-native-screens react-native-safe-area-context
    
    # State Management
    npm install zustand @tanstack/react-query
    
    # Video
    npx expo install expo-av expo-image-picker expo-video-thumbnails
    
    # Storage
    npx expo install @react-native-async-storage/async-storage
    
    # その他
    npm install date-fns
    ```
  - **参考**: `tech_design.md` 第2章

---

- [ ] **Task 1.1.3: TypeScript設定**
  - **目的**: 型安全な開発環境の構築
  - **前提**: Task 1.1.2 完了
  - **成果物**: 
    - `tsconfig.json`
    - `src/types/` ディレクトリ
  - **手順**:
    - `tsconfig.json` で strict mode 有効化
    - `src/types/database.types.ts` 作成（Supabase型定義用）
  - **参考**: `implementation_guide.md` 第2章

---

- [ ] **Task 1.1.4: ディレクトリ構造の作成**
  - **目的**: プロジェクトの基本構造を整備
  - **前提**: Task 1.1.1 完了
  - **成果物**: 
    ```
    src/
    ├── screens/
    ├── components/
    ├── hooks/
    ├── services/
    ├── stores/
    ├── types/
    └── utils/
    ```
  - **手順**: 各ディレクトリに `.gitkeep` を配置
  - **参考**: `dev_plan.md` プロジェクト構造

---

### 1.2 Supabase設定

- [ ] **Task 1.2.1: Supabaseプロジェクト作成**
  - **目的**: バックエンド環境の準備
  - **前提**: Supabaseアカウント作成済み
  - **成果物**: 
    - Supabaseプロジェクト
    - Project URL、Anon Key
  - **手順**:
    1. https://supabase.com/dashboard でプロジェクト作成
    2. プロジェクト名: `waller-mvp`
    3. リージョン: `Northeast Asia (Tokyo)`
    4. API Settings から URL と Key をコピー
  - **参考**: `tech_design.md` 第3章

---

- [ ] **Task 1.2.2: 環境変数の設定**
  - **目的**: Supabase接続情報の管理
  - **前提**: Task 1.2.1 完了
  - **成果物**: 
    - `.env.local`
    - `.env.example`
  - **手順**:
    ```bash
    # .env.local
    EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
    EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    ```
  - **注意**: `.env.local` を `.gitignore` に追加
  - **参考**: `tech_design.md` 第10章

---

- [ ] **Task 1.2.3: Supabaseクライアントの初期化**
  - **目的**: アプリからSupabaseへの接続
  - **前提**: Task 1.2.2 完了
  - **成果物**: `src/services/supabase.ts`
  - **実装内容**:
    ```typescript
    import { createClient } from '@supabase/supabase-js';
    import AsyncStorage from '@react-native-async-storage/async-storage';
    import { Database } from '../types/database.types';
    
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
    
    export const supabase = createClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      }
    );
    ```
  - **参考**: `tech_design.md` 第9.2章

---

### 1.3 データベース構築

- [ ] **Task 1.3.1: テーブル作成SQL実行**
  - **目的**: データベーススキーマの構築
  - **前提**: Task 1.2.1 完了
  - **成果物**: Supabase上に全8テーブル
  - **手順**:
    1. Supabase Dashboard → SQL Editor
    2. `tech_design.md` 第4.1章の SQL を順番に実行
       - users テーブル
       - player_profiles テーブル
       - posts テーブル
       - likes テーブル
       - reactions テーブル
       - post_counters テーブル
       - reports テーブル
       - deletion_logs テーブル
  - **検証**: Table Editor で各テーブルが表示されること
  - **参考**: `tech_design.md` 第4章

---

- [ ] **Task 1.3.2: トリガーの作成**
  - **目的**: カウンター自動更新の実装
  - **前提**: Task 1.3.1 完了
  - **成果物**: 
    - `update_updated_at_column()` 関数
    - `initialize_post_counters()` 関数
    - `update_like_count()` 関数
    - `update_reaction_count()` 関数
    - `auto_hide_reported_posts()` 関数
  - **手順**: `tech_design.md` 第4.2章、4.3章の SQL を実行
  - **検証**: 
    - テストデータで likes 追加 → post_counters が更新されること
  - **参考**: `tech_design.md` 第4.2章

---

- [ ] **Task 1.3.3: RLSポリシーの設定**
  - **目的**: セキュリティ設定
  - **前提**: Task 1.3.1 完了
  - **成果物**: 全テーブルにRLSポリシー適用
  - **手順**:
    1. `tech_design.md` 第5章の SQL を順番に実行
    2. RLS有効化 → 各テーブルのポリシー設定
  - **検証**: 
    - 認証なしでデータが見えないこと（SELECT制限）
    - 認証後に自分のデータのみ編集可能なこと
  - **参考**: `tech_design.md` 第5章

---

- [ ] **Task 1.3.4: ストレージバケットの作成**
  - **目的**: 動画・画像の保存先を用意
  - **前提**: Task 1.2.1 完了
  - **成果物**: 
    - `videos` バケット
    - `avatars` バケット
  - **手順**:
    1. Supabase Dashboard → Storage
    2. `tech_design.md` 第6.1章、6.2章の SQL を実行
  - **検証**: Storage 画面で2つのバケットが表示されること
  - **参考**: `tech_design.md` 第6章

---

### 1.4 認証フロー実装

- [ ] **Task 1.4.1: OAuth設定（Google）**
  - **目的**: Google認証の有効化
  - **前提**: Task 1.2.1 完了、Google Cloud Console アカウント
  - **成果物**: Google OAuth設定完了
  - **手順**:
    1. Google Cloud Console でプロジェクト作成
    2. OAuth 2.0 クライアントID作成
    3. Supabase Dashboard → Authentication → Providers → Google で設定
  - **参考**: `tech_design.md` 第3.3章

---

- [ ] **Task 1.4.2: OAuth設定（Apple）**
  - **目的**: Apple認証の有効化
  - **前提**: Task 1.2.1 完了、Apple Developer アカウント
  - **成果物**: Apple Sign In設定完了
  - **手順**:
    1. Apple Developer Console で設定
    2. Services ID作成
    3. Supabase Dashboard → Authentication → Providers → Apple で設定
  - **参考**: `tech_design.md` 第3.3章

---

- [ ] **Task 1.4.3: 認証フックの実装**
  - **目的**: 認証状態管理
  - **前提**: Task 1.2.3 完了
  - **成果物**: `src/hooks/useAuth.ts`
  - **実装内容**:
    - `useAuth()` フック
    - `signInWithGoogle()`
    - `signInWithApple()`
    - `signOut()`
    - `user` 状態
    - `session` 状態
  - **参考**: `implementation_guide.md` 第3章、`tech_design.md` 第7章

---

- [ ] **Task 1.4.4: ログイン画面の実装**
  - **目的**: 認証UI作成
  - **前提**: Task 1.4.3 完了
  - **成果物**: `src/screens/auth/LoginScreen.tsx`
  - **実装内容**:
    - Wallerロゴ表示
    - Google ログインボタン
    - Apple ログインボタン
    - 利用規約リンク
    - ローディング状態
    - エラー表示
  - **検証**: 
    - ボタン押下でOAuth認証フローが起動すること
    - 認証成功後にログイン状態になること
  - **参考**: `screen_design.md` A1画面

---

### 1.5 プロフィール登録

- [ ] **Task 1.5.1: ロール選択画面の実装**
  - **目的**: プレーヤー/ファン選択
  - **前提**: Task 1.4.4 完了
  - **成果物**: `src/screens/auth/RoleSelectionScreen.tsx`
  - **実装内容**:
    - プレーヤーカード
    - ファンカード
    - ラジオボタン選択
    - 次へボタン
  - **検証**: 選択後に次の画面に遷移すること
  - **参考**: `screen_design.md` A2画面

---

- [ ] **Task 1.5.2: プロフィール登録画面（プレーヤー）の実装**
  - **目的**: プレーヤー情報入力
  - **前提**: Task 1.5.1 完了
  - **成果物**: `src/screens/auth/PlayerProfileSetupScreen.tsx`
  - **実装内容**:
    - アイコン選択（任意）
    - 表示名入力（必須）
    - @ID入力（必須、重複チェック）
    - 経験年数入力（必須）
    - スキルレベル選択（必須）
    - 所属チーム入力（任意）
    - ホームジム入力（任意）
    - バリデーション
    - 登録完了ボタン
  - **検証**: 
    - 入力後、usersテーブルとplayer_profilesテーブルにデータが保存されること
    - @ID重複時にエラー表示されること
  - **参考**: `screen_design.md` A3画面、`tech_design.md` 第7.1章

---

- [ ] **Task 1.5.3: プロフィール登録画面（ファン）の実装**
  - **目的**: ファン情報入力
  - **前提**: Task 1.5.1 完了
  - **成果物**: `src/screens/auth/FanProfileSetupScreen.tsx`
  - **実装内容**:
    - アイコン選択（任意）
    - 表示名入力（必須）
    - @ID入力（必須、重複チェック）
    - 自己紹介入力（任意）
    - バリデーション
    - 登録完了ボタン
  - **検証**: 
    - 入力後、usersテーブルにデータが保存されること
    - @ID重複時にエラー表示されること
  - **参考**: `screen_design.md` A4画面

---

- [ ] **Task 1.5.4: 認証フロー統合**
  - **目的**: ログイン → プロフィール登録 → ホーム の導線完成
  - **前提**: Task 1.5.2、1.5.3 完了
  - **成果物**: ナビゲーション設定
  - **実装内容**:
    - 初回ログイン時 → ロール選択画面
    - 2回目以降 → ホーム画面
    - プロフィール未登録時 → 登録画面
  - **検証**: 
    - 初回ユーザーがスムーズに登録できること
    - 既存ユーザーが直接ホームに遷移すること

---

## Sprint 2: コア機能実装（2-3週間）

### 2.1 ボトムタブナビゲーション

- [ ] **Task 2.1.1: ボトムタブの実装**
  - **目的**: メインナビゲーションの構築
  - **前提**: Task 1.5.4 完了
  - **成果物**: `src/navigation/BottomTabNavigator.tsx`
  - **実装内容**:
    - ホームタブ（🏠）
    - 投稿タブ（➕）→ プレーヤーのみ表示
    - マイページタブ（👤）
    - タブアイコン・ラベル
    - アクティブ状態の色分け（オレンジ）
  - **検証**: タブ切替がスムーズに動作すること
  - **参考**: `screen_design.md` 第2.2章

---

### 2.2 投稿機能

- [ ] **Task 2.2.1: 動画選択機能の実装**
  - **目的**: カメラロールから動画選択
  - **前提**: Task 2.1.1 完了
  - **成果物**: `src/hooks/useVideoPicker.ts`
  - **実装内容**:
    ```typescript
    const { pickVideo, video, error } = useVideoPicker();
    ```
    - expo-image-pickerで動画選択
    - バリデーション（3-60秒、100MB以下）
    - エラーハンドリング
  - **検証**: 
    - 動画選択後、プレビューできること
    - サイズ・長さ超過時にエラー表示されること
  - **参考**: `tech_design.md` 第4.2章、`requirements_v0.4.md` 第8章

---

- [ ] **Task 2.2.2: サムネイル生成機能の実装**
  - **目的**: 動画からサムネイル画像を生成
  - **前提**: Task 2.2.1 完了
  - **成果物**: `src/utils/generateThumbnail.ts`
  - **実装内容**:
    - expo-video-thumbnailsで1秒目を抽出
    - エラーハンドリング
  - **検証**: サムネイルが正しく生成されること
  - **参考**: `tech_design.md` 第4.2章

---

- [ ] **Task 2.2.3: 動画アップロード機能の実装**
  - **目的**: Supabase Storageへのアップロード
  - **前提**: Task 2.2.2 完了
  - **成果物**: `src/services/storage.ts`
  - **実装内容**:
    ```typescript
    async function uploadVideo(userId: string, postId: string, videoFile: File, thumbnailFile: File)
    ```
    - 動画アップロード
    - サムネイルアップロード
    - プログレスバー対応
    - エラーハンドリング
  - **検証**: 
    - Supabase Storageに動画が保存されること
    - 公開URLが取得できること
  - **参考**: `tech_design.md` 第8.1章

---

- [ ] **Task 2.2.4: 投稿作成画面の実装**
  - **目的**: 投稿UI作成
  - **前提**: Task 2.2.3 完了
  - **成果物**: `src/screens/post/CreatePostScreen.tsx`
  - **実装内容**:
    - 動画プレビュー
    - カテゴリタグ選択（6種類）
    - キャプション入力（200文字）
    - チーム/ジム表示（プロフィールから）
    - 投稿ボタン
    - アップロードプログレスバー
  - **検証**: 
    - 投稿後、postsテーブルにレコードが作成されること
    - post_countersが初期化されること
  - **参考**: `screen_design.md` B2画面

---

### 2.3 フィード機能

- [ ] **Task 2.3.1: PostCardコンポーネントの実装**
  - **目的**: 投稿カードの共通コンポーネント
  - **前提**: Task 1.3.1 完了
  - **成果物**: `src/components/PostCard.tsx`
  - **実装内容**:
    - ユーザー情報表示（アバター、@ID、バッジ）
    - 動画サムネイル
    - カテゴリタグ
    - キャプション（2行、もっと見る）
    - リアクション数表示
    - メニューボタン（⋯）
  - **検証**: デザイン通りに表示されること
  - **参考**: `screen_design.md` 第4章、B1画面

---

- [ ] **Task 2.3.2: ホームフィード画面の実装**
  - **目的**: 投稿一覧表示
  - **前提**: Task 2.3.1 完了
  - **成果物**: `src/screens/home/HomeScreen.tsx`
  - **実装内容**:
    - 新着順フィード（created_at DESC）
    - 10件ずつページング
    - Pull to Refresh
    - スクロール時の自動ページング
    - ローディング状態
    - 空状態（投稿ゼロ時）
  - **検証**: 
    - 投稿がカード形式で表示されること
    - スクロールで追加読み込みされること
  - **参考**: `screen_design.md` B1画面、`tech_design.md` 第8.1章

---

- [ ] **Task 2.3.3: 動画再生機能の実装**
  - **目的**: フィードでの動画再生
  - **前提**: Task 2.3.2 完了
  - **成果物**: `src/components/VideoPlayer.tsx`
  - **実装内容**:
    - expo-avで動画再生
    - タップで再生/一時停止
    - ミュート状態
    - 自動再生（画面中央に来たら）
  - **検証**: 
    - 動画がスムーズに再生されること
    - 複数動画が同時再生されないこと
  - **参考**: `screen_design.md` 第4章、B1画面

---

### 2.4 リアクション機能

- [ ] **Task 2.4.1: いいね機能の実装**
  - **目的**: いいねボタンの実装
  - **前提**: Task 2.3.1 完了
  - **成果物**: `src/hooks/useLike.ts`
  - **実装内容**:
    ```typescript
    const { isLiked, toggleLike, isLoading } = useLike(postId);
    ```
    - いいねトグル（追加/削除）
    - 楽観的更新
    - エラー時のロールバック
  - **検証**: 
    - いいね追加 → likesテーブルにレコード追加
    - いいね削除 → レコード削除
    - post_counters の like_count が更新されること
  - **参考**: `tech_design.md` 第8.1章

---

- [ ] **Task 2.4.2: スタンプ機能の実装**
  - **目的**: 4種スタンプの実装
  - **前提**: Task 2.4.1 完了
  - **成果物**: `src/hooks/useReaction.ts`
  - **実装内容**:
    ```typescript
    const { currentReaction, sendReaction, isLoading } = useReaction(postId);
    ```
    - スタンプ送信（🔥👏✨💪）
    - 1投稿1種類のみ
    - 10分以内は自由変更
    - 10分経過後は30秒クールダウン
    - 楽観的更新
  - **検証**: 
    - スタンプ送信 → reactionsテーブルにレコード追加
    - 種類変更 → previous_type 更新
    - post_counters の各カウントが更新されること
    - クールダウンが正しく動作すること
  - **参考**: `requirements_v0.4.md` 第9章、`tech_design.md` 第8.1章

---

- [ ] **Task 2.4.3: ReactionButtonsコンポーネントの実装**
  - **目的**: リアクションUIの統合
  - **前提**: Task 2.4.2 完了
  - **成果物**: `src/components/ReactionButtons.tsx`
  - **実装内容**:
    - いいねボタン
    - スタンプボタン4つ（横並び）
    - 選択中の状態表示（オレンジ枠）
    - クールダウン表示
  - **検証**: デザイン通りに動作すること
  - **参考**: `screen_design.md` 第4章

---

### 2.5 プロフィール機能

- [ ] **Task 2.5.1: プロフィール画面の実装**
  - **目的**: ユーザー情報・投稿一覧表示（濃いプロフィール対応）
  - **前提**: Task 2.3.1 完了
  - **成果物**: `src/screens/profile/ProfileScreen.tsx`
  - **実装内容**:
    - アバター・表示名・@ID
    - スキルレベル・経験年数バッジ（プレーヤーのみ）
    - チーム/ジム/活動地域表示
    - 自己紹介（200文字、100文字以上は「もっと見る」で展開）
    - SNSリンク（X, Instagram, YouTube）※タップで外部ブラウザ起動
    - コラボ歓迎バッジ（is_open_to_collab=true時に表示）
    - プロフィール編集ボタン（本人のみ）
    - 投稿グリッド（3列）
    - タブ切替（投稿/いいね履歴）※本人のみ
  - **検証**:
    - 自分のプロフィールと他人のプロフィールで表示が異なること
    - 投稿グリッドがタップで投稿詳細に遷移すること
    - SNSリンクが正しく開くこと
    - 自己紹介が100文字以上で折りたたまれること
  - **参考**: `screen_design.md` B4画面、`requirements_v0.4.md` 6-2章

---

- [ ] **Task 2.5.2: マイページの実装**
  - **目的**: ボトムタブからのプロフィールアクセス
  - **前提**: Task 2.5.1 完了
  - **成果物**: ナビゲーション統合
  - **実装内容**:
    - ボトムタブの「マイページ」から自分のプロフィール表示
    - 設定ボタン（⚙️）からSettingsScreen遷移
  - **検証**: タブからアクセスできること

---

## Sprint 3: サブ機能 + 仕上げ（1-2週間）

### 3.1 投稿編集・削除

- [ ] **Task 3.1.1: 投稿詳細画面の実装**
  - **目的**: 投稿の拡大表示
  - **前提**: Task 2.3.3 完了
  - **成果物**: `src/screens/post/PostDetailScreen.tsx`
  - **実装内容**:
    - フル画面動画再生
    - キャプション全文表示
    - リアクション詳細（各スタンプ数）
    - いいねボタン
    - スタンプバー
    - メニューボタン（⋯）
  - **検証**: フィードからタップで遷移すること
  - **参考**: `screen_design.md` B3画面

---

- [ ] **Task 3.1.2: 投稿編集機能の実装**
  - **目的**: キャプション・カテゴリの編集
  - **前提**: Task 3.1.1 完了
  - **成果物**: 編集モーダル
  - **実装内容**:
    - キャプション編集（200文字）
    - カテゴリタグ変更
    - 保存ボタン
    - 本人の投稿のみ編集可能
  - **検証**: 
    - 編集後、postsテーブルが更新されること
    - updated_atが更新されること
  - **参考**: `requirements_v0.4.md` STEP3

---

- [ ] **Task 3.1.3: 投稿削除機能の実装**
  - **目的**: 削除機能の実装
  - **前提**: Task 3.1.1 完了
  - **成果物**: `src/hooks/useDeletePost.ts`
  - **実装内容**:
    - 削除制限チェック（10分以内/以降）
    - 1日3回制限の実装
    - 確認ダイアログ
    - deletion_logsへの記録
    - 楽観的更新
  - **検証**: 
    - 10分以内は無制限削除可能
    - 10分経過後は1日3回まで
    - 4回目の削除でエラー表示
  - **参考**: `requirements_v0.4.md` STEP3、`tech_design.md` 第8.1章

---

### 3.2 通報機能

- [ ] **Task 3.2.1: 通報画面の実装**
  - **目的**: 不適切投稿の通報
  - **前提**: Task 3.1.1 完了
  - **成果物**: `src/screens/report/ReportScreen.tsx`
  - **実装内容**:
    - 通報理由選択（5種類）
    - 詳細入力（任意、100文字）
    - 通報ボタン
    - 確認トースト
  - **検証**: 
    - 通報後、reportsテーブルにレコード追加
    - 3人通報で投稿が自動非表示（status='reported'）
  - **参考**: `screen_design.md` C2画面、`requirements_v0.4.md` STEP3

---

### 3.3 いいね履歴

- [ ] **Task 3.3.1: いいね履歴画面の実装**
  - **目的**: 自分がいいねした投稿一覧
  - **前提**: Task 2.4.1 完了
  - **成果物**: `src/screens/profile/LikedPostsScreen.tsx`
  - **実装内容**:
    - いいね順（新→古）で表示
    - PostCardコンポーネント再利用
    - 空状態表示
    - ページング
  - **検証**: 
    - いいねした投稿のみ表示されること
    - いいね解除で履歴から消えること
    - 投稿削除で履歴から消えること
  - **参考**: `screen_design.md` B6画面

---

### 3.4 プロフィール編集

- [ ] **Task 3.4.1: プロフィール編集画面の実装**
  - **目的**: プロフィール情報の更新（濃いプロフィール対応）
  - **前提**: Task 2.5.1 完了
  - **成果物**: `src/screens/profile/EditProfileScreen.tsx`
  - **実装内容**:
    - アバター変更（画像選択・アップロード）
    - 表示名編集（1-30文字）
    - @ID編集（1回のみ警告表示、英数字+_、3-15文字）
    - 自己紹介編集（200文字、文字数カウンター表示）
    - スキルレベル変更（プレーヤーのみ、Lv1-5）
    - 経験年数変更（プレーヤーのみ、年・月）
    - チーム名変更（プレーヤーのみ、50文字）
    - ホームジム変更（プレーヤーのみ、50文字）
    - 活動地域編集（プレーヤーのみ、30文字）
    - SNSリンク編集（プレーヤーのみ、X/Instagram/YouTube）
    - コラボ歓迎フラグ（プレーヤーのみ、ON/OFF）
    - バリデーション（リアルタイム、@ID重複チェック）
    - 保存ボタン（変更があるまで無効）
  - **検証**:
    - 保存後、usersテーブルとplayer_profilesテーブルが更新されること
    - @ID変更が2回目でエラー表示されること
    - SNS URLのバリデーションが動作すること
    - ファンはプレーヤー専用項目が表示されないこと
  - **参考**: `screen_design.md` B5画面、`requirements_v0.4.md` 6-1, 6-2章

---

### 3.5 設定画面

- [ ] **Task 3.5.1: 設定画面の実装**
  - **目的**: アカウント管理
  - **前提**: Task 2.5.2 完了
  - **成果物**: `src/screens/settings/SettingsScreen.tsx`
  - **実装内容**:
    - プロフィール編集リンク
    - 利用規約リンク
    - プライバシーポリシーリンク
    - バージョン表示
    - ログアウトボタン
    - アカウント削除ボタン（赤色、2段階確認）
  - **検証**: 
    - ログアウトで認証状態がクリアされること
    - アカウント削除でデータが削除されること（CASCADE）
  - **参考**: `screen_design.md` C1画面

---

### 3.6 エラーハンドリング

- [ ] **Task 3.6.1: エラーコンポーネントの実装**
  - **目的**: エラー表示の統一
  - **前提**: なし
  - **成果物**: 
    - `src/components/Toast.tsx`（トースト）
    - `src/components/ErrorModal.tsx`（モーダル）
    - `src/components/InlineError.tsx`（インライン）
  - **実装内容**:
    - 3種類のエラー表示パターン
    - アニメーション
    - 自動消去（トースト）
  - **参考**: `screen_design.md` 第6章

---

- [ ] **Task 3.6.2: 全画面へのエラーハンドリング適用**
  - **目的**: エラーの適切な処理
  - **前提**: Task 3.6.1 完了
  - **成果物**: 各画面にエラー処理追加
  - **実装内容**:
    - ネットワークエラー
    - バリデーションエラー
    - 認証エラー
    - アップロードエラー
  - **検証**: 
    - オフライン時に適切なメッセージが表示されること
    - エラー後もアプリが正常動作すること
  - **参考**: `requirements_v0.4.md` 第15章

---

### 3.7 空状態・ローディング状態

- [ ] **Task 3.7.1: ローディングコンポーネントの実装**
  - **目的**: ローディング表示の統一
  - **前提**: なし
  - **成果物**: 
    - `src/components/Spinner.tsx`
    - `src/components/SkeletonLoader.tsx`
  - **実装内容**:
    - スピナー（オレンジ）
    - スケルトンスクリーン（フィード用）
  - **参考**: `screen_design.md` 第6.3章

---

- [ ] **Task 3.7.2: 空状態コンポーネントの実装**
  - **目的**: 空状態の表示
  - **前提**: なし
  - **成果物**: `src/components/EmptyState.tsx`
  - **実装内容**:
    - アイコン
    - メッセージ
    - アクションボタン（オプション）
  - **検証**: 
    - 投稿ゼロ時に空状態が表示されること
    - いいね履歴ゼロ時に空状態が表示されること
  - **参考**: `screen_design.md` 第6.2章

---

## Sprint 4: テスト + デプロイ準備（1週間）

### 4.1 手動テスト

- [ ] **Task 4.1.1: 認証フローのテスト**
  - **目的**: ログイン → 登録 → ホーム の動作確認
  - **前提**: Sprint 3 完了
  - **テスト項目**:
    - [ ] Google ログインが動作する
    - [ ] Apple ログインが動作する
    - [ ] プレーヤー登録が完了する
    - [ ] ファン登録が完了する
    - [ ] ログアウト → 再ログインで自動ログインされる

---

- [ ] **Task 4.1.2: 投稿フローのテスト**
  - **目的**: 動画投稿の動作確認
  - **前提**: Task 4.1.1 完了
  - **テスト項目**:
    - [ ] 動画選択が正常に動作する
    - [ ] 3秒未満の動画でエラーが出る
    - [ ] 60秒超の動画でエラーが出る
    - [ ] 100MB超の動画でエラーが出る
    - [ ] サムネイルが生成される
    - [ ] 投稿が完了する
    - [ ] フィードに投稿が表示される

---

- [ ] **Task 4.1.3: リアクションのテスト**
  - **目的**: いいね・スタンプの動作確認
  - **前提**: Task 4.1.2 完了
  - **テスト項目**:
    - [ ] いいねの追加・削除が動作する
    - [ ] スタンプ送信が動作する
    - [ ] スタンプ変更（10分以内）が動作する
    - [ ] スタンプ変更（10分以降）でクールダウンが表示される
    - [ ] カウンターがリアルタイム更新される

---

- [ ] **Task 4.1.4: 削除制限のテスト**
  - **目的**: 削除制限の動作確認
  - **前提**: Task 4.1.2 完了
  - **テスト項目**:
    - [ ] 投稿後10分以内は何度でも削除できる
    - [ ] 10分経過後は1日3回まで削除できる
    - [ ] 4回目の削除でエラーが出る

---

- [ ] **Task 4.1.5: 通報のテスト**
  - **目的**: 通報機能の動作確認
  - **前提**: Task 4.1.2 完了
  - **テスト項目**:
    - [ ] 通報送信が動作する
    - [ ] 3人通報で投稿が自動非表示になる
    - [ ] 同じ投稿を複数回通報できない

---

### 4.2 バグ修正

- [ ] **Task 4.2.1: 発見されたバグの修正**
  - **目的**: テストで見つかったバグの解決
  - **前提**: Task 4.1.x でバグ発見
  - **実施内容**: バグリストを作成し、優先度順に修正

---

### 4.3 パフォーマンス最適化

- [ ] **Task 4.3.1: フィードのパフォーマンス改善**
  - **目的**: スクロールの滑らかさ向上
  - **前提**: Sprint 3 完了
  - **実施内容**:
    - FlatListの最適化（windowSize調整）
    - 画像・動画の遅延ロード
    - メモ化（useMemo、React.memo）

---

### 4.4 サンプルデータ作成

- [ ] **Task 4.4.1: サンプル投稿の作成**
  - **目的**: 空状態を避ける
  - **前提**: Task 4.1.2 完了
  - **実施内容**:
    - 3-5本のサンプル動画を投稿
    - サンプルユーザーアカウントを作成
    - 多様なカテゴリタグを使用

---

### 4.5 ビルド・デプロイ

- [ ] **Task 4.5.1: EAS Build設定**
  - **目的**: ビルド環境の構築
  - **前提**: Task 4.3.1 完了
  - **実施内容**:
    - `eas.json` 作成
    - 開発ビルド設定
    - プレビュービルド設定
  - **参考**: `tech_design.md` 第11章

---

- [ ] **Task 4.5.2: 内部テストビルド作成**
  - **目的**: TestFlight/Internal Testing 配布
  - **前提**: Task 4.5.1 完了
  - **実施内容**:
    ```bash
    eas build --profile preview --platform all
    ```
  - **検証**: ビルドが成功すること

---

- [ ] **Task 4.5.3: 内部テスター配布**
  - **目的**: 実機テスト
  - **前提**: Task 4.5.2 完了
  - **実施内容**:
    - TestFlight招待（iOS）
    - Internal Testing招待（Android）
    - フィードバック収集

---

## ✅ Phase 0 完了判定

以下すべてにチェックが入ったらMVP完成：

- [ ] すべてのタスクが完了している
- [ ] 手動テストが全てパスしている
- [ ] 既知のクリティカルバグがゼロ
- [ ] 内部テスターからのフィードバックを反映済み
- [ ] KPI計測の準備が整っている

---

**次のステップ**: Phase 1（発見性強化）の実装へ

---
---

# 📍 Phase 1（発見性強化・フォロー機能）タスク一覧

Phase 0（MVP）完了後に実装する機能です。

---

## Sprint 5: 発見性強化（1-2週間）

### 5.1 タグ機能

- [ ] **Task 5.1.1: タグ検索機能の実装**
  - **目的**: カテゴリタグでの投稿絞り込み
  - **前提**: Phase 0 完了
  - **成果物**: `src/screens/search/TagSearchScreen.tsx`
  - **実装内容**:
    - 6種類のカテゴリタグボタン
    - タグフィルタリング機能
    - PostCardコンポーネント再利用
    - ページング
  - **検証**:
    - タグタップで該当投稿のみ表示されること
    - 複数タグで絞り込みできること

---

- [ ] **Task 5.1.2: カテゴリタグ別フィード**
  - **目的**: タグごとの投稿一覧
  - **前提**: Task 5.1.1 完了
  - **成果物**: ホーム画面へのタグフィルタ追加
  - **実装内容**:
    - ホーム画面上部にタグフィルタバー
    - 「すべて」「チャレンジ」「成功」等のタブ
    - タブ切替でフィード更新
  - **検証**: タブ切替がスムーズに動作すること

---

### 5.2 フォロー機能

- [ ] **Task 5.2.1: followsテーブルの作成**
  - **目的**: フォロー関係のデータ構造
  - **前提**: Phase 0 完了
  - **成果物**: データベーステーブル、RLS、トリガー
  - **実装内容**:
    ```sql
    CREATE TABLE follows (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      follower_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      following_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(follower_user_id, following_user_id)
    );

    -- フォロワー/フォロー中カウント用トリガー
    -- usersテーブルにfollowers_count, following_countカラム追加
    ```
  - **検証**:
    - followsテーブルが作成されること
    - ユニーク制約が動作すること
  - **参考**: `tech_design.md` データベース設計

---

- [ ] **Task 5.2.2: useFollowフックの実装**
  - **目的**: フォロー機能のビジネスロジック
  - **前提**: Task 5.2.1 完了
  - **成果物**: `src/hooks/useFollow.ts`
  - **実装内容**:
    ```typescript
    const { isFollowing, toggleFollow, isLoading } = useFollow(userId);
    ```
    - フォロー/アンフォローのトグル
    - 楽観的更新
    - エラー時のロールバック
  - **検証**:
    - フォロー追加 → followsテーブルにレコード追加
    - フォロー解除 → レコード削除
    - カウンターが更新されること

---

- [ ] **Task 5.2.3: フォローボタンコンポーネントの実装**
  - **目的**: フォローUIの共通化
  - **前提**: Task 5.2.2 完了
  - **成果物**: `src/components/FollowButton.tsx`
  - **実装内容**:
    - フォロー中/未フォロー状態の表示
    - ボタンスタイル切り替え
    - ローディング状態
  - **検証**: デザイン通りに動作すること

---

- [ ] **Task 5.2.4: プロフィール画面にフォローボタン追加**
  - **目的**: ユーザーをフォローできるようにする
  - **前提**: Task 5.2.3 完了
  - **成果物**: `ProfileScreen.tsx` への統合
  - **実装内容**:
    - 他人のプロフィール表示時にフォローボタン表示
    - フォロワー数/フォロー中数の表示
    - タップでフォロー/アンフォロー
  - **検証**:
    - 自分のプロフィールにはボタンが表示されないこと
    - フォロー数が正しく表示されること

---

- [ ] **Task 5.2.5: フォロワー/フォロー中リスト画面の実装**
  - **目的**: フォロー関係の一覧表示
  - **前提**: Task 5.2.4 完了
  - **成果物**:
    - `src/screens/profile/FollowersScreen.tsx`
    - `src/screens/profile/FollowingScreen.tsx`
  - **実装内容**:
    - フォロワー一覧（タップでプロフィールへ）
    - フォロー中一覧（タップでプロフィールへ）
    - 各ユーザーにフォローボタン
    - 空状態表示
  - **検証**:
    - プロフィール画面のフォロワー数/フォロー中数タップで遷移
    - 一覧が正しく表示されること

---

- [ ] **Task 5.2.6: フォロー中投稿フィード（Phase 3用の準備）**
  - **目的**: フォローしているユーザーの投稿一覧（未実装、準備のみ）
  - **前提**: Task 5.2.5 完了
  - **成果物**: ナビゲーション構造の準備
  - **実装内容**:
    - ホーム画面に「すべて」「フォロー中」タブを追加（UI のみ）
    - 「フォロー中」タップ時は「Phase 3で実装予定」メッセージ表示
  - **検証**: タブUIが表示されること
  - **備考**: Phase 3で実際のフィード機能を実装

---

### 5.3 通知機能（軽量版）

- [ ] **Task 5.3.1: 通知設計**
  - **目的**: Phase 1の通知仕様を決定
  - **前提**: Task 5.2.5 完了
  - **成果物**: 通知仕様ドキュメント
  - **実装内容**:
    - いいね通知
    - フォロー通知
    - スタンプ通知
    - プッシュ通知の設定（オプション）
  - **備考**: 詳細設計後にタスク分割

---

### 5.4 プレイサマリー

- [ ] **Task 5.4.1: 月間サマリーの実装**
  - **目的**: プレーヤーの活動状況を可視化
  - **前提**: Phase 0 完了
  - **成果物**: `src/components/PlayerSummary.tsx`
  - **実装内容**:
    - 月間投稿数
    - もらったいいね総数
    - もらったスタンプ総数
    - プロフィール画面に表示
  - **検証**: 統計が正しく集計されること

---

## ✅ Phase 1 完了判定

以下すべてにチェックが入ったらPhase 1完成：

- [ ] タグ検索が動作する
- [ ] フォロー/アンフォローが動作する
- [ ] フォロワー/フォロー中リストが表示される
- [ ] プロフィールにフォローボタンが表示される
- [ ] 既知のクリティカルバグがゼロ
- [ ] 内部テスターからのフィードバックを反映済み

---

**次のステップ**: Phase 2（コメント機能）の計画へ