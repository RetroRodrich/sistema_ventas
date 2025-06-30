#!/usr/bin/env node

/**
 * Script para identificar todas las rutas que requiere el frontend
 * y verificar cuáles están protegidas vs públicas
 */

const http = require('http');

// Rutas completas que el frontend podría necesitar
const allRoutes = [
  // ============ CATEGORÍAS ============
  { method: 'GET', path: '/api/categories', description: 'Listar categorías', needed: 'frontend' },
  
  // ============ PRODUCTOS ============
  { method: 'GET', path: '/api/products', description: 'Listar productos', needed: 'frontend' },
  { method: 'GET', path: '/api/products/search?q=test', description: 'Buscar productos', needed: 'frontend' },
  { method: 'GET', path: '/api/products/categories', description: 'Categorías desde productos', needed: 'frontend' },
  { method: 'GET', path: '/api/products/low-stock', description: 'Productos stock bajo', needed: 'navbar' },
  { method: 'GET', path: '/api/products/1', description: 'Detalle de producto', needed: 'frontend' },
  { method: 'GET', path: '/api/products/1/batches', description: 'Lotes de producto', needed: 'detalles' },
  
  // ============ VENTAS ============
  { method: 'GET', path: '/api/sales', description: 'Historial ventas', needed: 'frontend' },
  { method: 'GET', path: '/api/sales/1', description: 'Detalle de venta', needed: 'frontend' },
  
  // ============ DASHBOARD ============
  { method: 'GET', path: '/api/dashboard/summary', description: 'Resumen dashboard', needed: 'dashboard' },
  { method: 'GET', path: '/api/dashboard/top-categorias', description: 'Top categorías', needed: 'dashboard' },
  
  // ============ RUTAS ADMIN (deberían estar protegidas) ============
  { method: 'POST', path: '/api/products', description: 'Crear producto', needed: 'admin', protected: true },
  { method: 'PUT', path: '/api/products/1', description: 'Editar producto', needed: 'admin', protected: true },
  { method: 'DELETE', path: '/api/products/1', description: 'Eliminar producto', needed: 'admin', protected: true },
  { method: 'POST', path: '/api/products/1/batches', description: 'Crear lote', needed: 'admin', protected: true },
  { method: 'PUT', path: '/api/products/batches/1', description: 'Editar lote', needed: 'admin', protected: true },
  { method: 'DELETE', path: '/api/products/batches/1', description: 'Eliminar lote', needed: 'admin', protected: true },
  
  // ============ VENTAS ADMIN ============
  { method: 'POST', path: '/api/sales', description: 'Crear venta', needed: 'sales', protected: true },
  { method: 'PUT', path: '/api/sales/1/status', description: 'Cambiar estado venta', needed: 'admin', protected: true },
];

async function testRoute(route) {
  return new Promise((resolve) => {
    const url = new URL('http://localhost:5000' + route.path);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 5000,
      path: url.pathname + url.search,
      method: route.method,
      timeout: 5000,
      headers: route.method === 'POST' || route.method === 'PUT' ? 
        { 'Content-Type': 'application/json' } : {}
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const isSuccess = route.protected ? 
          (res.statusCode === 401 || res.statusCode === 400) : // Protegidas deberían dar 401/400
          (res.statusCode >= 200 && res.statusCode < 300);     // Públicas deberían dar 2xx
          
        resolve({
          route: route.path,
          method: route.method,
          description: route.description,
          needed: route.needed,
          status: res.statusCode,
          success: isSuccess,
          protected: route.protected || false,
          dataSize: data.length,
          error: res.statusCode >= 400 ? data.substring(0, 100) : null
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        route: route.path,
        method: route.method,
        description: route.description,
        needed: route.needed,
        status: 'ERROR',
        success: false,
        protected: route.protected || false,
        error: err.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        route: route.path,
        method: route.method,
        description: route.description,
        needed: route.needed,
        status: 'TIMEOUT',
        success: false,
        protected: route.protected || false,
        error: 'Request timeout'
      });
    });

    // Para POST/PUT, enviar un body mínimo
    if (route.method === 'POST' || route.method === 'PUT') {
      req.write('{}');
    }
    
    req.end();
  });
}

async function runCompleteTest() {
  console.log('🔍 ANÁLISIS COMPLETO DE RUTAS DEL SISTEMA DE VENTAS\n');
  
  const results = [];
  const categories = {
    frontend: [],
    navbar: [],
    dashboard: [],
    detalles: [],
    admin: [],
    sales: []
  };
  
  for (const route of allRoutes) {
    console.log(`⏳ ${route.method} ${route.path} (${route.needed})...`);
    const result = await testRoute(route);
    results.push(result);
    
    if (categories[result.needed]) {
      categories[result.needed].push(result);
    }
    
    // Mostrar resultado con colores
    if (result.success) {
      if (result.protected) {
        console.log(`🛡️ ${result.description} - Status: ${result.status} - Correctamente protegida`);
      } else {
        console.log(`✅ ${result.description} - Status: ${result.status} - Data: ${result.dataSize} bytes`);
      }
    } else {
      console.log(`❌ ${result.description} - Status: ${result.status} - Error: ${result.error?.substring(0, 50) || 'Unknown'}`);
    }
  }
  
  console.log('\n📊 RESUMEN POR CATEGORÍA:');
  
  Object.keys(categories).forEach(category => {
    const routes = categories[category];
    if (routes.length === 0) return;
    
    const successful = routes.filter(r => r.success).length;
    const total = routes.length;
    
    console.log(`\n🔸 ${category.toUpperCase()}:`);
    console.log(`   ✅ Funcionando: ${successful}/${total}`);
    
    const failing = routes.filter(r => !r.success && !r.protected);
    if (failing.length > 0) {
      console.log(`   ❌ NECESITAN ARREGLO:`);
      failing.forEach(r => {
        console.log(`      - ${r.method} ${r.route} (Status: ${r.status})`);
      });
    }
  });
  
  console.log('\n📋 ACCIONES REQUERIDAS:');
  const frontendIssues = results.filter(r => 
    !r.success && !r.protected && 
    (r.needed === 'frontend' || r.needed === 'navbar' || r.needed === 'dashboard' || r.needed === 'detalles')
  );
  
  if (frontendIssues.length === 0) {
    console.log('🎉 ¡TODO LISTO! Todas las rutas del frontend están funcionando.');
  } else {
    console.log('⚠️  Rutas que necesitan hacerse públicas:');
    frontendIssues.forEach(issue => {
      console.log(`   - ${issue.method} ${issue.route} (para ${issue.needed})`);
    });
  }
  
  return frontendIssues.length === 0;
}

if (require.main === module) {
  runCompleteTest().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runCompleteTest };
