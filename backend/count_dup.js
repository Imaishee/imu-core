const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
(async () => {
  await c.connect();
  const n = (await c.query("SELECT count(*)::int AS n FROM notifications WHERE title = 'Dup-Check'")).rows[0].n;
  console.log(`rows titled 'Dup-Check': ${n}`);
  const rows = await c.query("SELECT id, created_at FROM notifications WHERE title = 'Dup-Check' ORDER BY created_at");
  for (const r of rows.rows) console.log(JSON.stringify(r));
  await c.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
