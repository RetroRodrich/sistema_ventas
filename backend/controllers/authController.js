/**
 * Controlador de Autenticación
 * Maneja login, registro y validación de usuarios
 */

const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro';

/**
 * Helper para ejecutar queries con promesas
 */
const executeQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(query, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

/**
 * Login de usuario
 */
const login = (smartLoginRateLimit) => async (req, res) => {
  const { email, password } = req.body;

  // Buscar usuario
  const results = await executeQuery(
    'SELECT * FROM users WHERE email = ?', 
    [email]
  );

  if (results.length === 0) {
    smartLoginRateLimit.reportFailedAttempt(req);
    return res.status(401).json({ message: 'Usuario no encontrado' });
  }

  const user = results[0];
  
  // Verificar contraseña
  const isMatch = await bcrypt.compare(password, user.password);
  
  if (!isMatch) {
    smartLoginRateLimit.reportFailedAttempt(req);
    return res.status(401).json({ message: 'Contraseña incorrecta' });
  }

  // Login exitoso
  smartLoginRateLimit.clearAttempts(req);
  
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
};

/**
 * Registro de usuario
 */
const register = async (req, res) => {
  const { name, email, password, role } = req.body;
  
  // Verificar email existente
  const existingUser = await executeQuery(
    'SELECT id FROM users WHERE email = ?', 
    [email]
  );

  if (existingUser.length > 0) {
    return res.status(409).json({ message: 'El email ya está registrado' });
  }

  // Hashear contraseña
  const hash = await bcrypt.hash(password, 10);

  // Insertar usuario
  const result = await executeQuery(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [name, email, hash, role]
  );

  const userId = result.insertId;
  const token = jwt.sign(
    { id: userId, email, role }, 
    JWT_SECRET, 
    { expiresIn: '8h' }
  );
  
  res.status(201).json({
    token,
    user: { id: userId, name, email, role }
  });
};

module.exports = {
  login,
  register
};
