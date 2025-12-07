/**
 * SaleHistory - Página de historial de ventas/pedidos.
 * Permite consultar, ver detalles y cambiar el estado de cada venta.
 * 
 * Funcionalidades principales:
 * - Filtrado y búsqueda de ventas.
 * - Paginación de resultados.
 * - Visualización de detalles de ventas en un modal.
 * - Exportación de datos a Excel.
 * - Actualización del estado de ventas (pagada, anulada, pendiente).
 * - Sincronización en tiempo real con WebSockets.
 */

// Importaciones necesarias
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import socket from '../components/socket';
import { useNavigate } from "react-router-dom";
import {
  HiOutlineSearch,
  HiOutlineX,
  HiOutlineCheckCircle,
  HiOutlineBan,
  HiOutlinePrinter,
} from "react-icons/hi";
import { HiOutlineShoppingBag } from "react-icons/hi2";
import { API_BASE_URL } from "../Conexion";
import { authenticatedFetch, getAuthToken } from "../utils/auth";
import "../styles/SaleHistory.css";
import BoletaButton from "../components/BoletaButton";
import ExportExcelButton from "../components/ExportExcelButton";
import SaleHistoryPaginationBar from "../components/SaleHistoryPaginationBar";


/**
 * SaleHistory - Página de historial de ventas/pedidos.
 * Permite consultar, ver detalles y cambiar el estado de cada venta.
 */
