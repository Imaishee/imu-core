const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = 'postgresql://postgres.cxiicvirllfdvcjwwcbj:MJsm20p0A7Y7vwwZ@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    console.log('Connected to database');

    // Check existing tables
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    console.log('Existing tables:', tables.rows.map(r => r.column_name || r.table_name).join(', '));

    // Add missing columns to profiles
    const profileAlters = [
      `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}'::jsonb`,
      `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location JSONB DEFAULT '{}'::jsonb`,
      `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{"theme":"dark","language":"en","notifications_enabled":true}'::jsonb`,
      `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`,
      `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false`,
      `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW()`,
    ];
    for (const sql of profileAlters) {
      await client.query(sql).catch(e => console.log('profiles alter:', e.message));
    }

    // Fix conversations model default
    await client.query(`ALTER TABLE public.conversations ALTER COLUMN model SET DEFAULT 'llama-3.3-70b-versatile'`).catch(() => {});

    // Add missing columns to notifications
    const notifAlters = [
      `ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS target TEXT DEFAULT 'all'`,
      `ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS target_user_id UUID REFERENCES public.profiles(id)`,
      `ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS sent_by UUID REFERENCES public.profiles(id)`,
      `ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'`,
      `ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ`,
    ];
    for (const sql of notifAlters) {
      await client.query(sql).catch(e => console.log('notif alter:', e.message));
    }

    // Now run the full idempotent schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);
    console.log('\nFull schema migration complete!');
    
  } catch (err) {
    console.error('Migration error:', err.message);
    if (err.position) {
      const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
      console.error(`Around position ${err.position}:`, schema.substring(Math.max(0, err.position - 50), err.position + 50));
    }
  } finally {
    await client.end();
  }
}

main().catch(console.error);
