import React from 'react';
import { FaBox, FaTag, FaAlignLeft, FaDollarSign, FaBoxes, FaList, FaImage } from 'react-icons/fa';
import '../styles/ProductCard.css';

/**
 * Card para mostrar la información de un producto
 */
function ProductCard({ product, onEdit, onDelete }) {
  return (
    <div className="product-card">
      <div className="product-image-container">
        <img src={product.image} alt={product.name} className="product-image" loading='lazy'/>
      </div>
      <h3 className="product-name">{product.name}</h3>
      <p className="product-category">Categoría: {product.category || 'N/A'}</p>
      <p className="product-price">
        Precio: S/ {product.price ? Number(product.price).toFixed(2) : 'N/A'}
      </p>
      <p className="product-stock">Stock: {product.stock ?? 'N/A'}</p>
      <div className="product-card-buttons">
        <button className="edit-button" onClick={() => onEdit(product)}>
          Editar
        </button>
        <button className="delete-button" onClick={() => onDelete(product.id)}>
          Eliminar
        </button>
      </div>
    </div>
  );
}

export default ProductCard;