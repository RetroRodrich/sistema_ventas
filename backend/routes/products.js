const express = require('express');
const db = require('../config/db');
const router = express.Router();

/**
 * Obtener productos con stock menor o igual al mínimo
 * ¡IMPORTANTE! Esta ruta debe ir antes de cualquier ruta con /:id
 */
router.get('/low-stock', (req, res) => {
  const query = `
    SELECT 
      p.id, 
      p.name, 
      IFNULL(SUM(pb.stock), 0) AS stock,
      IFNULL(p.minStock, 0) AS minStock
    FROM products p
    LEFT JOIN product_batches pb ON pb.productId = p.id
    WHERE p.isActive = 1
    GROUP BY p.id
    HAVING stock <= minStock
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener productos con bajo stock:', err);
      return res.status(500).json({ error: 'Error al obtener productos con bajo stock' });
    }
    res.json(results);
  });
});

/**
 * Obtener todos los productos con stock total y nombre de la categoría
 */
router.get('/', (req, res) => {
  const query = `
    SELECT 
      p.id, 
      p.name, 
      p.description, 
      IFNULL(p.price, 0) AS price, 
      p.image, 
      p.createdAt, 
      p.categoryId,
      IFNULL(p.brand, '') AS brand,
      IFNULL(p.barcode, '') AS barcode,
      IFNULL(p.cost, 0) AS cost,
      IFNULL(p.minStock, 0) AS minStock,
      c.name AS category,
      IFNULL(SUM(pb.stock), 0) AS stock
    FROM products p
    LEFT JOIN categories c ON p.categoryId = c.id
    LEFT JOIN product_batches pb ON pb.productId = p.id
    WHERE p.isActive = 1
    GROUP BY p.id
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener los productos:', err);
      return res.status(500).json({ error: 'Error al obtener los productos' });
    }
    res.json(results);
  });
});

/**
 * Agregar un producto nuevo y su lote inicial
 */
router.post('/', (req, res) => {
  let { name, description, price, categoryId, image, brand, barcode, cost, minStock, batch, expirationDate, stock } = req.body;

  // Validación de campos requeridos
  if (!name || !price || !categoryId || !batch || !stock) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  // Normalización de campos opcionales
  description = description ?? '';
  image = image ?? '';
  brand = brand ?? '';
  barcode = (!barcode || barcode.trim() === '') ? null : barcode;
  cost = (cost === '' || cost === undefined || cost === null) ? null : Number(cost);
  minStock = (minStock === '' || minStock === undefined || minStock === null) ? null : Number(minStock);

  const productQuery = `
    INSERT INTO products (name, description, price, categoryId, image, brand, barcode, cost, minStock, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `;
  db.query(productQuery, [name, description, price, categoryId, image, brand, barcode, cost, minStock], (err, result) => {
    if (err) {
      console.error('Error al agregar el producto:', err);
      return res.status(500).json({ error: 'Error al agregar el producto' });
    }
    const productId = result.insertId;
    const batchQuery = `
      INSERT INTO product_batches (productId, batch, expirationDate, stock, createdAt)
      VALUES (?, ?, ?, ?, NOW())
    `;
    db.query(batchQuery, [productId, batch, expirationDate || null, stock], (err2) => {
      if (err2) {
        console.error('Error al agregar el lote:', err2);
        return res.status(500).json({ error: 'Error al agregar el lote' });
      }
      // Obtener el producto recién creado con la categoría y stock
      const selectQuery = `
        SELECT 
          p.id, 
          p.name, 
          p.description, 
          IFNULL(p.price, 0) AS price, 
          p.image, 
          p.createdAt, 
          p.categoryId,
          IFNULL(p.brand, '') AS brand,
          IFNULL(p.barcode, '') AS barcode,
          IFNULL(p.cost, 0) AS cost,
          IFNULL(p.minStock, 0) AS minStock,
          c.name AS category,
          IFNULL(SUM(pb.stock), 0) AS stock
        FROM products p
        LEFT JOIN categories c ON p.categoryId = c.id
        LEFT JOIN product_batches pb ON pb.productId = p.id
        WHERE p.id = ?
        GROUP BY p.id
      `;
      db.query(selectQuery, [productId], (err3, rows) => {
        if (err3) {
          console.error('Error al obtener el producto:', err3);
          return res.status(500).json({ error: 'Error al obtener el producto' });
        }
        res.status(201).json(rows[0]);
      });
    });
  });
});

