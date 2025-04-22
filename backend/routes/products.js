const express = require('express');
const db = require('../config/db');

const router = express.Router();

// Ruta para obtener todos los productos con el nombre de la categoría
router.get('/', (req, res) => {
  const query = `
    SELECT 
      products.id, 
      products.name, 
      products.description, 
      products.price, 
      products.stock, 
      products.image, 
      products.createdAt, 
      categories.name AS category
    FROM products
    LEFT JOIN categories ON products.categoryId = categories.id
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener los productos:', err);
      res.status(500).json({ error: 'Error al obtener los productos' });
    } else {
      res.json(results);
    }
  });
});

module.exports = router;