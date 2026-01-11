const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Middleware Global
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 2. Import Routes
const currencyRoutes = require('./src/routes/currency');
const indicatorsRoutes = require('./src/routes/indicators');
const docsRoutes = require('./src/routes/docs');
const authRoutes = require('./src/routes/auth');
const adminRoutes = require('./src/routes/admin'); // Tambahan rute Admin

// 3. API Routes Mapping
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes); // Proteksi Admin ada di dalam file ini
app.use('/api/currencies', currencyRoutes);
app.use('/api/indicators', indicatorsRoutes);
app.use('/docs', docsRoutes);

// 4. Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'EcoMetric API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 5. Home & Admin Dashboard Route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/admin', (req, res) => {
  res.sendFile(__dirname + '/public/admin.html');
});

// 6. 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// 7. Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 8. Start Server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════╗
║     EcoMetric API v1.0             ║
║     Admin & Currency Services      ║
║     http://localhost:${PORT}        ║
╚════════════════════════════════════╝
  `);
});

module.exports = app;