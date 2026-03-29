# WALLER Phase 1 MVP 開発計画書

---

## 概要

要件定義書 v1.0 に基づく Phase 1 MVP のフルスクラッチ再構築。
7スプリント / 約5週間で、プレイヤー同士がクリップを投稿し拍手で応援しあえるコミュニティの基盤を構築する。

---

## 目次

1. [技術方針](#1-技術方針)
2. [ファイル構成](#2-ファイル構成)
3. [スプリント計画](#3-スプリント計画)
4. [リスクと対策](#4-リスクと対策)
5. [並列化可能なタスク](#5-並列化可能なタスク)
6. [受け入れ基準](#6-受け入れ基準)

---

## 1. 技術方針

### 1-1. スタックと主要ライブラリ

| 分類 | 技術 | 用途 |
|---|---|---|
| フレームワーク | React Native (Expo SDK 54+) | モバイルアプリ |
| 言語 | TypeScript (strict mode) | 型安全 |
| バックエンド | Supabase | PostgreSQL + Auth + Storage |
| 状態管理 | Zustand | 認証状態等のグローバル状態 |
| サーバー状態 | TanStack React Query | APIキャッシュ、ページネーション |
| ナビゲーション | React Navigation 6 | native-stack + bottom-tabs |
| i18n | react-i18next + expo-localization | 日英対応 |
| バリデーション | Zod | 入力検証 |
| アイコン | Lucide React Native | ラインスタイル、ストローク2px |
| 動画 | expo-av + expo-image-picker + expo-video-thumbnails | 再生・選択・サムネイル |
| 認証 | @react-native-google-signin + expo-apple-authentication | OAuth |
| ビルド | EAS Build | iOS/Android |

### 1-2. 設計原則

- **i18n First**: UIテキストは全て i18n キーで管理。ハードコード禁止
- **モノトーン + オレンジ**: デザインシステム定数を参照。直値禁止
- **イミュータブル**: オブジェクトは常に新規作成、ミューテーション禁止
- **小さいファイル**: 200-400行を目安、800行上限
- **楽観的更新**: 拍手等のリアクションは即座にUIに反映、バックグラウンドで同期
- **パスエイリアス**: `@/` = `src/` で import を簡潔に

### 1-3. 開発環境

- Expo Go は Google/Apple 認証が使えないため、**EAS dev client** を早期にセットアップ
- 開発用にメール認証のフォールバックを用意（本番では無効化）
- 既存の `.env` にSupabase接続情報あり（再利用可能）

---

## 2. ファイル構成

```
WALLER/
├── App.tsx                          # エントリーポイント
├── app.json                         # Expo設定
├── babel.config.js                  # Babel（パスエイリアス）
├── tsconfig.json                    # TypeScript（strict, パスエイリアス）
├── eas.json                         # EAS Build設定
├── package.json                     # 依存関係
│
├── supabase/
│   └── migrations/
│       ├── 001_create_tables.sql    # 11テーブル
│       ├── 002_create_triggers.sql  # 自動更新トリガー
│       ├── 003_create_rls_policies.sql  # Row Level Security
│       └── 004_create_storage.sql   # ストレージバケット
│
├── src/
│   ├── constants/
│   │   ├── colors.ts                # カラーパレット
│   │   ├── typography.ts            # フォントサイズ/ウェイト
│   │   ├── spacing.ts              # スペーシングスケール
│   │   └── config.ts               # アプリ定数（MAX_CLIP_DURATION等）
│   │
│   ├── i18n/
│   │   ├── index.ts                # i18next初期化
│   │   └── locales/
│   │       ├── ja.json             # 日本語
│   │       └── en.json             # 英語
│   │
│   ├── lib/
│   │   └── supabase.ts             # Supabaseクライアント
│   │
│   ├── types/
│   │   ├── database.ts             # Supabase DB型定義
│   │   ├── models.ts               # ドメイン型（User, Clip, Trick等）
│   │   └── navigation.ts           # React Navigationパラメータ型
│   │
│   ├── stores/
│   │   └── authStore.ts            # Zustand認証ストア
│   │
│   ├── hooks/
│   │   ├── useAuth.ts              # 認証（Google/Apple/セッション）
│   │   ├── useProfile.ts           # プロフィールCRUD
│   │   ├── useClips.ts             # クリップ一覧（useInfiniteQuery）
│   │   ├── useCreateClip.ts        # クリップ作成
│   │   ├── useEditClip.ts          # クリップ編集
│   │   ├── useDeleteClip.ts        # クリップ削除（制限付き）
│   │   ├── useBestPlays.ts         # ベストプレイCRUD
│   │   ├── useClap.ts              # 拍手（楽観的更新）
│   │   ├── useTricks.ts            # 技辞典（検索・カテゴリ）
│   │   ├── useCreateTrick.ts       # 新技登録
│   │   ├── useUserTricks.ts        # ユーザーの技習得状況
│   │   ├── useUserPosts.ts         # ユーザー別クリップ
│   │   ├── useReport.ts            # 通報
│   │   ├── useVideoPicker.ts       # 動画選択+バリデーション
│   │   └── useImagePicker.ts       # アバター選択
│   │
│   ├── services/
│   │   ├── storage.ts              # Supabase Storageヘルパー
│   │   └── video.ts               # 圧縮、サムネイル生成
│   │
│   ├── components/
│   │   ├── ui/                     # 汎用UIコンポーネント
│   │   │   ├── Button.tsx          # Primary/Secondary/Accent
│   │   │   ├── TextInput.tsx       # フォーム入力
│   │   │   ├── Tag.tsx             # Pill型タグ
│   │   │   ├── Avatar.tsx          # 丸型アバター
│   │   │   ├── Card.tsx            # カードコンテナ
│   │   │   ├── Toast.tsx           # トースト通知
│   │   │   ├── Spinner.tsx         # ローディング
│   │   │   ├── EmptyState.tsx      # 空状態
│   │   │   └── ErrorBoundary.tsx   # エラー境界
│   │   │
│   │   ├── ClipCard.tsx            # フィードのクリップカード
│   │   ├── ClipPlayer.tsx          # 動画プレイヤー（自動再生）
│   │   ├── ClapButton.tsx          # 拍手ボタン（アニメーション）
│   │   ├── MoodTag.tsx             # ムードタグ表示
│   │   ├── TrickTag.tsx            # 技タグ表示
│   │   ├── TrickListItem.tsx       # 技辞典行
│   │   ├── BestPlayCard.tsx        # ベストプレイサムネ
│   │   └── ProfileHeader.tsx       # プロフィールヘッダー（共通）
│   │
│   ├── navigation/
│   │   ├── RootNavigator.tsx       # 認証状態で分岐
│   │   ├── AuthStack.tsx           # Login → ProfileSetup
│   │   ├── MainTabs.tsx            # 4タブ（Home/Dict/Create/MyPage）
│   │   ├── HomeStack.tsx           # Feed → ClipDetail → UserProfile
│   │   ├── DictionaryStack.tsx     # TrickList → TrickDetail
│   │   └── MyPageStack.tsx         # MyPage → Edit/BestPlay/Settings
│   │
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx             # ログイン
│   │   │   └── ProfileSetupScreen.tsx      # プロフィール登録
│   │   ├── home/
│   │   │   ├── FeedScreen.tsx              # フィード
│   │   │   ├── ClipDetailScreen.tsx        # クリップ詳細
│   │   │   └── UserProfileScreen.tsx       # 他ユーザープロフィール
│   │   ├── post/
│   │   │   ├── CreateClipScreen.tsx        # クリップ投稿
│   │   │   └── EditClipScreen.tsx          # クリップ編集
│   │   ├── dictionary/
│   │   │   ├── TrickListScreen.tsx         # 技一覧
│   │   │   ├── TrickDetailScreen.tsx       # 技詳細
│   │   │   └── CreateTrickScreen.tsx       # 新技登録（モーダル）
│   │   ├── profile/
│   │   │   ├── MyPageScreen.tsx            # マイページ
│   │   │   ├── EditProfileScreen.tsx       # プロフィール編集
│   │   │   └── BestPlayManageScreen.tsx    # ベストプレイ管理
│   │   ├── settings/
│   │   │   └── SettingsScreen.tsx          # 設定
│   │   ├── report/
│   │   │   └── ReportModal.tsx             # 通報モーダル
│   │   └── common/
│   │       └── WebViewScreen.tsx           # 利用規約/プライバシー
│   │
│   └── utils/
│       ├── formatDate.ts            # 相対日付フォーマット
│       └── validation.ts           # Zodスキーマ一式
│
└── docs/
    ├── requirements_v1.0.md         # 要件定義書
    ├── dev_plan_v1.0.md            # 本ドキュメント
    └── market_research.md          # 市場調査
```

---

## 3. スプリント計画

### Sprint 1: 基盤構築（3-4日）

全ての後続作業が依存する土台。プロジェクト初期化、デザインシステム、i18n、DBスキーマ、ベースUI。

#### 1.1 プロジェクト初期化

- package.json 作成、全依存関係インストール
- 依存関係: なし
- リスク: Low

#### 1.2 設定ファイル

| ファイル | 内容 |
|---|---|
| app.json | name: "WALLER", slug, scheme: "waller", plugins（Google/Apple Sign-In） |
| babel.config.js | expo preset, module-resolver（@/ → src/） |
| tsconfig.json | strict: true, パスエイリアス |
| eas.json | development / preview / production プロファイル |

- 依存関係: 1.1
- リスク: Low

#### 1.3 デザインシステム定数

| ファイル | 内容 |
|---|---|
| colors.ts | ライトモードパレット: #FFFFFF, #F5F5F5, #1A1A1A, #6B6B6B, #E5E5E5, #FF8C00, #DC3545, #28A745 |
| typography.ts | heading 20-24px Bold, body 14-16px Regular, sub 12-13px, button 15px Semibold |
| spacing.ts | 4/8/12/16/20/24/32/48 スケール |
| config.ts | MAX_CLIP_DURATION=15, MIN_CLIP_DURATION=1, MAX_CLIP_SIZE_MB=50, MAX_BEST_PLAY_DURATION=60, MAX_BEST_PLAYS=3, MAX_CLAPS=10, MAX_DAILY_DELETES=3, FREE_DELETE_WINDOW_MIN=10, MAX_CAPTION_LENGTH=200, MAX_BIO_LENGTH=200, MAX_USERNAME_LENGTH=15, MIN_USERNAME_LENGTH=3 |

- 依存関係: なし
- リスク: Low

#### 1.4 i18nセットアップ

| ファイル | 内容 |
|---|---|
| i18n/index.ts | i18next初期化、expo-localizationで自動検出、フォールバック'en' |
| locales/ja.json | 全UIテキスト（日本語） |
| locales/en.json | 全UIテキスト（英語） |

キー構造:
```
auth.*, feed.*, clip.*, profile.*, dictionary.*, settings.*,
common.*, error.*, mood.* (mood.challenging, mood.landed, ...)
```

- 依存関係: 1.1
- リスク: Low（スクリーン構築時にキーを随時追加）

#### 1.5 Supabaseクライアント

- `src/lib/supabase.ts`: createClient with AsyncStorage
- 旧コードの axios ベース fetch を廃止（SDK 54 で標準 fetch を先にテスト）
- 依存関係: 1.1
- リスク: Medium（fetch 互換性問題の可能性 → axios フォールバック用意）

#### 1.6 TypeScript型定義

| ファイル | 内容 |
|---|---|
| database.ts | 全11テーブルのDatabase interface |
| models.ts | User, Clip, BestPlay, Trick, Clap, Report, MoodType, TrickCategory |
| navigation.ts | 全Stack/Tabのパラメータリスト型 |

- 依存関係: なし
- リスク: Low

#### 1.7 データベーススキーマ

**最重要タスク。** 4つのマイグレーションファイルで全DBを構築。

##### 001_create_tables.sql

要件定義書セクション5の全11テーブル:

| テーブル | 主な変更点（旧スキーマからの差分） |
|---|---|
| users | hometown, country_code, locale 追加。player_profilesを統合。facility_tag, team追加 |
| tricks | 新規。name_original, name_en, name_ja, aliases, category, created_by |
| clips | posts → clips にリネーム。mood追加（5種）、duration 1-15s、facility_tag |
| best_plays | 新規。user_id, video_url, thumbnail_url, duration 1-60s, title, sort_order |
| best_play_tricks | 新規。中間テーブル |
| clip_tricks | 新規。中間テーブル |
| user_tricks | 新規。status(landed/challenging), first_landed_at |
| claps | likes+reactions → claps に統合。count(1-10) |
| clip_counters | post_counters → clip_counters。clap_count, clap_total のみ |
| reports | target_type 追加（clip/comment 対応準備） |
| deletion_logs | 変更なし |

##### 002_create_triggers.sql

| トリガー | 動作 |
|---|---|
| updated_at自動更新 | 全テーブルのupdated_atを自動SET |
| clip_counters初期化 | clips INSERT時にcountersレコードを自動作成 |
| clap_counter更新 | claps INSERT/UPDATE/DELETE時にcountersを更新 |
| 3通報で自動非表示 | reports INSERT時に同一対象の通報数をチェック |
| **user_tricks自動更新** | clip_tricks INSERT時にclipのmoodを参照し、user_tricksをupsert。**landedは絶対にダウングレードしない** |

##### 003_create_rls_policies.sql

| テーブル | 読み取り | 書き込み |
|---|---|---|
| users | 全員 | 本人のみ |
| clips (published) | 全員 | 本人のみ |
| tricks | 全員 | 認証ユーザー |
| claps | 全員 | 認証ユーザー（自分のclapのみ更新/削除） |
| clip_counters | 全員 | トリガーのみ |
| reports | 通報者本人のみ | 認証ユーザー |
| best_plays | 全員 | 本人のみ |

##### 004_create_storage.sql

| バケット | 用途 | アクセス |
|---|---|---|
| clips | 動画 + サムネイル | 公開読み取り、認証書き込み |
| avatars | プロフィール画像 | 公開読み取り、認証書き込み |
| best-plays | ベストプレイ動画 + サムネイル | 公開読み取り、認証書き込み |

- 依存関係: なし（フロントエンドと独立して適用可能）
- リスク: **High**（user_tricksトリガーが最も複雑）

#### 1.8 ベースUIコンポーネント

| コンポーネント | スタイル |
|---|---|
| Button | Primary: 黒bg/白テキスト、Secondary: #F5F5F5/黒、Accent: #FF8C00/白。高さ48px、角丸12px |
| TextInput | 背景#F5F5F5、角丸12px、ボーダーなし。エラー時インライン表示 |
| Tag | pill型、背景#F5F5F5、角丸20px。ムードタグ「できた」はオレンジ |
| Avatar | 丸型、サイズ可変 |
| Card | 背景#F5F5F5、角丸16px、padding 16px、シャドウなし |
| Toast | 3秒自動消去 |
| Spinner | ローディングインジケータ |
| EmptyState | アイコン + メッセージ + オプションCTA |
| ErrorBoundary | レンダーエラーのキャッチとリカバリーUI |

- 依存関係: 1.3
- リスク: Low

#### 1.9 Appシェルとストア

| ファイル | 内容 |
|---|---|
| App.tsx | QueryClientProvider, I18nextProvider, SafeAreaProvider でラップ。RootNavigator描画 |
| authStore.ts | Zustand: user, session, loading, isAuthenticated, isProfileComplete |

- 依存関係: 1.1, 1.4, 1.5
- リスク: Low

---

### Sprint 2: 認証+プロフィール（3-4日）

#### 2.1 useAuth フック

- Google OAuth: signInWithIdToken パターン（旧コード参考）
- Apple OAuth: expo-apple-authentication + expo-crypto（nonce生成）
- Zustand ストアに書き込み（useState は使わない）
- onAuthStateChange リスナーでセッション自動復元
- profileComplete チェック: users テーブルに username + display_name が存在するか
- 依存関係: 1.5, 1.9
- リスク: Medium（webClientId の設定、dev build 必須）

#### 2.2 ナビゲーション構造

```
RootNavigator
├── 未認証 → AuthStack
│   ├── LoginScreen
│   └── ProfileSetupScreen
│
└── 認証済 → MainTabs
    ├── Home (HomeStack)
    │   ├── FeedScreen
    │   ├── ClipDetailScreen
    │   └── UserProfileScreen
    │
    ├── Dictionary (DictionaryStack)
    │   ├── TrickListScreen
    │   └── TrickDetailScreen
    │
    ├── + Create (CreateClipScreen)
    │   ※ タブアイコンはオレンジ(#FF8C00)
    │
    └── MyPage (MyPageStack)
        ├── MyPageScreen
        ├── EditProfileScreen
        ├── BestPlayManageScreen
        └── SettingsScreen
```

- タブバー: Lucide ラインアイコン、アクティブ=#FF8C00、非アクティブ=#1A1A1A
- 依存関係: 2.1
- リスク: Low

#### 2.3 ログイン画面

- WALLERテキストロゴ（黒、Bold）
- キャッチコピー（i18n）
- Google Sign-In ボタン（黒背景）
- Apple Sign-In ボタン（黒背景、iOS のみ）
- 依存関係: 2.1, 2.2, 1.8
- リスク: Low

#### 2.4 プロフィール登録画面

入力項目:

| 項目 | 必須 | バリデーション |
|---|---|---|
| @ユーザーID | 必須 | `^[a-z0-9_]{3,15}$`、リアルタイム重複チェック（debounce） |
| 表示名 | 必須 | 1-30文字 |
| アバター | 任意 | 5MB以下、正方形推奨 |
| ホームタウン | 任意 | 30文字 |
| 施設 | 任意 | フリー入力 or 既存検索 |
| チーム | 任意 | フリー入力 |
| 自己紹介 | 任意 | 200文字 |

関連ファイル:
- `useProfile.ts`: createProfile, updateProfile, fetchProfile
- `useImagePicker.ts`: アバター選択、サイズバリデーション
- `services/storage.ts`: uploadAvatar, uploadClipVideo, uploadThumbnail, uploadBestPlay
- `utils/validation.ts`: Zodスキーマ（username, profile, clip, trick, report）

- 依存関係: 2.1, 1.7, 1.8
- リスク: Medium（ユーザー名重複チェックのデバウンス）

---

### Sprint 3: フィード+クリップ投稿（4-5日）

#### 3.1 動画選択/処理

| 機能 | 実装 |
|---|---|
| 動画選択 | expo-image-picker、mediaTypes: video |
| 尺バリデーション | クリップ: 1-15秒、ベストプレイ: 1-60秒 |
| サイズバリデーション | クリップ: 50MB、ベストプレイ: 100MB |
| 圧縮 | MediumQuality, 720p上限 |
| サムネイル | expo-video-thumbnails、1秒目を抽出 |

- 依存関係: 1.1
- リスク: **High**（デバイスごとの動画メタデータ取得の差異）

#### 3.2 クリップ投稿画面

投稿フロー:

```
動画選択 → バリデーション
    ↓
ムードタグ選択（必須、5種のpillボタン）
    ↓
技タグ検索/選択（任意、複数可、新規登録可能）
    ↓
施設タグ（任意）
    ↓
キャプション（任意、200文字）
    ↓
投稿（アップロードシーケンス）
```

アップロードシーケンス:
1. 動画 → Supabase Storage (clips バケット)
2. サムネイル → Supabase Storage (clips バケット)
3. clips テーブルに INSERT
4. clip_tricks テーブルに INSERT（技タグがある場合）
5. 成功 → フィードキャッシュ invalidate

失敗時: ステップ3-4でエラーの場合、ステップ1-2のストレージをクリーンアップ

- 依存関係: 3.1, 1.7, 1.8
- リスク: **High**（マルチステップアップロードの原子性）

#### 3.3 フィード画面

- FlatList + useInfiniteQuery
- ORDER BY created_at DESC
- 10件ずつページング、下部スクロールで自動読み込み
- プルリフレッシュ
- 自動再生: ミュート、画面内の1投稿のみ（viewabilityConfig）
- 空状態: i18nメッセージ表示

ClipCard 表示内容:
```
@username · 施設名
[動画（自動再生）]
[ムードタグ] [#技タグ]
キャプション
👏 拍手数          ···メニュー
```

- 依存関係: 3.2（クリップが存在する必要）, 1.7, 1.8
- リスク: Medium（自動再生のパフォーマンス）

#### 3.4 クリップ詳細画面

- フルサイズ動画プレイヤー
- ユーザー情報（タップ → UserProfile）
- ムード・技タグ（技タップ → TrickDetail）
- キャプション全文
- 拍手ボタン
- メニュー: 編集（自分）、削除（自分）、通報（他人）

- 依存関係: 3.3
- リスク: Low

#### 3.5 拍手機能

| 動作 | 仕様 |
|---|---|
| タップ | 未拍手 → 1拍手で作成 |
| 連打 | 短い間隔でタップ → カウント増加（最大10） |
| 再タップ | 拍手済み → 取り消し |
| サーバー同期 | 500msデバウンス。連打を1回のupsertにまとめる |
| UI更新 | 楽観的更新（即座にUI反映、バックグラウンドで同期） |

ClapButton:
- 拍手アイコン（未拍手: #1A1A1A、拍手済み: #FF8C00）
- 合計拍手数表示
- タップ時にオレンジのパーティクルアニメーション

- 依存関係: 1.7
- リスク: Medium（連打デバウンスのロジック）

---

### Sprint 4: 技辞典（2-3日）

#### 4.1 技一覧画面

- 検索バー（デバウンス付き）
- カテゴリフィルタ: [全て] [フリップ] [ツイスト] [コンボ] [オリジナル] [その他]
- 各技の表示: 名前（ローカライズ）、投稿数、挑戦者数
- タップ → TrickDetailScreen
- 依存関係: 1.7, 1.8
- リスク: Low

#### 4.2 技詳細画面

- 技名（オリジナル + ローカライズ）
- カテゴリ
- 命名者（@username、新技の場合）
- 統計: clip_count, challenger_count
- この技のクリップ一覧（サムネイルグリッド）
- この技を習得したプレイヤー一覧
- 依存関係: 4.1
- リスク: Low

#### 4.3 新技登録（モーダル）

入力:
- 技名（オリジナル言語、必須）
- 英語名（推奨、未入力時はオリジナル名を使用）
- カテゴリ（必須、ピッカー）

登録時 created_by に現在のユーザーIDを記録。

- 依存関係: 1.7
- リスク: Low

#### 4.4 技-プレイヤー自動紐づけ

DBトリガーで実装（002_create_triggers.sql）:

```
clip_tricks INSERT
    ↓
clipのmoodを取得
    ↓
mood = landed / showcase → user_tricks.status = 'landed'
                            first_landed_at = COALESCE(existing, now())
mood = challenging / training / first_time → user_tricks.status = 'challenging'
                                              ※ 既にlandedならNO-OP
```

フロントエンド:
- `useUserTricks.ts`: ユーザーの技習得状況を取得（プロフィール表示用）

- 依存関係: 1.7
- リスク: Medium（トリガーのエッジケーステスト必須）

---

### Sprint 5: プロフィール+ベストプレイ（3-4日）

#### 5.1 マイページ画面

```
┌──────────────────────────┐
│       アバター（大）       │
│     @username             │
│     表示名                │
│     ホームタウン / 施設     │
│                          │
│  ┌─────────┐ ┌─────────┐ │
│  │  投稿    │ │  拍手    │ │
│  │   42     │ │  1.2k   │ │
│  └─────────┘ └─────────┘ │
│                          │
│  習得: 8技  挑戦中: 3技   │
│                          │
│  BEST PLAY               │
│  ┌────┐ ┌────┐ ┌────┐   │
│  │ 60s│ │ 60s│ │ +  │   │
│  └────┘ └────┘ └────┘   │
│                          │
│  CLIPS                   │
│  ┌────┐┌────┐┌────┐     │
│  │    ││    ││    │     │
│  └────┘└────┘└────┘     │
└──────────────────────────┘
```

- 依存関係: 2.4, 3.3, 4.4
- リスク: Low

#### 5.2 ユーザープロフィール画面

- マイページと同じレイアウト（ProfileHeaderを共通化）
- 編集ボタンなし
- メニューに通報オプション
- 依存関係: 5.1
- リスク: Low

#### 5.3 プロフィール編集画面

- 表示名、アバター、ホームタウン、施設、チーム、自己紹介の編集
- @ID変更: username_change_count = 0 の場合のみ許可。変更は1回限りの警告表示
- 依存関係: 2.4
- リスク: Low

#### 5.4 ベストプレイ管理画面

- 3枠表示（空枠は「+ 追加」ボタン）
- 追加: 動画選択（60秒以内、100MB以内）→ タイトル（任意50文字）→ ムード/技/施設タグ（任意）→ アップロード
- 入替: 旧動画をストレージから削除 → 新動画をアップロード
- 削除: 確認ダイアログ → ストレージ + DBから削除
- プログレスバー表示（60秒動画は大きいため）

- 依存関係: 3.1, 1.7
- リスク: Medium（60秒動画のアップロード時間、ストレージクリーンアップ）

---

### Sprint 6: 編集/削除/通報（2-3日）

#### 6.1 クリップ編集画面

- 編集可能: キャプション、ムードタグ、技タグ、施設タグ
- 編集不可: 動画（表示のみ）
- 技タグ変更時: clip_tricks を差し替え（DELETE old → INSERT new）
- ムード変更時: user_tricks の再評価が必要（他のlandedクリップが存在するかチェック）
- 依存関係: 3.2
- リスク: Medium

#### 6.2 クリップ削除

| 条件 | 制限 |
|---|---|
| 投稿後10分以内 | 無制限 |
| 10分経過後 | 1日3回まで（UTC日付境界で判定） |

処理:
1. 削除ルールチェック（deletion_logs テーブル参照）
2. clip.status = 'deleted' に更新
3. deletion_logs に INSERT
4. Supabase Storage から動画 + サムネイル削除

- 依存関係: 1.7
- リスク: Medium（タイムゾーン処理）

#### 6.3 通報モーダル

- 理由選択（5種）+ 自由記述（100文字、任意）
- 重複通報防止（同一ユーザー × 同一対象）
- 3通報で自動非表示（DBトリガー）
- 依存関係: 1.7
- リスク: Low

---

### Sprint 7: 設定+仕上げ（2-3日）

#### 7.1 設定画面

| 項目 | 動作 |
|---|---|
| 言語切替 | i18next の言語変更 + user.locale を更新 |
| 利用規約 | WebView で docs/terms.html を表示 |
| プライバシーポリシー | WebView で docs/privacy.html を表示 |
| アカウント削除 | 確認モーダル → user.status = 'deleted' |
| ログアウト | Supabase signOut + Zustand クリア |
| アプリバージョン | 表示のみ |

- 依存関係: 1.4, 2.1
- リスク: Low

#### 7.2 エラーハンドリング監査

要件定義書セクション8の全エラーケースを確認:
- 動画エラー: サイズ超過、尺違反、形式不正、アップロード失敗 → i18nメッセージ
- ネットワークエラー: オフライン検出、再試行ボタン
- フォームエラー: インラインバリデーション
- 表示方法: モーダル（重大）、トースト（軽微）、インライン（フォーム）

- 依存関係: 全スプリント
- リスク: Low

#### 7.3 フィード自動再生最適化

- ビューポート外の動画をアンロード（メモリ管理）
- 2つ以上離れた動画はサムネイル表示のみ
- 次の動画をプリロード
- 実機での50件以上のスクロールテスト

- 依存関係: 3.3
- リスク: Medium（iOS/Androidでパフォーマンス差）

#### 7.4 i18n最終監査

- 全画面をJapanese/Englishで通しテスト
- ハードコード文字列の完全排除
- 技名の多言語表示確認（オリジナル + ローカライズ）

- 依存関係: 全スプリント
- リスク: Low

---

## 4. リスクと対策

| リスク | 重要度 | 影響 | 対策 |
|---|---|---|---|
| 動画アップロード途中失敗 | High | データ不整合 | リトライ+指数バックオフ。プログレスバー。部分アップロードのクリーンアップ処理 |
| user_tricksトリガーの複雑さ | High | 技習得状況の不整合 | SQLテストを充実。「landedは絶対にダウングレードしない」ルールを厳密にテスト。ムード変更時の再評価ロジック |
| フィード自動再生パフォーマンス | Medium | UX劣化、メモリリーク | ビューポート外動画のアンロード。サムネイルでの遅延再生。低スペック端末でテスト |
| Supabase fetch互換性 | Medium | API通信不可 | 標準fetchを先にテスト。axios polyfillをフォールバックとして準備 |
| 拍手の連打デバウンス | Medium | 不正なカウント | ローカルカウンター + 500ms タイムアウトでサーバー同期。楽観的UI更新 |
| Expo Goの制限 | Medium | Google/Apple認証不可 | EAS dev clientを Sprint 1 で即セットアップ。開発用メール認証フォールバック |
| 技名の重複・表記揺れ | Low | 辞典の品質低下 | MVP では許容。Phase 2 でモデレーション/マージ機能を追加 |
| 60秒動画のアップロード時間 | Low | ベストプレイ登録のUX | プログレスバー、リトライ機能、バックグラウンドアップロード検討 |

---

## 5. 並列化可能なタスク

以下のタスクは独立しており、並列に進められる:

| グループA | グループB | 開始条件 |
|---|---|---|
| DBマイグレーション (1.7) | フロントエンド初期化 (1.1-1.4) | なし（同時開始可能） |
| デザインシステム (1.3, 1.8) | i18nセットアップ (1.4) | なし |
| フィード画面 (3.3) | 技辞典 (4.1, 4.2) | Sprint 2 完了後 |
| ベストプレイ管理 (5.4) | クリップ編集/削除 (6.1, 6.2) | Sprint 3 完了後 |
| 設定画面 (7.1) | 通報モーダル (6.3) | 独立 |

---

## 6. 受け入れ基準

Phase 1 MVP の完成判定チェックリスト:

### 認証・プロフィール
- [ ] Google OAuth でサインアップ/ログインできる
- [ ] Apple OAuth でサインアップ/ログインできる（iOS）
- [ ] プロフィール登録（@ID、表示名、アバター等）が完了できる
- [ ] @IDの重複チェックがリアルタイムで動作する

### クリップ投稿
- [ ] 15秒以内の動画を選択・投稿できる
- [ ] ムードタグ（必須）を選択できる
- [ ] 技タグ（任意）を検索・選択・複数追加できる
- [ ] 施設タグ（任意）を入力できる
- [ ] キャプション（任意、200文字）を入力できる
- [ ] サムネイルが自動生成される

### ベストプレイ
- [ ] プロフィールに最大3本の60秒動画をアップロードできる
- [ ] ベストプレイを入替・削除できる
- [ ] ベストプレイをネイティブ再生で視聴できる

### フィード
- [ ] クリップが新着順で表示される
- [ ] 自動再生（ミュート、1投稿のみ）が動作する
- [ ] 10件ずつページングが動作する
- [ ] プルリフレッシュが動作する

### 拍手
- [ ] タップで1拍手が送れる
- [ ] 連打で拍手数が増加する（最大10）
- [ ] 再タップで拍手を取り消せる
- [ ] 拍手が即座にUI反映される（楽観的更新）

### 技辞典
- [ ] 技一覧ページでカテゴリフィルタ・検索ができる
- [ ] 技詳細ページで関連クリップが見れる
- [ ] 新しい技を登録でき、命名者として記録される
- [ ] 投稿の技タグが辞典に自動反映される

### 技-プレイヤー紐づけ
- [ ] 「できた」ムードで投稿すると、プロフィールに「習得済み」として表示される
- [ ] 「挑戦中」ムードで投稿すると、「挑戦中」として表示される
- [ ] 一度「習得済み」になった技がダウングレードしない

### 投稿管理
- [ ] クリップの編集（キャプション/ムード/タグ）ができる
- [ ] 投稿後10分以内は制限なく削除できる
- [ ] 10分経過後は1日3回まで削除できる

### 通報
- [ ] 通報理由を選択して送信できる
- [ ] 3人の通報でクリップが自動非表示になる
- [ ] 同一ユーザーの重複通報が防止される

### 設定
- [ ] ログアウトできる
- [ ] 言語切替（日本語/英語）が動作する
- [ ] 利用規約・プライバシーポリシーが表示できる

### デザイン・品質
- [ ] 全画面がモノトーン+オレンジアクセントで統一されている
- [ ] 全UIテキストがi18nキーで管理されている（ハードコード文字列なし）
- [ ] console.log がプロダクションコードに残っていない
- [ ] UIにアイコンが使われている（Lucide、ラインスタイル）

---

## タイムライン

| スプリント | 期間 | 累積 |
|---|---|---|
| Sprint 1: 基盤構築 | 3-4日 | Week 1 |
| Sprint 2: 認証+プロフィール | 3-4日 | Week 1-2 |
| Sprint 3: フィード+クリップ投稿 | 4-5日 | Week 2-3 |
| Sprint 4: 技辞典 | 2-3日 | Week 3 |
| Sprint 5: プロフィール+ベストプレイ | 3-4日 | Week 3-4 |
| Sprint 6: 編集/削除/通報 | 2-3日 | Week 4 |
| Sprint 7: 設定+仕上げ | 2-3日 | Week 4-5 |
| **合計** | **20-26日** | **約5週間** |

---

## 参照ドキュメント

- [要件定義書 v1.0](./requirements_v1.0.md)
- [市場調査](./market_research.md)
- 旧コード参照: `_archive/v0/`

---

**END OF DOCUMENT**
