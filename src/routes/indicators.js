const express = require('express');
const router = express.Router();
const { verifyApiKey } = require('../middleware/auth');
const {
  getLatestIndicators,
  searchIndicators,
  getSupportedCountries
} = require('../controllers/indicatorsController');

// All indicator endpoints require API key
router.get('/latest', verifyApiKey, getLatestIndicators);
router.get('/search', verifyApiKey, searchIndicators);
router.get('/countries', verifyApiKey, getSupportedCountries);

module.exports = router;
