const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/products'); // Importamos las rutas de productos

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Usar las rutas de productos
app.use('/api/products', productRoutes);

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});