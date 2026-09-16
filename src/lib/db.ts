import { Pool } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connStr = process.env.SUPABASE_DB_URL;
    pool = new Pool({
      connectionString: connStr,
      ssl: connStr?.includes('pooler.supabase.com') ? false : { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 15000,
    });
  }
  return pool;
}

export async function query(text: string, params?: any[]) {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

export const OWNER_USER_ID = process.env.OWNER_USER_ID || '4e2d4aec-56be-4d97-8536-355f9f782b50';
