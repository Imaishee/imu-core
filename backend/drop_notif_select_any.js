const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || '';
if (!connectionString) {
  console.error('DATABASE_URL env var is required');
  process.exit(1);
}

const c = new Client({ connectionString });

(async () => {
  await c.connect();
  await c.query('DROP POLICY IF EXISTS "notif_select_any" ON public.notifications');
  console.log('dropped notif_select_any');

  const r = await c.query(
    `SELECT policyname, cmd, roles::text AS roles, qual
     FROM pg_policies
     WHERE tablename = 'notifications'
     ORDER BY policyname`,
  );
  for (const row of r.rows) {
    console.log(`- ${row.policyname} | ${row.cmd} | roles=${row.roles} | using=${row.qual}`);
  }
  await c.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
