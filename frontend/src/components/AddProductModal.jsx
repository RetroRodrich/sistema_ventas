import React, { useState, useEffect } from 'react'
import {
  HiOutlineCollection,
  HiOutlinePencil,
  HiOutlineCurrencyDollar,
  HiOutlineAdjustments,
  HiOutlineTag,
  HiOutlinePhotograph
} from 'react-icons/hi'
import { MdClose } from 'react-icons/md'
import '../styles/AddProductModal.css'
import { API_BASE_URL } from '../Conexion'

function AddProductModal({ onClose, onAddProduct, onSaveProduct, product }) {
  const [formData, setFormData] = useState({ name: '', description: '', price: '', stock: '', categoryId: '', image: '' })
  const [categories, setCategories] = useState([])

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/categories`)
      .then((res) => res.json())
      .then(setCategories)
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (product) setFormData({ ...product })
    else setFormData({ name: '', description: '', price: '', stock: '', categoryId: '', image: '' })
  }, [product])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((f) => ({ ...f, [name]: name === 'categoryId' ? Number(value) : value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = { ...formData, image: formData.image || 'https://t3.ftcdn.net/jpg/04/60/01/36/360_F_460013622_6xF8uN6ubMvLx0tAJECBHfKPoNOR5cRa.jpg' }
    if (!data.categoryId) return alert('Selecciona una categoría')
    product ? onSaveProduct(data) : onAddProduct(data)
    onClose()
  }

  return (
    <div className="add-modal-overlay">
      <div className="add-modal-content">
        <div className="add-modal-header">
          <h2>
            <HiOutlineTag /> {product ? 'Editar Producto' : 'Agregar Producto'}
          </h2>
          <button className="modal-close-btn" onClick={onClose}>
            <MdClose />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="add-modal-body">
          <div className="input-group">
            <span className="input-icon"><HiOutlinePencil /></span>
            <input name="name" value={formData.name} onChange={handleChange} placeholder="Nombre" required />
          </div>
          <div className="input-group">
            <span className="input-icon"><HiOutlineCollection /></span>
            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Descripción (opcional)" />
          </div>
          <div className="input-group">
            <span className="input-icon"><HiOutlineCurrencyDollar /></span>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="Precio"
              required
              min="0"
              step="0.01"
            />
          </div>
          <div className="input-group">
            <span className="input-icon"><HiOutlineAdjustments /></span>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              placeholder="Stock"
              required
              min="0"
              step="1"
            />
          </div>
          <div className="input-group">
            <span className="input-icon"><HiOutlineTag /></span>
            <select name="categoryId" value={formData.categoryId} onChange={handleChange} required>
              <option value="">Selecciona categoría</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="input-group">
            <span className="input-icon"><HiOutlinePhotograph /></span>
            <input name="image" value={formData.image} onChange={handleChange} placeholder="URL de imagen (opcional)" />
          </div>
          <div className="add-modal-footer">
            <button
              className="cancel-button"
              type="button"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              className="add-button"
              type="submit"
            >
              {product ? 'Guardar' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddProductModal