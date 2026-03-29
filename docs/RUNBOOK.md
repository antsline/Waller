# Runbook

## Deployment

### Development Build

For testing on physical devices with native OAuth:

```bash
npm run build:dev
```

This creates a development client build via EAS. Install the resulting build on your device or simulator.

### Preview Build (TestFlight / Internal)

```bash
npm run build:preview
```

Distributes via EAS internal distribution. Suitable for team testing.

### Production Build

```bash
npm run build:prod
```

Creates a production-ready build. Submit to App Store / Play Store:

```bash
npx eas submit --platform ios --latest
npx eas submit --platform android --latest
```

### Pre-deployment Checklist

- [ ] `npm run typecheck` passes with no errors
- [ ] `npm run lint` passes with no errors
- [ ] All environment variables set in EAS secrets
- [ ] Database migrations applied to production Supabase
- [ ] Storage buckets created with correct policies
- [ ] No `console.log` in production code
- [ ] i18n: all screens tested in both Japanese and English
- [ ] Google OAuth: `iosUrlScheme` in `app.json` set to actual reversed client ID
- [ ] Google OAuth: `EXPO_PUBLIC_GOOGLE_CLIENT_ID` and `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` configured
- [ ] Supabase Auth: Google and Apple providers enabled in Supabase Dashboard

## Database Operations

### Apply Migrations

Apply in order to a new or existing Supabase project:

```
001_create_tables.sql      -- Tables and indexes
002_create_triggers.sql    -- Trigger functions (SECURITY DEFINER)
003_create_rls_policies.sql -- Row Level Security
004_create_storage.sql     -- Storage buckets and policies
```

Run via the Supabase Dashboard SQL editor, or using the Supabase CLI:

```bash
supabase db push
```

### Verify RLS

After applying migrations, verify RLS is enabled:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

All tables should show `rowsecurity = true`.

### Verify Triggers

```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```

### Verify Storage Buckets

```sql
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets;
```

Expected buckets: `clips`, `avatars`, `best-plays`.

### Enable OAuth Providers

In Supabase Dashboard > Authentication > Providers:

1. **Google**: Enable, paste Web Client ID and Client Secret
2. **Apple**: Enable, paste Service ID, Team ID, Key ID, and Private Key

## Monitoring

### Key Metrics to Watch

| Metric | Source | Alert Threshold |
|---|---|---|
| Storage usage | Supabase Dashboard | > 80% of plan limit |
| Egress bandwidth | Supabase Dashboard | > 150GB/month (before R2 migration) |
| Auth errors | Supabase Auth logs | > 10 failures/hour |
| API latency | Supabase API logs | > 2 seconds p95 |
| Database size | Supabase Dashboard | > 6GB (Pro plan = 8GB) |

### Cost Monitoring

Track monthly costs in Supabase Dashboard:

| Resource | Pro Plan Included | Overage |
|---|---|---|
| Storage | 100GB | $0.021/GB |
| Egress | 200GB/month | $0.09/GB |
| Database | 8GB | $0.125/GB |
| Auth MAU | 100,000 | - |

**Action at 200 users:** Evaluate Cloudflare R2 migration for egress cost reduction.

## Common Issues

### OAuth fails in Expo Go

**Cause:** Google/Apple native sign-in requires native modules unavailable in Expo Go.

**Fix:** Use a development build:
```bash
npm run build:dev
```

### Google Sign-In fails on iOS

**Cause:** `iosUrlScheme` in `app.json` is a placeholder or incorrect.

**Fix:**
1. Get the iOS client ID from Google Cloud Console
2. Reverse it (e.g., `com.googleusercontent.apps.123456` becomes the URL scheme)
3. Update `app.json` plugins section with the correct reversed client ID
4. Rebuild: `npm run build:dev`

### Apple Sign-In fails

**Cause:** Apple Sign-In not configured in Supabase or app capabilities.

**Fix:**
1. Verify Apple provider is enabled in Supabase Dashboard
2. Verify `expo-apple-authentication` is in `app.json` plugins
3. Verify the app has the "Sign in with Apple" capability in Apple Developer Console

### Supabase connection fails

**Cause:** Missing or incorrect environment variables.

**Check:**
1. `.env` file exists with correct values
2. Variables are prefixed with `EXPO_PUBLIC_`
3. Supabase project is active (not paused)

### Session not persisting

**Cause:** expo-secure-store issue on specific device/OS.

**Debug:**
1. Check device logs for SecureStore errors
2. Verify `expo-secure-store` plugin is in `app.json`
3. Test on a different device to isolate

### Clip upload fails

**Possible causes:**
1. File exceeds 50MB (clips) or 100MB (best plays)
2. MIME type not allowed (only video/mp4, video/quicktime, image/jpeg, image/png)
3. Storage bucket RLS policy blocks the upload
4. Network timeout on slow connections

**Debug:**
1. Check file size and type on client
2. Verify storage policies in Supabase Dashboard
3. Check Supabase logs for specific error

### Counter out of sync

If `clip_counters` values don't match actual `claps` rows:

```sql
-- Recalculate counters for a specific clip
UPDATE clip_counters
SET
  clap_count = (SELECT COUNT(*) FROM claps WHERE clip_id = '<clip_id>'),
  clap_total = (SELECT COALESCE(SUM(count), 0) FROM claps WHERE clip_id = '<clip_id>')
WHERE clip_id = '<clip_id>';
```

For bulk recalculation:

```sql
UPDATE clip_counters cc
SET
  clap_count = sub.cnt,
  clap_total = sub.total
FROM (
  SELECT clip_id, COUNT(*) as cnt, COALESCE(SUM(count), 0) as total
  FROM claps
  GROUP BY clip_id
) sub
WHERE cc.clip_id = sub.clip_id;
```

### User trick status incorrect

If `user_tricks.status` doesn't reflect actual clips:

```sql
-- Check a user's trick status vs their clips
SELECT
  ut.trick_id,
  ut.status,
  array_agg(c.mood) as clip_moods
FROM user_tricks ut
JOIN clip_tricks ct ON ct.trick_id = ut.trick_id
JOIN clips c ON c.id = ct.clip_id AND c.user_id = ut.user_id
WHERE ut.user_id = '<user_id>'
GROUP BY ut.trick_id, ut.status;
```

## Rollback

### App Rollback

EAS builds are versioned. To roll back:

1. Go to EAS Dashboard
2. Find the previous working build
3. Submit that build to App Store / Play Store

For TestFlight, you can simply distribute the previous build.

### Database Rollback

Supabase does not support automatic migration rollback. For critical issues:

1. **Point-in-time recovery** (Pro plan): Restore from Supabase Dashboard
2. **Manual rollback**: Write and apply reverse migration SQL

Always test migrations on a staging Supabase project first.

## Infrastructure Roadmap

| Milestone | Action | Trigger |
|---|---|---|
| 200 users | Migrate video storage to Cloudflare R2 | Egress costs > $10/month |
| 500 users | Add CDN for static assets | Latency complaints from non-JP users |
| 1,000 users | Set up error tracking (Sentry) | Production stability requirements |
| 3,000 users | Evaluate Supabase plan upgrade | Storage/bandwidth limits |
