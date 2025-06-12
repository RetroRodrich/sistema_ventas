import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LabelList, PieChart, Pie, Cell
} from 'recharts';
import { API_BASE_URL } from '../Conexion';
import '../styles/Home.css';

// Paleta de colores para los gráficos
const COLORS = [
  '#2fcabd', '#f44336', '#ff9800', '#4caf50', '#3f51b5',
  '#9c27b0', '#ffeb3b', '#795548', '#00bcd4', '#e91e63'
];

/**
 * Home - Página principal del dashboard.
 * Muestra KPIs y gráficos de ventas por mes y por categoría.
 */
function Home() {
  // =======================
  // Estados principales
  // =======================
  const [ventasPorMes, setVentasPorMes] = useState([]);
  const [categoriasTorta, setCategoriasTorta] = useState([]);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // =======================
  // KPIs calculados
  // =======================
  const totalVentas = ventasPorMes.reduce((acc, v) => acc + (v.total || 0), 0);
  const cantidadMeses = Array.isArray(ventasPorMes) ? ventasPorMes.length : 0;
  const promedioVentasMes = cantidadMeses > 0 ? (totalVentas / cantidadMeses).toFixed(2) : 0;
  const mesMasVentas = ventasPorMes.length > 0
    ? ventasPorMes.reduce((max, v) => v.total > max.total ? v : max, ventasPorMes[0]).mes
    : '-';

  // =======================
  // Efecto: cargar datos de ventas y categorías al montar o cambiar filtros
  // =======================
  useEffect(() => {
    let urlMes = `${API_BASE_URL}/api/dashboard/summary?group=mes`;
    if (fechaInicio) urlMes += `&start=${fechaInicio}`;
    if (fechaFin) urlMes += `&end=${fechaFin}`;
    fetch(urlMes)
      .then(res => res.json())
      .then(data => setVentasPorMes(Array.isArray(data) ? data : []))
      .catch(() => setVentasPorMes([]));

    let urlCategorias = `${API_BASE_URL}/api/dashboard/top-categorias${fechaInicio || fechaFin ? `?` : ''}`;
    if (fechaInicio) urlCategorias += `${urlCategorias.endsWith('?') ? '' : '&'}start=${fechaInicio}`;
    if (fechaFin) urlCategorias += `${urlCategorias.includes('start=') ? '&' : ''}end=${fechaFin}`;
    fetch(urlCategorias)
      .then(res => res.json())
      .then(data => setCategoriasTorta(Array.isArray(data) ? data : []))
      .catch(() => setCategoriasTorta([]));
  }, [fechaInicio, fechaFin]);

  // =======================
  // Tooltip personalizado para barras
  // =======================
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="home-tooltip">
          <strong>{label}</strong>
          <br />
          <span className="home-tooltip-total">Total: {payload[0].value}</span>
        </div>
      );
    }
    return null;
  };

  // =======================
  // Tooltip personalizado para torta
  // =======================
  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="home-tooltip">
          <strong>{payload[0].name}</strong>
          <br />
          <span className="home-tooltip-total">Cantidad: {payload[0].value}</span>
        </div>
      );
    }
    return null;
  };

  // =======================
  // Renderizado principal
  // =======================
  return (
    <div className="home-bg">
      {/* Filtros de fecha */}
      <div className="home-filtros">
        <label className="home-label">
          Desde:&nbsp;
          <input
            type="date"
            value={fechaInicio}
            onChange={e => setFechaInicio(e.target.value)}
            className="home-input"
          />
        </label>
        <label className="home-label">
          Hasta:&nbsp;
          <input
            type="date"
            value={fechaFin}
            onChange={e => setFechaFin(e.target.value)}
            className="home-input"
          />
        </label>
        <button
          className="home-btn"
          onClick={() => { setFechaInicio(''); setFechaFin(''); }}
        >
          Limpiar filtros
        </button>
      </div>

      {/* KPIs principales */}
      <div className="home-kpis">
        <div className="home-card kpi-total">
          <div className="home-kpi-title">Monto total vendido</div>
          <div className="home-kpi-value">S/. {totalVentas}</div>
        </div>
        <div className="home-card kpi-meses">
          <div className="home-kpi-title">Cantidad de meses analizados</div>
          <div className="home-kpi-value">{cantidadMeses}</div>
        </div>
        <div className="home-card kpi-promedio">
          <div className="home-kpi-title">Promedio mensual de ventas</div>
          <div className="home-kpi-value">S/. {promedioVentasMes}</div>
        </div>
        <div className="home-card kpi-mesmax">
          <div className="home-kpi-title">Mes con mayor facturación</div>
          <div className="home-kpi-value">{mesMasVentas}</div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="home-graficos">
        {/* Gráfico de torta por categoría */}
        <div className="home-card-grafico home-card-grafico-torta">
          <h2 className="home-section-title">Categoría más vendida</h2>
          {categoriasTorta.length === 0 && (
            <div className="home-list-empty">Próximamente...</div>
          )}
          {categoriasTorta.length > 0 && (
            <div className="home-torta-flex">
              <div className="home-torta-pie">
                <PieChart width={170} height={170}>
                  <Pie
                    data={categoriasTorta}
                    dataKey="cantidad"
                    nameKey="nombre"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    labelLine={false}
                  >
                    {categoriasTorta.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </div>
              <div className="home-torta-lista">
                {categoriasTorta.map((entry, index) => (
                  <div key={entry.nombre} className="home-torta-legend-item">
                    <span
                      className="home-torta-legend-dot"
                      style={{ background: COLORS[index % COLORS.length] }}
                    ></span>
                    <span className="home-torta-legend-text">
                      {entry.nombre}: <b>{entry.cantidad}</b>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Gráfico de barras por mes */}
        <div className="home-card-grafico home-card-grafico-mes">
          <div className="home-bar-title-container">
            <h2 className="home-section-title home-bar-title">Ventas por mes</h2>
          </div>
          <div className="home-grafico-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ventasPorMes} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" className="home-xaxis" />
                <YAxis className="home-yaxis" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" fill="#2fcabd" radius={[4, 4, 0, 0]}>
                  <LabelList
                    dataKey="total"
                    position="top"
                    className="home-bar-label"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
