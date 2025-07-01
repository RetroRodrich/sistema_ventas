// Archivo para inicializar y exportar el socket.io-client
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../Conexion';

const socket = io(API_BASE_URL, {
  autoConnect: false, // Solo se conecta manualmente cuando el usuario está autenticado
  transports: ['websocket'],
});

export default socket;
