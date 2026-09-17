const { Client } = require('pg');
const c = new Client({ connectionString: 'postgresql://postgres.cxiicvirllfdvcjwwcbj:MJsm20p0A7Y7vwwZ@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres' });
(async () => {
  await c.connect();
  const r = await c.query("UPDATE app_versions SET version='1.5.0', download_url='https://cxiicvirllfdvcjwwcbj.supabase.co/storage/v1/object/public/apk-downloads/IMU-v1.5.0-arm64.apk', release_notes='Cream+green glass UI, timetable with exact alarms, extended profile', force_update=false WHERE version='1.4.0' RETURNING *");
  console.log('Updated:', r.rows);
  await c.end();
})();