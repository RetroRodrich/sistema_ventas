const express = require('express');
const db = require('../config/db');
const router = express.Router();

// Obtener todas las categorías
router.get('/', (req, res) => {
  db.query('SELECT id, name FROM categories', (err, results) => {
    if (err) {
      console.error('Error al obtener las categorías:', err);
      res.status(500).json({ error: 'Error al obtener las categorías' });
    } else {
      res.json(results);
    }
  });
});

module.exports = router;