import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../Conexion';
import '../styles/Register.css';
import { HiOutlineShoppingCart } from 'react-icons/hi';

/**
 * Register - Página de registro de nuevos usuarios.
 * Permite crear una cuenta con nombre, correo, contraseña y rol.
 *
 * Props:
 * - onRegister: función opcional que se ejecuta tras el registro exitoso.
 */
function Register({ onRegister }) {
  // Estado del formulario
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee'
  });
  // Estado para mostrar errores
  const [error, setError] = useState('');
  // Hook de navegación
  const navigate = useNavigate();

  /**
   * Actualiza el estado del formulario al escribir en los campos.
   */
  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /**
   * Envía el formulario al backend para registrar el usuario.
   * Si es exitoso, guarda el token y usuario en localStorage y redirige al home.
   */
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onRegister && onRegister();
        navigate('/');
      } else {
        setError(data.message || 'Error al registrar');
      }
    } catch {
      setError('Error de conexión');
    }
  };

  // Renderizado del formulario de registro
  return (
    <div className="register-bg">
      <div className="register-card">
        <div className="register-icon">
          <HiOutlineShoppingCart />
        </div>
        <h2>Crear Cuenta</h2>
        <form className="register-form" onSubmit={handleSubmit}>
          {error && <div className="register-error">{error}</div>}
          <input
            type="text"
            name="name"
            placeholder="Nombre completo"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Correo electrónico"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={handleChange}
            required
          />
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            required
          >
            <option value="employee">Empleado</option>
            <option value="admin">Administrador</option>
          </select>
          <button type="submit" className="register-btn">Registrarme</button>
        </form>
        <p className="register-link">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;