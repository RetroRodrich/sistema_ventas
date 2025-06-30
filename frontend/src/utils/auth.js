import { API_BASE_URL } from '../Conexion';

/**
 * Obtiene el token JWT del localStorage
 */
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

/**
 * Obtiene los headers con autenticación
 */
export const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

/**
 * Hace una petición autenticada al backend
 * @param {string} endpoint - Endpoint de la API (sin el prefijo /api)
 * @param {Object} options - Opciones de fetch
 */
export const authenticatedFetch = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`}`;
  
  const config = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers
    }
  };

  const response = await fetch(url, config);
  
  // Si es 401, el token expiró o es inválido
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
  }

  return response;
};

/**
 * Verifica si el usuario está autenticado
 */
export const isAuthenticated = () => {
  return !!getAuthToken();
};

/**
 * Obtiene la información del usuario del localStorage
 */
export const getCurrentUser = () => {
  const userData = localStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
};

/**
 * Verifica si el usuario es admin
 */
export const isAdmin = () => {
  const user = getCurrentUser();
  return user && user.role === 'admin';
};

/**
 * Logout - elimina token y datos del usuario
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};
