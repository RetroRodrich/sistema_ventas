/**
 * Servidor estático para producción en Heroku
 * Sirve los archivos de build y maneja SPA routing
 */
const express = require('express');
const path = require('path');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// Compresión gzip
app.use(compression());

// Caché para archivos estáticos (1 año para assets con hash)
app.use('/assets', express.static(path.join(__dirname, 'dist/assets'), {
  maxAge: '1y',
  immutable: true
}));

// Servir archivos estáticos desde dist
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1h'
}));

// SPA fallback - todas las rutas van a index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Frontend corriendo en puerto ${PORT}`);
});
