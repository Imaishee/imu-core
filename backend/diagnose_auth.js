const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.cxiicvirllfdvcjwwcbj:MJsm20p0A7Y7vwwZ@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function diagnose() {
  await client.connect();
  console.log('Connected to DB\n');

  // Check if trigger exists
  const triggerRes = await client.query(`
    SELECT trigger_name, event_manipulation, action_statement
    FROM information_schema.triggers
    WHERE event_object_table = 'users' AND event_object_schema = 'auth'
  `);
  console.log('Auth triggers:', JSON.stringify(triggerRes.rows, null, 2));

  // Check if handle_new_user function exists
  const funcRes = await client.query(`
    SELECT routine_name, routine_type
    FROM information_schema.routines
    WHERE routine_name = 'handle_new_user' AND routine_schema = 'public'
  `);
  console.log('handle_new_user function:', JSON.stringify(funcRes.rows, null, 2));

  // Check profiles table columns
  const colsRes = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'profiles' AND table_schema = 'public'
    ORDER BY ordinal_position
  `);
  console.log('Profiles columns:', JSON.stringify(colsRes.rows, null, 2));

  // Check user_stats table
  const statsRes = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_name = 'user_stats' AND table_schema = 'public'
    ) as exists
  `);
  console.log('user_stats table exists:', statsRes.rows[0].exists);

  // Check if profiles has INSERT policy
  const policiesRes = await client.query(`
    SELECT policyname, cmd, qual, with_check
    FROM pg_policies
    WHERE tablename = 'profiles' AND schemaname = 'public'
  `);
  console.log('Profiles policies:', JSON.stringify(policiesRes.rows, null, 2));

  // Check RLS enabled
  const rlsRes = await client.query(`
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE tablename = 'profiles' AND schemaname = 'public'
  `);
  console.log('Profiles RLS enabled:', rlsRes.rows[0]?.rowsecurity);

  // Try to see recent auth signup errors
  const usersRes = await client.query(`
    SELECT id, email, created_at, raw_user_meta_data
    FROM auth.users
    ORDER BY created_at DESC
    LIMIT 5
  `);
  console.log('\nRecent auth users:', JSON.stringify(usersRes.rows, null, 2));

  // Check if any profiles exist
  const profilesRes = await client.query(`
    SELECT id, email, full_name, created_at
    FROM public.profiles
    ORDER BY created_at DESC
    LIMIT 5
  `);
  console.log('\nRecent profiles:', JSON.stringify(profilesRes.rows, null, 2));

  await client.end();
}

diagnose().catch(e => { console.error(e); process.exit(1); });
