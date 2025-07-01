import React from 'react';
import { HiOutlineExclamation } from 'react-icons/hi';
import '../styles/DeleteConfirmationModal.css';

/**
 * Modal de confirmación para eliminar un producto.
 *
 * @param {function} onClose - Cierra el modal sin eliminar.
 * @param {function} onConfirm - Confirma la eliminación.
 */
function DeleteConfirmationModal({ onClose, onConfirm }) {
  return (
    <div className="delete-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
      <div className="delete-modal-content">
        <div className="delete-modal-icon">
          <HiOutlineExclamation />
        </div>
        <h2 className="delete-modal-title" id="delete-modal-title">
          <strong>¿Está seguro de eliminar este producto?</strong>
        </h2>
        <div className="delete-modal-buttons">
          <button className="delete-confirm-button" onClick={onConfirm} autoFocus>
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