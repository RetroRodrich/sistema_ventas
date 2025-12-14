// URL del backend API
// En desarrollo usa la variable de entorno, en producción la URL de Railway/Heroku
export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';