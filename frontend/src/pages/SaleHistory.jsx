import React, { useEffect, useState } from "react";
import {
  HiOutlineSearch,
  HiOutlineX,
  HiOutlineCheckCircle,
  HiOutlineBan,
} from "react-icons/hi";
import { API_BASE_URL } from "../Conexion";
import "../styles/SaleHistory.css";

function SaleHistory() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);
  const [details, setDetails] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/sales`)
      .then((res) => res.json())
      .then((data) => {
        setSales(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const openDetails = (sale) => {
    setSelectedSale(sale);
    setDetails([]);
    setDetailsLoading(true);
    fetch(`${API_BASE_URL}/api/sales/${sale.id}`)
      .then((res) => res.json())
      .then((data) => {
        setDetails(data.details || []);
        setDetailsLoading(false);
      })
      .catch(() => setDetailsLoading(false));
  };

  const updateStatus = (saleId, newStatus) => {
    setUpdating(true);
    fetch(`${API_BASE_URL}/api/sales/${saleId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
      .then((res) => res.json())
      .then(() => {
        setSales((prev) =>
          prev.map((s) => (s.id === saleId ? { ...s, status: newStatus } : s))
        );
        setSelectedSale((sel) => (sel ? { ...sel, status: newStatus } : sel));
        setUpdating(false);
      })
      .catch(() => setUpdating(false));
  };

  return (
    <div className="sales-history-page">
      <h2>
        <span role="img" aria-label="historial">
          📋
        </span>{" "}
        Historial de Pedidos/Ventas
      </h2>
      {loading ? (
        <p className="sales-history-loading">Cargando...</p>
      ) : sales.length === 0 ? (
        <div className="sales-history-empty">
          No hay pedidos registrados aún.
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td>{sale.id}</td>
                <td>{sale.customer_name}</td>
                <td>{new Date(sale.createdAt).toLocaleString()}</td>
                <td>S/ {Number(sale.total).toFixed(2)}</td>
                <td>
                  <span className={`status-${sale.status}`}>
                    {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                  </span>
                </td>
                <td>
                  <button
                    className="btn-details"
                    onClick={() => openDetails(sale)}
                  >
                    <HiOutlineSearch /> Ver detalles
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedSale && (
        <div className="sh-modal">
          <div className="sh-modal__content">
            <div className="sh-modal__header">
              <h3>Detalles del Pedido #{selectedSale.id}</h3>
              <button
                className="sh-modal__close"
                onClick={() => setSelectedSale(null)}
              >
                <HiOutlineX size={22} />
              </button>
            </div>
            <div className="sh-modal__info">
              <div className="sh-modal__info-item">
                <span>Cliente:</span> <span>{selectedSale.customer_name}</span>
              </div>
              <div className="sh-modal__info-item">
                <span>Fecha:</span>{" "}
                <span>{new Date(selectedSale.createdAt).toLocaleString()}</span>
              </div>
              <div className="sh-modal__info-item">
                <span>Estado:</span>
                <span className={`status-${selectedSale.status}`}>
                  {selectedSale.status.charAt(0).toUpperCase() +
                    selectedSale.status.slice(1)}
                </span>
              </div>
            </div>
            <table className="sh-modal__table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cant.</th>
                  <th>Precio</th>
                  <th>Subt.</th>
                </tr>
              </thead>
              <tbody>
                {detailsLoading ? (
                  <tr>
                    <td colSpan={4} className="sh-modal__loading">
                      Cargando...
                    </td>
                  </tr>
                ) : details.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="sh-modal__empty">
                      Sin productos
                    </td>
                  </tr>
                ) : (
                  details.map((d, i) => (
                    <tr key={i}>
                      <td>{d.product_name || d.productId}</td>
                      <td>{d.quantity}</td>
                      <td>S/ {Number(d.price).toFixed(2)}</td>
                      <td>S/ {Number(d.subtotal).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="sh-modal__igv-total">
              <div className="sh-modal__igv">
                <b>IGV:</b> S/ {Number(selectedSale.igv || 0).toFixed(2)}
              </div>
              <div className="sh-modal__total">
                <b>Total:</b> S/ {Number(selectedSale.total).toFixed(2)}
              </div>
            </div>
            <div className="sh-modal__actions">
              {selectedSale.status !== "pagada" && (
                <button
                  className="sh-btn sh-btn--success"
                  disabled={updating}
                  onClick={() => updateStatus(selectedSale.id, "pagada")}
                >
                  <HiOutlineCheckCircle /> Marcar como Pagada
                </button>
              )}
              {selectedSale.status !== "anulada" && (
                <button
                  className="sh-btn sh-btn--danger"
                  disabled={updating}
                  onClick={() => updateStatus(selectedSale.id, "anulada")}
                >
                  <HiOutlineBan /> Anular
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SaleHistory;
