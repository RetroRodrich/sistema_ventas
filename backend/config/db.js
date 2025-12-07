/**
 * Configuración del pool de conexiones MySQL
 * Maneja conexiones de forma eficiente y segura
 */
const mysql = require('mysql2');
const { DB_HOST, DB_PORT, DB_DATABASE, DB_PASSWORD, DB_USER } = require('../config');

// Configuración del pool con mejores prácticas
const poolConfig = {
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  
  // Configuración de conexiones
  waitForConnections: true,
  connectionLimit: 10,        // Límite de conexiones simultáneas
  maxIdle: 5,                 // Máximo de conexiones inactivas
  idleTimeout: 60000,         // Timeout para conexiones inactivas (60s)
  queueLimit: 0,              // Sin límite de cola
  
  // Configuración de timeouts
  connectTimeout: 10000,      // Timeout de conexión (10s)
  
  // SSL para producción
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false }
    : undefined,
    
  // Reconexión automática
  enableKeepAlive: true,
  keepAliveInitialDelay: 30000
};

const pool = mysql.createPool(poolConfig);

// Verificar conexión al iniciar
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Error al conectar a la base de datos:');
    
    switch (err.code) {
      case 'PROTOCOL_CONNECTION_LOST':
        console.error('   Conexión perdida con la base de datos');
        break;
      case 'ER_CON_COUNT_ERROR':
        console.error('   Demasiadas conexiones a la base de datos');
        break;
      case 'ECONNREFUSED':
        console.error('   Conexión rechazada - ¿MySQL está corriendo?');
        break;
      case 'ER_ACCESS_DENIED_ERROR':
        console.error('   Acceso denegado - verifica credenciales');
        break;
      default:
        console.error('   Código:', err.code);
        console.error('   Mensaje:', err.message);
    }
    return;
  }
  
  console.log('✅ Conexión exitosa a MySQL');
  console.log(`   Base de datos: ${DB_DATABASE}`);
  console.log(`   Host: ${DB_HOST}:${DB_PORT}`);
  connection.release();
});

// Manejar errores del pool
pool.on('error', (err) => {
  console.error('Error en el pool de MySQL:', err.code);
  
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Reconectando automáticamente...');
  }
});

// Promisify para usar async/await de forma más limpia
const promisePool = pool.promise();

// Exportar tanto pool como promisePool
module.exports = pool;
module.exports.promise = promisePool;