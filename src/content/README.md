# content

Built-in content as typed, versioned data files with stable keys such as `pll.ua`. User data that refers to them (learning status, favourites, flashcard history) lives in SQLite, keyed by the same id, so keep ids stable when editing.

- `algorithms/`: CFOP sets (F2L, OLL, PLL). Tests in `algorithms/__tests__` run every algorithm through the cube model in `src/lib/cube`, so a typo in an algorithm fails the build. The F2L algorithms in `f2l.ts` come from a computer search, `node scripts/generate-f2l.mjs`.
- Beginner lessons arrive in Phase 6.
