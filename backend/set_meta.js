const { Client } = require('pg');

// Usage: node set_meta.js <version> <fileSize> <sha256>
const [, , version = '1.5.1', fileSize = '0', checksum = ''] = process.argv;
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL env var is required');
  process.exit(1);
}

const c = new Client({ connectionString: process.env.DATABASE_URL });
(async () => {
  await c.connect();
  const r = await c.query(
    'UPDATE app_versions SET file_size=$1, checksum=$2 WHERE version=$3 RETURNING version,file_size,checksum,download_url',
    [Number(fileSize), checksum || null, version],
  );
  console.log(JSON.stringify(r.rows, null, 2));
  await c.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
