/**
 * Controlador de Ventas
 * Maneja toda la lógica de negocio de ventas
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
 * Crear una nueva venta
 */
const createSale = (io) => async (req, res) => {
  const { userId, customer_name, customer_dni, total, igv, items, status } = req.body;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No sale items provided' });
  }
  
  const saleStatus = status === 'pagada' ? 'pagada' : 'pendiente';

  db.getConnection(async (err, connection) => {
    if (err) return res.status(500).json({ error: 'Error obteniendo conexión' });

    try {
      await connection.promise().beginTransaction();

      // 1. Insertar venta
      const [saleResult] = await connection.promise().query(
        `INSERT INTO sales (userId, createdAt, status, customer_name, customer_dni, total, igv)
         VALUES (?, NOW(), ?, ?, ?, ?, ?)`,
        [userId, saleStatus, customer_name || 'General public', customer_dni || '', total, igv]
      );
      const saleId = saleResult.insertId;
      let saleDetails = [];

      // 2. Descontar stock de lotes (FEFO)
      for (const item of items) {
        let qtyToSell = item.quantity;
        const [batches] = await connection.promise().query(
          `SELECT id, stock FROM product_batches
           WHERE productId = ? AND stock > 0
           ORDER BY (CASE WHEN expirationDate IS NULL THEN 1 ELSE 0 END), expirationDate ASC, id ASC`,
          [item.id]
        );
        
        for (const batch of batches) {
          if (qtyToSell <= 0) break;
          const takeQty = Math.min(batch.stock, qtyToSell);
          await connection.promise().query(
            `UPDATE product_batches SET stock = stock - ? WHERE id = ?`,
            [takeQty, batch.id]
          );
          saleDetails.push([
            saleId,
            item.id,
            batch.id,
            takeQty,
            item.price,
            (item.price * takeQty)
          ]);
          qtyToSell -= takeQty;
        }
        
        if (qtyToSell > 0) throw new Error('Stock insuficiente para el producto');
      }

      // 3. Insertar detalles
      await connection.promise().query(
        `INSERT INTO saledetails (saleId, productId, batchId, quantity, price, subtotal) VALUES ?`,
        [saleDetails]
      );

      await connection.promise().commit();
      connection.release();
      
      if (io) io.emit('stockChanged');
      if (io) io.emit('venta_actualizada', { tipo: 'nueva', saleId });
      
      res.status(201).json({ message: 'Venta registrada correctamente' });
    } catch (e) {
      await connection.promise().rollback();
      connection.release();
      res.status(500).json({ error: e.message || 'Error procesando venta' });
    }
  });
};

/**
 * Obtener todas las ventas con filtros
 */
const getAllSales = async (req, res) => {
  const { filter, from, to } = req.query;
  let query = `
    SELECT s.id, s.userId, u.name AS user_name, s.createdAt, s.status, 
           s.customer_name, s.customer_dni, s.total, s.igv
    FROM sales s
    JOIN users u ON s.userId = u.id
  `;
  const params = [];

  // Usar zona horaria de Perú (UTC-5) para todas las consultas de fecha
  if (filter === "hoy") {
    query += " WHERE DATE(CONVERT_TZ(s.createdAt, '+00:00', '-05:00')) = DATE(CONVERT_TZ(NOW(), '+00:00', '-05:00'))";
  } else if (filter === "mes") {
    query += " WHERE YEAR(CONVERT_TZ(s.createdAt, '+00:00', '-05:00')) = YEAR(CONVERT_TZ(NOW(), '+00:00', '-05:00')) AND MONTH(CONVERT_TZ(s.createdAt, '+00:00', '-05:00')) = MONTH(CONVERT_TZ(NOW(), '+00:00', '-05:00'))";
  } else if (filter === "anio") {
    query += " WHERE YEAR(CONVERT_TZ(s.createdAt, '+00:00', '-05:00')) = YEAR(CONVERT_TZ(NOW(), '+00:00', '-05:00'))";
  } else if (filter === "personalizado" && from && to) {
    query += " WHERE DATE(s.createdAt) BETWEEN ? AND ?";
    params.push(from, to);
  }

  query += " ORDER BY s.createdAt DESC";

  const results = await executeQuery(query, params);
  res.json(results);
};

/**
 * Obtener una venta por ID con detalles
 */
const getSaleById = async (req, res) => {
  const saleId = req.params.id;
  
  const saleQuery = `
    SELECT id, userId, createdAt, status, customer_name, customer_dni, total, igv
    FROM sales WHERE id = ?
  `;
  const detailsQuery = `
    SELECT sd.productId, p.name AS product_name, sd.quantity, sd.price, sd.subtotal
    FROM saledetails sd
    JOIN products p ON sd.productId = p.id
    WHERE sd.saleId = ?
  `;

  const sales = await executeQuery(saleQuery, [saleId]);

  if (sales.length === 0) {
    return res.status(404).json({ error: 'Venta no encontrada' });
  }

  const details = await executeQuery(detailsQuery, [saleId]);
  res.json({ ...sales[0], details });
};

/**
 * Actualizar estado de una venta
 */
const updateSaleStatus = (io) => async (req, res) => {
  const saleId = req.params.id;
  const { status } = req.body;
  const validStatuses = ['pendiente', 'pagada', 'anulada'];
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  if (status === 'anulada') {
    // Obtener detalles para restaurar stock
    const details = await executeQuery(
      'SELECT productId, batchId, quantity FROM saledetails WHERE saleId = ?',
      [saleId]
    );

    // Restaurar stock
    const updates = details.map(item =>
      executeQuery(
        'UPDATE product_batches SET stock = stock + ? WHERE id = ?',
        [item.quantity, item.batchId]
      )
    );
    await Promise.all(updates);

    // Actualizar estado
    const result = await executeQuery(
      'UPDATE sales SET status = ? WHERE id = ?',
      [status, saleId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    if (io) io.emit('stockChanged');
    if (io) io.emit('venta_actualizada', { tipo: 'estado', saleId, status });
    
    res.json({ success: true });
  } else {
    // Solo cambiar estado
    const result = await executeQuery(
      'UPDATE sales SET status = ? WHERE id = ?',
      [status, saleId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    if (io) io.emit('venta_actualizada', { tipo: 'estado', saleId, status });
    res.json({ success: true });
  }
};

module.exports = {
  createSale,
  getAllSales,
  getSaleById,
  updateSaleStatus
};
