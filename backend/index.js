import { DB_PORT } from './config.js';
const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/products');
const categoriesRoutes = require('./routes/categories');

const app = express();
const PORT = DB_PORT;

app.use(cors(
// {
//   origin: FRONTEND_URL,
// }
));
app.use(express.json());

app.use('/api/products', productRoutes);
app.use('/api/categories', categoriesRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});