import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import supplierRoutes from './routes/suppliers.js';
import categoryRoutes from './routes/categories.js';

const app = express();

app.use(cors({ origin: 'http://localhost:5173' })); //alamat frontend Vite
app.use(express.json());                            // baca body JSON dari request

app.get('/api/health', (req, res) => res.json({ ok: true, app: 'MalayPOS' }));
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/categories', categoryRoutes);

// Penangkap error terakhir: kalau ada error tak terduga, server tidak crash
// dan detail teknis tidak bocor ke pengguna.
app.use((err, req, res, next) => {
    console.error (err);
    res.status(500).json({ message: 'Terjadi kesalahan pada server'});
});

export default app;