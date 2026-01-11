const {
  getLatestIndicatorsFromAPI,
  searchIndicatorsFromAPI,
  getSupportedCountriesFromAPI
} = require('../services/indicatorsService');

// Get Latest Indicators (from real API)
const getLatestIndicators = async (req, res) => {
  try {
    const { country = 'IDN' } = req.query;
    const result = await getLatestIndicatorsFromAPI(country);

    res.json({
      country: result.country,
      indicators: result.indicators,
      timestamp: result.timestamp,
      source: result.source,
      note: result.source === 'mock-data' ? 'Using mock data - World Bank API unavailable' : 'Real-time World Bank data'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch indicators',
      message: error.message
    });
  }
};

// Search Indicators (from real API)
const searchIndicators = async (req, res) => {
  try {
    const { country, type } = req.query;

    if (!country) {
      return res.status(400).json({
        error: 'Country parameter is required',
        example: '/api/indicators/search?country=IDN&type=inflation'
      });
    }

    if (!type) {
      return res.status(400).json({
        error: 'Type parameter is required',
        availableTypes: ['inflation', 'gdpGrowth', 'unemployment', 'interestRate', 'tradeBalance']
      });
    }

    const result = await searchIndicatorsFromAPI(country, type);

    res.json({
      country: result.country,
      indicator: result.indicator,
      historicalData: result.historicalData,
      source: result.source,
      timestamp: new Date().toISOString(),
      note: result.source === 'mock-data' ? 'Using mock data - World Bank API unavailable' : 'Real-time World Bank data'
    });
  } catch (error) {
    res.status(400).json({
      error: 'Invalid indicator type or country code',
      message: error.message,
      supportedTypes: ['inflation', 'gdpGrowth', 'unemployment', 'interestRate', 'tradeBalance']
    });
  }
};

// Get Supported Countries (from real API)
const getSupportedCountries = async (req, res) => {
  try {
    const result = await getSupportedCountriesFromAPI();

    res.json({
      total: result.countries.length,
      countries: result.countries,
      source: result.source,
      timestamp: new Date().toISOString(),
      note: result.source === 'mock-data' ? 'Using mock countries' : 'Real-time World Bank countries'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch supported countries',
      message: error.message
    });
  }
};

module.exports = {
  getLatestIndicators,
  searchIndicators,
  getSupportedCountries
};
