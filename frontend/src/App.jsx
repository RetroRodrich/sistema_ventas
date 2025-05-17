import React, { useState } from 'react';
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLogged(false);
    navigate('/login');
  };

  if (!isLogged) {
    return (
      <Routes>
        <Route
          path="/register"
          element={<Register onRegister={() => setIsLogged(true)} />}
        />
        <Route
          path="*"
          element={<Login onLogin={() => setIsLogged(true)} />}
        />
      </Routes>
    );
  }

  return (
    <>
      <Navbar onLogout={handleLogout} onOpenSidebar={() => setIsSidebarOpen(true)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}
      <div className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/salehistory" element={<SaleHistory />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
