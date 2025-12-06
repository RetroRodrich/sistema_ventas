# 🛒 Sistema de Ventas - Configuración

Sistema completo de gestión de ventas e inventario para minimarket con frontend en React y backend en Node.js.

## 📋 Requisitos Previos

- **Node.js** v16 o superior
- **MySQL** 8.0 o superior
- **npm** o **yarn**

## 🚀 Instalación

### 1. Configurar Base de Datos

Ejecuta el siguiente script SQL en tu servidor MySQL:

```sql
-- Crear base de datos
CREATE DATABASE IF NOT EXISTS inventory_sales_db;
USE inventory_sales_db;

-- Ejecutar las tablas del archivo schema.sql proporcionado
```

### 2. Configurar Backend

```bash
cd backend
npm install
```

Copia el archivo `.env.example` a `.env` y configura tus variables:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales:

```env
# Configuración del servidor
NODE_ENV=development
PORT=5000

# URL del frontend (para CORS)
FRONTEND_URL=http://localhost:5173

# Configuración de la base de datos MySQL
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=inventory_sales_db
DB_USER=root
DB_PASSWORD=tu_password_aqui

# JWT Secret para autenticación
JWT_SECRET=un_secreto_muy_seguro
```

### 3. Configurar Frontend

```bash
cd frontend
npm install
```

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

Edita el archivo `.env`:

```env
# URL del backend API
VITE_BACKEND_URL=http://localhost:5000
```

## ▶️ Ejecutar el Sistema

### Iniciar Backend

```bash
cd backend
npm start
```

El backend estará disponible en: `http://localhost:5000`

### Iniciar Frontend

```bash
cd frontend
npm run dev
```

El frontend estará disponible en: `http://localhost:5173`

## 👤 Usuario por Defecto

Puedes crear un usuario administrador ejecutando el script:

```bash
cd backend
node create_test_user.js
```

O registrarte directamente desde la interfaz web.

## 🔧 Scripts Disponibles

### Backend

- `npm start` - Inicia el servidor
- `npm run dev` - Inicia con nodemon (desarrollo)

### Frontend

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Compilar para producción
- `npm run preview` - Vista previa de producción
- `npm test` - Ejecutar tests

## 📁 Estructura del Proyecto

```
sistema_ventas/
├── backend/
│   ├── config/          # Configuración de BD
│   ├── middleware/      # Auth, validación, rate limiting
│   ├── routes/          # Rutas de la API
│   ├── .env            # Variables de entorno (no versionar)
│   └── index.js        # Punto de entrada
├── frontend/
│   ├── src/
│   │   ├── components/  # Componentes reutilizables
│   │   ├── pages/       # Páginas principales
│   │   ├── styles/      # Estilos CSS
│   │   └── utils/       # Utilidades
│   └── .env            # Variables de entorno (no versionar)
```

## 🛡️ Seguridad

- ⚠️ **NUNCA** subas archivos `.env` al repositorio
- Cambia el `JWT_SECRET` en producción
- Usa contraseñas seguras para la base de datos
- Habilita SSL en producción

## 📞 Soporte

Para problemas o dudas, contacta al administrador del sistema.

---

**Nota**: Este sistema NO incluye el servicio de predicciones con ML. Usa proyecciones simples basadas en histórico.
