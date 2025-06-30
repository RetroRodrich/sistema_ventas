/**
 * Middleware centralizado para manejo de errores
 */

/**
 * Logger simple para errores
 * En producción podrías usar Winston o similar
 */
const logError = (error, req) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const ip = req.ip || req.connection.remoteAddress;

  console.error(`
[ERROR] ${timestamp}
Method: ${method} ${url}
IP: ${ip}
User-Agent: ${userAgent}
Error: ${error.message}
Stack: ${error.stack}
---`);
};

/**
 * Middleware para capturar errores no manejados
 * Debe ir al final de todas las rutas
 */
const errorHandler = (error, req, res, next) => {
  // Log del error
  logError(error, req);

  // Si ya se envió una respuesta, delegar al error handler por defecto
  if (res.headersSent) {
    return next(error);
  }

  // Determinar el tipo de error y respuesta apropiada
  let statusCode = 500;
  let message = 'Error interno del servidor';
  let details = null;

  // Errores de validación de JWT
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token inválido';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expirado';
  }
  // Errores de base de datos
  else if (error.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'El registro ya existe';
    details = 'Entrada duplicada en la base de datos';
  } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    message = 'Referencia inválida';
    details = 'El ID referenciado no existe';
  } else if (error.code && error.code.startsWith('ER_')) {
    statusCode = 400;
    message = 'Error en los datos enviados';
    details = 'Problema con los datos de la solicitud';
  }
  // Errores de validación personalizada
  else if (error.type === 'validation') {
    statusCode = 400;
    message = error.message;
    details = error.field ? `Campo problemático: ${error.field}` : null;
  }
  // Errores de autorización
  else if (error.type === 'authorization') {
    statusCode = 403;
    message = error.message || 'No tienes permisos para esta acción';
  }
  // Error de recurso no encontrado
  else if (error.type === 'not_found') {
    statusCode = 404;
    message = error.message || 'Recurso no encontrado';
  }

  // Respuesta de error estandarizada
  const errorResponse = {
    error: true,
    message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Agregar detalles solo en desarrollo
  if (process.env.NODE_ENV !== 'production') {
    if (details) errorResponse.details = details;
    errorResponse.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Middleware para capturar rutas no encontradas (404)
 * Debe ir antes del errorHandler pero después de todas las rutas válidas
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  error.type = 'not_found';
  next(error);
};

/**
 * Wrapper para funciones async que puede capturar errores automáticamente
 * Uso: router.get('/ruta', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware para manejar timeout de requests
 */
const timeoutHandler = (timeoutMs = 30000) => {
  return (req, res, next) => {
    // Establecer timeout para la respuesta
    res.setTimeout(timeoutMs, () => {
      const error = new Error('Request timeout');
      error.type = 'timeout';
      next(error);
    });
    next();
  };
};

/**
 * Función helper para crear errores personalizados
 */
const createError = (message, type = 'generic', statusCode = 500, field = null) => {
  const error = new Error(message);
  error.type = type;
  error.statusCode = statusCode;
  if (field) error.field = field;
  return error;
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  timeoutHandler,
  createError,
  logError
};
