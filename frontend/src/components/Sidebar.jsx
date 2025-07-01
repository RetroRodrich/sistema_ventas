
import React, { useMemo } from 'react'
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
 *
 * Accesibilidad:
 * - El overlay permite cerrar el menú tocando fuera o con Escape/Enter.
 * - El menú es navegable por teclado y usa roles ARIA.
 *
 * Optimización:
 * - Memoización de usuario y menú.
 * - Acceso a localStorage solo una vez.
 * - El overlay y el sidebar usan z-index correctos para evitar bloqueos.
 */

// Menú de navegación principal (memoizable)
const menuItems = [
  {
    to: '/',
    icon: <MdOutlineHome size={20} />, 
    label: 'Escritorio',
    path: '/',
  },
  {
    to: '/products',
    icon: <MdOutlineCategory size={20} />, 
    label: 'Productos',
    path: '/products',
  },
  {
    to: '/sales',
    icon: <MdOutlineShoppingCart size={20} />, 
    label: 'Generar Venta',
    path: '/sales',
  },
  {
    to: '/salehistory',
    icon: <MdOutlineBarChart size={20} />, 
    label: 'Historial',
    path: '/salehistory',
  },
]

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation()

  // Memoiza el usuario para evitar re-renderizados y acceso repetido a localStorage
  const { username, userRole } = useMemo(() => {
    const user = JSON.parse(localStorage.getItem('user')) || {}
    return {
      username: user.username || user.name || 'Invitado',
      userRole: user.role === 'admin' ? 'Administrador' : 'Empleado',
    }
  }, [])

  // Cierra el sidebar en móvil al hacer clic en un enlace
  const handleLinkClick = () => {
    if (window.innerWidth < 1024 && onClose) onClose()
  }


  // Detecta si es móvil (para mostrar overlay)
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 1024 : false

  // Cierre accesible con teclado
  const handleOverlayKeyDown = (e) => {
    if ((e.key === 'Escape' || e.key === 'Enter') && onClose) onClose()
  }

  return (
    <>
      {/* Overlay: visible solo en móvil y cuando isOpen. Z-index menor que el sidebar. */}
      <div
        className="sidebar-overlay"
        aria-label="Cerrar menú lateral"
        tabIndex={isOpen && isMobile ? 0 : -1}
        onClick={isOpen && isMobile ? onClose : undefined}
        onKeyDown={isOpen && isMobile ? handleOverlayKeyDown : undefined}
        role="button"
        style={{
          display: isOpen && isMobile ? 'block' : 'none',
        }}
      />

      <aside className={`sidebar${isOpen ? ' open' : ''}`} aria-label="Menú lateral de navegación">
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
          {menuItems.map(item => (
            <li key={item.to}>
              <Link
                to={item.to}
                className={location.pathname === item.path ? 'active link' : 'link'}
                onClick={handleLinkClick}
                tabIndex={0}
                aria-current={location.pathname === item.path ? 'page' : undefined}
              >
                {item.icon} {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="sidebar-footer">
          © 2025 MiniSales
        </div>
      </aside>
    </>
  )
}

export default React.memo(Sidebar)