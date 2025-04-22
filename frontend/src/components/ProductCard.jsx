import React from 'react';
import '../styles/ProductCard.css'; // Archivo de estilos para las tarjetas

function ProductCard({ product }) {
  return (
    <div className="product-card">
      <div className="product-image-container">
        <img src={product.image} alt={product.name} className="product-image" />
      </div>
      <h3 className="product-name">{product.name}</h3>
      <p className="product-category">Categoría: {product.category || 'N/A'}</p>
      <p className="product-price">
        Precio: S/ {product.price ? Number(product.price).toFixed(2) : 'N/A'}
      </p>
      <p className="product-stock">Stock: {product.stock ?? 'N/A'}</p>
    </div>
  );
}

export default ProductCard;