/**
 * AddProductModal - Modal para agregar y editar productos
 * 
 * Este componente maneja la creación y edición de productos con sus respectivos lotes.
 * Incluye validaciones, manejo de estado optimizado y operaciones CRUD para lotes.
 * 
 * @param {Function} onClose - Función para cerrar el modal
 * @param {Function} onAddProduct - Función para agregar un nuevo producto
 * @param {Function} onSaveProduct - Función para guardar cambios de un producto existente
 * @param {Object} product - Producto a editar (opcional, si no se proporciona es modo agregar)
 */

import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import {
  HiOutlineTag,
  HiOutlineCube,
  HiOutlineAdjustments,
  HiOutlineShoppingBag,
  HiOutlineCurrencyDollar,
  HiOutlinePhotograph,
  HiOutlineQrcode,
  HiOutlineCalendar,
} from "react-icons/hi";
import { 
  MdClose, 
  MdEdit, 
  MdDelete,
  MdAdd,
} from "react-icons/md";
import "../styles/AddProductModal.css";
import { API_BASE_URL } from "../Conexion";
import BatchModal from "./BatchModal";

function AddProductModal({ onClose, onAddProduct, onSaveProduct, product }) {
  // ============================================================================
  // ESTADO DEL COMPONENTE
  // ============================================================================
  
  /**
   * Estado principal del formulario con todos los campos del producto
   */
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    batch: "",
    stock: "",
    categoryId: "",
    image: "",
    brand: "",
    barcode: "",
    cost: "",
    minStock: "",
    hasExpiration: false,
    expirationDate: "",
  });

  // Estados para datos relacionados
  const [categories, setCategories] = useState([]); // Lista de categorías disponibles
  const [batches, setBatches] = useState([]); // Lotes del producto (solo en modo edición)
  
  // Estados para el modal de lotes
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchModalMode, setBatchModalMode] = useState("add");
  const [batchEditData, setBatchEditData] = useState(null);
  
  // Estado de carga
  const [isLoading, setIsLoading] = useState(false);
  
  // ============================================================================
  // REFS PARA OPTIMIZACIÓN
  // ============================================================================
  
  const abortControllerRef = useRef(null); // Para cancelar peticiones
  const debounceRef = useRef(null); // Para debounce de carga de datos

  // Inicializar abortController
  useEffect(() => {
    abortControllerRef.current = new AbortController();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ============================================================================
  // VALORES COMPUTADOS Y MEMOIZADOS
  // ============================================================================
  
  /**
   * Determina si estamos en modo edición basado en si se proporciona un producto
   */
  const isEditMode = useMemo(() => Boolean(product), [product]);
  
  /**
   * Título del modal según el modo
   */
  const modalTitle = useMemo(() => 
    isEditMode ? "Editar Producto" : "Agregar Producto", 
    [isEditMode]
  );

  // ============================================================================
  // EFFECTS PARA CARGA DE DATOS
  // ============================================================================
  
  /**
   * Carga las categorías al montar el componente
   */
  useEffect(() => {
    let isMounted = true;
    
    const loadCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/categories`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: abortControllerRef.current?.signal
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (isMounted && Array.isArray(data)) {
          setCategories(data);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error("Error loading categories:", error);
          setCategories([]);
        }
      }
    };

    loadCategories();
    
    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Carga los datos del producto cuando se proporciona (modo edición)
   * Implementa debounce para optimizar la carga de lotes
   */
  useEffect(() => {
    let isMounted = true;
    
    // Limpiar debounce anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    const loadProductData = async () => {
      if (product) {
        // Determinar categoryId con múltiples fallbacks
        let categoryId = "";
        if (product.categoryId) {
          categoryId = String(product.categoryId);
        } else if (product.category?.id) {
          categoryId = String(product.category.id);
        } else if (product.category_id) {
          categoryId = String(product.category_id);
        }
        
        // Actualizar formData inmediatamente para mejor UX
        const productFormData = {
          name: product.name || "",
          description: product.description || "",
          price: product.price !== undefined && product.price !== null ? String(product.price) : "",
          batch: "",
          stock: "",
          categoryId: categoryId,
          image: product.image || "",
          brand: product.brand || "",
          barcode: product.barcode || "",
          cost: product.cost !== undefined && product.cost !== null ? String(product.cost) : "",
          minStock: product.minStock !== undefined && product.minStock !== null ? String(product.minStock) : "",
          hasExpiration: false,
          expirationDate: "",
        };
        
        setFormData(productFormData);
        
        // Cargar lotes con debounce para optimizar rendimiento
        debounceRef.current = setTimeout(async () => {
          try {
            const response = await fetch(`${API_BASE_URL}/api/products/${product.id}/batches`);
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const batchData = await response.json();
            
            if (isMounted) {
              setBatches(batchData || []);
            }
          } catch (error) {
            if (error.name !== 'AbortError') {
              console.error("Error loading batches:", error);
            }
          }
        }, 100);
      } else {
        // Resetear formulario para nuevo producto
        setFormData({
          name: "",
          description: "",
          price: "",
          batch: "",
          stock: "",
          categoryId: "",
          image: "",
          brand: "",
          barcode: "",
          cost: "",
          minStock: "",
          hasExpiration: false,
          expirationDate: "",
        });
        setBatches([]);
      }
    };

    loadProductData();
    
    return () => {
      isMounted = false;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [product]);

  /**
   * Cleanup al desmontar el componente
   * Cancela peticiones pendientes y limpia timeouts
   */
  useEffect(() => {
    return () => {
      abortControllerRef.current.abort();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // ============================================================================
  // HANDLERS Y FUNCIONES UTILITARIAS
  // ============================================================================
  
  /**
   * Maneja los cambios en los campos del formulario
   * Optimizado con shallow comparison para evitar re-renders innecesarios
   */
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    
    setFormData(prev => {
      // Evitar re-render si el valor no cambió
      if (prev[name] === newValue) return prev;
      return {
        ...prev,
        [name]: newValue,
      };
    });
  }, []);

  /**
   * Convierte un valor a número, manejando casos edge
   * @param {*} val - Valor a convertir
   * @returns {number|null} - Número convertido o null si no es válido
   */
  const parseNumber = useCallback((val) => {
    if (val === undefined || val === null || val === "") return null;
    const n = Number(val);
    return isNaN(n) ? null : n;
  }, []);

  /**
   * Valida los datos del formulario antes de enviar
   * @param {Object} data - Datos del formulario a validar
   * @returns {boolean} - true si los datos son válidos
   */
  const validateForm = useCallback((data) => {
    // Validar categoría obligatoria
    if (!data.categoryId) {
      alert("Selecciona una categoría");
      return false;
    }
    
    // Validaciones específicas para modo agregar
    if (!isEditMode) {
      if (!data.batch) {
        alert("El lote es obligatorio");
        return false;
      }
      if (data.stock === null) {
        alert("El stock inicial es obligatorio");
        return false;
      }
    }

    // Validar que los campos numéricos no sean negativos
    const numericFields = [
      { key: "price", label: "Precio" },
      { key: "cost", label: "Costo" },
      { key: "minStock", label: "Stock mínimo" },
      { key: "stock", label: "Stock inicial" },
    ];
    
    for (const field of numericFields) {
      if (data[field.key] !== null && data[field.key] < 0) {
        alert(`${field.label} no puede ser negativo`);
        return false;
      }
    }
    
    return true;
  }, [isEditMode]);

  /**
   * Maneja el envío del formulario principal
   * Implementa doble protección contra envíos múltiples
   */
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Protección contra envíos múltiples
    if (isLoading) return;
    
    // Validación rápida antes de procesar
    if (!formData.name?.trim()) {
      alert("El nombre del producto es obligatorio");
      return;
    }
    
    setIsLoading(true);

    try {
      // Preparar datos para envío
      const data = {
        ...formData,
        image: formData.image || "https://t3.ftcdn.net/jpg/04/60/01/36/360_F_460013622_6xF8uN6ubMvLx0tAJECBHfKPoNOR5cRa.jpg",
        expirationDate: formData.hasExpiration ? formData.expirationDate : null,
        price: parseNumber(formData.price),
        cost: parseNumber(formData.cost),
        minStock: parseNumber(formData.minStock),
        stock: parseNumber(formData.stock),
      };

      // Validar datos procesados
      if (!validateForm(data)) {
        return;
      }

      // Ejecutar acción según el modo
      if (isEditMode) {
        await onSaveProduct(data);
      } else {
        await onAddProduct(data);
      }
      
      onClose();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Error al guardar el producto");
    } finally {
      setIsLoading(false);
    }
  }, [formData, isLoading, parseNumber, validateForm, isEditMode, onSaveProduct, onAddProduct, onClose]);

  // ============================================================================
  // HANDLERS PARA MANEJO DE LOTES
  // ============================================================================
  
  /**
   * Elimina un lote con actualización optimista
   * @param {string} batchId - ID del lote a eliminar
   */
  const handleDeleteBatch = useCallback(async (batchId) => {
    if (!window.confirm("¿Eliminar este lote?")) return;
    
    // Actualización optimista - actualizar UI primero
    const previousBatches = batches;
    setBatches(prev => prev.filter(b => b.id !== batchId));
    
    try {
      await fetch(`${API_BASE_URL}/api/products/batches/${batchId}`, {
        method: "DELETE",
        signal: abortControllerRef.current.signal
      });
    } catch (error) {
      // Revertir cambios en caso de error
      setBatches(previousBatches);
      console.error("Error deleting batch:", error);
      alert("Error al eliminar el lote");
    }
  }, [batches]);

  /**
   * Abre el modal para agregar un nuevo lote
   */
  const openAddBatchModal = useCallback(() => {
    setBatchEditData(null);
    setBatchModalMode("add");
    setBatchModalOpen(true);
  }, []);

  /**
   * Abre el modal para editar un lote existente
   * @param {Object} batch - Datos del lote a editar
   */
  const openEditBatchModal = useCallback((batch) => {
    setBatchEditData(batch);
    setBatchModalMode("edit");
    setBatchModalOpen(true);
  }, []);

  /**
   * Cierra el modal de lotes
   */
  const closeBatchModal = useCallback(() => {
    setBatchModalOpen(false);
  }, []);

  /**
   * Guarda los cambios de un lote (agregar o editar)
   * @param {Object} batchData - Datos del lote a guardar
   */
  const handleSaveBatch = useCallback(async (batchData) => {
    try {
      if (batchModalMode === "add") {
        // Agregar nuevo lote
        const response = await fetch(`${API_BASE_URL}/api/products/${product.id}/batches`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(batchData),
          signal: abortControllerRef.current.signal
        });
        
        if (!response.ok) throw new Error('Failed to add batch');
        
        const newBatch = await response.json();
        setBatches(prev => [...prev, newBatch]);
        
      } else if (batchModalMode === "edit" && batchEditData) {
        // Editar lote existente
        const response = await fetch(`${API_BASE_URL}/api/products/batches/${batchEditData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(batchData),
          signal: abortControllerRef.current.signal
        });
        
        if (!response.ok) throw new Error('Failed to update batch');
        
        setBatches(prev => prev.map(x => 
          x.id === batchEditData.id ? { ...x, ...batchData } : x
        ));
      }
      
      setBatchModalOpen(false);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("Error saving batch:", error);
        alert("Error al guardar el lote");
      }
    }
  }, [batchModalMode, batchEditData, product?.id]);

