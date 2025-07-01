/**
 * BatchModal - Modal para agregar o editar un lote de producto.
 *
 * Props:
 * @param {boolean} open - Si el modal está abierto.
 * @param {function} onClose - Handler para cerrar el modal.
 * @param {function} onSave - Handler para guardar el lote.
 * @param {object} initialData - Datos iniciales del lote (para editar).
 * @param {string} mode - "add" o "edit".
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MdClose, MdSave, MdAdd } from 'react-icons/md';
import { HiOutlineCube, HiOutlineAdjustments, HiOutlineCalendar } from 'react-icons/hi';
import '../styles/BatchModal.css';

function BatchModal({ open, onClose, onSave, initialData, mode = "add" }) {
  const [formData, setFormData] = useState({
    batch: '',
    stock: '',
    expirationDate: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Título del modal según el modo
  const modalTitle = useMemo(() => mode === "edit" ? "Editar lote" : "Agregar lote", [mode]);
  // Ícono del botón según el modo
  const buttonIcon = useMemo(() => mode === "edit" ? <MdSave style={{ marginRight: 6 }} /> : <MdAdd style={{ marginRight: 6 }} />, [mode]);

  // Resetear formulario cuando se abre/cierra o cambian los datos iniciales
  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          batch: initialData.batch || '',
          stock: String(initialData.stock || ''),
          expirationDate: initialData.expirationDate ? initialData.expirationDate.slice(0, 10) : ''
        });
      } else {
        setFormData({ batch: '', stock: '', expirationDate: '' });
      }
      setIsLoading(false);
    }
  }, [initialData, open]);

  /**
   * Maneja los cambios en los campos del formulario
   */
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  /**
   * Maneja el submit del formulario de lote
   */
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (isLoading) return;
    // Validaciones básicas
    if (!formData.batch?.trim()) {
      alert("El código de lote es obligatorio");
      return;
    }
    const stockNum = Number(formData.stock);
    if (!formData.stock || isNaN(stockNum) || stockNum < 0) {
      alert("El stock debe ser un número válido mayor o igual a 0");
      return;
    }
    setIsLoading(true);
    try {
      await onSave({
        batch: formData.batch.trim(),
        stock: stockNum,
        expirationDate: formData.expirationDate || null
      });
    } catch (error) {
      console.error("Error saving batch:", error);
      alert("Error al guardar el lote");
    } finally {
      setIsLoading(false);
    }
  }, [formData, isLoading, onSave]);

  /**
   * Handler para cerrar el modal
   */
  const handleClose = useCallback(() => {
    if (!isLoading) onClose();
  }, [isLoading, onClose]);

  if (!open) return null;

  // Referencia para enfoque inicial
  const firstInputRef = React.useRef(null);

  useEffect(() => {
    if (open && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [open]);

  return (
    <div className="batch-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="batch-modal-title">
      <div className="batch-modal-content">
        <div className="batch-modal-header">
          <h3 id="batch-modal-title">
            <HiOutlineCube style={{ marginRight: 8 }} />
            {modalTitle}
          </h3>
          <button 
            className="batch-modal-close-btn" 
            onClick={handleClose}
            disabled={isLoading}
            aria-label="Cerrar modal"
          >
            <MdClose />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="batch-modal-body">
          {/* Campo: Código de lote */}
          <div className="batch-input-group">
            <label htmlFor="batch" className="batch-input-label">
              <HiOutlineCube /> Código de lote <span className="required-asterisk">*</span>
            </label>
            <input 
              id="batch"
              name="batch"
              value={formData.batch} 
              onChange={handleChange} 
              required 
              ref={firstInputRef}
              disabled={isLoading}
              placeholder="Ej: LOTE-001"
              autoComplete="off"
            />
          </div>
          {/* Campo: Stock */}
          <div className="batch-input-group">
            <label htmlFor="stock" className="batch-input-label">
              <HiOutlineAdjustments /> Stock <span className="required-asterisk">*</span>
            </label>
            <input 
              id="stock"
              name="stock"
              type="number" 
              value={formData.stock} 
              onChange={handleChange} 
              min="0" 
              step="1"
              required
              disabled={isLoading}
              placeholder="Ej: 100"
              autoComplete="off"
            />
          </div>
          {/* Campo: Fecha de vencimiento */}
          <div className="batch-input-group">
            <label htmlFor="expirationDate" className="batch-input-label">
              <HiOutlineCalendar /> Fecha de vencimiento
            </label>
            <input 
              id="expirationDate"
              name="expirationDate"
              type="date" 
              value={formData.expirationDate} 
              onChange={handleChange}
              disabled={isLoading}
              autoComplete="off"
            />
          </div>
          <div className="batch-modal-footer">
            <button 
              type="button" 
              className="batch-cancel-button" 
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="batch-add-button"
              disabled={isLoading}
            >
              {buttonIcon}
              {isLoading ? "Guardando..." : (mode === "edit" ? "Guardar" : "Agregar")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BatchModal;