/**
 * Navbar - Barra de navegación principal con diseño moderno y elegante.
 * 
 * Características:
 * - Diseño glass-morphism con gradiente moderno
 * - Notificaciones de stock bajo en tiempo real
 * - Responsive design optimizado
 * - Animaciones suaves y transiciones elegantes
 * - Integración con WebSocket para actualizaciones en tiempo real
 *
 * Props:
 * - onLogout: función para cerrar sesión del usuario
 * - onOpenSidebar: función para abrir/cerrar el sidebar lateral
 */
import React, { useState, useRef, useEffect } from 'react'
import { MdMenu, MdLogout, MdNotifications } from 'react-icons/md'
import '../styles/Navbar.css'
import { API_BASE_URL } from "../Conexion"
import socket from './socket'

const Navbar = ({ onLogout, onOpenSidebar }) => {
  // Estado para controlar la visibilidad del panel de notificaciones
  const [showNotifications, setShowNotifications] = useState(false)
  // Estado para almacenar la lista de productos con stock bajo
  const [lowStockProducts, setLowStockProducts] = useState([])
  // Referencia al contenedor de notificaciones para detectar clics externos
  const notifRef = useRef(null)

  /**
   * useEffect para cargar productos con stock bajo al montar el componente
   * y configurar la escucha de eventos WebSocket para actualizaciones en tiempo real.
   */
  useEffect(() => {
    // Función para obtener productos con stock bajo desde la API
    const fetchLowStock = () => {
      fetch(`${API_BASE_URL}/api/products/low-stock`)
        .then(res => res.json())
        .then(data => setLowStockProducts(Array.isArray(data) ? data : []))
        .catch(() => setLowStockProducts([]))
    }

    fetchLowStock(); // Carga inicial

    // Configurar escucha de eventos WebSocket para cambios de stock
    socket.on('stockChanged', fetchLowStock);

    // Cleanup: remover event listener al desmontar
    return () => {
      socket.off('stockChanged', fetchLowStock);
    }
  }, [])

  /**
   * useEffect para manejar clics fuera del panel de notificaciones
   * y cerrarlo automáticamente para mejorar la UX.
   */
  useEffect(() => {
    if (!showNotifications) return

    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotifications])

  /**
   * Alterna la visibilidad del panel de notificaciones
   */
  const handleNotificationsClick = () => {
    setShowNotifications((prev) => !prev)
  }

  return (
    <nav className="navbar">
      {/* Sección izquierda: Menú hamburguesa y logo */}
      <div className="navbar-left">
        <button 
          className="navbar-hamburger" 
          onClick={onOpenSidebar}
          aria-label="Abrir menú lateral"
        >
          <MdMenu size={24} />
        </button>
        <span className="navbar-sucursal">MiniSales</span>
      </div>

      {/* Sección derecha: Notificaciones y botón de salir */}
      <div className="navbar-right" style={{ position: "relative", display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* Panel de notificaciones */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            className={`navbar-notifications${showNotifications ? " active" : ""}`}
            title="Notificaciones de stock bajo"
            onClick={handleNotificationsClick}
            aria-label={`Notificaciones ${lowStockProducts.length > 0 ? `(${lowStockProducts.length})` : ''}`}
          >
            <MdNotifications size={25} />
            {lowStockProducts.length > 0 && (
              <span className="navbar-notifications-badge">{lowStockProducts.length}</span>
            )}
          </button>
          
          {/* Burbuja de notificaciones con posicionamiento preservado */}
          {showNotifications && (
            <div className="navbar-notifications-bubble elegant left">
              <ul className="navbar-notifications-list">
                {lowStockProducts.length === 0 ? (
                  <li>✅ Sin alertas de stock bajo</li>
                ) : (
                  lowStockProducts.map(prod => (
                    <li key={prod.id}>
                      📦 {prod.name} | Stock: {prod.stock}, Mínimo: {prod.minStock}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Botón de cerrar sesión */}
        <button 
          className="navbar-logout" 
          onClick={onLogout}
          aria-label="Cerrar sesión"
        >
          <MdLogout className="navbar-logout-icon" size={16} />
          <span className="navbar-logout-text">Salir</span>
        </button>
      </div>
    </nav>
  )
}

export default Navbar