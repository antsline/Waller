# WALLER

Wall trampoline community platform.

## Vision

Share challenges and growth in wall trampoline with the world.
Accelerate the sport's popularity and lay the foundation for Olympic recognition.

## Status

**Phase 1 MVP in development** (Sprint 1-4 complete).

## Tech Stack

| Category | Technology | Version |
|---|---|---|
| Framework | React Native (Expo) | SDK 55 |
| Runtime | React | 19.2 |
| Language | TypeScript | 5.9 (strict) |
| Backend | Supabase | PostgreSQL + Auth + Storage |
| State | Zustand + TanStack React Query | |
| Navigation | React Navigation 6 | native-stack + bottom-tabs |
| i18n | react-i18next + expo-localization | Japanese + English |
| Validation | Zod | |
| Icons | Lucide React Native | Line style |
| Web (Phase 3) | Next.js | SSR/SSG |

## Scripts

| Script | Description |
|---|---|
| `npm start` | Start Expo development server |
| `npm run ios` | Start on iOS simulator |
| `npm run android` | Start on Android emulator |
| `npm run lint` | Run ESLint on TypeScript files |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run build:dev` | EAS build for development (iOS) |
| `npm run build:preview` | EAS build for internal testing (iOS) |
| `npm run build:prod` | EAS build for production (iOS) |
| `npm test` | Run all tests with Jest |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

## Project Structure

```
src/
  constants/     Design system (colors, typography, spacing, config)
  i18n/          Internationalization (ja.json, en.json)
  lib/           Supabase client
  types/         TypeScript types (database, models, navigation)
  stores/        Zustand stores (auth, clipUpload)
  hooks/         Custom hooks (17 hooks)
  services/      External service integrations (storage, video)
  components/
    ui/          Base UI components (Button, TextInput, Tag, Avatar, etc.)
    dictionary/  Dictionary feature components (TrickCard, PlayerList, etc.)
  navigation/    React Navigation (RootNavigator, MainTabs, 4 Stacks)
  screens/
    auth/        LoginScreen, ProfileSetupScreen
    home/        FeedScreen, ClipDetailScreen
    clip/        CreateClipScreen
    dictionary/  TrickListScreen, TrickDetailScreen, NewTrickModal
    mypage/      MyPageScreen
  utils/         Zod validation schemas
supabase/
  migrations/    Database schema (4 migration files)
docs/
  requirements_v1.0.md   Requirements specification
  dev_plan_v1.0.md       Development plan (7 sprints)
  market_research.md     Market research and competitive analysis
```

## Docs

- [Requirements v1.0](./docs/requirements_v1.0.md) - Full product specification
- [Development Plan v1.0](./docs/dev_plan_v1.0.md) - Sprint-by-sprint implementation plan
- [Market Research](./docs/market_research.md) - Competitive landscape analysis
- [Contributing](./docs/CONTRIB.md) - Development workflow and setup
- [Runbook](./docs/RUNBOOK.md) - Deployment and operations guide

## Archive

Previous v0 code is preserved in `_archive/v0/` (git-ignored) for reference.
