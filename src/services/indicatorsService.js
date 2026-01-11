const axios = require('axios');
const { macroIndicators } = require('../data/mockData');

// World Bank Data API - Free, no authentication needed
const WORLD_BANK_API = 'https://api.worldbank.org/v2';

// Indicator codes for World Bank API
const INDICATOR_CODES = {
  inflation: 'FP.CPI.TOTL.ZG', // Inflation, consumer prices (annual %)
  gdpGrowth: 'NY.GDP.MKTP.KD.ZG', // GDP growth (annual %)
  unemployment: 'SL.UEM.TOTL.ZS', // Unemployment, total (% of total labor force)
  interestRate: 'FR.INR.LEND', // Lending interest rate (%)
  tradeBalance: 'NE.RSB.GNFS.CD' // Trade balance (current US$)
};

// Country codes mapping
const COUNTRY_CODES = {
  ID: 'IDN', // Indonesia
  US: 'USA', // United States
  JP: 'JPN', // Japan
  SG: 'SGP', // Singapore
  MY: 'MYS', // Malaysia
  TH: 'THA', // Thailand
  GB: 'GBR', // United Kingdom
  IN: 'IND', // India
  CN: 'CHN' // China
};

/**
 * Get latest economic indicators from World Bank API
 * Falls back to mock data if API is unavailable
 */
async function getLatestIndicatorsFromAPI(countryCode = 'IDN') {
  try {
    const indicators = {};
    let hasData = false;

    // Fetch multiple indicators in parallel
    const indicatorPromises = Object.entries(INDICATOR_CODES).map(([name, code]) =>
      fetchIndicatorData(countryCode, code, name)
    );

    const results = await Promise.all(indicatorPromises);

    results.forEach(result => {
      if (result) {
        indicators[result.name] = result.value;
        hasData = true;
      }
    });

    if (hasData) {
      return {
        country: countryCode,
        timestamp: new Date().toISOString(),
        indicators,
        source: 'worldbank.org'
      };
    }
  } catch (error) {
    throw new Error(`Failed to fetch indicators from API: ${error.message}`);
  }
}

/**
 * Fetch a single indicator from World Bank API
 */
async function fetchIndicatorData(countryCode, indicatorCode, indicatorName) {
  try {
    const response = await axios.get(
      `${WORLD_BANK_API}/country/${countryCode}/indicator/${indicatorCode}`,
      {
        params: {
          format: 'json',
          per_page: 1 // Get latest year only
        },
        timeout: 5000
      }
    );

    if (response.data && response.data[1] && response.data[1].length > 0) {
      const data = response.data[1][0];
      if (data.value) {
        return {
          name: indicatorName,
          value: parseFloat(data.value).toFixed(2),
          year: data.date,
          unit: getIndicatorUnit(indicatorName)
        };
      }
    }
  } catch (error) {
    console.warn(`Could not fetch ${indicatorName} for ${countryCode}`);
  }

  return null;
}

/**
 * Search indicators by country and type
 */
async function searchIndicatorsFromAPI(countryCode, indicatorType) {
  try {
    const indicatorCode = INDICATOR_CODES[indicatorType];
    if (!indicatorCode) {
      throw new Error(`Unknown indicator type: ${indicatorType}`);
    }

    const response = await axios.get(
      `${WORLD_BANK_API}/country/${countryCode}/indicator/${indicatorCode}`,
      {
        params: {
          format: 'json',
          per_page: 5 // Get last 5 years
        },
        timeout: 5000
      }
    );

    if (response.data && response.data[1] && response.data[1].length > 0) {
      const historicalData = response.data[1]
        .filter(d => d.value)
        .map(d => ({
          year: d.date,
          value: parseFloat(d.value).toFixed(2),
          unit: getIndicatorUnit(indicatorType)
        }));

      return {
        country: countryCode,
        indicator: indicatorType,
        historicalData,
        source: 'worldbank.org'
      };
    }
  } catch (error) {
    console.error('API Error for historical indicators:', error.message);
    console.log('Falling back to mock data for historical indicators');
  }

  // Fallback to mock data
  const countryKey = Object.keys(COUNTRY_CODES).find(key => COUNTRY_CODES[key] === countryCode) || 'ID';
  const mockData = macroIndicators[countryKey];

  if (mockData && mockData.indicators[indicatorType]) {
    const indicatorData = mockData.indicators[indicatorType];
    const historicalData = [{
      year: new Date().getFullYear().toString(),
      value: indicatorData.value,
      unit: indicatorData.unit
    }];

    return {
      country: countryCode,
      indicator: indicatorType,
      historicalData,
      source: 'mock-data'
    };
  }

  throw new Error(`Failed to fetch historical indicators from API and no mock data available: ${error ? error.message : 'Unknown error'}`);
}

/**
 * Get supported countries
 */
async function getSupportedCountriesFromAPI() {
  try {
    const response = await axios.get(`${WORLD_BANK_API}/country`, {
      params: {
        format: 'json',
        per_page: 300
      },
      timeout: 5000
    });

    if (response.data && response.data[1]) {
      const countries = response.data[1]
        .filter(c => c.capitalCity && c.region.value !== 'Aggregates')
        .map(c => ({
          code: c.id,
          name: c.name,
          region: c.region.value
        }));

      return {
        countries,
        source: 'worldbank.org'
      };
    }
  } catch (error) {
    console.error('API Error for supported countries:', error.message);
    console.log('Falling back to mock data for supported countries');
  }

  // Fallback to mock data
  const mockCountries = Object.keys(macroIndicators).map(countryKey => ({
    code: COUNTRY_CODES[countryKey] || countryKey,
    name: macroIndicators[countryKey].country,
    region: 'Asia' // Default region for mock data
  }));

  return {
    countries: mockCountries,
    source: 'mock-data'
  };
}



/**
 * Get unit for indicator type
 */
function getIndicatorUnit(indicatorType) {
  const units = {
    inflation: '%',
    gdpGrowth: '%',
    unemployment: '%',
    interestRate: '%',
    tradeBalance: 'USD'
  };
  return units[indicatorType] || '';
}

module.exports = {
  getLatestIndicatorsFromAPI,
  searchIndicatorsFromAPI,
  getSupportedCountriesFromAPI
};
