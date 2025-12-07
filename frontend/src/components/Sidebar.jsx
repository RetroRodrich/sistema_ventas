
import React, { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  MdOutlineHome,
  MdOutlineCategory,
  MdOutlineShoppingCart,
  MdOutlineBarChart,
} from 'react-icons/md'
import { FiUser } from 'react-icons/fi'
import petWorldLogo from '../assets/images/pet-world-logo.png'
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
        {/* Logo de la empresa */}
        <div className="sidebar-logo">
          <img 
            src={petWorldLogo} 
            alt="Pet World Logo" 
            className="sidebar-logo-img"
          />
        </div>

        {/* Información del usuario */}
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            <FiUser />
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-username">{username}</span>
            <span className="sidebar-role">{userRole}</span>
          </div>
          <span className="sidebar-status-dot"></span>
        </div>

        {/* Navegación */}
        <nav className="sidebar-nav">
          <ul className="sidebar-menu">
            {menuItems.map(item => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={handleLinkClick}
                  aria-current={location.pathname === item.path ? 'page' : undefined}
                >
                  <span className="sidebar-link-icon">{item.icon}</span>
                  <span className="sidebar-link-text">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <span>© 2025 Pet World</span>
        </div>
      </aside>
    </>
  )
}

export default React.memo(Sidebar)