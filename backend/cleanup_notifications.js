const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
(async () => {
  await c.connect();
  const before = (await c.query('SELECT count(*)::int AS n FROM notifications')).rows[0].n;
  await c.query("DELETE FROM notifications WHERE title = 'Test from CLI'");
  const after = (await c.query('SELECT count(*)::int AS n FROM notifications')).rows[0].n;
  console.log(`rows before cleanup: ${before} -> after: ${after}`);
  const rest = await c.query('SELECT id, type, title, target, status FROM notifications ORDER BY created_at DESC LIMIT 5');
  console.log('remaining rows:', rest.rows.length);
  for (const r of rest.rows) console.log(JSON.stringify(r));
  await c.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
