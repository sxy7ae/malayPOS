import pg from 'pg';

// pool = kumpulan koneksi yang dipakai ulang, jauh lebih lebih cepat
// daripada membuka koneksi baru setiap request
export const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});