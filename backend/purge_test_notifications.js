const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || '';
if (!connectionString) {
  console.error('DATABASE_URL env var is required');
  process.exit(1);
}

const IDS = [
  'fb9506cd-e9c8-425d-ad77-a8941b7fe47c', // Dup-Check
  '9346c33e-8bb2-473d-808e-d30f8c4c1377', // HI
];

const c = new Client({ connectionString });

(async () => {
  await c.connect();
  const r = await c.query(
    'DELETE FROM notifications WHERE id = ANY($1::uuid[]) RETURNING id, title',
    [IDS],
  );
  console.log('deleted', r.rowCount);
  for (const row of r.rows) console.log(' -', row.title, row.id);
  const left = await c.query('SELECT count(*)::int AS n FROM notifications');
  console.log('remaining rows:', left.rows[0].n);
  await c.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
