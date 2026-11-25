import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

import * as schema from './schema';

/**
 * The database type repositories work with. Both the app's Expo SQLite driver and the
 * better-sqlite3 driver used in tests are synchronous Drizzle SQLite databases, so the
 * same repository code runs in both.
 */
export type AppDatabase = BaseSQLiteDatabase<'sync', unknown, typeof schema>;

export const DATABASE_NAME = 'cubiq.db';

let current: AppDatabase | null = null;

/** The open database. Throws if called before `openDatabase()` finished. */
export function getDatabase(): AppDatabase {
  if (!current) throw new Error('Database used before it was opened.');
  return current;
}

/** Registers the open database. The app calls it at startup; tests call it with a test database. */
export function setDatabase(db: AppDatabase | null): void {
  current = db;
}

export { schema };