// ============================================================================
// COMPONENTES MEMOIZADOS PARA OPTIMIZACIÓN
// ============================================================================

/**
 * Componente memoizado para renderizar las opciones de categorías
 * Evita re-renders innecesarios cuando las categorías no cambian
 */
const CategoryOptions = memo(({ categories }) => {
  if (!Array.isArray(categories) || categories.length === 0) {
    return null;
  }
  
  return categories.map((c) => (
    <option key={c.id} value={c.id}>
      {c.name}
    </option>
  ));
});
CategoryOptions.displayName = 'CategoryOptions';

/**
 * Componente memoizado para renderizar una fila de lote en la tabla
 * Optimiza el rendimiento al memoizar las filas individuales
 */
const BatchRow = memo(({ batch, onEdit, onDelete, isLoading }) => {
  const handleEdit = useCallback(() => onEdit(batch), [batch, onEdit]);
  const handleDelete = useCallback(() => onDelete(batch.id), [batch.id, onDelete]);
  
  return (
    <tr>
      <td>{batch.batch}</td>
      <td>{batch.stock}</td>
      <td>
        {batch.expirationDate ? (
          new Date(batch.expirationDate).toLocaleDateString()
        ) : (
          <span style={{ color: "#bbb" }}>—</span>
        )}
      </td>
      <td style={{ textAlign: "center" }}>
        <button
          type="button"
          className="batch-action-btn batch-edit-btn"
          title="Editar lote"
          onClick={handleEdit}
          disabled={isLoading}
        >
          <MdEdit />
        </button>
        <button
          type="button"
          className="batch-action-btn batch-delete-btn"
          title="Eliminar lote"
          onClick={handleDelete}
          disabled={isLoading}
        >
          <MdDelete />
        </button>
      </td>
    </tr>
  );
});
BatchRow.displayName = 'BatchRow';

  // ============================================================================
  // VALORES COMPUTADOS MEMOIZADOS
  // ============================================================================
  
  /**
   * Genera las filas de la tabla de lotes de forma optimizada
   * Se memoiza para evitar recálculos innecesarios
   */
  const batchTableRows = useMemo(() => {
    if (batches.length === 0) {
      return (
        <tr>
          <td colSpan={4} style={{ color: "#bbb", textAlign: "center" }}>
            Sin lotes
          </td>
        </tr>
      );
    }
    
    return batches.map((batch, idx) => (
      <BatchRow
        key={`batch-${batch.id || idx}`}
        batch={batch}
        onEdit={openEditBatchModal}
        onDelete={handleDeleteBatch}
        isLoading={isLoading}
      />
    ));
  }, [batches, openEditBatchModal, handleDeleteBatch, isLoading]);

  // ============================================================================
  // RENDERIZADO DEL COMPONENTE
  // ============================================================================

  return (
    <div className="add-modal-overlay">
      <div className="add-modal-content">
        {/* ============================================================================ */}
        {/* HEADER DEL MODAL */}
        {/* ============================================================================ */}
        <div className="add-modal-header">
          <h2>
            <HiOutlineShoppingBag /> {modalTitle}
          </h2>
          <button className="modal-close-btn" onClick={onClose}>
            <MdClose />
          </button>
        </div>

        {/* ============================================================================ */}
        {/* FORMULARIO PRINCIPAL */}
        {/* ============================================================================ */}
        <form
          id="add-product-form"
          onSubmit={handleSubmit}
          className="add-modal-body add-modal-body-cols"
        >
          {/* ============================================================================ */}
          {/* COLUMNA IZQUIERDA: DATOS DEL PRODUCTO */}
          {/* ============================================================================ */}
          <div className="add-modal-form-col">
            <h3 className="modal-section-title">Datos del producto</h3>
            <div className="product-fields-grid">
              {/* Campo: Nombre del producto */}
              <div className="input-group">
                <label htmlFor="name" className="input-label">
                  <HiOutlineTag /> Nombre <span className="required-asterisk">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                  placeholder="Ej: Leche Gloria 1L"
                />
              </div>
              
              {/* Fila: Precio y Costo */}
              <div className="product-numeric-row">
                <div className="input-group">
                  <label htmlFor="price" className="input-label">
                    <HiOutlineCurrencyDollar /> Precio (S/) <span className="required-asterisk">*</span>
                  </label>
                  <input
                    id="price"
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    autoComplete="off"
                    placeholder="Ej: 5.50"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="cost" className="input-label">
                    <HiOutlineCurrencyDollar /> Costo (S/)
                  </label>
                  <input
                    id="cost"
                    type="number"
                    name="cost"
                    value={formData.cost}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    autoComplete="off"
                    placeholder="Ej: 4.00"
                  />
                </div>
              </div>
              
              {/* Campo: Descripción */}
              <div className="input-group">
                <label htmlFor="description" className="input-label">
                  Descripción
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  autoComplete="off"
                  placeholder="Ej: Leche entera UHT en envase de 1 litro"
                />
              </div>
              
              {/* Fila: Campos pequeños (Stock mínimo, Marca, Categoría) */}
              <div className="product-small-fields-row">
                <div className="input-group">
                  <label htmlFor="minStock" className="input-label">
                    <HiOutlineAdjustments /> Stock mínimo
                  </label>
                  <input
                    id="minStock"
                    type="number"
                    name="minStock"
                    value={formData.minStock}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    autoComplete="off"
                    placeholder="Ej: 10"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="brand" className="input-label">
                    <HiOutlineTag /> Marca
                  </label>
                  <input
                    id="brand"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    autoComplete="off"
                    placeholder="Ej: Gloria"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="categoryId" className="input-label">
                    Categoría <span className="required-asterisk">*</span>
                  </label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    required
                    autoComplete="off"
                  >
                    <option value="">
                      {categories.length === 0 ? "Cargando categorías..." : "Selecciona una categoría"}
                    </option>
                    <CategoryOptions categories={categories} />
                  </select>
                  {categories.length === 0 && (
                    <small style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                      No se pudieron cargar las categorías. Verifica la conexión con el servidor.
                    </small>
                  )}
                </div>
              </div>
              
              {/* Campo: URL de imagen */}
              <div className="input-group">
                <label htmlFor="image" className="input-label">
                  <HiOutlinePhotograph /> URL Imagen
                </label>
                <input
                  id="image"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  autoComplete="off"
                  placeholder="URL de la imagen"
                />
              </div>
              
              {/* Campo: Código de barras */}
              <div className="input-group">
                <label htmlFor="barcode" className="input-label">
                  <HiOutlineQrcode /> Código de barras
                </label>
                <input
                  id="barcode"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  autoComplete="off"
                  placeholder="Ej: 1234567890123"
                />
              </div>
            </div>
          </div>

          {/* ============================================================================ */}
          {/* COLUMNA DERECHA: LOTES DEL PRODUCTO */}
          {/* ============================================================================ */}
          <div className="add-modal-form-col">
            {isEditMode ? (
              // MODO EDICIÓN: Tabla de lotes existentes
              <>
                <h3 className="modal-section-title">Lotes del producto</h3>
                
                {/* Contenedor scrolleable para la tabla */}
                <div className="batches-table-container">
                  <table className="viewbatches-modal-table">
                    <thead>
                      <tr>
                        <th>Lote</th>
                        <th>Stock</th>
                        <th>Vencimiento</th>
                        <th style={{ textAlign: "center" }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchTableRows}
                    </tbody>
                  </table>
                </div>
                
                {/* Botón para agregar nuevo lote */}
                <div className="batches-add-btn-row">
                  <button
                    type="button"
                    className="batch-add-btn"
                    title="Agregar lote"
                    onClick={openAddBatchModal}
                    disabled={isLoading}
                  >
                    <MdAdd style={{ marginRight: 6 }} />
                    Agregar Lote
                  </button>
                </div>
              </>
            ) : (
              // MODO AGREGAR: Formulario para el primer lote
              <>
                <h3 className="modal-section-title">Primer lote</h3>
                
                {/* Campo: Código de lote */}
                <div className="input-group">
                  <label htmlFor="batch" className="input-label">
                    <HiOutlineCube /> Código de lote{" "}
                    <span className="required-asterisk">*</span>
                  </label>
                  <input
                    id="batch"
                    name="batch"
                    value={formData.batch}
                    onChange={handleChange}
                    autoComplete="off"
                    required
                    placeholder="Ej: LOTE-001"
                  />
                </div>
                
                {/* Campo: Stock inicial */}
                <div className="input-group">
                  <label htmlFor="stock" className="input-label">
                    <HiOutlineAdjustments /> Stock inicial{" "}
                    <span className="required-asterisk">*</span>
                  </label>
                  <input
                    id="stock"
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    autoComplete="off"
                    required
                    min="0"
                    step="1"
                    placeholder="Ej: 100"
                  />
                </div>
                
                {/* Campo: Fecha de vencimiento */}
                <div className="input-group input-group-vencimiento-row">
                  <label className="input-label" htmlFor="hasExpiration">
                    <input
                      type="checkbox"
                      name="hasExpiration"
                      checked={formData.hasExpiration}
                      onChange={handleChange}
                      id="hasExpiration"
                      style={{ marginRight: 6 }}
                    />
                    <HiOutlineCalendar /> F. Vencimiento:
                  </label>
                  <input
                    type="date"
                    name="expirationDate"
                    value={formData.expirationDate}
                    onChange={handleChange}
                    disabled={!formData.hasExpiration}
                    required={formData.hasExpiration}
                    className="input-date"
                    autoComplete="off"
                  />
                </div>
              </>
            )}
            
            {/* ============================================================================ */}
            {/* BOTONES DE ACCIÓN DEL MODAL */}
            {/* ============================================================================ */}
            <div className="add-modal-footer">
              <button 
                className="cancel-button" 
                type="button" 
                onClick={onClose} 
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                className="add-button"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Guardando..." : (isEditMode ? "Guardar" : "Agregar")}
              </button>
            </div>
          </div>
        </form>

        {/* ============================================================================ */}
        {/* MODAL DE LOTES (LAZY LOADING) */}
        {/* ============================================================================ */}
        {batchModalOpen && (
          <BatchModal
            open={batchModalOpen}
            onClose={closeBatchModal}
            onSave={handleSaveBatch}
            initialData={batchEditData}
            mode={batchModalMode}
          />
        )}
      </div>
    </div>
  );
}

export default AddProductModal;