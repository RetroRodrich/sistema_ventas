import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Login from './pages/Login';
import './styles/App.css';

function App() {
  const [isLogged, setIsLogged] = useState(!!localStorage.getItem('token'));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // <--- Nuevo estado
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLogged(false);
    navigate('/');
  };

  // Abre el sidebar (desde el botón hamburguesa)
  const openSidebar = () => setIsSidebarOpen(true);
  // Cierra el sidebar (desde el overlay o menú)
  const closeSidebar = () => setIsSidebarOpen(false);

  if (!isLogged) {
    return <Login onLogin={() => setIsLogged(true)} />;
  }

  return (
    <>
      <Navbar onLogout={handleLogout} onOpenSidebar={openSidebar} />
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      {isSidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}
      <div className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/sales" element={<Sales />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
