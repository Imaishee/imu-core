const { Client } = require('pg');
const c = new Client({ connectionString: 'postgresql://postgres.cxiicvirllfdvcjwwcbj:MJsm20p0A7Y7vwwZ@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres' });

const APK_URL = 'https://cxiicvirllfdvcjwwcbj.supabase.co/storage/v1/object/public/apk-downloads/IMU-v1.4.0-arm64.apk';

(async () => {
  await c.connect();
  // Delete bad rows (GitHub web page URLs, wrong versions)
  const del = await c.query(`DELETE FROM app_versions WHERE download_url LIKE '%github.com%' RETURNING version, download_url`);
  console.log('Deleted bad rows:', JSON.stringify(del.rows));

  // Upsert correct v1.4.0 row
  const up = await c.query(`
    INSERT INTO app_versions (version, download_url, release_notes, force_update, file_size)
    VALUES ('1.4.0', $1, 'Auth signup fixed, notification system, Pomodoro timer, copy/share, search, auto-update', false, 20534601)
    ON CONFLICT (version) DO UPDATE SET download_url = $1, release_notes = 'Auth signup fixed, notification system, Pomodoro timer, copy/share, search, auto-update', force_update = false, file_size = 20534601
    RETURNING *`, [APK_URL]);
  console.log('Upserted:', JSON.stringify(up.rows, null, 2));

  const all = await c.query('SELECT version, download_url, force_update FROM app_versions ORDER BY created_at DESC');
  console.log('All versions:', JSON.stringify(all.rows, null, 2));
  await c.end();
})();
