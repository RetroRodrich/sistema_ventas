import React, { useEffect, useState } from "react";
import {
  HiOutlineSearch,
  HiOutlineX,
  HiOutlineCheckCircle,
  HiOutlineBan,
  HiOutlinePrinter,
} from "react-icons/hi";
import { HiOutlineShoppingBag } from "react-icons/hi2";
import { API_BASE_URL } from "../Conexion";
import "../styles/SaleHistory.css";
import BoletaButton from "../components/BoletaButton";
import ExportExcelButton from "../components/ExportExcelButton";

/**
 * Página de historial de ventas/pedidos.
 * Permite consultar, ver detalles y cambiar el estado de cada venta.
 */
function SaleHistory() {
  // --- Estados principales ---
  const [sales, setSales] = useState([]); // Lista de ventas
  const [loading, setLoading] = useState(true); // Estado de carga de la tabla principal
  const [selectedSale, setSelectedSale] = useState(null); // Venta seleccionada para el modal
  const [details, setDetails] = useState([]); // Detalles de productos de la venta seleccionada
  const [detailsLoading, setDetailsLoading] = useState(false); // Estado de carga de detalles
  const [updating, setUpdating] = useState(false); // Estado de actualización de estado de venta
  const [filterType, setFilterType] = useState("hoy"); // Filtro de fecha seleccionado
  const [customFrom, setCustomFrom] = useState(""); // Fecha inicio personalizada
  const [customTo, setCustomTo] = useState(""); // Fecha fin personalizada

  // --- Efecto: cargar ventas al montar el componente ---
  useEffect(() => {
    fetchSales();
  }, []);

  /**
   * Obtiene las ventas desde el backend según el filtro seleccionado.
   */
  const fetchSales = async () => {
    setLoading(true);
    let url = `${API_BASE_URL}/api/sales?`;

    // Agrega el filtro correspondiente a la URL
    if (filterType === "hoy") {
      url += "filter=hoy";
    } else if (filterType === "mes") {
      url += "filter=mes";
    } else if (filterType === "anio") {
      url += "filter=anio";
    } else if (filterType === "personalizado" && customFrom && customTo) {
      url += `filter=personalizado&from=${customFrom}&to=${customTo}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setSales(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

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
        // Actualiza el estado local de las ventas y del modal
        setSales((prev) =>
          prev.map((s) => (s.id === saleId ? { ...s, status: newStatus } : s))
        );
        setSelectedSale((sel) => (sel ? { ...sel, status: newStatus } : sel));
        setUpdating(false);
      })
      .catch(() => setUpdating(false));
  };

  /**
   * Devuelve la fecha de hoy en formato local YYYY-MM-DD.
   * Evita problemas de desfase horario con UTC.
   */
  function getTodayLocal() {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    return today.toISOString().split("T")[0];
  }

  // --- Renderizado de la interfaz ---
  return (
    <div className="sales-history-page">
      {/* Header principal */}
      <div className="sales-history-header-card">
        <div className="sales-history-header">
          <span className="sales-history-icon">
            <HiOutlineShoppingBag />
          </span>
          <div className="sales-history-header-titles">
            <span className="sales-history-title">
              Historial de Pedidos/Ventas
            </span>
            <span className="sales-history-subtitle">
              Consulta y gestiona el registro de todas tus ventas y pedidos
              realizados.
            </span>
          </div>
        </div>
      </div>

      {/* Barra de filtros de fecha */}
      <div className="sh-filters-bar">
        <select
          className="sh-filter-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="hoy">Hoy</option>
          <option value="mes">Este mes</option>
          <option value="anio">Este año</option>
          <option value="todo">Todo</option>
          <option value="personalizado">Personalizado</option>
        </select>
        {filterType === "personalizado" && (
          <div className="sh-filter-custom">
            <input
              type="date"
              className="sh-filter-date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              placeholder="Desde"
              max={getTodayLocal()}
            />
            <span style={{ margin: "0 0.5rem" }}>a</span>
            <input
              type="date"
              className="sh-filter-date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              placeholder="Hasta"
              max={getTodayLocal()}
            />
            {/* Botón para poner la fecha final como hoy */}
            <button
              type="button"
              className="sh-btn sh-btn--hoy"
              onClick={() => setCustomTo(getTodayLocal())}
              title="Usar fecha de hoy"
            >
              Hoy
            </button>
          </div>
        )}
        {/* Botón para buscar ventas según el filtro */}
        <button
          className="sh-btn sh-btn--search"
          style={{ marginLeft: 8 }}
          onClick={fetchSales}
        >
          <HiOutlineSearch /> Buscar
        </button>
        <ExportExcelButton
          data={sales}
          filename="historial_ventas.xlsx"
          columns={[
            { label: "ID", value: "id" },
            { label: "Cliente", value: "customer_name" },
            { label: "Vendedor", value: "user_name" },
            { label: "Fecha", value: (row) => new Date(row.createdAt).toLocaleString() },
            { label: "Total", value: (row) => Number(row.total).toFixed(2) },
            { label: "Estado", value: (row) => row.status.charAt(0).toUpperCase() + row.status.slice(1) }
          ]}
          filterType={filterType}
          customFrom={customFrom}
          customTo={customTo}
        >
          Exportar a Excel
        </ExportExcelButton>
      </div>

      {/* Tabla de historial o mensajes de estado */}
      {loading ? (
        <p className="sales-history-loading">Cargando...</p>
      ) : sales.length === 0 ? (
        <div className="sales-history-empty">
          No hay pedidos registrados aún.
        </div>
      ) : (
        <div className="sales-history-table-wrapper">
          <table className="sales-history-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Vendedor</th>
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
                  <td>{sale.user_name}</td>
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
            <div className="sh-modal__body">
              {/* Información general de la venta */}
              <div className="sh-modal__info">
                <div className="sh-modal__info-item">
                  <span>Cliente:</span>{" "}
                  <span>{selectedSale.customer_name}</span>
                </div>
                <div className="sh-modal__info-item">
                  <span>Vendedor:</span>{" "}
                  <span>{selectedSale.user_name}</span> {/* <-- Aquí se muestra el vendedor */}
                </div>
                <div className="sh-modal__info-item">
                  <span>Fecha:</span>{" "}
                  <span>
                    {new Date(selectedSale.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="sh-modal__info-item">
                  <span>Estado:</span>
                  <span style={{ marginLeft: 6 }}>
                    <span
                      className={`status-${selectedSale.status} sh-table-status`}
                    >
                      {selectedSale.status.charAt(0).toUpperCase() +
                        selectedSale.status.slice(1)}
                    </span>
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
              {/* Totales de la venta */}
              <div className="sh-modal__igv-total">
                <div className="sh-modal__sin-igv">
                  <b>Total Gravado:</b> S/{" "}
                  {Number(selectedSale.total - (selectedSale.igv || 0)).toFixed(
                    2
                  )}
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
                {selectedSale.status === "pagada" && (
                  <BoletaButton
                    sale={selectedSale}
                    details={details}
                    icon={<HiOutlinePrinter />}
                    className="btn-print"
                    title="Imprimir boleta"
                  ></BoletaButton>
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
                      Pagar
                    </button>
                    <button
                      className="sh-btn sh-btn--danger"
                      disabled={updating}
                      onClick={() => updateStatus(selectedSale.id, "anulada")}
                      title="Anular"
                    >
                      <HiOutlineBan />
                      Anular
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SaleHistory;