const { Client } = require('pg');
const c = new Client({ connectionString: 'postgresql://postgres.cxiicvirllfdvcjwwcbj:MJsm20p0A7Y7vwwZ@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres' });
(async () => {
  await c.connect();
  for (const t of ['notifications', 'activity_log', 'app_versions', 'system_prompts']) {
    const r = await c.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = '${t}' AND table_schema = 'public' ORDER BY ordinal_position`);
    console.log(t + ':', r.rows.map(x => `${x.column_name}(${x.data_type})`).join(', '));
  }
  await c.end();
})();
