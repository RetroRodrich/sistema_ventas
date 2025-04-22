const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/products'); // Importamos las rutas de productos
const categoriesRoutes = require('./routes/categories'); // Importamos las rutas de categorías

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Usar las rutas de productos
app.use('/api/products', productRoutes);

// Usar las rutas de categorías
app.use('/api/categories', categoriesRoutes);

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});