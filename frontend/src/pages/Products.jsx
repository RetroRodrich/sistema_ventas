
// =======================
// Imports principales
// =======================
import React, { useState, useEffect } from "react";
import { useProductsFilterAndPagination } from "../hooks/useProductsFilterAndPagination";
import { useProductsPagination } from "../hooks/useProductsPagination";
import { useProductsDebouncedSearch } from "../hooks/useProductsDebouncedSearch";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from "../Conexion";
import { authenticatedFetch, isAuthenticated } from "../utils/auth";
import AddProductModal from "../components/AddProductModal";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import { HiOutlineShoppingBag, HiPlus } from "react-icons/hi2";
import ProductsPaginationBar from "../components/ProductsPaginationBar";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { HiOutlineSearch, HiOutlineX } from "react-icons/hi";
import "../styles/Products.css";
import socket from '../components/socket';


/**
 * Página principal de productos para el sistema de minimarket.
 * Permite listar, buscar, filtrar, agregar, editar y eliminar productos.
 * Optimizada para rendimiento, accesibilidad y mantenibilidad.
 */
function Products() {
  // =======================
  // React Query: acceso al cliente para invalidar caché
  // =======================
  const queryClient = useQueryClient();

  // =======================
  // Estados locales (solo para UI y handlers)
  // =======================

  // =======================
  // Obtener productos con React Query (cache optimizada)
  // =======================
  const {
    data: productsData = [],
    isLoading: productsLoading,
    isFetching: productsFetching,
    error: productsError,
  } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/api/products`);
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    cacheTime: 1000 * 60 * 30, // 30 minutos en caché
  });
  // =======================
  // Efecto: escuchar evento stockChanged por socket.io (actualiza productos en tiempo real)
  // =======================
  useEffect(() => {
    const handleStockChanged = () => {
      queryClient.invalidateQueries(['products']);
    };
    socket.on('stockChanged', handleStockChanged);
    return () => {
      socket.off('stockChanged', handleStockChanged);
    };
  }, [queryClient]);

  // =======================
  // Obtener categorías con React Query (cache optimizada)
  // =======================
  const {
    data: categoriesData = [],
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/api/products/categories`);
      return res.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
    cacheTime: 1000 * 60 * 30, // 30 minutos en caché
  });
  // =======================
  // Prefetch de productos y categorías para mejorar experiencia de usuario
  // =======================
  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ['products'],
      queryFn: async () => {
        const res = await axios.get(`${API_BASE_URL}/api/products`);
        return res.data;
      },
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 30,
    });
    queryClient.prefetchQuery({
      queryKey: ['categories'],
      queryFn: async () => {
        const res = await axios.get(`${API_BASE_URL}/api/products/categories`);
        return res.data;
      },
      staleTime: 1000 * 60 * 10,
      cacheTime: 1000 * 60 * 30,
    });
  }, [queryClient]);
  // =======================
  // Estados para búsqueda, filtro, paginación y modales
  // =======================
  const [searchTerm, setSearchTerm] = useState(""); // Término de búsqueda
  const debouncedSearch = useProductsDebouncedSearch(searchTerm, 350); // Valor debounced
  const [filter, setFilter] = useState("all"); // Filtro de categoría
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal de agregar/editar
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // Modal de eliminar
  const [selectedProduct, setSelectedProduct] = useState(null); // Producto seleccionado para editar
  const [productToDelete, setProductToDelete] = useState(null); // ID de producto a eliminar
  const [itemsPerPage, setItemsPerPage] = useState(10); // Filas por página
  const [currentPage, setCurrentPage] = useState(1); // Página actual
  const [loadingAction, setLoadingAction] = useState(false); // Feedback visual para acciones


  // =======================
  // Efectos de carga inicial eliminados: React Query gestiona la obtención y caché
  // =======================


  // =======================
  // Handlers de búsqueda y filtrado
  // =======================
  /** Cambia el término de búsqueda (debounce automático con hook) */
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  /** Cambia el filtro de categoría */
  const handleFilterChange = (e) => setFilter(e.target.value);

  // =======================
  // Handler: Agregar producto
  // =======================
  /**
   * Agrega un nuevo producto
   * @param {Object} productData
   */
  const handleAddProduct = async (productData) => {
    if (!isAuthenticated()) {
      alert("Debes iniciar sesión para agregar productos");
      return;
    }
    setLoadingAction(true);
    try {
      const response = await authenticatedFetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      if (!response.ok) throw new Error("Error al agregar el producto");
      setIsModalOpen(false);
      queryClient.invalidateQueries(['products']);
    } catch (error) {
      alert(`Error al agregar el producto: ${error.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  // =======================
  // Handler: Editar producto
  // =======================
  /**
   * Abre el modal para editar un producto
   * @param {Object} product
   */
  const handleEdit = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  // =======================
  // Handler: Eliminar producto
  // =======================
  /**
   * Abre el modal de confirmación para eliminar un producto
   * @param {number} id
   */
  const handleDelete = (id) => {
    setProductToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // =======================
  // Handler: Confirmar eliminación
  // =======================
  /**
   * Elimina el producto seleccionado
   */
  const confirmDelete = async () => {
    if (!isAuthenticated()) {
      alert("Debes iniciar sesión para eliminar productos");
      return;
    }
    setLoadingAction(true);
    try {
      await authenticatedFetch(`/api/products/${productToDelete}`, {
        method: "DELETE",
      });
      setIsDeleteModalOpen(false);
      queryClient.invalidateQueries(['products']);
    } catch (error) {
      alert(`Error al eliminar el producto: ${error.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  // =======================
  // Handler: Abrir modal para agregar producto
  // =======================
  /**
   * Abre el modal para agregar un nuevo producto
   */
  const handleOpenAddModal = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  // =======================
  // Handler: Cerrar modal de producto
  // =======================
  /**
   * Cierra el modal de agregar/editar producto
   */
  const handleCloseModal = () => {
    setSelectedProduct(null);
    setIsModalOpen(false);
  };

  // =======================
  // Handler: Guardar cambios de producto editado
  // =======================
  /**
   * Guarda los cambios de un producto editado
   * @param {Object} updatedProduct
   */
  const handleSaveProduct = async (updatedProduct) => {
    if (!isAuthenticated()) {
      alert("Debes iniciar sesión para editar productos");
      return;
    }
    setLoadingAction(true);
    try {
      const response = await authenticatedFetch(`/api/products/${selectedProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProduct),
      });
      if (!response.ok) throw new Error("Error al guardar el producto");
      setIsModalOpen(false);
      queryClient.invalidateQueries(['products']);
    } catch (error) {
      alert(`Error al guardar el producto: ${error.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  // =======================
  // Handler: Cambiar cantidad de filas por página
  // =======================
  /**
   * Cambia la cantidad de filas por página
   */
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // =======================
  // Filtrado y paginación de productos (hook personalizado)
  // =======================
  const {
    filteredProducts,
    paginatedProducts,
    totalPages
  } = useProductsFilterAndPagination(
    productsData,
    debouncedSearch,
    filter,
    itemsPerPage,
    currentPage
  );

  // =======================
  // Hook de paginación reutilizable
  // =======================
  const { handlePrevPage, handleNextPage } = useProductsPagination(currentPage, totalPages, setCurrentPage);

  // =======================
  // Mostrar loading y errores de React Query
  // =======================
  if (productsLoading || categoriesLoading) {
    return <div>Cargando productos y categorías...</div>;
  }
  if (productsError || categoriesError) {
    return <div>Error al cargar datos: {productsError?.message || categoriesError?.message}</div>;
  }

  // =======================
  // Renderizado principal
  // =======================
  return (
    <div className="products-page">
      {/* Encabezado de la página */}
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
          {/* Barra de búsqueda */}
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
              aria-label="Buscar productos"
            />
            {searchTerm && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchTerm("")}
                title="Limpiar búsqueda"
                type="button"
                aria-label="Limpiar búsqueda"
              >
                <HiOutlineX />
              </button>
            )}
          </div>
          {/* Filtros y controles de paginación */}
          <div className="products-controls-row">
            <select
              value={filter}
              onChange={handleFilterChange}
              className="filter-dropdown"
              aria-label="Filtrar por categoría"
            >
              <option value="all">Todas las categorías</option>
              {categoriesData.map((cat) => (
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
                aria-label="Filas por página"
              >
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="30">30</option>
                <option value="999999">Todos</option>
              </select>
            </div>
            {/* Botón agregar producto */}
            {isAuthenticated() && (
              <button
                onClick={handleOpenAddModal}
                className="add-product-button"
                title="Agregar producto"
                disabled={loadingAction}
                style={loadingAction ? { opacity: 0.6, cursor: "not-allowed" } : {}}
                aria-label="Agregar producto"
              >
                {loadingAction ? (
                  <span className="spinner" style={{ marginRight: 6 }} />
                ) : (
                  <HiPlus style={{ marginRight: 4 }} />
                )}
                Agregar
              </button>
            )}
            {!isAuthenticated() && (
              <button
                onClick={() => alert("Debes iniciar sesión para agregar productos")}
                className="add-product-button disabled"
                title="Inicia sesión para agregar productos"
                style={{ opacity: 0.6, cursor: "not-allowed" }}
                disabled
                aria-label="Agregar producto (requiere iniciar sesión)"
              >
                <HiPlus style={{ marginRight: 4 }} />
                Agregar (Inicia sesión)
              </button>
            )}
          </div>
          {/* Paginación integrada en controles */}
          <ProductsPaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            onPrev={handlePrevPage}
            onNext={handleNextPage}
          />
        </div>
      </div>
      {/* Tabla de productos */}
      <div className="products-table-container">
        {productsFetching && (
          <div className="products-table-loading" style={{ textAlign: 'center', margin: '10px 0', color: '#888' }}>
            Actualizando productos...
          </div>
        )}
        <table className="products-table" role="table" aria-label="Lista de productos">
          <thead>
            <tr>
              <th scope="col"></th>
              <th scope="col">Nombre</th>
              <th scope="col">Categoría</th>
              <th scope="col">Precio</th>
              <th scope="col">Stock</th>
              <th scope="col">Stock Mínimo</th>
              <th scope="col" style={{ textAlign: "center" }}>Acciones</th>
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
                    {isAuthenticated() && (
                      <>
                        {/* Botón editar */}
                        <button
                          className="table-action edit"
                          title="Editar"
                          aria-label={`Editar producto ${product.name}`}
                          onClick={() => handleEdit(product)}
                        >
                          <FiEdit2 size={17} />
                        </button>
                        {/* Botón eliminar */}
                        <button
                          className="table-action delete"
                          title="Eliminar"
                          aria-label={`Eliminar producto ${product.name}`}
                          onClick={() => handleDelete(product.id)}
                        >
                          <FiTrash2 size={17} />
                        </button>
                      </>
                    )}
                    {!isAuthenticated() && (
                      <span style={{ color: "#999", fontSize: "0.85em" }}>
                        Inicia sesión para editar
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Modales de agregar/editar y eliminar */}
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
