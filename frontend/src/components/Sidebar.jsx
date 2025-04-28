import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  MdOutlineHome,
  MdOutlineCategory,
  MdOutlineShoppingCart,
  MdOutlineBarChart,
  MdOutlinePeople
} from 'react-icons/md'
import { HiOutlineShoppingBag } from 'react-icons/hi'
import '../styles/Sidebar.css'

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation()

  const handleLinkClick = () => {
    if (window.innerWidth < 1024 && onClose) onClose()
  }

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`}>
      {/* Header / Logo */}
      <div className="sidebar-header sidebar-header-compact">
        <HiOutlineShoppingBag className="sidebar-header-icon" size={28} />
        <span className="sidebar-header-title" style={{marginLeft: '5px', color: '#2fcabd'}}>More Sales...</span>
      </div>

      {/* User info */}
      <div className="sidebar-user">
        <img
          src="https://i.pravatar.cc/44"
          alt="avatar"
          className="sidebar-avatar"
        />
        <div className="sidebar-user-info">
          <div className="sidebar-username">Montenegro John</div>
          <div className="sidebar-status">● Online</div>
        </div>
      </div>

      {/* Navigation links */}
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
            <MdOutlineShoppingCart size={20} /> Ventas
          </Link>
        </li>
        <li>
          <a href="#" className="link" onClick={handleLinkClick}>
            <MdOutlineBarChart size={20} /> Reportes
          </a>
        </li>
        <li>
          <a href="#" className="link" onClick={handleLinkClick}>
            <MdOutlinePeople size={20} /> Usuarios
          </a>
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