import React, { useState, useEffect } from 'react';
import { MdClose } from 'react-icons/md';
import '../styles/BatchModal.css';

function BatchModal({ open, onClose, onSave, initialData, mode = "add" }) {
  const [batch, setBatch] = useState('');
  const [stock, setStock] = useState('');
  const [expirationDate, setExpirationDate] = useState('');

  useEffect(() => {
    if (initialData) {
      setBatch(initialData.batch || '');
      setStock(initialData.stock || '');
      setExpirationDate(initialData.expirationDate ? initialData.expirationDate.slice(0, 10) : '');
    } else {
      setBatch('');
      setStock('');
      setExpirationDate('');
    }
  }, [initialData, open]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!batch || !stock) return;
    onSave({
      batch,
      stock,
      expirationDate: expirationDate || null
    });
  };

  return (
    <div className="batch-modal-overlay">
      <div className="batch-modal-content">
        <div className="batch-modal-header">
          <h3>{mode === "edit" ? "Editar lote" : "Agregar lote"}</h3>
          <button className="batch-modal-close-btn" onClick={onClose}><MdClose /></button>
        </div>
        <form onSubmit={handleSubmit} className="batch-modal-body">
          <div className="batch-input-group">
            <label>Código de lote *</label>
            <input value={batch} onChange={e => setBatch(e.target.value)} required autoFocus />
          </div>
          <div className="batch-input-group">
            <label>Stock *</label>
            <input type="number" value={stock} onChange={e => setStock(e.target.value)} min={0} required />
          </div>
          <div className="batch-input-group">
            <label>Fecha de vencimiento</label>
            <input type="date" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} />
          </div>
          <div className="batch-modal-footer">
            <button type="button" className="batch-cancel-button" onClick={onClose}>Cancelar</button>
            <button type="submit" className="batch-add-button">
              {mode === "edit" ? "Guardar" : "Agregar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BatchModal;