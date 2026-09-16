const { Client } = require('pg');
const fs = require('fs');
const client = new Client({
  connectionString: 'postgresql://postgres.cxiicvirllfdvcjwwcbj:MJsm20p0A7Y7vwwZ@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  try {
    await client.connect();
    const sql = fs.readFileSync('A:/IMU-CORE/backend/schema.sql', 'utf8');
    await client.query(sql);
    console.log('Migration successful!');
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}
run();
