import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Products from '../Products';

// =================================================================
// MOCKS Y CONSTANTES
// =================================================================
const API_BASE_URL = 'http://localhost:5000';

jest.mock('../../Conexion', () => ({
  API_BASE_URL: API_BASE_URL,
}));

global.fetch = jest.fn();

jest.mock('../../components/AddProductModal', () => (props) => (
  <div data-testid="add-product-modal">
    <span>{props.product ? `Editando: ${props.product.name}` : 'Agregando producto'}</span>
    <button onClick={props.onClose}>Cerrar</button>
  </div>
));

jest.mock('../../components/DeleteConfirmationModal', () => (props) => (
  <div data-testid="delete-confirmation-modal">
    <button onClick={props.onClose}>Cancelar</button>
    <button onClick={props.onConfirm}>Confirmar</button>
  </div>
));

// =================================================================
// DATOS DE PRUEBA
// =================================================================
const mockProducts = [
  { id: 1, name: 'Laptop Pro', category: 'Electrónica', price: 1500, stock: 10, minStock: 5, image: 'laptop.jpg' },
  { id: 2, name: 'Teclado Gamer', category: 'Accesorios', price: 100, stock: 30, minStock: 10, image: 'teclado.jpg' },
  { id: 3, name: 'Monitor 4K', category: 'Electrónica', price: 800, stock: 15, minStock: 3, image: 'monitor.jpg' },
  { id: 4, name: 'Mouse Inalámbrico', category: 'Accesorios', price: 50, stock: 50, minStock: 15, image: 'mouse.jpg' },
  { id: 5, name: 'Webcam HD', category: 'Accesorios', price: 75, stock: 25, minStock: 5, image: 'webcam.jpg' },
  { id: 6, name: 'Silla Ergonómica', category: 'Oficina', price: 300, stock: 8, minStock: 2, image: 'silla.jpg' },
];
const mockCategories = [
  { id: 1, name: 'Electrónica' },
  { id: 2, name: 'Accesorios' },
  { id: 3, name: 'Oficina' },
];


/**
 * Suite de pruebas para el componente Products.
 */
