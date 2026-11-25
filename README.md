# CUBIQ

An offline-first speedcubing timer and training companion for Android (iOS second), built with Expo and React Native.

CUBIQ combines a competition-grade timer, random-state scrambles, solve and session management, WCA-style statistics, a CFOP algorithm trainer and a beginner course. Everything works without an account or an internet connection.

> Status: **Phase 1 (foundation)**. Navigation, themes and the design system are in place. The timer engine arrives in Phase 2. See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for the full checklist.

## Tech stack

Expo SDK 58 · React Native 0.88 · TypeScript (strict) · Expo Router · Reanimated · Gesture Handler · React Native SVG · Lucide icons · Zustand · Zod · Jest with React Native Testing Library.

Planned for later phases: Expo SQLite with Drizzle ORM, cubing.js (scrambles run in an offline WebView), Victory Native charts.

## Getting started

You need Node.js 22 or newer and the **Expo Go** app on your Android phone (or an Android emulator from Android Studio).

```bash
npm install
npm start          # starts the dev server and shows a QR code
```

- **Phone:** open Expo Go and scan the QR code. Phone and computer must be on the same Wi-Fi.
- **Emulator:** start an emulator in Android Studio, then press `a` in the terminal.
- **Browser preview:** press `w`. Handy for quick layout checks; the phone is the real target.

## Scripts

| Command             | What it does                   |
| ------------------- | ------------------------------ |
| `npm start`         | Start the Expo dev server      |
| `npm test`          | Run the Jest test suite        |
| `npm run typecheck` | Type-check with TypeScript     |
| `npm run lint`      | Lint with ESLint (Expo config) |
| `npm run format`    | Format with Prettier           |

Install new native-compatible packages with `npx expo install <package>` so versions match the SDK.

## Project structure

```
src/
  app/          Expo Router routes only (thin files that render feature screens)
  components/   ui/ design system, navigation/ tab bar
  features/     one folder per module: dashboard, timer, sessions, training, profile, settings
  theme/        tokens, light/dark themes, ThemeProvider and useTheme()
  store/        Zustand stores
  lib/          pure TypeScript logic (time formatting now; statistics and timer later)
  hooks/        shared hooks
  database/     SQLite + Drizzle (Phase 3)
  content/      built-in algorithms and lessons (Phase 5–6)
  services/     external integrations behind interfaces
```

Layers only call downward: routes → features → stores / repositories / services → lib. Screens never contain SQL, statistics or timer logic.

## Design

Minimalist premium, dark by default. All colours, spacing, radii and type sizes live in [`src/theme/tokens.ts`](src/theme/tokens.ts). In development builds, **Profile → Settings → Component gallery** shows every UI component in the current theme.
