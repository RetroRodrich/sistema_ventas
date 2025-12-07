import React, { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import socket from '../components/socket';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
  CartesianGrid, LabelList, PieChart, Pie, Cell, Tooltip
} from 'recharts';
import { 
  FiShoppingCart,
  FiDollarSign, 
  FiCalendar, 
  FiTrendingUp, 
  FiAward,
  FiPieChart,
  FiBarChart2,
  FiFilter,
  FiInfo,
  FiAlertTriangle,
  FiCheckCircle,
  FiTarget,
  FiActivity
} from 'react-icons/fi';
import { API_BASE_URL } from '../Conexion';
import '../styles/Home.css';

// ============================================================================
// CONFIGURACIÓN DE COLORES Y CONSTANTES
// ============================================================================

/**
 * Paleta de colores para gráficos de barras - Tonos Pet World
 */
const COLORS = [
  '#FF8C42', '#005842', '#FFA366', '#00704D', '#FF7A29',
  '#008F5C', '#FFB088', '#00A575', '#FF6610', '#00C890',
  '#FFD4B8', '#005030', '#FF9F5E', '#007A50', '#FFBB92'
];

/**
 * Paleta de colores para gráfico de torta - Colores Pet World profesionales
 */
const PIE_COLORS = [
  '#FF8C42', '#005842', '#FFA366', '#00704D', '#FF7A29',
  '#008F5C', '#FFB088', '#00A575', '#FF6610', '#00C890'
];

// ============================================================================
// COMPONENTE PRINCIPAL DEL DASHBOARD
// ============================================================================

/**
 * Home - Dashboard principal del minimarket
 * 
 * CARACTERÍSTICAS PRINCIPALES:
 * - 📊 KPIs en tiempo real con WebSocket
 * - 🎯 Proyección de ventas basada en histórico
 * - 📈 Gráficos interactivos y responsivos
 * - 🔄 Cacheo inteligente con React Query
 * - 🎨 Interfaz moderna y mobile-first
 * 
 * DATOS MOSTRADOS:
 * - Ventas del día actual
 * - Análisis mensual con proyecciones
 * - Top categorías más vendidas
 * - Comparación ventas reales vs proyección
 */
