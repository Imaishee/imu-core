const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cxiicvirllfdvcjwwcbj:MJsm20p0A7Y7vwwZ@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();

    await client.query('DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles');
    await client.query('DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles');
    await client.query('DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles');
    await client.query('DROP POLICY IF EXISTS "Admins can manage prompts" ON public.system_prompts');
    await client.query('DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications');
    await client.query('DROP POLICY IF EXISTS "Admins can view activity" ON public.activity_log');
    await client.query('DROP POLICY IF EXISTS "Admins can manage versions" ON public.app_versions');
    await client.query('DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations');
    await client.query('DROP POLICY IF EXISTS "Users can create own conversations" ON public.conversations');
    await client.query('DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations');
    await client.query('DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations');
    await client.query('DROP POLICY IF EXISTS "Users can view own messages" ON public.messages');
    await client.query('DROP POLICY IF EXISTS "Users can insert own messages" ON public.messages');
    await client.query('DROP POLICY IF EXISTS "Users can manage own knowledge" ON public.knowledge_nodes');
    await client.query('DROP POLICY IF EXISTS "Users can manage own edges" ON public.knowledge_edges');
    await client.query('DROP POLICY IF EXISTS "Users can view own stats" ON public.user_stats');
    await client.query('DROP POLICY IF EXISTS "Users can update own stats" ON public.user_stats');

    const policies = [
      // Profiles
      'CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id)',
      'CREATE POLICY "profiles_select_service" ON public.profiles FOR SELECT USING (auth.role() = \'service_role\')',
      'CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id)',
      'CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id)',
      'CREATE POLICY "profiles_all_service" ON public.profiles FOR ALL USING (auth.role() = \'service_role\')',
      // Prompts
      'CREATE POLICY "prompts_select_any" ON public.system_prompts FOR SELECT USING (true)',
      'CREATE POLICY "prompts_all_service" ON public.system_prompts FOR ALL USING (auth.role() = \'service_role\')',
      // Notifications
      'CREATE POLICY "notif_select_any" ON public.notifications FOR SELECT USING (true)',
      'CREATE POLICY "notif_all_service" ON public.notifications FOR ALL USING (auth.role() = \'service_role\')',
      // Activity
      'CREATE POLICY "activity_all_service" ON public.activity_log FOR ALL USING (auth.role() = \'service_role\')',
      // Versions
      'CREATE POLICY "versions_select_any" ON public.app_versions FOR SELECT USING (true)',
      'CREATE POLICY "versions_all_service" ON public.app_versions FOR ALL USING (auth.role() = \'service_role\')',
      // Conversations
      'CREATE POLICY "convo_all_own" ON public.conversations FOR ALL USING (auth.uid() = user_id)',
      'CREATE POLICY "convo_all_service" ON public.conversations FOR ALL USING (auth.role() = \'service_role\')',
      // Messages
      'CREATE POLICY "msgs_all_own" ON public.messages FOR ALL USING (EXISTS (SELECT 1 FROM public.conversations WHERE id = conversation_id AND user_id = auth.uid()))',
      'CREATE POLICY "msgs_all_service" ON public.messages FOR ALL USING (auth.role() = \'service_role\')',
      // Knowledge
      'CREATE POLICY "kn_all_own" ON public.knowledge_nodes FOR ALL USING (auth.uid() = user_id)',
      'CREATE POLICY "kn_all_service" ON public.knowledge_nodes FOR ALL USING (auth.role() = \'service_role\')',
      'CREATE POLICY "ke_all_own" ON public.knowledge_edges FOR ALL USING (EXISTS (SELECT 1 FROM public.knowledge_nodes WHERE id = source_id AND user_id = auth.uid()))',
      'CREATE POLICY "ke_all_service" ON public.knowledge_edges FOR ALL USING (auth.role() = \'service_role\')',
      // User stats
      'CREATE POLICY "us_all_own" ON public.user_stats FOR ALL USING (auth.uid() = user_id)',
      'CREATE POLICY "us_all_service" ON public.user_stats FOR ALL USING (auth.role() = \'service_role\')',
    ];

    for (const p of policies) {
      await client.query(p);
    }

    console.log('All RLS policies fixed!');

    await client.query("NOTIFY pgrst, 'reload schema'");
    console.log('PostgREST schema reloaded');
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}

run();
