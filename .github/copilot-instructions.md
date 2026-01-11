# EcoMetric API - Development Instructions

## Project Overview
EcoMetric API: Penyedia Data Real-time Kurs Mata Uang dan Indikator Ekonomi Makro

**Fokus**: Single Purpose - Economic & Currency Data Platform (seperti struktur NewsData.io tapi spesifik untuk data ekonomi)

## Current Status
✅ Project initialized with focused architecture
- Real-time currency exchange rates
- Macroeconomic indicators (inflation, GDP, unemployment, etc.)
- Historical data support (up to 365 days)
- Web dashboard for testing
- Clean, focused codebase

## Folder Structure
```
ecometric-api/
├── server.js
├── package.json
├── .env.example
├── README.md
├── API_GUIDE.md
│
├── src/
│   ├── controllers/
│   │   ├── currencyController.js
│   │   └── indicatorsController.js
│   │
│   ├── routes/
│   │   ├── currency.js
│   │   ├── indicators.js
│   │   └── docs.js
│   │
│   └── data/
│       └── mockData.js
│
└── public/
    ├── index.html
    ├── css/style.css
    └── js/main.js
```

## API Endpoints

### Currency Rates API ✅
- `GET /api/currencies/latest` - Latest exchange rates
- `GET /api/currencies/history` - Historical rates (1-365 days)
- `GET /api/currencies/supported` - Supported currencies list
- No authentication required
- Supported: IDR, USD, EUR, JPY, SGD, MYR, THB

### Economic Indicators API ✅
- `GET /api/indicators/latest` - Latest economic data
- `GET /api/indicators/search` - Search by country & type
- `GET /api/indicators/countries` - Supported countries list
- No authentication required
- Supported countries: ID, US, JP (easily expandable)

## Next Steps (Enhancements)

### Phase 2: Database Integration
- [ ] Connect to MongoDB/MySQL
- [ ] Persistent data storage
- [ ] User & API key management
- [ ] Historical data archiving

### Phase 3: Real Data Integration
- [ ] Connect to actual currency API sources
- [ ] Integrate economic data from World Bank/IMF
- [ ] WebSocket for real-time updates
- [ ] Caching layer (Redis)

### Phase 4: Advanced Features
- [ ] Rate limiting & API key throttling
- [ ] Advanced filtering & search
- [ ] Data export (CSV/Excel)
- [ ] Analytics dashboard
- [ ] Price alerts & notifications
- [ ] Country & currency comparison

### Phase 5: DevOps
- [ ] Docker containerization
- [ ] CI/CD pipeline
- [ ] Unit tests (Jest)
- [ ] Swagger API documentation
- [ ] Performance monitoring
- [ ] Cloud deployment

## Testing

### Browser Testing
1. Open http://localhost:3000
2. Use web dashboard to test endpoints

### Terminal Testing
See TESTING_GUIDE.md for curl commands and examples

### For Adding New Features
1. Create controller in `src/controllers/`
2. Create route in `src/routes/`
3. Import route in `server.js`
4. Test via dashboard or curl

## Development Tips

1. **Auto-reload enabled**: Changes to files automatically restart server
2. **Default test data**: API keys and accounts are in-memory
3. **Error handling**: Comprehensive error responses with proper HTTP status codes
4. **Rate limiting**: Active on protected endpoints
5. **CORS enabled**: Cross-origin requests allowed

## Running Commands

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start

# Install new packages
npm install <package-name>
```

## Accessing Services

- **Dashboard**: http://localhost:3000
- **API Base**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health
- **Documentation**: /docs endpoint

---

**Last Updated**: January 6, 2026
**Version**: 1.0.0  
**Environment**: Development
**Focus**: Single Purpose - Economic Data Platform
