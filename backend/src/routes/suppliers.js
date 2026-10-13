import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// Data lama sering berisi "-" atau "0" sebagai tanda kosong.
// Di sini kita ubah jadi null supaya database bersih.
const optionalText = z
    .string()
    .trim()
    .transform((v) => (v === '' || v === '-' || v === '0' ? null : v))
    .nullish();

const supplierSchema = z.object({
    code: z.string().trim().min(1),
    name: z.string().trim().min(1),
    address: optionalText,
    city: optionalText,
    postalCode: optionalText,
    phone: optionalText,
    fax: optionalText,
    bankAccount: optionalText,
});

//GET /api/suppliers?q=aji
router.get('/', async (req, res) => {
    const q = `%${req.query.q ?? ''}%`;
    const { rows } = await pool.query(
        `SELECT id, code, name, address, city, postal_code, phone, fax, bank_account
         FROM suppliers
         WHERE is_active AND (name ILIKE $1 OR code ILIKE $1)
         ORDER BY name`,
        [q]
    );
    res.json({ data: rows });
});

router.post('/', requireRole('admin'), async (req, res) => {
    const parsed = supplierSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: 'Data tidak valid', errors: parsed.error.issues });
    }
    const d = parsed.data;
    try {
        const { rows } = await pool.query(
            `INSERT INTO suppliers (code, name, address, city, postal_code, phone, fax, bank_account)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [d.code, d.name, d.address, d.city ?? null, d.postalCode ?? null, 
                d.phone ?? null, d.fax ?? null, d.bankAccount ?? null]
        );
        res.status(201).json(rows[0]);
    }   catch (err) {
        if (err.code === '23505') return res.status(409).json({ message: 'Kode supplier sudah dipakai' })
        throw err;
    }
});

router.put('/:id', requireRole('admin'), async (req, res) => {
    const parsed = supplierSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: 'Data tidak valid', errors: parsed.error.issues });
    }
    const d = parsed.data;
    try {
        const { rows } = await pool.query(
            `UPDATE suppliers
             SET code=$1, name=$2, address=$3, city=$4, postal_code=$5, phone=$6, fax=$7, bank_account=$8
             WHERE id=$9 AND is_active
             RETURNING *`,
            [d.code, d.name, d.address ?? null, d.city ?? null, d.postalCode ?? null,
             d.phone ?? null, d.fax ?? null, d.bankAccount ?? null, req.params.id]
        );
        if (!rows[0]) return res.status(404).json({ message: 'Supplier tidak ditemukan' });
        res.json(rows[0]);
    }   catch (err) {
        if (err.code === '23505') return res.status(409).json({ message: 'Kode supplier sudah dipakai' });
        throw err;
    }
});

// Soft delete: riwayat pembelian lama tetap bisa merujuk supplier ini.
router.delete('/:id', requireRole('admin'), async (req, res) => {
    const { rowCount } = await pool.query(
        'UPDATE suppliers SET is_active = FALSE WHERE id = $1 AND is_active',
        [req.params.id]
    );
    if (!rowCount) return res.status(404).json({ message: 'Supplier tidak ditemukan' });
    res.status(204).end();
});

export default router;
