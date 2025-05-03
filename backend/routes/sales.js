const express = require('express');
const db = require('../config/db');
const router = express.Router();

router.post('/', (req, res) => {
  const { userId, customer_name, customer_dni, total, igv, items, status } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No sale items provided' });
  }

  // Usa el estado recibido o 'pendiente' por defecto
  const saleStatus = status === 'pagada' ? 'pagada' : 'pendiente';

  const saleQuery = `
    INSERT INTO sales (userId, createdAt, status, customer_name, customer_dni, total, igv)
    VALUES (?, NOW(), ?, ?, ?, ?, ?)
  `;
  db.query(
    saleQuery,
    [
      userId,
      saleStatus,
      customer_name || 'General public',
      customer_dni || '',
      total,
      igv
    ],
    (err, result) => {
      if (err) {
        console.error('Error inserting sale:', err);
        return res.status(500).json({ error: 'Error inserting sale' });
      }
      const saleId = result.insertId;

      // Inserta los detalles de la venta
      const detailsQuery = `
        INSERT INTO saledetails (saleId, productId, quantity, price, subtotal)
        VALUES ?
      `;
      const detailsValues = items.map(item => [
        saleId,
        item.id,
        item.quantity,
        item.price,
        (item.price * item.quantity)
      ]);
      db.query(detailsQuery, [detailsValues], (err2) => {
        if (err2) {
          console.error('Error inserting sale details:', err2);
          return res.status(500).json({ error: 'Error inserting sale details' });
        }
        // Actualiza el stock de los productos
        const stockUpdates = items.map(item =>
          new Promise((resolve, reject) => {
            db.query(
              'UPDATE products SET stock = stock - ? WHERE id = ?',
              [item.quantity, item.id],
              (err3) => (err3 ? reject(err3) : resolve())
            );
          })
        );
        Promise.all(stockUpdates)
          .then(() => res.status(201).json({ message: 'Sale registered successfully' }))
          .catch(err4 => {
            console.error('Error updating stock:', err4);
            res.status(500).json({ error: 'Error updating stock' });
          });
      });
    }
  );
});

// Obtener todas las ventas
router.get('/', (req, res) => {
  const query = `
    SELECT id, userId, createdAt, status, customer_name, customer_dni, total, igv
    FROM sales
    ORDER BY createdAt DESC
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener las ventas:', err);
      return res.status(500).json({ error: 'Error al obtener las ventas' });
    }
    res.json(results);
  });
});

// Obtener una venta y sus detalles
router.get('/:id', (req, res) => {
  const saleId = req.params.id;
  const saleQuery = `
    SELECT id, userId, createdAt, status, customer_name, customer_dni, total, igv
    FROM sales
    WHERE id = ?
  `;
  const detailsQuery = `
    SELECT sd.productId, p.name AS product_name, sd.quantity, sd.price, sd.subtotal
    FROM saledetails sd
    JOIN products p ON sd.productId = p.id
    WHERE sd.saleId = ?
  `;
  db.query(saleQuery, [saleId], (err, sales) => {
    if (err || sales.length === 0) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    db.query(detailsQuery, [saleId], (err2, details) => {
      if (err2) {
        return res.status(500).json({ error: 'Error al obtener detalles' });
      }
      res.json({ ...sales[0], details });
    });
  });
});

router.put('/:id/status', (req, res) => {
  const saleId = req.params.id;
  const { status } = req.body;
  const validStatuses = ['pendiente', 'pagada', 'anulada'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  if (status === 'anulada') {
    // 1. Obtener los detalles de la venta
    const detailsQuery = `
      SELECT productId, quantity FROM saledetails WHERE saleId = ?
    `;
    db.query(detailsQuery, [saleId], (err, details) => {
      if (err) return res.status(500).json({ error: 'Error al obtener detalles' });

      // 2. Retornar stock de cada producto
      const updates = details.map(item =>
        new Promise((resolve, reject) => {
          db.query(
            'UPDATE products SET stock = stock + ? WHERE id = ?',
            [item.quantity, item.productId],
            (err2) => (err2 ? reject(err2) : resolve())
          );
        })
      );

      Promise.all(updates)
        .then(() => {
          // 3. Cambiar estado de la venta
          db.query(
            'UPDATE sales SET status = ? WHERE id = ?',
            [status, saleId],
            (err3, result) => {
              if (err3) return res.status(500).json({ error: 'Error al actualizar estado' });
              if (result.affectedRows === 0) return res.status(404).json({ error: 'Venta no encontrada' });
              res.json({ success: true });
            }
          );
        })
        .catch(() => res.status(500).json({ error: 'Error al actualizar stock' }));
    });
  } else {
    // Solo cambiar estado normalmente
    db.query(
      'UPDATE sales SET status = ? WHERE id = ?',
      [status, saleId],
      (err, result) => {
        if (err) return res.status(500).json({ error: 'Error al actualizar estado' });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Venta no encontrada' });
        res.json({ success: true });
      }
    );
  }
});

module.exports = router;