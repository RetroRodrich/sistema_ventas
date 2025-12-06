const express = require('express');
const db = require('../config/db');
const router = express.Router();
const { 
  authRequired, 
  readOnlyRateLimit,
  asyncHandler 
} = require('../middleware');

// Endpoint temporal para debug
router.get('/debug-test', asyncHandler(async (req, res) => {
  const query = `
    SELECT DATE_FORMAT(createdAt, '%m-%Y') AS periodo,
           SUM(total) AS total
    FROM sales
    WHERE status = 'pagada'
    GROUP BY DATE_FORMAT(createdAt, '%m-%Y')
  `;
  
  const results = await new Promise((resolve, reject) => {
    db.query(query, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
  
  res.json(results);
}));

// Endpoint de resumen para dashboard (agrupación flexible)
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

  // Consulta principal
  const query = `
    SELECT DATE_FORMAT(createdAt, '%m-%Y') AS periodo,
           SUM(total) AS total,
           COUNT(id) AS cantidad_productos,
           ROUND(AVG(total), 2) AS ticket_promedio,
           COUNT(DISTINCT customer_dni) AS clientes_unicos
    FROM sales s
    ${where}
    GROUP BY DATE_FORMAT(createdAt, '%m-%Y')
  `;

  const results = await new Promise((resolve, reject) => {
    db.query(query, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

  // Obtener datos históricos del año pasado (2024) para predicciones
  const historicalDataQuery = `
    SELECT DATE_FORMAT(createdAt, '%m') AS mes_numero,
           SUM(total) AS total_historico,
           COUNT(id) AS cantidad_productos_historico,
           ROUND(AVG(total), 2) AS ticket_promedio_historico,
           COUNT(DISTINCT customer_dni) AS clientes_unicos_historico
    FROM sales
    WHERE status = 'pagada' AND YEAR(createdAt) = 2024
    GROUP BY DATE_FORMAT(createdAt, '%m')
  `;

  const historicalResults = await new Promise((resolve, reject) => {
    db.query(historicalDataQuery, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

  // Crear un mapa de datos históricos por mes
  const historicalDataMap = {};
  historicalResults.forEach(row => {
    historicalDataMap[row.mes_numero] = {
      total: Number(row.total_historico || 0),
      cantidad_productos: Number(row.cantidad_productos_historico || 0),
      ticket_promedio: Number(row.ticket_promedio_historico || 0),
      clientes_unicos: Number(row.clientes_unicos_historico || 0)
    };
  });

  const meses = [
    '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Procesar datos y generar predicciones
  const dataWithPredictions = [];
  
  for (const row of results) {
    const [mes, anio] = row.periodo.split('-');
    const label = `${meses[parseInt(mes, 10)]} ${anio}`;
    const mesNumero = parseInt(mes, 10);
    const anioNumero = parseInt(anio, 10);
    
    let prediccion = 0;
    
    // Solo predecir para años futuros (2025 en adelante)
    if (anioNumero >= 2025) {
      const mesKey = mesNumero.toString().padStart(2, '0');
      const historicalData = historicalDataMap[mesKey];
      
      if (historicalData) {
        // Cálculo simple basado en datos históricos con incremento del 5%
        prediccion = Math.round(historicalData.total * 1.05);
      } else {
        // Usar promedio histórico como fallback
        const promedioHistorico = Object.values(historicalDataMap)
          .reduce((acc, data) => acc + data.total, 0) / Object.keys(historicalDataMap).length;
        prediccion = Math.round(promedioHistorico * 1.05 || 5000);
      }
    }
    
    dataWithPredictions.push({
      mes: label,
      total: Number(row.total),
      cantidad_productos: Number(row.cantidad_productos || 0),
      ticket_promedio: Number(row.ticket_promedio || 0),
      clientes_unicos: Number(row.clientes_unicos || 0),
      prediccion: prediccion,
      periodoOriginal: row.periodo,
      anio: anioNumero
    });
  }

  // Ordenar cronológicamente
  dataWithPredictions.sort((a, b) => {
    const [mesA, anioA] = a.periodoOriginal.split('-');
    const [mesB, anioB] = b.periodoOriginal.split('-');
    
    if (anioA !== anioB) {
      return parseInt(anioA) - parseInt(anioB);
    }
    return parseInt(mesA) - parseInt(mesB);
  });

  // Remover campos auxiliares
  const finalData = dataWithPredictions.map(({ periodoOriginal, anio, ...rest }) => rest);

  res.json(finalData);
}));

// Resto de endpoints sin cambios...
router.get('/top-categorias', readOnlyRateLimit, asyncHandler(async (req, res) => {
  const { start, end } = req.query;
  let where = "WHERE s.status = 'pagada'";
  const params = [];

  if (!start && !end) {
    where += " AND DATE(s.createdAt) = CURDATE()";
  } else {
    if (start) {
      where += " AND DATE(s.createdAt) >= ?";
      params.push(start);
    }
    if (end) {
      where += " AND DATE(s.createdAt) <= ?";
      params.push(end);
    }
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

  const data = results.map(row => ({
    nombre: row.nombre,
    cantidad: Number(row.cantidad)
  }));
  res.json(data);
}));

module.exports = router;