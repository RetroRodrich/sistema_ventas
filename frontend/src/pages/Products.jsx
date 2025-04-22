import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard'; // Importamos el componente de la tarjeta
import '../styles/Products.css'; // Archivo de estilos para la página

function Products() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  // URL base de la API
  const API_BASE_URL = 'http://localhost:5000/api';

  useEffect(() => {
    // Llamada a la API para obtener los productos
    fetch(`${API_BASE_URL}/products`) // Concatenamos la URL base con el endpoint
      .then((response) => response.json())
      .then((data) => setProducts(data))
      .catch((error) => console.error('Error al obtener los productos:', error));
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const handleAddProduct = () => {
    console.log('Agregar producto');
  };

  // Filtrar productos por búsqueda y categoría
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || product.category === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="products-page">
      <h1>Productos</h1>
      <div className="products-controls">
        <input
          type="text"
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-bar"
        />
        <select value={filter} onChange={handleFilterChange} className="filter-dropdown">
          <option value="all">Todos</option>
          <option value="Electrodomésticos">Electrodomésticos</option>
          <option value="Tecnología">Tecnología</option>
          <option value="Ropa">Ropa</option>
        </select>
        <button onClick={handleAddProduct} className="add-product-button">
          Agregar Producto
        </button>
      </div>
      <div className="products-grid">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

export default Products;