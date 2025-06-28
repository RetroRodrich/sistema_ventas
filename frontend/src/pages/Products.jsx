import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../Conexion";
import AddProductModal from "../components/AddProductModal";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import { HiOutlineShoppingBag, HiPlus } from "react-icons/hi2";
import {
  FiEdit2,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { HiOutlineSearch, HiOutlineX } from "react-icons/hi";
import "../styles/Products.css";

/**
 * Products - Página principal de productos.
 * Permite listar, buscar, filtrar, agregar, editar y eliminar productos.
 */
function Products() {
  // =======================
  // Estados principales
  // =======================
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // =======================
  // Efectos: cargar productos y categorías al montar
  // =======================
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/products`)
      .then((response) => response.json())
      .then((data) => setProducts(data))
      .catch((error) =>
        console.error("Error al obtener los productos:", error)
      );
    fetch(`${API_BASE_URL}/api/products/categories`)
      .then((response) => response.json())
      .then((data) => setCategories(data))
      .catch((error) =>
        console.error("Error al obtener las categorías:", error)
      );
  }, []);

  // =======================
  // Handlers de búsqueda y filtrado
  // =======================
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleFilterChange = (e) => setFilter(e.target.value);

  // =======================
  // Agregar producto
  // =======================
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

  // =======================
  // Editar producto
  // =======================
  const handleEdit = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  // =======================
  // Eliminar producto
  // =======================
  const handleDelete = (id) => {
    setProductToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // =======================
  // Confirmar eliminación
  // =======================
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

  // =======================
  // Abrir modal para agregar producto
  // =======================
  const handleOpenAddModal = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  // =======================
  // Cerrar modal de producto
  // =======================
  const handleCloseModal = () => {
    setSelectedProduct(null);
    setIsModalOpen(false);
  };

  // =======================
  // Guardar cambios de producto editado
  // =======================
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

  // =======================
  // Cambiar cantidad de filas por página
  // =======================
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // =======================
  // Paginación
  // =======================
  const handlePrevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((p) => Math.min(p + 1, totalPages));

  // =======================
  // Filtrado y paginación de productos
  // =======================
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

  // =======================
  // Renderizado principal
  // =======================
  return (
    <div className="products-page">
      {/* Encabezado */}
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
        {/* Controles de búsqueda, filtro y agregar */}
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
            {searchTerm && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchTerm("")}
                title="Limpiar búsqueda"
                type="button"
              >
                <HiOutlineX />
              </button>
            )}
          </div>
          <div className="products-controls-row">
            <select
              value={filter}
              onChange={handleFilterChange}
              className="filter-dropdown"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            <div className="rows-per-page-wrapper">
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="filter-dropdown"
                title="Filas por página"
              >
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="30">30</option>
                <option value="999999">Todos</option>
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
          {/* Paginación integrada en controles */}
          <div className="pagination-bar">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1 || totalPages === 0}
            >
              <FiChevronLeft />
            </button>
            <span>
              {totalPages === 0
                ? "Sin páginas"
                : `Página ${currentPage} de ${totalPages}`}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      </div>
      {/* Tabla de productos */}
      <div className="products-table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th></th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Stock Mínimo</th>
              <th style={{ textAlign: "center" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", color: "#888" }}>
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
                  <td style={{ textAlign: "center" }}>{product.stock}</td>
                  <td style={{ color: "#a6a6a6", textAlign: "center" }}>
                    {product.minStock ?? "—"}
                  </td>
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
