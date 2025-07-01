const { PORT } = require('./config');
const express = require('express');
const cors = require('cors');
const productRoutesFactory = require('./routes/products');
const categoriesRoutes = require('./routes/categories');
const authRoutes = require('./routes/auth');
const salesRoutesFactory = require('./routes/sales');
const dashboardRoutes = require('./routes/dashboard');
const { errorHandler, notFoundHandler, timeoutHandler } = require('./middleware');
const { clearAllRateLimits } = require('./middleware/rateLimit');

const app = express();

// Endpoint temporal para desarrollo - limpiar rate limits
if (process.env.NODE_ENV !== 'production') {
  app.post('/api/dev/clear-rate-limits', (req, res) => {
    clearAllRateLimits();
    res.json({ message: 'Rate limits cleared successfully' });
  });
}

// Middlewares globales
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Limitar tamaño de JSON
app.use(timeoutHandler(30000)); // Timeout de 30 segundos

// --- SOCKET.IO INTEGRACIÓN ---
const http = require('http');
const { Server } = require('socket.io');
let io = null;

if (require.main === module) {
  const server = http.createServer(app);
  io = new Server(server, {
    cors: { origin: '*' } // Ajusta esto en producción si es necesario
  });

  // Montar rutas que requieren io
  app.use('/api/products', productRoutesFactory(io));
  app.use('/api/sales', salesRoutesFactory(io));

  app.use('/api/categories', categoriesRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  io.on('connection', (socket) => {
    console.log('Cliente WebSocket conectado');
  });

  // Middleware para rutas no encontradas (404)
  app.use(notFoundHandler);
  // Middleware de manejo de errores (debe ir al final)
  app.use(errorHandler);

  server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
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

// Exporta app e io para otros módulos (io puede ser null si no es el entrypoint principal)
module.exports = { app, io };