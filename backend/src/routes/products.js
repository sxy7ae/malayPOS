import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth); // semua endpoint di file ini wajib login

const productSchema = z.object({
    code: z.string().trim().min(1),
    name: z.string().trim().min(1),
    categoryId: z.number().int().positive().nullable().optional(),
    supplierId: z.number().int().positive().nullable().optional(),
    unit: z.string().trim().min(1).default('buah'),
    buyPrice: z.number().min(0),
    sellPrice: z.number().min(0),
    minStock: z.number().min(0).default(0),
});

// GET /api/products?q=kacang&page=1&limit=20
router.get('/', async (req, res) => {
    const q = `%${req.query.q ?? ''}%`;
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const offset = ((Number(req.query.page) || 1) - 1) * limit;

    const [list, count] = await Promise.all([
        pool.query(
            `SELECT p.id, p.code, p.name, p.buy_price, p.sell_price,
                    (p.sell_price - p.buy_price) AS profit,
                    p.min_stock, c.name AS category
             FROM products p
             LEFT JOIN categories c ON c.id = p.category_id
             WHERE p.is_active AND (p.name ILIKE $1 OR p.code ILIKE $1)
             ORDER BY p.name
             LIMIT $2 OFFSET $3`,
             [q, limit, offset]
        ),
        pool.query(
            'SELECT COUNT(*)::int AS total FROM products WHERE is_active AND (name ILIKE $1 OR code ILIKE $1)',
            [q]
        ),
    ]);

    res.json({ data: list.rows, total: count.rows[0].total });
});

// POST /api/products (khusus admin)
router.post('/', requireRole('admin'), async (req, res) => {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: 'Data tidak valid', errors: parsed.error.issues });
    }
    const d = parsed.data;

    try {
        const { rows } = await pool.query(
            `INSERT INTO products (code, name, category_id, supplier_id, unit,  buy_price, sell_price, min_stock)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [d.code, d.name, d.categoryId ?? null, d.supplierId ?? null, d.unit, d.buyPrice, d.sellPrice, d.minStock]
        );
        res.status(201).json(rows[0]);
    }   catch (err) {
        if (err.code === '23505') { // kode error Postgres: pelanggaran UNIQUE
            return res.status(409).json({ message: 'Kode barang sudah dipakai' });
        }
        throw err; // error lain diteruskan penangkap error di app.js
    }
});

// PUT /api/products/:id (khusus admin)
router.put('/:id', requireRole('admin'), async (req, res) => {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: 'Data tidak valid', errors: parsed.error.issues });
    }
    const d = parsed.data;

    try {
        const { rows } = await pool.query(
            `UPDATE products
            SET code=$1, name=$2, category_id=$3, supplier_id=$4, unit=$5, buy_price=$6, sell_price=$7,
                min_stock=$8, updated_at=NOW()
            WHERE id=$9 AND is_active
            RETURNING *`,
            [d.code, d.name, d.categoryId ?? null, d.supplierId ?? null, d.unit, d.buyPrice, d.SellPrice, d.minStock, req.params.id]
        );
        if (!rows[0]) return res.status(404).json({ message: 'Barang tidak ditemukan' });
        res.json(rows[0]);
    }   catch (err) {
        if (err.code === '23505') return res.status(409).json({ message: 'Kode barang sudah dipakai'});
        throw err;
    }
});

// DELETE /api/products/:id (soft delete, khusus admin)
router.delete('/:id', requireRole('admin'), async (req, res) => {
    const { rowCount } = await pool.query(
        'UPDATE products SET is_active = FALSE, updated_at = NOW() WHERE id = $1 AND is_active',
        [req.params.id]
    );
    if (!rowCount) return res.status(404).json({ message: 'Barang tidak ditemukan' });
    res.status(204).end();
});

export default router;