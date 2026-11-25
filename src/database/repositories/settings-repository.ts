import { eq } from 'drizzle-orm';
import type { z } from 'zod';

import type { AppDatabase } from '../client';
import { settings } from '../schema';

/**
 * Reads a JSON setting and validates it. A missing, corrupt or outdated value
 * returns `fallback` instead of crashing the app.
 */
export function getSetting<T>(db: AppDatabase, key: string, schema: z.ZodType<T>, fallback: T): T {
  const row = db.select().from(settings).where(eq(settings.key, key)).get();
  if (!row) return fallback;
  try {
    const parsed = schema.safeParse(JSON.parse(row.value));
    return parsed.success ? parsed.data : fallback;
  } catch {
    return fallback;
  }
}

export function setSetting(db: AppDatabase, key: string, value: unknown, now = Date.now()): void {
  const json = JSON.stringify(value);
  db.insert(settings)
    .values({ key, value: json, updatedAt: now })
    .onConflictDoUpdate({ target: settings.key, set: { value: json, updatedAt: now } })
    .run();
}

export function deleteSetting(db: AppDatabase, key: string): void {
  db.delete(settings).where(eq(settings.key, key)).run();
}
