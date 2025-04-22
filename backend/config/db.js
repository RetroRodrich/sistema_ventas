const mysql = require('mysql2');
const { DB_HOST, DB_DATABASE, DB_PASSWORD, DB_USER } = require('../config');

// Configuración de la conexión
const connection = mysql.createConnection({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_DATABASE,
});

// Conectar a la base de datos
connection.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    return;
  }
  console.log('Conexión exitosa a la base de datos MySQL');
});

module.exports = connection;