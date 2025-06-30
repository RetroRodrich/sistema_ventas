#!/usr/bin/env node

/**
 * Script de verificación de funcionalidad del sistema de ventas
 * Verifica que todas las rutas críticas respondan correctamente
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';

// Rutas a verificar
const routes = [
  // Rutas públicas (funcionan sin autenticación)
  { method: 'GET', path: '/api/categories', description: 'Listar categorías' },
  { method: 'GET', path: '/api/products', description: 'Listar productos' },
  { method: 'GET', path: '/api/products/search?q=leche', description: 'Buscar productos' },
  { method: 'GET', path: '/api/products/low-stock', description: 'Productos con stock bajo' },
  { method: 'GET', path: '/api/sales', description: 'Historial de ventas' },
  { method: 'GET', path: '/api/dashboard/summary', description: 'Dashboard resumen' },
  { method: 'GET', path: '/api/dashboard/top-categorias', description: 'Top categorías' },
  
  // Rutas protegidas (deberían devolver 401 sin auth)
  { method: 'POST', path: '/api/sales', description: 'Crear venta (PROTEGIDA)', protected: true },
  { method: 'PUT', path: '/api/sales/1/status', description: 'Cambiar estado venta (PROTEGIDA)', protected: true }
];

async function testRoute(route) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: route.path,
      method: route.method,
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          route: route.path,
          description: route.description,
          status: res.statusCode,
          success: route.protected ? res.statusCode === 401 : res.statusCode === 200,
          dataSize: data.length,
          protected: route.protected || false
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        route: route.path,
        description: route.description,
        status: 'ERROR',
        success: false,
        error: err.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        route: route.path,
        description: route.description,
        status: 'TIMEOUT',
        success: false,
        error: 'Request timeout'
      });
    });

    req.end();
  });
}

async function runTests() {
  console.log('🔍 VERIFICANDO FUNCIONALIDAD DEL SISTEMA DE VENTAS...\n');
  
  const results = [];
  
  for (const route of routes) {
    console.log(`⏳ Probando: ${route.description}...`);
    const result = await testRoute(route);
    results.push(result);
    
    if (result.success) {
      if (result.protected) {
        console.log(`🛡️ ${result.description} - Status: ${result.status} - Correctamente protegida`);
      } else {
        console.log(`✅ ${result.description} - Status: ${result.status} - Data: ${result.dataSize} bytes`);
      }
    } else {
      console.log(`❌ ${result.description} - Status: ${result.status} - Error: ${result.error || 'Unknown'}`);
    }
  }
  
  console.log('\n📊 RESUMEN:');
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`✅ Exitosos: ${successful}/${total}`);
  console.log(`❌ Fallidos: ${total - successful}/${total}`);
  
  if (successful === total) {
    console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON! El sistema está funcionando correctamente.');
  } else {
    console.log('\n⚠️  Algunas pruebas fallaron. Revisar configuración.');
  }
  
  return successful === total;
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runTests, testRoute };
