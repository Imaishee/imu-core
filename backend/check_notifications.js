const { Client } = require('pg');

const c = new Client({ connectionString: process.env.DATABASE_URL });
(async () => {
  await c.connect();
  const cols = await c.query(
    `SELECT column_name, data_type, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_name='notifications'
     ORDER BY ordinal_position`,
  );
  console.log('=== notifications columns ===');
  for (const r of cols.rows) {
    console.log(`${r.column_name} | ${r.data_type} | null=${r.is_nullable} | default=${r.column_default}`);
  }

  const cnt = await c.query('SELECT count(*) AS n FROM notifications');
  console.log('\n=== row count ===', cnt.rows[0].n);

  const recent = await c.query(
    'SELECT id, type, title, message, target, target_user_id, status, sent_at FROM notifications ORDER BY sent_at DESC NULLS LAST LIMIT 5',
  );
  console.log('\n=== recent 5 ===');
  for (const r of recent.rows) console.log(JSON.stringify(r));

  await c.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
