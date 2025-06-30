const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro';

/**
 * Middleware para verificar token JWT
 * Verifica si el usuario está autenticado
 */
const authenticateToken = (req, res, next) => {
  // Obtener el token del header Authorization
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Token de acceso requerido',
      message: 'No se proporcionó token de autenticación' 
    });
  }

  // Verificar el token
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        error: 'Token inválido',
        message: 'El token proporcionado no es válido o ha expirado' 
      });
    }

    // Agregar información del usuario al request
    req.user = user;
    next();
  });
};

/**
 * Middleware para verificar si el usuario existe en la base de datos
 * Se ejecuta después de authenticateToken
 */
const verifyUserExists = (req, res, next) => {
  const userId = req.user.id;

  db.query('SELECT id, name, email, role FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ 
        error: 'Error del servidor',
        message: 'Error al verificar usuario' 
      });
    }

    if (results.length === 0) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado',
        message: 'El usuario asociado al token no existe' 
      });
    }

    // Actualizar información del usuario con datos frescos de la BD
    req.user = { ...req.user, ...results[0] };
    next();
  });
};

/**
 * Middleware para verificar roles específicos
 * @param {string|Array} allowedRoles - Rol o array de roles permitidos
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    // Convertir a array si es un string
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!req.user || !req.user.role) {
      return res.status(401).json({ 
        error: 'Usuario no autenticado',
        message: 'No se pudo determinar el rol del usuario' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Acceso denegado',
        message: `Se requiere rol: ${roles.join(' o ')}. Tu rol actual: ${req.user.role}` 
      });
    }

    next();
  };
};

/**
 * Middleware específico para solo administradores
 */
const requireAdmin = requireRole('admin');

/**
 * Middleware específico para empleados y administradores
 */
const requireEmployee = requireRole(['admin', 'employee']);

/**
 * Middleware combinado: autenticación + verificación de usuario
 * Úsalo cuando necesites autenticación completa
 */
const authenticate = [authenticateToken, verifyUserExists];

module.exports = {
  authenticateToken,
  verifyUserExists,
  requireRole,
  requireAdmin,
  requireEmployee,
  authenticate
};
