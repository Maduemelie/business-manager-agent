import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const dbPath = path.resolve('perfumes.db');
const outputPath = path.resolve('frontend/src/data/seedPerfumes.json');

console.log('Reading DB from:', dbPath);
const database = new DatabaseSync(dbPath, { readOnly: true });

const query = database.prepare('SELECT * FROM perfumes ORDER BY id ASC');
const rows = query.all();
console.log(`Extracted ${rows.length} perfumes from SQLite database.`);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(rows, null, 2), 'utf-8');
console.log(`Saved seed perfumes to ${outputPath}`);
