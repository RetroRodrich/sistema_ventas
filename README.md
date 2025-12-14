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

## 🐳 Despliegue en Producción

### Railway (Recomendado para BD + Backend)

#### 1. Base de Datos MySQL
1. Ir a [Railway](https://railway.app) → New Project → Database → MySQL
2. Copiar las variables de conexión que Railway proporciona:
   - `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`

#### 2. Backend en Railway
1. New Project → Deploy from GitHub repo
2. Seleccionar el repositorio y la carpeta `/backend`
3. Configurar variables de entorno:
   ```
   NODE_ENV=production
   PORT=5000
   DB_HOST=<MYSQL_HOST de Railway>
   DB_PORT=<MYSQL_PORT de Railway>
   DB_DATABASE=<MYSQL_DATABASE de Railway>
   DB_USER=<MYSQL_USER de Railway>
   DB_PASSWORD=<MYSQL_PASSWORD de Railway>
   JWT_SECRET=<generar uno seguro de 64+ caracteres>
   FRONTEND_URL=https://tu-frontend.vercel.app
   ```
4. Railway detectará el `Procfile` automáticamente

### Heroku (Alternativa para Backend)

```bash
# Instalar Heroku CLI
# Login
heroku login

# Crear app
cd backend
heroku create petworld-backend

# Configurar variables
heroku config:set NODE_ENV=production
heroku config:set DB_HOST=<host_mysql>
heroku config:set DB_DATABASE=<nombre_bd>
heroku config:set DB_USER=<usuario>
heroku config:set DB_PASSWORD=<password>
heroku config:set JWT_SECRET=<secreto_seguro>
heroku config:set FRONTEND_URL=https://tu-frontend.vercel.app

# Deploy
git subtree push --prefix backend heroku main
```

### Frontend en Vercel/Netlify

#### Vercel (Recomendado)
1. Ir a [Vercel](https://vercel.com) → Import Project
2. Seleccionar repositorio → Root Directory: `frontend`
3. Build Settings:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output: `dist`
4. Environment Variables:
   ```
   VITE_BACKEND_URL=https://tu-backend.railway.app
   ```

#### Netlify
1. Ir a [Netlify](https://netlify.com) → Add new site
2. Configurar:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
3. Environment Variables:
   ```
   VITE_BACKEND_URL=https://tu-backend.railway.app
   ```

> **Nota:** El archivo `frontend/public/_redirects` ya está configurado para SPA routing en Netlify.

### Variables de Entorno Resumen

| Servicio | Variable | Valor |
|----------|----------|-------|
| Backend | `NODE_ENV` | production |
| Backend | `PORT` | 5000 (Railway lo asigna automáticamente) |
| Backend | `DB_HOST` | Host de MySQL en Railway |
| Backend | `DB_DATABASE` | Nombre de la BD |
| Backend | `DB_USER` | Usuario MySQL |
| Backend | `DB_PASSWORD` | Contraseña MySQL |
| Backend | `JWT_SECRET` | Secreto de 64+ caracteres |
| Backend | `FRONTEND_URL` | URL del frontend desplegado |
| Frontend | `VITE_BACKEND_URL` | URL del backend desplegado |

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
