import psycopg2

DB_URL = "postgresql://postgres.cxiicvirllfdvcjwwcbj:MJsm20p0A7Y7vwwZ@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"

try:
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = True
    cur = conn.cursor()

    with open(r"A:\IMU-CORE\sql\002_gamification_schema.sql", "r") as f:
        sql = f.read()

    cur.execute(sql)
    print("Migration executed successfully!")

    # Verify tables
    cur.execute("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
    """)
    tables = cur.fetchall()
    print(f"\nTables in database ({len(tables)}):")
    for t in tables:
        print(f"  - {t[0]}")

    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
