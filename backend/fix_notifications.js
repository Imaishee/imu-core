const { Client } = require('pg');

const c = new Client({ connectionString: process.env.DATABASE_URL });

const statements = [
  // Broadcast notifications have no single owning user.
  `ALTER TABLE notifications ALTER COLUMN user_id DROP NOT NULL`,

  // The old CHECK only allowed per-user study reminders; admin/system
  // notifications were rejected outright.
  `ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check`,
  `ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
     CHECK (type = ANY (ARRAY['exam','assignment','reminder','streak','achievement','admin','system','class_reminder','alarm']))`,

  // Authenticated clients must be able to read broadcasts + their own.
  `DROP POLICY IF EXISTS notifications_authenticated_read ON notifications`,
  `CREATE POLICY notifications_authenticated_read ON notifications
     FOR SELECT TO authenticated
     USING (target = 'all' OR target_user_id = auth.uid() OR user_id = auth.uid())`,

  // ...and mark them read.
  `DROP POLICY IF EXISTS notifications_authenticated_mark_read ON notifications`,
  `CREATE POLICY notifications_authenticated_mark_read ON notifications
     FOR UPDATE TO authenticated
     USING (target = 'all' OR target_user_id = auth.uid() OR user_id = auth.uid())
     WITH CHECK (target = 'all' OR target_user_id = auth.uid() OR user_id = auth.uid())`,
];

(async () => {
  await c.connect();
  for (const sql of statements) {
    try {
      await c.query(sql);
      console.log('OK  :', sql.split('\n')[0].trim().slice(0, 90));
    } catch (e) {
      console.log('FAIL:', sql.split('\n')[0].trim().slice(0, 90), '->', e.message);
    }
  }
  await c.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
