import React, { useState, useEffect } from 'react';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineSearch,
  HiOutlineX
} from 'react-icons/hi';
import '../styles/Sales.css';
import { API_BASE_URL } from '../Conexion';

function Sales() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteDni, setClienteDni] = useState('');
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);

  // Efecto para buscar productos al escribir
  useEffect(() => {
    if (search.trim() === '') {
      setProducts([]);
      return;
    }
    setLoadingProducts(true);
    fetch(`${API_BASE_URL}/api/products/search?q=${encodeURIComponent(search)}`)
      .then(res => res.json())
      .then(data => setProducts(data))
      .finally(() => setLoadingProducts(false));
  }, [search]);

  const filtered = products; // Ya viene filtrado del backend

  const selectProduct = p => {
    setSelectedProduct(p);
    setSearch(p.name);
    setShowSuggestions(false);
  };

  const addToCart = () => {
    if (
      !selectedProduct ||
      quantity < 1 ||
      quantity > selectedProduct.stock
    ) return;
    setCart(prev => {
      const exists = prev.find(x => x.id === selectedProduct.id);
      if (exists) {
        return prev.map(x =>
          x.id === selectedProduct.id
            ? { ...x, quantity: x.quantity + quantity }
            : x
        );
      }
      return [...prev, { ...selectedProduct, quantity }];
    });
    setSearch(''); setSelectedProduct(null); setQuantity(1);
  };

  const removeFromCart = id =>
    setCart(prev => prev.filter(x => x.id !== id));

  const cancelSale = () => {
    setCart([]); setSearch(''); setSelectedProduct(null); setQuantity(1);
  };

  const subtotal = cart.reduce((sum, x) => sum + x.price * x.quantity, 0);
  // IGV incluido en el subtotal
  const igv = subtotal / 1.18 * 0.18;
  const baseImponible = subtotal - igv;
  const total = subtotal; // El total ya incluye IGV

  const handleConfirmSale = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          customer_name: clienteNombre.trim() || 'General public',
          customer_dni: clienteDni.trim() || '',
          total: Number(total.toFixed(2)),
          igv: Number(igv.toFixed(2)),
          items: cart.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: Number(item.price)
          }))
        })
      });
      if (!response.ok) throw new Error('Error al registrar la venta');
      setCart([]); setSearch(''); setSelectedProduct(null); setQuantity(1); setClienteNombre(''); setClienteDni('');
      setShowSaleModal(true); // Mostrar modal de éxito
    } catch (err) {
      alert('Ocurrió un error al registrar la venta');
    }
  };

  return (
    <div className="sales-page">
      {/* MODAL DE ÉXITO */}
      {showSaleModal && (
        <div className="sale-modal">
          <div className="sale-modal-content sale-modal-animate">
            <div className="sale-modal-check">
              <svg width="60" height="60" viewBox="0 0 60 60">
                <circle cx="30" cy="30" r="28" fill="#eafaf1" stroke="#1abc9c" strokeWidth="3"/>
                <polyline points="18,32 27,41 43,23" fill="none" stroke="#1abc9c" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>¡Pedido registrado exitosamente!</h3>
            <button onClick={() => setShowSaleModal(false)}>Cerrar</button>
          </div>
        </div>
      )}
      <header className="sales-header">
        <h2>Generar Venta</h2>
      </header>

      {/* CLIENTE OPCIONAL */}
      <div className="cliente-row">
        <label htmlFor="cliente-input" className="cliente-label">Cliente:</label>
        <input
          id="cliente-input"
          className="cliente-input"
          type="text"
          placeholder="Público general"
          value={clienteNombre}
          onChange={e => setClienteNombre(e.target.value)}
          autoComplete="off"
        />
        <label htmlFor="dni-input" className="cliente-label">DNI:</label>
        <input
          id="dni-input"
          className="cliente-input"
          type="text"
          placeholder="DNI"
          maxLength={8}
          value={clienteDni}
          onChange={e => {
            // Solo permite números y máximo 8 caracteres
            const val = e.target.value.replace(/\D/g, '').slice(0, 8);
            setClienteDni(val);
          }}
          autoComplete="off"
        />
      </div>

      {/* BUSCADOR • CANTIDAD • AGREGAR */}
      <div className="sales-row-inline">
        <div className="search-box">
          <HiOutlineSearch className="ico-search" />
          <input
            className="input-search"
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={e => { setSearch(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          />
          {showSuggestions && (
            <ul className="list-suggestions">
              {loadingProducts && <li>Cargando...</li>}
              {!loadingProducts && filtered.length === 0 && (
                <li className="no-suggestion">Sin coincidencias</li>
              )}
              {!loadingProducts && filtered.map(p => (
                <li key={p.id} onMouseDown={() => selectProduct(p)}>
                  {p.name}
                  <span className="tag-stock">Stock: {p.stock}</span>
                  <span className="tag-price">
                    S/ {Number(p.price).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="qty-box">
          <label>Cant.</label>
          <input
            className="input-qty"
            type="number"
            min="1"
            max={selectedProduct ? selectedProduct.stock : ''}
            value={quantity}
            onChange={e => {
              const val = +e.target.value;
              if (selectedProduct && val > selectedProduct.stock) {
                setQuantity(selectedProduct.stock);
              } else {
                setQuantity(val);
              }
            }}
            disabled={!selectedProduct}
          />
        </div>
        <button
          className="btn-add"
          onClick={addToCart}
          disabled={
            !selectedProduct ||
            quantity < 1 ||
            (selectedProduct && quantity > selectedProduct.stock)
          }
        >
          <HiOutlinePlus /> Agregar
        </button>
      </div>

      {/* STOCK • PRECIO */}
      <div className="info-row">
        <div>
          <small>Stock disponible</small>
          <strong>{selectedProduct ? selectedProduct.stock : '--'}</strong>
        </div>
        <div>
          <small>Precio unitario</small>
          <strong>
            {selectedProduct ? `S/ ${Number(selectedProduct.price).toFixed(2)}` : '--'}
          </strong>
        </div>
      </div>

      {/* CARRITO */}
      <section className="cart-section">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cant.</th>
              <th>Precio</th>
              <th>Subt.</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {cart.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty">No hay productos</td>
              </tr>
            ) : cart.map(item => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>S/ {Number(item.price).toFixed(2)}</td>
                <td>S/ {(Number(item.price) * item.quantity).toFixed(2)}</td>
                <td>
                  <button
                    className="btn-remove"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <HiOutlineTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* TOTALES + ACCIONES */}
      <footer className="sales-footer">
        <div className="totals">
          <span>Subtotal sin IGV: S/ {baseImponible.toFixed(2)}</span>
          <span>IGV (18%): S/ {igv.toFixed(2)}</span>
          <span className="total">Total: S/ {total.toFixed(2)}</span>
        </div>
        <div className="actions">
          <button
            className="btn-cancel"
            onClick={cancelSale}
          >
            <HiOutlineX /> Cancelar
          </button>
          <button
            className="btn-confirm"
            disabled={cart.length === 0}
            onClick={handleConfirmSale}
          >
            Confirmar Venta
          </button>
        </div>
      </footer>
    </div>
  );
}

export default Sales;