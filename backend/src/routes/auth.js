import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const loginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
});

router.post('/login', async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: 'Username dan password wajib diisi' });
    }
    const { username, password } = parsed.data;

    const { rows } = await pool.query(
        'SELECT id, username, full_Name, role, password_hash, is_active FROM users WHERE username = $1',
        [username]
    );
    const user = rows[0];

    // Pesan error sengaja sama untuk "user tidak ada" dan "password salah",
    // supaya penyerang tidak bisa menebak username mana yang terdaftar.
    const valid = user && user.is_active && (await bcrypt.compare(password, user.password_hash));
    if (!valid) {
        return res.status(401).json({ message: 'Username atau password salah' });
    }

    const token = jwt.sign(
        { sub: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '12h' } //kira-kira satu shift kerja
    );

    res.json({
        token,
        user: { id: user.id, username: user.username, fullName: user.full_name, role: user.role },
    });
});

// Dipakai frontend untuk cek "saya login sebagai siapa".
router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

export default router;