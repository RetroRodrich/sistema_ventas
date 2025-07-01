import React, { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import socket from '../components/socket';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LabelList, PieChart, Pie, Cell
} from 'recharts';
import { 
  FaDollarSign, 
  FaCalendarAlt, 
  FaChartLine, 
  FaTrophy,
  FaChartPie,
  FaChartBar,
  FaFilter
} from 'react-icons/fa';
import { API_BASE_URL } from '../Conexion';
import '../styles/Home.css';

// Paleta de colores para los gráficos
const COLORS = [
  '#2fcabd', '#0ea5e9', '#3b82f6', '#009688', '#0284c7',
  '#26a69a', '#1d4ed8', '#f59e0b', '#4db6ac', '#0369a1',
  '#80cbc4', '#d97706', '#0891b2', '#06b6d4', '#8b5cf6'
];
const PIE_COLORS = [
  '#2fcabd', '#0ea5e9', '#3b82f6', '#8b5cf6', '#ec4899',
  '#f59e0b', '#10b981', '#6366f1', '#ef4444', '#06b6d4'
];

// Utilidad para construir URLs de dashboard
const buildDashboardUrl = (base, params = {}) => {
  const url = new URL(base, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.append(key, value);
  });
  return url.toString();
};

/**
 * Home - Página principal del dashboard.
 * Muestra KPIs y gráficos de ventas por mes y por categoría.
 */
/**
 * Home - Página principal del dashboard.
 * Optimizada con React Query para cacheo de datos de ventas y categorías.
 */
