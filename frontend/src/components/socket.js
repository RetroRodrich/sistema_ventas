// Archivo para inicializar y exportar el socket.io-client
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../Conexion';

const socket = io(API_BASE_URL, {
  autoConnect: true,
  transports: ['websocket'],
});

export default socket;
