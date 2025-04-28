import React from 'react'
import { MdMenu, MdLogout, MdPerson } from 'react-icons/md'
import '../styles/Navbar.css'

const Navbar = ({ onLogout, onOpenSidebar }) => {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="navbar-hamburger" onClick={onOpenSidebar}>
          <MdMenu size={24} />
        </button>
        <span className="navbar-sucursal">MiniSales</span>
      </div>
      <div className="navbar-right">
        <span className="navbar-user">
          <MdPerson className="navbar-user-icon" size={20} />
          <span className="navbar-user-text">Admin Users</span>
        </span>
        <button className="navbar-logout" onClick={onLogout}>
          <MdLogout className="navbar-logout-icon" size={20} />
          <span className="navbar-logout-text">Cerrar sesión</span>
        </button>
      </div>
    </nav>
  )
}

export default Navbar