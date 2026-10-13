import bcrypt from 'bcryptjs';
import { pool } from './pool.js';

// Password di-hash: hasilnya acak dan tidak bisa dibalik jadi password asli.
const hash = await bcrypt.hash('admin123', 10);

await pool.query(
    `INSERT INTO users (username, password_hash, full_name, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (username) DO NOTHING`,
    ['admin', hash, 'Administrator', 'admin']
);
console.log('Admin dibuat (username: admin, password: admin123)');
await pool.end();