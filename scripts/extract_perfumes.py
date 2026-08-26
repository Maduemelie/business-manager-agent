import sqlite3
import json
import os

DB_PATH = "perfumes.db"
OUTPUT_PATH = "frontend/src/data/seedPerfumes.json"

def extract():
    if not os.path.exists(DB_PATH):
        raise FileNotFoundError(f"Database file not found at {DB_PATH}")
        
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Check all columns in perfumes table
    cursor.execute("PRAGMA table_info(perfumes)")
    columns = [col[1] for col in cursor.fetchall()]
    print(f"Table columns: {columns}")
    
    cursor.execute("SELECT * FROM perfumes ORDER BY id ASC")
    rows = cursor.fetchall()
    perfumes = []
    for row in rows:
        item = dict(row)
        if "name" not in item and "perfume_name" in item:
            item["name"] = item["perfume_name"]
        if "perfume_name" not in item and "name" in item:
            item["perfume_name"] = item["name"]
        perfumes.append(item)
    
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(perfumes, f, indent=2, ensure_ascii=False)
        
    print(f"Successfully extracted {len(perfumes)} perfumes to {OUTPUT_PATH}")
    conn.close()

if __name__ == "__main__":
    extract()
