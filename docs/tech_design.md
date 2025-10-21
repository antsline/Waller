# 🔧 Waller 技術設計書 v1.0

---

## 📌 目次

1. [アーキテクチャ概要](#1-アーキテクチャ概要)
2. [技術スタック詳細](#2-技術スタック詳細)
3. [Supabaseプロジェクト設定](#3-supabaseプロジェクト設定)
4. [データベース設計](#4-データベース設計)
5. [RLSポリシー](#5-rlsポリシー)
6. [ストレージ設定](#6-ストレージ設定)
7. [認証フロー](#7-認証フロー)
8. [API設計](#8-api設計)
9. [フロントエンド構成](#9-フロントエンド構成)
10. [環境変数・設定](#10-環境変数設定)
11. [デプロイ・CI/CD](#11-デプロイcicd)

---

## 1. アーキテクチャ概要

### 1-1. システム構成図

```
┌─────────────────────────────────────────┐
│         React Native (Expo)              │
│  ┌─────────────────────────────────┐    │
│  │  Screens (画面)                   │    │
│  │  - Auth / Home / Profile / Post  │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │  Hooks (ビジネスロジック)          │    │
│  │  - useAuth / usePosts / etc      │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │  Services (API Layer)            │    │
│  │  - supabaseClient                │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
                    ↓ HTTPS
┌─────────────────────────────────────────┐
│            Supabase                      │
│  ┌─────────────────────────────────┐    │
│  │  Auth (Google/Apple)             │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │  PostgreSQL + RLS                │    │
│  │  - users / posts / likes / etc   │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │  Storage (動画・画像)              │    │
│  │  - videos / avatars              │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │  Edge Functions (オプション)       │    │
│  │  - 通知 / バッチ処理               │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### 1-2. データフロー

#### 投稿フロー
```
1. ユーザーが動画選択
   ↓
2. クライアント側で圧縮・サムネイル生成
   ↓
3. Supabase Storageにアップロード
   ↓
4. postsテーブルにメタデータ挿入
   ↓
5. トリガーでpost_countersに初期値挿入
   ↓
6. フィードに表示（リアルタイム更新）
```

#### リアクションフロー
```
1. ユーザーがいいね/スタンプ押下
   ↓
2. 楽観的更新（UI即座に反映）
   ↓
3. likes/reactionsテーブルに挿入
   ↓
4. トリガーでpost_countersを更新
   ↓
5. エラー時はロールバック
```

---

## 2. 技術スタック詳細

### 2-1. フロントエンド

| 技術 | バージョン | 用途 |
|---|---|---|
| **React Native** | 0.74+ | UIフレームワーク |
| **Expo** | SDK 51+ | 開発環境・ビルドツール |
| **TypeScript** | 5.0+ | 型安全性 |
| **React Navigation** | 6.0+ | ルーティング |
| **Zustand** | 4.0+ | グローバル状態管理 |
| **React Query** | 5.0+ | サーバーステート管理・キャッシュ |
| **expo-image-picker** | - | 動画選択 |
| **expo-video-thumbnails** | - | サムネイル生成 |
| **expo-av** | - | 動画再生 |

### 2-2. バックエンド

| 技術 | 用途 |
|---|---|
| **Supabase** | BaaS（Backend as a Service） |
| **PostgreSQL** | リレーショナルDB |
| **PostgREST** | 自動生成REST API |
| **GoTrue** | 認証サービス |
| **Supabase Storage** | オブジェクトストレージ |

### 2-3. 開発ツール

| ツール | 用途 |
|---|---|
| **EAS (Expo Application Services)** | ビルド・デプロイ |
| **ESLint + Prettier** | コード品質 |
| **Jest + React Native Testing Library** | テスト |
| **GitHub Actions** | CI/CD |

---

## 3. Supabaseプロジェクト設定

### 3-1. プロジェクト作成

1. [Supabase Dashboard](https://supabase.com/dashboard) でプロジェクト作成
2. プロジェクト名: `waller-mvp`
3. リージョン: `Northeast Asia (Tokyo)` 推奨
4. データベースパスワード: 強力なものを設定

### 3-2. プラン選択

- **開発環境**: Free tier
- **本番環境**: Pro ($25/month)
  - Storage: 100GB
  - 帯域幅: 200GB/month
  - 自動バックアップ

### 3-3. 認証プロバイダー設定

#### Google OAuth
```
1. Google Cloud Console でプロジェクト作成
2. OAuth 2.0 クライアントID作成
   - iOS: Bundle ID登録
   - Android: SHA-1登録
3. Supabase Dashboard > Authentication > Providers > Google
   - Client ID / Client Secret 設定
```

#### Apple Sign In
```
1. Apple Developer Console で設定
2. Services ID作成
3. Supabase Dashboard > Authentication > Providers > Apple
   - Services ID / Key ID / Team ID / Private Key 設定
```

---

## 4. データベース設計

### 4-1. スキーマ作成SQL

```sql
-- ====================================
-- 1. users テーブル
-- ====================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('player', 'fan')),
  username TEXT UNIQUE NOT NULL CHECK (
    username ~ '^[a-z0-9_]{3,15}$'
  ),
  display_name TEXT NOT NULL CHECK (
    char_length(display_name) >= 1 AND char_length(display_name) <= 30
  ),
  avatar_url TEXT,
  bio TEXT CHECK (char_length(bio) <= 100),
  username_change_count INTEGER NOT NULL DEFAULT 0 CHECK (username_change_count <= 1),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- インデックス
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_status ON users(status);

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- 2. player_profiles テーブル
-- ====================================
CREATE TABLE player_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  experience_years INTEGER NOT NULL CHECK (experience_years >= 0),
  experience_months INTEGER NOT NULL CHECK (experience_months >= 0 AND experience_months < 12),
  skill_level INTEGER NOT NULL CHECK (skill_level >= 1 AND skill_level <= 5),
  team_name TEXT CHECK (char_length(team_name) <= 50),
  home_gym TEXT CHECK (char_length(home_gym) <= 50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_player_profiles_updated_at
  BEFORE UPDATE ON player_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- 3. posts テーブル
-- ====================================
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  video_duration INTEGER NOT NULL CHECK (video_duration >= 3 AND video_duration <= 60),
  video_size BIGINT NOT NULL CHECK (video_size <= 104857600), -- 100MB
  caption TEXT CHECK (char_length(caption) <= 200),
  category_tag TEXT CHECK (
    category_tag IN ('challenge', 'success', 'practice', 'combo', 'new', 'other')
  ),
  status TEXT NOT NULL DEFAULT 'published' CHECK (
    status IN ('published', 'deleted', 'reported')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_category_tag ON posts(category_tag) WHERE status = 'published';

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- 4. likes テーブル
-- ====================================
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- インデックス
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_user_created ON likes(user_id, created_at DESC);

-- ====================================
-- 5. reactions テーブル
-- ====================================
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (
    reaction_type IN ('fire', 'clap', 'sparkle', 'muscle')
  ),
  previous_type TEXT CHECK (
    previous_type IN ('fire', 'clap', 'sparkle', 'muscle')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- インデックス
CREATE INDEX idx_reactions_post_id ON reactions(post_id);
CREATE INDEX idx_reactions_user_id ON reactions(user_id);

CREATE TRIGGER update_reactions_updated_at
  BEFORE UPDATE ON reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- 6. post_counters テーブル（非正規化）
-- ====================================
CREATE TABLE post_counters (
  post_id UUID PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
  like_count INTEGER NOT NULL DEFAULT 0,
  reaction_fire_count INTEGER NOT NULL DEFAULT 0,
  reaction_clap_count INTEGER NOT NULL DEFAULT 0,
  reaction_sparkle_count INTEGER NOT NULL DEFAULT 0,
  reaction_muscle_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================
-- 7. reports テーブル
-- ====================================
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reporter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (
    reason IN ('inappropriate', 'spam', 'harassment', 'impersonation', 'other')
  ),
  reason_detail TEXT CHECK (char_length(reason_detail) <= 100),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'resolved', 'dismissed')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, reporter_user_id)
);

-- インデックス
CREATE INDEX idx_reports_post_id ON reports(post_id);
CREATE INDEX idx_reports_status ON reports(status);

-- ====================================
-- 8. deletion_logs テーブル
-- ====================================
CREATE TABLE deletion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_deletion_logs_user_deleted ON deletion_logs(user_id, deleted_at);
```

### 4-2. カウンター自動更新トリガー

```sql
-- ====================================
-- post_counters 自動更新トリガー
-- ====================================

-- 投稿作成時に初期化
CREATE OR REPLACE FUNCTION initialize_post_counters()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO post_counters (post_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_initialize_post_counters
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION initialize_post_counters();

-- いいね追加・削除時に更新
CREATE OR REPLACE FUNCTION update_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE post_counters
    SET like_count = like_count + 1,
        updated_at = NOW()
    WHERE post_id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE post_counters
    SET like_count = like_count - 1,
        updated_at = NOW()
    WHERE post_id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_like_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_like_count();

-- リアクション追加・更新・削除時に更新
CREATE OR REPLACE FUNCTION update_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 新規追加
    UPDATE post_counters
    SET 
      reaction_fire_count = reaction_fire_count + CASE WHEN NEW.reaction_type = 'fire' THEN 1 ELSE 0 END,
      reaction_clap_count = reaction_clap_count + CASE WHEN NEW.reaction_type = 'clap' THEN 1 ELSE 0 END,
      reaction_sparkle_count = reaction_sparkle_count + CASE WHEN NEW.reaction_type = 'sparkle' THEN 1 ELSE 0 END,
      reaction_muscle_count = reaction_muscle_count + CASE WHEN NEW.reaction_type = 'muscle' THEN 1 ELSE 0 END,
      updated_at = NOW()
    WHERE post_id = NEW.post_id;
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- 種類変更
    UPDATE post_counters
    SET 
      -- 古いタイプを減算
      reaction_fire_count = reaction_fire_count - CASE WHEN OLD.reaction_type = 'fire' THEN 1 ELSE 0 END,
      reaction_clap_count = reaction_clap_count - CASE WHEN OLD.reaction_type = 'clap' THEN 1 ELSE 0 END,
      reaction_sparkle_count = reaction_sparkle_count - CASE WHEN OLD.reaction_type = 'sparkle' THEN 1 ELSE 0 END,
      reaction_muscle_count = reaction_muscle_count - CASE WHEN OLD.reaction_type = 'muscle' THEN 1 ELSE 0 END,
      -- 新しいタイプを加算
      reaction_fire_count = reaction_fire_count + CASE WHEN NEW.reaction_type = 'fire' THEN 1 ELSE 0 END,
      reaction_clap_count = reaction_clap_count + CASE WHEN NEW.reaction_type = 'clap' THEN 1 ELSE 0 END,
      reaction_sparkle_count = reaction_sparkle_count + CASE WHEN NEW.reaction_type = 'sparkle' THEN 1 ELSE 0 END,
      reaction_muscle_count = reaction_muscle_count + CASE WHEN NEW.reaction_type = 'muscle' THEN 1 ELSE 0 END,
      updated_at = NOW()
    WHERE post_id = NEW.post_id;
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- 削除
    UPDATE post_counters
    SET 
      reaction_fire_count = reaction_fire_count - CASE WHEN OLD.reaction_type = 'fire' THEN 1 ELSE 0 END,
      reaction_clap_count = reaction_clap_count - CASE WHEN OLD.reaction_type = 'clap' THEN 1 ELSE 0 END,
      reaction_sparkle_count = reaction_sparkle_count - CASE WHEN OLD.reaction_type = 'sparkle' THEN 1 ELSE 0 END,
      reaction_muscle_count = reaction_muscle_count - CASE WHEN OLD.reaction_type = 'muscle' THEN 1 ELSE 0 END,
      updated_at = NOW()
    WHERE post_id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_reaction_count
  AFTER INSERT OR UPDATE OR DELETE ON reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_reaction_count();
```

### 4-3. 通報による自動非表示トリガー

```sql
-- ====================================
-- 通報が3件以上で自動非表示
-- ====================================
CREATE OR REPLACE FUNCTION auto_hide_reported_posts()
RETURNS TRIGGER AS $$
DECLARE
  report_count INTEGER;
BEGIN
  -- 該当投稿の通報数をカウント
  SELECT COUNT(*) INTO report_count
  FROM reports
  WHERE post_id = NEW.post_id AND status = 'pending';
  
  -- 3件以上なら自動非表示
  IF report_count >= 3 THEN
    UPDATE posts
    SET status = 'reported'
    WHERE id = NEW.post_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_hide_reported_posts
  AFTER INSERT ON reports
  FOR EACH ROW
  EXECUTE FUNCTION auto_hide_reported_posts();
```

---

## 5. RLSポリシー

### 5-1. RLS有効化

```sql
-- すべてのテーブルでRLSを有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE deletion_logs ENABLE ROW LEVEL SECURITY;
```

### 5-2. usersテーブルのポリシー

```sql
-- 全員が全ユーザーを参照可能（公開プロフィール）
CREATE POLICY "Users are viewable by everyone"
  ON users FOR SELECT
  USING (status = 'active');

-- 自分のレコードのみ挿入可能
CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 自分のレコードのみ更新可能
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

### 5-3. player_profilesテーブルのポリシー

```sql
-- 全員が閲覧可能
CREATE POLICY "Player profiles are viewable by everyone"
  ON player_profiles FOR SELECT
  USING (true);

-- プレーヤーのみ自分のプロフィール作成可能
CREATE POLICY "Players can insert their own profile"
  ON player_profiles FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'player')
  );

-- 自分のプロフィールのみ更新可能
CREATE POLICY "Players can update their own profile"
  ON player_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### 5-4. postsテーブルのポリシー

```sql
-- 公開済み投稿は全員閲覧可能
CREATE POLICY "Published posts are viewable by everyone"
  ON posts FOR SELECT
  USING (status = 'published');

-- プレーヤーのみ投稿可能
CREATE POLICY "Players can insert posts"
  ON posts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'player')
  );

-- 自分の投稿のみ更新可能
CREATE POLICY "Users can update their own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 自分の投稿のみ削除可能
CREATE POLICY "Users can delete their own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);
```

### 5-5. likes/reactionsテーブルのポリシー

```sql
-- いいね・リアクションは全員閲覧可能
CREATE POLICY "Likes are viewable by everyone"
  ON likes FOR SELECT
  USING (true);

CREATE POLICY "Reactions are viewable by everyone"
  ON reactions FOR SELECT
  USING (true);

-- 認証済みユーザーはいいね可能
CREATE POLICY "Authenticated users can insert likes"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert reactions"
  ON reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 自分のいいね・リアクションのみ削除可能
CREATE POLICY "Users can delete their own likes"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
  ON reactions FOR DELETE
  USING (auth.uid() = user_id);

-- 自分のリアクションのみ更新可能
CREATE POLICY "Users can update their own reactions"
  ON reactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### 5-6. post_countersテーブルのポリシー

```sql
-- カウンターは全員閲覧可能
CREATE POLICY "Post counters are viewable by everyone"
  ON post_counters FOR SELECT
  USING (true);

-- カウンターはトリガーのみ更新（直接更新不可）
-- 挿入・更新・削除ポリシーは設定しない
```

### 5-7. reportsテーブルのポリシー

```sql
-- 通報は本人と運営のみ閲覧可能（運営判定は後で実装）
CREATE POLICY "Users can view their own reports"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_user_id);

-- 認証済みユーザーは通報可能
CREATE POLICY "Authenticated users can insert reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_user_id);
```

### 5-8. deletion_logsテーブルのポリシー

```sql
-- 削除ログは運営のみ閲覧（一般ユーザーは見えない）
-- SELECTポリシーなし = デフォルト拒否

-- ログ挿入は削除時の関数から自動実行
-- INSERTポリシーは不要（サービスロールで実行）
```

---

## 6. ストレージ設定

### 6-1. バケット作成

```sql
-- videos バケット（動画・サムネイル）
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true);

-- avatars バケット（プロフィール画像）
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);
```

### 6-2. ストレージポリシー

```sql
-- ====================================
-- videos バケット
-- ====================================

-- 全員が動画・サムネイルを閲覧可能
CREATE POLICY "Videos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'videos');

-- 認証済みユーザーは自分のフォルダにアップロード可能
CREATE POLICY "Users can upload videos to their own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 自分がアップロードしたファイルのみ削除可能
CREATE POLICY "Users can delete their own videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ====================================
-- avatars バケット
-- ====================================

-- 全員がアバターを閲覧可能
CREATE POLICY "Avatars are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- 認証済みユーザーは自分のアバターをアップロード可能
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 自分のアバターのみ更新・削除可能
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 6-3. ファイルパス構造

```
videos/
  └── {user_id}/
      ├── {post_id}.mp4          # 動画本体
      └── {post_id}_thumb.jpg    # サムネイル

avatars/
  └── {user_id}/
      └── avatar.jpg             # プロフィール画像
```

---

## 7. 認証フロー

### 7-1. サインアップフロー

```typescript
// 1. Google/Apple認証
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google', // or 'apple'
  options: {
    redirectTo: 'waller://auth/callback',
  },
});

// 2. 認証成功後、usersテーブルにレコード作成
const { error: insertError } = await supabase
  .from('users')
  .insert({
    id: user.id,
    role: 'player', // or 'fan'
    username: 'takeshi_123',
    display_name: 'タケシ',
  });

// 3. プレーヤーの場合、player_profilesにレコード作成
if (role === 'player') {
  await supabase
    .from('player_profiles')
    .insert({
      user_id: user.id,
      experience_years: 1,
      experience_months: 6,
      skill_level: 3,
    });
}
```

### 7-2. セッション管理

```typescript
// セッション取得
const { data: { session } } = await supabase.auth.getSession();

// セッション変更を監視
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // last_login_at更新
    supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', session.user.id)
      .then();
  }
});
```

---

## 8. API設計

### 8-1. クエリ例

#### フィード取得（新着順）
```typescript
const { data, error } = await supabase
  .from('posts')
  .select(`
    *,
    user:users!inner(username, display_name, avatar_url),
    player_profile:player_profiles(skill_level, experience_years, experience_months, team_name, home_gym),
    counters:post_counters(*)
  `)
  .eq('status', 'published')
  .order('created_at', { ascending: false })
  .range(0, 9); // 10件取得
```

#### プロフィールフィード
```typescript
const { data, error } = await supabase
  .from('posts')
  .select(`
    *,
    counters:post_counters(*)
  `)
  .eq('user_id', userId)
  .eq('status', 'published')
  .order('created_at', { ascending: false });
```

#### いいね履歴フィード
```typescript
const { data, error } = await supabase
  .from('likes')
  .select(`
    created_at,
    post:posts!inner(
      *,
      user:users!inner(username, display_name, avatar_url),
      player_profile:player_profiles(*),
      counters:post_counters(*)
    )
  `)
  .eq('user_id', currentUserId)
  .eq('post.status', 'published')
  .order('created_at', { ascending: false });
```

#### いいね追加・削除
```typescript
// 追加
const { error } = await supabase
  .from('likes')
  .insert({ post_id: postId, user_id: userId });

// 削除
const { error } = await supabase
  .from('likes')
  .delete()
  .match({ post_id: postId, user_id: userId });
```

#### スタンプ送信・変更
```typescript
// 新規送信
const { error } = await supabase
  .from('reactions')
  .insert({
    post_id: postId,
    user_id: userId,
    reaction_type: 'fire',
  });

// 変更（10分以内 or 30秒CD後）
const { error } = await supabase
  .from('reactions')
  .update({
    reaction_type: 'clap',
    previous_type: 'fire',
  })
  .match({ post_id: postId, user_id: userId });
```

#### 投稿作成
```typescript
// 1. 動画アップロード
const videoPath = `${userId}/${postId}.mp4`;
const { error: uploadError } = await supabase.storage
  .from('videos')
  .upload(videoPath, videoFile);

// 2. サムネイルアップロード
const thumbPath = `${userId}/${postId}_thumb.jpg`;
await supabase.storage
  .from('videos')
  .upload(thumbPath, thumbnailFile);

// 3. 公開URL取得
const { data: videoUrl } = supabase.storage
  .from('videos')
  .getPublicUrl(videoPath);

const { data: thumbUrl } = supabase.storage
  .from('videos')
  .getPublicUrl(thumbPath);

// 4. postsテーブルに挿入
const { error } = await supabase
  .from('posts')
  .insert({
    id: postId,
    user_id: userId,
    video_url: videoUrl.publicUrl,
    thumbnail_url: thumbUrl.publicUrl,
    video_duration: 30,
    video_size: 15000000,
    caption: 'バク転成功！',
    category_tag: 'success',
  });
```

#### 投稿編集
```typescript
const { error } = await supabase
  .from('posts')
  .update({
    caption: '新しいキャプション',
    category_tag: 'practice',
  })
  .eq('id', postId);
```

#### 投稿削除（制限チェック付き）
```typescript
// 1. 削除制限チェック
const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
const { data: post } = await supabase
  .from('posts')
  .select('created_at')
  .eq('id', postId)
  .single();

const isWithin10Min = new Date(post.created_at) > tenMinutesAgo;

if (!isWithin10Min) {
  // 10分経過後は1日3回制限チェック
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { count } = await supabase
    .from('deletion_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('deleted_at', today.toISOString());
  
  if (count >= 3) {
    throw new Error('本日の削除上限に達しました');
  }
}

// 2. 削除実行
const { error } = await supabase
  .from('posts')
  .delete()
  .eq('id', postId);

// 3. ログ記録
await supabase
  .from('deletion_logs')
  .insert({
    user_id: userId,
    post_id: postId,
  });
```

#### 通報送信
```typescript
const { error } = await supabase
  .from('reports')
  .insert({
    post_id: postId,
    reporter_user_id: userId,
    reason: 'spam',
    reason_detail: '宣伝目的の投稿です',
  });
```

---

## 9. フロントエンド構成

### 9-1. ディレクトリ構造

```
src/
├── screens/           # 画面コンポーネント
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   └── OnboardingScreen.tsx
│   ├── home/
│   │   ├── HomeScreen.tsx
│   │   └── FeedScreen.tsx
│   ├── post/
│   │   ├── CreatePostScreen.tsx
│   │   └── PostDetailScreen.tsx
│   └── profile/
│       ├── ProfileScreen.tsx
│       └── EditProfileScreen.tsx
├── components/        # 共通コンポーネント
│   ├── PostCard.tsx
│   ├── ReactionButtons.tsx
│   └── VideoPlayer.tsx
├── hooks/            # カスタムフック
│   ├── useAuth.ts
│   ├── usePosts.ts
│   ├── useLikes.ts
│   └── useReactions.ts
├── services/         # API層
│   ├── supabase.ts
│   ├── auth.ts
│   ├── posts.ts
│   └── storage.ts
├── stores/           # グローバル状態管理
│   ├── authStore.ts
│   └── postStore.ts
├── types/            # 型定義
│   ├── database.types.ts
│   └── models.ts
└── utils/            # ユーティリティ
    ├── validation.ts
    └── formatters.ts
```

### 9-2. Supabaseクライアント初期化

```typescript
// src/services/supabase.ts
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

### 9-3. カスタムフック例

```typescript
// src/hooks/usePosts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

export const useFeed = (page: number = 0) => {
  return useQuery({
    queryKey: ['feed', page],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users!inner(*),
          player_profile:player_profiles(*),
          counters:post_counters(*)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(page * 10, (page + 1) * 10 - 1);
      
      if (error) throw error;
      return data;
    },
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (postData: CreatePostInput) => {
      // 動画アップロード + DB挿入
      // ...
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
};
```

---

## 10. 環境変数・設定

### 10-1. .env.local

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OAuth（開発時）
EXPO_PUBLIC_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
EXPO_PUBLIC_APPLE_CLIENT_ID=com.yourapp.waller
```

### 10-2. app.json / app.config.js

```javascript
export default {
  expo: {
    name: "Waller",
    slug: "waller",
    version: "1.0.0",
    scheme: "waller",
    platforms: ["ios", "android"],
    plugins: [
      "expo-image-picker",
      "expo-av",
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static"
          }
        }
      ]
    ],
    ios: {
      bundleIdentifier: "com.yourcompany.waller",
      supportsTablet: true
    },
    android: {
      package: "com.yourcompany.waller",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      }
    }
  }
};
```

---

## 11. デプロイ・CI/CD

### 11-1. EAS Build設定

```json
// eas.json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 11-2. GitHub Actions CI

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run lint
      - run: npm test
```

### 11-3. デプロイフロー

```bash
# 開発ビルド
eas build --profile development --platform ios

# プレビュービルド（内部テスト）
eas build --profile preview --platform all

# 本番ビルド
eas build --profile production --platform all

# App Store / Google Play 申請
eas submit --platform all
```

---

## 📝 補足事項

### セキュリティチェックリスト
- ✅ RLSポリシーですべてのテーブルを保護
- ✅ 環境変数は.envファイルで管理、Gitにコミットしない
- ✅ Supabase Anon Keyのみクライアントで使用（Service Keyは使用禁止）
- ✅ ストレージポリシーでフォルダ分離

### パフォーマンス最適化
- ✅ post_countersで集計クエリを削減
- ✅ 適切なインデックス設定
- ✅ React Queryでキャッシュ管理
- ✅ 画像・動画の遅延ロード

### 今後の拡張ポイント
- Edge Functionsで通知システム実装
- Realtime Subscriptionsでリアルタイム更新
- Database Webhooksで外部連携
- Supabase Vaultで機密情報管理

---

**END OF DOCUMENT**