import bcrypt from 'bcryptjs';
import { pool } from './pool.js';

// Daftar akun awal. Password di-hash sebelum disimpan.
const users = [
  { username: 'admin',  password: 'admin123', fullName: 'Administrator', role: 'admin' },
  { username: 'kasir1', password: 'kasir123', fullName: 'Kasir Satu',    role: 'kasir' },
];

for (const u of users) {
  const hash = await bcrypt.hash(u.password, 10);
  await pool.query(
    `INSERT INTO users (username, password_hash, full_name, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (username) DO NOTHING`,
    [u.username, hash, u.fullName, u.role]
  );
  console.log(`Akun siap: ${u.username} (${u.role})`);
}

await pool.end();