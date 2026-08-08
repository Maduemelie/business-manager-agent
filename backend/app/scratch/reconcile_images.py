import os
import sqlite3
import re
from backend.app.config import settings

def normalize_name(name):
    if not name:
        return ""
    # Lowercase, keep letters, numbers, and basic spaces, strip excess spacing
    cleaned = re.sub(r'[^a-z0-9\s]', '', name.lower())
    return " ".join(cleaned.split())

def reconcile():
    db_path = settings.db_path
    images_dir = settings.images_dir
    
    print(f"Reconciling database at {db_path} with assets in {images_dir}...")
    
    # 1. Read files on disk
    if not os.path.exists(images_dir):
        print(f"Error: Images directory {images_dir} does not exist!")
        return
        
    png_files = [f for f in os.listdir(images_dir) if f.lower().endswith('.png')]
    print(f"Found {len(png_files)} PNG files on disk.")
    
    normalized_files = {normalize_name(os.path.splitext(f)[0]): f for f in png_files}
    
    # 2. Connect to Database
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, perfume_name, image_filename FROM perfumes")
    perfumes = cursor.fetchall()
    
    updates = []
    
    for row in perfumes:
        perfume_id = row['id']
        name = row['perfume_name']
        current_img = row['image_filename']
        
        normalized_db_name = normalize_name(name)
        
        # Check direct match
        matched_filename = normalized_files.get(normalized_db_name)
        
        if not matched_filename:
            # Try fuzzy matching substrings (e.g. "Vip Man" matches "212 VIP Man" or "212 Vip Black")
            for norm_file_key, orig_filename in normalized_files.items():
                if norm_file_key in normalized_db_name or normalized_db_name in norm_file_key:
                    matched_filename = orig_filename
                    break
                    
        if matched_filename:
            if current_img != matched_filename:
                updates.append((matched_filename, perfume_id, name, current_img))
                
    print(f"Found {len(updates)} database record updates to apply.")
    
    # 3. Apply updates
    for new_img, p_id, name, old_img in updates:
        print(f"Updating Perfume #{p_id} '{name}': '{old_img}' -> '{new_img}'")
        cursor.execute("UPDATE perfumes SET image_filename = ? WHERE id = ?", (new_img, p_id))
        
    conn.commit()
    conn.close()
    print("Reconciliation complete!")

if __name__ == "__main__":
    reconcile()
