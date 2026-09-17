const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cxiicvirllfdvcjwwcbj.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const BUCKET = 'apk-downloads';

// Usage: node upload_apk.js <version>   e.g. node upload_apk.js 1.5.1
const VERSION = process.argv[2] || '1.5.1';
const OBJECT_PATH = `IMU-v${VERSION}-arm64.apk`;
const APK_PATH = path.join('A:/IMU-CORE/dist', OBJECT_PATH);

async function main() {
  if (!SERVICE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY env var is required');
  }
  if (!fs.existsSync(APK_PATH)) {
    throw new Error(`APK not found at ${APK_PATH}`);
  }

  const fileBuffer = fs.readFileSync(APK_PATH);
  console.log('Uploading', OBJECT_PATH, 'size:', fileBuffer.length, 'bytes');

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

  const headResp = await fetch(publicUrl, { method: 'HEAD' });
  console.log('HEAD check:', headResp.status, headResp.headers.get('content-type'), headResp.headers.get('content-length'));
}

main().catch(e => { console.error(e); process.exit(1); });
