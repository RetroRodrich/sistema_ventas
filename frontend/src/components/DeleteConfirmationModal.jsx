import React from 'react';
import '../styles/DeleteConfirmationModal.css';

function DeleteConfirmationModal({ onClose, onConfirm }) {
  return (
    <div className="delete-modal-overlay">
      <div className="delete-modal-content">
        <h2 className="delete-modal-title">¿Está seguro de eliminar este producto?</h2>
        <div className="delete-modal-buttons">
          <button className="delete-confirm-button" onClick={onConfirm}>Sí</button>
          <button className="delete-cancel-button" onClick={onClose}>No</button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmationModal;