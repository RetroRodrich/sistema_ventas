const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function checkCredentials() {
  return new Promise((resolve, reject) => {
    db.query('SELECT id, email, password FROM users WHERE role = ?', ['admin'], async (err, results) => {
      if (err) {
        console.error('Error:', err);
        reject(err);
        return;
      }

      console.log('Admin users found:', results.length);
      
      for (let user of results) {
        console.log('\n--- User:', user.email, '---');
        
        // Test diferentes contraseñas comunes
        const passwords = ['admin123', 'admin', '123456', 'password'];
        
        for (let pwd of passwords) {
          try {
            const isMatch = await bcrypt.compare(pwd, user.password);
            console.log(`Password '${pwd}' match:`, isMatch);
            if (isMatch) {
              console.log(`✅ FOUND MATCH: ${user.email} / ${pwd}`);
            }
          } catch (error) {
            console.log(`Error checking password '${pwd}':`, error.message);
          }
        }
      }
      
      resolve();
    });
  });
}

checkCredentials().then(() => {
  console.log('\nDone!');
  process.exit();
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
