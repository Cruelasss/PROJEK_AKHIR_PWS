const express = require('express');
const router = express.Router();

const documentation = {
  title: 'EcoMetric API Documentation',
  version: '1.0.0',
  description: 'Real-time Currency Rates and Macroeconomic Indicators',
  baseUrl: 'http://localhost:3000/api',
  
  endpoints: [
    {
      category: 'Currency Rates',
      endpoints: [
        {
          method: 'GET',
          path: '/currencies/latest',
          description: 'Get latest exchange rates',
          parameters: {
            from: 'Base currency (default: IDR)',
            to: 'Target currency (optional, returns all if not specified)'
          },
          example: '/api/currencies/latest?from=IDR&to=USD'
        },
        {
          method: 'GET',
          path: '/currencies/history',
          description: 'Get historical exchange rates',
          parameters: {
            from: 'Base currency',
            to: 'Target currency',
            days: 'Number of days (1-365, default: 30)'
          },
          example: '/api/currencies/history?from=IDR&to=USD&days=30'
        },
        {
          method: 'GET',
          path: '/currencies/supported',
          description: 'Get list of supported currencies',
          example: '/api/currencies/supported'
        }
      ]
    },
    {
      category: 'Macroeconomic Indicators',
      endpoints: [
        {
          method: 'GET',
          path: '/indicators/latest',
          description: 'Get latest economic indicators',
          parameters: {
            country: 'Country code (optional, returns all if not specified)'
          },
          example: '/api/indicators/latest?country=ID'
        },
        {
          method: 'GET',
          path: '/indicators/search',
          description: 'Search specific indicator',
          parameters: {
            country: 'Country code (required)',
            type: 'Indicator type (optional)'
          },
          example: '/api/indicators/search?country=ID&type=inflation'
        },
        {
          method: 'GET',
          path: '/indicators/countries',
          description: 'Get supported countries and their indicators',
          example: '/api/indicators/countries'
        }
      ]
    }
  ],
  
  supportedCurrencies: ['IDR', 'USD', 'EUR', 'JPY', 'SGD', 'MYR', 'THB'],
  supportedCountries: ['ID', 'US', 'JP'],
  
  responseFormat: 'JSON',
  
  limits: {
    free: {
      requestsPerDay: 1000,
      historicalDays: 30,
      updateFrequency: 'Real-time'
    }
  }
};

router.get('/', (req, res) => {
  res.json(documentation);
});

module.exports = router;
