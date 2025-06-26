import { TextEncoder, TextDecoder } from 'util';

// Añade TextEncoder y TextDecoder al objeto global para que Jest y JSDOM los reconozcan.
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Login from '../Login';

// Mock del módulo de conexión para usar una URL base en las pruebas.
jest.mock('../../Conexion', () => ({
  API_BASE_URL: 'http://localhost:5000',
}));

// Mock de la función `fetch` global para simular las respuestas de la API.
global.fetch = jest.fn();

// Mock del hook `useNavigate` de react-router-dom para verificar la navegación.
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'), // Mantiene las funcionalidades originales como <Link>
  useNavigate: () => mockedNavigate,      // Reemplaza useNavigate con nuestro mock
}));

// Mock de localStorage para verificar que el token y el usuario se guarden.
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: key => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

/**
 * Suite de pruebas para el componente Login.
 */
describe('Login Component', () => {
  // Limpiar mocks antes de cada prueba para asegurar que no interfieran entre sí.
  beforeEach(() => {
    fetch.mockClear();
    mockedNavigate.mockClear();
    localStorage.clear();
    jest.spyOn(localStorage, 'setItem'); // Espiar el método setItem
  });

  /**
   * PRUEBA 1: Renderizado inicial
   * Verifica que todos los elementos visuales esperados aparezcan en la pantalla
   * cuando el componente se carga por primera vez.
   */
  test('debe renderizar el formulario de inicio de sesión correctamente', () => {
    // Arrange: Preparamos el entorno para la prueba.
    // `render` dibuja el componente en el entorno de prueba.
    // Envolvemos Login en `<MemoryRouter>` porque usa el hook `useNavigate`
    // de react-router-dom, que necesita un contexto de Router para funcionar.
    render(<Login />, { wrapper: MemoryRouter });

    // Act & Assert: Buscamos los elementos y verificamos que existan.
    // `screen` nos da acceso al DOM renderizado. `getBy...` busca un elemento;
    // si no lo encuentra, la prueba falla automáticamente.
    expect(screen.getByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Correo')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument();
    expect(screen.getByText(/¿No tienes cuenta?/i)).toBeInTheDocument();
  });

  /**
   * Prueba el flujo de un inicio de sesión exitoso.
   */
  test('debe iniciar sesión exitosamente y redirigir al home', async () => {
    const mockUser = { id: 1, name: 'Rodrigo Quiroz', role: 'admin' };
    const mockToken = 'fake-jwt-token';
    const onLoginMock = jest.fn(); // Mock para la función onLogin

    // Arrange: Simular una respuesta exitosa de la API.
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ token: mockToken, user: mockUser }),
    });

    render(<Login onLogin={onLoginMock} />, { wrapper: MemoryRouter });

    // Act: Simular que el usuario llena el formulario y lo envía.
    fireEvent.change(screen.getByPlaceholderText('Correo'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    // Assert: Esperar y verificar que se realizaron las acciones correctas.
    await waitFor(() => {
      // Verificar que se guardó el token y el usuario en localStorage.
      expect(localStorage.setItem).toHaveBeenCalledWith('token', mockToken);
      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
      // Verificar que se llamó a la función onLogin.
      expect(onLoginMock).toHaveBeenCalledTimes(1);
      // Verificar que se intentó redirigir al usuario a la página principal.
      expect(mockedNavigate).toHaveBeenCalledWith('/');
    });
  });

  /**
   * Prueba que se muestre un mensaje de error cuando las credenciales son incorrectas.
   */
  test('debe mostrar un mensaje de error con credenciales incorrectas', async () => {
    const errorMessage = 'Contraseña incorrecta';
    // Arrange: Simular una respuesta de error (401) de la API.
    fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: errorMessage }),
    });

    render(<Login />, { wrapper: MemoryRouter });

    // Act: Simular el envío del formulario.
    fireEvent.change(screen.getByPlaceholderText('Correo'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    // Assert: Verificar que el mensaje de error se muestra en la pantalla.
    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    expect(mockedNavigate).not.toHaveBeenCalled();
  });

  /**
   * Prueba que se muestre un mensaje de error genérico si falla la conexión.
   */
  test('debe mostrar un mensaje de error de conexión si la API falla', async () => {
    // Arrange: Simular un rechazo de la promesa de fetch (error de red).
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<Login />, { wrapper: MemoryRouter });

    // Act: Simular que el usuario llena los campos (para que el formulario sea válido)
    // y luego hace clic en el botón de ingresar.
    fireEvent.change(screen.getByPlaceholderText('Correo'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    // Assert: Verificar que se muestra el mensaje de error de conexión.
    expect(await screen.findByText('Error de conexión')).toBeInTheDocument();
  });

  /**
   * Prueba la funcionalidad de mostrar y ocultar la contraseña.
   */
  test('debe cambiar la visibilidad de la contraseña al hacer clic en el ícono del ojo', () => {
    render(<Login />, { wrapper: MemoryRouter });

    const passwordInput = screen.getByPlaceholderText('Contraseña');
    const toggleButton = screen.getByRole('button', { name: '' }); // El botón no tiene texto

    // Estado inicial: la contraseña está oculta.
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Primer clic: la contraseña se muestra.
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    // Segundo clic: la contraseña se oculta de nuevo.
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});