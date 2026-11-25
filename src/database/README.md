# database

SQLite access (Phase 3). `client.ts` opens the database and runs migrations, `schema/` holds Drizzle table definitions, `migrations/` holds generated SQL (committed), and `repositories/` exposes typed read/write functions. UI code never imports from here directly; features call repositories.
