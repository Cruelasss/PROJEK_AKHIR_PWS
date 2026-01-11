const {
  getLatestRatesFromAPI,
  getHistoricalRatesFromAPI,
  getSupportedCurrenciesFromAPI
} = require('../services/currencyService');

// Get Latest Currency Rates (from real API)
const getLatestRates = async (req, res) => {
  try {
    const { from = 'USD', to } = req.query;
    const result = await getLatestRatesFromAPI(from);

    if (to) {
      if (!result.rates[to]) {
        return res.status(404).json({
          error: `Rate for ${to} not available`,
          available: Object.keys(result.rates)
        });
      }

      return res.json({
        base: from,
        target: to,
        rate: result.rates[to],
        timestamp: result.timestamp,
        source: result.source,
        note: result.source === 'mock-data' ? 'Using mock data - API unavailable' : 'Real-time data'
      });
    }

    // Return all rates for a currency
    res.json({
      base: from,
      rates: result.rates,
      timestamp: result.timestamp,
      source: result.source,
      total: Object.keys(result.rates).length,
      note: result.source === 'mock-data' ? 'Using mock data - API unavailable' : 'Real-time data'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch exchange rates',
      message: error.message
    });
  }
};

// Get Historical Rates (from real API)
const getHistoricalRates = async (req, res) => {
  try {
    const { from = 'USD', to = 'IDR', days = 7 } = req.query;
    const result = await getHistoricalRatesFromAPI(from, Math.min(parseInt(days), 30));

    res.json({
      base: from,
      historicalData: result.historicalData,
      days: result.days,
      timestamp: new Date().toISOString(),
      source: result.source,
      note: result.source === 'mock-data' ? 'Using mock data - API unavailable' : 'Real-time data'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch historical rates',
      message: error.message
    });
  }
};

// Get Supported Currencies (from real API)
const getSupportedCurrencies = async (req, res) => {
  try {
    const result = await getSupportedCurrenciesFromAPI();

    res.json({
      total: result.currencies.length,
      currencies: result.currencies,
      source: result.source,
      note: result.source === 'mock-data' ? 'Using mock currencies' : 'Real-time supported currencies'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch supported currencies',
      message: error.message
    });
  }
};

module.exports = {
  getLatestRates,
  getHistoricalRates,
  getSupportedCurrencies
};
