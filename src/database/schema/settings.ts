import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/** Key/value preferences. Each value is JSON, validated by a Zod schema for its key. */
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
