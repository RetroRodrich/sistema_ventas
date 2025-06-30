const express = require('express');
const db = require('../config/db');
const router = express.Router();
const { 
  authRequired, 
  readOnlyRateLimit,
  asyncHandler 
} = require('../middleware');

// Obtener todas las categorías (TEMPORALMENTE PÚBLICA para compatibilidad)
router.get('/', readOnlyRateLimit, asyncHandler(async (req, res) => {
  const results = await new Promise((resolve, reject) => {
    db.query('SELECT id, name FROM categories', (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

  res.json(results);
}));

// Ruta protegida para cuando el frontend esté actualizado
router.get('/protected', authRequired, readOnlyRateLimit, asyncHandler(async (req, res) => {
  const results = await new Promise((resolve, reject) => {
    db.query('SELECT id, name FROM categories', (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

  res.json(results);
}));

module.exports = router;