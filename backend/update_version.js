const { Client } = require('pg');

// Usage: node update_version.js <version>
// Requires DATABASE_URL env var (Supabase pooler connection string).
const VERSION = process.argv[2] || '1.5.1';
const connectionString = process.env.DATABASE_URL || '';
if (!connectionString) {
  console.error('DATABASE_URL env var is required');
  process.exit(1);
}

const downloadUrl = `https://cxiicvirllfdvcjwwcbj.supabase.co/storage/v1/object/public/apk-downloads/IMU-v${VERSION}-arm64.apk`;

const c = new Client({ connectionString });

(async () => {
  await c.connect();
  const r = await c.query(
    `UPDATE app_versions
     SET version=$1, download_url=$2, release_notes=$3, force_update=false, created_at=now()
     RETURNING *`,
    [
      VERSION,
      downloadUrl,
      'Fix: admin notifications now show up in the app, alarms repeat on the days you pick and fire reliably, and you can now just ask the AI to add/remove classes or set an alarm.',
    ],
  );
  console.log('Updated:', JSON.stringify(r.rows, null, 2));
  await c.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
