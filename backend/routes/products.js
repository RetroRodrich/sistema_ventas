const express = require('express');
const db = require('../config/db');
const router = express.Router();

/**
 * Obtener todos los productos con el nombre de la categoría
 */
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
      products.categoryId,
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

/**
 * Agregar un producto nuevo
 */
router.post('/', (req, res) => {
  const { name, description, price, stock, categoryId, image } = req.body;

  // Validación de campos requeridos
  if (!name || !price || !stock || !categoryId) {
    return res.status(400).json({ error: 'Todos los campos requeridos deben estar completos' });
  }

  const query = `
    INSERT INTO products (name, description, price, stock, categoryId, image, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, NOW())
  `;

  db.query(query, [name, description, price, stock, categoryId, image], (err, result) => {
    if (err) {
      console.error('Error al agregar el producto:', err);
      res.status(500).json({ error: 'Error al agregar el producto' });
    } else {
      // Consultar el producto recién creado para devolverlo completo (incluyendo la categoría)
      const newProductId = result.insertId;
      const selectQuery = `
        SELECT 
          products.id, 
          products.name, 
          products.description, 
          products.price, 
          products.stock, 
          products.image, 
          products.createdAt, 
          products.categoryId,
          categories.name AS category
        FROM products
        LEFT JOIN categories ON products.categoryId = categories.id
        WHERE products.id = ?
      `;
      db.query(selectQuery, [newProductId], (err, rows) => {
        if (err) {
          console.error('Error al obtener el producto recién creado:', err);
          res.status(500).json({ error: 'Error al obtener el producto recién creado' });
        } else {
          res.status(201).json(rows[0]);
        }
      });
    }
  });
});

/**
 * Eliminar un producto por ID
 */
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM products WHERE id = ?';

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error al eliminar el producto:', err);
      res.status(500).json({ error: 'Error al eliminar el producto' });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Producto no encontrado' });
    } else {
      res.status(200).json({ message: 'Producto eliminado correctamente' });
    }
  });
});

/**
 * Editar un producto existente
 */
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, categoryId, image } = req.body;
  const query = `
    UPDATE products
    SET name = ?, description = ?, price = ?, stock = ?, categoryId = ?, image = ?
    WHERE id = ?
  `;

  db.query(query, [name, description, price, stock, categoryId, image, id], (err, result) => {
    if (err) {
      console.error('Error al editar el producto:', err);
      res.status(500).json({ error: 'Error al editar el producto' });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Producto no encontrado' });
    } else {
      // Consultar el producto actualizado para devolverlo completo (incluyendo la categoría)
      const selectQuery = `
        SELECT 
          products.id, 
          products.name, 
          products.description, 
          products.price, 
          products.stock, 
          products.image, 
          products.createdAt, 
          products.categoryId,
          categories.name AS category
        FROM products
        LEFT JOIN categories ON products.categoryId = categories.id
        WHERE products.id = ?
      `;
      db.query(selectQuery, [id], (err, rows) => {
        if (err) {
          console.error('Error al obtener el producto actualizado:', err);
          res.status(500).json({ error: 'Error al obtener el producto actualizado' });
        } else {
          res.status(200).json(rows[0]);
        }
      });
    }
  });
});

module.exports = router;