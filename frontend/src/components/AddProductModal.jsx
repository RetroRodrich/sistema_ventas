import React, { useState, useEffect } from 'react';
import { FaBox, FaTag, FaAlignLeft, FaDollarSign, FaBoxes, FaList, FaImage } from 'react-icons/fa';
import '../styles/AddProductModal.css';
import { API_BASE_URL } from '../pages/Products';

function AddProductModal({ onClose, onAddProduct, onSaveProduct, product }) {
  // Estado local para el formulario
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    categoryId: '',
    image: '',
  });

  // Estado para las categorías
  const [categories, setCategories] = useState([]);
  // Cargar categorías al montar el componente
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/categories`)
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error('Error al obtener categorías:', err));
  }, []);

  // Inicializar el formulario al abrir el modal
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        stock: product.stock || '',
        categoryId: product.categoryId || '',
        image: product.image || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        stock: '',
        categoryId: '',
        image: '',
      });
    }
  }, [product]);

  // Manejar cambios en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'categoryId' ? Number(value) : value, // categoryId como número
    });
  };

  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    const productData = {
      ...formData,
      image: formData.image || 'https://t3.ftcdn.net/jpg/04/60/01/36/360_F_460013622_6xF8uN6ubMvLx0tAJECBHfKPoNOR5cRa.jpg', // Imagen por defecto
    };

    if (!productData.categoryId) {
      alert('Por favor, selecciona una categoría');
      return;
    }

    if (product) {
      onSaveProduct(productData); // Editar producto
    } else {
      onAddProduct(productData); // Agregar producto
    }

    onClose(); // Cerrar modal
  };

  return (
    <div className="add-modal-overlay">
      <div className="add-modal-content">
        <h2>
          <FaBox /> {product ? 'Editar Producto' : 'Agregar Producto'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <FaTag className="input-icon" />
            <input
              type="text"
              name="name"
              placeholder="Nombre del producto"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <FaAlignLeft className="input-icon" />
            <textarea
              name="description"
              placeholder="Descripción (Opcional)"
              value={formData.description}
              onChange={handleChange}
            />
          </div>
          <div className="input-group">
            <FaDollarSign className="input-icon" />
            <input
              type="number"
              name="price"
              placeholder="Precio"
              value={formData.price}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <FaBoxes className="input-icon" />
            <input
              type="number"
              name="stock"
              placeholder="Stock"
              value={formData.stock}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <FaList className="input-icon" />
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              required
            >
              <option value="">Selecciona una categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <FaImage className="input-icon" />
            <input
              type="text"
              name="image"
              placeholder="URL de la imagen (opcional)"
              value={formData.image}
              onChange={handleChange}
            />
          </div>
          <div className="modal-buttons">
            <button type="submit" className="add-button">
              {product ? 'Guardar' : 'Agregar'}
            </button>
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProductModal;