import type { Config } from 'drizzle-kit';

/** `npm run db:generate` turns schema changes into a new SQL migration. */
export default {
  dialect: 'sqlite',
  driver: 'expo',
  schema: './src/database/schema/index.ts',
  out: './src/database/migrations',
} satisfies Config;
