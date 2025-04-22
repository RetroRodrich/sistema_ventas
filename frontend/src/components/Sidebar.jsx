import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaBox, FaShoppingCart } from 'react-icons/fa';
import '../styles/Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const handleOverlayClick = (e) => {
    if (e.target.id === 'sidebar-overlay') {
      toggleSidebar();
    }
  };

  return (
    <div
      id="sidebar-overlay"
      className={isOpen ? 'visible' : ''}
      onClick={handleOverlayClick}
    >
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <button className="close-button" onClick={toggleSidebar}>
          ✖ Menú
        </button>
        <ul className="menu">
          <li>
            <Link to="/" className="link" onClick={toggleSidebar}>
              <FaHome style={{ marginRight: '0.5rem' }} /> Inicio
            </Link>
          </li>
          <li>
            <Link to="/products" className="link" onClick={toggleSidebar}>
              <FaBox style={{ marginRight: '0.5rem' }} /> Productos
            </Link>
          </li>
          <li>
            <Link to="/sales" className="link" onClick={toggleSidebar}>
              <FaShoppingCart style={{ marginRight: '0.5rem' }} /> Ventas
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;