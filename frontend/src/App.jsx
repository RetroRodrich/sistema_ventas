import socket from './components/socket';
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Products from './pages/Products';
import Sales from './pages/Sales';
import SaleHistory from './pages/SaleHistory';
import Login from './pages/Login';
import Register from './pages/Register';
import './styles/App.css';

function App() {
  const [isLogged, setIsLogged] = useState(!!localStorage.getItem('token'));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Conectar/desconectar socket según autenticación
  useEffect(() => {
    if (isLogged) {
      if (!socket.connected) socket.connect();
    } else {
      if (socket.connected) socket.disconnect();
    }
    // Limpieza opcional al desmontar
    return () => {
      if (socket.connected) socket.disconnect();
    };
  }, [isLogged]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLogged(false);
    navigate('/login');
  };

  const handleLogin = () => {
    setIsLogged(true);
    navigate('/');
  };

  const handleRegister = () => {
    setIsLogged(true);
    navigate('/');
  };

  // Escuchar cambios en el localStorage para manejar logout desde otros componentes
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('token');
      const currentLoggedState = !!token;
      
      if (currentLoggedState !== isLogged) {
        setIsLogged(currentLoggedState);
        if (!currentLoggedState) {
          navigate('/login');
        }
      }
    };

    // Verificar al montar
    checkAuthStatus();

    // Escuchar cambios en storage (para logout desde otros tabs)
    window.addEventListener('storage', checkAuthStatus);
    
    // Verificar periódicamente (para logout desde mismo tab)
    const interval = setInterval(checkAuthStatus, 1000);

    return () => {
      window.removeEventListener('storage', checkAuthStatus);
      clearInterval(interval);
    };
  }, [isLogged, navigate]);

  return (
    <>
      {isLogged && (
        <>
          <Navbar onLogout={handleLogout} onOpenSidebar={() => setIsSidebarOpen(true)} />
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          {isSidebarOpen && (
            <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
          )}
        </>
      )}
      
      <div className={isLogged ? "content" : ""}>
        <Routes>
          {/* Rutas públicas - siempre disponibles */}
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register onRegister={handleRegister} />} />
          
          {/* Rutas protegidas - solo si está logueado */}
          {isLogged ? (
            <>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/salehistory" element={<SaleHistory />} />
            </>
          ) : (
            <Route path="*" element={<Login onLogin={handleLogin} />} />
          )}
        </Routes>
      </div>
    </>
  );
}

export default App;
