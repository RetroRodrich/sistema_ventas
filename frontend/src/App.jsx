import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar'; // Importamos el componente Navbar
import Home from './pages/Home';
import Products from './pages/Products';
import Sales from './pages/Sales';
import './styles/App.css'; // Archivo de estilos

function App() {
  return (
    <Router>
      <Navbar /> {/* Agregamos el Navbar */}
      <div className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/sales" element={<Sales />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
