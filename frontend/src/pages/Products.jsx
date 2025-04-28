import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../Conexion';
import ProductCard from '../components/ProductCard';
import AddProductModal from '../components/AddProductModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import '../styles/Products.css';


function Products() {
  // Estado para productos y controles de UI
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [categories, setCategories] = useState([]);

  // Obtener productos al cargar la página
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/products`)
      .then((response) => response.json())
      .then((data) => {
        setProducts(data); // Cada producto debe tener un id único
      })
      .catch((error) => console.error('Error al obtener los productos:', error));
  }, []);

  // Obtener categorías al cargar la página
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/categories`)
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error('Error al obtener categorías:', err));
  }, []);

  // Buscar productos por nombre
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filtrar productos por categoría
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  // Agregar producto (se llama desde el modal)
  const handleAddProduct = (productData) => {
    fetch(`${API_BASE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Error al agregar el producto');
        }
        return response.json();
      })
      .then((newProduct) => {
        setProducts((prevProducts) => [...prevProducts, newProduct]);
        setIsModalOpen(false);
      })
      .catch((error) => console.error('Error al agregar el producto:', error));
  };

  // Abrir modal para editar producto
  const handleEdit = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  // Abrir modal para eliminar producto
  const handleDelete = (id) => {
    setProductToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // Confirmar eliminación de producto
  const confirmDelete = () => {
    fetch(`${API_BASE_URL}/api/products/${productToDelete}`, {
      method: 'DELETE',
    })
      .then(() => {
        setProducts(products.filter((product) => product.id !== productToDelete));
        setIsDeleteModalOpen(false);
      })
      .catch((error) => console.error('Error al eliminar el producto:', error));
  };

  // Abrir modal para agregar producto
  const handleOpenAddModal = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  // Cerrar modal de agregar/editar producto
  const handleCloseModal = () => {
    setSelectedProduct(null);
    setIsModalOpen(false);
  };

  // Guardar cambios al editar producto
  const handleSaveProduct = (updatedProduct) => {
    fetch(`${API_BASE_URL}/api/products/${selectedProduct.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProduct),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Error al guardar el producto');
        }
        return response.json();
      })
      .then((savedProduct) => {
        setProducts((prevProducts) =>
          prevProducts.map((p) => (p.id === savedProduct.id ? savedProduct : p))
        );
        setIsModalOpen(false);
      })
      .catch((error) => console.error('Error al guardar el producto:', error));
  };

  // Filtrar productos por búsqueda y categoría
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || product.category === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="products-page">
      <div className="products-header">
        <span className="products-icon">🛒</span>
        <h2>Catálogo de Productos</h2>
        <p className="products-subtitle">Gestiona y visualiza tus productos de manera rápida y sencilla.</p>
      </div>
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
        <button onClick={handleOpenAddModal} className="add-product-button">
          + Agregar Producto
        </button>
      </div>
      <div className="products-grid">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
      {isModalOpen && (
        <AddProductModal
          onClose={handleCloseModal}
          onAddProduct={handleAddProduct}
          product={selectedProduct}
          onSaveProduct={handleSaveProduct}
        />
      )}
      {isDeleteModalOpen && (
        <DeleteConfirmationModal
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

export default Products;