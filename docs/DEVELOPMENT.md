# CUBIQ development log

The living checklist for CUBIQ: what is done, what is next, known issues, decisions and dependencies. Update it with every pull request.

## Phase status

| Phase                    | Deliverable                                              | Status         |
| ------------------------ | -------------------------------------------------------- | -------------- |
| 1. Foundation            | Working app shell: navigation, themes, design system     | Done (this PR) |
| 2. Timer engine          | Functional 3x3 timer with scrambles, inspection, haptics | Next           |
| 3. Database and sessions | Persistent solves, sessions, penalties, manual entry     | Pending        |
| 4. Statistics            | Ao3/Ao5/Ao12, PBs, charts, session analytics             | Pending        |
| 5. Training center       | CFOP algorithm database, flashcards, mastery             | Pending        |
| 6. Beginner learning     | Lessons, notation guide, progress                        | Pending        |
| 7. Polish and expansion  | Customisation, more puzzles, accessibility, performance  | Pending        |

## Phase 1 checklist

- [x] Expo SDK 58 project with TypeScript and Expo Router, routes in `src/app`
- [x] Strict TypeScript (`strict`, `noUncheckedIndexedAccess`), `@/` path alias, ESLint, Prettier
- [x] Folder structure with a README in each top-level folder
- [x] Theme tokens, dark and light themes, `ThemeProvider`, `useTheme()`, dark by default, system option
- [x] Inter and JetBrains Mono fonts, splash screen held until fonts load
- [x] Core components: Screen, Text, Button, IconButton, Card, ListRow, Chip, StatTile, EmptyState, Sheet, Divider, SegmentedControl, SectionHeader
- [x] Dev-only component gallery (Profile → Settings → Component gallery)
- [x] Five-tab navigation (Home, Sessions, Timer, Train, Profile) with a custom themed tab bar, Timer in the centre
- [x] Each tab's main screen laid out with honest empty states and "Phase N" labels instead of fake data
- [x] Theme switch in Profile → Settings (in memory; persisted in Phase 3)
- [x] Jest with `jest-expo` and React Native Testing Library: 30 tests at the time (formatting, themes, components, navigation)
- [x] Checked at 360 dp width in both themes (web preview) and Android bundle builds
- [ ] Check on a physical Android phone in Expo Go (needs you)

## Phase 2 checklist

- [x] Spike: cubing.js `randomScrambleForEvent` runs offline inside a hidden WebView. Verified in Chromium for 333, 222, 444, 555, 666, 777, Pyraminx, Skewb, Square-1, Megaminx and Clock (3x3: 15 to 150 ms; first 4x4: about 2.4 s)
- [x] Build script that inlines cubing.js's search worker into one HTML page (`npm run build:scramble-engine`)
- [x] Engine client (request/response over the WebView bridge, timeouts, restart after the WebView is killed)
- [x] Scramble queue: 3 ready per puzzle, one generation at a time, each scramble used once
- [x] Timer state machine in `src/lib/timer` (idle, inspecting, holding, ready, running, stopped), fully unit tested
- [x] Monotonic timing with `performance.now()`; display refresh never affects the measured time
- [x] Hold-to-start with configurable hold (instant, 0.3 s, 0.55 s, 1 s), stop on touch down
- [x] WCA inspection (8/15/30 s), +2 up to 2 s over, DNF after; haptic warnings at 8 s and 12 s
- [x] Haptics on ready, stop and inspection warnings (can be turned off)
- [x] Keep screen awake while the Timer tab is open (setting)
- [x] Background handling: an unfinished hold is cancelled; a running solve keeps going and is corrected with the wall clock if the monotonic clock paused; the solve is flagged as interrupted
- [x] Android back button is ignored during a solve and cancels inspection
- [x] Tab bar and scramble hide during inspection and solves
- [x] Last solve: OK / +2 / DNF / delete
- [x] Timer settings screen: inspection, duration, hold time, haptics, hide time while solving, keep awake, precision
- [x] Scramble also works in the browser preview (hidden iframe)
- [ ] Check on a physical Android phone in Expo Go (needs you): scrambles appear, hold/start/stop feel responsive, haptics fire

