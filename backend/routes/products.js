/**
 * Rutas de Productos
 * Define los endpoints y conecta con los controladores
 */

const express = require('express');
const { 
  authRequired, 
  adminRequired,
  validateProductData,
  validateIdParam,
  validateBatchIdParam,
  readOnlyRateLimit,
  asyncHandler 
} = require('../middleware');

const {
  getLowStock,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getCategories,
  getProductBatches,
  addBatch,
  updateBatch,
  deleteBatch
} = require('../controllers/productsController');

// Exporta función que recibe io y retorna el router
module.exports = (io) => {
  const router = express.Router();

  // ============================================================================
  // RUTAS DE PRODUCTOS
  // ============================================================================

  // Productos con stock bajo (debe ir antes de /:id)
  router.get('/low-stock', readOnlyRateLimit, asyncHandler(getLowStock));

  // Buscar productos
  router.get('/search', readOnlyRateLimit, asyncHandler(searchProducts));

  // Obtener categorías
  router.get('/categories', readOnlyRateLimit, asyncHandler(getCategories));

  // Obtener todos los productos
  router.get('/', readOnlyRateLimit, asyncHandler(getAllProducts));

  // Crear producto (requiere admin)
  router.post('/', adminRequired, validateProductData, asyncHandler(createProduct(io)));

  // Actualizar producto (requiere admin)
  router.put('/:id', adminRequired, validateProductData, validateIdParam, asyncHandler(updateProduct(io)));

  // Eliminar producto (requiere admin)
  router.delete('/:id', adminRequired, validateIdParam, asyncHandler(deleteProduct(io)));

  // ============================================================================
  // RUTAS DE LOTES
  // ============================================================================

  // Obtener lotes de un producto
  router.get('/:id/batches', readOnlyRateLimit, validateIdParam, asyncHandler(getProductBatches));

  // Agregar lote a un producto
  router.post('/:id/batches', adminRequired, validateIdParam, asyncHandler(addBatch));

  // Actualizar lote
  router.put('/batches/:batchId', adminRequired, validateBatchIdParam, asyncHandler(updateBatch));

  // Eliminar lote
  router.delete('/batches/:batchId', adminRequired, validateBatchIdParam, asyncHandler(deleteBatch));

  // ============================================================================
  // RUTA DINÁMICA (debe ir al final)
  // ============================================================================

  // Obtener producto por ID
  router.get('/:id', validateIdParam, asyncHandler(getProductById));

  return router;
};