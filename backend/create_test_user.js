const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  try {
    // Hash de la contraseña 'admin123'
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Crear usuario de prueba
    return new Promise((resolve, reject) => {
      // Primero verificar si ya existe
      db.query('SELECT id FROM users WHERE email = ?', ['admin@test.com'], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (results.length > 0) {
          console.log('✅ Usuario admin@test.com ya existe');
          resolve();
          return;
        }
        
        // Crear el usuario
        db.query(
          'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', 
          ['Admin Test', 'admin@test.com', hashedPassword, 'admin'],
          (err, result) => {
            if (err) {
              reject(err);
              return;
            }
            console.log('✅ Usuario admin@test.com creado con password: admin123');
            resolve();
          }
        );
      });
    });
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

createTestUser().then(() => {
  console.log('Done!');
  process.exit();
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