/**
 * Editar un producto existente (solo datos generales)
 */
router.put('/:id', (req, res) => {
  const { id } = req.params;
  let { name, description, price, categoryId, image, brand, barcode, cost, minStock } = req.body;

  // Normaliza campos opcionales y numéricos
  description = description ?? '';
  image = image ?? '';
  brand = brand ?? '';
  barcode = (!barcode || barcode.trim() === '') ? null : barcode;
  cost = (cost === '' || cost === undefined || cost === null) ? null : Number(cost);
  minStock = (minStock === '' || minStock === undefined || minStock === null) ? null : Number(minStock);

  // Validación de campos requeridos
  if (!name || !price || !categoryId) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  const query = `
    UPDATE products
    SET name = ?, description = ?, price = ?, categoryId = ?, image = ?, brand = ?, barcode = ?, cost = ?, minStock = ?
    WHERE id = ?
  `;
  db.query(
    query,
    [name, description, price, categoryId, image, brand, barcode, cost, minStock, id],
    (err, result) => {
      if (err) {
        console.error('Error al editar el producto:', err);
        return res.status(500).json({ error: 'Error al editar el producto' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }
      // Retorna el producto actualizado
      const selectQuery = `
        SELECT 
          p.id, 
          p.name, 
          p.description, 
          IFNULL(p.price, 0) AS price, 
          p.image, 
          p.createdAt, 
          p.categoryId,
          IFNULL(p.brand, '') AS brand,
          IFNULL(p.barcode, '') AS barcode,
          IFNULL(p.cost, 0) AS cost,
          IFNULL(p.minStock, 0) AS minStock,
          c.name AS category,
          IFNULL(SUM(pb.stock), 0) AS stock
        FROM products p
        LEFT JOIN categories c ON p.categoryId = c.id
        LEFT JOIN product_batches pb ON pb.productId = p.id
        WHERE p.id = ?
        GROUP BY p.id
      `;
      db.query(selectQuery, [id], (err2, rows) => {
        if (err2) {
          console.error('Error al obtener el producto actualizado:', err2);
          return res.status(500).json({ error: 'Error al obtener el producto actualizado' });
        }
        res.status(200).json(rows[0]);
      });
    }
  );
});

/**
 * Eliminar un producto y sus lotes asociados
 */
router.delete('/:id', (req, res) => {
  const productId = req.params.id;
  db.query('DELETE FROM product_batches WHERE productId = ?', [productId], (err) => {
    if (err) return res.status(500).json({ error: 'Error al eliminar lotes del producto' });
    db.query('DELETE FROM products WHERE id = ?', [productId], (err2, result) => {
      if (err2) return res.status(500).json({ error: 'Error al eliminar el producto' });
      res.json({ message: 'Producto eliminado correctamente' });
    });
  });
});

/**
 * Obtener lotes de un producto
 */
router.get('/:id/batches', (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM product_batches WHERE productId = ?';
  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener los lotes' });
    res.json(results);
  });
});

/**
 * Agregar un lote a un producto existente
 */
router.post('/:id/batches', (req, res) => {
  const { id } = req.params;
  const { batch, expirationDate, stock } = req.body;
  if (!batch || !stock) {
    return res.status(400).json({ error: 'Lote y stock son requeridos' });
  }
  const query = `
    INSERT INTO product_batches (productId, batch, expirationDate, stock, createdAt)
    VALUES (?, ?, ?, ?, NOW())
  `;
  db.query(query, [id, batch, expirationDate || null, stock], function (err, result) {
    if (err) {
      console.error('Error al agregar el lote:', err);
      return res.status(500).json({ error: 'Error al agregar el lote' });
    }
    // Obtener el lote recién insertado
    const selectQuery = 'SELECT * FROM product_batches WHERE id = ?';
    db.query(selectQuery, [result.insertId], (err2, rows) => {
      if (err2) {
        console.error('Error al obtener el lote:', err2);
        return res.status(500).json({ error: 'Error al obtener el lote' });
      }
      res.status(201).json(rows[0]);
    });
  });
});

