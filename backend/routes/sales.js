/**
 * Rutas de Ventas
 * Define los endpoints de ventas
 */

const express = require('express');
const { 
  authRequired, 
  adminRequired,
  validateSaleData,
  validateIdParam,
  readOnlyRateLimit,
  asyncHandler 
} = require('../middleware');

const {
  createSale,
  getAllSales,
  getSaleById,
  updateSaleStatus
} = require('../controllers/salesController');

// Exporta función que recibe io y retorna el router
module.exports = (io) => {
  const router = express.Router();

  // ============================================================================
  // RUTAS DE VENTAS
  // ============================================================================

  // Crear venta
  router.post('/', authRequired, validateSaleData, asyncHandler(createSale(io)));

  // Obtener todas las ventas
  router.get('/', readOnlyRateLimit, asyncHandler(getAllSales));

  // Obtener venta por ID
  router.get('/:id', validateIdParam, asyncHandler(getSaleById));

  // Actualizar estado de venta
  router.put('/:id/status', authRequired, validateIdParam, asyncHandler(updateSaleStatus(io)));

  return router;
};