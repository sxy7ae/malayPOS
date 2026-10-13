import jwt from 'jsonwebtoken';

// Satpam 1: pastikan request membawa token yang valid.
export function requireAuth(req, res, next) {
    const [type, token] = (req.headers.authorization ?? '').split(' ');
    if (type !== 'Bearer' || !token) {
        return res.status(401).json({ message: 'Belum login' });
    }
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET); // isi token: sub, username, role
        next(); // lanjut ke handler berikutnya
    } catch {
        res.status(401).json({ message: 'Token tidak valid atau kedaluwarsa' });
    }
}

//Satpam 2 : pastikan role pengguna diizinkan.
export function requireRole(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Tidak punya hak akses' });
        }
        next();
    };
}