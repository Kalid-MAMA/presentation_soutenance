import type { Config } from 'drizzle-kit';
import { join } from 'path';

export default {
  schema: './shared/schema.ts',
  out: './drizzle',
  driver: 'turso',
  dialect: 'sqlite',
  dbCredentials: {
    url: join(process.cwd(), 'data', 'kalid.db'),
  },
} satisfies Config;
