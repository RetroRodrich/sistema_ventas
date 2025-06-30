const { PORT } = require('./config');
const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/products');
const categoriesRoutes = require('./routes/categories');
const authRoutes = require('./routes/auth');
const salesRoutes = require('./routes/sales');
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

// Rutas de la API
app.use('/api/products', productRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Middleware para rutas no encontradas (404)
app.use(notFoundHandler);

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

module.exports = app;