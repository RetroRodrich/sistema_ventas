const express = require('express');
const db = require('../config/db');
const router = express.Router();
const { 
  authRequired, 
  readOnlyRateLimit,
  asyncHandler 
} = require('../middleware');

// Endpoint de resumen para dashboard (agrupación flexible)
// TEMPORALMENTE PÚBLICO para compatibilidad
router.get('/summary', readOnlyRateLimit, asyncHandler(async (req, res) => {
  const { group = 'mes', start, end } = req.query;

  let where = "WHERE status = 'pagada'";
  const params = [];
  const now = new Date();
  const currentYear = now.getFullYear();

  if (!start && !end) {
    where += " AND YEAR(createdAt) = ?";
    params.push(currentYear);
  }
  if (start) {
    where += " AND DATE(createdAt) >= ?";
    params.push(start);
  }
  if (end) {
    where += " AND DATE(createdAt) <= ?";
    params.push(end);
  }

  let groupBy, labelSelect, orderBy;
  switch (group) {
    case 'dia':
      groupBy = "DATE(createdAt)";
      labelSelect = "DATE_FORMAT(createdAt, '%d/%m/%Y') AS periodo";
      orderBy = "DATE(createdAt) ASC";
      break;
    case 'semana':
      groupBy = "CONCAT('Semana ', WEEK(createdAt), ' ', YEAR(createdAt))";
      labelSelect = "CONCAT('Semana ', WEEK(createdAt), ' ', YEAR(createdAt)) AS periodo";
      orderBy = "CONCAT('Semana ', WEEK(createdAt), ' ', YEAR(createdAt)) ASC";
      break;
    case 'anio':
      groupBy = "YEAR(createdAt)";
      labelSelect = "YEAR(createdAt) AS periodo";
      orderBy = "YEAR(createdAt) ASC";
      break;
    case 'mes':
    default:
      groupBy = "DATE_FORMAT(createdAt, '%m-%Y')";
      labelSelect = "DATE_FORMAT(createdAt, '%m-%Y') AS periodo";
      orderBy = "DATE_FORMAT(createdAt, '%m-%Y') ASC";
      break;
  }

  const query = `
    SELECT ${labelSelect}, SUM(total) AS total
    FROM sales
    ${where}
    GROUP BY ${groupBy}
    ORDER BY ${orderBy}
  `;

  const results = await new Promise((resolve, reject) => {
    db.query(query, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

  const meses = [
    '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const data = results.map(row => {
    let label = row.periodo;
    if (group === 'mes') {
      const [mes, anio] = row.periodo.split('-');
      label = `${meses[parseInt(mes, 10)]} ${anio}`;
    }
    return {
      mes: label,
      total: Number(row.total)
    };
  });
  res.json(data);
}));

/**
 * Endpoint: Categorías más vendidas (para gráfico de torta)
 * Devuelve [{ nombre: 'Categoria', cantidad: 123 }, ...]
 * Permite filtrar por fecha con ?start=YYYY-MM-DD&end=YYYY-MM-DD
 * TEMPORALMENTE PÚBLICO para compatibilidad
 */
router.get('/top-categorias', readOnlyRateLimit, asyncHandler(async (req, res) => {
  const { start, end } = req.query;
  let where = "WHERE s.status = 'pagada'";
  const params = [];

  if (start) {
    where += " AND DATE(s.createdAt) >= ?";
    params.push(start);
  }
  if (end) {
    where += " AND DATE(s.createdAt) <= ?";
    params.push(end);
  }

  const query = `
    SELECT c.name AS nombre, SUM(sd.quantity) AS cantidad
    FROM saledetails sd
    JOIN sales s ON sd.saleId = s.id
    JOIN products p ON sd.productId = p.id
    JOIN categories c ON p.categoryId = c.id
    ${where}
    GROUP BY c.id, c.name
    ORDER BY cantidad DESC
  `;

  const results = await new Promise((resolve, reject) => {
    db.query(query, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

  // Forzar cantidad como número
  const data = results.map(row => ({
    nombre: row.nombre,
    cantidad: Number(row.cantidad)
  }));
  res.json(data);
}));

module.exports = router;