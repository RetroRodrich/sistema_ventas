import React from 'react';
import { MdEdit, MdDelete } from 'react-icons/md';
import '../styles/ProductCard.css';

function ProductCard({ product, onEdit, onDelete }) {
  return (
    <div className="product-card">
      <div className="product-image-container">
        <img src={product.image} alt={product.name} className="product-image" loading="lazy" />
      </div>
      <div className="product-info">
        <div className="product-info-content">
          <div className="product-name">{product.name}</div>
          <div className="product-category">{product.category || 'Sin categoría'}</div>
          <div className="product-price">S/ {product.price ? Number(product.price).toFixed(2) : 'N/A'}</div>
          <div className="product-stock">Stock: {product.stock ?? 'N/A'}</div>
        </div>
        <div className="product-card-actions">
          <button className="action-icon-btn edit" title="Editar" onClick={() => onEdit(product)}>
            <MdEdit size={20} />
          </button>
          <button className="action-icon-btn delete" title="Eliminar" onClick={() => onDelete(product.id)}>
            <MdDelete size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;