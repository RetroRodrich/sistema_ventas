/**
 * Rutas de Autenticación
 * Define los endpoints de login y registro
 */

const express = require('express');
const router = express.Router();
const { 
  loginRateLimit, 
  smartLoginRateLimit, 
  validateUserData, 
  asyncHandler 
} = require('../middleware');

const { login, register } = require('../controllers/authController');

// ============================================================================
// RUTAS DE AUTENTICACIÓN
// ============================================================================

// Login
router.post('/login', smartLoginRateLimit.checkLimit, validateUserData, asyncHandler(login(smartLoginRateLimit)));

// Registro
router.post('/register', loginRateLimit, validateUserData, asyncHandler(register));

module.exports = router;