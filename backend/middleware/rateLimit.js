/**
 * Middleware simple de Rate Limiting
 * Limita el número de requests por IP en un período de tiempo
 */

// Map para almacenar intentos por IP
const attempts = new Map();

/**
 * Función para limpiar todos los rate limits (útil para desarrollo)
 */
const clearAllRateLimits = () => {
  attempts.clear();
  console.log('🧹 Rate limits limpiados');
};

/**
 * Limpieza automática de intentos viejos cada 15 minutos
 */
setInterval(() => {
  const now = Date.now();
  const fifteenMinutes = 15 * 60 * 1000;
  
  for (const [ip, data] of attempts.entries()) {
    if (now - data.firstAttempt > fifteenMinutes) {
      attempts.delete(ip);
    }
  }
}, 15 * 60 * 1000);

/**
 * Rate limiter genérico
 * @param {number} maxAttempts - Máximo número de intentos
 * @param {number} windowMs - Ventana de tiempo en milisegundos
 * @param {string} message - Mensaje personalizado
 */
const createRateLimit = (maxAttempts = 100, windowMs = 15 * 60 * 1000, message = 'Demasiados intentos') => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    // Obtener o crear registro para esta IP
    let ipData = attempts.get(ip);
    
    if (!ipData) {
      ipData = {
        count: 1,
        firstAttempt: now,
        lastAttempt: now
      };
      attempts.set(ip, ipData);
      return next();
    }
    
    // Si ha pasado la ventana de tiempo, resetear contador
    if (now - ipData.firstAttempt > windowMs) {
      ipData.count = 1;
      ipData.firstAttempt = now;
      ipData.lastAttempt = now;
      attempts.set(ip, ipData);
      return next();
    }
    
    // Incrementar contador
    ipData.count++;
    ipData.lastAttempt = now;
    attempts.set(ip, ipData);
    
    // Verificar si excede el límite
    if (ipData.count > maxAttempts) {
      const remainingTime = Math.ceil((windowMs - (now - ipData.firstAttempt)) / 1000 / 60);
      
      return res.status(429).json({
        error: 'Límite de intentos excedido',
        message: `${message}. Intenta de nuevo en ${remainingTime} minutos.`,
        retryAfter: remainingTime,
        limit: maxAttempts,
        current: ipData.count
      });
    }
    
    // Agregar headers informativos
    res.set({
      'X-RateLimit-Limit': maxAttempts,
      'X-RateLimit-Remaining': Math.max(0, maxAttempts - ipData.count),
      'X-RateLimit-Reset': new Date(ipData.firstAttempt + windowMs).toISOString()
    });
    
    next();
  };
};

/**
 * Rate limiter específico para login
 * En desarrollo: más permisivo (20 intentos por 15 minutos)
 * En producción: usar valores más estrictos
 */
const loginRateLimit = createRateLimit(
  process.env.NODE_ENV === 'production' ? 5 : 20, 
  15 * 60 * 1000, 
  'Demasiados intentos de login'
);

/**
 * Rate limiter para APIs generales
 * 100 requests por 15 minutos
 */
const apiRateLimit = createRateLimit(
  100, 
  15 * 60 * 1000, 
  'Demasiadas solicitudes'
);

/**
 * Rate limiter más estricto para operaciones sensibles
 * 20 intentos por 15 minutos
 */
const strictRateLimit = createRateLimit(
  20, 
  15 * 60 * 1000, 
  'Demasiados intentos para esta operación'
);

/**
 * Rate limiter muy permisivo para operaciones de solo lectura
 * 200 requests por 15 minutos
 */
const readOnlyRateLimit = createRateLimit(
  200, 
  15 * 60 * 1000, 
  'Demasiadas consultas'
);

/**
 * Función para obtener estadísticas de rate limiting
 * Útil para debugging y monitoreo
 */
const getRateLimitStats = () => {
  const stats = {
    totalIPs: attempts.size,
    activeIPs: 0,
    blockedIPs: 0,
    topOffenders: []
  };
  
  const now = Date.now();
  const fifteenMinutes = 15 * 60 * 1000;
  
  for (const [ip, data] of attempts.entries()) {
    if (now - data.firstAttempt <= fifteenMinutes) {
      stats.activeIPs++;
      if (data.count > 100) { // Considerado bloqueado si excede el límite general
        stats.blockedIPs++;
      }
      stats.topOffenders.push({
        ip,
        attempts: data.count,
        firstAttempt: new Date(data.firstAttempt).toISOString(),
        lastAttempt: new Date(data.lastAttempt).toISOString()
      });
    }
  }
  
  // Ordenar por número de intentos descendente
  stats.topOffenders.sort((a, b) => b.attempts - a.attempts);
  stats.topOffenders = stats.topOffenders.slice(0, 10); // Top 10
  
  return stats;
};

/**
 * Función para limpiar manualmente los intentos de una IP
 * Útil para administradores
 */
const clearIPAttempts = (ip) => {
  const deleted = attempts.delete(ip);
  return deleted;
};

/**
 * Función para agregar una IP a lista blanca temporal
 * (simplemente la elimina del tracking)
 */
const whitelistIP = (ip, durationMs = 60 * 60 * 1000) => {
  attempts.delete(ip);
  
  // Opcional: podrías implementar una lista blanca real aquí
  setTimeout(() => {
    // La IP vuelve a ser trackeada automáticamente en el próximo request
  }, durationMs);
  
  return true;
};

/**
 * Rate limiter inteligente para login
 * Solo cuenta intentos fallidos, no exitosos
 */
const createSmartLoginRateLimit = (maxFailedAttempts = 10, windowMs = 15 * 60 * 1000) => {
  const failedAttempts = new Map();
  
  // Limpieza automática cada 15 minutos
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of failedAttempts.entries()) {
      if (now - data.firstAttempt > windowMs) {
        failedAttempts.delete(ip);
      }
    }
  }, windowMs);

  return {
    // Middleware que se ejecuta ANTES del login
    checkLimit: (req, res, next) => {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const now = Date.now();
      
      let ipData = failedAttempts.get(ip);
      
      if (ipData) {
        // Si ha pasado la ventana de tiempo, resetear
        if (now - ipData.firstAttempt > windowMs) {
          failedAttempts.delete(ip);
        } else if (ipData.count >= maxFailedAttempts) {
          return res.status(429).json({
            error: 'Demasiados intentos de login fallidos',
            message: `Intenta de nuevo en ${Math.ceil((windowMs - (now - ipData.firstAttempt)) / 60000)} minutos`
          });
        }
      }
      
      next();
    },
    
    // Función para reportar intento fallido
    reportFailedAttempt: (req) => {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const now = Date.now();
      
      let ipData = failedAttempts.get(ip);
      
      if (!ipData) {
        ipData = {
          count: 1,
          firstAttempt: now
        };
      } else {
        ipData.count += 1;
      }
      
      failedAttempts.set(ip, ipData);
    },
    
    // Función para limpiar intentos (login exitoso)
    clearAttempts: (req) => {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      failedAttempts.delete(ip);
    }
  };
};

// Crear instancia del rate limiter inteligente
const smartLoginRateLimit = createSmartLoginRateLimit(
  process.env.NODE_ENV === 'production' ? 5 : 15,  // 15 intentos fallidos en dev
  15 * 60 * 1000
);

module.exports = {
  createRateLimit,
  loginRateLimit,
  apiRateLimit,
  strictRateLimit,
  readOnlyRateLimit,
  getRateLimitStats,
  clearIPAttempts,
  whitelistIP,
  clearAllRateLimits,
  smartLoginRateLimit
};
