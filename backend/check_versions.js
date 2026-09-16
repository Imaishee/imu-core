const { Client } = require('pg');
const c = new Client({ connectionString: 'postgresql://postgres.cxiicvirllfdvcjwwcbj:MJsm20p0A7Y7vwwZ@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres' });
(async () => {
  await c.connect();
  const r = await c.query('SELECT * FROM app_versions ORDER BY created_at DESC');
  console.log(JSON.stringify(r.rows, null, 2));
  await c.end();
})();
