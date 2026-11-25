import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'node:path';

import { schema, type AppDatabase } from './client';

/**
 * Test-only: a real SQLite database (better-sqlite3) with the app's migrations applied.
 * Pass a file path to test persistence across "restarts"; defaults to in-memory.
 */
export function createTestDatabase(filename = ':memory:'): { db: AppDatabase; close: () => void } {
  const sqlite = new Database(filename);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: path.join(__dirname, 'migrations') });
  return { db: db as unknown as AppDatabase, close: () => sqlite.close() };
}
