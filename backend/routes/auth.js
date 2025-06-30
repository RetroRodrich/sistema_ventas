const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { loginRateLimit, smartLoginRateLimit, validateUserData, asyncHandler } = require('../middleware');

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro';

router.post('/login', smartLoginRateLimit.checkLimit, validateUserData, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Buscar usuario en la base de datos
  const results = await new Promise((resolve, reject) => {
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

  if (results.length === 0) {
    // Reportar intento fallido
    smartLoginRateLimit.reportFailedAttempt(req);
    return res.status(401).json({ message: 'Usuario no encontrado' });
  }

  const user = results[0];
  
  // Verificar contraseña
  const isMatch = await bcrypt.compare(password, user.password);
  
  if (!isMatch) {
    // Reportar intento fallido
    smartLoginRateLimit.reportFailedAttempt(req);
    return res.status(401).json({ message: 'Contraseña incorrecta' });
  }

  // Login exitoso - limpiar intentos fallidos
  smartLoginRateLimit.clearAttempts(req);
  
  // Genera un token JWT
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
  
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}));

// Registro de usuario
router.post('/register', loginRateLimit, validateUserData, asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  
  // Verificar si el email ya existe
  const existingUser = await new Promise((resolve, reject) => {
    db.query('SELECT id FROM users WHERE email = ?', [email], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

  if (existingUser.length > 0) {
    return res.status(409).json({ message: 'El email ya está registrado' });
  }

  // Hashear la contraseña
  const hash = await bcrypt.hash(password, 10);

  // Insertar nuevo usuario
  const result = await new Promise((resolve, reject) => {
    db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hash, role],
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });

  const userId = result.insertId;
  const token = jwt.sign({ id: userId, email, role }, JWT_SECRET, { expiresIn: '8h' });
  
  res.status(201).json({
    token,
    user: { id: userId, name, email, role }
  });
}));

module.exports = router;