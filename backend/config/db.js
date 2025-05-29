// Importa la librería mysql2 para manejar conexiones con MySQL
const mysql = require('mysql2');
// Importa las variables de entorno/configuración necesarias para la conexión
const { DB_HOST, DB_PORT, DB_DATABASE, DB_PASSWORD, DB_USER } = require('../config');

// Crea un pool de conexiones a la base de datos MySQL.
// El pool permite reutilizar conexiones y manejar múltiples solicitudes concurrentes de manera eficiente.
const pool = mysql.createPool({
  host: DB_HOST,           // Dirección del servidor MySQL
  port: DB_PORT,           // Puerto del servidor MySQL
  user: DB_USER,           // Usuario de la base de datos
  password: DB_PASSWORD,   // Contraseña del usuario
  database: DB_DATABASE,   // Nombre de la base de datos
  waitForConnections: true, // Espera si todas las conexiones están ocupadas
  connectionLimit: 10,      // Máximo de conexiones simultáneas en el pool
  queueLimit: 0             // Número máximo de solicitudes en cola (0 = sin límite)
});

// Prueba la conexión al pool al iniciar la aplicación.
// Si la conexión es exitosa, muestra un mensaje en consola.
// Si ocurre un error, lo muestra en consola y no continúa.
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    return;
  }
  console.log('Conexión exitosa a la base de datos MySQL');
  // Libera la conexión para que pueda ser reutilizada por el pool.
  connection.release();
});

// Exporta el pool para que pueda ser utilizado en otras partes de la aplicación (rutas, modelos, etc.)
module.exports = pool;