const { query } = require('../config/database');
const crypto = require('crypto');

// Generate API Key
const generateApiKey = () => {
  return 'ek_' + crypto.randomBytes(32).toString('hex');
};

// Create API Key
exports.createApiKey = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        status: 'error',
        message: 'Nama API key harus diisi',
      });
    }

    const apiKey = generateApiKey();

    await query(
      'INSERT INTO api_keys (user_id, api_key, name) VALUES (?, ?, ?)',
      [userId, apiKey, name]
    );

    return res.status(201).json({
      status: 'success',
      message: 'API key berhasil dibuat',
      data: {
        name,
        api_key: apiKey,
        created_at: new Date(),
      },
    });
  } catch (error) {
    console.error('Create API key error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan saat membuat API key',
      error: error.message,
    });
  }
};

// Get User's API Keys
exports.getApiKeys = async (req, res) => {
  try {
    const userId = req.user.id;

    const apiKeys = await query(
      `SELECT id, name, api_key, is_active, created_at, last_used 
       FROM api_keys WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );

    return res.status(200).json({
      status: 'success',
      data: apiKeys,
    });
  } catch (error) {
    console.error('Get API keys error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan',
      error: error.message,
    });
  }
};

// Revoke API Key
exports.revokeApiKey = async (req, res) => {
  try {
    const userId = req.user.id;
    const { apiKeyId } = req.params;

    // Check if API key belongs to user
    const apiKeys = await query(
      'SELECT id FROM api_keys WHERE id = ? AND user_id = ?',
      [apiKeyId, userId]
    );

    if (apiKeys.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'API key tidak ditemukan',
      });
    }

    // Update is_active to false
    await query(
      'UPDATE api_keys SET is_active = FALSE WHERE id = ?',
      [apiKeyId]
    );

    return res.status(200).json({
      status: 'success',
      message: 'API key berhasil dinonaktifkan',
    });
  } catch (error) {
    console.error('Revoke API key error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan',
      error: error.message,
    });
  }
};

// Restore API Key
exports.restoreApiKey = async (req, res) => {
  try {
    const userId = req.user.id;
    const { apiKeyId } = req.params;

    // Check if API key belongs to user
    const apiKeys = await query(
      'SELECT id FROM api_keys WHERE id = ? AND user_id = ?',
      [apiKeyId, userId]
    );

    if (apiKeys.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'API key tidak ditemukan',
      });
    }

    // Update is_active to true
    await query(
      'UPDATE api_keys SET is_active = TRUE WHERE id = ?',
      [apiKeyId]
    );

    return res.status(200).json({
      status: 'success',
      message: 'API key berhasil dipulihkan',
    });
  } catch (error) {
    console.error('Restore API key error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan',
      error: error.message,
    });
  }
};

// Delete API Key
exports.deleteApiKey = async (req, res) => {
  try {
    const userId = req.user.id;
    const { apiKeyId } = req.params;

    // Check if API key belongs to user
    const apiKeys = await query(
      'SELECT id FROM api_keys WHERE id = ? AND user_id = ?',
      [apiKeyId, userId]
    );

    if (apiKeys.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'API key tidak ditemukan',
      });
    }

    // Delete API key
    await query('DELETE FROM api_keys WHERE id = ?', [apiKeyId]);

    return res.status(200).json({
      status: 'success',
      message: 'API key berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete API key error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan',
      error: error.message,
    });
  }
};
