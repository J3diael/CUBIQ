import { drizzle } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { openDatabaseSync } from 'expo-sqlite';

import { DATABASE_NAME, schema, setDatabase, type AppDatabase } from './client';
import migrations from './migrations/migrations';

/**
 * Opens the on-device database, applies pending migrations and registers it.
 * Each migration runs in a transaction, and Drizzle records applied ones in its
 * own `__drizzle_migrations` table, so this is safe to call on every launch.
 */
export async function openDatabase(): Promise<AppDatabase> {
  const expoDb = openDatabaseSync(DATABASE_NAME);
  expoDb.execSync('PRAGMA journal_mode = WAL;');
  expoDb.execSync('PRAGMA foreign_keys = ON;');
  const db = drizzle(expoDb, { schema });
  await migrate(db, migrations);
  setDatabase(db as unknown as AppDatabase);
  return db as unknown as AppDatabase;
}
