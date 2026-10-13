import { readFile } from 'node:fs/promises';
import { pool } from './pool.js';

// Baca isi schema.sql lalu jalankan di database.
const sql = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
await pool.query(sql);
console.log('Skema database MalayPOS siap');
await pool.end(); // tutup koneksi supaya script berhenti