import React from 'react';
import { HiOutlineExclamation } from 'react-icons/hi';
import '../styles/DeleteConfirmationModal.css';

function DeleteConfirmationModal({ onClose, onConfirm }) {
  return (
    <div className="delete-modal-overlay">
      <div className="delete-modal-content">
        <div className="delete-modal-icon">
          <HiOutlineExclamation />
        </div>
        <h2 className="delete-modal-title">
          <strong>¿Está seguro de eliminar este producto?</strong>
        </h2>
        <div className="delete-modal-buttons">
          <button className="delete-confirm-button" onClick={onConfirm}>
            <HiOutlineExclamation style={{ fontSize: '1.2em' }} />
            Sí, eliminar
          </button>
          <button className="delete-cancel-button" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmationModal;