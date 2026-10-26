# MalayPOS

Sistem Point of Sale berbasis web untuk toko retail, pengganti aplikasi
desktop lama (Windows XP, 2010). Dibuat dari nol untuk bisnis keluarga.

## Fitur saat ini
- Login dengan JWT, role admin dan kasir
- Data barang: tambah, edit, hapus, pencarian, pagination
- Shortcut keyboard seperti sistem lama (F4, F2, F5, F8)
- Harga beli dan laba disembunyikan dari kasir **di sisi server**
- CRUD supplier dan kategori (API)

## Teknologi
Node.js, Express, PostgreSQL, React, Vite

## Menjalankan secara lokal
1. Buat database `malaypos` di PostgreSQL
2. `cd backend`, salin `.env.example` jadi `.env`, isi nilainya
3. `npm install`, lalu `npm run db:init` dan `npm run seed`
4. `npm run dev`
5. Di terminal lain: `cd frontend`, `npm install`, `npm run dev`
6. Buka http://localhost:5173

## Akun demo
`admin` / `admin123` dan `kasir1` / `kasir123`.
Hanya untuk development. Wajib diganti saat dipakai di toko.

## Rencana
Stok, layar kasir, pembelian dan hutang, laporan, migrasi data lama.