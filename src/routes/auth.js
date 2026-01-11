const express = require('express');
const authController = require('../controllers/authController');
const apiKeyController = require('../controllers/apiKeyController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Auth Routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', verifyToken, authController.getProfile);

// API Key Routes (Protected)
router.post('/api-keys', verifyToken, apiKeyController.createApiKey);
router.get('/api-keys', verifyToken, apiKeyController.getApiKeys);
router.put('/api-keys/:apiKeyId/revoke', verifyToken, apiKeyController.revokeApiKey);
router.put('/api-keys/:apiKeyId/restore', verifyToken, apiKeyController.restoreApiKey);
router.delete('/api-keys/:apiKeyId', verifyToken, apiKeyController.deleteApiKey);

module.exports = router;