function Home() {
  // ============================================================================
  // ESTADO DEL COMPONENTE
  // ============================================================================
  
  /**
   * Estados para filtros de fecha y responsive design
   */
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [chartSize, setChartSize] = useState({ width: 200, height: 200, radius: 80 });

  /**
   * Cliente de React Query para invalidar cache
   */
  const queryClient = useQueryClient();

  // ============================================================================
  // GESTIÓN DE DATOS CON REACT QUERY (CLAVE PARA COMPARTIR)
  // ============================================================================

  /**
   * 🔥 FETCH DE VENTAS MENSUALES CON PROYECCIONES INTEGRADAS
   * 
   * Esta query obtiene:
   * - Ventas reales por mes
   * - Proyecciones basadas en histórico calculadas en el backend
   * - Filtrado por fechas
   * - Cache inteligente (5 min stale, 30 min cache)
   */
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
      if (!res.ok) throw new Error('Error al cargar ventas');
      return await res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    cacheTime: 1000 * 60 * 30, // 30 minutos
    refetchOnWindowFocus: false,
  });

  /**
   * 🔥 FETCH DE TOP CATEGORÍAS PARA GRÁFICO DE TORTA
   * 
   * Obtiene las categorías más vendidas con optimización:
   * - Manejo inteligente de parámetros de fecha
   * - Usa día actual si no se especifican fechas
   * - Refetch automático al cambiar ventana
   */
  const {
    data: categoriasTorta = [],
    isLoading: loadingCategorias,
    isError: errorCategorias,
  } = useQuery({
    queryKey: ['categoriasTorta', fechaInicio, fechaFin],
    queryFn: async () => {
      let url = `${API_BASE_URL}/api/dashboard/top-categorias`;
      
      // Construir parámetros de fecha solo si se especifican
      if (fechaInicio || fechaFin) {
        const params = new URLSearchParams();
        if (fechaInicio) params.append('start', fechaInicio);
        if (fechaFin) params.append('end', fechaFin);
        url += `?${params.toString()}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error al cargar categorías');
      return await res.json();
    },
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
    refetchOnWindowFocus: true,
  });

  /**
   * 🔥 FETCH DE VENTAS DEL DÍA ACTUAL (TIEMPO REAL)
   * 
   * KPI principal del dashboard:
   * - Se actualiza cada 5 minutos automáticamente
   * - Usa fecha local (no UTC)
   * - Incluye ticket promedio y cantidad de productos
   */
  const {
    data: ventasHoy = { total: 0, cantidad: 0, ticketPromedio: 0 },
    isLoading: loadingVentasHoy,
    isError: errorVentasHoy,
  } = useQuery({
    queryKey: ['ventasHoy'],
    queryFn: async () => {
      // Usar fecha local para evitar problemas de zona horaria
      const today = new Date();
      const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
      const todayString = localDate.toISOString().split('T')[0];
      const url = `${API_BASE_URL}/api/dashboard/summary?start=${todayString}&end=${todayString}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      const data = await res.json();
      
      // Procesar respuesta
      if (data.length > 0) {
        return {
          total: data[0].total,
          cantidad: data[0].cantidad_productos,
          ticketPromedio: data[0].ticket_promedio
        };
      }
      return { total: 0, cantidad: 0, ticketPromedio: 0 };
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
    cacheTime: 1000 * 60 * 10, // 10 minutos
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 60 * 5, // Auto-refetch cada 5 minutos
  });

  // ============================================================================
  // SINCRONIZACIÓN EN TIEMPO REAL CON WEBSOCKET (CLAVE PARA COMPARTIR)
  // ============================================================================

  /**
   * 🔥 ESCUCHA EVENTOS DE VENTA EN TIEMPO REAL
   * 
   * Cuando se registra una nueva venta:
   * - El backend emite evento 'venta_actualizada'
   * - Se invalidan todas las queries relacionadas
   * - Los gráficos se actualizan automáticamente
   */
  useEffect(() => {
    const handleVentaActualizada = (data) => {
      console.log('🔄 Nueva venta detectada, actualizando dashboard...', data);
      
      // Invalidar todas las queries de ventas
      queryClient.refetchQueries({ queryKey: ['ventasPorMes'] });
      queryClient.refetchQueries({ queryKey: ['categoriasTorta'] });
      queryClient.refetchQueries({ queryKey: ['ventasHoy'] });
    };
    
    socket.on('venta_actualizada', handleVentaActualizada);
    
    return () => {
      socket.off('venta_actualizada', handleVentaActualizada);
    };
  }, [queryClient]);

  // ============================================================================
  // CÁLCULOS DE KPIS Y ESTADÍSTICAS (CLAVE PARA COMPARTIR)
  // ============================================================================

  /**
   * 🔥 CÁLCULO DE INDICADORES PRINCIPALES
   */
  const totalVentas = ventasPorMes.reduce((acc, v) => acc + (v.total || 0), 0);
  const cantidadMeses = Array.isArray(ventasPorMes) ? ventasPorMes.length : 0;
  const promedioVentasMes = cantidadMeses > 0 ? (totalVentas / cantidadMeses).toFixed(2) : 0;
  const mesMasVentas = ventasPorMes.length > 0
    ? ventasPorMes.reduce((max, v) => v.total > max.total ? v : max, ventasPorMes[0]).mes
    : '-';

  /**
   * 🔥 ANÁLISIS DE PREDICCIONES VS VENTAS REALES
   * 
   * Compara el último mes con predicción disponible:
   * - Calcula diferencia y porcentaje de cumplimiento
   * - Determina estado (superado/exacto/pendiente)
   * - Usado para mostrar estadísticas detalladas
   */
  const mesActual = ventasPorMes.length > 0 ? ventasPorMes[ventasPorMes.length - 1] : null;
  const estadisticasActuales = mesActual ? {
    mes: mesActual.mes,
    ventasReales: mesActual.total,
    prediccion: mesActual.prediccion,
    diferencia: mesActual.total - mesActual.prediccion,
    porcentajeCumplimiento: mesActual.prediccion > 0 ? ((mesActual.total / mesActual.prediccion) * 100).toFixed(1) : 0,
    estado: mesActual.total > mesActual.prediccion ? 'superado' : 
            mesActual.total === mesActual.prediccion ? 'exacto' : 'pendiente'
  } : null;

  /**
   * 🔥 CÁLCULO DE PORCENTAJES PARA GRÁFICO DE TORTA
   */
  const totalCategorias = categoriasTorta.reduce((acc, cat) => acc + cat.cantidad, 0);
  const categoriasConPorcentaje = categoriasTorta.map(cat => ({
    ...cat,
    porcentaje: totalCategorias > 0 ? ((cat.cantidad / totalCategorias) * 100).toFixed(1) : 0
  }));

  // ============================================================================
  // COMPONENTE PERSONALIZADO PARA ETIQUETAS DE GRÁFICOS (CLAVE PARA COMPARTIR)
  // ============================================================================

  /**
   * 🔥 ETIQUETAS RESPONSIVAS PARA GRÁFICOS DE BARRAS
   * 
   * Características:
   * - Ajuste automático según tamaño de pantalla
   * - Oculta etiquetas en barras muy pequeñas
   * - Diferente estilo para predicciones vs ventas reales
   * - Números formateados con separadores de miles
   */
  const BarLabel = ({ value, x, y, width, height, dataKey }) => {
    if (!value || value === 0) return null;
    
    const screenWidth = window.innerWidth;
    
    // Ocultar etiquetas si la barra es muy pequeña
    if (height < 25 || width < 20) return null;
    if (screenWidth <= 480 && (height < 40 || width < 25)) return null;
    
    const formattedValue = parseFloat(value).toLocaleString();
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    
    // Ajustar tamaño de fuente según contexto
    let fontSize = 9;
    if (screenWidth <= 480) {
      fontSize = 7;
    } else if (screenWidth <= 768) {
      fontSize = 8;
    } else if (width < 30) {
      fontSize = 7;
    } else if (width < 50) {
      fontSize = 8;
    }
    
    // Estilo diferente para predicciones
    if (dataKey === 'prediccion') {
      fontSize = Math.max(fontSize - 1, 6);
    }
    
    return (
      <text
        x={centerX}
        y={centerY}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#ffffff"
        fontSize={fontSize}
        fontWeight="bold"
        style={{
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)',
          filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.8))'
        }}
      >
        {formattedValue}
      </text>
    );
  };

  // ============================================================================
  // RESPONSIVE DESIGN - AJUSTE AUTOMÁTICO DE GRÁFICOS
  // ============================================================================

  /**
   * 🔥 AJUSTE AUTOMÁTICO DE TAMAÑO DE GRÁFICOS
   * 
   * Optimización para diferentes dispositivos:
   * - Mobile: gráficos más pequeños
   * - Tablet: tamaño medio
   * - Desktop: tamaño completo
   * - Debounce para evitar renders excesivos
   */
  useEffect(() => {
    let timeout;
    const updateChartSize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const width = window.innerWidth;
        if (width >= 1600) {
          setChartSize({ width: 220, height: 220, radius: 90 });
        } else if (width <= 480) {
          setChartSize({ width: 160, height: 160, radius: 65 });
        } else if (width <= 768) {
          setChartSize({ width: 180, height: 180, radius: 75 });
        } else {
          setChartSize({ width: 200, height: 200, radius: 80 });
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

  // ============================================================================
  // RENDER DEL COMPONENTE
  // ============================================================================

  return (
    <div className="home-bg">
      {/* FILTROS DE FECHA */}
      <div className="home-filtros">
        <div className="home-filtros-icon">
          <FiFilter />
        </div>
        <label>
          Desde:
          <input
            type="date"
            value={fechaInicio}
            onChange={e => setFechaInicio(e.target.value)}
          />
        </label>
        <label>
          Hasta:
          <input
            type="date"
            value={fechaFin}
            onChange={e => setFechaFin(e.target.value)}
          />
        </label>
        <button
          className="home-btn-limpiar"
          onClick={() => { setFechaInicio(''); setFechaFin(''); }}
        >
          Limpiar filtros
        </button>
      </div>

      {/* ============================================================================
          SECCIÓN DE KPIS PRINCIPALES
          ============================================================================ */}
      <div className="home-kpis">
        {/* KPI: VENTAS DEL DÍA */}
        <div className="home-kpi-card">
          <div className="home-kpi-header">
            <div className="home-kpi-title">Ventas de Hoy</div>
            <div className="home-kpi-icon ventas">
              <FiShoppingCart />
            </div>
          </div>
          <div className="home-kpi-value">
            {loadingVentasHoy ? '...' : `S/. ${ventasHoy.total?.toFixed(2) || '0.00'}`}
          </div>
          <div className="home-kpi-subtitle">{ventasHoy.cantidad || 0} transacciones</div>
        </div>

        {/* KPI: MONTO TOTAL */}
        <div className="home-kpi-card">
          <div className="home-kpi-header">
            <div className="home-kpi-title">Monto Total</div>
            <div className="home-kpi-icon monto">
              <FiDollarSign />
            </div>
          </div>
          <div className="home-kpi-value">S/. {totalVentas.toLocaleString()}</div>
        </div>
        
        {/* KPI: MESES ANALIZADOS */}
        <div className="home-kpi-card">
          <div className="home-kpi-header">
            <div className="home-kpi-title">Meses Analizados</div>
            <div className="home-kpi-icon meses">
              <FiCalendar />
            </div>
          </div>
          <div className="home-kpi-value">{cantidadMeses}</div>
        </div>
        
        {/* KPI: PROMEDIO MENSUAL */}
        <div className="home-kpi-card">
          <div className="home-kpi-header">
            <div className="home-kpi-title">Promedio Mensual</div>
            <div className="home-kpi-icon promedio">
              <FiTrendingUp />
            </div>
          </div>
          <div className="home-kpi-value">S/. {promedioVentasMes}</div>
        </div>
        
        {/* KPI: MEJOR MES */}
        <div className="home-kpi-card">
          <div className="home-kpi-header">
            <div className="home-kpi-title">Mejor Mes</div>
            <div className="home-kpi-icon mejor-mes">
              <FiAward />
            </div>
          </div>
          <div className="home-kpi-value">{mesMasVentas}</div>
        </div>
      </div>

      {/* ============================================================================
          SECCIÓN DE GRÁFICOS
          ============================================================================ */}
      <div className="home-graficos">
        
        {/* GRÁFICO DE TORTA - CATEGORÍAS */}
        <div className="home-card-grafico home-card-grafico-torta">
          <h2 className="home-section-title">
            <FiPieChart className="home-title-icon" />
            Categorías más vendidas
          </h2>
          
          {/* Estados de carga */}
          {loadingCategorias && (
            <div className="home-list-empty"><FiInfo /> Cargando categorías...</div>
          )}
          {errorCategorias && (
            <div className="home-list-empty"><FiAlertTriangle /> Error al cargar</div>
          )}
          
          {/* Gráfico de torta con leyenda */}
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
                </PieChart>
              </div>
              
              {/* Leyenda con porcentajes */}
              <div className="home-torta-lista">
                {categoriasConPorcentaje.map((entry, index) => (
                  <div key={entry.nombre} className="home-torta-legend-item">
                    <span
                      className="home-torta-legend-dot"
                      style={{ background: PIE_COLORS[index % PIE_COLORS.length] }}
                    ></span>
                    <span className="home-torta-legend-text">
                      {entry.nombre}: <b>{entry.cantidad}</b> ({entry.porcentaje}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* GRÁFICO DE BARRAS - VENTAS MENSUALES */}
        <div className="home-card-grafico home-card-grafico-mes">
          <div className="home-bar-title-container">
            <h2 className="home-section-title home-bar-title">
              <FiBarChart2 className="home-title-icon" />
              Ventas mensuales
            </h2>
            
            {/* Leyenda del gráfico */}
            <div className="home-bar-legend">
              <div className="home-bar-legend-item">
                <span className="home-bar-legend-dot" style={{ background: '#FF8C42' }}></span>
                <span className="home-bar-legend-text">Ventas Reales</span>
              </div>
              <div className="home-bar-legend-item">
                <span className="home-bar-legend-dot" style={{ background: '#005842' }}></span>
                <span className="home-bar-legend-text">Proyección</span>
              </div>
            </div>
          </div>

          {estadisticasActuales && estadisticasActuales.prediccion > 0 && (
            <div className="home-bar-stats">
              <div className="home-bar-stats-header">
                <FiActivity /> <strong>Análisis: {estadisticasActuales.mes}</strong>
              </div>
              <div className="home-bar-stats-grid">
                <div className="home-bar-stat-item">
                  <span className="home-bar-stat-label"><FiDollarSign /> Ventas:</span>
                  <span className="home-bar-stat-value">S/. {estadisticasActuales.ventasReales.toLocaleString()}</span>
                </div>
                <div className="home-bar-stat-item">
                  <span className="home-bar-stat-label"><FiTarget /> Proyección:</span>
                  <span className="home-bar-stat-value">S/. {estadisticasActuales.prediccion.toLocaleString()}</span>
                </div>
                <div className="home-bar-stat-item">
                  <span className="home-bar-stat-label"><FiTrendingUp /> Diferencia:</span>
                  <span className="home-bar-stat-value" style={{ color: estadisticasActuales.diferencia >= 0 ? '#059669' : '#DC2626' }}>
                    {estadisticasActuales.diferencia >= 0 ? '+' : ''}S/. {estadisticasActuales.diferencia.toLocaleString()}
                  </span>
                </div>
                <div className="home-bar-stat-item">
                  <span className="home-bar-stat-label"><FiCheckCircle /> Estado:</span>
                  <span className={`home-bar-stat-status home-bar-stat-status-${estadisticasActuales.estado}`}>
                    {estadisticasActuales.estado === 'superado' ? 'Meta superada' : 
                     estadisticasActuales.estado === 'exacto' ? 'Proyección exacta' : 
                     `${estadisticasActuales.porcentajeCumplimiento}% de la meta`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* GRÁFICO DE BARRAS */}
          <div className="home-grafico-barras-container">
            {loadingVentas && (
              <div className="home-list-empty"><FiInfo /> Cargando ventas...</div>
            )}
            {errorVentas && (
              <div className="home-list-empty"><FiAlertTriangle /> Error al cargar</div>
            )}
            {!loadingVentas && !errorVentas && (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart 
                  data={ventasPorMes} 
                  barSize={(() => {
                    const screenWidth = window.innerWidth;
                    const dataLength = ventasPorMes.length;
                    
                    // Cálculo dinámico del tamaño de barras
                    if (screenWidth <= 480) {
                      return Math.min(50, Math.max(15, 300 / dataLength));
                    } else if (screenWidth <= 768) {
                      return Math.min(55, Math.max(18, 350 / dataLength));
                    } else {
                      return Math.min(60, Math.max(20, 400 / dataLength));
                    }
                  })()}
                  margin={(() => {
                    const screenWidth = window.innerWidth;
                    if (screenWidth <= 480) {
                      return { top: 20, right: 20, left: 20, bottom: 15 };
                    } else if (screenWidth <= 768) {
                      return { top: 25, right: 30, left: 30, bottom: 15 };
                    } else {
                      return { top: 30, right: 40, left: 40, bottom: 20 };
                    }
                  })()}
                >
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
                  
                  {/* Barra de ventas reales */}
                  <Bar 
                    dataKey="total" 
                    fill="url(#colorGradient)"
                    radius={[8, 8, 0, 0]}
                  >
                    <LabelList
                      dataKey="total"
                      content={<BarLabel />}
                    />
                  </Bar>
                  
                  {/* Barra de predicción */}
                  <Bar 
                    dataKey="prediccion" 
                    fill="url(#colorGradientPrediccion)"
                    radius={[8, 8, 0, 0]}
                    opacity={0.7}
                  >
                    <LabelList
                      dataKey="prediccion"
                      content={<BarLabel />}
                    />
                  </Bar>
                  
                  {/* Gradientes personalizados */}
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="50%" stopColor="#0ea5e9" />
                      <stop offset="100%" stopColor="#2fcabd" />
                    </linearGradient>
                    <linearGradient id="colorGradientPrediccion" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="50%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#fb923c" />
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
