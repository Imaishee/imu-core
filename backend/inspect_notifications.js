const { Client } = require('pg');

const c = new Client({ connectionString: process.env.DATABASE_URL });
(async () => {
  await c.connect();

  const rls = await c.query(
    "SELECT relrowsecurity FROM pg_class WHERE relname='notifications'",
  );
  console.log('RLS enabled:', rls.rows[0]?.relrowsecurity);

  const pol = await c.query(
    "SELECT policyname, cmd, roles::text, qual FROM pg_policies WHERE tablename='notifications'",
  );
  console.log('\n=== policies ===');
  for (const r of pol.rows) console.log(`${r.policyname} | ${r.cmd} | ${r.roles} | ${r.qual}`);

  const fks = await c.query(
    `SELECT conname, pg_get_constraintdef(oid) AS def
     FROM pg_constraint
     WHERE conrelid='notifications'::regclass`,
  );
  console.log('\n=== constraints ===');
  for (const r of fks.rows) console.log(`${r.conname} | ${r.def}`);

  await c.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
