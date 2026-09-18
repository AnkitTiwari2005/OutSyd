import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PgDatabase } from 'drizzle-orm/pg-core';
import * as schema from './schema';

let pool: Pool | null = null;
let _db: NodePgDatabase<typeof schema> | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

    pool = new Pool({
      connectionString,
      ssl: isProduction && !isLocalhost ? { rejectUnauthorized: true } : undefined,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

export function getDb(): NodePgDatabase<typeof schema> {
  if (!_db) {
    _db = drizzle(getPool(), { schema });
  }
  return _db;
}

// Lazy Proxy: Allows `import { db } from '@/lib/db'` to be imported anywhere at module scope
// without throwing during build time or module load when DATABASE_URL is not yet needed.
export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    const instance = getDb();
    return Reflect.get(instance, prop, receiver);
  },
  getPrototypeOf() {
    return PgDatabase.prototype;
  },
});

export type DB = typeof db;
