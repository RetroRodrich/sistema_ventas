import React, { useState } from 'react';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineSearch,
  HiOutlineX
} from 'react-icons/hi';
import '../styles/Sales.css';

function Sales() {
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);

  const products = [
    { id: 1, name: 'Producto A', price: 10.0, stock: 5 },
    { id: 2, name: 'Producto B', price: 20.0, stock: 3 },
    { id: 3, name: 'Producto C', price: 15.5, stock: 8 }
  ];
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

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
  const igv = subtotal * 0.18;
  const total = subtotal + igv;

  return (
    <div className="sales-page">
      <header className="sales-header">
        <h2>Generar Venta</h2>
      </header>

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
          {showSuggestions && filtered.length > 0 && (
            <ul className="list-suggestions">
              {filtered.map(p => (
                <li key={p.id} onMouseDown={() => selectProduct(p)}>
                  {p.name}
                  <span className="tag-stock">Stock: {p.stock}</span>
                  <span className="tag-price">S/ {p.price.toFixed(2)}</span>
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
          <strong>{selectedProduct ? `S/ ${selectedProduct.price.toFixed(2)}` : '--'}</strong>
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
                <td>S/ {item.price.toFixed(2)}</td>
                <td>S/ {(item.price * item.quantity).toFixed(2)}</td>
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
          <span>Subtotal: S/ {subtotal.toFixed(2)}</span>
          <span>IGV: S/ {igv.toFixed(2)}</span>
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
          >
            Confirmar Venta
          </button>
        </div>
      </footer>
    </div>
  );
}

export default Sales;