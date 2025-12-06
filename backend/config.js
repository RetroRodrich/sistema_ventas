// Solo cargar dotenv en desarrollo (no en producción)
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config();
  } catch (err) {
    console.warn('dotenv no está instalado. Usando variables de entorno del sistema.');
  }
}

const FRONTEND_URL = process.env.FRONTEND_URL;
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_DATABASE = process.env.DB_DATABASE;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const PORT = process.env.PORT;
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = {
  FRONTEND_URL,
  DB_HOST,
  DB_PORT,
  DB_DATABASE,
  DB_USER,
  DB_PASSWORD,
  PORT,
  JWT_SECRET
};