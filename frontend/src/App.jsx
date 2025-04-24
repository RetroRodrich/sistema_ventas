import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Login from './pages/Login';
import './styles/App.css';

function App() {
  const [isLogged, setIsLogged] = useState(!!localStorage.getItem('token'));
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLogged(false);
    navigate('/');
  };

  if (!isLogged) {
    return <Login onLogin={() => setIsLogged(true)} />;
  }

  return (
    <>
      <Navbar onLogout={handleLogout} />
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
