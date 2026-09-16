const fs = require('fs');

const SUPABASE_URL = 'https://cxiicvirllfdvcjwwcbj.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4aWljdmlybGxmZHZjand3Y2JqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTQ1MjYyMywiZXhwIjoyMTA1MDI4NjIzfQ.8sEREUbE9qdNanpfg0LnJPW99l_qLxHp4yA2qUno3wY';
const APK_PATH = 'A:/IMU-CORE/dist/IMU-v1.4.0-universal.apk';
const BUCKET = 'apk-downloads';
const OBJECT_PATH = 'IMU-v1.4.0-universal.apk';

async function main() {
  // 1. Create public bucket if not exists
  const bucketResp = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: BUCKET, public: true }),
  });
  console.log('Create bucket:', bucketResp.status, await bucketResp.text().catch(() => ''));

  // 2. Upload APK (upsert)
  const fileBuffer = fs.readFileSync(APK_PATH);
  console.log('APK size:', fileBuffer.length, 'bytes');
  const uploadResp = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${OBJECT_PATH}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/vnd.android.package-archive',
      'x-upsert': 'true',
    },
    body: fileBuffer,
  });
  console.log('Upload:', uploadResp.status, await uploadResp.text().catch(() => ''));

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${OBJECT_PATH}`;
  console.log('Public URL:', publicUrl);

  // Verify the URL serves the APK
  const headResp = await fetch(publicUrl, { method: 'HEAD' });
  console.log('HEAD check:', headResp.status, headResp.headers.get('content-type'), headResp.headers.get('content-length'));
}

main().catch(e => { console.error(e); process.exit(1); });
