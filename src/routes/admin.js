const express = require('express');
const router = express.Router();
const db = require('../config/database'); 

// Import middleware dengan destructuring
const { verifyToken } = require('../middleware/auth'); 

// Middleware untuk proteksi role admin
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Access Denied: Admin only' });
    }
};

// Route Dashboard Stats
router.get('/dashboard-stats', verifyToken, isAdmin, async (req, res) => {
    try {
        // 1. Ambil Statistik Ringkas
        const [uCount] = await db.query('SELECT COUNT(*) as total FROM users');
        const [aKeys] = await db.query('SELECT COUNT(*) as total FROM api_keys WHERE is_active = 1');
        const [rKeys] = await db.query('SELECT COUNT(*) as total FROM api_keys WHERE is_active = 0');

        // 2. Ambil Data User + Hitung Total Key masing-masing (PENTING untuk tabel frontend)
        const [users] = await db.query(`
            SELECT u.id, u.username, u.email, u.created_at,
            (SELECT COUNT(*) FROM api_keys WHERE user_id = u.id) as total_keys
            FROM users u
            ORDER BY u.created_at DESC LIMIT 10
        `);

        // 3. Ambil Log API Key Terbaru
        const [keys] = await db.query(`
            SELECT k.id, k.api_key, k.is_active, k.created_at, u.username as owner 
            FROM api_keys k 
            JOIN users u ON k.user_id = u.id 
            ORDER BY k.created_at DESC LIMIT 10
        `);

        // 4. Kirim Response ke Frontend
        res.json({
            stats: {
                totalUsers: uCount[0].total || 0,
                activeKeys: aKeys[0].total || 0,
                revokedKeys: rKeys[0].total || 0
            },
            users: users,
            keys: keys
        });

    } catch (error) {
        console.error("Admin API Error:", error.message);
        res.status(500).json({ error: "Internal Server Error: " + error.message });
    }
});

// Route Toggle API Key (Tambahan agar tombol di dashboard fungsi)
router.put('/api-keys/:id/toggle', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const [current] = await db.query('SELECT is_active FROM api_keys WHERE id = ?', [id]);
        
        if (current.length === 0) return res.status(404).json({ error: 'Key not found' });

        const newStatus = current[0].is_active === 1 ? 0 : 1;
        await db.query('UPDATE api_keys SET is_active = ? WHERE id = ?', [newStatus, id]);

        res.json({ success: true, message: 'Status updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;