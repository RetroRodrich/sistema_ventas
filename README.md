# Pet World - Sistema de Ventas para Veterinaria 🐾

Sistema completo de punto de venta (POS) diseñado para clínicas veterinarias y tiendas de mascotas.

## 🚀 Características

- **Gestión de productos** con lotes y control de vencimiento (FEFO)
- **Punto de venta** con búsqueda rápida y carrito de compras
- **Historial de ventas** con filtros y exportación a Excel
- **Alertas de stock bajo** en tiempo real
- **Boletas PDF** personalizables
- **Dashboard** con estadísticas de ventas
- **Autenticación JWT** con roles (admin/employee)
- **WebSockets** para actualizaciones en tiempo real

## 📋 Requisitos

- Node.js 18+
- MySQL 8.0+
- npm o yarn

## 🛠️ Instalación Local

### 1. Clonar repositorio
```bash
git clone https://github.com/RetroRodrich/sistema_ventas.git
cd sistema_ventas
```

### 2. Configurar base de datos
```bash
# Crear la base de datos ejecutando el script
mysql -u root -p < database/schema.sql
```

### 3. Configurar backend
```bash
cd backend
cp .env.example .env
# Editar .env con tus credenciales
npm install
npm run dev
```

### 4. Configurar frontend
```bash
cd frontend
npm install
npm run dev
```

### 5. Acceder
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 🐳 Instalación con Docker

```bash
# Clonar y entrar al directorio
git clone https://github.com/RetroRodrich/sistema_ventas.git
cd sistema_ventas

# Copiar y configurar variables de entorno
cp .env.example .env
# Editar .env con valores seguros

# Iniciar con Docker Compose
docker-compose up -d

# Ver logs
docker-compose logs -f
```

Acceder a:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📁 Estructura del Proyecto

```
sistema_ventas/
├── backend/
│   ├── controllers/     # Lógica de negocio
│   ├── routes/          # Definición de endpoints
│   ├── middleware/      # Auth, validación, rate limiting
│   ├── config/          # Configuración de BD
│   └── index.js         # Servidor Express
├── frontend/
│   ├── src/
│   │   ├── components/  # Componentes reutilizables
│   │   ├── pages/       # Vistas principales
│   │   ├── styles/      # Estilos CSS
│   │   └── utils/       # Utilidades y helpers
│   └── public/          # Assets estáticos
├── database/
│   └── schema.sql       # Script de creación de BD
├── docker-compose.yml   # Orquestación Docker
└── README.md
```

## 🔐 Variables de Entorno

### Backend (.env)
| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| NODE_ENV | Entorno | production |
| PORT | Puerto del servidor | 5000 |
| DB_HOST | Host de MySQL | localhost |
| DB_DATABASE | Nombre de la BD | inventory_sales_db |
| DB_USER | Usuario de MySQL | root |
| DB_PASSWORD | Contraseña | password |
| JWT_SECRET | Secret para tokens | cambiar_en_produccion |
| FRONTEND_URL | URL del frontend | http://localhost:5173 |

## 🎨 Tema Visual

El sistema usa los colores corporativos de Pet World:
- **Primario (Naranja):** #FF8C42
- **Secundario (Verde):** #005842

## 📊 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario

### Productos
- `GET /api/products` - Listar productos
- `POST /api/products` - Crear producto (admin)
- `PUT /api/products/:id` - Actualizar producto (admin)
- `DELETE /api/products/:id` - Eliminar producto (admin)

### Ventas
- `GET /api/sales` - Listar ventas
- `POST /api/sales` - Crear venta
- `PUT /api/sales/:id/status` - Cambiar estado

## 🛡️ Seguridad

- ⚠️ **NUNCA** subas archivos `.env` al repositorio
- Cambia el `JWT_SECRET` en producción
- Usa contraseñas seguras para la base de datos
- Habilita SSL/HTTPS en producción

## 📝 Licencia

ISC - Rodrigo Quiroz © 2025
