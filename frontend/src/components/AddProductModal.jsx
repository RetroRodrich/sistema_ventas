import React, { useState, useEffect } from "react";
import {
  HiOutlineTag,
  HiOutlineCube,
  HiOutlineAdjustments,
} from "react-icons/hi";
import { MdClose, MdEdit, MdDelete } from "react-icons/md";
import "../styles/AddProductModal.css";
import { API_BASE_URL } from "../Conexion";
import BatchModal from "./BatchModal";

function AddProductModal({ onClose, onAddProduct, onSaveProduct, product }) {
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
  const [categories, setCategories] = useState([]);
  const [batches, setBatches] = useState([]);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchModalMode, setBatchModalMode] = useState("add"); // 'add' o 'edit'
  const [batchEditData, setBatchEditData] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/categories`)
      .then((res) => res.json())
      .then(setCategories)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        price:
          product.price !== undefined && product.price !== null
            ? String(product.price)
            : "",
        batch: "",
        stock: "",
        categoryId: product.categoryId ? String(product.categoryId) : "",
        image: product.image || "",
        brand: product.brand || "",
        barcode: product.barcode || "",
        cost:
          product.cost !== undefined && product.cost !== null
            ? String(product.cost)
            : "",
        minStock:
          product.minStock !== undefined && product.minStock !== null
            ? String(product.minStock)
            : "",
        hasExpiration: false,
        expirationDate: "",
      });
      fetch(`${API_BASE_URL}/api/products/${product.id}/batches`)
        .then((res) => res.json())
        .then(setBatches);
    } else {
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
  }, [product]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const parseNumber = (val) => {
      if (val === undefined || val === null || val === "") return null;
      const n = Number(val);
      return isNaN(n) ? null : n;
    };

    const data = {
      ...formData,
      image:
        formData.image ||
        "https://t3.ftcdn.net/jpg/04/60/01/36/360_F_460013622_6xF8uN6ubMvLx0tAJECBHfKPoNOR5cRa.jpg",
      expirationDate: formData.hasExpiration ? formData.expirationDate : null,
      price: parseNumber(formData.price),
      cost: parseNumber(formData.cost),
      minStock: parseNumber(formData.minStock),
      stock: parseNumber(formData.stock),
    };

    if (!data.categoryId) return alert("Selecciona una categoría");
    if (!product) {
      if (!data.batch) return alert("El lote es obligatorio");
      if (data.stock === null) return alert("El stock inicial es obligatorio");
    }

    const numericFields = [
      { key: "price", label: "Precio" },
      { key: "cost", label: "Costo" },
      { key: "minStock", label: "Stock mínimo" },
      { key: "stock", label: "Stock inicial" },
    ];
    for (const field of numericFields) {
      if (data[field.key] !== null && data[field.key] < 0) {
        return alert(`${field.label} no puede ser negativo`);
      }
    }

    product ? onSaveProduct(data) : onAddProduct(data);
    onClose();
  };

  const handleDeleteBatch = async (batchId) => {
    if (!window.confirm("¿Eliminar este lote?")) return;
    await fetch(`${API_BASE_URL}/api/products/batches/${batchId}`, {
      method: "DELETE",
    });
    setBatches((batches) => batches.filter((b) => b.id !== batchId));
  };

  // Abrir modal para agregar lote
  const openAddBatchModal = () => {
    setBatchEditData(null);
    setBatchModalMode("add");
    setBatchModalOpen(true);
  };

  // Abrir modal para editar lote
  const openEditBatchModal = (batch) => {
    setBatchEditData(batch);
    setBatchModalMode("edit");
    setBatchModalOpen(true);
  };

  // Guardar lote (agregar o editar)
  const handleSaveBatch = (batchData) => {
    if (batchModalMode === "add") {
      fetch(`${API_BASE_URL}/api/products/${product.id}/batches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batchData),
      })
        .then((res) => res.json())
        .then((newBatch) => setBatches((batches) => [...batches, newBatch]));
    } else if (batchModalMode === "edit" && batchEditData) {
      fetch(`${API_BASE_URL}/api/products/batches/${batchEditData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batchData),
      })
        .then((res) => (res.ok ? { ...batchEditData, ...batchData } : null))
        .then((updated) => {
          if (updated) {
            setBatches((batches) =>
              batches.map((x) =>
                x.id === batchEditData.id ? { ...x, ...batchData } : x
              )
            );
          }
        });
    }
    setBatchModalOpen(false);
  };

  return (
    <div className="add-modal-overlay">
      <div className="add-modal-content">
        <div className="add-modal-header">
          <h2>
            <HiOutlineTag /> {product ? "Editar Producto" : "Agregar Producto"}
          </h2>
          <button className="modal-close-btn" onClick={onClose}>
            <MdClose />
          </button>
        </div>
        <form
          id="add-product-form"
          onSubmit={handleSubmit}
          className="add-modal-body add-modal-body-cols"
        >
          {/* Columna izquierda: Datos del producto */}
          <div className="add-modal-form-col">
            <h3 className="modal-section-title">Datos del producto</h3>
            <div className="product-fields-grid">
              <div className="input-group grid-span-2">
                <label htmlFor="name" className="input-label">
                  Nombre <span className="required-asterisk">*</span>
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
              <div className="input-group">
                <label htmlFor="price" className="input-label">
                  Precio (S/) <span className="required-asterisk">*</span>
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
                  Costo (S/)
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
              <div className="input-group grid-span-2">
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
              <div className="input-group">
                <label htmlFor="minStock" className="input-label">
                  Stock mínimo
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
                  Marca
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
                  <option value="">Selecciona una categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="input-group image-input-group grid-span-2">
                <label htmlFor="image" className="input-label">
                  URL Imagen
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
              <div className="input-group grid-span-2">
                <label htmlFor="barcode" className="input-label">
                  Código de barras
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
          {/* Columna derecha: Primer lote o lotes */}
          <div className="add-modal-form-col">
            {product ? (
              <>
                <h3 className="modal-section-title">Lotes del producto</h3>
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
                    {batches.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ color: "#bbb", textAlign: "center" }}>
                          Sin lotes
                        </td>
                      </tr>
                    ) : (
                      batches.map((b, idx) => (
                        <tr key={b.id || `batch-${idx}`}>
                          <td>{b.batch}</td>
                          <td>{b.stock}</td>
                          <td>
                            {b.expirationDate ? (
                              new Date(b.expirationDate).toLocaleDateString()
                            ) : (
                              <span style={{ color: "#bbb" }}>—</span>
                            )}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              type="button"
                              className="batch-action-btn batch-edit-btn"
                              title="Editar lote"
                              onClick={() => openEditBatchModal(b)}
                            >
                              <MdEdit />
                            </button>
                            <button
                              type="button"
                              className="batch-action-btn batch-delete-btn"
                              title="Eliminar lote"
                              onClick={() => handleDeleteBatch(b.id)}
                            >
                              <MdDelete />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                {/* Botón Agregar Lote centrado */}
                <div className="batches-add-btn-row">
                  <button
                    type="button"
                    className="batch-add-btn"
                    title="Agregar lote"
                    onClick={openAddBatchModal}
                  >
                    + Agregar Lote
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="modal-section-title">Primer lote</h3>
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
                    F. Vencimiento:
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
            <div className="add-modal-footer">
              {product ? (
                // Si es edición, muestra Cancelar y Guardar
                <>
                  <button className="cancel-button" type="button" onClick={onClose}>
                    Cancelar
                  </button>
                  <button
                    className="add-button"
                    type="submit"
                    form="add-product-form"
                  >
                    Guardar
                  </button>
                </>
              ) : (
                // Si es nuevo, muestra Cancelar y Agregar
                <>
                  <button className="cancel-button" type="button" onClick={onClose}>
                    Cancelar
                  </button>
                  <button className="add-button" type="submit">
                    Agregar
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
        {/* Modal para agregar/editar lote */}
        <BatchModal
          open={batchModalOpen}
          onClose={() => setBatchModalOpen(false)}
          onSave={handleSaveBatch}
          initialData={batchEditData}
          mode={batchModalMode}
        />
      </div>
    </div>
  );
}

export default AddProductModal;