/**
 * Editar un lote existente
 */
router.put('/batches/:batchId', (req, res) => {
  const { batchId } = req.params;
  const { batch, expirationDate, stock } = req.body;
  const query = `
    UPDATE product_batches
    SET batch = ?, expirationDate = ?, stock = ?
    WHERE id = ?
  `;
  db.query(query, [batch, expirationDate || null, stock, batchId], (err, result) => {
    if (err) {
      console.error('Error al editar el lote:', err);
      return res.status(500).json({ error: 'Error al editar el lote' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Lote no encontrado' });
    }
    res.status(200).json({ message: 'Lote actualizado correctamente' });
  });
});

/**
 * Eliminar un lote (solo si no tiene ventas asociadas)
 */
router.delete('/batches/:batchId', (req, res) => {
  const { batchId } = req.params;
  const checkSalesQuery = 'SELECT COUNT(*) AS count FROM saledetails WHERE batchId = ?';
  db.query(checkSalesQuery, [batchId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al verificar ventas del lote' });
    if (results[0].count > 0) {
      return res.status(400).json({ error: 'No se puede eliminar el lote porque tiene ventas asociadas' });
    }
    const deleteQuery = 'DELETE FROM product_batches WHERE id = ?';
    db.query(deleteQuery, [batchId], (err2) => {
      if (err2) return res.status(500).json({ error: 'Error al eliminar el lote' });
      res.json({ message: 'Lote eliminado correctamente' });
    });
  });
});

/**
 * Buscar productos por nombre (para el buscador del frontend)
 */
router.get('/search', (req, res) => {
  const q = req.query.q || '';
  const query = `
    SELECT 
      p.id, 
      p.name, 
      IFNULL(p.price, 0) AS price, 
      IFNULL(SUM(pb.stock), 0) AS stock
    FROM products p
    LEFT JOIN product_batches pb ON pb.productId = p.id
    WHERE p.name LIKE ? AND p.isActive = 1
    GROUP BY p.id
    LIMIT 10
  `;
  db.query(query, [`%${q}%`], (err, results) => {
    if (err) {
      console.error('Error al buscar productos:', err);
      return res.status(500).json({ error: 'Error al buscar productos' });
    }
    res.json(results);
  });
});

/**
 * Obtener todas las categorías
 */
router.get('/categories', (req, res) => {
  const query = 'SELECT id, name FROM categories';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener las categorías:', err);
      return res.status(500).json({ error: 'Error al obtener las categorías' });
    }
    res.json(results);
  });
});

/**
 * Obtener un producto por ID
 * ¡IMPORTANTE! Esta ruta debe ir después de todas las rutas específicas
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT 
      p.id, 
      p.name, 
      p.description, 
      IFNULL(p.price, 0) AS price, 
      p.image, 
      p.createdAt, 
      p.categoryId,
      IFNULL(p.brand, '') AS brand,
      IFNULL(p.barcode, '') AS barcode,
      IFNULL(p.cost, 0) AS cost,
      IFNULL(p.minStock, 0) AS minStock,
      c.name AS category,
      IFNULL(SUM(pb.stock), 0) AS stock
    FROM products p
    LEFT JOIN categories c ON p.categoryId = c.id
    LEFT JOIN product_batches pb ON pb.productId = p.id
    WHERE p.id = ?
    GROUP BY p.id
  `;
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error al obtener el producto:', err);
      return res.status(500).json({ error: 'Error al obtener el producto' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(results[0]);
  });
});

module.exports = router;