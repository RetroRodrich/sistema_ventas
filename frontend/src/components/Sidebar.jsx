import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  MdOutlineHome,
  MdOutlineCategory,
  MdOutlineShoppingCart,
  MdOutlineBarChart,
} from 'react-icons/md'
import { FaUserCircle } from 'react-icons/fa'
import { HiOutlineShoppingBag } from 'react-icons/hi'
import '../styles/Sidebar.css'

/**
 * Sidebar - Menú lateral de navegación principal.
 * Muestra información del usuario, enlaces de navegación y un footer.
 *
 * Props:
 * - isOpen: booleano para mostrar/ocultar el sidebar.
 * - onClose: función para cerrar el sidebar (en móvil).
 */
const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation()

  // Obtener usuario desde localStorage
  const user = JSON.parse(localStorage.getItem('user')) || {}
  const username = user.username || user.name || 'Invitado'
  const userRole = user.role === 'admin' ? 'Administrador' : 'Empleado'

  // Cierra el sidebar en móvil al hacer clic en un enlace
  const handleLinkClick = () => {
    if (window.innerWidth < 1024 && onClose) onClose()
  }

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`}>
      {/* Logo y título */}
      <div className="sidebar-header sidebar-header-compact">
        <HiOutlineShoppingBag className="sidebar-header-icon" size={28} />
        <span className="sidebar-header-title">
          More Sales...
        </span>
      </div>

      {/* Información del usuario */}
      <div className="sidebar-user">
        <FaUserCircle className="sidebar-avatar" />
        <div className="sidebar-user-info">
          <div className="sidebar-username">{username}</div>
          <div className="sidebar-role">{userRole}</div>
          <div className="sidebar-status">Online</div>
        </div>
      </div>

      {/* Enlaces de navegación */}
      <ul className="sidebar-menu">
        <li>
          <Link
            to="/"
            className={location.pathname === '/' ? 'active link' : 'link'}
            onClick={handleLinkClick}
          >
            <MdOutlineHome size={20} /> Escritorio
          </Link>
        </li>
        <li>
          <Link
            to="/products"
            className={location.pathname === '/products' ? 'active link' : 'link'}
            onClick={handleLinkClick}
          >
            <MdOutlineCategory size={20} /> Productos
          </Link>
        </li>
        <li>
          <Link
            to="/sales"
            className={location.pathname === '/sales' ? 'active link' : 'link'}
            onClick={handleLinkClick}
          >
            <MdOutlineShoppingCart size={20} /> Generar Venta
          </Link>
        </li>
        <li>
          <Link
            to="/salehistory"
            className={location.pathname === '/salehistory' ? 'active link' : 'link'}
            onClick={handleLinkClick}
          >
            <MdOutlineBarChart size={20} /> Historial
          </Link>
        </li>
      </ul>

      {/* Footer */}
      <div className="sidebar-footer">
        © 2025 MiniSales
      </div>
    </aside>
  )
}

export default Sidebar