function Home() {
  // =======================
  // Estados principales
  // =======================
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [chartSize, setChartSize] = useState({ width: 240, height: 240, radius: 110 });

  // =======================
  // React Query Client para invalidar queries
  // =======================
  const queryClient = useQueryClient();

  // =======================
  // Fetch de datos con React Query (cacheo y sincronización)
  // =======================
  const {
    data: ventasPorMes = [],
    isLoading: loadingVentas,
    isError: errorVentas,
  } = useQuery({
    queryKey: ['ventasPorMes', fechaInicio, fechaFin],
    queryFn: async () => {
      let url = `${API_BASE_URL}/api/dashboard/summary?group=mes`;
      if (fechaInicio) url += `&start=${fechaInicio}`;
      if (fechaFin) url += `&end=${fechaFin}`;
      const res = await fetch(url);
      return await res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    cacheTime: 1000 * 60 * 30, // 30 minutos
    refetchOnWindowFocus: false,
  });

  const {
    data: categoriasTorta = [],
    isLoading: loadingCategorias,
    isError: errorCategorias,
  } = useQuery({
    queryKey: ['categoriasTorta', fechaInicio, fechaFin],
    queryFn: async () => {
      let url = `${API_BASE_URL}/api/dashboard/top-categorias${fechaInicio || fechaFin ? `?` : ''}`;
      if (fechaInicio) url += `${url.endsWith('?') ? '' : '&'}start=${fechaInicio}`;
      if (fechaFin) url += `${url.includes('start=') ? '&' : ''}end=${fechaFin}`;
      const res = await fetch(url);
      return await res.json();
    },
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  // =======================
  // Efecto: Escuchar eventos de venta_actualizada por WebSocket y refrescar queries
  // =======================
  useEffect(() => {
    const handleVentaActualizada = (data) => {
      console.log('Evento venta_actualizada recibido en Home:', data);
      // Forzar refetch de todas las queries de ventas y categorías
      queryClient.refetchQueries({ queryKey: ['ventasPorMes'] });
      queryClient.refetchQueries({ queryKey: ['categoriasTorta'] });
    };
    socket.on('venta_actualizada', handleVentaActualizada);
    return () => {
      socket.off('venta_actualizada', handleVentaActualizada);
    };
  }, [queryClient]);

  // =======================
  // KPIs calculados
  // =======================
  const totalVentas = ventasPorMes.reduce((acc, v) => acc + (v.total || 0), 0);
  const cantidadMeses = Array.isArray(ventasPorMes) ? ventasPorMes.length : 0;
  const promedioVentasMes = cantidadMeses > 0 ? (totalVentas / cantidadMeses).toFixed(2) : 0;
  const mesMasVentas = ventasPorMes.length > 0
    ? ventasPorMes.reduce((max, v) => v.total > max.total ? v : max, ventasPorMes[0]).mes
    : '-';

  // (El fetch ahora lo maneja React Query)

  // =======================
  // Tooltip personalizado para barras
  // =======================
  // Tooltip personalizado para barras (memoizado)
  const CustomTooltip = useCallback(({ active, payload, label }) => {
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
  }, []);

  // =======================
  // Tooltip personalizado para torta
  // =======================
  const PieTooltip = useCallback(({ active, payload }) => {
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
  }, []);

  // =======================
  // Efecto: Actualizar tamaño del gráfico según la resolución
  // =======================
  // Resize del gráfico con debounce para evitar renders excesivos
  useEffect(() => {
    let timeout;
    const updateChartSize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const width = window.innerWidth;
        if (width >= 1600) {
          setChartSize({ width: 300, height: 300, radius: 130 });
        } else if (width <= 480) {
          setChartSize({ width: 180, height: 180, radius: 75 });
        } else if (width <= 768) {
          setChartSize({ width: 200, height: 200, radius: 85 });
        } else {
          setChartSize({ width: 240, height: 240, radius: 110 });
        }
      }, 100);
    };
    updateChartSize();
    window.addEventListener('resize', updateChartSize);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updateChartSize);
    };
  }, []);

  // =======================
  // Renderizado principal
  // =======================
  return (
    <div className="home-bg">
      {/* Filtros de fecha */}
      <div className="home-filtros">
        <div className="home-filtros-icon">
          <FaFilter />
        </div>
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
          <div className="home-kpi-icon">
            <FaDollarSign />
          </div>
          <div className="home-kpi-title">Monto total vendido</div>
          <div className="home-kpi-value">S/. {totalVentas}</div>
        </div>
        <div className="home-card kpi-meses">
          <div className="home-kpi-icon">
            <FaCalendarAlt />
          </div>
          <div className="home-kpi-title">Cantidad de meses analizados</div>
          <div className="home-kpi-value">{cantidadMeses}</div>
        </div>
        <div className="home-card kpi-promedio">
          <div className="home-kpi-icon">
            <FaChartLine />
          </div>
          <div className="home-kpi-title">Promedio mensual de ventas</div>
          <div className="home-kpi-value">S/. {promedioVentasMes}</div>
        </div>
        <div className="home-card kpi-mesmax">
          <div className="home-kpi-icon">
            <FaTrophy />
          </div>
          <div className="home-kpi-title">Mes con mayor facturación</div>
          <div className="home-kpi-value">{mesMasVentas}</div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="home-graficos">
        {/* Gráfico de torta por categoría */}
        <div className="home-card-grafico home-card-grafico-torta">
          <h2 className="home-section-title">
            <FaChartPie className="home-title-icon" />
            Categorías más vendidas
          </h2>
          {loadingCategorias && (
            <div className="home-list-empty">📊 Cargando datos de categorías...</div>
          )}
          {errorCategorias && (
            <div className="home-list-empty">❌ Error al cargar categorías</div>
          )}
          {categoriasTorta.length > 0 && !loadingCategorias && !errorCategorias && (
            <div className="home-torta-flex">
              <div className="home-torta-pie">
                <PieChart width={chartSize.width} height={chartSize.height}>
                  <Pie
                    data={categoriasTorta}
                    dataKey="cantidad"
                    nameKey="nombre"
                    cx="50%"
                    cy="50%"
                    outerRadius={chartSize.radius}
                    labelLine={false}
                    stroke="rgba(255,255,255,0.8)"
                    strokeWidth={2}
                  >
                    {categoriasTorta.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
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
                      style={{ background: PIE_COLORS[index % PIE_COLORS.length] }}
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
            <h2 className="home-section-title home-bar-title">
              <FaChartBar className="home-title-icon" />
              Ventas mensuales
            </h2>
          </div>
          <div className="home-grafico-container">
          {loadingVentas && (
            <div className="home-list-empty">📊 Cargando datos de ventas...</div>
          )}
          {errorVentas && (
            <div className="home-list-empty">❌ Error al cargar ventas</div>
          )}
          {!loadingVentas && !errorVentas && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ventasPorMes} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100,116,139,0.2)" />
                <XAxis 
                  dataKey="mes" 
                  className="home-xaxis"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis 
                  className="home-yaxis"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="total" 
                  fill="url(#colorGradient)"
                  radius={[8, 8, 0, 0]}
                >
                  <LabelList
                    dataKey="total"
                    position="top"
                    className="home-bar-label"
                  />
                </Bar>
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="50%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#2fcabd" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