function SaleHistory() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // =======================
  // Estados para búsqueda y paginación
  // =======================
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const SALES_PER_PAGE = 10;

  // =======================
  // Estados principales
  // =======================
  const [filterType, setFilterType] = useState("hoy"); // Estado inicial para el filtro de ventas
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [selectedSale, setSelectedSale] = useState(null); // Venta seleccionada para el modal
  const [errorMsg, setErrorMsg] = useState("");
  const [updating, setUpdating] = useState(false); // Estado de actualización de estado de venta

  // =======================
  // Efecto: Escuchar eventos de venta_actualizada por WebSocket y refrescar queries
  // =======================
  useEffect(() => {
    const handleVentaActualizada = () => {
      // Invalida la query de ventas y detalles para refrescar el historial
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['saleDetails'] });
    };
    socket.on('venta_actualizada', handleVentaActualizada);
    return () => {
      socket.off('venta_actualizada', handleVentaActualizada);
    };
  }, [queryClient]);

  // =======================
  // Verificar autenticación al cargar componente
  // =======================
  useEffect(() => {
    const token = getAuthToken();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || !user.id) {
      alert('Debes iniciar sesión para acceder a esta página');
      navigate('/login');
    }
  }, [navigate]);

  // =======================
  // Función: Generar URL de ventas según filtro
  // =======================
  const getSalesUrl = useCallback(() => {
    let url = `${API_BASE_URL}/api/sales?`;
    if (filterType === "hoy") {
      url += "filter=hoy";
    } else if (filterType === "mes") {
      url += "filter=mes";
    } else if (filterType === "anio") {
      url += "filter=anio";
    } else if (filterType === "personalizado" && customFrom && customTo) {
      url += `filter=personalizado&from=${customFrom}&to=${customTo}`;
    } else if (filterType === "todo") {
      url += "filter=todo";
    }
    return url;
  }, [filterType, customFrom, customTo]);

  // =======================
  // React Query: obtener ventas según filtro
  // =======================
  const {
    data: sales = [],
    isLoading: loading,
    isError,
    error,
    refetch: refetchSales,
  } = useQuery({
    queryKey: [
      "sales",
      filterType,
      customFrom,
      customTo
    ],
    queryFn: async () => {
      const url = getSalesUrl();
      const res = await fetch(url);
      if (!res.ok) {
        let msg = `Error al cargar ventas (${res.status})`;
        if (res.status === 429) msg = 'Demasiadas solicitudes. Espera unos minutos antes de volver a intentar.';
        throw new Error(msg);
      }
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('Respuesta inesperada del servidor.');
      return data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
    cacheTime: 1000 * 60 * 10, // 10 minutos
    onError: (err) => setErrorMsg(err.message),
    onSuccess: () => setErrorMsg("")
  });


  // =======================
  // React Query: detalles de venta (por ID)
  // =======================
  const {
    data: details = [],
    isLoading: detailsLoading,
    refetch: refetchDetails,
  } = useQuery({
    queryKey: ["saleDetails", selectedSale?.id],
    queryFn: async () => {
      if (!selectedSale?.id) return [];
      const res = await fetch(`${API_BASE_URL}/api/sales/${selectedSale.id}`);
      if (!res.ok) throw new Error("Error al cargar detalles de la venta");
      const data = await res.json();
      return data.details || [];
    },
    enabled: !!selectedSale,
    staleTime: 1000 * 60 * 5, // 5 minutos
    cacheTime: 1000 * 60 * 20, // 20 minutos
  });

  /**
   * Abre el modal de detalles de una venta y dispara la carga de detalles (cacheados por React Query)
   */
  const openDetails = (sale) => {
    setSelectedSale(sale);
    refetchDetails(); // Cargar detalles de forma diferida
  };



  /**
   * Cambia el estado de una venta (pagada, anulada, pendiente) usando React Query Mutation
   */
  const mutation = useMutation({
    mutationFn: async ({ saleId, newStatus }) => {
      setUpdating(true);
      const response = await authenticatedFetch(`/sales/${saleId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return { saleId, newStatus };
    },
    onSuccess: ({ saleId, newStatus }) => {
      // Invalidar queries relevantes
      queryClient.invalidateQueries(["sales"]);
      queryClient.invalidateQueries(["saleDetails", saleId]);
      // Invalida queries del dashboard para refrescar KPIs y gráficos
      queryClient.invalidateQueries({ queryKey: ["ventasPorMes"] });
      queryClient.invalidateQueries({ queryKey: ["categoriasTorta"] });
      if (newStatus === 'anulada' || newStatus === 'pagada') {
        queryClient.invalidateQueries(['products']);
      }
      // Actualizar modal si está abierto
      setSelectedSale((sel) => (sel ? { ...sel, status: newStatus } : sel));
      setUpdating(false);
    },
    onError: (err) => {
      if (err.message.includes('Sesión expirada')) {
        alert('Tu sesión ha expirado. Serás redirigido al login.');
        navigate('/login');
      } else {
        alert(`Error al actualizar estado: ${err.message}`);
      }
      setUpdating(false);
    }
  });

  const updateStatus = (saleId, newStatus) => {
    mutation.mutate({ saleId, newStatus });
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


  /**
   * Agrupa los detalles por producto (usando productId o product_name).
   * Suma cantidades y subtotales para mostrar solo una fila por producto.
   * @param {Array} details - Detalles originales de la venta
   * @returns {Array} Detalles agrupados por producto
   */
  function groupDetailsByProduct(details) {
    const grouped = {};
    details.forEach((d) => {
      const key = d.productId || d.product_name;
      if (!grouped[key]) {
        grouped[key] = {
          ...d,
          quantity: Number(d.quantity),
          subtotal: Number(d.subtotal),
        };
      } else {
        grouped[key].quantity += Number(d.quantity);
        grouped[key].subtotal += Number(d.subtotal);
      }
    });
    return Object.values(grouped);
  }

  // --- Renderizado de la interfaz ---
  // --- Búsqueda y paginación ---
  // Filtrado por búsqueda (ID, cliente, vendedor)
  const filteredSales = useMemo(() => {
    if (!Array.isArray(sales)) return [];
    const searchLower = search.toLowerCase();
    return sales.filter(sale =>
      sale.id.toString().includes(searchLower) ||
      (sale.customer_name && sale.customer_name.toLowerCase().includes(searchLower)) ||
      (sale.user_name && sale.user_name.toLowerCase().includes(searchLower))
    );
  }, [sales, search]);

  // Paginación
  const paginatedSales = useMemo(() => {
    const startIndex = (currentPage - 1) * SALES_PER_PAGE;
    const endIndex = currentPage * SALES_PER_PAGE;
    return sales.slice(startIndex, endIndex);
  }, [sales, currentPage, SALES_PER_PAGE]);

  const totalPages = useMemo(() => {
    return Math.ceil(sales.length / SALES_PER_PAGE) || 1;
  }, [sales, SALES_PER_PAGE]);

  // Cambiar de página
  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Resetear página al cambiar búsqueda o filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterType, customFrom, customTo]);

  // Datos exportables para Excel
  const exportableData = useMemo(() => {
    return filteredSales.map(sale => ({
      id: sale.id,
      customer_name: sale.customer_name,
      user_name: sale.user_name,
      createdAt: new Date(sale.createdAt).toLocaleString(),
      total: `S/ ${Number(sale.total).toFixed(2)}`,
      status: sale.status.charAt(0).toUpperCase() + sale.status.slice(1),
    }));
  }, [filteredSales]);

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
              Consulta y gestiona el registro de todas tus ventas y pedidos realizados.
            </span>
          </div>
        </div>
      </div>

      {/* Controles de filtros y búsqueda */}
      <div className="sales-history-controls">
        {/* Barra de búsqueda */}
        <div className="sales-history-search-wrapper">
          <input
            className="sales-history-search-input"
            type="text"
            placeholder="Buscar por N° venta, cliente o vendedor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span className="sales-history-search-icon">
            <HiOutlineSearch />
          </span>
          {search && (
            <button
              className="sales-history-clear-button"
              aria-label="Limpiar búsqueda"
              onClick={() => setSearch("")}
            >
              <HiOutlineX />
            </button>
          )}
        </div>

        {/* Fila de controles */}
        <div className="sales-history-controls-row">
          {/* Grupo de filtros */}
          <div className="sales-history-filters-group">
            <select
              className="sales-history-filter-select"
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
            >
              <option value="hoy">Hoy</option>
              <option value="mes">Este mes</option>
              <option value="anio">Este año</option>
              <option value="todo">Todo</option>
              <option value="personalizado">Personalizado</option>
            </select>
            
            {filterType === 'personalizado' && (
              <>
                <input
                  type="date"
                  className="sales-history-filter-date"
                  value={customFrom}
                  max={customTo || getTodayLocal()}
                  onChange={e => setCustomFrom(e.target.value)}
                />
                <span className="sales-history-date-separator">a</span>
                <input
                  type="date"
                  className="sales-history-filter-date"
                  value={customTo}
                  min={customFrom}
                  max={getTodayLocal()}
                  onChange={e => setCustomTo(e.target.value)}
                />
              </>
            )}
          </div>

          {/* Botón de exportar */}
          <div className="sales-history-export-wrapper">
            <ExportExcelButton
              data={exportableData}
              columns={[
                { label: "ID", value: "id" },
                { label: "Cliente", value: "customer_name" },
                { label: "Vendedor", value: "user_name" },
                { label: "Fecha", value: "createdAt" },
                { label: "Total", value: "total" },
                { label: "Estado", value: "status" },
              ]}
              filterType={filterType}
              customFrom={customFrom}
              customTo={customTo}
            />
          </div>
        </div>
      </div>

      {/* Tabla de historial o mensajes de estado */}
      {loading ? (
        <p className="sales-history-loading">Cargando...</p>
      ) : errorMsg || isError ? (
        <div className="sales-history-error">{errorMsg || (error && error.message)}</div>
      ) : !Array.isArray(filteredSales) || filteredSales.length === 0 ? (
        <div className="sales-history-empty">
          No hay pedidos registrados aún.
        </div>
      ) : (
        <div className="sales-history-table-wrapper">
          <div className="pagination-bar-wrapper" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '0.5rem'}}>
            <SaleHistoryPaginationBar
              currentPage={currentPage}
              totalPages={totalPages}
              onPrev={() => goToPage(currentPage - 1)}
              onNext={() => goToPage(currentPage + 1)}
            />
          </div>
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
              {paginatedSales.map((sale) => (
                <tr key={sale.id}>
                  <td data-label="ID">{sale.id}</td>
                  <td data-label="Cliente">{sale.customer_name}</td>
                  <td data-label="Vendedor">{sale.user_name}</td>
                  <td data-label="Fecha">{new Date(sale.createdAt).toLocaleString()}</td>
                  <td data-label="Total">
                    <span className="sh-table-total">
                      S/ {Number(sale.total).toFixed(2)}
                    </span>
                  </td>
                  <td data-label="Estado">
                    <span className={`status-${sale.status} sh-table-status`}>
                      {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                    </span>
                  </td>
                  <td data-label="Acciones">
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
        <div className="sh-modal" onClick={() => setSelectedSale(null)}>
          <div className="sh-modal__content" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sh-modal__header">
              <h3 className="sh-modal__title">
                <HiOutlineShoppingBag className="sh-modal__title-icon" />
                Pedido #{selectedSale.id}
              </h3>
              <button
                className="sh-modal__close"
                onClick={() => setSelectedSale(null)}
                title="Cerrar"
              >
                <HiOutlineX size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="sh-modal__body">
              {/* Info Cards Grid */}
              <div className="sh-modal__info-grid">
                <div className="sh-modal__info-card">
                  <span className="sh-modal__info-label">Cliente</span>
                  <span className="sh-modal__info-value">{selectedSale.customer_name}</span>
                </div>
                <div className="sh-modal__info-card">
                  <span className="sh-modal__info-label">Vendedor</span>
                  <span className="sh-modal__info-value">{selectedSale.user_name}</span>
                </div>
                <div className="sh-modal__info-card">
                  <span className="sh-modal__info-label">Fecha</span>
                  <span className="sh-modal__info-value">
                    {new Date(selectedSale.createdAt).toLocaleDateString('es-PE')}
                  </span>
                </div>
                <div className="sh-modal__info-card">
                  <span className="sh-modal__info-label">Estado</span>
                  <span className={`sh-modal__status sh-modal__status--${selectedSale.status}`}>
                    {selectedSale.status.charAt(0).toUpperCase() + selectedSale.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Products Table */}
              <div className="sh-modal__products">
                <h4 className="sh-modal__products-title">Productos</h4>
                <div className="sh-modal__table-container">
                  <table className="sh-modal__table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cant.</th>
                        <th>Precio</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailsLoading ? (
                        <tr>
                          <td colSpan={4} className="sh-modal__table-loading">
                            Cargando productos...
                          </td>
                        </tr>
                      ) : details.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="sh-modal__table-empty">
                            Sin productos registrados
                          </td>
                        </tr>
                      ) : (
                        groupDetailsByProduct(details).map((d, i) => (
                          <tr key={i}>
                            <td className="sh-modal__table-product">{d.product_name || d.productId}</td>
                            <td className="sh-modal__table-qty">{d.quantity}</td>
                            <td className="sh-modal__table-price">S/ {Number(d.price).toFixed(2)}</td>
                            <td className="sh-modal__table-subtotal">S/ {Number(d.subtotal).toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totales */}
              <div className="sh-modal__totals">
                <div className="sh-modal__totals-row">
                  <span>Gravado:</span>
                  <span>S/ {Number(selectedSale.total - (selectedSale.igv || 0)).toFixed(2)}</span>
                </div>
                <div className="sh-modal__totals-row">
                  <span>IGV (18%):</span>
                  <span>S/ {Number(selectedSale.igv || 0).toFixed(2)}</span>
                </div>
                <div className="sh-modal__totals-row sh-modal__totals-row--final">
                  <span>TOTAL:</span>
                  <span>S/ {Number(selectedSale.total).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer con acciones */}
            <div className="sh-modal__footer">
              {selectedSale.status === "pagada" && (
                <BoletaButton
                  sale={selectedSale}
                  details={groupDetailsByProduct(details)}
                  icon={<HiOutlinePrinter size={18} />}
                  className="sh-modal__btn sh-modal__btn--print"
                  title="Imprimir boleta"
                />
              )}
              {selectedSale.status === "pendiente" && (
                <>
                  <button
                    className="sh-modal__btn sh-modal__btn--success"
                    disabled={updating}
                    onClick={() => updateStatus(selectedSale.id, "pagada")}
                  >
                    <HiOutlineCheckCircle size={18} />
                    Marcar Pagada
                  </button>
                  <button
                    className="sh-modal__btn sh-modal__btn--danger"
                    disabled={updating}
                    onClick={() => updateStatus(selectedSale.id, "anulada")}
                  >
                    <HiOutlineBan size={18} />
                    Anular
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