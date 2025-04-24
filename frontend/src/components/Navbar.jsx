import React, { useState } from 'react';
import Sidebar from './Sidebar';
import '../styles/Navbar.css';

const Navbar = ({ onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-left-section">
          <button className="navbar-hamburger-button" onClick={toggleSidebar}>
            ☰
          </button>
          <h1 className="navbar-title">Bienvenido usuario</h1>
        </div>
        <div className="navbar-buttons">
          <button className="navbar-button">Mi Perfil</button>
          <button className="navbar-button" onClick={onLogout}>Cerrar sesión</button>
        </div>
      </nav>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
    </>
  );
};

export default Navbar;