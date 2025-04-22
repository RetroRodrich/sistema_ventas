import React, { useState } from 'react';
import Sidebar from './Sidebar'; // Importamos el componente Sidebar
import '../styles/Navbar.css'; // Importamos los estilos

const Navbar = () => {
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
          <button className="navbar-button">Cerrar Sesión</button>
        </div>
      </nav>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
    </>
  );
};

export default Navbar;