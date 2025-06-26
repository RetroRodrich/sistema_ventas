import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../Home';

// =================================================================
// MOCKS (SIMULACIONES)
// =================================================================

/**
 * Mock del módulo de conexión.
 * Evita el error "SyntaxError: Cannot use 'import.meta' outside a module"
 * que ocurre porque Jest no entiende la sintaxis de Vite para variables de entorno.
 */
jest.mock('../../Conexion', () => ({
  API_BASE_URL: 'http://localhost:5000', // URL de ejemplo para las pruebas
}));

global.fetch = jest.fn();

/**
 * Mock de la librería `recharts`.
 * El renderizado de los gráficos es complejo y puede causar errores en el entorno de prueba (JSDOM).
 * Reemplazamos los componentes del gráfico por divs simples para enfocarnos en probar la lógica
 * de nuestro componente `Home`, no la librería de gráficos.
 */
jest.mock('recharts', () => {
  const OriginalRecharts = jest.requireActual('recharts');
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
    BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
    PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
    Bar: () => <div />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    CartesianGrid: () => <div />,
    Tooltip: () => <div />,
    LabelList: () => <div />,
    Pie: ({ children }) => <div>{children}</div>,
    Cell: () => <div />,
  };
});

/**
 * Suite de pruebas para el componente Home.
 * Verifica el renderizado inicial, el manejo de estados (sin datos y con datos)
 * y la correcta visualización de la información obtenida de la API.
 */
