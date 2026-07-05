import sqlite3

def dump_to_sql():
    con = sqlite3.connect('sql_app.db')
    with open('database_dump.sql', 'w', encoding='utf-8') as f:
        for line in con.iterdump():
            f.write('%s\n' % line)
    con.close()
    print("Database dumped to database_dump.sql")

if __name__ == '__main__':
    dump_to_sql()
