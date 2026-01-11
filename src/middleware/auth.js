const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

/**
 * Middleware untuk validasi JWT token (Digunakan untuk Login & Admin)
 */
exports.verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // 1. Cek apakah header Authorization ada
        if (!authHeader) {
            return res.status(401).json({
                status: 'error',
                message: 'Token tidak ditemukan (Authorization header missing)',
            });
        }

        // 2. Cek format Bearer dan ambil tokennya
        // Menggunakan startsWith untuk memastikan format "Bearer <token>"
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                status: 'error',
                message: 'Format token salah. Gunakan format: Bearer <token>',
            });
        }

        const token = authHeader.split(' ')[1];

        // 3. Pastikan token bukan string "null" atau "undefined" dari frontend
        if (!token || token === 'undefined' || token === 'null') {
            return res.status(401).json({
                status: 'error',
                message: 'Token kosong atau tidak valid',
            });
        }

        // 4. Verifikasi token menggunakan Secret Key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Simpan data user (id, role, dll) ke dalam request
        req.user = decoded;
        
        next();
    } catch (error) {
        console.error('JWT Error:', error.message);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: 'error',
                message: 'Sesi berakhir, silakan login kembali',
            });
        }

        return res.status(401).json({
            status: 'error',
            message: 'Token tidak valid atau telah dimodifikasi',
        });
    }
};

/**
 * Middleware untuk validasi API Key (Digunakan untuk akses layanan API)
 */
exports.verifyApiKey = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];

        if (!apiKey) {
            return res.status(401).json({
                status: 'error',
                message: 'X-API-Key tidak ditemukan di header',
            });
        }

        // Cari API Key di database
        const apiKeys = await query(
            'SELECT id, user_id, is_active FROM api_keys WHERE api_key = ?',
            [apiKey]
        );

        if (apiKeys.length === 0) {
            return res.status(401).json({
                status: 'error',
                message: 'API key tidak valid',
            });
        }

        const apiKeyData = apiKeys[0];

        // Cek apakah Admin menonaktifkan key ini
        if (!apiKeyData.is_active) {
            return res.status(403).json({
                status: 'error',
                message: 'API key ini telah dinonaktifkan oleh administrator',
            });
        }

        // Update statistik penggunaan terakhir
        await query(
            'UPDATE api_keys SET last_used = NOW() WHERE id = ?',
            [apiKeyData.id]
        );

        req.user = {
            id: apiKeyData.user_id,
            apiKeyId: apiKeyData.id,
        };

        next();
    } catch (error) {
        console.error('API Key Error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan internal server saat verifikasi API Key',
        });
    }
};