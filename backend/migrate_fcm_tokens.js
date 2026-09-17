const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS public.fcm_tokens (
      id        uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      token     text NOT NULL,
      platform  text DEFAULT 'android',
      created_at timestamptz DEFAULT now(),
      UNIQUE(user_id, token)
    );

    ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

    DO $$ BEGIN
      CREATE POLICY "Users manage own FCM tokens"
        ON public.fcm_tokens FOR ALL
        USING (auth.uid() = user_id);
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  console.log('✓ fcm_tokens table created');
  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });
