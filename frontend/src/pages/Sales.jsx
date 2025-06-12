// =======================
// Importaciones y dependencias
// =======================
import React, { useState, useEffect, useRef } from 'react';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineSearch,
  HiOutlineX,
  HiOutlineShoppingCart,
  HiOutlineCheckCircle,
  HiOutlineCreditCard
} from 'react-icons/hi';
import '../styles/Sales.css';
import { API_BASE_URL } from '../Conexion';

/**
 * Sales - Página principal para registrar ventas.
 * Permite buscar productos, agregarlos al carrito, registrar ventas y marcar como pagadas.
 */
function Sales() {
  // =======================
  // Estados principales
  // =======================
  const user = JSON.parse(localStorage.getItem('user') || '{}'); // Usuario autenticado
  const [search, setSearch] = useState(''); // Texto de búsqueda
  const [showSuggestions, setShowSuggestions] = useState(false); // Mostrar sugerencias
  const [selectedProduct, setSelectedProduct] = useState(null); // Producto seleccionado
  const [quantity, setQuantity] = useState(1); // Cantidad a agregar
  const [cart, setCart] = useState([]); // Carrito de compras
  const [clienteNombre, setClienteNombre] = useState(''); // Nombre del cliente
  const [clienteDni, setClienteDni] = useState(''); // DNI del cliente
  const [products, setProducts] = useState([]); // Productos encontrados
  const [loadingProducts, setLoadingProducts] = useState(false); // Estado de carga de productos
  const [showSaleModal, setShowSaleModal] = useState(false); // Mostrar modal de éxito
  const [saleModalMessage, setSaleModalMessage] = useState("Pedido registrado exitosamente!");
  const searchInputRef = useRef(null);
  const qtyInputRef = useRef(null);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const [horaActual, setHoraActual] = useState(new Date());

  // =======================
  // Búsqueda de productos al escribir
  // =======================
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

  // =======================
  // Actualizar la hora cada segundo
  // =======================
  useEffect(() => {
    const timer = setInterval(() => setHoraActual(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // =======================
  // Lista filtrada de productos (ya viene filtrada del backend)
  // =======================
  const filtered = products;

  // =======================
  // Selección de producto de la lista de sugerencias
  // =======================
  const selectProduct = p => {
    setSelectedProduct(p);
    setSearch(p.name);
    setShowSuggestions(false);
    setQuantity(""); // Deja vacío para que el cajero escriba
    setTimeout(() => qtyInputRef.current && qtyInputRef.current.focus(), 0);
  };

  // =======================
  // Agregar producto al carrito
  // =======================
  const addToCart = () => {
    if (
      !selectedProduct ||
      !quantity ||
      quantity < 1 ||
      quantity > selectedProduct.stock
    ) return;
    setCart(prev => {
      const exists = prev.find(x => x.id === selectedProduct.id);
      if (exists) {
        return prev.map(x =>
          x.id === selectedProduct.id
            ? { ...x, quantity: x.quantity + Number(quantity) }
            : x
        );
      }
      return [...prev, { ...selectedProduct, quantity: Number(quantity) }];
    });
    setSearch('');
    setSelectedProduct(null);
    setQuantity("");
    setTimeout(() => searchInputRef.current && searchInputRef.current.focus(), 0);
  };

  // =======================
  // Eliminar producto del carrito
  // =======================
  const removeFromCart = id =>
    setCart(prev => prev.filter(x => x.id !== id));

  // =======================
  // Cancelar venta y limpiar campos
  // =======================
  const cancelSale = () => {
    setCart([]);
    setSearch('');
    setSelectedProduct(null);
    setQuantity(1);
  };

  // =======================
  // Cálculo de totales
  // =======================
  const subtotal = cart.reduce((sum, x) => sum + x.price * x.quantity, 0); // Suma de productos
  const igv = subtotal / 1.18 * 0.18; // IGV incluido en el subtotal
  const baseImponible = subtotal - igv; // Subtotal sin IGV
  const total = subtotal; // El total ya incluye IGV

  // =======================
  // Confirmar venta (envío al backend)
  // =======================
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
          status: "pendiente", // Estado pendiente por defecto
          items: cart.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: Number(item.price)
          }))
        })
      });
      if (!response.ok) throw new Error('Error al registrar la venta');
      // Limpiar todo y mostrar modal de éxito
      setCart([]);
      setSearch('');
      setSelectedProduct(null);
      setQuantity(1);
      setClienteNombre('');
      setClienteDni('');
      setShowSaleModal(true);
    } catch (err) {
      alert('Ocurrió un error al registrar la venta');
    }
  };

  // =======================
  // Renderizado principal
  // =======================
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
            <h3>{saleModalMessage}</h3>
            <button onClick={() => setShowSaleModal(false)}>Cerrar</button>
          </div>
        </div>
      )}

      {/* CABECERA */}
      <div className="sales-header-card">
        <div className="sales-header">
          <span className="sales-icon">
            <HiOutlineShoppingCart />
          </span>
          <div className="sales-header-titles">
            <span className="sales-title">Generar Venta</span>
            <span className="sales-subtitle">
              Busca productos, agrégalos al carrito y confirma la venta para llevar el control de tus operaciones.
            </span>
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL POS */}
      <div className="sales-main-content">
        {/* Tarjeta izquierda: Cliente, búsqueda y agregar */}
        <div className="sales-card sales-card-left">
          {/* Cliente y DNI en una sola fila */}
          <div className="cliente-row">
            <div className="cliente-group">
              <label className="cliente-label">Cliente:</label>
              <input
                className="cliente-input"
                type="text"
                placeholder="Público general"
                value={clienteNombre}
                onChange={e => setClienteNombre(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="cliente-group">
              <label className="cliente-label">DNI:</label>
              <input
                className="cliente-input"
                type="text"
                placeholder="DNI"
                maxLength={8}
                value={clienteDni}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                  setClienteDni(val);
                }}
                autoComplete="off"
              />
            </div>
          </div>
          {/* Buscador y cantidad en una fila */}
          <div className="sales-row-inline">
            <div className="search-qty-row">
              <div className="search-box">
                <HiOutlineSearch className="ico-search" />
                <input
                  ref={searchInputRef}
                  className="input-search"
                  type="text"
                  placeholder="Buscar producto..."
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value);
                    setShowSuggestions(true);
                    setSuggestionIndex(-1);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onKeyDown={e => {
                    if (!showSuggestions || filtered.length === 0) return;
                    if (e.key === "ArrowDown") {
                      setSuggestionIndex(idx => Math.min(idx + 1, filtered.length - 1));
                      e.preventDefault();
                    } else if (e.key === "ArrowUp") {
                      setSuggestionIndex(idx => Math.max(idx - 1, 0));
                      e.preventDefault();
                    } else if (e.key === "Enter" && suggestionIndex >= 0) {
                      selectProduct(filtered[suggestionIndex]);
                      setSuggestionIndex(-1);
                      setTimeout(() => qtyInputRef.current && qtyInputRef.current.focus(), 0);
                      e.preventDefault();
                    }
                  }}
                />
                {/* Botón para limpiar búsqueda */}
                {search && (
                  <button
                    className="clear-search-btn"
                    onClick={() => {
                      setSearch("");
                      setShowSuggestions(false);
                      setSelectedProduct(null);
                    }}
                    title="Limpiar búsqueda"
                    type="button"
                    tabIndex={-1}
                    style={{
                      background: "none",
                      border: "none",
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                      color: "#888"
                    }}
                  >
                    <HiOutlineX />
                  </button>
                )}
                {/* Sugerencias flotantes */}
                {showSuggestions && (
                  <ul className="list-suggestions">
                    {loadingProducts && <li>Cargando...</li>}
                    {!loadingProducts && filtered.length === 0 && (
                      <li className="no-suggestion">Sin coincidencias</li>
                    )}
                    {!loadingProducts &&
                      filtered.map((p, idx) => (
                        <li
                          key={p.id}
                          onMouseDown={() => selectProduct(p)}
                          className={suggestionIndex === idx ? "active-suggestion" : ""}
                          style={{
                            background: suggestionIndex === idx ? "#eafaf1" : undefined,
                          }}
                        >
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
              <div className="qty-box-inline">
                <span className="qty-label">Cant.</span>
                <input
                  ref={qtyInputRef}
                  className="input-qty-inline"
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
                  onKeyDown={e => {
                    if (e.key === "Enter" && selectedProduct && quantity > 0) {
                      addToCart();
                      setTimeout(() => searchInputRef.current && searchInputRef.current.focus(), 0);
                    }
                  }}
                  disabled={!selectedProduct}
                />
              </div>
            </div>
            {/* Botón agregar debajo */}
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
          {/* Info stock/precio */}
          <div className="info-bar">
            <span className="info-stock">
              <svg width="16" height="16" style={{marginRight: 4, verticalAlign: 'middle'}} fill="none" stroke="#1abc9c" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 2"/></svg>
              Stock: <b>{selectedProduct ? selectedProduct.stock : '--'}</b>
            </span>
            <span className="info-price">
              <svg width="16" height="16" style={{marginRight: 4, verticalAlign: 'middle'}} fill="none" stroke="#223047" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7H14.5a3.5 3.5 0 0 1 0 7H6"/></svg>
              Precio: <b>{selectedProduct ? `S/ ${Number(selectedProduct.price).toFixed(2)}` : '--'}</b>
            </span>
          </div>
        </div>

        {/* Tarjeta derecha: Carrito y totales */}
        <div className="sales-card sales-card-right">
          {/* Hora actual encima de la tabla */}
          <div className="hora-actual-box">
            <span className="hora-label">Hora:</span>
            <span className="hora-value">{horaActual.toLocaleTimeString()}</span>
          </div>
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
          <footer className="sales-footer">
            <div className="totals">
              <span>Total Gravado: S/ {baseImponible.toFixed(2)}</span>
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
                onClick={async () => {
                  setSaleModalMessage("Pedido Generado Exitosamente");
                  await handleConfirmSale();
                }}
              >
                <HiOutlineCheckCircle /> Pendiente
              </button>
              <button
                className="btn-confirm pay"
                disabled={cart.length === 0}
                onClick={async () => {
                  setSaleModalMessage("Venta Realizada Exitosamente");
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
                        status: "pagada",
                        items: cart.map(item => ({
                          id: item.id,
                          quantity: item.quantity,
                          price: Number(item.price)
                        }))
                      })
                    });
                    if (!response.ok) throw new Error('Error al registrar la venta');
                    setCart([]);
                    setSearch('');
                    setSelectedProduct(null);
                    setQuantity(1);
                    setClienteNombre('');
                    setClienteDni('');
                    setShowSaleModal(true);
                  } catch (err) {
                    alert('Ocurrió un error al registrar la venta');
                  }
                }}
                title="Registrar y marcar como pagada"
              >
                <HiOutlineCreditCard /> Confirmar y Pagar
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default Sales;