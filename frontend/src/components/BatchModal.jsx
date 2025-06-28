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

  // Memoizar título del modal
  const modalTitle = useMemo(() => 
    mode === "edit" ? "Editar lote" : "Agregar lote", 
    [mode]
  );

  // Memoizar ícono del botón
  const buttonIcon = useMemo(() => 
    mode === "edit" ? <MdSave style={{ marginRight: 6 }} /> : <MdAdd style={{ marginRight: 6 }} />, 
    [mode]
  );

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
        setFormData({
          batch: '',
          stock: '',
          expirationDate: ''
        });
      }
      setIsLoading(false);
    }
  }, [initialData, open]);

  // Handler optimizado para cambios
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Handler optimizado para submit
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    // Validaciones
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

  // Handler para cerrar
  const handleClose = useCallback(() => {
    if (!isLoading) {
      onClose();
    }
  }, [isLoading, onClose]);

  if (!open) return null;

  return (
    <div className="batch-modal-overlay">
      <div className="batch-modal-content">
        <div className="batch-modal-header">
          <h3>
            <HiOutlineCube style={{ marginRight: 8 }} />
            {modalTitle}
          </h3>
          <button 
            className="batch-modal-close-btn" 
            onClick={handleClose}
            disabled={isLoading}
          >
            <MdClose />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="batch-modal-body">
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
              autoFocus
              disabled={isLoading}
              placeholder="Ej: LOTE-001"
              autoComplete="off"
            />
          </div>
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