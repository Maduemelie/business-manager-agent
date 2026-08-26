import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve('..');
const dbPath = path.join(rootDir, 'perfumes.db');
const outputPath = path.resolve('src/data/seedPerfumes.json');

console.log('Reading DB from:', dbPath);
const database = new DatabaseSync(dbPath, { readOnly: true });

const query = database.prepare('SELECT * FROM perfumes ORDER BY id ASC');
const rows = query.all();
console.log(`Extracted ${rows.length} perfumes from SQLite database.`);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(rows, null, 2), 'utf-8');
console.log(`Saved seed perfumes to ${outputPath}`);

// Copy images
const srcImagesDir = path.join(rootDir, 'Sirvinistyles perfume images');
const destImagesDir = path.resolve('public/images');
fs.mkdirSync(destImagesDir, { recursive: true });

const files = fs.readdirSync(srcImagesDir);
let copyCount = 0;
for (const file of files) {
  const srcFile = path.join(srcImagesDir, file);
  const destFile = path.join(destImagesDir, file);
  if (fs.statSync(srcFile).isFile()) {
    fs.copyFileSync(srcFile, destFile);
    copyCount++;
  }
}
console.log(`Successfully copied ${copyCount} images to ${destImagesDir}`);
