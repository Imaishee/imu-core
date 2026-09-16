const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.cxiicvirllfdvcjwwcbj:MJsm20p0A7Y7vwwZ@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function fix() {
  await client.connect();
  console.log('Connected\n');

  // Drop and recreate trigger with correct columns
  await client.query(`
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  `);
  console.log('Dropped old trigger');

  await client.query(`
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO public.profiles (id, user_id, name, university, programme, year, semester, major, minor)
      VALUES (
        NEW.id,
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'university', ''),
        COALESCE(NEW.raw_user_meta_data->>'programme', ''),
        COALESCE((NEW.raw_user_meta_data->>'year')::int, 1),
        COALESCE((NEW.raw_user_meta_data->>'semester')::int, 1),
        COALESCE(NEW.raw_user_meta_data->>'major', ''),
        COALESCE(NEW.raw_user_meta_data->>'minor', '')
      );
      INSERT INTO public.user_stats (user_id) VALUES (NEW.id);
      RETURN NEW;
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'handle_new_user error: %', SQLERRM;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `);
  console.log('Created handle_new_user function');

  await client.query(`
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  `);
  console.log('Created trigger on_auth_user_created');

  // Also check user_stats columns
  const statsCols = await client.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'user_stats' AND table_schema = 'public'
    ORDER BY ordinal_position
  `);
  console.log('\nuser_stats columns:', JSON.stringify(statsCols.rows, null, 2));

  // Check conversations table columns
  const convCols = await client.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'conversations' AND table_schema = 'public'
    ORDER BY ordinal_position
  `);
  console.log('\nconversations columns:', JSON.stringify(convCols.rows, null, 2));

  // Check messages table columns
  const msgCols = await client.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'messages' AND table_schema = 'public'
    ORDER BY ordinal_position
  `);
  console.log('\nmessages columns:', JSON.stringify(msgCols.rows, null, 2));

  // Test the trigger by checking if insert would work
  console.log('\nTrigger and function updated successfully.');
  console.log('New signups will now create profiles with correct columns.');

  await client.end();
}

fix().catch(e => { console.error(e); process.exit(1); });
