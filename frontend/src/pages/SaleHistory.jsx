import React, { useEffect, useState } from "react";
import {
  HiOutlineSearch,
  HiOutlineX,
  HiOutlineCheckCircle,
  HiOutlineBan,
  HiOutlinePrinter,
} from "react-icons/hi";
import { API_BASE_URL } from "../Conexion";
import "../styles/SaleHistory.css";
import BoletaButton from "../components/BoletaButton";

/**
 * Página de historial de ventas/pedidos.
 * Permite consultar, ver detalles y cambiar el estado de cada venta.
 */
function SaleHistory() {
  // Estados principales
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);
  const [details, setDetails] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Cargar todas las ventas al montar el componente
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/sales`)
      .then((res) => res.json())
      .then((data) => {
        setSales(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  /**
   * Abre el modal de detalles de una venta.
   * @param {Object} sale - Venta seleccionada
   */
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

  /**
   * Cambia el estado de una venta (pagada, anulada, pendiente).
   * @param {number} saleId - ID de la venta
   * @param {string} newStatus - Nuevo estado
   */
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
      {/* Header elegante */}
      <div className="sales-history-header">
        <div className="sales-history-icon">
          <span role="img" aria-label="historial">📋</span>
        </div>
        <div>
          <h2>Historial de Pedidos/Ventas</h2>
          <p className="sales-history-subtitle">
            Consulta y gestiona el registro de todas tus ventas y pedidos realizados.
          </p>
        </div>
      </div>

      {/* Tabla de historial o mensajes de estado */}
      {loading ? (
        <p className="sales-history-loading">Cargando...</p>
      ) : sales.length === 0 ? (
        <div className="sales-history-empty">No hay pedidos registrados aún.</div>
      ) : (
        <div className="sales-history-table-wrapper">
          <table className="sales-history-table">
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
                  <td>
                    <span className="sh-table-total">
                      S/ {Number(sale.total).toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-${sale.status} sh-table-status`}>
                      {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div className="sh-table-actions">
                      <button
                        className="btn-details"
                        onClick={() => openDetails(sale)}
                        title="Ver detalles"
                      >
                        <HiOutlineSearch /> Detalles
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de detalles de venta */}
      {selectedSale && (
        <div className="sh-modal">
          <div className="sh-modal__content">
            {/* Encabezado del modal */}
            <div className="sh-modal__header">
              <h3>Detalles del Pedido #{selectedSale.id}</h3>
              <button
                className="sh-modal__close"
                onClick={() => setSelectedSale(null)}
                title="Cerrar"
              >
                <HiOutlineX size={22} />
              </button>
            </div>
            {/* Información general */}
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
            <div className="sh-modal__table-separator"></div>
            {/* Tabla de productos de la venta */}
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
            <div className="sh-modal__table-separator-bottom"></div>
            {/* Totales */}
            <div className="sh-modal__igv-total">
              <div className="sh-modal__sin-igv">
                <b>Total Gravado:</b> S/ {Number(selectedSale.total - (selectedSale.igv || 0)).toFixed(2)}
              </div>
              <div className="sh-modal__igv">
                <b>IGV:</b> S/ {Number(selectedSale.igv || 0).toFixed(2)}
              </div>
              <div className="sh-modal__total">
                <b>Total:</b> S/ {Number(selectedSale.total).toFixed(2)}
              </div>
            </div>
            {/* Acciones del modal */}
            <div className="sh-modal__actions">
              {(selectedSale.status === "pagada") && (
                <BoletaButton
                  sale={selectedSale}
                  details={details}
                  icon={<HiOutlinePrinter />}
                  className="btn-print"
                  title="Imprimir boleta"
                />
              )}
              {selectedSale.status === "pendiente" && (
                <>
                  <button
                    className="sh-btn sh-btn--success"
                    disabled={updating}
                    onClick={() => updateStatus(selectedSale.id, "pagada")}
                    title="Marcar como Pagada"
                  >
                    <HiOutlineCheckCircle />
                  </button>
                  <button
                    className="sh-btn sh-btn--danger"
                    disabled={updating}
                    onClick={() => updateStatus(selectedSale.id, "anulada")}
                    title="Anular"
                  >
                    <HiOutlineBan />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SaleHistory;
