const express = require('express');
const router = express.Router();
const { verifyApiKey } = require('../middleware/auth');
const {
  getLatestRates,
  getHistoricalRates,
  getSupportedCurrencies
} = require('../controllers/currencyController');

// All currency endpoints require API key
router.get('/latest', verifyApiKey, getLatestRates);
router.get('/history', verifyApiKey, getHistoricalRates);
router.get('/supported', verifyApiKey, getSupportedCurrencies);

module.exports = router;
