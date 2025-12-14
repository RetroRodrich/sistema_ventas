/**
 * Controlador de Productos
 * Maneja toda la lógica de negocio relacionada con productos y lotes
 */

const db = require('../config/db');

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
 * Query base para obtener productos con información completa
 */
const PRODUCT_SELECT_QUERY = `
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
`;

// ============================================================================
// CONTROLADORES DE PRODUCTOS
// ============================================================================

/**
 * Obtener productos con stock bajo
 */
const getLowStock = async (req, res) => {
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
  
  const results = await executeQuery(query);
  res.json(results);
};

/**
 * Obtener todos los productos
 */
const getAllProducts = async (req, res) => {
  const query = `${PRODUCT_SELECT_QUERY} WHERE p.isActive = 1 GROUP BY p.id`;
  const results = await executeQuery(query);
  res.json(results);
};

/**
 * Obtener un producto por ID
 */
const getProductById = async (req, res) => {
  const { id } = req.params;
  const query = `${PRODUCT_SELECT_QUERY} WHERE p.id = ? GROUP BY p.id`;
  
  const results = await executeQuery(query, [id]);
  
  if (results.length === 0) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  
  res.json(results[0]);
};

/**
 * Crear un producto nuevo con su lote inicial
 */
const createProduct = (io) => async (req, res) => {
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

  // Insertar producto
  const productQuery = `
    INSERT INTO products (name, description, price, categoryId, image, brand, barcode, cost, minStock, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `;
  const result = await executeQuery(productQuery, [name, description, price, categoryId, image, brand, barcode, cost, minStock]);
  const productId = result.insertId;

  // Insertar lote inicial
  const batchQuery = `
    INSERT INTO product_batches (productId, batch, expirationDate, stock, createdAt)
    VALUES (?, ?, ?, ?, NOW())
  `;
  await executeQuery(batchQuery, [productId, batch, expirationDate || null, stock]);

  // Obtener el producto creado
  const selectQuery = `${PRODUCT_SELECT_QUERY} WHERE p.id = ? GROUP BY p.id`;
  const rows = await executeQuery(selectQuery, [productId]);

  // Emitir evento de stock cambiado
  if (io) io.emit('stockChanged');
  
  res.status(201).json(rows[0]);
};

/**
 * Actualizar un producto existente
 */
const updateProduct = (io) => async (req, res) => {
  const { id } = req.params;
  let { name, description, price, categoryId, image, brand, barcode, cost, minStock } = req.body;

  // Normalización de campos
  description = description ?? '';
  image = image ?? '';
  brand = brand ?? '';
  barcode = (!barcode || barcode.trim() === '') ? null : barcode;
  cost = (cost === '' || cost === undefined || cost === null) ? null : Number(cost);
  minStock = (minStock === '' || minStock === undefined || minStock === null) ? null : Number(minStock);

  // Validación
  if (!name || !price || !categoryId) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  const query = `
    UPDATE products
    SET name = ?, description = ?, price = ?, categoryId = ?, image = ?, brand = ?, barcode = ?, cost = ?, minStock = ?
    WHERE id = ?
  `;
  const result = await executeQuery(query, [name, description, price, categoryId, image, brand, barcode, cost, minStock, id]);

  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  // Obtener producto actualizado
  const selectQuery = `${PRODUCT_SELECT_QUERY} WHERE p.id = ? GROUP BY p.id`;
  const rows = await executeQuery(selectQuery, [id]);

  if (io) io.emit('stockChanged');
  
  res.status(200).json(rows[0]);
};

/**
 * Eliminar un producto
 */
const deleteProduct = (io) => async (req, res) => {
  const { id } = req.params;
  
  // Eliminar lotes primero (clave foránea)
  await executeQuery('DELETE FROM product_batches WHERE productId = ?', [id]);

  // Eliminar producto
  const result = await executeQuery('DELETE FROM products WHERE id = ?', [id]);

  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  if (io) io.emit('stockChanged');
  
  res.json({ message: 'Producto eliminado correctamente' });
};

/**
 * Buscar productos por nombre
 */
const searchProducts = async (req, res) => {
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
  
  const results = await executeQuery(query, [`%${q}%`]);
  res.json(results);
};

/**
 * Obtener categorías
 */
const getCategories = async (req, res) => {
  const results = await executeQuery('SELECT id, name FROM categories');
  res.json(results);
};

// ============================================================================
// CONTROLADORES DE LOTES
// ============================================================================

/**
 * Obtener lotes de un producto
 */
const getProductBatches = async (req, res) => {
  const { id } = req.params;
  const results = await executeQuery('SELECT * FROM product_batches WHERE productId = ?', [id]);
  res.json(results);
};

/**
 * Agregar lote a un producto
 */
const addBatch = async (req, res) => {
  const { id } = req.params;
  const { batch, expirationDate, stock } = req.body;
  
  if (!batch || !stock) {
    return res.status(400).json({ error: 'Lote y stock son requeridos' });
  }
  
  const query = `
    INSERT INTO product_batches (productId, batch, expirationDate, stock, createdAt)
    VALUES (?, ?, ?, ?, NOW())
  `;
  const result = await executeQuery(query, [id, batch, expirationDate || null, stock]);
  
  const rows = await executeQuery('SELECT * FROM product_batches WHERE id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
};

/**
 * Actualizar un lote
 */
const updateBatch = async (req, res) => {
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
  const result = await executeQuery(query, [batch, expirationDate || null, stock, batchId]);

  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'Lote no encontrado' });
  }

  res.status(200).json({ message: 'Lote actualizado correctamente' });
};

/**
 * Eliminar un lote
 */
const deleteBatch = async (req, res) => {
  const { batchId } = req.params;
  
  // Verificar ventas asociadas
  const salesResults = await executeQuery(
    'SELECT COUNT(*) AS count FROM saledetails WHERE batchId = ?', 
    [batchId]
  );

  if (salesResults[0].count > 0) {
    return res.status(400).json({ error: 'No se puede eliminar el lote porque tiene ventas asociadas' });
  }

  const result = await executeQuery('DELETE FROM product_batches WHERE id = ?', [batchId]);

  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'Lote no encontrado' });
  }

  res.json({ message: 'Lote eliminado correctamente' });
};

module.exports = {
  // Productos
  getLowStock,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getCategories,
  // Lotes
  getProductBatches,
  addBatch,
  updateBatch,
  deleteBatch
};
