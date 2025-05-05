import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../Conexion";
import AddProductModal from "../components/AddProductModal";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import { HiOutlineShoppingBag, HiPlus } from "react-icons/hi2"; // Cambia a HiPlus para un icono más moderno
import {
  FiEdit2,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { HiOutlineSearch } from "react-icons/hi";
import "../styles/Products.css";

function Products() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/products`)
      .then((response) => response.json())
      .then((data) => setProducts(data))
      .catch((error) =>
        console.error("Error al obtener los productos:", error)
      );
  }, []);

  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleFilterChange = (e) => setFilter(e.target.value);

  const handleAddProduct = (productData) => {
    fetch(`${API_BASE_URL}/api/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Error al agregar el producto");
        return response.json();
      })
      .then((newProduct) => {
        setProducts((prevProducts) => [...prevProducts, newProduct]);
        setIsModalOpen(false);
      })
      .catch((error) => console.error("Error al agregar el producto:", error));
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    setProductToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    fetch(`${API_BASE_URL}/api/products/${productToDelete}`, {
      method: "DELETE",
    })
      .then(() => {
        setProducts(
          products.filter((product) => product.id !== productToDelete)
        );
        setIsDeleteModalOpen(false);
      })
      .catch((error) => console.error("Error al eliminar el producto:", error));
  };

  const handleOpenAddModal = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
    setIsModalOpen(false);
  };

  const handleSaveProduct = (updatedProduct) => {
    fetch(`${API_BASE_URL}/api/products/${selectedProduct.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedProduct),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Error al guardar el producto");
        return response.json();
      })
      .then((savedProduct) => {
        setProducts((prevProducts) =>
          prevProducts.map((p) => (p.id === savedProduct.id ? savedProduct : p))
        );
        setIsModalOpen(false);
      })
      .catch((error) => console.error("Error al guardar el producto:", error));
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handlePrevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((p) => Math.min(p + 1, totalPages));

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || product.category === filter;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="products-page">
      <div className="products-header-card">
        <div className="products-header">
          <span className="products-icon">
            <HiOutlineShoppingBag />
          </span>
          <div className="products-header-titles">
            <span className="products-title">Catálogo de Productos</span>
            <span className="products-subtitle">
              Gestiona y visualiza tus productos de manera rápida y sencilla.
            </span>
          </div>
        </div>
        <div className="products-controls">
          <div className="search-bar-wrapper">
            <span className="search-icon">
              <HiOutlineSearch />
            </span>
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-bar"
            />
          </div>
          <div className="products-controls-row">
            <select
              value={filter}
              onChange={handleFilterChange}
              className="filter-dropdown"
            >
              <option value="all">Todas las categorías</option>
              <option value="Electrodomésticos">Electrodomésticos</option>
              <option value="Tecnología">Tecnología</option>
              <option value="Ropa">Ropa</option>
            </select>
            <div className="rows-per-page-wrapper">
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="filter-dropdown"
                title="Filas por página"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="30">30</option>
              </select>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="add-product-button"
              title="Agregar producto"
            >
              <HiPlus style={{ marginRight: 4 }} />
              Agregar
            </button>
          </div>
        </div>
      </div>
      <div className="products-table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th></th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th style={{ textAlign: "center" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", color: "#888" }}>
                  No hay productos
                </td>
              </tr>
            ) : (
              paginatedProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="table-product-image"
                    />
                  </td>
                  <td>{product.name}</td>
                  <td>{product.category || "Sin categoría"}</td>
                  <td>S/ {Number(product.price).toFixed(2)}</td>
                  <td>{product.stock}</td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      className="table-action edit"
                      title="Editar"
                      onClick={() => handleEdit(product)}
                    >
                      <FiEdit2 size={17} />
                    </button>
                    <button
                      className="table-action delete"
                      title="Eliminar"
                      onClick={() => handleDelete(product.id)}
                    >
                      <FiTrash2 size={17} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Paginación */}
      <div className="pagination-bar">
        <button onClick={handlePrevPage} disabled={currentPage === 1}>
          <FiChevronLeft />
        </button>
        <span>
          Página {currentPage} de {totalPages}
        </span>
        <button onClick={handleNextPage} disabled={currentPage === totalPages}>
          <FiChevronRight />
        </button>
      </div>
      {/* Modales */}
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