describe('Products Component', () => {
  beforeEach(() => {
    fetch.mockClear();
    fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProducts) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockCategories) });
  });

  /**
   * Prueba que el componente se renderice y cargue los datos iniciales correctamente.
   */
  test('debe renderizar y mostrar los productos iniciales', async () => {
    render(<Products />);

    // Esperar a que los productos aparezcan en la tabla
    expect(await screen.findByText('Laptop Pro')).toBeInTheDocument();
    expect(screen.getByText('Teclado Gamer')).toBeInTheDocument();
    expect(screen.getByText('Monitor 4K')).toBeInTheDocument();

    // Verificar que el filtro de categorías también se haya cargado.
    // En lugar de buscar un texto repetido, buscamos uno único como "Todas las categorías"
    // y luego usamos `getAllByText` para confirmar que hay múltiples instancias de "Electrónica".
    expect(screen.getByText('Todas las categorías')).toBeInTheDocument();
    
    // CORRECCIÓN: Usar getAllByText para manejar múltiples coincidencias.
    // Esperamos 3 elementos: 1 en el filtro y 2 en la tabla.
    const electronicaElements = screen.getAllByText('Electrónica');
    expect(electronicaElements.length).toBe(3);
  });

  /**
   * Prueba la funcionalidad de búsqueda.
   */
  test('debe filtrar productos al usar la barra de búsqueda', async () => {
    render(<Products />);
    await screen.findByText('Laptop Pro'); // Asegurarse de que los datos iniciales cargaron

    // Act: Simular escritura en la barra de búsqueda
    const searchInput = screen.getByPlaceholderText('Buscar productos...');
    fireEvent.change(searchInput, { target: { value: 'Teclado' } });

    // Assert: Verificar que solo el producto buscado esté visible
    expect(screen.getByText('Teclado Gamer')).toBeInTheDocument();
    expect(screen.queryByText('Laptop Pro')).not.toBeInTheDocument();
  });

  /**
   * Prueba la funcionalidad de filtrado por categoría.
   */
  test('debe filtrar productos al cambiar la categoría', async () => {
    render(<Products />);
    await screen.findByText('Laptop Pro');

    // Act: Cambiar el valor del dropdown de categorías
    const filterDropdown = screen.getByRole('combobox', { name: '' }); // El select no tiene un label explícito
    fireEvent.change(filterDropdown, { target: { value: 'Oficina' } });

    // Assert: Verificar que solo los productos de esa categoría estén visibles
    expect(screen.getByText('Silla Ergonómica')).toBeInTheDocument();
    expect(screen.queryByText('Laptop Pro')).not.toBeInTheDocument();
  });

  /**
   * Prueba que los modales se abran correctamente.
   */
  describe('Manejo de Modales', () => {
    test('debe abrir el modal de agregar producto', async () => {
      render(<Products />);
      await screen.findByText('Laptop Pro');

      // Act: Hacer clic en el botón "Agregar"
      const addButton = screen.getByRole('button', { name: /agregar/i });
      fireEvent.click(addButton);

      // Assert: Verificar que el modal de agregar se haya renderizado
      expect(await screen.findByTestId('add-product-modal')).toBeInTheDocument();
      expect(screen.getByText('Agregando producto')).toBeInTheDocument();
    });

    test('debe abrir el modal de editar con los datos del producto correcto', async () => {
      render(<Products />);
      await screen.findByText('Laptop Pro');

      // Act: Hacer clic en el botón de editar del primer producto
      const editButtons = screen.getAllByRole('button', { name: 'Editar' });
      fireEvent.click(editButtons[0]); // Clic en el botón de "Laptop Pro"

      // Assert: Verificar que el modal se abrió con los datos correctos
      expect(await screen.findByTestId('add-product-modal')).toBeInTheDocument();
      expect(screen.getByText('Editando: Laptop Pro')).toBeInTheDocument();
    });

    test('debe abrir el modal de confirmación de eliminación', async () => {
      render(<Products />);
      await screen.findByText('Laptop Pro');

      // Act: Hacer clic en el botón de eliminar
      const deleteButtons = screen.getAllByRole('button', { name: 'Eliminar' });
      fireEvent.click(deleteButtons[0]);

      // Assert: Verificar que el modal de confirmación se haya renderizado
      expect(await screen.findByTestId('delete-confirmation-modal')).toBeInTheDocument();
    });
  });

  // =================================================================
  // NUEVAS PRUEBAS PARA AMPLIAR COBERTURA
  // =================================================================

  describe('Paginación y Casos Borde', () => {
    test('debe cambiar de página y mostrar los productos correctos', async () => {
      render(<Products />);
      await screen.findByText('Laptop Pro'); // Esperar carga inicial

      // Assert: Verificar estado inicial (Página 1 de 2, con 5 items por página)
      expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();
      expect(screen.getByText('Webcam HD')).toBeInTheDocument(); // Último item de la pág 1
      expect(screen.queryByText('Silla Ergonómica')).not.toBeInTheDocument(); // Item de la pág 2

      // Act: Hacer clic en el botón "Siguiente"
      const paginationBar = screen.getByText('Página 1 de 2').parentElement;
      const nextButton = paginationBar.querySelectorAll('button')[1];
      fireEvent.click(nextButton);

      // Assert: Verificar estado de la página 2
      expect(await screen.findByText('Página 2 de 2')).toBeInTheDocument();
      expect(screen.getByText('Silla Ergonómica')).toBeInTheDocument(); // Ahora visible
      expect(screen.queryByText('Laptop Pro')).not.toBeInTheDocument(); // Ya no visible
    });

    test('debe mostrar un mensaje cuando la búsqueda no encuentra resultados', async () => {
      render(<Products />);
      await screen.findByText('Laptop Pro');

      // Act: Realizar una búsqueda sin resultados
      const searchInput = screen.getByPlaceholderText('Buscar productos...');
      fireEvent.change(searchInput, { target: { value: 'Producto Inexistente' } });

      // Assert: Verificar que se muestra el mensaje correcto
      expect(await screen.findByText('No hay productos')).toBeInTheDocument();
      expect(screen.getByText('Sin páginas')).toBeInTheDocument();
    });
  });

  describe('Interacciones con la API', () => {
    test('debe eliminar un producto de la lista al confirmar la eliminación', async () => {
      // La configuración de fetch del beforeEach es suficiente para las llamadas GET.
      // Ahora simulamos la respuesta para la llamada DELETE.
      fetch.mockResolvedValueOnce({ ok: true });

      render(<Products />);
      await screen.findByText('Laptop Pro');

      // Act 1: Abrir el modal de eliminación
      const deleteButton = screen.getAllByRole('button', { name: 'Eliminar' })[0]; // Botón de "Laptop Pro"
      fireEvent.click(deleteButton);
      
      // Act 2: Confirmar la eliminación
      const confirmButton = await screen.findByRole('button', { name: 'Confirmar' });
      fireEvent.click(confirmButton);

      // Assert: Verificar que el producto ya no está en la lista
      await waitFor(() => {
        expect(screen.queryByText('Laptop Pro')).not.toBeInTheDocument();
      });

      // CORRECCIÓN: Usar la constante API_BASE_URL definida en el archivo de prueba.
      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/products/1`,
        { method: 'DELETE' }
      );
    });

    test('debe manejar un error al cargar los productos iniciales', async () => {
      // ===== CORRECCIÓN AQUÍ =====
      // Se espía y silencia console.error para evitar el log en la salida de la prueba.
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      fetch.mockReset();
      fetch
        .mockRejectedValueOnce(new Error('Error de red'))
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });

      render(<Products />);

      expect(await screen.findByText('No hay productos')).toBeInTheDocument();
      
      // Se restaura la función original de console.error.
      consoleErrorSpy.mockRestore();
    });
  });
});