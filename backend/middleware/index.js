/**
 * Archivo principal de middlewares
 * Agrupa y exporta todos los middlewares para fácil importación
 */

// Importar todos los middlewares
const auth = require('./auth');
const validation = require('./validation');
const errorHandler = require('./errorHandler');
const rateLimit = require('./rateLimit');

/**
 * Middlewares de autenticación y autorización
 */
const {
  authenticateToken,
  verifyUserExists,
  requireRole,
  requireAdmin,
  requireEmployee,
  authenticate
} = auth;

/**
 * Middlewares de validación
 */
const {
  validateProductData,
  validateSaleData,
  validateUserData,
  validateIdParam,
  validateBatchIdParam
} = validation;

/**
 * Middlewares de manejo de errores
 */
const {
  errorHandler: handleErrors,
  notFoundHandler,
  asyncHandler,
  timeoutHandler,
  createError
} = errorHandler;

/**
 * Middlewares de rate limiting
 */
const {
  loginRateLimit,
  apiRateLimit,
  strictRateLimit,
  readOnlyRateLimit,
  smartLoginRateLimit
} = rateLimit;

/**
 * Combinaciones comunes de middlewares para facilitar uso
 */

// Para rutas que requieren autenticación completa
const authRequired = [authenticateToken, verifyUserExists];

// Para rutas que requieren ser admin
const adminRequired = [...authRequired, requireAdmin];

// Para rutas que requieren ser empleado o admin
const employeeRequired = [...authRequired, requireEmployee];

// Para rutas de productos (autenticación + validación)
const productRoute = [...authRequired, validateProductData];

// Para rutas de ventas (autenticación + validación + rate limit)
const saleRoute = [...authRequired, strictRateLimit, validateSaleData];

// Para rutas de autenticación (rate limit + validación)
const authRoute = [loginRateLimit, validateUserData];

// Para rutas de consulta (solo rate limit permisivo)
const readRoute = [readOnlyRateLimit];

// Para rutas administrativas (admin + rate limit estricto)
const adminRoute = [...adminRequired, strictRateLimit];

module.exports = {
  // Middlewares individuales más utilizados (exportación directa)
  authenticateToken,
  verifyUserExists,
  requireRole,
  requireAdmin,
  requireEmployee,
  authenticate,
  validateProductData,
  validateSaleData,
  validateUserData,
  validateIdParam,
  validateBatchIdParam,
  handleErrors,
  notFoundHandler,
  asyncHandler,
  timeoutHandler,
  createError,
  loginRateLimit,
  apiRateLimit,
  strictRateLimit,
  readOnlyRateLimit,
  smartLoginRateLimit,
  
  // Alias comunes para facilitar importación
  authRequired,
  adminRequired,
  employeeRequired,
  errorHandler: handleErrors,
  
  // Middlewares agrupados para importación avanzada
  auth: {
    authenticateToken,
    verifyUserExists,
    requireRole,
    requireAdmin,
    requireEmployee,
    authenticate
  },
  
  validation: {
    validateProductData,
    validateSaleData,
    validateUserData,
    validateIdParam
  },
  
  errors: {
    handleErrors,
    notFoundHandler,
    asyncHandler,
    timeoutHandler,
    createError
  },
  
  rateLimit: {
    loginRateLimit,
    apiRateLimit,
    strictRateLimit,
    readOnlyRateLimit,
    smartLoginRateLimit
  },
  
  // Combinaciones comunes
  productRoute,
  saleRoute,
  authRoute,
  readRoute,
  adminRoute
};
