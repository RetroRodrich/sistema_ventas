/**
 * Pet World - Backend Server
 * Sistema de ventas para clínica veterinaria
 */
const { PORT } = require('./config');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// Rutas
const productRoutesFactory = require('./routes/products');
const categoriesRoutes = require('./routes/categories');
const authRoutes = require('./routes/auth');
const salesRoutesFactory = require('./routes/sales');
const dashboardRoutes = require('./routes/dashboard');

// Middlewares
const { errorHandler, notFoundHandler, timeoutHandler } = require('./middleware');
const { clearAllRateLimits } = require('./middleware/rateLimit');

const app = express();

// ============================================
// MIDDLEWARES DE SEGURIDAD Y OPTIMIZACIÓN
// ============================================

// Seguridad HTTP headers (desactivado en desarrollo para evitar conflictos)
if (process.env.NODE_ENV === 'production') {
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));
}

// Compresión de respuestas
app.use(compression());

// CORS configuración
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 horas
};
app.use(cors(corsOptions));

// Parser JSON con límite de tamaño
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Timeout de solicitudes (30 segundos)
app.use(timeoutHandler(30000));

// ============================================
// HEALTH CHECK (disponible en todos los entornos)
// ============================================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ============================================
// RUTAS DE DESARROLLO (solo en dev)
// ============================================
if (process.env.NODE_ENV !== 'production') {
  // Limpiar rate limits manualmente
  app.post('/api/dev/clear-rate-limits', (req, res) => {
    clearAllRateLimits();
    res.json({ message: 'Rate limits cleared successfully' });
  });
}

// ============================================
// SERVIDOR CON SOCKET.IO
// ============================================
const http = require('http');
const { Server } = require('socket.io');

let io = null;
let server = null;

if (require.main === module) {
  server = http.createServer(app);
  
  io = new Server(server, {
    cors: corsOptions,
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Montar rutas que requieren io
  app.use('/api/products', productRoutesFactory(io));
  app.use('/api/sales', salesRoutesFactory(io));
  app.use('/api/categories', categoriesRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  // Socket.IO eventos
  io.on('connection', (socket) => {
    console.log(`📡 Cliente conectado: ${socket.id}`);
    
    socket.on('disconnect', (reason) => {
      console.log(`📡 Cliente desconectado: ${socket.id} - ${reason}`);
    });
    
    socket.on('error', (error) => {
      console.error(`❌ Error en socket ${socket.id}:`, error);
    });
  });

  // Middleware para rutas no encontradas (404)
  app.use(notFoundHandler);
  
  // Middleware de manejo de errores (debe ir al final)
  app.use(errorHandler);

  // Iniciar servidor
  const port = PORT || 4000;
  server.listen(port, () => {
    console.log('');
    console.log('🐾 ================================');
    console.log('   PET WORLD - Sistema de Ventas');
    console.log('🐾 ================================');
    console.log(`✅ Servidor corriendo en puerto ${port}`);
    console.log(`📍 http://localhost:${port}`);
    console.log(`🔧 Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log('');
  });

  // ============================================
  // GRACEFUL SHUTDOWN
  // ============================================
  const gracefulShutdown = (signal) => {
    console.log(`\n⚠️  Recibida señal ${signal}, cerrando servidor...`);
    
    server.close((err) => {
      if (err) {
        console.error('❌ Error al cerrar servidor:', err);
        process.exit(1);
      }
      
      console.log('✅ Servidor HTTP cerrado');
      
      // Cerrar conexiones de Socket.IO
      if (io) {
        io.close(() => {
          console.log('✅ Conexiones WebSocket cerradas');
        });
      }
      
      // Cerrar pool de MySQL
      const db = require('./config/db');
      db.end((err) => {
        if (err) {
          console.error('❌ Error al cerrar pool MySQL:', err);
        } else {
          console.log('✅ Pool de MySQL cerrado');
        }
        console.log('👋 Servidor apagado correctamente');
        process.exit(0);
      });
    });

    // Forzar cierre después de 10 segundos
    setTimeout(() => {
      console.error('⚠️  Forzando cierre después de timeout');
      process.exit(1);
    }, 10000);
  };

  // Escuchar señales de terminación
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Manejar errores no capturados
  process.on('uncaughtException', (error) => {
    console.error('❌ Excepción no capturada:', error);
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesa rechazada no manejada:', reason);
  });

} else {
  // Para testing/export sin servidor
  app.use('/api/products', productRoutesFactory(null));
  app.use('/api/sales', salesRoutesFactory(null));
  app.use('/api/categories', categoriesRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
}

// Exporta app e io para otros módulos
module.exports = { app, io };