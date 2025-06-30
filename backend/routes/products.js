const express = require('express');
const db = require('../config/db');
const router = express.Router();
const { 
  authRequired, 
  adminRequired,
  validateProductData,
  validateIdParam,
  validateBatchIdParam,
  readOnlyRateLimit,
  asyncHandler 
} = require('../middleware');

/**
 * Obtener productos con stock menor o igual al mínimo
 * ¡IMPORTANTE! Esta ruta debe ir antes de cualquier ruta con /:id
 * TEMPORALMENTE PÚBLICO para compatibilidad con Navbar
 */
router.get('/low-stock', readOnlyRateLimit, asyncHandler(async (req, res) => {
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
  
  const results = await new Promise((resolve, reject) => {
    db.query(query, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
  
  res.json(results);
}));

/**
 * Obtener todos los productos con stock total y nombre de la categoría
 * TEMPORALMENTE PÚBLICO para compatibilidad con frontend existente
 */
router.get('/', readOnlyRateLimit, asyncHandler(async (req, res) => {
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
  
  const results = await new Promise((resolve, reject) => {
    db.query(query, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
  
  res.json(results);
}));

/**
 * Agregar un producto nuevo y su lote inicial
 */
router.post('/', adminRequired, validateProductData, asyncHandler(async (req, res) => {
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

  const result = await new Promise((resolve, reject) => {
    db.query(productQuery, [name, description, price, categoryId, image, brand, barcode, cost, minStock], (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });

  const productId = result.insertId;
  const batchQuery = `
    INSERT INTO product_batches (productId, batch, expirationDate, stock, createdAt)
    VALUES (?, ?, ?, ?, NOW())
  `;

  await new Promise((resolve, reject) => {
    db.query(batchQuery, [productId, batch, expirationDate || null, stock], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

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

  const rows = await new Promise((resolve, reject) => {
    db.query(selectQuery, [productId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  res.status(201).json(rows[0]);
}));

/**
 * Editar un producto existente (solo datos generales)
 */
router.put('/:id', adminRequired, validateProductData, validateIdParam, asyncHandler(async (req, res) => {
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

  const result = await new Promise((resolve, reject) => {
    db.query(query, [name, description, price, categoryId, image, brand, barcode, cost, minStock, id], (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });

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

  const rows = await new Promise((resolve, reject) => {
    db.query(selectQuery, [id], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  res.status(200).json(rows[0]);
}));

/**
 * Eliminar un producto y sus lotes asociados
 */
router.delete('/:id', adminRequired, validateIdParam, asyncHandler(async (req, res) => {
  const productId = req.params.id;
  
  // Eliminar lotes primero (clave foránea)
  await new Promise((resolve, reject) => {
    db.query('DELETE FROM product_batches WHERE productId = ?', [productId], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // Eliminar producto
  const result = await new Promise((resolve, reject) => {
    db.query('DELETE FROM products WHERE id = ?', [productId], (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });

  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  res.json({ message: 'Producto eliminado correctamente' });
}));

/**
 * Obtener lotes de un producto
 * TEMPORALMENTE PÚBLICO para ver detalles en frontend
 */
router.get('/:id/batches', readOnlyRateLimit, validateIdParam, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM product_batches WHERE productId = ?';
  
  const results = await new Promise((resolve, reject) => {
    db.query(query, [id], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
  
  res.json(results);
}));

/**
 * Agregar un lote a un producto existente
 */
router.post('/:id/batches', adminRequired, validateIdParam, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { batch, expirationDate, stock } = req.body;
  
  if (!batch || !stock) {
    return res.status(400).json({ error: 'Lote y stock son requeridos' });
  }
  
  const query = `
    INSERT INTO product_batches (productId, batch, expirationDate, stock, createdAt)
    VALUES (?, ?, ?, ?, NOW())
  `;
  
  const result = await new Promise((resolve, reject) => {
    db.query(query, [id, batch, expirationDate || null, stock], (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });

  // Obtener el lote recién insertado
  const selectQuery = 'SELECT * FROM product_batches WHERE id = ?';
  const rows = await new Promise((resolve, reject) => {
    db.query(selectQuery, [result.insertId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  res.status(201).json(rows[0]);
}));

/**
 * Editar un lote existente
 */
router.put('/batches/:batchId', adminRequired, validateBatchIdParam, asyncHandler(async (req, res) => {
  const { batchId } = req.params;
  const { batch, expirationDate, stock } = req.body;
  
  if (!batch || !stock) {
    return res.status(400).json({ error: 'Lote y stock son requeridos' });
  }
  
  const query = `
    UPDATE product_batches
    SET batch = ?, expirationDate = ?, stock = ?
    WHERE id = ?
  `;
  
  const result = await new Promise((resolve, reject) => {
    db.query(query, [batch, expirationDate || null, stock, batchId], (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });

  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'Lote no encontrado' });
  }

  res.status(200).json({ message: 'Lote actualizado correctamente' });
}));

/**
 * Eliminar un lote (solo si no tiene ventas asociadas)
 */
router.delete('/batches/:batchId', adminRequired, validateBatchIdParam, asyncHandler(async (req, res) => {
  const { batchId } = req.params;
  
  // Verificar si el lote tiene ventas asociadas
  const checkSalesQuery = 'SELECT COUNT(*) AS count FROM saledetails WHERE batchId = ?';
  const salesResults = await new Promise((resolve, reject) => {
    db.query(checkSalesQuery, [batchId], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

  if (salesResults[0].count > 0) {
    return res.status(400).json({ error: 'No se puede eliminar el lote porque tiene ventas asociadas' });
  }

  // Eliminar el lote
  const deleteQuery = 'DELETE FROM product_batches WHERE id = ?';
  const result = await new Promise((resolve, reject) => {
    db.query(deleteQuery, [batchId], (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });

  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'Lote no encontrado' });
  }

  res.json({ message: 'Lote eliminado correctamente' });
}));

/**
 * Buscar productos por nombre (para el buscador del frontend)
 * TEMPORALMENTE PÚBLICO para compatibilidad
 */
router.get('/search', readOnlyRateLimit, asyncHandler(async (req, res) => {
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
  
  const results = await new Promise((resolve, reject) => {
    db.query(query, [`%${q}%`], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

  res.json(results);
}));

/**
 * Obtener todas las categorías
 * TEMPORALMENTE PÚBLICO para compatibilidad
 */
router.get('/categories', readOnlyRateLimit, asyncHandler(async (req, res) => {
  const query = 'SELECT id, name FROM categories';
  
  const results = await new Promise((resolve, reject) => {
    db.query(query, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

  res.json(results);
}));

/**
 * Obtener un producto por ID
 * ¡IMPORTANTE! Esta ruta debe ir después de todas las rutas específicas
 * TEMPORALMENTE PÚBLICO para compatibilidad
 */
router.get('/:id', validateIdParam, asyncHandler(async (req, res) => {
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
  
  const results = await new Promise((resolve, reject) => {
    db.query(query, [id], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

  if (results.length === 0) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  res.json(results[0]);
}));

module.exports = router;