const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

/* =========================
   Middleware Admin
========================= */
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({
        status: 'error',
        message: 'Access denied: Admin only'
    });
};

/* =========================
   Helper Ambil Rows Aman
========================= */
const getRows = (result) => {
    if (!result) return [];
    if (Array.isArray(result)) return result;
    if (result.rows) return result.rows;
    // Menangani kasus mysql2 promise yang mengembalikan [rows, fields]
    if (Array.isArray(result[0])) return result[0]; 
    return [];
};

/* =========================
   DASHBOARD STATS (UPDATED WITH GROWTH DATA)
========================= */
router.get('/dashboard-stats', verifyToken, isAdmin, async (req, res) => {
    try {
        // 1. Total Users
        const usersResult = await db.query(
            "SELECT COUNT(*) AS total FROM users WHERE role = 'user' AND is_active = 1"
        );
        const totalUsers = getRows(usersResult)[0]?.total || 0;

        // 2. Active Keys
        const activeResult = await db.query(
            "SELECT COUNT(*) AS total FROM api_keys WHERE is_active = 1"
        );
        const activeKeys = getRows(activeResult)[0]?.total || 0;

        // 3. Revoked Keys
        const revokedResult = await db.query(
            "SELECT COUNT(*) AS total FROM api_keys WHERE is_active = 0"
        );
        const revokedKeys = getRows(revokedResult)[0]?.total || 0;

        // 4. 🔥 QUERY BARU: User Growth (30 Hari Terakhir)
        const growthResult = await db.query(`
            SELECT DATE(created_at) as date, COUNT(*) as count 
            FROM users 
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);
        const growth = getRows(growthResult);

        // 5. Recent Users
       // Ganti bagian query recentUsersResult menjadi seperti ini:
const recentUsersResult = await db.query(`
    SELECT 
        u.id, u.username, u.email, u.created_at, u.role,
        (SELECT COUNT(*) FROM api_keys WHERE user_id = u.id) AS total_keys
    FROM users u
    WHERE u.is_active = 1
    ORDER BY u.created_at DESC
`);
        const users = getRows(recentUsersResult);

        // 6. Global Keys Monitoring
        const keysResult = await db.query(`
            SELECT 
                k.id, k.api_key, k.is_active, k.created_at,
                COALESCE(u.username, 'System') AS owner
            FROM api_keys k
            LEFT JOIN users u ON u.id = k.user_id
            ORDER BY k.created_at DESC
            LIMIT 10
        `);
        const keys = getRows(keysResult);

        res.json({
            status: 'success',
            stats: { totalUsers, activeKeys, revokedKeys },
            growth, // Data untuk Line Chart
            users,
            keys
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
});

/* =====================================================
   🔒 BAN USER
===================================================== */
router.put('/users/:id/ban', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await db.query(
            "UPDATE users SET is_active = 0 WHERE id = ? AND role = 'user'",
            [id]
        );
        res.json({ status: 'success', message: 'User berhasil diban' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

/* =====================================================
   🔁 TOGGLE API KEY
===================================================== */
router.put('/api-keys/:id/toggle', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query("SELECT is_active FROM api_keys WHERE id = ?", [id]);
        const rows = getRows(result);
        
        if (rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'API key tidak ditemukan' });
        }

        const newStatus = rows[0].is_active ? 0 : 1;
        await db.query("UPDATE api_keys SET is_active = ? WHERE id = ?", [newStatus, id]);

        res.json({
            status: 'success',
            message: newStatus ? 'API key direstore' : 'API key direvoke'
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

module.exports = router;