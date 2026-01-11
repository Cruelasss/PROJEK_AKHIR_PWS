const isAdmin = (req, res, next) => {
    // req.user biasanya diisi oleh middleware auth (JWT) sebelumnya
    if (req.user && req.user.role === 'admin') {
        next(); // Lanjut jika admin
    } else {
        res.status(403).json({ message: 'Access denied. Admin only.' });
    }
};