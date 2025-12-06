# 📝 Instrucciones de Configuración - Sistema de Ventas

## ✅ Archivos Creados

Se han creado los siguientes archivos de configuración:

### Backend
- ✅ `backend/.env` - Variables de entorno configuradas
- ✅ `backend/.env.example` - Plantilla de ejemplo

### Frontend
- ✅ `frontend/.env` - Variables de entorno configuradas
- ✅ `frontend/.env.example` - Plantilla de ejemplo

### Documentación
- ✅ `README.md` - Instrucciones completas del sistema

## 🔧 Cambios Realizados

### 1. Eliminación del Servicio de Predicciones Python

Se ha eliminado la integración con el servicio `predict_service`:

**Archivos modificados:**
- `backend/routes/dashboard.js` - Eliminadas llamadas a Python API
- `backend/config.js` - Eliminada variable `PYTHON_API_URL`
- `frontend/src/pages/Home.jsx` - Actualizados textos de "ML/IA" a "Proyección"

**Funcionalidad actual:**
- Las proyecciones ahora se calculan con un incremento del 5% sobre los datos históricos
- No se requiere el servicio Python para funcionar
- El sistema es completamente funcional solo con Node.js y React

### 2. Dependencia Opcional

La dependencia `node-fetch` en `backend/package.json` ya no es necesaria (antes se usaba para llamar al servicio Python).

**Opcional:** Puedes eliminarla ejecutando:
```bash
cd backend
npm uninstall node-fetch
```

## 📋 Configuración Inicial

### 1. Configurar Variables de Entorno

**Backend** (`backend/.env`):
```env
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=inventory_sales_db
DB_USER=root
DB_PASSWORD=           # ⚠️ IMPORTANTE: Configura tu contraseña aquí
JWT_SECRET=secreto_super_seguro_cambiar_en_produccion
```

**Frontend** (`frontend/.env`):
```env
VITE_BACKEND_URL=http://localhost:5000
```

### 2. Crear Base de Datos

Ejecuta el SQL proporcionado en tu servidor MySQL para crear las tablas necesarias.

### 3. Instalar Dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 4. Ejecutar el Sistema

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## 🎯 Sistema Listo

El sistema ahora está configurado para funcionar **sin dependencias del predict_service**:

- ✅ Backend en `http://localhost:5000`
- ✅ Frontend en `http://localhost:5173`
- ✅ Proyecciones calculadas automáticamente
- ✅ Sin necesidad de servicios externos

## 🚫 Carpeta Ignorada

La carpeta `predict_service/` puede ser ignorada o eliminada si no planeas usarla.

---

**Nota**: Todos los archivos `.env` están en `.gitignore` y no se subirán al repositorio.
