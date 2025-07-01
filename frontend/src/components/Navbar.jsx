import React, { useState, useRef, useEffect } from 'react'
import { MdMenu, MdLogout, MdNotifications } from 'react-icons/md'
import '../styles/Navbar.css'
import { API_BASE_URL } from "../Conexion"
import socket from './socket'

/**
 * Navbar - Barra de navegación principal de la aplicación.
 * Muestra el nombre de la sucursal, botón de menú lateral, notificaciones de stock bajo y botón de cierre de sesión.
 *
 * Props:
 * - onLogout: función para cerrar sesión.
 * - onOpenSidebar: función para abrir el sidebar.
 */
const Navbar = ({ onLogout, onOpenSidebar }) => {
  // Estado para mostrar/ocultar burbuja de notificaciones
  const [showNotifications, setShowNotifications] = useState(false)
  // Estado para almacenar productos con bajo stock
  const [lowStockProducts, setLowStockProducts] = useState([])
  // Referencia al contenedor de notificaciones para detectar clics fuera
  const notifRef = useRef(null)

  /**
   * useEffect para cargar productos con bajo stock al montar el componente
   * y actualizar cada 20 segundos.
   */
  useEffect(() => {
    const fetchLowStock = () => {
      fetch(`${API_BASE_URL}/api/products/low-stock`)
        .then(res => res.json())
        .then(data => setLowStockProducts(Array.isArray(data) ? data : []))
        .catch(() => setLowStockProducts([]))
    }

    fetchLowStock(); // Llamada inicial

    // Escuchar evento de stockChanged por WebSocket
    socket.on('stockChanged', fetchLowStock);

    return () => {
      socket.off('stockChanged', fetchLowStock);
    }
  }, [])

  /**
   * useEffect para cerrar la burbuja de notificaciones al hacer clic fuera de ella.
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

  // Alterna la visibilidad de la burbuja de notificaciones
  const handleNotificationsClick = () => {
    setShowNotifications((prev) => !prev)
  }

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="navbar-hamburger" onClick={onOpenSidebar}>
          <MdMenu size={24} />
        </button>
        <span className="navbar-sucursal">MiniSales</span>
      </div>
      <div className="navbar-right" style={{ position: "relative", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            className={`navbar-notifications${showNotifications ? " active" : ""}`}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              marginRight: 0,
              display: "inline-flex",
              alignItems: "center",
              position: "relative"
            }}
            title="Notificaciones"
            onClick={handleNotificationsClick}
          >
            <MdNotifications size={30} color="#2fcabd" />
            <span className="navbar-notifications-badge">{lowStockProducts.length}</span>
          </button>
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
        <button className="navbar-logout" onClick={onLogout}>
          <MdLogout className="navbar-logout-icon" size={15} />
          <span className="navbar-logout-text">Salir</span>
        </button>
      </div>
    </nav>
  )
}

export default Navbar