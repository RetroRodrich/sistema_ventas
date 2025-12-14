# ============================================
# Pet World Backend - Dockerfile
# ============================================

FROM node:20-alpine

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Exponer puerto
EXPOSE 5000

# Usuario no-root para seguridad
USER node

# Comando de inicio
CMD ["node", "index.js"]
