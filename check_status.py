#!/usr/bin/env python3
import sqlite3

conn = sqlite3.connect('xingdianping.db')
cursor = conn.cursor()
cursor.execute('SELECT status, COUNT(*) FROM tool GROUP BY status')
rows = cursor.fetchall()
print('Tool 状态分布:')
for status, count in rows:
    print(f'  {status}: {count}')

# 列出所有工具
cursor.execute('SELECT slug, name, status FROM tool ORDER BY status')
all_tools = cursor.fetchall()
print('\n所有工具列表:')
for slug, name, status in all_tools:
    print(f'  [{status}] {name} ({slug})')

conn.close()
