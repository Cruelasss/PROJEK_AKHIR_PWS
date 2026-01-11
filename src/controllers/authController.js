const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Register User
exports.register = async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ status: 'error', message: 'Username, email, dan password harus diisi' });
    }

    const existingUser = await query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({ status: 'error', message: 'Username atau email sudah terdaftar' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Insert user (Role default adalah 'user' sesuai setting database kita)
    const result = await query(
      'INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, full_name || username, 'user']
    );

    // 2. BONUS: Otomatis buatkan 1 API Key gratis untuk user baru
    const newApiKey = `eco_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
    await query(
      'INSERT INTO api_keys (user_id, api_key, is_active) VALUES (?, ?, ?)',
      [result.insertId, newApiKey, 1]
    );

    return res.status(201).json({
      status: 'success',
      message: 'User berhasil terdaftar dan mendapatkan API Key gratis',
      data: { username, email, api_key_preview: newApiKey.substring(0, 8) + '...' }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan saat registrasi' });
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ status: 'error', message: 'Username dan password harus diisi' });
    }

    // PENTING: Ambil kolom 'role' dari database
    const users = await query(
      'SELECT id, username, email, password, full_name, role FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (users.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Username atau password salah' });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ status: 'error', message: 'Username atau password salah' });
    }

    // Generate JWT token dengan memasukkan ROLE
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role // <--- ROLE DIMASUKKAN KE TOKEN
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    return res.status(200).json({
      status: 'success',
      message: 'Login berhasil',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role, // <--- ROLE DIKIRIM KE FRONTEND
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan saat login' });
  }
};

// Get User Profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Ambil data termasuk role
    const users = await query(
      'SELECT id, username, email, full_name, role, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
    }

    return res.status(200).json({
      status: 'success',
      data: users[0],
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan' });
  }
};