const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cxiicvirllfdvcjwwcbj:MJsm20p0A7Y7vwwZ@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  try {
    await client.connect();
    await client.query("NOTIFY pgrst, 'reload schema'");
    console.log('Schema reload triggered');
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}
run();
