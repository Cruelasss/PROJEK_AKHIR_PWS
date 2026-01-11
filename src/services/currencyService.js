const axios = require('axios');
const { currencyRates, generateHistoricalData } = require('../data/mockData');

// Diganti ke Frankfurter API karena exchangerate.host sekarang wajib API Key
const EXCHANGE_RATE_API = 'https://api.frankfurter.app';

/**
 * Get latest exchange rates from real API
 */
async function getLatestRatesFromAPI(baseCurrency = 'USD') {
  try {
    // Frankfurter menggunakan parameter 'from' sebagai pengganti 'base'
    const response = await axios.get(`${EXCHANGE_RATE_API}/latest`, {
      params: { from: baseCurrency },
      timeout: 5000
    });

    console.log('API Response:', JSON.stringify(response.data, null, 2));

    if (response.data && response.data.rates) {
      return {
        base: response.data.base || baseCurrency,
        timestamp: response.data.date || new Date().toISOString().split('T')[0],
        rates: response.data.rates,
        source: 'frankfurter.app'
      };
    }
  } catch (error) {
    console.error('API Error:', error.message);
    console.log('Falling back to mock data for latest rates');

    const mockData = currencyRates[baseCurrency];
    if (mockData) {
      return {
        base: baseCurrency,
        timestamp: new Date().toISOString().split('T')[0],
        rates: mockData.rates,
        source: 'mock-data'
      };
    }
    throw new Error(`Failed to fetch exchange rates: ${error.message}`);
  }
}

/**
 * Get historical exchange rates (7 days)
 */
async function getHistoricalRatesFromAPI(baseCurrency = 'USD', days = 7) {
  try {
    const historicalData = {};
    const today = new Date();
    
    // Hitung tanggal mulai (7 hari lalu)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - days);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = today.toISOString().split('T')[0];

    // Frankfurter mendukung range tanggal, lebih efisien daripada looping satu-satu
    const response = await axios.get(`${EXCHANGE_RATE_API}/${startDateStr}..${endDateStr}`, {
      params: { from: baseCurrency },
      timeout: 5000
    });

    if (response.data && response.data.rates) {
      return {
        base: baseCurrency,
        historicalData: response.data.rates,
        days,
        source: 'frankfurter.app'
      };
    }
  } catch (error) {
    console.error('API Error for historical rates:', error.message);
    console.log('Falling back to mock data for historical rates');
  }

  // Fallback ke mock data
  const mockHistoricalData = generateHistoricalData(baseCurrency, 'IDR', days);
  const formattedHistoricalData = {};
  mockHistoricalData.forEach(item => {
    formattedHistoricalData[item.date] = {
      [item.to]: parseFloat(item.rate)
    };
  });

  return {
    base: baseCurrency,
    historicalData: formattedHistoricalData,
    days,
    source: 'mock-data'
  };
}

/**
 * Get supported currencies
 */
async function getSupportedCurrenciesFromAPI() {
  try {
    const response = await axios.get(`${EXCHANGE_RATE_API}/currencies`, {
      timeout: 5000
    });

    if (response.data) {
      return {
        currencies: Object.entries(response.data).map(([code, name]) => ({
          code,
          name,
          symbol: getSymbolForCurrency(code)
        })),
        source: 'frankfurter.app'
      };
    }
  } catch (error) {
    console.error('API Error for supported currencies:', error.message);
    console.log('Falling back to mock data for supported currencies');
  }

  const mockCurrencies = Object.keys(currencyRates).map(code => ({
    code,
    name: currencyRates[code].name,
    symbol: currencyRates[code].symbol
  }));

  return {
    currencies: mockCurrencies,
    source: 'mock-data'
  };
}

/**
 * Helper function to get currency symbol
 */
function getSymbolForCurrency(code) {
  const symbols = {
    USD: '$', EUR: '€', GBP: '£', IDR: 'Rp', JPY: '¥',
    SGD: 'S$', MYR: 'RM', THB: '฿', CNY: '¥', INR: '₹',
    KRW: '₩', AUD: 'A$', CAD: 'C$'
  };
  return symbols[code] || code;
}

module.exports = {
  getLatestRatesFromAPI,
  getHistoricalRatesFromAPI,
  getSupportedCurrenciesFromAPI
};