describe('Home Component', () => {
  beforeEach(() => {
    // Limpia los mocks antes de cada prueba
    fetch.mockClear();
    // Simular una respuesta exitosa por defecto para las pruebas que no se centran en errores.
    fetch.mockResolvedValue({
      json: () => Promise.resolve([]),
    });
  });

  /**
   * Prueba que el componente renderice correctamente todos los elementos estáticos
   * como títulos y filtros, independientemente de los datos de la API.
   */
  test('debe renderizar los elementos estáticos y los filtros', async () => {
    render(<Home />);

    // Verifica que los títulos y filtros estén presentes
    expect(screen.getByText('Desde:')).toBeInTheDocument();
    expect(screen.getByText('Hasta:')).toBeInTheDocument();
    expect(screen.getByText('Limpiar filtros')).toBeInTheDocument();
    expect(screen.getByText('Monto total vendido')).toBeInTheDocument();
    expect(screen.getByText('Ventas por mes')).toBeInTheDocument();
    expect(screen.getByText('Categoría más vendida')).toBeInTheDocument();

    // Agregamos una espera al final para asegurar que todas las actualizaciones de estado
    // (incluso con datos vacíos) se completen antes de que termine la prueba.
    await screen.findByText('Próximamente...');
  });

  /**
   * Prueba cómo se comporta el componente cuando la API no devuelve datos.
   * Debería mostrar los valores por defecto (0, '-') y el mensaje "Próximamente...".
   */
  test('debe mostrar el estado de "Próximamente..." cuando no hay datos', async () => {
    render(<Home />);

    // Usamos waitFor para esperar un estado que depende de AMBAS llamadas a la API.
    // Esto asegura que ambas promesas se hayan resuelto.
    await waitFor(() => {
      // Hay dos KPIs que muestran "S/. 0" (Total y Promedio) cuando no hay datos.
      // Usamos getAllByText para verificar que ambos estén presentes.
      const kpisConCero = screen.getAllByText('S/. 0');
      expect(kpisConCero.length).toBe(2);

      // El texto "Próximamente..." aparece por la segunda llamada
      expect(screen.getByText('Próximamente...')).toBeInTheDocument();
    });
  });

  /**
   * Prueba el flujo completo: obtener datos simulados de la API y verificar
   * que los KPIs y los gráficos se rendericen con la información correcta.
   */
  test('debe obtener y mostrar los datos de KPIs y gráficos correctamente', async () => {
    // Datos simulados que la API debería devolver
    const mockVentasPorMes = [
      { mes: 'Enero', total: 1500 },
      { mes: 'Febrero', total: 2500 },
    ];
    const mockCategorias = [
      { nombre: 'Electrónica', cantidad: 50 },
      { nombre: 'Ropa', cantidad: 120 },
    ];

    // Configura el mock de fetch para que devuelva los datos simulados
    fetch
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockVentasPorMes) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockCategorias) });

    render(<Home />);

    // Agrupamos TODAS las aserciones que dependen de datos asíncronos dentro de un solo waitFor.
    // La prueba solo tendrá éxito cuando TODOS los elementos esperados estén en el DOM.
    await waitFor(() => {
      // KPIs (dependen de la primera llamada fetch)
      expect(screen.getByText('S/. 4000')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('S/. 2000.00')).toBeInTheDocument();
      expect(screen.getByText('Febrero')).toBeInTheDocument();

      // Gráfico de categorías (depende de la segunda llamada fetch)
      expect(screen.getByText(/Electrónica/)).toBeInTheDocument();
      expect(screen.getByText(/Ropa/)).toBeInTheDocument();
    });

    // Estas aserciones pueden quedar fuera porque no dependen de los datos asíncronos.
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  // =================================================================
  // NUEVAS PRUEBAS PARA AUMENTAR COBERTURA
  // =================================================================

  /**
   * Prueba la interacción del usuario con los filtros de fecha.
   * Cubre los manejadores `onChange` de los inputs.
   */
  test('debe volver a llamar a la API cuando se cambian los filtros de fecha', async () => {
    render(<Home />);
    // Esperar a que se completen las 2 llamadas iniciales.
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    fetch.mockClear();

    // Act: Simular que el usuario escribe en los inputs de fecha.
    const fechaInicioInput = screen.getByLabelText(/Desde:/);
    const fechaFinInput = screen.getByLabelText(/Hasta:/);

    fireEvent.change(fechaInicioInput, { target: { value: '2025-05-01' } });
    fireEvent.change(fechaFinInput, { target: { value: '2025-05-31' } });

    // Assert: Esperar y verificar que fetch fue llamado con los nuevos parámetros de fecha.
    await waitFor(() => {
      // Se espera que se hagan 4 llamadas en total (2 por cada cambio de estado).
      expect(fetch).toHaveBeenCalledTimes(4);
      
      // Verificamos que las últimas llamadas contengan los parámetros correctos.
      // Usamos `toHaveBeenCalledWith` para verificar las llamadas más recientes.
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('start=2025-05-01&end=2025-05-31'));
    });
  });

  /**
   * Prueba la funcionalidad del botón "Limpiar filtros".
   * Cubre el manejador `onClick` del botón.
   */
  test('debe limpiar los filtros y volver a llamar a la API sin parámetros', async () => {
    render(<Home />);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));

    // Act 1: Establecer valores en los filtros.
    const fechaInicioInput = screen.getByLabelText(/Desde:/);
    fireEvent.change(fechaInicioInput, { target: { value: '2025-05-01' } });
    // Esperamos a que se complete la llamada con el filtro
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringContaining('start=2025-05-01')));
    fetch.mockClear(); // Limpiar para la siguiente acción.

    // Act 2: Hacer clic en el botón de limpiar.
    const botonLimpiar = screen.getByText('Limpiar filtros');
    fireEvent.click(botonLimpiar);

    // Assert: Verificar que los inputs están vacíos y que la API se llamó sin parámetros de fecha.
    await waitFor(() => {
      expect(fechaInicioInput.value).toBe('');
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).not.toHaveBeenCalledWith(expect.stringContaining('start='));
    });
  });

  /**
   * Prueba el manejo de errores cuando la API falla.
   * Cubre los bloques `.catch()` en las llamadas fetch.
   */
  test('debe manejar errores de la API y mostrar el estado vacío', async () => {
    // Arrange: Simular que la API devuelve un error.
    fetch.mockRejectedValue(new Error('Error de red'));

    // Act: Renderizar el componente.
    render(<Home />);

    // Assert: Esperar a que el componente se estabilice y verificar que muestra el estado vacío.
    await waitFor(() => {
      // Los KPIs deben mostrar valores por defecto (cero o guion).
      expect(screen.getAllByText('S/. 0').length).toBe(2);
      expect(screen.getByText('-')).toBeInTheDocument(); // Mes con más ventas
      // El mensaje para el gráfico de torta vacío debe estar visible.
      // CORRECCIÓN: El texto correcto es "Próximamente...".
      expect(screen.getByText('Próximamente...')).toBeInTheDocument();
    });
  });
});