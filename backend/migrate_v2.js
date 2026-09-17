const { Client } = require('pg');

const c = new Client({
  connectionString: 'postgresql://postgres.cxiicvirllfdvcjwwcbj:MJsm20p0A7Y7vwwZ@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function main() {
  await c.connect();
  console.log('Connected\n');

  // 1. Create class_schedules table
  await c.query(`
    CREATE TABLE IF NOT EXISTS public.class_schedules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      course_name TEXT NOT NULL,
      course_code TEXT,
      instructor TEXT,
      room TEXT,
      building TEXT,
      day TEXT NOT NULL CHECK (day IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
      start_time TEXT NOT NULL,  -- "09:00"
      end_time TEXT NOT NULL,
      reminder_minutes INTEGER DEFAULT 10,  -- minutes before class
      notification_enabled BOOLEAN DEFAULT true,
      color TEXT DEFAULT '#2D6A4F',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('class_schedules table created');

  // 2. Index
  await c.query(`
    CREATE INDEX IF NOT EXISTS idx_class_schedules_user ON public.class_schedules(user_id);
    CREATE INDEX IF NOT EXISTS idx_class_schedules_day ON public.class_schedules(day);
  `);
  console.log('Indexes created');

  // 3. RLS
  await c.query(`ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;`);
  console.log('RLS enabled');

  // Drop existing policies to avoid duplicates
  await c.query(`DROP POLICY IF EXISTS "Users can view own classes" ON public.class_schedules;`);
  await c.query(`DROP POLICY IF EXISTS "Users can insert own classes" ON public.class_schedules;`);
  await c.query(`DROP POLICY IF EXISTS "Users can update own classes" ON public.class_schedules;`);
  await c.query(`DROP POLICY IF EXISTS "Users can delete own classes" ON public.class_schedules;`);
  await c.query(`DROP POLICY IF EXISTS "class_schedules_service_all" ON public.class_schedules;`);

  await c.query(`
    CREATE POLICY "Users can view own classes" ON public.class_schedules FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own classes" ON public.class_schedules FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own classes" ON public.class_schedules FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own classes" ON public.class_schedules FOR DELETE USING (auth.uid() = user_id);
    CREATE POLICY "class_schedules_service_all" ON public.class_schedules FOR ALL USING (auth.role() = 'service_role');
  `);
  console.log('RLS policies created');

  // 4. Update system prompt to caring/partner AI
  const caringPrompt = `You are IM'U, the user's caring AI study partner and companion. You know their name, university, program, year, semester, major, minor, and their class schedule.

Your personality:
- Warm, caring, and genuinely interested in the user's wellbeing and success
- Friendly, encouraging, and supportive like a close friend or mentor
- Remember details about them and their coursework — reference them naturally
- Check in on them, notice when they might be stressed or overwhelmed
- Celebrate their wins with genuine enthusiasm

Your role:
- Help them study effectively with clear explanations, examples, and guidance
- Help them manage their time — if they have a class coming up, remind them
- Help them with their actual courses (from their schedule/profile)
- Explain concepts clearly, be concise but thorough
- Be encouraging when they're stuck — never harsh

Always:
- Use their name when natural
- Reference their program/courses when relevant
- Be warm but professional — not overly emotional
- Answer in a conversational, human tone — not robotic
- Keep responses focused and useful`;

  const update = await c.query(
    `UPDATE public.system_prompts SET prompt = $1, updated_at = NOW() WHERE name = 'default'`,
    [caringPrompt]
  );
  console.log('System prompt updated, rows:', update.rowCount);

  // Also insert if missing
  await c.query(`
    INSERT INTO public.system_prompts (name, prompt, is_active)
    SELECT 'default', $1, true
    WHERE NOT EXISTS (SELECT 1 FROM public.system_prompts WHERE name = 'default')
  `, [caringPrompt]);
  console.log('System prompt ensured');

  // Verify
  const verify = await c.query(`SELECT name, left(prompt, 60) as preview FROM public.system_prompts`);
  console.log('\nSystem prompts:', JSON.stringify(verify.rows, null, 2));

  const tables = await c.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('class_schedules')`);
  console.log('\nTables:', JSON.stringify(tables.rows));

  await c.end();
  console.log('\nDone.');
}

main().catch(e => { console.error(e); process.exit(1); });