## Next up: Phase 3

1. Expo SQLite + Drizzle: schema, generated migrations, `PRAGMA foreign_keys`, WAL.
2. Solve and session repositories; replace the in-memory solves store and settings store.
3. Persist the scramble queue and the interrupted-solve record.
4. Session management screens and manual time entry.

## Known bugs and limitations

- Settings and solves reset on app restart until SQLite storage lands in Phase 3.
- The scramble engine adds about 1.2 MB to the JavaScript bundle (cubing.js plus its WebAssembly solver for non-3x3 puzzles).
- If the app is killed during a solve, that solve is lost. Recovery comes with SQLite in Phase 3.
- App icon and splash image are still the Expo template images; a CUBIQ icon is needed before release.
- On web, the Hermes-specific timing caveats don't apply; the timer must be verified on a real Android device.
- The WebView engine is verified in desktop Chromium. Android System WebView is Chromium-based, but it still needs a device check.

## Architectural decisions

| Date       | Decision                                                                         | Why                                                                                             |
| ---------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 2026-11-25 | StyleSheet design system with typed tokens instead of NativeWind                 | Fewer build-time moving parts; no styling overhead on the timer screen                          |
| 2026-11-25 | Custom JS tab bar (`expo-router/js-tabs`) instead of native tabs                 | Lucide icons, full theming, and the timer can hide the tab bar during a solve                   |
| 2026-11-25 | Timer tab in the centre slot                                                     | Always one tap away from any tab                                                                |
| 2026-11-25 | cubing.js scrambles will run in a hidden offline WebView                         | cubing.js scramble code needs module Web Workers and WebAssembly, which Hermes lacks            |
| 2026-11-25 | Expo SQLite + Drizzle ORM (Phase 3)                                              | Typed schema, generated migrations, live queries; PostgreSQL dialect eases future Supabase sync |
| 2026-11-25 | Victory Native + Skia for charts (Phase 4)                                       | Works in Expo Go, smooth gestures, themeable                                                    |
| 2026-11-25 | UUID ids, epoch-ms timestamps, soft deletes on user tables                       | Makes later cloud sync incremental instead of a rewrite                                         |
| 2026-11-25 | Built-in algorithms/lessons as typed content files; SQLite stores only user data | Content can grow without migrations                                                             |
| 2026-11-25 | Derived values (final time, averages, goal progress) are computed, not stored    | Penalty edits can never leave stale numbers                                                     |

The full architecture plan, schema and design system live in the CUBIQ architecture doc shared in the project.

## Dependencies

| Package                                                                           | Why                                                               |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| expo, expo-router, react-native-screens, react-native-safe-area-context           | App runtime and file-based navigation                             |
| expo-splash-screen, expo-status-bar, expo-system-ui, expo-constants, expo-linking | Splash, status bar and root background colour, router peers       |
| expo-font, @expo-google-fonts/inter, @expo-google-fonts/jetbrains-mono            | Interface font and monospaced timer digits that don't jitter      |
| react-native-reanimated, react-native-worklets                                    | UI-thread animations (timer feedback, transitions)                |
| react-native-gesture-handler                                                      | Reliable hold-to-start gestures (Phase 2)                         |
| react-native-svg, lucide-react-native                                             | Icons now; cube diagrams later                                    |
| zustand                                                                           | Small global state (settings now; timer and active session later) |
| zod                                                                               | Validation of settings, manual entry and content files            |
| react-native-web, react-dom                                                       | Browser preview for quick layout checks                           |
| jest, jest-expo, @testing-library/react-native, @types/jest                       | Tests                                                             |
| eslint, eslint-config-expo, prettier                                              | Linting and formatting                                            |
