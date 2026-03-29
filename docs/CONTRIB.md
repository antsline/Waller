# Contributing Guide

## Prerequisites

- Node.js 18+
- npm 9+
- Expo CLI (`npx expo`)
- EAS CLI (`npx eas`) for builds
- iOS Simulator (Xcode) or Android Emulator
- Supabase project (for backend)

## Environment Setup

### 1. Clone and install

```bash
git clone https://github.com/antsline/Waller.git
cd Waller
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description | Format |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxxxx.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | JWT string |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth web client ID | `xxxxx.apps.googleusercontent.com` |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Google OAuth iOS client ID | `xxxxx.apps.googleusercontent.com` |

### 3. Set up Supabase database

Apply migrations to your Supabase project in order:

```
supabase/migrations/001_create_tables.sql
supabase/migrations/002_create_triggers.sql
supabase/migrations/003_create_rls_policies.sql
supabase/migrations/004_create_storage.sql
```

### 4. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials (Web client and iOS client)
3. Set the web client ID as `EXPO_PUBLIC_GOOGLE_CLIENT_ID`
4. Set the iOS client ID as `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
5. Update `app.json` `iosUrlScheme` with the reversed iOS client ID

### 5. Start development

```bash
npm start
```

For Google/Apple sign-in, you need a development build (Expo Go does not support native OAuth):

```bash
npm run build:dev
```

## Available Scripts

| Script | Description |
|---|---|
| `npm start` | Start Expo dev server |
| `npm run ios` | Start on iOS simulator |
| `npm run android` | Start on Android emulator |
| `npm run web` | Start web version |
| `npm run lint` | Lint TypeScript files with ESLint |
| `npm run typecheck` | Type check without emitting |
| `npm run build:dev` | EAS development build (iOS) |
| `npm run build:preview` | EAS preview build (internal distribution) |
| `npm run build:prod` | EAS production build |

## Project Structure

```
src/
  components/ui/   # Reusable UI components (Button, TextInput, Avatar, etc.)
  constants/       # Design system (colors, typography, spacing, config)
  hooks/           # Custom hooks (useAuth, useProfile, useDebounce, etc.)
  i18n/            # Internationalization (ja.json, en.json)
  lib/             # Supabase client (expo-secure-store for session)
  navigation/      # React Navigation (RootNavigator, MainTabs, Stacks)
  screens/         # Screen components organized by feature
  services/        # Supabase Storage helpers
  stores/          # Zustand stores (authStore)
  types/           # TypeScript types (database, models, navigation)
  utils/           # Zod validation schemas, utilities
```

## Development Workflow

### Branch strategy

- `main` - Production-ready code
- Feature branches: `feat/description`
- Bug fix branches: `fix/description`

### Commit messages

Follow conventional commits:

```
feat: add trick dictionary screen
fix: correct clap counter overflow
refactor: extract video picker hook
docs: update requirements v1.0
chore: upgrade expo SDK
```

### Code standards

- **TypeScript strict mode** - No `any` types
- **Immutable patterns** - Never mutate objects, always spread
- **i18n** - All UI text via `t()` function, zero hardcoded strings
- **Design system** - Use constants from `src/constants/`, no magic values
- **Small files** - 200-400 lines typical, 800 max
- **Small functions** - Under 50 lines
- **No console.log** - Remove before committing
- **No emoji in code/UI** - Use Lucide line icons instead
- **Path aliases** - Use `@/` prefix for imports from `src/`

### i18n guidelines

Every user-facing string must go through i18n:

```typescript
// Correct
import { useTranslation } from 'react-i18next'
const { t } = useTranslation()
<Text>{t('feed.empty')}</Text>

// Wrong
<Text>No clips yet</Text>
```

Translation files: `src/i18n/locales/{ja,en}.json`

### Design system

Colors, typography, spacing are defined in `src/constants/`:

```typescript
// Correct
import { colors } from '@/constants/colors'
style={{ backgroundColor: colors.backgroundSecondary }}

// Wrong
style={{ backgroundColor: '#F5F5F5' }}
```

Orange (`#FF8C00`) is used only for:
- Applause icon/count
- Post button (+)
- Active tab indicator
- "Landed" mood tag
- Notification badges

## Authentication Architecture

### Flow

1. User taps Google/Apple sign-in on `LoginScreen`
2. Native SDK obtains OAuth `idToken`
3. Token is passed to `supabase.auth.signInWithIdToken()`
4. Supabase Auth creates/validates session
5. Session stored in expo-secure-store (encrypted)
6. `onAuthStateChange` listener updates Zustand store
7. `RootNavigator` renders appropriate screen based on auth state

### Navigation routing

| State | Screen |
|---|---|
| Loading | Spinner (full screen) |
| Not authenticated | LoginScreen |
| Authenticated, no profile | ProfileSetupScreen |
| Authenticated + profile complete | MainTabs |

### Security notes

- Session tokens stored in `expo-secure-store` (encrypted on-device)
- Apple Sign-In uses SHA256 hashed nonce (required by Apple)
- Storage upload paths validated with UUID schema (prevents path traversal)
- User cannot set `status` or `username_change_count` via client (excluded from insert payload)
- All user inputs validated with Zod before database operations

## Database Schema

11 tables defined in `supabase/migrations/001_create_tables.sql`:

| Table | Purpose |
|---|---|
| users | Player accounts |
| tricks | Trick dictionary |
| clips | 15-second video posts |
| best_plays | Profile highlight videos (max 3 per user) |
| best_play_tricks | Best play - trick junction |
| clip_tricks | Clip - trick junction |
| user_tricks | Player trick mastery status |
| claps | Applause reactions (1-10 per user per clip) |
| clip_counters | Denormalized counters (trigger-managed) |
| reports | Content reports |
| deletion_logs | Deletion audit trail |

Triggers in `002_create_triggers.sql` handle:
- Counter auto-updates
- User trick status auto-update from clip mood
- Auto-hide on 3 reports

All trigger functions use `SECURITY DEFINER SET search_path = public` for RLS compatibility.

## Testing

Test coverage target: 80%+

Test types (all required):
- Unit tests: validation schemas, utilities, hooks
- Integration tests: Supabase queries, auth flow
- E2E tests: critical user flows

(Testing infrastructure to be set up in a future sprint)
