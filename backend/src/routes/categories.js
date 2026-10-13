import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const categorySchema = z.object({ name: z.string().trim().min(1) });

router.get('/', async (req, res) => {
    const { rows } = await pool.query('SELECT id, name FROM categories ORDER BY name');
    res.json({ data: rows });
});

router.post('/', requireRole('admin'), async (req, res) => {
    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Nama kategori wajib diisi' });
    try {
        const { rows } = await pool.query(
            'INSERT INTO categories (name) VALUES ($1) RETURNING *',
            [parsed.data.name]
        );
        res.status(201).json(rows[0]);
    }   catch (err) {
        if (err.code === '23505') return res.status(409).json({ message: 'Kategori sudah ada' });
        throw err;
    }
});

router.put('/:id', requireRole('admin'), async (req, res) => {
    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Nama kategori wajib diisi' });
    try {
        const { row } = await pool.query(
            'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
            [parsed.data.name, req.params.id]
        );
        if (!rows[0]) return res.status(404).json({ message: 'Kategori tidak ditemukan' });
        res.json(rows[0]);
    }   catch (err) {
        if (err.code === '23505') return res.status(409).json({ message: 'Kategoru sudah ada' });
        throw err;
    }
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
    try{
        const { rowCount } = await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
        if (!rowCount) return res.status(404).json({ message: 'Kategori tidak ditemukan' });
        res.status(204).end();
    }   catch (err) {
        if (err.code === '23505') { // pelanggaran foreign key
            return res.status(409).json({ message: 'Kategori masih dipakai barang' });
        }
        throw err;
    }
});

export default router;