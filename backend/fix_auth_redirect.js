// USAGE (from backend/):
//   SUPABASE_ACCESS_TOKEN=sbp_... node fix_auth_redirect.js
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT = 'cxiicvirllfdvcjwwcbj';
const URL = `https://api.supabase.com/v1/projects/${PROJECT}/config/auth`;

async function main() {
  if (!TOKEN) {
    console.log('Set SUPABASE_ACCESS_TOKEN env var first.');
    process.exit(1);
  }

  const getRes = await fetch(`${URL}?type=auth`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  const config = await getRes.json();
  console.log('Before: site_url =', config.site_url);

  config.site_url = 'https://cxiicvirllfdvcjwwcbj.supabase.co';
  config.uri_allow_list = 'https://cxiicvirllfdvcjwwcbj.supabase.co/*';

  const putRes = await fetch(URL, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  const putBody = await putRes.text();
  console.log('PATCH status:', putRes.status);
  if (putRes.ok) {
    const d = JSON.parse(putBody);
    console.log('After: site_url =', d.site_url);
    console.log('After: uri_allow_list =', d.uri_allow_list);
  } else {
    console.log('PATCH error:', putBody);
  }
}

main().catch(e => { console.error(e); process.exit(1); });