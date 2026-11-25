import { integer, text } from 'drizzle-orm/sqlite-core';

/**
 * Columns every user-data table shares. UUID ids, epoch-millisecond timestamps and
 * soft deletes make later cloud sync a matter of "send rows changed since X".
 */
export const id = () => text('id').primaryKey();
export const createdAt = () => integer('created_at').notNull();
export const updatedAt = () => integer('updated_at').notNull();
export const deletedAt = () => integer('deleted_at');
