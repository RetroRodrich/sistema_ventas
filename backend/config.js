const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5000;
const DB_DATABASE = process.env.DB_DATABASE || 'db_sv';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || 'Aroncito2022.';
const PORT = process.env.PORT || 5000; // Puerto para Express

module.exports = {
  FRONTEND_URL,
  DB_HOST,
  DB_PORT,
  DB_DATABASE,
  DB_USER,
  DB_PASSWORD,
  PORT,
};