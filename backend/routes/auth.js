const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro';

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email y contraseña requeridos' });

  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error de servidor' });
    if (results.length === 0)
      return res.status(401).json({ message: 'Usuario no encontrado' });

    const user = results[0];
    // Compara el password hasheado
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) return res.status(500).json({ message: 'Error de servidor' });
      if (!isMatch)
        return res.status(401).json({ message: 'Contraseña incorrecta' });

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
    });
  });
});

// Registro de usuario
router.post('/register', (req, res) => {
  const { name, email, password, role } = req.body;      // <— extrae role
  if (!name || !email || !password || !role)
    return res.status(400).json({ message: 'Todos los campos son requeridos' });

  if (!['admin','employee'].includes(role))              // <— valida role
    return res.status(400).json({ message: 'Role inválido' });

  db.query('SELECT id FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error de servidor' });
    if (results.length)
      return res.status(409).json({ message: 'El email ya está registrado' });

    bcrypt.hash(password, 10, (errHash, hash) => {
      if (errHash) return res.status(500).json({ message: 'Error de servidor' });

      // inserta con el role que llega desde el frontend
      db.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, hash, role],                       // <— usa role dinámico
        (err2, result) => {
          if (err2) return res.status(500).json({ message: 'Error al crear usuario' });

          const userId = result.insertId;
          const token = jwt.sign({ id: userId, email, role }, JWT_SECRET, { expiresIn: '8h' });
          res.status(201).json({
            token,
            user: { id: userId, name, email, role }
          });
        }
      );
    });
  });
});

module.exports = router;