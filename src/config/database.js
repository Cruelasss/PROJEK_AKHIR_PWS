const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ecometric_api',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const getConnection = async () => {
  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};

const query = async (sql, values) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute(sql, values || []);
    connection.release();
    return rows;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

module.exports = {
  pool,
  getConnection,
  query,
};
